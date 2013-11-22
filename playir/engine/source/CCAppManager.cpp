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

#ifdef IOS
#include "TouchCapturingWindow.h"
#endif


CCGLView *gView = NULL;
CCAppEngine *gEngine = NULL;
#ifdef IOS
CCViewController *gViewController = NULL;
#endif


static bool AppStarted = false;

// Views
static CCGLView *GLView = NULL;
static CCWebView *WebView = NULL;
static CCWebJS *WebJS = NULL;

#if defined IOS || defined QT
static CCVideoView *VideoView = NULL;
#endif

#ifdef IOS
static CCARView *ARView = NULL;
static UIWindow *Window;
#endif

static CCTarget<float> Orientation;
enum OrientationStateEnum
{
    Orientation_Set,
    Orientation_Updating,
    Orientation_Setting
};
static OrientationStateEnum OrientationState = Orientation_Set;

static bool OpaqueOpenGLRendering;
static bool CameraActive = false;

static int WebJSJavaScriptCalls;
static float WebJSJavaScriptUpdateTime = 0.0f;

CCList<CCTextCallback> CCAppManager::WebViewLoadedCallbacks;
CCList<CCTextCallback> CCAppManager::WebJSLoadedCallbacks;
CCList<CCTextCallback> CCAppManager::WebJSJavaScriptCallbacks;
CCList<CCTextCallback> CCAppManager::KeyboardUpdateCallbacks;


bool CCAppManager::Startup()
{
	if( !AppStarted )
	{
        AppStarted = true;

        OpaqueOpenGLRendering = true;
        WebJSJavaScriptCalls = 0;

#ifdef IOS

        // Create a full screen window
        CGRect rect = [[UIScreen mainScreen] bounds];

        CGRect statusBarRect = [[UIApplication sharedApplication] statusBarFrame];
        rect.size.height -= statusBarRect.size.height;
        rect.origin.y += statusBarRect.size.height * 0.5f;

        Window = [[TouchCapturingWindow alloc] initWithFrame:rect];
        gViewController = [[CCViewController alloc] initWithNibName:NULL bundle:NULL];

        // Create OpenGL view and add to window
        GLView = [[CCGLView alloc] initWithFrame:rect];
//        [(TouchCapturingWindow*)Window addViewForTouchPriority:GLView];

        [Window setRootViewController:gViewController];

        // Initialise our status bar orientation so the keyboard launches in the correct orientation.
//        [[UIApplication sharedApplication] setStatusBarOrientation:[gViewController getInterfaceOrientation] animated:NO];
//        [[UIApplication sharedApplication] setStatusBarOrientation:UIInterfaceOrientationPortrait];

        gEngine = new CCAppEngine();
        [GLView setup];

#elif defined QT

        //QGraphicsScene scene;
        //scene.setSceneRect( QRectF( 0, 0, 300, 300 ) );

        //GLView = new CCGLView( NULL );
        //CCGraphicsView *graphicsView = new CCGraphicsView( &scene, CCMainWindow::Get() );
        //CCMainWindow::AddChild( graphicsView );
        //graphicsView->setViewport( glView );

        GLView = new CCGLView( CCMainWindow::Get() );
        gEngine = new CCAppEngine();
        CCMainWindow::AddChild( GLView );

#elif defined ANDROID
        
        // Create our game engine system
        GLView = new CCGLView();
        
        // Engine is set up after the render buffer size is sent to the GLView
        //gEngine = new CCAppEngine();
        
#endif
		return true;
	}
	return false;
}


void CCAppManager::LaunchWindow()
{
#ifdef IOS

    [Window makeKeyAndVisible];

#endif
}


void CCAppManager::Shutdown()
{
    if( AppStarted )
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

        [GLView shutdown];
        
#elif defined QT
        
        GLView->shutdown();

#endif


#if !defined ANDROID && !defined WP8 && !defined WIN8

        if( VideoView != NULL )
        {
            StopVideoView();
        }

#endif

#ifdef IOS

        if( ARView != NULL )
        {
            StopARView();
        }

        [GLView release];

        [gViewController release];
        gViewController = NULL;

        [Window release];
        Window = NULL;
        
#else
        
        delete GLView;

#endif

        GLView = NULL;
        
        AppStarted = false;
    }
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


