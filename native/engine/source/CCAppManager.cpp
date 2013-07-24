/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCAppManager.cpp
 *-----------------------------------------------------------
 */

#include "CCDefines.h"
#include "CCAppManager.h"

#ifdef QT
#include "CCMainWindow.h"
#endif

#include "CCFileManager.h"


CCGLView *gView = NULL;
CCAppEngine *gEngine = NULL;

CCAppManager *CCAppManager::_THIS = NULL;

#ifdef IOS
CCViewController *CCAppManager::ViewController = NULL;
#endif

CCList<CCTextCallback> CCAppManager::WebViewLoadedCallbacks;

CCList<CCTextCallback> CCAppManager::WebJSLoadedCallbacks;
CCList<CCTextCallback> CCAppManager::WebJSJavaScriptCallbacks;
float CCAppManager::WebJSJavaScriptUpdateTime = 0.0f;

CCList<CCTextCallback> CCAppManager::KeyboardUpdateCallbacks;

CCTarget<float> CCAppManager::Orientation;
CCAppManager::OrientationStateEnum CCAppManager::OrientationState = Orientation_Set;


CCAppManager::CCAppManager()
{
    CCAppManager::_THIS = this;

    glView = NULL;
    webView = NULL;
    webJS = NULL;

#if !defined ANDROID && !defined WP8 && !defined WIN8

    videoView = NULL;

#endif

#ifdef IOS

    arView = NULL;

#endif

    opaqueOpenGLRendering = true;

    webJSJavaScriptCalls = 0;
}


CCAppManager::~CCAppManager()
{
#if !defined ANDROID && !defined WP8 && !defined WIN8

    if( videoView != NULL )
    {
        stopVideoView();
    }

#endif

#ifdef IOS

    if( arView != NULL )
    {
        stopARView();
    }

    [glView release];

    [CCAppManager::ViewController release];
    CCAppManager::ViewController = NULL;

	[window release];
    window = NULL;

#else

    delete glView;

#endif

    CCAppManager::_THIS = NULL;
}


bool CCAppManager::Startup()
{
	if( CCAppManager::_THIS == NULL )
	{
		new CCAppManager();
		CCAppManager::_THIS->startup();
		return true;
	}
	return false;
}


void CCAppManager::startup()
{
#ifdef IOS

    // Create a full screen window
    CGRect rect = [[UIScreen mainScreen] bounds];

    CGRect statusBarRect = [[UIApplication sharedApplication] statusBarFrame];
    rect.size.height -= statusBarRect.size.height;
    rect.origin.y += statusBarRect.size.height * 0.5f;

    // Create OpenGL view and add to window
    glView = [[CCGLView alloc] initWithFrame:rect];
    CCAppManager::ViewController = [[CCViewController alloc] initWithNibName:NULL bundle:NULL];
    window = [[UIWindow alloc] initWithFrame:rect];

    gEngine = new CCAppEngine();
    [glView setup];

#elif defined QT

 //   QGraphicsScene scene;
  //  scene.setSceneRect( QRectF( 0, 0, 300, 300 ) );

//    glView = new CCGLView( NULL );
//    CCGraphicsView *graphicsView = new CCGraphicsView( &scene, CCMainWindow::instance );
//    CCMainWindow::instance->addChild( graphicsView );
//    graphicsView->setViewport( glView );

    glView = new CCGLView( CCMainWindow::instance );
    gEngine = new CCAppEngine();
    CCMainWindow::instance->addChild( glView );

#elif defined ANDROID

	// Create our game engine system
    glView = new CCGLView();

    // Engine is set up after the render buffer size is sent to the GLView
//    gEngine = new CCAppEngine();

#endif

#ifdef IOS
    [window setRootViewController:CCAppManager::ViewController];
#endif
}


void CCAppManager::Shutdown()
{
    if( _THIS != NULL )
    {
        _THIS->shutdown();
        delete _THIS;
    }
}


