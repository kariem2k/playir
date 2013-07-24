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


static bool JniDoesTextureExist(const char *name, const bool packaged)
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
	ASSERT_MESSAGE( jniClass != 0, "Could not find Java class." );

	static jmethodID mid = jniEnv->GetStaticMethodID( jniClass, "Texture2DDoesTextureExist", "(Ljava/lang/String;Z)Z" );
	ASSERT( mid != 0 );

	// Call the function
	jstring jFilename = jniEnv->NewStringUTF( name );
	const bool result = jniEnv->CallStaticBooleanMethod( jniClass, mid, jFilename, packaged );
	return result;
}


static bool JniLoad(const char *name, const bool packaged)
{
	JNIEnv *jniEnv = CCJNI::Env();
	jclass jniClass = jniEnv->FindClass( "com/android2c/CCJNI" );
	ASSERT_MESSAGE( jniClass != 0, "Could not find Java class." );

	static jmethodID mid = jniEnv->GetStaticMethodID( jniClass, "Texture2DLoad", "(Ljava/lang/String;Z)Z" );
	ASSERT( mid != 0 );

	// Call the function
	jstring jFilename = jniEnv->NewStringUTF( name );
	const bool result = jniEnv->CallStaticIntMethod( jniClass, mid, jFilename, packaged );
	return result;
}


static int JniGetImageWidth(const char *name, const bool packaged)
{
	JNIEnv *jniEnv = CCJNI::Env();
	jclass jniClass = jniEnv->FindClass( "com/android2c/CCJNI" );
	ASSERT_MESSAGE( jniClass != 0, "Could not find Java class." );

	static jmethodID mid = jniEnv->GetStaticMethodID( jniClass, "Texture2DGetImageWidth", "(Ljava/lang/String;Z)I" );
	ASSERT( mid != 0 );

	// Call the function
	jstring jFilename = jniEnv->NewStringUTF( name );
	return jniEnv->CallStaticIntMethod( jniClass, mid, jFilename, packaged );
}


static int JniGetImageHeight(const char *name, const bool packaged)
{
	JNIEnv *jniEnv = CCJNI::Env();
	jclass jniClass = jniEnv->FindClass( "com/android2c/CCJNI" );
	ASSERT_MESSAGE( jniClass != 0, "Could not find Java class." );

	static jmethodID mid = jniEnv->GetStaticMethodID( jniClass, "Texture2DGetImageHeight", "(Ljava/lang/String;Z)I" );
	ASSERT( mid != 0 );

	// Call the function
	jstring jFilename = jniEnv->NewStringUTF( name );
	return jniEnv->CallStaticIntMethod( jniClass, mid, jFilename, packaged );
}


static int JniGetRawWidth(const char *name, const bool packaged)
{
	JNIEnv *jniEnv = CCJNI::Env();
	jclass jniClass = jniEnv->FindClass( "com/android2c/CCJNI" );
	ASSERT_MESSAGE( jniClass != 0, "Could not find Java class." );

	static jmethodID mid = jniEnv->GetStaticMethodID( jniClass, "Texture2DGetRawWidth", "(Ljava/lang/String;Z)I" );
	ASSERT( mid != 0 );

	// Call the function
	jstring jFilename = jniEnv->NewStringUTF( name );
	return jniEnv->CallStaticIntMethod( jniClass, mid, jFilename, packaged );
}


static int JniGetRawHeight(const char *name, const bool packaged)
{
	JNIEnv *jniEnv = CCJNI::Env();
	jclass jniClass = jniEnv->FindClass( "com/android2c/CCJNI" );
	ASSERT_MESSAGE( jniClass != 0, "Could not find Java class." );

	static jmethodID mid = jniEnv->GetStaticMethodID( jniClass, "Texture2DGetRawHeight", "(Ljava/lang/String;Z)I" );
	ASSERT( mid != 0 );

	// Call the function
	jstring jFilename = jniEnv->NewStringUTF( name );
	return jniEnv->CallStaticIntMethod( jniClass, mid, jFilename, packaged );
}


static int JniGetAllocatedHeight(const char *name, const bool packaged)
{
	JNIEnv *jniEnv = CCJNI::Env();
	jclass jniClass = jniEnv->FindClass( "com/android2c/CCJNI" );
	ASSERT_MESSAGE( jniClass != 0, "Could not find Java class." );

	static jmethodID mid = jniEnv->GetStaticMethodID( jniClass, "Texture2DGetAllocatedHeight", "(Ljava/lang/String;Z)I" );
	ASSERT( mid != 0 );

	// Call the function
	jstring jFilename = jniEnv->NewStringUTF( name );
	return jniEnv->CallStaticIntMethod( jniClass, mid, jFilename, packaged );
}


static int JniCreateGL(const char *name, const bool packaged, const bool generateMipMap)
{
	JNIEnv *jniEnv = CCJNI::Env();
	jclass jniClass = jniEnv->FindClass( "com/android2c/CCJNI" );
	ASSERT_MESSAGE( jniClass != 0, "Could not find Java class." );

	static jmethodID mid = jniEnv->GetStaticMethodID( jniClass, "Texture2DCreateGL", "(Ljava/lang/String;ZZ)I" );
	ASSERT( mid != 0 );

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

	if( JniLoad( filename.buffer, resourceType == Resource_Packaged ) )
	{
		allocatedWidth = imageWidth = JniGetImageWidth( filename.buffer, resourceType == Resource_Packaged );
		imageHeight = JniGetImageHeight( filename.buffer, resourceType == Resource_Packaged );
		allocatedHeight = JniGetAllocatedHeight( filename.buffer, resourceType == Resource_Packaged );

		rawWidth = JniGetRawWidth( filename.buffer, resourceType == Resource_Packaged );
		rawHeight = JniGetRawHeight( filename.buffer, resourceType == Resource_Packaged );

		// TODO: pretend it's always 4 bytes on Android, look into getting actual pixel size data
		allocatedBytes = allocatedWidth * allocatedHeight * 4;
		return true;
	}
	return false;
}


void CCTexture2D::createGLTexture(const bool generateMipMap)
{
	glName = JniCreateGL( filename.buffer, resourceType == Resource_Packaged, generateMipMap );
}


bool CCTexture2D::DoesTextureExist(const char *path, const CCResourceType resourceType)
{
	CCText filename = path;
	filename.stripDirectory();
	filename.toLowerCase();
	return JniDoesTextureExist( filename.buffer, resourceType == Resource_Packaged );
}
