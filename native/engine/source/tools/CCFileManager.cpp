/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCFileManager.cpp
 *-----------------------------------------------------------
 */

#include "CCDefines.h"
#include "CCDeviceFileManager.h"
#include "CCTexture2D.h"


CCFileManager* CCFileManager::File(CCResourceType resourceType)
{
    return new CCDeviceFileManager( resourceType );
}


// Must provide full path
int CCFileManager::GetFileData(const char *fullFilePath, char **data, CCResourceType resourceType, const bool assertOnFail)
{
    CCDeviceFileManager *file = new CCDeviceFileManager( resourceType );
    if( file->open( fullFilePath ) == false )
    {
        if( assertOnFail )
        {
            DEBUGLOG( "CCFileManager::GetFileData( %s )\n", fullFilePath );
#ifdef DEBUGON
			file->open( fullFilePath );
#endif
            ASSERT( false );
        }
        delete file;
        return -1;
    }

    const uint fileSize = file->size();
    *data = (char*)malloc( fileSize+1 );
    file->read( *data, fileSize );
    file->close();
    delete file;

    // Add null terminate character to the end
    (*data)[fileSize] = 0;

    return fileSize;
}


void CCFileManager::GetFilePath(CCText &fullFilePath, const char *filePath, CCResourceType resourceType)
{
#ifdef QT

    fullFilePath = QtRootPath().toUtf8().constData();

    if( resourceType == Resource_Packaged )
    {
        fullFilePath += filePath;
    }
    else
    {
        CCText filename = filePath;
        filename.stripDirectory();
        fullFilePath += "cache/";
        fullFilePath += filename.buffer;
    }

#elif defined( IOS )

    CCText deviceFilePath( filePath );
    deviceFilePath.stripDirectory();

    if( resourceType == Resource_Packaged )
    {
        CCText appsDirectory = CCDeviceFileManager::GetAppFolder();
        fullFilePath = appsDirectory.buffer;
    }
    else
    {
        CCText docsDirectory = CCDeviceFileManager::GetDocsFolder();
        fullFilePath = docsDirectory.buffer;
    }

    fullFilePath += deviceFilePath.buffer;

#elif defined( ANDROID )

    CCText filename;
    filename = filePath;
    filename.stripDirectory();
    filename.toLowerCase();

	if( resourceType == Resource_Packaged )
	{
		fullFilePath = filename.buffer;
	}
	else
	{
		fullFilePath = CCDeviceFileManager::dataPath.buffer;
		fullFilePath += filename.buffer;
	}

#elif defined( WP8 ) || defined WIN8

	CCText filename = filePath;
	filename.stripDirectory();

    if( resourceType == Resource_Packaged )
    {
		Platform::String ^location = Platform::String::Concat(Windows::ApplicationModel::Package::Current->InstalledLocation->Path, "\\");
		fullFilePath = GetChars( location );

        fullFilePath += "Resources\\Packaged\\";
		fullFilePath += filename.buffer;
    }
    else
    {
		Platform::String ^location = Platform::String::Concat(Windows::Storage::ApplicationData::Current->LocalFolder->Path, "\\");
		fullFilePath = GetChars( location );

		fullFilePath += filename.buffer;
    }

#endif
}

// Must provide relative path for files generated/downloaded by the app
int CCFileManager::GetFile(const char *filePath, CCText &fileData, CCResourceType resourceType, const bool assertOnFail, struct stat *info)
{
    char *data = NULL;
    int fileSize;

    if( resourceType == Resource_Packaged )
    {
    	fileSize = GetPackagedFile( filePath, &data, assertOnFail, info );
    }
    else
    {
    	fileSize = GetCachedFile( filePath, &data, assertOnFail, info );
    }
    if( fileSize > 0 )
    {
        fileData = data;
        FREE_POINTER( data );
    }

    return fileSize;
}


