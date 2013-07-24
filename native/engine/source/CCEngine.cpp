/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCEngine.cpp
 *-----------------------------------------------------------
 */

#include "CCDefines.h"
#include "CCTextureFontPage.h"
#include "CCObjects.h"
#include "CCFileManager.h"

#include "CCDeviceControls.h"
#include "CCDeviceRenderer.h"
#include "CCAppManager.h"

#ifdef IOS
#include <OpenGLES/ES1/gl.h>
#endif

#if defined WP8 || defined WIN8
#include <wrl.h>
#endif


#ifdef IOS
CCText CCEngine::DeviceType = "iOS";
#elif defined ANDROID
CCText CCEngine::DeviceType = "Android";
#elif defined WIN8
CCText CCEngine::DeviceType = "Windows8";
#elif defined WP8
CCText CCEngine::DeviceType = "WindowsPhone";
#elif defined Q_OS_WIN
CCText CCEngine::DeviceType = "Windows";
#elif defined Q_OS_MACX
CCText CCEngine::DeviceType = "Mac";
#elif defined Q_OS_LINUX
CCText CCEngine::DeviceType = "Linux";
#else
CCText CCEngine::DeviceType = "Unknown";
#endif


const double getSystemTime()
{
#ifdef IOS

    const NSTimeInterval currentTime = [NSDate timeIntervalSinceReferenceDate];

#elif defined( QT )

    const double currentTime = gView->timer.elapsed() * 0.001;

#elif defined( ANDROID )

    struct timespec res;
	clock_gettime( CLOCK_REALTIME, &res );
	const double currentTime = res.tv_sec + (double)( ( res.tv_nsec / 1e6 ) * 0.001 );

#elif defined( WP8 ) || defined WIN8

	static LARGE_INTEGER m_frequency, m_currentTime;
	if (!QueryPerformanceFrequency(&m_frequency))
	{
		throw ref new Platform::FailureException();
	}

	if (!QueryPerformanceCounter(&m_currentTime))
	{
		throw ref new Platform::FailureException();
	}

	const double currentTime = static_cast<double>(m_currentTime.QuadPart) / static_cast<double>(m_frequency.QuadPart);

#endif

    return currentTime;
}


CCEngine::CCEngine() :
    collisionManager( 250000.0f )
{
    running = true;
    engineThreadRunning = false;
    paused = false;
    pauseRendering = false;

    renderer = NULL;
    textureManager = NULL;

	fpsLimit = 1/61.0f;

    // Initialise our time lastUpdate value;
    time.lastUpdate = getSystemTime();

    backButtonPressed = false;
}


CCEngine::~CCEngine()
{
    // Run remaining callbacks
    while( nativeThreadCallbacks.length > 0 || engineThreadCallbacks.length > 0 )
    {
        while( nativeThreadCallbacks.length > 0 )
        {
        	CCLambdaCallback *callback = nativeThreadCallbacks.list[0];
        	nativeThreadCallbacks.remove( callback );
        	callback->safeRun();
            delete callback;
        }

        while( engineThreadCallbacks.length > 0 )
        {
        	CCLambdaCallback *callback = engineThreadCallbacks.list[0];
        	engineThreadCallbacks.remove( callback );
        	callback->safeRun();
            delete callback;
        }
    }

    delete urlManager;
	delete textureManager;
	delete controls;
	delete renderer;

	gEngine = NULL;

    CCNativeThreadUnlock();
}


void CCEngine::setupNativeThread()
{
	urlManager = new CCURLManager();
}


static int ZCompare(const void *a, const void *b)
{
    const CCCollideable *objectA = CCOctreeGetVisibleCollideables( *(int*)a );
    const CCCollideable *objectB = CCOctreeGetVisibleCollideables( *(int*)b );
    const int drawOrderA = objectA->getDrawOrder();
    const int drawOrderB = objectB->getDrawOrder();

    if( drawOrderA == 200 || drawOrderB == 200 )
    {
		if( CCCameraBase::CurrentCamera != NULL )
		{
			if( drawOrderA == 200 && drawOrderB == 200 )
			{
				const CCVector3 &cameraPosition = CCCameraBase::CurrentCamera->getRotatedPosition();
				const CCVector3 &positionA = objectA->getConstPosition();
				const CCVector3 &positionB = objectB->getConstPosition();
				const float distanceA = CCVector3Distance( positionA, cameraPosition, true );
				const float distanceB = CCVector3Distance( positionB, cameraPosition, true );

				// If A is smaller than B, swap
				return (int)( distanceB - distanceA );
			}
        }

        // Largest to the back to be drawn last
        return drawOrderA - drawOrderB;
    }

    // Largest to the back to be drawn last
    return drawOrderA - drawOrderB;
}


