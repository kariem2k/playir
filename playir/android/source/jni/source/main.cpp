/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : main.cpp
 * Description : JNI entry and interface point.
 *
 * Created     : 15/05/11
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

#include "CCDefines.h"
#include "CCApp.h"
#include "CCDeviceControls.h"
#include "CCDeviceURLManager.h"

#include "CCAppManager.h"


static void printGLString(const char *name, GLenum s)
{
    const char *v = (const char *)glGetString( s );
    DEBUGLOG( "GL %s = %s\n", name, v );
}


extern "C" JNIEXPORT void JNICALL Java_com_android2c_CCJNI_OnSurfaceChanged(JNIEnv *jEnv, jobject jObj, jboolean firstRun, jint jWidth, jint jHeight)
{
	CCJNI::SetJNIEnv( jEnv );

#ifdef DEBUGON
	// Now we can do what we intended
	printGLString( "Version", GL_VERSION );
	printGLString( "Vendor", GL_VENDOR );
	printGLString( "Renderer", GL_RENDERER );
	printGLString( "Extensions", GL_EXTENSIONS );
#endif

	DEBUGLOG( "OnSurfaceChanged" );

	// Get our app manager to create the glView
	if( gView == NULL )
	{
		CCAppManager::Startup();
	}
	gView->resizeView( jWidth, jHeight );

	if( firstRun )
	{
		if( gEngine != NULL )
		{
			// Force close any previous web view instances
			CCAppManager::WebViewClose( true );
			CCAppManager::WebJSClose( true );

			delete gEngine;
			gEngine = NULL;
		}
	}

	if( gEngine != NULL )
	{
		DEBUGLOG( "OnSurfaceChanged - resuming %f", gEngine->time.lifetime );
		gEngine->setupRenderer();
	}

	DEBUGLOG( "OnSurfaceChanged - END" );

	usleep( 16 );	// Sleep for 16 ms

#if defined PROFILEON
    CCProfiler::open();
#endif
}


extern "C" JNIEXPORT void JNICALL Java_com_android2c_CCJNI_OnDrawFrame(JNIEnv *jEnv, jobject jObj)
{
	CCJNI::SetJNIEnv( jEnv );

	if( gView != NULL )
	{
		if( gEngine == NULL )
		{
			gEngine = new CCAppEngine();
			gEngine->setupNativeThread();

			gEngine->createRenderer();
			gEngine->setupEngineThread();
		}
		else if( gEngine->running )
		{
			//DEBUGLOG( "gEngine->running" );
			gEngine->updateNativeThread();
			gEngine->updateEngineThread();
		}
	}

	//DEBUGLOG( "OnDrawFrame - END" );

#if defined PROFILEON
    CCProfiler::save();
#endif
}


unsigned int countCores()
{
    return (unsigned int)sysconf( _SC_NPROCESSORS_ONLN );
}


extern "C" JNIEXPORT void JNICALL Java_com_android2c_CCJNI_OnJobsThread(JNIEnv *jEnv, jobject jObj)
{
	static ThreadMutex threadmutex;
    pthread_mutex_lock( &threadmutex.mutex );

	if( gEngine == NULL || gEngine->paused )
	{
		// Sleep for 1 second
		usleep( 1000000 );
	}
	else
	{
		CCJNI::SetJNIEnv( jEnv );

		gEngine->updateJobsThread();

		// Sleep at 4 jobs per second max * cores
		static uint cores = countCores();
		static uint timeout = ( 1000000 / 4 ) / cores;
		usleep( timeout );
	}

    pthread_mutex_unlock( &threadmutex.mutex );
}


extern "C" JNIEXPORT void JNICALL Java_com_android2c_CCJNI_AppPausedUIThread(JNIEnv *jEnv, jobject jObj)
{
	CCJNI::SetJNIEnv( jEnv );

	if( gEngine != NULL )
	{
		gEngine->pause();
	}
}


extern "C" JNIEXPORT void JNICALL Java_com_android2c_CCJNI_AppResumedUIThread(JNIEnv *jEnv, jobject jObj)
{
	CCJNI::SetJNIEnv( jEnv );

	if( gEngine != NULL )
	{
		gEngine->resume();
	}
}


extern "C" JNIEXPORT bool JNICALL Java_com_android2c_CCJNI_ControlsHandleBackButton(JNIEnv *jEnv, jobject jObj)
{
	CCJNI::SetJNIEnv( jEnv );

	if( gEngine != NULL )
	{
		return gEngine->shouldHandleBackButton();
	}
	return false;
}
