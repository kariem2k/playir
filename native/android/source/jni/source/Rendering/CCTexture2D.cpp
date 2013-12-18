/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCTexture2D.cpp
 *-----------------------------------------------------------
 */

#include "CCDefines.h"
#include "CCTexture2D.h"
#include "CCTextureManager.h"

#include "CCGLView.h"


CCTexture2D::CCTexture2D()
{
}


CCTexture2D::~CCTexture2D()
{
}


static bool JNIDoesTextureExist(const char *name, const bool packaged)
{
	if( packaged )
	{
		// Needs to start alphabetical
		if( !( name[0] >= 65 && name[0] <= 90 || name[0] >= 97 && name[0] <= 122 ) )
		{
			return false;
		}
	}

	JNIEnv *jniEnv = CCJNI::Env();
	jclass jniClass = jniEnv->FindClass( "com/android2c/CCJNI" );
	CCASSERT_MESSAGE( jniClass != 0, "Could not find Java class." );

	static jmethodID mid = jniEnv->GetStaticMethodID( jniClass, "Texture2DDoesTextureExist", "(Ljava/lang/String;Z)Z" );
	CCASSERT( mid != 0 );

	// Call the function
	jstring jFilename = jniEnv->NewStringUTF( name );
	const bool result = jniEnv->CallStaticBooleanMethod( jniClass, mid, jFilename, packaged );
	jniEnv->DeleteLocalRef( jFilename );
	return result;
}


static bool JNILoad(const char *name, const bool packaged)
{
	JNIEnv *jniEnv = CCJNI::Env();
	jclass jniClass = jniEnv->FindClass( "com/android2c/CCJNI" );
	CCASSERT_MESSAGE( jniClass != 0, "Could not find Java class." );

	static jmethodID mid = jniEnv->GetStaticMethodID( jniClass, "Texture2DLoad", "(Ljava/lang/String;Z)Z" );
	CCASSERT( mid != 0 );

	// Call the function
	jstring jFilename = jniEnv->NewStringUTF( name );
	const bool result = jniEnv->CallStaticBooleanMethod( jniClass, mid, jFilename, packaged );
	return result;
}


static int JNIGetImageWidth(const char *name, const bool packaged)
{
	JNIEnv *jniEnv = CCJNI::Env();
	jclass jniClass = jniEnv->FindClass( "com/android2c/CCJNI" );
	CCASSERT_MESSAGE( jniClass != 0, "Could not find Java class." );

	static jmethodID mid = jniEnv->GetStaticMethodID( jniClass, "Texture2DGetImageWidth", "(Ljava/lang/String;Z)I" );
	CCASSERT( mid != 0 );

	// Call the function
	jstring jFilename = jniEnv->NewStringUTF( name );
	return jniEnv->CallStaticIntMethod( jniClass, mid, jFilename, packaged );
}


static int JNIGetImageHeight(const char *name, const bool packaged)
{
	JNIEnv *jniEnv = CCJNI::Env();
	jclass jniClass = jniEnv->FindClass( "com/android2c/CCJNI" );
	CCASSERT_MESSAGE( jniClass != 0, "Could not find Java class." );

	static jmethodID mid = jniEnv->GetStaticMethodID( jniClass, "Texture2DGetImageHeight", "(Ljava/lang/String;Z)I" );
	CCASSERT( mid != 0 );

	// Call the function
	jstring jFilename = jniEnv->NewStringUTF( name );
	return jniEnv->CallStaticIntMethod( jniClass, mid, jFilename, packaged );
}


static int JNIGetRawWidth(const char *name, const bool packaged)
{
	JNIEnv *jniEnv = CCJNI::Env();
	jclass jniClass = jniEnv->FindClass( "com/android2c/CCJNI" );
	CCASSERT_MESSAGE( jniClass != 0, "Could not find Java class." );

	static jmethodID mid = jniEnv->GetStaticMethodID( jniClass, "Texture2DGetRawWidth", "(Ljava/lang/String;Z)I" );
	CCASSERT( mid != 0 );

	// Call the function
	jstring jFilename = jniEnv->NewStringUTF( name );
	return jniEnv->CallStaticIntMethod( jniClass, mid, jFilename, packaged );
}