void CCAppManager::shutdown()
{
    gEngine->running = false;

    // Qt isn't multi-threaded yet, on Android this get's called from the rendering thread.
#ifndef IOS
    gEngine->engineThreadRunning = false;
#endif

    while( gEngine->engineThreadRunning )
    {
        usleep( 0 );
    }

#ifdef IOS

    [glView shutdown];

#elif defined QT

    glView->shutdown();

#endif
}


void CCAppManager::Pause()
{
    if( gEngine != NULL )
    {
        gEngine->pause();
    }
}


void CCAppManager::Resume()
{
    if( gEngine != NULL )
    {
        gEngine->resume();
    }
}


void CCAppManager::LaunchWindow()
{
#ifdef IOS

    [CCAppManager::_THIS->window makeKeyAndVisible];

#endif
}


void CCAppManager::SetIfNewOrientation(const float targetOrientation)
{
    if( Orientation.current != targetOrientation )
    {
        SetOrientation( targetOrientation, true );
    }
}


void CCAppManager::SetOrientation(const float targetOrientation, const bool interpolate)
{
#ifdef IOS

    [CCAppManager::ViewController setOrientation:targetOrientation];

#endif

    CCAppManager::Orientation.target = targetOrientation;
    //if( orientation.current != orientation.target )
    {
        CCAppManager::OrientationState = interpolate ? Orientation_Updating : Orientation_Setting;

        // Update our controls
        CCLAMBDA_RUN_ENGINETHREAD({
            if( gEngine != NULL )
            {
                gEngine->touchUpdateMovementThreasholds();
            }
        });
    }
}


void CCAppManager::ProjectOrientation(float &x, float &y)
{
    if( Orientation.target == 270.0f )
    {
        CCFloatSwap( x, y );
        x = 1.0f - x;
        y = 1.0f - y;
    }
    else if( Orientation.target == 90.0f )
    {
        CCFloatSwap( x, y );
    }
    else if( Orientation.target == 180.0f )
    {
        x = 1.0f - x;
    }
    else
    {
        y = 1.0f - y;
    }
}


void CCAppManager::UpdateOrientation(const float delta)
{
    if( OrientationState != Orientation_Set )
    {
        gEngine->resize();

        // Immediate update?
        if( OrientationState == Orientation_Setting )
        {
            Orientation.current = Orientation.target - CC_SMALLFLOAT;
        }
        OrientationState = Orientation_Set;
    }

    if( Orientation.current != Orientation.target )
    {
        if( CCToRotation( Orientation.current, Orientation.target, delta * 360.0f ) )
        {
            gEngine->resized();
        }
    }
}


static CCLambdaCallback *inAppPurchaseCallback = NULL;

void CCAppManager::InAppPurchase(const char *itemCode, const bool consumable, CCLambdaCallback *callback)
{
#ifdef IOS

    [gView->inAppPurchaseManager buyItem:itemCode consumable:consumable callback:callback];

#elif defined ANDROID || defined WP8

	if( inAppPurchaseCallback != NULL )
	{
		delete inAppPurchaseCallback;
	}
	inAppPurchaseCallback = callback;

#ifdef ANDROID

    CCJNI::BillingRequestPurchase( itemCode, consumable );

#elif defined WP8

	// Consumable specified at store level
	csActionStack.add( new CSAction( "CCAppManager::InAppPurchase, ", itemCode ) );

#endif

#endif
}


void CCAppManager::InAppPurchaseSuccessful()
{
	if( inAppPurchaseCallback != NULL )
	{
		gEngine->nativeToEngineThread( inAppPurchaseCallback );
		inAppPurchaseCallback = NULL;
	}
}


void CCAppManager::ToggleAdverts(const bool toggle)
{
    class ThreadCallback : public CCLambdaCallback
    {
    public:
        ThreadCallback(const bool toggle)
        {
            this->toggle = toggle;
        }
    protected:
        void run()
        {
            CCAppManager::_THIS->toggleAdvertsNativeThread( toggle );
        }
    private:
        bool toggle;
    };
    gEngine->engineToNativeThread( new ThreadCallback( toggle ) );
}


