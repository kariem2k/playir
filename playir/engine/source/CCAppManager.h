/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCAppManager.h
 * Description : Interface between the different app specific views and features.
 *
 * Created     : 30/08/11
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

#ifndef __CCAPPMANAGER_H__
#define __CCAPPMANAGER_H__


#ifdef IOS
    #ifdef __OBJC__
        #include "CCGLView.h"
        #include "CCVideoView.h"
        #import "CCViewController.h"
        #import "CCARView.h"
        #import "CCWebView.h"
        #import "CCWebJS.h"
    #else
        #define CCGLView void
        #define CCVideoView void
        #define CCViewController void
        #define UIWindow void
        #define CCARView void
        #define CCWebView void
        #define CCWebJS void
    #endif
#else
    #include "CCGLView.h"
    #include "CCWebView.h"
    #include "CCWebJS.h"
    #ifdef QT
        #include "CCVideoView.h"
    #endif
#endif

class CCAppManager
{
public:
    // Called when our web page is loaded/updated
    static CCList<CCTextCallback> WebViewLoadedCallbacks;

    static CCList<CCTextCallback> WebJSLoadedCallbacks;
    static CCList<CCTextCallback> WebJSJavaScriptCallbacks;

    // Called when keyboard input occurs
    static CCList<CCTextCallback> KeyboardUpdateCallbacks;
    static CCList<CCTextCallback> KeyboardReturnCallbacks;



public:
	CCAppManager();
    ~CCAppManager();

    static bool Startup();
    static void LaunchWindow();
    
    static void Shutdown();

public:
    static void Pause();
    static void Resume();

    static bool IsPortrait();
    static void SetIfNewOrientation(const float targetOrientation);
    static void SetOrientation(const float targetOrientation, const bool interpolate=true);
    static void ProjectOrientation(float &x, float &y);
    static void DetectOrientationNativeThread(const float delta);
    static void UpdateOrientation(const float delta);
    static const CCTarget<float>& GetOrientation();

    static void InAppPurchase(const char *code, const bool consumable, CCLambdaCallback *callback);
    static void InAppPurchaseSuccessful();

public:     static void EnableAdverts(const bool toggle);
public:     static float GetAdvertHeight();

public:     static void StartVideoView(const char *file);
protected:  static void StartVideoViewNativeThread(const char *file);
public:     static void StopVideoView();
protected:  static void StopVideoViewNativeThread();

public:     static void StartARView();
protected:  static void StartARViewNativeThread();
public:     static void StopARView();
protected:  static void StopARViewNativeThread();

public:     static void SetCameraActive(bool toggle);
    static bool IsCameraActive();

public:     static void WebBrowserOpen(const char *url);

public:     static void WebViewOpen(const char *url, const bool nativeThread=false);
protected:  static void WebViewOpenNativeThread(const char *url);

public:     static void WebViewLoadedNativeThread(const char *url, const char *data);
protected:  static void WebViewLoaded(const char *url, const char *data);

public:     static void WebViewClose(const bool nativeThread=false);
protected:  static void WebViewCloseNativeThread();

public:     static bool WebViewIsLoaded();

public:     static void WebViewClearData();

public:     static void WebJSOpen(const char *url, const bool isFile=false, const char *htmlData=NULL, bool nativeThread=false);
protected:  static void WebJSOpenNativeThread(const char *url, const bool isFile, const char *htmlData);
public:     static void WebJSLoadedNativeThread(const char *url, const char *data);

public:     static void WebJSClose(bool nativeThread=false);
protected:  static void WebJSCloseNativeThread();

public:     static bool WebJSIsLoaded();

public:     static void WebJSRunJavaScript(const char *script, const bool returnResult, bool nativeThread);
protected:  static void WebJSRunJavaScriptNativeThread(const char *script, const bool returnResult);

public:     static void WebJSJavaScriptResultNativeThread(const char *data, const bool returnResult);
public:     static bool WebJSIsJavaScriptRunning();
            static void WebJSSetJavaScriptUpdateTime(const float time);
            static float WebJSGetJavaScriptUpdateTime();

public:     static void KeyboardToggle(const bool show);
protected:  static void KeyboardToggleNativeThread(const bool show);

protected: static void EnableBackgroundRendering(const bool toggle);
};


#endif // __CCAPPMANAGER_H__

