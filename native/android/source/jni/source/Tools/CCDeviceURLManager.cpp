/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCDeviceURLManager.cpp
 *-----------------------------------------------------------
 */

#include "CCDefines.h"
#include "CCDeviceURLManager.h"

#include <CCGLView.h>


extern "C" JNIEXPORT void JNICALL Java_com_android2c_CCJNI_URLManagerDownloadFinished(JNIEnv *jEnv, jobject jObj,
		jstring jUrl, jboolean jSuccess, jbyteArray jData, jint jDataLength,
		jobjectArray jHeaderNames, jobjectArray jHeaderValues, jint jHeaderLength)
{
	CCJNI::SetJNIEnv( jEnv );

	// Convert the strings
	jboolean isCopy;
	const char *cUrl = jEnv->GetStringUTFChars( jUrl, &isCopy );
	CCText textURL = cUrl;
	jEnv->ReleaseStringUTFChars( jUrl, cUrl );

	jbyte *jByteData = NULL;
	int cLength = 0;
	if( jData != NULL )
	{
		cLength = jEnv->GetArrayLength( jData );
		jByteData = jEnv->GetByteArrayElements( jData, &isCopy );
	}

	// Parse headers
	CCList<CCText> headerNames;
	CCList<CCText> headerValues;
	for( int i=0; i<jHeaderLength; ++i )
	{
		jstring jHeaderName = (jstring)jEnv->GetObjectArrayElement( jHeaderNames, i );
		if( jHeaderName != NULL )
		{
			const char *cHeaderName = jEnv->GetStringUTFChars( jHeaderName, &isCopy );
			CCText *headerName = new CCText( cHeaderName );
			headerNames.add( headerName );
			jEnv->ReleaseStringUTFChars( jHeaderName, cHeaderName );

			jstring jHeaderValue = (jstring)jEnv->GetObjectArrayElement( jHeaderValues, i );
			const char *cHeaderValue = jEnv->GetStringUTFChars( jHeaderValue, &isCopy );
			CCText *headerValue = new CCText( cHeaderValue );
			headerValues.add( headerValue );
			jEnv->ReleaseStringUTFChars( jHeaderValue, cHeaderValue );
		}
	}

	// Call the relevant function in DeviceURLManager
	gEngine->urlManager->deviceURLManager->downloadFinished( textURL.buffer, jSuccess, (char*)jByteData, jDataLength, headerNames, headerValues );

	jEnv->ReleaseByteArrayElements( jData, jByteData, 0 );
}


CCDeviceURLManager::CCDeviceURLManager()
{
}


void CCDeviceURLManager::clear()
{
    currentRequests.length = 0;
}


bool CCDeviceURLManager::isReadyToRequest()
{
	return true;
}


void CCDeviceURLManager::processRequest(CCURLRequest *inRequest)
{
	ASSERT( inRequest != NULL );
    inRequest->state = CCURLRequest::in_flight;
	currentRequests.add( inRequest );

	JNIEnv *jniEnv = CCJNI::Env();
	jclass jniClass = jniEnv->FindClass( "com/android2c/CCJNI" );
	ASSERT_MESSAGE( jniClass != 0, "Could not find Java class." );

	// Get the method ID of our method "urlRequest", which takes one parameter of type string, and returns void
	static jmethodID mid = jniEnv->GetStaticMethodID( jniClass, "URLManagerProcessRequest", "(Ljava/lang/String;)V" );
	ASSERT( mid != 0 );

	// Call the function
	jstring javaURL = jniEnv->NewStringUTF( inRequest->url.buffer );
	jniEnv->CallStaticVoidMethod( jniClass, mid, javaURL );
}


void CCDeviceURLManager::downloadFinished(const char *url, const bool success,
		const char *data, const int dataLength,
		CCList<CCText> &headerNames, CCList<CCText> &headerValues)
{
	for( int i=0; i<currentRequests.length; ++i )
	{
		CCURLRequest *currentRequest = currentRequests.list[i];
		if( CCText::Equals( currentRequest->url.buffer, url ) )
		{
			// Transfer over the headers
			for( int i=0; i<headerNames.length; ++i )
			{
				currentRequest->header.names.add( headerNames.list[i] );
				currentRequest->header.values.add( headerValues.list[i] );
			}

			if( !success )
			{
				DEBUGLOG( "Download of %s failed.", url );
				currentRequest->state = CCURLRequest::failed;
			}
			else
			{
				currentRequest->state = CCURLRequest::succeeded;
				currentRequest->data.set( data, dataLength );
			}

            currentRequests.remove( currentRequest );
            break;
		}
	}
}