bool CCAppManager::IsPortrait()
{
    return Orientation.target == 0.0f || Orientation.target == 180.0f;
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

    [gViewController setOrientation:targetOrientation interpolate:interpolate];

#endif

    Orientation.target = targetOrientation;
    //if( orientation.current != orientation.target )
    {
        OrientationState = interpolate ? Orientation_Updating : Orientation_Setting;

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


void CCAppManager::DetectOrientationNativeThread(const float delta)
{
#ifdef IOS
    [gViewController detectOrientationUpdate:delta];
#endif
}


void CCAppManager::UpdateOrientation(const float delta)
{
    if( OrientationState != Orientation_Set )
    {
        gEngine->resize();
        gEngine->resized();

        // Immediate update?
        if( OrientationState == Orientation_Setting )
        {
            Orientation.current = Orientation.target - CC_SMALLFLOAT;
        }
        OrientationState = Orientation_Set;
        return;
    }

    if( Orientation.current != Orientation.target )
    {
        if( CCToRotation( Orientation.current, Orientation.target, delta * 360.0f ) )
        {
            gEngine->resized();
        }
    }
}


const CCTarget<float>& CCAppManager::GetOrientation()
{
    return Orientation;
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


void CCAppManager::EnableAdverts(const bool toggle)
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
#ifdef IOS

            [gViewController toggleAdverts:toggle];

#elif ANDROID

            CCJNI::AdvertsToggle( toggle );
            
#endif
        }
    private:
        bool toggle;
    };
    gEngine->engineToNativeThread( new ThreadCallback( toggle ) );
}


float CCAppManager::GetAdvertHeight()
{
#ifdef IOS

    return ( 50.0f / gRenderer->getScreenSize().height );

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


void CCAppManager::StartVideoView(const char *file)
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
            CCAppManager::StartVideoViewNativeThread( this->file.buffer );
        }
    private:
        CCText file;
    };
    gEngine->engineToNativeThread( new ThreadCallback( file ) );
}


void CCAppManager::StartVideoViewNativeThread(const char *file)
{
#ifdef QT
    return;
#endif

    EnableBackgroundRendering( true );

    CCText fullFilePath;
    CCFileManager::GetFilePath( fullFilePath, file, Resource_Packaged );

#ifdef IOS

    CCASSERT( VideoView == NULL );

    CGRect rect = [[UIScreen mainScreen] bounds];
    VideoView = [[CCVideoView alloc] initWithFrame:rect];
    [Window insertSubview:VideoView belowSubview:GLView];

    [VideoView playVideo:fullFilePath.buffer];

#elif defined ANDROID

    CCJNI::VideoViewStart( fullFilePath.buffer );

#elif defined QT

    VideoView = new CCVideoView( CCMainWindow::Get() );
    CCMainWindow::AddChild( VideoView );
    VideoView->playVideo( fullFilePath.buffer );
    VideoView->lower();

#endif
}


void CCAppManager::StopVideoView()
{
    CCLAMBDA_UNSAFE( ThreadCallback, CCAppManager::StopVideoViewNativeThread(); );
    gEngine->engineToNativeThread( new ThreadCallback() );
}


void CCAppManager::StopVideoViewNativeThread()
{
#ifdef IOS

    CCASSERT( VideoView != NULL );
    [VideoView stop];
    [VideoView remove];
    const int count = [VideoView retainCount];
    for( int i=0; i<count; ++i )
    {
        [VideoView release];
    }
    VideoView = NULL;

    if( ARView == NULL )
    {
        EnableBackgroundRendering( false );
    }

#elif defined ANDROID

    CCJNI::VideoViewStop();

#endif
}


void CCAppManager::StartARView()
{
    CCLAMBDA_UNSAFE( ThreadCallback, CCAppManager::StartARViewNativeThread(); );
    gEngine->engineToNativeThread( new ThreadCallback() );
}


void CCAppManager::StartARViewNativeThread()
{
#ifdef IOS

    CCASSERT( ARView == NULL );

    EnableBackgroundRendering( true );

    CGRect rect = [[UIScreen mainScreen] bounds];
    ARView = [[CCARView alloc] initWithFrame:rect];
    [Window insertSubview:ARView belowSubview:GLView];

#endif
}


void CCAppManager::StopARView()
{
    CCLAMBDA_UNSAFE( ThreadCallback, CCAppManager::StopARViewNativeThread(); );
    gEngine->engineToNativeThread( new ThreadCallback() );
}


void CCAppManager::StopARViewNativeThread()
{
#ifdef IOS

    CCASSERT( ARView != NULL );
    [ARView remove];
    //const int count = [videoView retainCount];
    [ARView release];
    ARView = NULL;

    if( VideoView == NULL )
    {
        EnableBackgroundRendering( false );
    }

#endif
}


void CCAppManager::SetCameraActive(bool toggle)
{
    CameraActive = toggle;
}