void CCAppManager::toggleAdvertsNativeThread(const bool toggle)
{
#ifdef IOS

    [CCAppManager::ViewController toggleAdverts:toggle];

#elif ANDROID

    CCJNI::AdvertsToggle( toggle );

#endif
}


float CCAppManager::AdvertHeight()
{
#ifdef IOS

    return 50.0f/gRenderer->getScreenSize().height;

#elif ANDROID

    const float bannerWidth = 320.0f;
    const float bannerHeight = 50.0f;
    const float screenWidth = gRenderer->getScreenSize().width;
    const float screenHeight = gRenderer->getScreenSize().height;

    float scale = screenWidth / bannerWidth;
    float scaledHeight = bannerHeight * scale;
    return scaledHeight / screenHeight;

#endif

    return 0.1f;
}


void CCAppManager::startVideoView(const char *file)
{
    class ThreadCallback : public CCLambdaCallback
    {
    public:
        ThreadCallback(const char *file)
        {
            this->file = file;
        }
    protected:
        void run()
        {
            CCAppManager::_THIS->startVideoViewNativeThread( this->file.buffer );
        }
    private:
        CCText file;
    };
    gEngine->engineToNativeThread( new ThreadCallback( file ) );
}


void CCAppManager::startVideoViewNativeThread(const char *file)
{
#ifdef QT
    return;
#endif

    toggleBackgroundRender( true );

    CCText fullFilePath;
    CCFileManager::GetFilePath( fullFilePath, file, Resource_Packaged );

#ifdef IOS

    ASSERT( videoView == NULL );

    CGRect rect = [[UIScreen mainScreen] bounds];
    videoView = [[CCVideoView alloc] initWithFrame:rect];
    [window insertSubview:videoView belowSubview:glView];

    [videoView playVideo:fullFilePath.buffer];

#elif defined ANDROID

    CCJNI::VideoViewStart( fullFilePath.buffer );

#elif defined QT

    videoView = new CCVideoView( CCMainWindow::instance );
    CCMainWindow::instance->addChild( videoView );
    videoView->playVideo( fullFilePath.buffer );
    videoView->lower();

#endif
}


void CCAppManager::stopVideoView()
{
    CCLAMBDA_UNSAFE( ThreadCallback, CCAppManager::_THIS->stopVideoViewNativeThread(); );
    gEngine->engineToNativeThread( new ThreadCallback() );
}


void CCAppManager::stopVideoViewNativeThread()
{
#ifdef IOS

    ASSERT( videoView != NULL );
    [videoView stop];
    [videoView remove];
    const int count = [videoView retainCount];
    for( int i=0; i<count; ++i )
    {
        [videoView release];
    }
    videoView = NULL;

    if( arView == NULL )
    {
        toggleBackgroundRender( false );
    }

#elif defined ANDROID

    CCJNI::VideoViewStop();

#endif
}


void CCAppManager::startARView()
{
    CCLAMBDA_UNSAFE( ThreadCallback, CCAppManager::_THIS->startARViewNativeThread(); );
    gEngine->engineToNativeThread( new ThreadCallback() );
}


void CCAppManager::startARViewNativeThread()
{
#ifdef IOS

    ASSERT( arView == NULL );

    toggleBackgroundRender( true );

    CGRect rect = [[UIScreen mainScreen] bounds];
    arView = [[CCARView alloc] initWithFrame:rect];
    [window insertSubview:arView belowSubview:glView];

#endif
}


void CCAppManager::stopARView()
{
    CCLAMBDA_UNSAFE( ThreadCallback, CCAppManager::_THIS->stopARViewNativeThread(); );
    gEngine->engineToNativeThread( new ThreadCallback() );
}