static int JNIGetRawHeight(const char *name, const bool packaged)
{
	JNIEnv *jniEnv = CCJNI::Env();
	jclass jniClass = jniEnv->FindClass( "com/android2c/CCJNI" );
	CCASSERT_MESSAGE( jniClass != 0, "Could not find Java class." );

	static jmethodID mid = jniEnv->GetStaticMethodID( jniClass, "Texture2DGetRawHeight", "(Ljava/lang/String;Z)I" );
	CCASSERT( mid != 0 );

	// Call the function
	jstring jFilename = jniEnv->NewStringUTF( name );
	return jniEnv->CallStaticIntMethod( jniClass, mid, jFilename, packaged );
}


static int JNIGetAllocatedHeight(const char *name, const bool packaged)
{
	JNIEnv *jniEnv = CCJNI::Env();
	jclass jniClass = jniEnv->FindClass( "com/android2c/CCJNI" );
	CCASSERT_MESSAGE( jniClass != 0, "Could not find Java class." );

	static jmethodID mid = jniEnv->GetStaticMethodID( jniClass, "Texture2DGetAllocatedHeight", "(Ljava/lang/String;Z)I" );
	CCASSERT( mid != 0 );

	// Call the function
	jstring jFilename = jniEnv->NewStringUTF( name );
	return jniEnv->CallStaticIntMethod( jniClass, mid, jFilename, packaged );
}


static int JNICreateGL(const char *name, const bool packaged, const bool generateMipMap)
{
	JNIEnv *jniEnv = CCJNI::Env();
	jclass jniClass = jniEnv->FindClass( "com/android2c/CCJNI" );
	CCASSERT_MESSAGE( jniClass != 0, "Could not find Java class." );

	static jmethodID mid = jniEnv->GetStaticMethodID( jniClass, "Texture2DCreateGL", "(Ljava/lang/String;ZZ)I" );
	CCASSERT( mid != 0 );

	// Call the function
	jstring jFilename = jniEnv->NewStringUTF( name );
	const int result = jniEnv->CallStaticIntMethod( jniClass, mid, jFilename, packaged, generateMipMap );
	return result;
}


bool CCTexture2D::load(const char *path, const CCResourceType resourceType)
{
#if defined PROFILEON
    CCProfiler profile( "CCTexture2D::load()" );
#endif

	filename = path;
	filename.stripDirectory();
	filename.toLowerCase();
	this->resourceType = resourceType;

	if( JNILoad( filename.buffer, resourceType == Resource_Packaged ) )
	{
		allocatedWidth = imageWidth = JNIGetImageWidth( filename.buffer, resourceType == Resource_Packaged );
		imageHeight = JNIGetImageHeight( filename.buffer, resourceType == Resource_Packaged );
		allocatedHeight = JNIGetAllocatedHeight( filename.buffer, resourceType == Resource_Packaged );

		rawWidth = JNIGetRawWidth( filename.buffer, resourceType == Resource_Packaged );
		rawHeight = JNIGetRawHeight( filename.buffer, resourceType == Resource_Packaged );

		// TODO: pretend it's always 4 bytes on Android, look into getting actual pixel size data
		allocatedBytes = allocatedWidth * allocatedHeight * 4;
		return true;
	}
	return false;
}


void CCTexture2D::createGLTexture(const bool generateMipMap)
{
	glName = JNICreateGL( filename.buffer, resourceType == Resource_Packaged, generateMipMap );
}


bool CCTexture2D::DoesTextureExist(const char *path, const CCResourceType resourceType)
{
	CCText filename = path;
	filename.stripDirectory();
	filename.toLowerCase();
	return JNIDoesTextureExist( filename.buffer, resourceType == Resource_Packaged );
}
