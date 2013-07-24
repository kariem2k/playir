/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCEngine.h
 * Description : Handles the update and render loop and feature managers
 *
 * Created     : 01/03/10
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

#ifndef __CCENGINE_H__
#define __CCENGINE_H__


struct CCTime
{
	CCTime()
	{
		real = 0.0f;
		delta = 0.0f;
        lifetime = 0.0f;
        lastUpdate = 0;
	}

    float real;
	float delta;
	float lifetime;

    double lastUpdate;
};


#include "CCAudioManager.h"
#include "CCRenderer.h"
#include "CCControls.h"
#include "CCCameraBase.h"
#include "CCTextureManager.h"
#include "CCOctree.h"
#include "CCURLManager.h"
#include "CCScenes.h"
#include "CCObjects.h"

class CCEngine
{
public:
    static CCText DeviceType;

	bool running, paused, engineThreadRunning;
    bool pauseRendering;

	CCRenderer *renderer;
	CCControls *controls;
	CCTextureManager *textureManager;
	CCURLManager *urlManager;

    // Our Octree collideables container
	CCCollisionManager collisionManager;

    // Engine level controls used for timers and such
    CCDestructList<CCTimer> timers;

	CCTime time;
	double fpsLimit;

protected:
    CCList<CCLambdaCallback> nativeThreadCallbacks;
    CCList<CCLambdaCallback> engineThreadCallbacks;
    CCList<CCLambdaCallback> jobsThreadCallbacks;

    bool backButtonPressed;



public:
	CCEngine();
	virtual ~CCEngine();

public:
	virtual void setupNativeThread();
    virtual bool setupEngineThread();

	void createRenderer();
    bool setupRenderer();

protected:
    void updateTime();
public:
    virtual bool updateNativeThread();
	virtual void updateEngineThread();
    virtual bool updateJobsThread();

protected:
	virtual void start() = 0;
	virtual void updateLoop() = 0;
	virtual void renderLoop() = 0;

public:
    void renderFrameBuffer(const int frameBufferID);

protected:
	// Finishes a job on the engine thread
	virtual void finishJobs();

public:
	void addCollideable(CCCollideable* collideable);
	void removeCollideable(CCCollideable* collideable);

    virtual void resize();
    virtual void resized();
    virtual bool isOrientationSupported(const float angle);

    // Run on another thread
    void nextEngineUpdate(CCLambdaCallback *lambdaCallback, const int index=-1);
    void engineToNativeThread(CCLambdaCallback *lambdaCallback);
    void nativeToEngineThread(CCLambdaCallback *lambdaCallback);
    void engineToJobsThread(CCLambdaCallback *lambdaCallback, const bool pushToFront=false);
    void jobsToEngineThread(CCLambdaCallback *lambdaCallback);

    virtual void restart();
    virtual void pause();
    virtual void resume();

    virtual void touchBegin(const int index, const float x, const float y);
    virtual void touchMove(const int index, const float x, const float y);
    virtual void touchEnd(const int index);
    virtual void touchUpdateMovementThreasholds();

    virtual bool shouldHandleBackButton();
    virtual void handleBackButton();

    virtual void textureLoaded(CCTextureHandle &textureHandle) {}
	virtual void audioEnded(const char *id, const char *url) {}
};


#define CCLAMBDA_RUN_NATIVETHREAD(FUNCTION_CALL)                    \
CCLAMBDA_UNSAFE( ThreadCallback,                                    \
    FUNCTION_CALL                                                   \
)                                                                   \
if( gEngine != NULL )                                               \
{                                                                   \
    gEngine->engineToNativeThread( new ThreadCallback() );          \
}


#define CCLAMBDA_RUN_ENGINETHREAD(FUNCTION_CALL)                    \
CCLAMBDA_UNSAFE( ThreadCallback,                                    \
   FUNCTION_CALL                                                    \
)                                                                   \
if( gEngine != NULL )                                               \
{                                                                   \
    gEngine->nativeToEngineThread( new ThreadCallback() );          \
}


#endif // __CCENGINE_H__