void CCAppManager::stopARViewNativeThread()
{
#ifdef IOS

    ASSERT( arView != NULL );
    [arView remove];
    //const int count = [videoView retainCount];
    [arView release];
    arView = NULL;

    if( videoView == NULL )
    {
        toggleBackgroundRender( false );
    }

#endif
}


void CCAppManager::WebBrowserOpen(const char *url)
{
    class ThreadCallback : public CCLambdaCallback
    {
    public:
        ThreadCallback(const char *url)
        {
            this->url = url;
        }
    protected:
        void run()
        {
#ifdef IOS

            NSString *urlString = [[NSString alloc] initWithFormat:@"%s", url.buffer];
            NSURL *url = [NSURL URLWithString:urlString];
            [urlString release];
            [[UIApplication sharedApplication] openURL:url];

#elif defined ANDROID

            CCJNI::WebBrowserOpen( url.buffer );

#elif defined QT

            QDesktopServices::openUrl( QUrl( url.buffer ) );

#elif defined WP8

			csActionStack.add( new CSAction( "CCAppManager::WebBrowserOpen, ", url.buffer ) );

#elif defined WIN8

			auto uri = ref new Windows::Foundation::Uri( GetString( url.buffer ) );

			// Set the option to show a warning
			auto launchOptions = ref new Windows::System::LauncherOptions();
			launchOptions->TreatAsUntrusted = true;

			// Launch the URI with a warning prompt
			Windows::System::Launcher::LaunchUriAsync( uri, launchOptions );

#endif
        }
    private:
        CCText url;
    };
    gEngine->engineToNativeThread( new ThreadCallback( url ) );
}


// WebView
void CCAppManager::WebViewOpen(const char *url, const bool nativeThread)
{
    if( nativeThread )
    {
        CCAppManager::_THIS->webViewOpenNativeThread( url );
    }
    else
    {
        class ThreadCallback : public CCLambdaCallback
        {
        public:
            ThreadCallback(const char *url)
            {
                this->url = url;
            }
        protected:
            void run()
            {
                CCAppManager::_THIS->webViewOpenNativeThread( this->url.buffer );
            }
        private:
            CCText url;
        };
        gEngine->engineToNativeThread( new ThreadCallback( url ) );
    }
}


void CCAppManager::webViewOpenNativeThread(const char *url)
{
#ifdef IOS

    if( webView == NULL )
    {
        webView = [[CCWebView alloc] initWithView:glView];
    }
    [webView openPage:url];

#elif defined ANDROID || defined WP8 || defined WIN8

    if( webView == NULL )
    {
        webView = new CCWebView();
    }
    webView->openPage( url );

#elif defined QT

    if( webView == NULL )
    {
        webView = new CCWebView( CCMainWindow::instance );
        CCMainWindow::instance->addChild( webView );
    }

    webView->openPage( url );

    // OpenGL widget's always render on top, so hide it until finished with this view
    gView->hide();

#endif
}


void CCAppManager::WebViewLoadedNativeThread(const char *url, const char *data)
{
    class ThreadCallback : public CCLambdaCallback
    {
    public:
        ThreadCallback(const char *url, const char *data)
        {
            this->url = url;
            this->data = data;
        }
    protected:
        void run()
        {
            CCAppManager::_THIS->webViewLoaded( this->url.buffer, this->data.buffer );
        }
    private:
        CCText url, data;
    };
    gEngine->nativeToEngineThread( new ThreadCallback( url, data ) );
}


void CCAppManager::webViewLoaded(const char *url, const char *data)
{
    // Fire update callbacks
    for( int i=0; i<WebViewLoadedCallbacks.length; ++i )
    {
        CCTextCallback *callback = WebViewLoadedCallbacks.list[i];
        callback->add( url, 0 );
        callback->add( data, 1 );
        callback->safeRun();
    }
}


void CCAppManager::WebViewClose(const bool nativeThread)
{
    if( nativeThread )
    {
        CCAppManager::_THIS->webViewCloseNativeThread();
    }
    else
    {
        CCLAMBDA_RUN_NATIVETHREAD( CCAppManager::_THIS->webViewCloseNativeThread(); );
    }
}