// Must provide relative path for files packaged with the app
int CCFileManager::GetPackagedFile(const char *filePath, char **data, const bool assertOnFail, struct stat *info)
{
    CCText fullFilePath;
    GetFilePath( fullFilePath, filePath, Resource_Packaged );

    if( info != NULL )
    {
        stat( fullFilePath.buffer, info );
    }

    return GetFileData( fullFilePath.buffer, data, Resource_Packaged, assertOnFail );
}


int CCFileManager::GetCachedFile(const char *filePath, char **data, const bool assertOnFail, struct stat *info)
{
    CCText fullFilePath;
    GetFilePath( fullFilePath, filePath, Resource_Cached );

    if( info != NULL )
    {
        stat( fullFilePath.buffer, info );
    }

    return GetFileData( fullFilePath.buffer, data, Resource_Cached, assertOnFail );
}


bool CCFileManager::SaveCachedFile(const char *filePath, const char *data, const int length)
{
	ASSERT( data != NULL );
	if( data == NULL )
	{
		return false;
	}

#ifdef QT

    CCText fullFilePath = QtRootPath().toUtf8().constData();

    CCText filename = filePath;
    filename.stripDirectory();
    fullFilePath += "cache/";
    fullFilePath += filename.buffer;

    QFile file( fullFilePath.buffer );
    if( file.open( QIODevice::WriteOnly ) )
    {
        file.write( data, length );
        file.close();

        return true;
    }

#elif defined( IOS ) || defined( ANDROID )

    CCText fullFilePath;
    GetFilePath( fullFilePath, filePath, Resource_Cached );

    //DEBUGLOG( "CCFileManager::Saving %s \n", fullFilePath.buffer );
    FILE *pFile = fopen( fullFilePath.buffer, "w" );
    ASSERT( pFile != NULL );
    if( pFile != NULL )
    {
        fwrite( data, sizeof( char ), length, pFile );
        fclose( pFile );

        return true;
    }

#elif defined WP8 || defined WIN8

	CCDeviceFileManager *file = new CCDeviceFileManager( Resource_Cached );

    CCText fullFilePath;
    GetFilePath( fullFilePath, filePath, Resource_Cached );

	ASSERT( data != NULL );
	bool result = file->save( fullFilePath.buffer, data, length );

	delete file;

	return result;

#endif

    return false;
}


bool CCFileManager::DeleteCachedFile(const char *filePath, const bool checkIfExists)
{
    if( checkIfExists )
    {
        if( !CCFileManager::DoesFileExist( filePath, Resource_Cached ) )
        {
            return false;
        }
    }

    CCText fullFilePath;
    GetFilePath( fullFilePath, filePath, Resource_Cached );

#ifdef QT

    if( QFile::remove( fullFilePath.buffer ) == false )
    {
        ASSERT( false );
        return false;
    }

#elif defined( IOS ) || defined( ANDROID )

    //DEBUGLOG( "CCFileManager::deleteCachedFile %s \n", fullFilePath.buffer );
    if( remove( fullFilePath.buffer ) != 0 )
    {
        ASSERT( false );
        return false;
    }

#elif defined WP8 || defined WIN8

	CCDeviceFileManager *file = new CCDeviceFileManager(Resource_Cached);
	bool result = file->deleteFile( fullFilePath.buffer );

	delete file;

	return result;

#else

    ASSERT( false );
    return false;

#endif

    return true;
}


class IOPriorityCallback : public CCLambdaCallback
{
public:
    IOPriorityCallback(const int inPriority)
    {
        priority = inPriority;
    }
    int priority;
};


