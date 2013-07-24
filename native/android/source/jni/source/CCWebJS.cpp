/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCWebJS.cpp
 *-----------------------------------------------------------
 */

#include "CCDefines.h"
#include "CCWebJS.h"

#include "CCAppManager.h"


static CCWebJS *WebJS = NULL;


extern "C" JNIEXPORT void JNICALL Java_com_android2c_CCJNI_WebJSURLLoadedGLThread(JNIEnv *jEnv, jobject jObj, jstring jUrl, jstring jData, jboolean jLoaded)
{
	CCJNI::SetJNIEnv( jEnv );

	// Convert the strings
	jboolean isCopy;
	const char *cUrl = jEnv->GetStringUTFChars( jUrl, &isCopy );
	const char *cData = jEnv->GetStringUTFChars( jData, &isCopy );

	if( WebJS != NULL )
	{
		WebJS->urlLoadedGLThread( cUrl, cData, jLoaded );
	}

	jEnv->ReleaseStringUTFChars( jUrl, cUrl );
	jEnv->ReleaseStringUTFChars( jData, cData );
}


extern "C" JNIEXPORT void JNICALL Java_com_android2c_CCJNI_WebJSJavaScriptResultGLThread(JNIEnv *jEnv, jobject jObj, jstring jData, jboolean jReturnResult)
{
	CCJNI::SetJNIEnv( jEnv );

	// Convert the strings
	jboolean isCopy;
	const char *cData = jEnv->GetStringUTFChars( jData, &isCopy );

	if( WebJS != NULL )
	{
		CCAppManager::WebJSJavaScriptResultNativeThread( cData, jReturnResult );
	}

	jEnv->ReleaseStringUTFChars( jData, cData );
}


CCWebJS::CCWebJS()
{
	ASSERT( WebJS == NULL );
	WebJS = this;
	loaded = false;
}


CCWebJS::~CCWebJS()
{
	WebJS = NULL;

	JNIEnv *jniEnv = CCJNI::Env();
	jclass jniClass = jniEnv->FindClass( "com/android2c/CCJNI" );
	ASSERT_MESSAGE( jniClass != 0, "Could not find Java class." );

	// Get the method ID of our method "urlRequest", which takes one parameter of type string, and returns void
	static jmethodID mid = jniEnv->GetStaticMethodID( jniClass, "WebJSClose", "()V" );
	ASSERT( mid != 0 );

	// Call the function
	jniEnv->CallStaticVoidMethod( jniClass, mid );
}


void CCWebJS::openPage(const char *url, const char *htmlData)
{
	loaded = false;

	JNIEnv *jniEnv = CCJNI::Env();
	jclass jniClass = jniEnv->FindClass( "com/android2c/CCJNI" );
	ASSERT_MESSAGE( jniClass != 0, "Could not find Java class." );

	// Get the method ID of our method "urlRequest", which takes one parameter of type string, and returns void
	static jmethodID mid = jniEnv->GetStaticMethodID( jniClass, "WebJSOpen", "(Ljava/lang/String;Ljava/lang/String;)V" );
	ASSERT( mid != 0 );

	// Call the function
	jstring jURL = jniEnv->NewStringUTF( url );
	jstring jHTMLData = NULL;
	if( htmlData != NULL )
	{
		jHTMLData = jniEnv->NewStringUTF( htmlData );
	}
	jniEnv->CallStaticVoidMethod( jniClass, mid, jURL, jHTMLData );
}


void CCWebJS::openFile(const char *file)
{
	CCText fileURL = "file://";
	fileURL += file;
	openPage( fileURL.buffer );
}


void CCWebJS::urlLoadedGLThread(const char *url, const char *data, const bool loaded)
{
	this->url = url;
	this->loaded = loaded;

    CCAppManager::WebJSLoadedNativeThread( url, data );
}


void CCWebJS::runJavaScript(const char *script, const bool returnResult)
{
	JNIEnv *jniEnv = CCJNI::Env();
	jclass jniClass = jniEnv->FindClass( "com/android2c/CCJNI" );
	ASSERT_MESSAGE( jniClass != 0, "Could not find Java class." );

	// Get the method ID of our method "urlRequest", which takes one parameter of type string, and returns void
	static jmethodID mid = jniEnv->GetStaticMethodID( jniClass, "WebJSRunJavaScript", "(Ljava/lang/String;Z)V" );
	ASSERT( mid != 0 );

	// Call the function
	jstring jScript = jniEnv->NewStringUTF( script );
	jniEnv->CallStaticVoidMethod( jniClass, mid, jScript, returnResult );
}