void CCAppManager::webViewCloseNativeThread()
{
    CCAppManager::WebViewLoadedNativeThread( "close", "" );

    if( webView != NULL )
    {
#ifdef IOS

        [webView remove];

#elif defined ANDROID || defined WP8 || defined WIN8

        delete webView;

#elif defined QT

        webView->shutdown();

#endif

        webView = NULL;
    }
}


bool CCAppManager::WebViewIsLoaded()
{
#ifdef IOS

    if( CCAppManager::_THIS->webView != NULL )
    {
        if( CCAppManager::_THIS->webView->loaded )
        {
            return true;
        }
    }

#elif defined ANDROID || defined QT || defined WP8 || defined WIN8

    if( CCAppManager::_THIS->webView != NULL )
    {
        if( CCAppManager::_THIS->webView->isLoaded() )
        {
            return true;
        }
    }

#endif

    return false;
}


void CCAppManager::WebViewClearData()
{
#ifdef IOS

    [CCWebView ClearData];

#else

    CCWebView::ClearData();

#endif
}



// WebJS
void CCAppManager::WebJSOpen(const char *url, const bool isFile, const char *htmlData, bool nativeThread)
{
#ifndef IOS
	if( !nativeThread )
	{
		// Only iOS manages both threads in C++
		nativeThread = true;
	}
#endif

    ASSERT( url != NULL );
    if( nativeThread )
    {
        CCAppManager::_THIS->webJSOpenNativeThread( url, isFile, htmlData );
    }
    else
    {
        class ThreadCallback : public CCLambdaCallback
        {
        public:
            ThreadCallback(const char *url, const bool isFile, const char *htmlData)
            {
                this->url = url;
                this->isFile = isFile;
                this->htmlData = htmlData;
            }
        protected:
            void run()
            {
                CCAppManager::_THIS->webJSOpenNativeThread( url.buffer, isFile, htmlData.buffer );
            }
        private:
            CCText url;
            bool isFile;
            CCText htmlData;
            bool hidden;
        };
        gEngine->engineToNativeThread( new ThreadCallback( url, isFile, htmlData ) );
    }
}


void CCAppManager::webJSOpenNativeThread(const char *url, const bool isFile, const char *htmlData)
{
#ifdef IOS

    if( webJS == NULL )
    {
        webJS = [[CCWebJS alloc] initWithFrame:glView.frame];
        [webJS setBackgroundColor:[UIColor blackColor]];
        [glView addSubview:webJS];
    }

    if( isFile )
    {
        [webJS openFile:url];
    }
    else if( htmlData == NULL )
    {
        [webJS openPage:url];
    }
    else
    {
        [webJS openData:url data:htmlData];
    }

#elif defined ANDROID || defined WP8 || defined WIN8

    if( webJS == NULL )
    {
        webJS = new CCWebJS();
    }

    if( isFile )
    {
        webJS->openFile( url );
    }
    else
    {
        webJS->openPage( url, htmlData );
    }

#elif defined QT

    if( webJS == NULL )
    {
        webJS = new CCWebJS( CCMainWindow::instance );
        CCMainWindow::instance->addChild( webJS );
    }

    webJS->openPage( url );
    webJS->hide();

#endif
}


void CCAppManager::WebJSLoadedNativeThread(const char *url, const char *data)
{
    DEBUGLOG( "CCAppManager::webJSLoaded webJSJavaScriptCalls:%i \n", CCAppManager::_THIS->webJSJavaScriptCalls );
    CCAppManager::_THIS->webJSJavaScriptCalls = 0;
    CCAppManager::WebJSSetJavaScriptUpdateTime( gEngine->time.lifetime );

    // Fire update callbacks
    for( int i=0; i<WebJSLoadedCallbacks.length; ++i )
    {
        CCTextCallback *callback = WebJSLoadedCallbacks.list[i];
        callback->add( url, 0 );
        callback->add( data, 1 );
        callback->safeRun();
    }
}



