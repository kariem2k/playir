/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCJNI.cpp
 *-----------------------------------------------------------
 */

#include "CCDefines.h"
#include "CCAppManager.h"


struct JNIEnvPacket
{
	JNIEnvPacket()
	{
		threadID = -1;
		jniEnv = NULL;
	}
	pthread_t threadID;
	JNIEnv *jniEnv;
};
#define MAX_THREADS 100
static JNIEnvPacket JNIEnvPackets[MAX_THREADS];


void CCJNI::SetJNIEnv(JNIEnv *env)
{
	pthread_t threadID = pthread_self();
	for( int i=0; i<MAX_THREADS; ++i )
	{
		JNIEnvPacket &packet = JNIEnvPackets[i];
		if( packet.threadID == -1 || packet.threadID == threadID )
		{
			packet.threadID = threadID;
			if( packet.jniEnv != env )
			{
				packet.jniEnv = env;
			}
			return;
		}
	}
	CCASSERT( false );
}


JNIEnv* CCJNI::Env()
{
	pthread_t threadID = pthread_self();
	for( int i=0; i<MAX_THREADS; ++i )
	{
		JNIEnvPacket &packet = JNIEnvPackets[i];
		if( packet.threadID == threadID )
		{
			return packet.jniEnv;
		}
	}
	CCASSERT( false );
	return NULL;
}


void CCJNI::Assert(const char *file, const int line, const char *message)
{
	JNIEnv *jniEnv = CCJNI::Env();
	jclass jniClass = jniEnv->FindClass( "com/android2c/CCJNI" );
	CCASSERT_MESSAGE( jniClass != 0, "Could not find Java class." );

	// Get the method ID of our method "urlRequest", which takes one parameter of type string, and returns void
	static jmethodID mid = jniEnv->GetStaticMethodID( jniClass, "Assert", "(Ljava/lang/String;ILjava/lang/String;)V" );
	CCASSERT( mid != 0 );

	// Call the function
	jstring jFile = jniEnv->NewStringUTF( file );
	jstring jMessage = jniEnv->NewStringUTF( message );
	jniEnv->CallStaticVoidMethod( jniClass, mid, jFile, line, jMessage );
}


void CCJNI::WebBrowserOpen(const char *url)
{
	JNIEnv *jniEnv = CCJNI::Env();
	jclass jniClass = jniEnv->FindClass( "com/android2c/CCJNI" );
	CCASSERT_MESSAGE( jniClass != 0, "Could not find Java class." );

	// Get the method ID of our method "urlRequest", which takes one parameter of type string, and returns void
	static jmethodID mid = jniEnv->GetStaticMethodID( jniClass, "WebBrowserOpen", "(Ljava/lang/String;)V" );
	CCASSERT( mid != 0 );

	// Call the function
	jstring javaURL = jniEnv->NewStringUTF( url );
	jniEnv->CallStaticVoidMethod( jniClass, mid, javaURL );
}


void CCJNI::VideoViewStart(const char *file)
{
	JNIEnv *jniEnv = CCJNI::Env();
	jclass jniClass = jniEnv->FindClass( "com/android2c/CCJNI" );
	CCASSERT_MESSAGE( jniClass != 0, "Could not find Java class." );

	// Get the method ID of our method "startVideoView", which takes one parameter of type string, and returns void
	static jmethodID mid = jniEnv->GetStaticMethodID( jniClass, "VideoViewStart", "(Ljava/lang/String;)V" );
	CCASSERT( mid != 0 );

	// Call the function
	jstring javaFile = jniEnv->NewStringUTF( file );
	jniEnv->CallStaticVoidMethod( jniClass, mid, javaFile );
}


void CCJNI::VideoViewStop()
{
	JNIEnv *jniEnv = CCJNI::Env();
	jclass jniClass = jniEnv->FindClass( "com/android2c/CCJNI" );
	CCASSERT_MESSAGE( jniClass != 0, "Could not find Java class." );

	// Get the method ID of our method "stopVideoView", which takes 0 parameters, and returns void
	static jmethodID mid = jniEnv->GetStaticMethodID( jniClass, "VideoViewStop", "()V" );
	CCASSERT( mid != 0 );

	// Call the function
	jniEnv->CallStaticVoidMethod( jniClass, mid );
}


void CCJNI::GoogleServicesRegister(const char *ANDROID_ID)
{
	JNIEnv *jniEnv = CCJNI::Env();
	jclass jniClass = jniEnv->FindClass( "com/android2c/CCJNI" );
	CCASSERT_MESSAGE( jniClass != 0, "Could not find Java class." );

	// Get the method ID of our method "stopVideoView", which takes 0 parameters, and returns void
	static jmethodID mid = jniEnv->GetStaticMethodID( jniClass, "GoogleServicesRegister", "(Ljava/lang/String;)V" );
	CCASSERT( mid != 0 );

	// Call the function
	jstring jAndroid_ID = jniEnv->NewStringUTF( ANDROID_ID );
	jniEnv->CallStaticVoidMethod( jniClass, mid, jAndroid_ID );
}


