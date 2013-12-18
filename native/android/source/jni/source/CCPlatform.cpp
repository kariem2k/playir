/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCPlatform.cpp
 *-----------------------------------------------------------
 */

#include "CCDefines.h"
#include "CCGLView.h"


static ThreadMutex NATIVE_THREAD_MUTUX;
static ThreadMutex JOBS_THREAD_MUTUX;


void CCNativeThreadLock()
{
    pthread_mutex_lock( &NATIVE_THREAD_MUTUX.mutex );
}


void CCNativeThreadUnlock()
{
    pthread_mutex_unlock( &NATIVE_THREAD_MUTUX.mutex );
}


void CCJobsThreadLock()
{
    pthread_mutex_lock( &JOBS_THREAD_MUTUX.mutex );
}


void CCJobsThreadUnlock()
{
    pthread_mutex_unlock( &JOBS_THREAD_MUTUX.mutex );
}



uint CCProfiler::stackIndex = 0;
CCText CCProfiler::buffer;


CCProfiler::CCProfiler(const char *name)
{
	this->name = name;

	struct timespec res;
	clock_gettime( CLOCK_REALTIME, &res );
	const double currentTime = res.tv_sec + (double)( ( res.tv_nsec / 1e6 ) * 0.001 );
	startTime = currentTime;

	stackIndex++;
}


CCProfiler::~CCProfiler()
{
	stackIndex--;

	struct timespec res;
	clock_gettime( CLOCK_REALTIME, &res );
	const double currentTime = res.tv_sec + (double)( ( res.tv_nsec / 1e6 ) * 0.001 );
	const double runTime = ( currentTime - startTime ) * 1000;

	if( runTime > 1.0 )
	{
		for( uint i=0; i<stackIndex; ++i )
		{
			buffer += "\t";
		}

		buffer += name;
		buffer += " ";
		buffer += (float)runTime;
		buffer += "\n";
	}
}


void CCProfiler::open()
{
	FILE *pFile = fopen( "/sdcard/ccjni.profile.txt", "w" );
	CCASSERT( pFile != NULL );
	if( pFile != NULL )
	{
		fclose( pFile );
	}

	buffer.length = 0;
	buffer += "Frame : 0\n";
}


void CCProfiler::save()
{
	static int frame = 1;
	FILE *pFile = fopen( "/sdcard/ccjni.profile.txt", "a" );
	CCASSERT( pFile != NULL );
	if( pFile != NULL )
	{
		fwrite( buffer.buffer, sizeof( char ), buffer.length, pFile );
		fclose( pFile );
	}

	buffer.length = 0;
	buffer += "\nFrame : ";
	buffer += frame++;
	buffer += "\n";
}