void CCAppManager::WebJSClose(bool nativeThread)
{
#ifndef IOS
    if( !nativeThread )
    {
        // Only iOS manages both threads in C++
        nativeThread = true;
    }
#endif

    if( nativeThread )
    {
        CCAppManager::_THIS->webJSCloseNativeThread();
    }
    else
    {
        CCLAMBDA_RUN_NATIVETHREAD( CCAppManager::_THIS->webJSCloseNativeThread(); );
    }
}


void CCAppManager::webJSCloseNativeThread()
{
    if( webJS != NULL )
    {
#ifdef IOS

        [webJS remove];
        //const int count = [videoView retainCount];
        [webJS release];

#elif defined ANDROID || defined WP8 || defined WIN8

        delete webJS;

#elif defined QT

        webJS->shutdown();

#endif

        webJS = NULL;
    }
}


bool CCAppManager::WebJSIsLoaded()
{
    if( CCAppManager::_THIS != NULL && CCAppManager::_THIS->webJS != NULL )
    {
#ifdef IOS

        if( CCAppManager::_THIS->webJS->loaded )
        {
            return true;
        }

#elif defined ANDROID || defined QT || defined WP8 || defined WIN8

        if( CCAppManager::_THIS->webJS->isLoaded() )
        {
            return true;
        }

#endif

    }

    return false;
}


void CCAppManager::WebJSRunJavaScript(const char *script, const bool returnResult, bool nativeThread)
{
#ifndef IOS
	if( !nativeThread )
	{
		// Only iOS manages both threads in C++
		nativeThread = true;
	}
#endif

    CCAppManager::_THIS->webJSJavaScriptCalls++;
    //DEBUGLOG( "CCAppManager::WebJSRunJavaScript() %i script:%s\n", CCAppManager::_THIS->webJSJavaScriptCalls, script );

    //ASSERT( CCAppManager::THIS->webJS != NULL );
    //ASSERT( CCAppManager::THIS->webJS->loaded );

    if( nativeThread )
    {
        CCAppManager::_THIS->webJSRunJavaScriptNativeThread( script, returnResult );
    }
    else
    {
        class ThreadCallback : public CCLambdaCallback
        {
        public:
            ThreadCallback(const char *script, const bool returnResult)
            {
                this->script = script;
                this->returnResult = returnResult;
            }
        protected:
            void run()
            {
                CCAppManager::_THIS->webJSRunJavaScriptNativeThread( this->script.buffer, this->returnResult );
            }
        private:
            CCText script;
            bool returnResult;
        };
        gEngine->engineToNativeThread( new ThreadCallback( script, returnResult ) );
    }
}


void CCAppManager::webJSRunJavaScriptNativeThread(const char *script, const bool returnResult)
{
    //DEBUGLOG( "CCAppManager::webJSRun:%f, %s\n", gEngine->time.lifetime, script );

    CCText data;

    if( WebJSIsLoaded() )
    {

#ifdef IOS

        data = [webJS runJavaScript:script];
        WebJSJavaScriptResultNativeThread( data.buffer, returnResult );

#elif defined ANDROID || defined WP8 || defined WIN8

        webJS->runJavaScript( script, returnResult );
        // WebJSJavaScriptResultNativeThread is called by CCWebJS once the javascript is run

#elif defined QT

        webJS->runJavaScript( script, data );
        WebJSJavaScriptResultNativeThread( data.buffer );

#endif

    }
    else
    {
        WebJSJavaScriptResultNativeThread( data.buffer, returnResult );
    }
}