bool CCEngine::setupEngineThread()
{
    CCCameraBase::SetVisibleSortFunction( &ZCompare );

    const bool rendererSetup = setupRenderer();

    controls = new CCDeviceControls();

    if( rendererSetup )
    {
        start();
    }

    engineThreadRunning = true;
    return rendererSetup;
}


void CCEngine::createRenderer()
{
	if( textureManager != NULL )
    {
        textureManager->unloadAllTextures();
    }

    if( renderer != NULL )
    {
        delete renderer;
    }

    renderer = new CCDeviceRenderer();
}


bool CCEngine::setupRenderer()
{
    if( renderer->setup() )
    {
    	DEBUG_OPENGL();

    	if( textureManager == NULL )
    	{
    		textureManager = new CCTextureManager();

            // Load in a 1x1 white texture to use for untextured draws
            textureManager->assignTextureIndex( "transparent.png", Resource_Packaged, false, true, true );
            textureManager->assignTextureIndex( "white.png", Resource_Packaged, false, true, true );

            DEBUGLOG( "CCEngine::setupRenderer\n" );
            textureManager->setTextureIndex( 1 );
    	}
    	else
    	{
    		textureManager->invalidateAllTextureHandles();
    	}
    	DEBUG_OPENGL();

        renderer->setupOpenGL();
        DEBUG_OPENGL();

        return true;
    }

    return false;
}


void CCEngine::updateTime()
{
    double currentTime = getSystemTime();
    double realTime = ( currentTime - time.lastUpdate );

    // If we're too fast, sleep
	while( realTime < fpsLimit )
	{
        const uint difference = uint( roundf( (float)( fpsLimit - realTime ) * 1000.0f ) + 1 );
		usleep( difference );

		currentTime = getSystemTime();
		realTime = ( currentTime - time.lastUpdate );
	}
    time.real = (float)realTime;

	// Fake 25 fps
    static const float minFPS = 1/15.0f;
	time.delta = MIN( time.real, minFPS );

    time.lastUpdate = currentTime;
}


bool CCEngine::updateNativeThread()
{
    // Run callbacks
	if( nativeThreadCallbacks.length > 0 )
    {
        CCNativeThreadLock();
        for( int i=0; i<nativeThreadCallbacks.length; ++i )
        {
            nativeThreadCallbacks.list[i]->safeRun();
            delete nativeThreadCallbacks.list[i];
        }
        nativeThreadCallbacks.length = 0;
        CCNativeThreadUnlock();
    }

	return false;
}


void CCEngine::updateEngineThread()
{
    // Update our system time
    updateTime();

	time.lifetime += time.real;

#if LOG_FPS
    static uint loggedUpdates = 0;
    static float loggedDelta = 0.0f;
    loggedUpdates++;
    loggedDelta += time.real;
    if( loggedDelta > 1.0f )
    {
#if !defined WP8 && !defined WIN8
        const float averageFPS = 1.0f / ( loggedDelta / loggedUpdates );
        DEBUGLOG( "Average FPS: %f \n", averageFPS );
#endif
        loggedUpdates = 0;
        loggedDelta = 0.0f;
    }
#endif

    if( backButtonPressed )
    {
    	backButtonPressed = false;
    	handleBackButton();
    }

    // Run callbacks
    if( engineThreadCallbacks.length > 0 )
    {
        CCNativeThreadLock();
        CCJobsThreadLock();

        while( engineThreadCallbacks.length > 0 )
        {
            CCLambdaCallback *callback = engineThreadCallbacks.pop();
			if( callback != NULL )
			{
				callback->safeRun();
				delete callback;
			}
        }

        CCNativeThreadUnlock();
        CCJobsThreadUnlock();
    }

    finishJobs();
	updateLoop();

    if( paused == false && pauseRendering == false )
    {
        CCAppManager::UpdateOrientation( time.delta );

        renderLoop();
    }

#if defined DEBUGON && TARGET_IPHONE_SIMULATOR
	// 66 frames a second in debug
	//usleep( 15000 );
	usleep( 0 );
#endif
}


#ifdef WP8
#include <ppl.h>
#include <ppltasks.h>

