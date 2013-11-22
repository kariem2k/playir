/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCWebView.cpp
 *-----------------------------------------------------------
 */

#include "CCDefines.h"
#include "CCWebView.h"

#include "CCAppManager.h"


static CCWebView *WebView = NULL;


extern "C" JNIEXPORT void JNICALL Java_com_android2c_CCJNI_WebViewURLLoadedGLThread(JNIEnv *jEnv, jobject jObj, jstring jUrl, jstring jData, jboolean jLoaded)
{
	CCJNI::SetJNIEnv( jEnv );

	// Convert the strings
	jboolean isCopy;
	const char *cUrl = jEnv->GetStringUTFChars( jUrl, &isCopy );
	const char *cData = jEnv->GetStringUTFChars( jData, &isCopy );

	if( WebView != NULL )
	{
		WebView->urlLoadedGLThread( cUrl, cData, jLoaded );
	}

	jEnv->ReleaseStringUTFChars( jUrl, cUrl );
	jEnv->ReleaseStringUTFChars( jData, cData );
}


CCWebView::CCWebView()
{
	CCASSERT( WebView == NULL );
	WebView = this;
	loaded = false;
	hidden = false;
}


CCWebView::~CCWebView()
{
	WebView = NULL;

	JNIEnv *jniEnv = CCJNI::Env();
	jclass jniClass = jniEnv->FindClass( "com/android2c/CCJNI" );
	CCASSERT_MESSAGE( jniClass != 0, "Could not find Java class." );

	// Get the method ID of our method "urlRequest", which takes one parameter of type string, and returns void
	static jmethodID mid = jniEnv->GetStaticMethodID( jniClass, "WebViewClose", "()V" );
	CCASSERT( mid != 0 );

	// Call the function
	jniEnv->CallStaticVoidMethod( jniClass, mid );
}


void CCWebView::openPage(const char *url)
{
	loaded = false;

	JNIEnv *jniEnv = CCJNI::Env();
	jclass jniClass = jniEnv->FindClass( "com/android2c/CCJNI" );
	CCASSERT_MESSAGE( jniClass != 0, "Could not find Java class." );

	// Get the method ID of our method "urlRequest", which takes one parameter of type string, and returns void
	static jmethodID mid = jniEnv->GetStaticMethodID( jniClass, "WebViewOpen", "(Ljava/lang/String;Z)V" );
	CCASSERT( mid != 0 );

	// Call the function
	jstring javaURL = jniEnv->NewStringUTF( url );
	jniEnv->CallStaticVoidMethod( jniClass, mid, javaURL, false );
}


void CCWebView::urlLoadedGLThread(const char *url, const char *data, const bool loaded)
{
	this->url = url;
	this->loaded = loaded;

    CCAppManager::WebViewLoadedNativeThread( url, data );
}


void CCWebView::ClearData()
{
	JNIEnv *jniEnv = CCJNI::Env();
	jclass jniClass = jniEnv->FindClass( "com/android2c/CCJNI" );
	CCASSERT_MESSAGE( jniClass != 0, "Could not find Java class." );

	// Get the method ID of our method "urlRequest", which takes one parameter of type string, and returns void
	static jmethodID mid = jniEnv->GetStaticMethodID( jniClass, "WebViewClearData", "()V" );
	CCASSERT( mid != 0 );

	// Call the function
	jniEnv->CallStaticVoidMethod( jniClass, mid );
}
