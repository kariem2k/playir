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


CCText LAUNCH_APP_ID = "multi";        // The launch app ID
CCText CURRENT_APP_ID = LAUNCH_APP_ID;  // The current running app ID


#if defined WP8
static CCText PackagedJSFile = "..\\_native.html";
#else
static CCText PackagedJSFile = "_native.html";
#endif


const char *_PLAYIR_SERVER_LOCAL_URL = "http://localhost/projects/playir.js/";
//const char *_PLAYIR_SERVER_LOCAL_URL = "http://192.168.1.89/projects/playir.js/";
//const char *_PLAYIR_SERVER_LOCAL_URL = "http://192.168.12.127/projects/playir.js/";
//const char *_PLAYIR_SERVER_LOCAL_URL = "http://192.168.44.93/projects/playir.js/";

#ifdef _PLAYIR_DEBUG_LOCALSERVER
const char *_PLAYIR_SERVER_URL = _PLAYIR_SERVER_LOCAL_URL;
#else
const char *_PLAYIR_SERVER_URL = "http://playir.com/";
#endif

CCText IOS_APP_ID = "602607720";
CCText ANDROID_APP_ID = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsmGpJPX9tZSsGgEk+c8bNSxvTttMszYi6QInekpp1TUNn9IPtvuq+GD0i3l/+UwL6Zvw21bhORIEfpunXelcaLUrpbar1xto8fIxltCPURJmbFa6f699O6nfeSS3Ujvl/C6syUcgHr62uBDsexCkTOuZAr/kTjmwFUlrhIGdkjtw0BqsON+s5od5F0O1hc1StF042mRFl+FB28wF3iomU/m/iWQ/NeNEVjiwaM83u54Z8eyeZk+ZO47BvtdOZj6QcUF5IAvOF20BNPAxatLWWxfSOKaPvWDlEm5vRl4OAlfGRWJRckXWg8VGOUvbbCfHVHrH5OjIq/5/egtL5nazCQIDAQAB";


