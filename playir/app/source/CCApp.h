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
//#define _PLAYIR_DEBUG_JS				// Use debug.php
//#define _PLAYIR_DEBUG_LOCALJS			// Get js from localhost
//#define _PLAYIR_DEBUG_LOCALSERVER		// Get assets from localhost
//#define _PLAYIR_DEBUG_JSNORELOAD		// Don't reload js on timeout
//#define _PLAYIR_DEBUG_JSNOUPDATE		// Don't use new js downloaded from the server
#endif
//#define PROFILEON
#define _PLAYER_JSENGINEVERSION "5"

extern const char *_PLAYIR_SERVER_URL;

extern CCText CURRENT_APPID;
extern CCText APPLE_APPID;

class CCTextCallback;


class CCAppEngine : public CCEngine, public virtual CCActiveAllocation
{
public:
    typedef CCEngine super;


protected:
	CCJSEngine *jsEngine;

    CCTextCallback *registeredWebJSLoadedCallback;
    CCTextCallback *registeredWebJSJavaScriptCallback;

    CCTextCallback *registeredWebViewLoadedCallback;

    CCTextCallback *registeredKeyboardUpdateCallback;

    bool resuming;
    bool tryLatestUpdate;
    bool usingLatestUpdate;
    bool urlSchemeUpdated;
    bool firstRun;

    CCText downloadingVersion;



public:
    CCAppEngine();
	virtual ~CCAppEngine();

protected:
    virtual void start();

public:
    virtual bool updateJobsThread();

protected:
	virtual void updateLoop();
    virtual void renderLoop();

public:
    virtual void resize();
    virtual void resized();
    virtual bool isOrientationSupported(const float angle);

    virtual void restart();
    void restartLauncher();
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

    CCJSEngine* getJSEngine() { return jsEngine; }

protected:
    void serverConnect();
    void serverUpdateCheck();
    void serverUpdateDownload();

    void webJSLoaded(CCList<CCText> &text);
    void webJSJavaScriptResult(CCList<CCText> &text);

    void webViewLoaded(CCList<CCText> &text);

    void keyboardUpdate(CCList<CCText> &text);

    void reloadLastJSEngine();
};


#endif // __CCAPP_H__

