/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCApp.cpp
 *-----------------------------------------------------------
 */

#include "CCDefines.h"
#include "CCAppManager.h"
#include "CCFileManager.h"


#ifdef IOS
static CCText PackagedJSFile = "_ios.html";
#elif defined ANDROID
static CCText PackagedJSFile = "_android.html";
#elif defined WP8
static CCText PackagedJSFile = "..\\_wp8.html";
#endif


//const char *_MULTISERVER_DEBUG_URL = "http://localhost/projects/multiplay.io/";
const char *_MULTISERVER_DEBUG_URL = "http://192.168.1.89/projects/multiplay.io/";
//const char *_MULTISERVER_DEBUG_URL = "http://10.128.59.12/projects/multiplay.io/";
#ifdef MULTI_DEBUG_LOCALSERVER
const char *_MULTISERVER_URL = _MULTISERVER_DEBUG_URL;
#else
const char *_MULTISERVER_URL = "http://playitor.com/";
#endif

#ifdef PHONEWARS
CCText CLIENT_ID = "androids";
const int APPLE_ID = 536786108;
#elif FOODFIGHTERS
CCText CLIENT_ID = "burgers";
const int APPLE_ID = 543797009;
#elif TANKLEGENDS
CCText CLIENT_ID = "tanks";
const int APPLE_ID = 554850461;
#elif WORLDOFFIGHTERS
CCText CLIENT_ID = "205";
const int APPLE_ID = 659871834;
#else
CCText CLIENT_ID = "multi";
const int APPLE_ID = 602607720;
#endif


CCAppEngine::CCAppEngine()
{
    jsEngine = NULL;

    // Link webjs inputs
    CCLAMBDA_NEW_TYPE( registeredWebJSLoadedCallback, CCTextCallback, CCAppEngine, this, webJSLoaded( text ) );
    CCAppManager::WebJSLoadedCallbacks.add( registeredWebJSLoadedCallback );
    CCLAMBDA_NEW_TYPE( registeredWebJSJavaScriptCallback, CCTextCallback, CCAppEngine, this, webJSJavaScriptResult( text ) );
    CCAppManager::WebJSJavaScriptCallbacks.add( registeredWebJSJavaScriptCallback );

    CCLAMBDA_NEW_TYPE( registeredWebViewLoadedCallback, CCTextCallback, CCAppEngine, this, webViewLoaded( text ) );
    CCAppManager::WebViewLoadedCallbacks.add( registeredWebViewLoadedCallback );

    CCLAMBDA_NEW_TYPE( registeredKeyboardUpdateCallback, CCTextCallback, CCAppEngine, this, keyboardUpdate( text ) );
    CCAppManager::KeyboardUpdateCallbacks.add( registeredKeyboardUpdateCallback );

    resuming = false;

    tryLatestUpdate = true;
    usingLatestUpdate = true;

    urlSchemeUpdated = false;
}


CCAppEngine::~CCAppEngine()
{
    CCAppManager::WebJSLoadedCallbacks.remove( registeredWebJSLoadedCallback );
    delete registeredWebJSLoadedCallback;

    CCAppManager::WebJSJavaScriptCallbacks.remove( registeredWebJSJavaScriptCallback );
    delete registeredWebJSJavaScriptCallback;

    CCAppManager::WebViewLoadedCallbacks.remove( registeredWebViewLoadedCallback );
    delete registeredWebViewLoadedCallback;

    CCAppManager::KeyboardUpdateCallbacks.remove( registeredKeyboardUpdateCallback );
    delete registeredKeyboardUpdateCallback;

    if( jsEngine != NULL )
    {
        delete jsEngine;
		jsEngine = NULL;
    }
}


bool CCAppEngine::updateNativeThread()
{
    super::updateNativeThread();
	return false;
}


void CCAppEngine::start()
{
//    CCAddFlag( gRenderer->renderFlags, render_collisionBoxes );
//    CCAddFlag( gRenderer->renderFlags, render_collisionTrees );
//    CCAddFlag( gRenderer->renderFlags, render_pathFinder );

#ifdef IOS
    CCAppManager::SetOrientation( 270.0f, false );
#endif

#if defined( ANDROID ) && !defined( NOGOOGLE )
    CCJNI::GoogleServicesRegister();
#endif

    serverConnect();

#if defined PROFILEON
    CCProfiler::open();
#endif
}