bool CCEngine::updateJobsThread()
{
    // Run callbacks
    CCJobsThreadLock();

	static bool RUNNING_JOB = false;
	if( jobsThreadCallbacks.length > 0 && !RUNNING_JOB )
    {
		RUNNING_JOB = true;

        CCLambdaCallback *callback = jobsThreadCallbacks.pop();
        CCJobsThreadUnlock();

		auto currentThread = Concurrency::task_continuation_context::use_current();
		Concurrency::create_task([this, callback] {
			
			// Runs on a random thread
			if( callback->isActive() )
			{
				callback->safeRunOnly();
			}

		}).then([this, callback]() {
			
			// Finishes on current thread
			if( callback->isActive() )
			{
				callback->safeFinishOnly();
			}
			delete callback;

			RUNNING_JOB = false;

		}, currentThread ); // schedule this continuation to run in the current context.
    }

	CCJobsThreadUnlock();
    return false;
}

#else

bool CCEngine::updateJobsThread()
{
    // Run callbacks
    CCJobsThreadLock();
	if( jobsThreadCallbacks.length > 0 )
    {
        CCLambdaCallback *callback = jobsThreadCallbacks.pop();
        CCJobsThreadUnlock();
        callback->safeRun();
        delete callback;
        return true;
    }
	CCJobsThreadUnlock();
    return false;
}

#endif


void CCEngine::renderFrameBuffer(const int frameBufferID)
{
    if( renderer->openGL2() == false )
    {
        return;
    }

    if( frameBufferID == -1 )
    {
        return;
    }

    const bool currentBlendState = CCRenderer::CCGetBlendState();
    const bool currentDepthWriteState = CCRenderer::CCGetDepthWriteState();

    // Draw frame buffer

    CCRenderer::CCSetBlend( currentBlendState );
    CCRenderer::CCSetDepthWrite( currentDepthWriteState );
}


void CCEngine::finishJobs()
{
#if defined PROFILEON
    CCProfiler profile( "CCEngine::finishJobs()" );
#endif

    CCFileManager::ReadyIO();

    urlManager->update();

	// Prune the octree
	if( collisionManager.pruneTreesTimer > 0.0f )
	{
		collisionManager.pruneTreesTimer -= time.real;
		if( collisionManager.pruneTreesTimer <= 0.0f )
		{
            //DEBUGLOG( "Octree - prune" );
			CCOctreePruneTree( collisionManager.tree );
		}
	}
}


void CCEngine::restart()
{
    urlManager->flushPendingRequests();

    start();
}


void CCEngine::addCollideable(CCCollideable* collideable)
{
	collisionManager.collideables.add( collideable );
	CCOctreeAddObject( collisionManager.tree, collideable );
}


void CCEngine::removeCollideable(CCCollideable* collideable)
{
    collisionManager.collideables.remove( collideable );
	CCOctreeRemoveObject( collideable );
}


void CCEngine::touchUpdateMovementThreasholds()
{
    CCControls::RefreshTouchMovementThreashold();
}


void CCEngine::resize()
{
}


void CCEngine::resized()
{
}


bool CCEngine::isOrientationSupported(const float angle)
{
    return true;
}


void CCEngine::nextEngineUpdate(CCLambdaCallback *lambdaCallback, const int index)
{
    engineThreadCallbacks.add( lambdaCallback );

    if( index >= 0 )
    {
        engineThreadCallbacks.reinsert( lambdaCallback, index );
    }
}


void CCEngine::engineToNativeThread(CCLambdaCallback *lambdaCallback)
{
    CCNativeThreadLock();
    nativeThreadCallbacks.add( lambdaCallback );
    CCNativeThreadUnlock();
}


void CCEngine::nativeToEngineThread(CCLambdaCallback *lambdaCallback)
{
    CCNativeThreadLock();
    nextEngineUpdate( lambdaCallback, 0 );
    CCNativeThreadUnlock();
}


void CCEngine::engineToJobsThread(CCLambdaCallback *lambdaCallback, const bool pushToFront)
{
    CCJobsThreadLock();
    jobsThreadCallbacks.add( lambdaCallback );
    if( pushToFront )
    {
        jobsThreadCallbacks.reinsert( lambdaCallback, 0 );
    }
    CCJobsThreadUnlock();
}


void CCEngine::jobsToEngineThread(CCLambdaCallback *lambdaCallback)
{
    CCJobsThreadLock();
    engineThreadCallbacks.add( lambdaCallback );
    CCJobsThreadUnlock();
}


void CCEngine::pause()
{
    paused = true;
}


void CCEngine::resume()
{
    paused = false;
}


void CCEngine::touchBegin(const int index, const float x, const float y)
{
}


void CCEngine::touchMove(const int index, const float x, const float y)
{
}


void CCEngine::touchEnd(const int index)
{
}


bool CCEngine::shouldHandleBackButton()
{
    return backButtonPressed;
}


void CCEngine::handleBackButton()
{
}