bool CCAppManager::IsCameraActive()
{
    return CameraActive;
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
        CCAppManager::WebViewOpenNativeThread( url );
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
                CCAppManager::WebViewOpenNativeThread( this->url.buffer );
            }
        private:
            CCText url;
        };
        gEngine->engineToNativeThread( new ThreadCallback( url ) );
    }
}


void CCAppManager::WebViewOpenNativeThread(const char *url)
{
#ifdef IOS

    if( WebView == NULL )
    {
        WebView = [[CCWebView alloc] initWithView:GLView];
    }
    [WebView openPage:url];

#elif defined ANDROID || defined WP8 || defined WIN8

    if( WebView == NULL )
    {
        WebView = new CCWebView();
    }
    WebView->openPage( url );

#elif defined QT

    if( WebView == NULL )
    {
        WebView = new CCWebView( CCMainWindow::Get() );
        CCMainWindow::AddChild( WebView );
    }

    WebView->openPage( url );

    // OpenGL widget's always render on top, so hide it until finished with this view
    gView->hideView();

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
            WebViewLoaded( this->url.buffer, this->data.buffer );
        }
    private:
        CCText url, data;
    };
    gEngine->nativeToEngineThread( new ThreadCallback( url, data ) );
}


void CCAppManager::WebViewLoaded(const char *url, const char *data)
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
        CCAppManager::WebViewCloseNativeThread();
    }
    else
    {
        CCLAMBDA_RUN_NATIVETHREAD( CCAppManager::WebViewCloseNativeThread(); );
    }
}


void CCAppManager::WebViewCloseNativeThread()
{
    CCAppManager::WebViewLoadedNativeThread( "close", "" );

    if( WebView != NULL )
    {
#ifdef IOS

        [WebView remove];

#elif defined ANDROID || defined WP8 || defined WIN8

        delete WebView;

#elif defined QT

        WebView->shutdown();
        gView->showView();

#endif

        WebView = NULL;
    }
}


