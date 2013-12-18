/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCDeviceFileManager.mm
 *-----------------------------------------------------------
 */

#import "CCDefines.h"
#import "CCDeviceFileManager.h"


CCDeviceFileManager::CCDeviceFileManager(CCResourceType resourceType)
{
	m_File		= NULL;
	m_Size		= 0;
	m_Position	= 0;
}


bool CCDeviceFileManager::open(const char *filePath)
{
	m_File = fopen( filePath, "rb" );
	if( m_File == NULL )
	{
		return false;
	}

	fpos_t pos = 0;
	fseek( m_File, 0, SEEK_END );
	fgetpos( m_File, &pos );
	fseek( m_File, 0, SEEK_SET );
	m_Size		= (uint)pos;
	m_Position	= 0;

	return true;
}


void CCDeviceFileManager::close()
{
	if( m_File != NULL )
	{
		fclose( m_File );
		m_File = NULL;
	}

	m_File = NULL;
	m_Size = 0;
	m_Position = 0;
}


uint CCDeviceFileManager::read(void *dest, const uint size)
{
	CCASSERT_MESSAGE( m_File != NULL, "File::Read(...) : ERROR! File not open" );

	// Regular file handle
	const uint sz = fread( dest, size, 1, m_File );
    CCASSERT( sz == 1 );
	if( sz > 0 )
	{
		m_Position += size;
		return size;
	}
	DEBUGLOG( "File::Read(...) : WARNING! Error reading. Code %i\n", sz );
	CCASSERT_MESSAGE( false, "File::Read(...) : ERROR! Error reading" );

	return 0;
}



void CCDeviceFileManager::seek(const uint size)
{
	CCASSERT_MESSAGE( m_File != NULL, "File::Position(...) : ERROR! File not open" );

	fseek( m_File, size, SEEK_CUR );
    m_Position += size;
}


void CCDeviceFileManager::setPosition(const uint pos)
{
	CCASSERT_MESSAGE( m_File != NULL, "File::Position(...) : ERROR! File not open" );
	CCASSERT_MESSAGE( pos < m_Size, "File::Position(...) : ERROR! Invalid file position" );

	fseek( m_File, pos, SEEK_SET );
	m_Position = pos;
}


bool CCDeviceFileManager::endOfFile()
{
	return m_Position >= m_Size;
}


uint CCDeviceFileManager::size()
{
	return m_Size;
}


uint CCDeviceFileManager::position()
{
	return m_Position;
}


const char* CCDeviceFileManager::GetAppFolder()
{
    static CCText appDirectory;
    if( appDirectory.length == 0 )
    {
        appDirectory = [[[NSBundle mainBundle] resourcePath] UTF8String];
        appDirectory += "/";
    }
    return appDirectory.buffer;

}


const char* CCDeviceFileManager::GetDocsFolder()
{
    static CCText docsDirectory;
    if( docsDirectory.length == 0 )
    {
        docsDirectory = [[NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) objectAtIndex:0] UTF8String];
        docsDirectory += "/";
    }
    return docsDirectory.buffer;
}