void CCAppEngine::updateLoop()
{
	float jsScriptUpdateTime;
    if( resuming )
    {
    	DEBUGLOG( "CCAppEngine::updateLoop()resuming %f\n", time.lifetime );
        CCAppManager::WebJSSetJavaScriptUpdateTime( time.lifetime );
        resuming = false;
    }
    jsScriptUpdateTime = CCAppManager::WebJSGetJavaScriptUpdateTime();

#ifndef MULTI_DEBUG_JS
#ifndef MULTI_DEBUG_JSNORELOAD
    if( CCAppManager::WebJSIsLoaded() )
    {
        // If our js update takes longer than x seconds, it's probably crashed
        const float jsScriptUpdateDelta = time.lifetime - jsScriptUpdateTime;
        if( jsScriptUpdateDelta > 6.0f )
        {
        	DEBUGLOG( "CCAppEngine::updateLoop()restarting %f %f\n", jsScriptUpdateDelta, time.lifetime );

            // If we're on our latest engine, fallback to our original version
            if( usingLatestUpdate )
            {
                tryLatestUpdate = false;
				usingLatestUpdate = false;
            }

            // Reload our last session
            reloadLastJSEngine();
        }
    }
#endif
#endif

    CCNativeThreadLock();
    controls->update( time );
    CCNativeThreadUnlock();
}


void CCAppEngine::renderLoop()
{
    if( jsEngine != NULL )
    {
        jsEngine->runNativeUpdate();

#if defined PROFILEON
        CCProfiler::save();
#endif
    }

#ifdef ANDROID
    else
    {
        usleep( 50 );
        gRenderer->bind();
        gRenderer->clear( true );
//        static CCCameraBase *camera = NULL;
//        if( camera == NULL )
//        {
//            camera = new CCCameraBase();
//            camera->setOffset( CCVector3( 0.0f, 0.0f, 10.0f ) );
//            camera->setupViewport();
//        }
//        camera->setViewport();
//        camera->update();
//        CCRenderer::CCSetBlend( false );
//        CCRenderer::CCSetDepthWrite( true );
//        CCRenderer::CCSetDepthRead( true );
//        CCRenderer::CCSetCulling( false );
//        gRenderer->setShader( "basic" );
//        CCRenderer::CCSetRenderStates( true );
//        gEngine->textureManager->setTextureIndex( 1 );
//        CCRenderSquare( CCVector3( 0.0f ), CCVector3( 10.0f ) );
        gRenderer->resolve();
    }
#endif
}


void CCAppEngine::resize()
{
}


void CCAppEngine::resized()
{
    if( CCAppManager::WebJSIsLoaded() )
    {
        if( jsEngine != NULL )
        {
            jsEngine->resized();
        }
    }
}


bool CCAppEngine::isOrientationSupported(const float angle)
{
    if( angle == 270.0f || angle == 90.0f )
    {
        return true;
    }
    return false;
}


void CCAppEngine::restart()
{
    if( jsEngine != NULL )
    {
        CCLAMBDA_RUN_ENGINETHREAD( gEngine->reloadLastJSEngine(); );
    }
}


void CCAppEngine::urlSchemeUpdate()
{
    urlSchemeUpdated = true;

    restart();
}


void CCAppEngine::pause()
{
    if( jsEngine != NULL )
    {
        jsEngine->pause();
    }

    super::pause();

	DEBUGLOG( "CCAppEngine::pause() %f\n", time.lifetime );
}


void CCAppEngine::resume()
{
    if( jsEngine != NULL )
    {
        jsEngine->resume();
    }

    resuming = true;
    super::resume();

	DEBUGLOG( "CCAppEngine::resume() %f\n", time.lifetime );
}


void CCAppEngine::touchBegin(const int index, const float x, const float y)
{
    if( jsEngine != NULL )
    {
        jsEngine->touchBegin( index, x, y );
    }
}


void CCAppEngine::touchMove(const int index, const float x, const float y)
{
    if( jsEngine != NULL )
    {
        jsEngine->touchMove( index, x, y );
    }
}


void CCAppEngine::touchEnd(const int index)
{
    if( jsEngine != NULL )
    {
        jsEngine->touchEnd( index );
    }
}


void CCAppEngine::touchUpdateMovementThreasholds()
{
    super::touchUpdateMovementThreasholds();

    if( jsEngine != NULL )
    {
        jsEngine->touchSetMovementThreashold();
    }
}


bool CCAppEngine::shouldHandleBackButton()
{
	if( jsEngine != NULL )
	{
		backButtonPressed = jsEngine->shouldHandleBackButton();
	}

	return backButtonPressed || super::shouldHandleBackButton();
}


void CCAppEngine::handleBackButton()
{
	if( jsEngine != NULL )
	{
		if( jsEngine->shouldHandleBackButton() )
		{
			return jsEngine->handleBackButton();
		}
	}

	return super::handleBackButton();
}


void CCAppEngine::textureLoaded(CCTextureHandle &textureHandle)
{
    if( CCAppManager::WebJSIsLoaded() )
    {
        CCAppManager::WebJSRunJavaScript( "if( window.gRenderer ) { gRenderer.pendingRender = true; }", false, false );
    }
}


void CCAppEngine::audioEnded(const char *id, const char *url)
{
	if( CCAppManager::WebJSIsLoaded() && jsEngine != NULL )
	{
        CCText script;
        script = "CCAudioManager.Ended( \"";
        script += id;
        script += "\", \"";
        script += url;
        script += "\" );";

        CCAppManager::WebJSRunJavaScript( script.buffer, false, true );
	}
}