static CCList<IOPriorityCallback> pendingIO;
static int numberOfIORequests = 0;
#define MAX_IO_PER_FRAME 3
void CCFileManager::ReadyIO()
{
    numberOfIORequests = 0;

    while( pendingIO.length > 0 )
    {
        if( numberOfIORequests < MAX_IO_PER_FRAME )
        {
            IOPriorityCallback *ioCallback = pendingIO.list[0];
            pendingIO.remove( ioCallback );
            ioCallback->safeRun();
            delete ioCallback;
        }
        else
        {
            break;
        }
    }

#if 0 && defined DEBUGON
    static int currentHighPriorityIO = 0;
    static int maxHighPrirityIO = 0;
    for( int i=0; i<pendingIO.length; ++i )
    {
        IOPriorityCallback *ioCallback = pendingIO.list[i];
        if( ioCallback->priority > 0 )
        {
            currentHighPriorityIO = i;
        }
    }
    LOG_NEWMAX( "Highest Priority IO remaining", maxHighPrirityIO, currentHighPriorityIO );
#endif
}


void CCFileManager::DoesCachedFileExistAsync(const char *filePath, CCIOCallback *inCallback)
{
    inCallback->filePath = filePath;

    class FileExistsCallback : public IOPriorityCallback
    {
    public:
        FileExistsCallback(CCIOCallback *inCallback) :
            IOPriorityCallback( inCallback->priority )
        {
            this->ioCallback = inCallback;
        }

        void run()
        {
            if( ioCallback->isCallbackActive() == false )
            {
                return;
            }

            ASSERT( priority == ioCallback->priority );

            CCText fullFilePath;
            GetFilePath( fullFilePath, ioCallback->filePath.buffer, Resource_Cached );

            numberOfIORequests++;
#ifdef WIN8
            const int result = _access( fullFilePath.buffer, F_OK );
#else
            const int result = access( fullFilePath.buffer, F_OK );
#endif
            ioCallback->exists = result == 0;

            ASSERT( priority == ioCallback->priority );

            ioCallback->safeRun();
        }

    private:
        CCIOCallback *ioCallback;
    };


    FileExistsCallback *fileExistsCallback = new FileExistsCallback( inCallback );
    if( fileExistsCallback->priority > 0 && numberOfIORequests < MAX_IO_PER_FRAME )
    {
        fileExistsCallback->run();
        delete fileExistsCallback;
    }
    else
    {
        pendingIO.add( fileExistsCallback );

        // Can't do this as it'll mess up the order they we're requested
//        for( int i=0; i<pendingIO.length; ++i )
//        {
//            IOPriorityCallback *ioRequest = pendingIO.list[i];
//            if( ioRequest->priority < fileExistsCallback->priority )
//            {
//                pendingIO.reinsert( fileExistsCallback, i );
//                break;
//            }
//        }
    }
}


bool CCFileManager::DoesFileExist(const char *filePath, CCResourceType resourceType)
{
    CCText fullFilePath;
    GetFilePath( fullFilePath, filePath, resourceType );

#ifdef ANDROID

    if( CCText::Contains( filePath, ".png" ) || CCText::Contains( filePath, ".jpg" ) )
    {
        return CCTexture2D::DoesTextureExist( filePath, resourceType );
    }
    else
    {
        CCDeviceFileManager *file = new CCDeviceFileManager( resourceType );
        const bool exists = file->open( fullFilePath.buffer );
        if( exists )
        {
            file->close();
        }
        delete file;

        return exists;
    }

#elif defined WP8 || defined WIN8

    CCDeviceFileManager *file = new CCDeviceFileManager( resourceType );
	const bool exists = file->exists( fullFilePath.buffer );
    if( exists )
    {
        file->close();
    }
    delete file;

    return exists;

#else

    const int result = access( fullFilePath.buffer, F_OK );
    return result == 0;

#endif
}



CCResourceType CCFileManager::FindFile(const char *filePath)
{
    if( DoesFileExist( filePath, Resource_Packaged ) )
    {
        return Resource_Packaged;
    }
    else if( DoesFileExist( filePath, Resource_Cached ) )
    {
        return Resource_Cached;
    }

    return Resource_Unknown;
}