bool CCAppManager::WebViewIsLoaded()
{
#ifdef IOS

    if( WebView != NULL )
    {
        if( WebView->loaded )
        {
            return true;
        }
    }

#elif defined ANDROID || defined QT || defined WP8 || defined WIN8

    if( WebView != NULL )
    {
        if( WebView->isLoaded() )
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

    CCASSERT( url != NULL );
    if( nativeThread )
    {
        WebJSOpenNativeThread( url, isFile, htmlData );
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
                WebJSOpenNativeThread( url.buffer, isFile, htmlData.buffer );
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


void CCAppManager::WebJSOpenNativeThread(const char *url, const bool isFile, const char *htmlData)
{
#ifdef IOS

    if( WebJS == NULL )
    {
        WebJS = [[CCWebJS alloc] initWithFrame:GLView.frame];
        [WebJS setBackgroundColor:[UIColor blackColor]];
        //[Window insertSubview:WebJS belowSubview:GLView];
    }

    if( isFile )
    {
        [WebJS openFile:url];
    }
    else if( htmlData == NULL )
    {
        [WebJS openPage:url];
    }
    else
    {
        [WebJS openData:url data:htmlData];
    }

#elif defined ANDROID || defined WP8 || defined WIN8

    if( WebJS == NULL )
    {
        WebJS = new CCWebJS();
    }

    if( isFile )
    {
        WebJS->openFile( url );
    }
    else
    {
        WebJS->openPage( url, htmlData );
    }

#elif defined QT

    if( WebJS == NULL )
    {
        WebJS = new CCWebJS( CCMainWindow::Get() );
        CCMainWindow::AddChild( WebJS );
    }

    CCText fullURL = url;
    if( isFile )
    {
        fullURL = "file:///";
        fullURL += url;
    }

    WebJS->openPage( fullURL.buffer );
    WebJS->hide();

#endif
}


void CCAppManager::WebJSLoadedNativeThread(const char *url, const char *data)
{
    if( AppStarted )
    {
        DEBUGLOG( "CCAppManager::webJSLoaded webJSJavaScriptCalls:%i \n", WebJSJavaScriptCalls );
        WebJSJavaScriptCalls = 0;
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
        WebJSCloseNativeThread();
    }
    else
    {
        CCLAMBDA_RUN_NATIVETHREAD( CCAppManager::WebJSCloseNativeThread(); );
    }
}


void CCAppManager::WebJSCloseNativeThread()
{
    if( WebJS != NULL )
    {
#ifdef IOS

        [WebJS remove];
        //const int count = [videoView retainCount];
        [WebJS release];

#elif defined ANDROID || defined WP8 || defined WIN8

        delete WebJS;

#elif defined QT

        WebJS->shutdown();

#endif

        WebJS = NULL;
    }
}


bool CCAppManager::WebJSIsLoaded()
{
    if( AppStarted && WebJS != NULL )
    {
#ifdef IOS

        if( WebJS->loaded )
        {
            return true;
        }

#elif defined ANDROID || defined QT || defined WP8 || defined WIN8

        if( WebJS->isLoaded() )
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

    WebJSJavaScriptCalls++;
    //DEBUGLOG( "CCAppManager::WebJSRunJavaScript() %i script:%s\n", CCAppManager::_THIS->webJSJavaScriptCalls, script );

    //CCASSERT( CCAppManager::THIS->webJS != NULL );
    //CCASSERT( CCAppManager::THIS->webJS->loaded );

    if( nativeThread )
    {
        WebJSRunJavaScriptNativeThread( script, returnResult );
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
                WebJSRunJavaScriptNativeThread( this->script.buffer, this->returnResult );
            }
        private:
            CCText script;
            bool returnResult;
        };
        gEngine->engineToNativeThread( new ThreadCallback( script, returnResult ) );
    }
}


void CCAppManager::WebJSRunJavaScriptNativeThread(const char *script, const bool returnResult)
{
    //DEBUGLOG( "CCAppManager::webJSRun:%f, %s\n", gEngine->time.lifetime, script );

    CCText data;

    if( WebJSIsLoaded() )
    {

#ifdef IOS

        data = [WebJS runJavaScript:script];
        WebJSJavaScriptResultNativeThread( data.buffer, returnResult );

#elif defined ANDROID || defined WP8 || defined WIN8

        WebJS->runJavaScript( script, returnResult );
        // WebJSJavaScriptResultNativeThread is called by CCWebJS once the javascript is run

#elif defined QT

        WebJS->runJavaScript( script, data );
        WebJSJavaScriptResultNativeThread( data.buffer, returnResult );

#endif

    }
    else
    {
        WebJSJavaScriptResultNativeThread( data.buffer, returnResult );
    }
}


void CCAppManager::WebJSJavaScriptResultNativeThread(const char *data, const bool returnResult)
{
#if defined IOS || defined ANDROID || defined WP8 || defined WIN8 || defined QT

    // If the webJS isn't loaded, don't do anything
	if( WebJSIsLoaded() == false )
	{
		if( AppStarted )
		{
			DEBUGLOG( "CCAppManager::webJSJavaScriptResult (WebJSIsLoaded() == false) result:%i %s \n", WebJSJavaScriptCalls, data );
			WebJSJavaScriptCalls = 0;
		}
	}
	else if( WebJSJavaScriptCalls <= 0 )
	{
		DEBUGLOG( "CCAppManager::webJSJavaScriptResult (webJSJavaScriptCalls <= 0) result:%i %s \n", WebJSJavaScriptCalls, data );
		WebJSJavaScriptCalls = 0;
	}
	else
	{
		WebJSJavaScriptCalls--;
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
    if( WebJSJavaScriptCalls > 0 )
    {
        return true;
    }
    return false;
}


void CCAppManager::WebJSSetJavaScriptUpdateTime(const float time)
{
    WebJSJavaScriptUpdateTime = time;
}


float CCAppManager::WebJSGetJavaScriptUpdateTime()
{
    return WebJSJavaScriptUpdateTime;
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
            KeyboardToggleNativeThread( show );
        }
    private:
        bool show;
    };
    gEngine->engineToNativeThread( new ThreadCallback( show ) );
}


void CCAppManager::KeyboardToggleNativeThread(const bool show)
{
#ifdef IOS

    [gViewController keyboardToggle:show];

#elif defined ANDROID

    JNIEnv *jniEnv = CCJNI::Env();
    static jclass jniClass = jniEnv->FindClass( "com/android2c/CCJNI" );
    CCASSERT_MESSAGE( jniClass != 0, "Could not find Java class." );

   	static jmethodID mid = jniEnv->GetStaticMethodID( jniClass, "ControlsKeyboardToggle", "(Z)V" );
    CCASSERT( mid != 0 );
   	jniEnv->CallStaticVoidMethod( jniClass, mid, show );

#elif defined WP8 || defined WIN8

	csActionStack.add( new CSAction( "CCAppManager::KeyboardToggle, ", show ? "true" : "false" ) );

#endif
}


void CCAppManager::EnableBackgroundRendering(const bool toggle)
{
    if( OpaqueOpenGLRendering == toggle )
    {
        OpaqueOpenGLRendering = !toggle;
#ifdef IOS
        CAEAGLLayer *eaglLayer = (CAEAGLLayer*)GLView.layer;
        eaglLayer.opaque = !toggle;
#endif

        // Switch between clearing the alpha channel or not.
#ifndef DXRENDERER
        if( OpaqueOpenGLRendering )
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