void CCAppEngine::serverConnect()
{
    CCText url;

#ifdef MULTI_DEBUG_JS
    url = _MULTISERVER_DEBUG_URL;
    url += "native/debug.php";
    CCAppManager::WebJSOpen( url.buffer );
    return;
#endif

    reloadLastJSEngine();

    url = _MULTISERVER_URL;
    url += "native/native4.php";

    class CCDownloadedCallback : public CCURLCallback
    {
    public:
        void run()
        {
            // Run the downloaded version
            if( reply->state >= CCURLRequest::succeeded )
            {
                CCText fileData;
                CCFileManager::GetFile( "cache/native.html", fileData, Resource_Cached, false );
                if( fileData.length == 0 )
                {
                    CCFileManager::GetFile( PackagedJSFile.buffer, fileData, Resource_Packaged );
                }
                if( !CCText::Equals( fileData, reply->data.buffer ) )
                {
                    CCFileManager::SaveCachedFile( "cache/native.html", reply->data.buffer, reply->data.length );
                    gEngine->tryLatestUpdate = true;
                    gEngine->usingLatestUpdate = false;

                    if( CCAppManager::WebJSIsLoaded() )
                    {
                        CCAppManager::WebJSRunJavaScript( "CCEngine.UpdateNotification();", false, false );
                    }
                }
            }
        }
    };

    gEngine->urlManager->requestURLAndCacheAfterTimeout( url.buffer,
                                                         new CCDownloadedCallback(),
                                                         0,
                                                         NULL, 0,
                                                         0.0f );
}


void CCAppEngine::webJSLoaded(CCList<CCText> &text)
{
    if( CCAppManager::WebJSIsLoaded() )
    {
		if( jsEngine != NULL )
		{
			delete jsEngine;
			jsEngine = NULL;
		}

#ifdef DEBUGON
        //CLIENT_ID = "testshop";
#endif
//        if( urlSchemeUpdated )
//        {
//            urlSchemeUpdated = false;
            CCText script;
            script = "window.CLIENT_ID = \"";
            script += CLIENT_ID.buffer;
            script += "\";";
            CCAppManager::WebJSRunJavaScript( script.buffer, false, true );
//        }

        CCAudioManager::Reset();
        jsEngine = new CCEngineJS();
        jsEngine->startup();

        // Are we using the latest update
        if( tryLatestUpdate && !usingLatestUpdate )
        {
            CCAppManager::WebJSRunJavaScript( "CCEngine.UpdateNotification();", false, true );
        }
    }
    else
    {
    	reloadLastJSEngine();
    }
}


void CCAppEngine::webJSJavaScriptResult(CCList<CCText> &text)
{
    if( text.length > 0 )
    {
        CCText &result = *text.list[0];
        if( result.length > 0 )
        {
#ifdef DEBUGON
            static int jsTicks = 0;
            jsTicks++;

            static float jsTime = 0.0f;
            if( jsTime+1.0f < time.lifetime )
            {
                jsTime = time.lifetime;
				static CCText debugOutput;
				debugOutput = "JavaScript FPS: ";
				debugOutput += jsTicks;
				debugOutput += "\n";
                DEBUGLOG( debugOutput.buffer );
                jsTicks = 0;
            }
#endif

            CCNativeThreadLock();
            if( jsEngine != NULL )
            {
                jsEngine->registerNextFrameCommands( result.buffer );
            }
            CCNativeThreadUnlock();
        }
    }
}


void CCAppEngine::webViewLoaded(CCList<CCText> &text)
{
    const char *url = text.list[0]->buffer;

    if( jsEngine != NULL )
    {
        jsEngine->webViewUpdate( url );
    }
}


void CCAppEngine::keyboardUpdate(CCList<CCText> &text)
{
    if( text.length > 0 )
    {
        CCText &result = *text.list[0];
        if( result.length > 0 )
        {
            if( jsEngine != NULL )
            {
                jsEngine->keyboardUpdate( result.buffer );
            }
        }
    }
}


void CCAppEngine::reloadLastJSEngine()
{
    DEBUGLOG( "CCAppEngine::reloadLastJSEngine:%f\n", gEngine->time.lifetime );

    if( jsEngine != NULL )
    {
        delete jsEngine;
		jsEngine = NULL;
    }

#ifdef MULTI_DEBUG_JS
		serverConnect();
		return;
#endif

#ifndef MULTI_DEBUG_JSNOUPDATE
    if( !tryLatestUpdate || !CCFileManager::DoesFileExist( "cache/native.html", Resource_Cached  ) )
#endif
    {
        CCText result;
        CCFileManager::GetFile( PackagedJSFile.buffer, result, Resource_Packaged );
        CCFileManager::SaveCachedFile( "cache/native.html",result.buffer, result.length );
    }
#ifndef MULTI_DEBUG_JSNOUPDATE
    else
    {
        usingLatestUpdate = true;
    }
#endif

    CCText filePath;
    CCFileManager::GetFilePath( filePath, "cache/native.html", Resource_Cached );
    CCAppManager::WebJSOpen( filePath.buffer, true );
}