CCAppEngine::CCAppEngine()
{
	firstRun = true;

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


void CCAppEngine::start()
{
//    CCAddFlag( gRenderer->renderFlags, render_collisionBoxes );
//    CCAddFlag( gRenderer->renderFlags, render_collisionTrees );
//    CCAddFlag( gRenderer->renderFlags, render_pathFinder );

#ifdef IOS
    CCAppManager::SetOrientation( 270.0f, false );
#endif

#if defined( ANDROID ) && !defined( NOGOOGLE )
    CCJNI::GoogleServicesRegister( ANDROID_APP_ID.buffer );
#endif

    serverConnect();

#if defined PROFILEON
    CCProfiler::open();
#endif
}


bool CCAppEngine::updateJobsThread()
{
    cameraRecorder->updateJobsThread();

    super::updateJobsThread();
	return false;
}


void CCAppEngine::updateLoop()
{
	float jsScriptUpdateTime;
    if( resuming )
    {
    	DEBUGLOG( "CCAppEngine::updateLoop() resuming %f\n", time.lifetime );
        CCAppManager::WebJSSetJavaScriptUpdateTime( time.lifetime );
        resuming = false;
    }
    jsScriptUpdateTime = CCAppManager::WebJSGetJavaScriptUpdateTime();

#ifndef _PLAYIR_DEBUG_JS
#ifndef _PLAYIR_DEBUG_JSNORELOAD
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


void CCAppEngine::restartLauncher()
{
    if( jsEngine != NULL )
    {
        CURRENT_APP_ID = "multi";
        CCLAMBDA_RUN_ENGINETHREAD( gEngine->reloadLastJSEngine(); );
    }
}


void CCAppEngine::urlSchemeUpdate()
{
    // Restart client
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
        DEBUGLOG( "CCAppEngine::touchBegin() %i\n", index );
        jsEngine->touchBegin( index, x, y );
    }
}


void CCAppEngine::touchMove(const int index, const float x, const float y)
{
    if( jsEngine != NULL )
    {
        DEBUGLOG( "CCAppEngine::touchMove() %i\n", index );
        jsEngine->touchMove( index, x, y );
    }
}


void CCAppEngine::touchEnd(const int index)
{
    if( jsEngine != NULL )
    {
        DEBUGLOG( "CCAppEngine::touchEnd() %i\n", index );
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
		backButtonActionPending = jsEngine->shouldHandleBackButton();
	}

	if( !backButtonActionPending )
	{
		if( !CCText::Equals( CURRENT_APP_ID, LAUNCH_APP_ID ) )
		{
            CURRENT_APP_ID = LAUNCH_APP_ID;
            CCLAMBDA_RUN_ENGINETHREAD( gEngine->restart(); );
            return true;
		}
	}

	return backButtonActionPending;
}


void CCAppEngine::handleBackButton()
{
	if( jsEngine != NULL )
	{
		if( jsEngine->shouldHandleBackButton() )
		{
            jsEngine->handleBackButton();
		}
	}

    super::handleBackButton();
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
#ifdef _PLAYIR_DEBUG_JS

    CCText url;

#ifdef _PLAYIR_DEBUG_LOCALJS

    url = _PLAYIR_SERVER_LOCAL_URL;
    url += "native/debug.php";
#ifdef _PLAYIR_DEBUG_LOCALSERVER
    url += "?server=";
    url += _PLAYIR_SERVER_URL;
#endif

#else

    url = _PLAYIR_SERVER_URL;
    url += "native/debug.php";

#endif

    CCAppManager::WebJSOpen( url.buffer );
    return;

#endif


#ifndef _PLAYIR_DEBUG_JSNOUPDATE
    if( !CCFileManager::DoesFileExist( "native.html", Resource_Cached  ) )
#endif
    {
        CCText result;
        CCFileManager::GetFile( PackagedJSFile.buffer, result, Resource_Packaged );
        CCFileManager::SaveCachedFile( "native.html", result.buffer, result.length );
    }


    reloadLastJSEngine();

    serverUpdateCheck();
}


void CCAppEngine::serverUpdateCheck()
{
    CCText url = _PLAYIR_SERVER_URL;
    url += "native/nativeversion.php";

    class CCDownloadedCallback : public CCURLCallback
    {
    public:
        void run()
        {
            // Run the downloaded version
            if( reply->state >= CCURLRequest::succeeded )
            {
                CCText fileData;
                CCFileManager::GetFile( "nativeversion.html", fileData, Resource_Cached, false );
                if( !CCText::Equals( fileData, reply->data.buffer ) )
                {
                    gEngine->downloadingVersion = reply->data.buffer;
                    gEngine->serverUpdateDownload();
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


void CCAppEngine::serverUpdateDownload()
{
    CCText url = _PLAYIR_SERVER_URL;
    url += "native/native";
    url += _PLAYER_JSENGINEVERSION;
    url += ".php";

    class CCDownloadedCallback : public CCURLCallback
    {
    public:
        void run()
        {
            // Run the downloaded version
            if( reply->state >= CCURLRequest::succeeded )
            {
                CCFileManager::SaveCachedFile( "nativeversion.html", gEngine->downloadingVersion.buffer, gEngine->downloadingVersion.length );

                CCText fileData;
                CCFileManager::GetFile( "native.html", fileData, Resource_Cached, false );
                if( fileData.length == 0 )
                {
                    CCFileManager::GetFile( PackagedJSFile.buffer, fileData, Resource_Packaged );
                }
                if( !CCText::Equals( fileData, reply->data.buffer ) )
                {
                    CCFileManager::SaveCachedFile( "native.html", reply->data.buffer, reply->data.length );
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

		CCText script;

#ifdef AMAZON
			script = "window.amazon = true;";
			CCAppManager::WebJSRunJavaScript( script.buffer, false, true );
#endif

#ifdef SAMSUNG
			script = "window.samsung = true;";
			CCAppManager::WebJSRunJavaScript( script.buffer, false, true );
#endif

        {
            const float frameBufferWidth = gRenderer->frameBufferManager.getWidth( -1 );
            const float frameBufferHeight = gRenderer->frameBufferManager.getHeight( -1 );
            script = "nativeSetup( \"";
            script += CCEngine::DeviceType.buffer;
            script += "\", ";
            script += frameBufferWidth;
            script += ", ";
            script += frameBufferHeight;
            script += " );";
            CCAppManager::WebJSRunJavaScript( script.buffer, false, true );
        }

        if( CCFileManager::DoesFileExist( "appinfo.json", Resource_Packaged ) )
        {
            CCText appinfo;
            CCFileManager::GetFile( "appinfo.json", appinfo, Resource_Packaged );

            // Get app ID
            json_error_t error;
            json_t *root = json_loads( appinfo.buffer, 0, &error );
            if( root )
            {
				json_object_string( LAUNCH_APP_ID, root, "id", false );

                CCText result;
				json_object_string( result, root, "IOS_APP_ID", false );
                if( result.length > 0 )
                {
                    IOS_APP_ID = result;
                }

                json_object_string( result, root, "ANDROID_APP_ID", false );
                if( result.length > 0 )
                {
                    ANDROID_APP_ID = result;
                }

                json_decref( root );
            }

			script = "CCEngine.LoadAppInfo( ";
			script += appinfo.buffer;
			script += " );";
			CCAppManager::WebJSRunJavaScript( script.buffer, false, true );

            if( firstRun )
            {
            	firstRun = false;
				CURRENT_APP_ID = LAUNCH_APP_ID;
			}
        }

#ifdef DEBUGON
//        CURRENT_APP_ID = "33";
#endif

//        if( urlSchemeUpdated )
        {
//            urlSchemeUpdated = false;
            CCText script;

            script = "window.APP_ID = \"";
            script += CURRENT_APP_ID.buffer;
            script += "\";";
            CCAppManager::WebJSRunJavaScript( script.buffer, false, true );
        }

        CCAudioManager::Reset();
        jsEngine = new CCJSEngine();
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
				DEBUGLOG( "%s", debugOutput.buffer );
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

#ifdef _PLAYIR_DEBUG_JS
		serverConnect();
		return;
#endif

#ifndef _PLAYIR_DEBUG_JSNOUPDATE
    if( tryLatestUpdate )
    {
        usingLatestUpdate = true;
    }
#endif

    CCText filePath;
    CCFileManager::GetFilePath( filePath, "native.html", Resource_Cached );
    CCAppManager::WebJSOpen( filePath.buffer, true );
}
