/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCDeviceAudioManager.cpp
 *-----------------------------------------------------------
 */

#include "CCDefines.h"
#include "CCAppManager.h"
#include "CCFileManager.h"
#include "CCDeviceAudioManager.h"


void CCDeviceAudioManager::Reset()
{
	JNIEnv *jniEnv = CCJNI::Env();
	jclass jniClass = jniEnv->FindClass( "com/android2c/CCJNI" );
	ASSERT_MESSAGE( jniClass != 0, "Could not find Java class." );

	// Get the method ID of our method "stopVideoView", which takes 0 parameters, and returns void
	static jmethodID mid = jniEnv->GetStaticMethodID( jniClass, "AudioManagerReset", "()V" );
	ASSERT( mid != 0 );

	// Call the function
	jniEnv->CallStaticVoidMethod( jniClass, mid );
}


void CCDeviceAudioManager::Prepare(const char *id, const char *url)
{
	CCResourceType resourceType = CCFileManager::FindFile( url );
	CCText path;
	CCFileManager::GetFilePath( path, url, resourceType );

	JNIEnv *jniEnv = CCJNI::Env();
	jclass jniClass = jniEnv->FindClass( "com/android2c/CCJNI" );
	ASSERT_MESSAGE( jniClass != 0, "Could not find Java class." );

	// Get the method ID of our method "urlRequest", which takes one parameter of type string, and returns void
	static jmethodID mid = jniEnv->GetStaticMethodID( jniClass, "AudioManagerPrepare", "(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V" );
	ASSERT( mid != 0 );

	// Call the function
	jstring jId = jniEnv->NewStringUTF( id );
	jstring jUrl = jniEnv->NewStringUTF( url );
	jstring jPath = jniEnv->NewStringUTF( path.buffer );
	jniEnv->CallStaticVoidMethod( jniClass, mid, jId, jUrl, jPath );
}


void CCDeviceAudioManager::Play(const char *id, const char *url, const bool restart, const bool loop)
{
	CCResourceType resourceType = CCFileManager::FindFile( url );
	CCText path;
	CCFileManager::GetFilePath( path, url, resourceType );

	JNIEnv *jniEnv = CCJNI::Env();
	jclass jniClass = jniEnv->FindClass( "com/android2c/CCJNI" );
	ASSERT_MESSAGE( jniClass != 0, "Could not find Java class." );

	// Get the method ID of our method "urlRequest", which takes one parameter of type string, and returns void
	static jmethodID mid = jniEnv->GetStaticMethodID( jniClass, "AudioManagerPlay", "(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;ZZ)V" );
	ASSERT( mid != 0 );

	// Call the function
	jstring jId = jniEnv->NewStringUTF( id );
	jstring jUrl = jniEnv->NewStringUTF( url );
	jstring jPath = jniEnv->NewStringUTF( path.buffer );
	jniEnv->CallStaticVoidMethod( jniClass, mid, jId, jUrl, jPath, restart, loop );
}


void CCDeviceAudioManager::Stop(const char *id)
{
	JNIEnv *jniEnv = CCJNI::Env();
	jclass jniClass = jniEnv->FindClass( "com/android2c/CCJNI" );
	ASSERT_MESSAGE( jniClass != 0, "Could not find Java class." );

	// Get the method ID of our method "urlRequest", which takes one parameter of type string, and returns void
	static jmethodID mid = jniEnv->GetStaticMethodID( jniClass, "AudioManagerStop", "(Ljava/lang/String;)V" );
	ASSERT( mid != 0 );

	// Call the function
	jstring jId = jniEnv->NewStringUTF( id );
	jniEnv->CallStaticVoidMethod( jniClass, mid, jId );
}


void CCDeviceAudioManager::Pause(const char *id)
{
	JNIEnv *jniEnv = CCJNI::Env();
	jclass jniClass = jniEnv->FindClass( "com/android2c/CCJNI" );
	ASSERT_MESSAGE( jniClass != 0, "Could not find Java class." );

	// Get the method ID of our method "urlRequest", which takes one parameter of type string, and returns void
	static jmethodID mid = jniEnv->GetStaticMethodID( jniClass, "AudioManagerPause", "(Ljava/lang/String;)V" );
	ASSERT( mid != 0 );

	// Call the function
	jstring jId = jniEnv->NewStringUTF( id );
	jniEnv->CallStaticVoidMethod( jniClass, mid, jId );
}


void CCDeviceAudioManager::Resume(const char *id)
{
	JNIEnv *jniEnv = CCJNI::Env();
	jclass jniClass = jniEnv->FindClass( "com/android2c/CCJNI" );
	ASSERT_MESSAGE( jniClass != 0, "Could not find Java class." );

	// Get the method ID of our method "urlRequest", which takes one parameter of type string, and returns void
	static jmethodID mid = jniEnv->GetStaticMethodID( jniClass, "AudioManagerResume", "(Ljava/lang/String;)V" );
	ASSERT( mid != 0 );

	// Call the function
	jstring jId = jniEnv->NewStringUTF( id );
	jniEnv->CallStaticVoidMethod( jniClass, mid, jId );
}


void CCDeviceAudioManager::SetTime(const char *id, const float time)
{
	JNIEnv *jniEnv = CCJNI::Env();
	jclass jniClass = jniEnv->FindClass( "com/android2c/CCJNI" );
	ASSERT_MESSAGE( jniClass != 0, "Could not find Java class." );

	// Get the method ID of our method "urlRequest", which takes one parameter of type string, and returns void
	static jmethodID mid = jniEnv->GetStaticMethodID( jniClass, "AudioManagerSetTime", "(Ljava/lang/String;F)V" );
	ASSERT( mid != 0 );

	// Call the function
	jstring jId = jniEnv->NewStringUTF( id );
	jniEnv->CallStaticVoidMethod( jniClass, mid, jId, time );
}


void CCDeviceAudioManager::SetVolume(const char *id, const float volume)
{
	JNIEnv *jniEnv = CCJNI::Env();
	jclass jniClass = jniEnv->FindClass( "com/android2c/CCJNI" );
	ASSERT_MESSAGE( jniClass != 0, "Could not find Java class." );

	// Get the method ID of our method "urlRequest", which takes one parameter of type string, and returns void
	static jmethodID mid = jniEnv->GetStaticMethodID( jniClass, "AudioManagerSetVolume", "(Ljava/lang/String;F)V" );
	ASSERT( mid != 0 );

	// Call the function
	jstring jId = jniEnv->NewStringUTF( id );
	jniEnv->CallStaticVoidMethod( jniClass, mid, jId, volume );
}



extern "C" JNIEXPORT void JNICALL Java_com_android2c_CCJNI_AudioManagerEnded(JNIEnv *jEnv, jobject jObj, jstring jId, jstring jUrl)
{
	CCJNI::SetJNIEnv( jEnv );

	// Convert the strings
	jboolean isCopy;
	const char *cId = jEnv->GetStringUTFChars( jId, &isCopy );
	const char *cUrl = jEnv->GetStringUTFChars( jUrl, &isCopy );

	// Process ended
	CCAudioManager::Ended( cId, cUrl );

	jEnv->ReleaseStringUTFChars( jId, cId );
	jEnv->ReleaseStringUTFChars( jUrl, cUrl );
}