void CCJNI::AdvertsToggle(const bool toggle)
{
	JNIEnv *jniEnv = CCJNI::Env();
	jclass jniClass = jniEnv->FindClass( "com/android2c/CCJNI" );
	CCASSERT_MESSAGE( jniClass != 0, "Could not find Java class." );

	// Get the method ID of our method "urlRequest", which takes one parameter of type string, and returns void
	static jmethodID mid = jniEnv->GetStaticMethodID( jniClass, "AdvertsToggle", "(Z)V" );
	CCASSERT( mid != 0 );

	// Call the function
	jniEnv->CallStaticVoidMethod( jniClass, mid, toggle );
}


void CCJNI::BillingRequestPurchase(const char *productID, const bool consumable)
{
	JNIEnv *jniEnv = CCJNI::Env();
	CCText androidProductID = productID;
	androidProductID.toLowerCase();

	jclass jniClass = jniEnv->FindClass( "com/android2c/CCJNI" );
	CCASSERT_MESSAGE( jniClass != 0, "Could not find Java class." );

	// Get the method ID of our method "startVideoView", which takes one parameter of type string, and returns void
	static jmethodID mid = jniEnv->GetStaticMethodID( jniClass, "BillingRequestPurchase", "(Ljava/lang/String;Z)V" );
	CCASSERT( mid != 0 );

	// Call the function
	jstring javaProductID = jniEnv->NewStringUTF( androidProductID.buffer );
	jniEnv->CallStaticVoidMethod( jniClass, mid, javaProductID, consumable );
}


extern "C" JNIEXPORT void JNICALL Java_com_android2c_CCJNI_BillingItemPurchasedGLThread(JNIEnv *jEnv, jobject jObj)
{
	CCJNI::SetJNIEnv( jEnv );

	CCAppManager::InAppPurchaseSuccessful();
}


void CCJNI::GCMRegister()
{
	JNIEnv *jniEnv = CCJNI::Env();
	jclass jniClass = jniEnv->FindClass( "com/android2c/CCJNI" );
	CCASSERT_MESSAGE( jniClass != 0, "Could not find Java class." );

	// Get the method ID of our method "stopVideoView", which takes 0 parameters, and returns void
	static jmethodID mid = jniEnv->GetStaticMethodID( jniClass, "GCMRegister", "()V" );
	CCASSERT( mid != 0 );

	// Call the function
	jniEnv->CallStaticVoidMethod( jniClass, mid );
}


void CCJNI::GCMUnregister()
{
	JNIEnv *jniEnv = CCJNI::Env();
	jclass jniClass = jniEnv->FindClass( "com/android2c/CCJNI" );
	CCASSERT_MESSAGE( jniClass != 0, "Could not find Java class." );

	// Get the method ID of our method "stopVideoView", which takes 0 parameters, and returns void
	static jmethodID mid = jniEnv->GetStaticMethodID( jniClass, "GCMUnregister", "()V" );
	CCASSERT( mid != 0 );

	// Call the function
	jniEnv->CallStaticVoidMethod( jniClass, mid );
}


// Should make this messenger functions more generic with other apps in future
void CCJNI::MessageJava(const char *key, const char *value)
{
	JNIEnv *jniEnv = CCJNI::Env();
	jclass jniClass = jniEnv->FindClass( "com/android2c/CCJNI" );
	CCASSERT_MESSAGE( jniClass != 0, "Could not find Java class." );

	// Get the method ID of our method "startVideoView", which takes one parameter of type string, and returns void
	static jmethodID mid = jniEnv->GetStaticMethodID( jniClass, "MessageJava"
			"", "(Ljava/lang/String;Ljava/lang/String;)V" );
	CCASSERT( mid != 0 );

	// Call the function
	jstring javaKey = jniEnv->NewStringUTF( key );
	jstring javaValue = jniEnv->NewStringUTF( value );
	jniEnv->CallStaticVoidMethod( jniClass, mid, javaKey, javaValue );
}


extern "C" JNIEXPORT void JNICALL Java_com_android2c_CCJNI_MessageNDKGLThread(JNIEnv *jEnv, jobject jObj, jstring jKey, jstring jValue)
{
	CCJNI::SetJNIEnv( jEnv );

	// Convert the strings
	jboolean isCopy;
	const char *cKey = jEnv->GetStringUTFChars( jKey, &isCopy );
	const char *cValue = jEnv->GetStringUTFChars( jValue, &isCopy );

	class ThreadCallback : public CCLambdaCallback
	{
	public:
		ThreadCallback(const char *key, const char *value)
		{
			this->key = key;
			this->value = value;
		}
		void run()
		{
		}
	private:
		CCText key;
		CCText value;
	};

	if( gEngine != NULL )
	{
		gEngine->engineToNativeThread( new ThreadCallback( cKey, cValue ) );
	}

	jEnv->ReleaseStringUTFChars( jKey, cKey );
	jEnv->ReleaseStringUTFChars( jValue, cValue );
}

