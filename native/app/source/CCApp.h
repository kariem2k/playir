/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCApp.h
 * Description : App start point
 *
 * Created     : 25/04/10
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

#ifndef __CCAPP_H__
#define __CCAPP_H__


#include "CCEngine.h"

#include "CCJS.h"


#ifdef DEBUGON
    //#define MULTI_DEBUG_JS
    //#define MULTI_DEBUG_LOCALSERVER
    //#define MULTI_DEBUG_JSNORELOAD
    //#define MULTI_DEBUG_JSNOUPDATE
#endif
//#define PROFILEON

extern const char *_MULTISERVER_URL;
extern bool _MULTI;

extern CCText CLIENT_ID;
extern const int APPLE_ID;

class CCTextCallback;


class CCAppEngine : public CCEngine
{
public:
    typedef CCEngine super;


protected:
	CCEngineJS *jsEngine;

    CCTextCallback *registeredWebJSLoadedCallback;
    CCTextCallback *registeredWebJSJavaScriptCallback;

    CCTextCallback *registeredWebViewLoadedCallback;

    CCTextCallback *registeredKeyboardUpdateCallback;

    bool resuming;

    bool tryLatestUpdate;
    bool usingLatestUpdate;

    bool urlSchemeUpdated;


public:
    CCAppEngine();
	virtual ~CCAppEngine();

    virtual bool updateNativeThread();

protected:
    virtual void start();
	virtual void updateLoop();
    virtual void renderLoop();

public:
    virtual void resize();
    virtual void resized();
    virtual bool isOrientationSupported(const float angle);

    virtual void restart();
    void urlSchemeUpdate();
    virtual void pause();
    virtual void resume();

    virtual void touchBegin(const int index, const float x, const float y);
    virtual void touchMove(const int index, const float x, const float y);
    virtual void touchEnd(const int index);
    virtual void touchUpdateMovementThreasholds();

    virtual bool shouldHandleBackButton();
    virtual void handleBackButton();

    virtual void textureLoaded(CCTextureHandle &textureHandle);
	virtual void audioEnded(const char *id, const char *url);

protected:
    void serverConnect();

    void webJSLoaded(CCList<CCText> &text);
    void webJSJavaScriptResult(CCList<CCText> &text);

    void webViewLoaded(CCList<CCText> &text);

    void keyboardUpdate(CCList<CCText> &text);

    void reloadLastJSEngine();
};


#endif // __CCAPP_H__

