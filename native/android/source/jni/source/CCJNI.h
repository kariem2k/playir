/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCJNI.h
 * Description : C++ JNI interface class to CCJNI.java
 *
 * Created     : 08/10/11
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

#ifndef __CCJNI_H__
#define __CCJNI_H__


#include <jni.h>


class CCJNI
{
public:
	static void SetJNIEnv(JNIEnv *env);
	static JNIEnv* Env();

	static void Assert(const char *file, const int line, const char *message);

	static void WebBrowserOpen(const char *url);

	static void VideoViewStart(const char *file);
	static void VideoViewStop();

	// Google Services
	static void GoogleServicesRegister();

	static void AdvertsToggle(const bool toggle);

	static void BillingRequestPurchase(const char *productID, const bool consumable);

	static void GCMRegister();
	static void GCMUnregister();

	static void MessageJava(const char *key, const char *value);
};


#endif // __CCJNI_H__
