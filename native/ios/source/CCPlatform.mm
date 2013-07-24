/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCPlatform.mm
 *-----------------------------------------------------------
 */

#import "CCDefines.h"
#import "CCGLView.h"

#import <pthread.h>

#import "CCFileManager.h"


struct ThreadMutex
{
    ThreadMutex()
    {
        pthread_mutexattr_init( &type );
        pthread_mutexattr_settype( &type, PTHREAD_MUTEX_RECURSIVE );
        pthread_mutex_init( &mutex, &type );
    }

    ~ThreadMutex()
    {
        pthread_mutex_destroy( &mutex );
        pthread_mutexattr_destroy( &type );
    }

	pthread_mutex_t mutex;
    pthread_mutexattr_t type;
};

static ThreadMutex NATIVE_THREAD_MUTUX;
static ThreadMutex JOBS_THREAD_MUTUX;


void CCNativeThreadLock()
{
//    pthread_t threadID = pthread_self();
//    DEBUGLOG( "Locked thread %i \n", threadID );
    pthread_mutex_lock( &NATIVE_THREAD_MUTUX.mutex );
}


void CCNativeThreadUnlock()
{
//    pthread_t threadID = pthread_self();
//    DEBUGLOG( "Unlocked thread %i \n", threadID );
    pthread_mutex_unlock( &NATIVE_THREAD_MUTUX.mutex );
}


void CCJobsThreadLock()
{
//    pthread_t threadID = pthread_self();
//    DEBUGLOG( "Locked thread %i \n", threadID );
    pthread_mutex_lock( &JOBS_THREAD_MUTUX.mutex );
}


void CCJobsThreadUnlock()
{
    //    pthread_t threadID = pthread_self();
    //    DEBUGLOG( "Unlocked thread %i \n", threadID );
    pthread_mutex_unlock( &JOBS_THREAD_MUTUX.mutex );
}



uint CCProfiler::stackIndex = 0;
CCText CCProfiler::buffer;


CCProfiler::CCProfiler(const char *name)
{
	this->name = name;

	const double currentTime = [NSDate timeIntervalSinceReferenceDate];
	startTime = currentTime;

	stackIndex++;
}


CCProfiler::~CCProfiler()
{
	stackIndex--;

	const double currentTime = [NSDate timeIntervalSinceReferenceDate];
	const double runTime = ( currentTime - startTime ) * 1000;

	if( runTime > 0.5 )
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


static CCText filePath;

void CCProfiler::open()
{
    CCFileManager::GetFilePath( filePath, "cc.profile.txt", Resource_Cached );

	FILE *pFile = fopen( filePath.buffer, "w" );
	ASSERT( pFile != NULL );
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
	FILE *pFile = fopen( filePath.buffer, "a" );
	ASSERT( pFile != NULL );
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