void CCAppManager::WebJSJavaScriptResultNativeThread(const char *data, const bool returnResult)
{
#if defined IOS || defined ANDROID || defined WP8 || defined WIN8

    // If the webJS isn't loaded, don't do anything
	if( WebJSIsLoaded() == false )
	{
		if( CCAppManager::_THIS != NULL )
		{
			DEBUGLOG( "CCAppManager::webJSJavaScriptResult (WebJSIsLoaded() == false) result:%i %s \n", CCAppManager::_THIS->webJSJavaScriptCalls, data );
			CCAppManager::_THIS->webJSJavaScriptCalls = 0;
		}
	}
	else if( CCAppManager::_THIS->webJSJavaScriptCalls <= 0 )
	{
		DEBUGLOG( "CCAppManager::webJSJavaScriptResult (webJSJavaScriptCalls <= 0) result:%i %s \n", CCAppManager::_THIS->webJSJavaScriptCalls, data );
		CCAppManager::_THIS->webJSJavaScriptCalls = 0;
	}
	else
	{
		CCAppManager::_THIS->webJSJavaScriptCalls--;
		CCAppManager::WebJSSetJavaScriptUpdateTime( gEngine->time.lifetime );

		// Fire update callbacks
        if( returnResult )
        {
            //DEBUGLOG( "CCAppManager::WebJSResult:%f, %s\n", gEngine->time.lifetime, data );

            for( int i=0; i<WebJSJavaScriptCallbacks.length; ++i )
            {
                CCTextCallback *callback = WebJSJavaScriptCallbacks.list[i];
                callback->add( data, 0 );
                callback->safeRun();
            }
        }
	}

#endif
}


bool CCAppManager::WebJSIsJavaScriptRunning()
{
    if( CCAppManager::_THIS->webJSJavaScriptCalls > 0 )
    {
        return true;
    }
    return false;
}


void CCAppManager::WebJSSetJavaScriptUpdateTime(const float time)
{
    CCAppManager::WebJSJavaScriptUpdateTime = time;
}


float CCAppManager::WebJSGetJavaScriptUpdateTime()
{
    return CCAppManager::WebJSJavaScriptUpdateTime;
}



void CCAppManager::KeyboardToggle(const bool show)
{
    class ThreadCallback : public CCLambdaCallback
    {
    public:
        ThreadCallback(const bool show)
        {
            this->show = show;
        }
    protected:
        void run()
        {
            CCAppManager::_THIS->keyboardToggleNativeThread( show );
        }
    private:
        bool show;
    };
    gEngine->engineToNativeThread( new ThreadCallback( show ) );
}


void CCAppManager::keyboardToggleNativeThread(const bool show)
{
#ifdef IOS

    [CCAppManager::ViewController keyboardToggle:show];

#elif defined ANDROID

    JNIEnv *jniEnv = CCJNI::Env();
   	jclass jniClass = jniEnv->FindClass( "com/android2c/CCJNI" );
   	ASSERT_MESSAGE( jniClass != 0, "Could not find Java class." );

   	static jmethodID mid = jniEnv->GetStaticMethodID( jniClass, "ControlsKeyboardToggle", "(Z)V" );
   	ASSERT( mid != 0 );
   	jniEnv->CallStaticVoidMethod( jniClass, mid, show );

#elif defined WP8 || defined WIN8

	csActionStack.add( new CSAction( "CCAppManager::KeyboardToggle, ", show ? "true" : "false" ) );

#endif
}


void CCAppManager::toggleBackgroundRender(const bool toggle)
{
    if( opaqueOpenGLRendering == toggle )
    {
        opaqueOpenGLRendering = !toggle;
#ifdef IOS
        CAEAGLLayer *eaglLayer = (CAEAGLLayer*)glView.layer;
        eaglLayer.opaque = !toggle;
#endif

        // Switch between clearing the alpha channel or not.
#ifndef DXRENDERER
        if( opaqueOpenGLRendering )
        {
        	glClearColor( 0.0f, 0.0f, 0.0f, 1.0f );
        }
        else
        {
        	glClearColor( 0.0f, 0.0f, 0.0f, 0.0f );
        }
#endif
    }
}
