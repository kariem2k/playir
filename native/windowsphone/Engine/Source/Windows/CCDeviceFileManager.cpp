/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCDeviceFileManager.cpp
 *-----------------------------------------------------------
 */

#include "CCDefines.h"
#include "CCDeviceFileManager.h"


using namespace Windows::Storage;


CCDeviceFileManager::CCDeviceFileManager(CCResourceType resourceType)
{
	m_basicReaderWriter = new BasicReaderWriter();
}


CCDeviceFileManager::~CCDeviceFileManager()
{
	if( m_basicReaderWriter != nullptr )
	{
		DELETE_POINTER(  m_basicReaderWriter );
	}
}


bool CCDeviceFileManager::open(const char *filePath)
{
	if( m_basicReaderWriter != nullptr )
	{
		Platform::Array<byte>^ windowsData = m_basicReaderWriter->ReadData( GetString( filePath ) );
		if( windowsData != nullptr )
		{
			data.set( (char*)windowsData->Data, windowsData->Length );
			return true;
		}
	}
    return false;
}


void CCDeviceFileManager::close()
{
}


uint CCDeviceFileManager::read(void *dest, const uint size)
{
    memcpy( dest, data.buffer, size );
	return 0;
}


void CCDeviceFileManager::seek(const uint size)
{
}


void CCDeviceFileManager::setPosition(const uint pos)
{
}


bool CCDeviceFileManager::endOfFile()
{
    return false;
}


uint CCDeviceFileManager::size()
{
	return data.length;
}


uint CCDeviceFileManager::position()
{
    return 0;
}



bool CCDeviceFileManager::save(const char *filePath, const char *data, const int length)
{
	if( m_basicReaderWriter != nullptr )
	{
		CCASSERT( data != NULL );
		if( data != NULL )
		{
			const int result = m_basicReaderWriter->WriteData( GetString( filePath ), data, length );
			if( result > 0 )
			{
				return true;
			}
		}
	}
	return false;
}


bool CCDeviceFileManager::deleteFile(const char *filePath)
{
	if( m_basicReaderWriter != nullptr )
	{
		return m_basicReaderWriter->deleteFile( GetString( filePath ) );
	}
	return false;
}


bool CCDeviceFileManager::exists(const char *filePath)
{
	if( m_basicReaderWriter != nullptr )
	{
		return m_basicReaderWriter->exists( GetString( filePath ) );
	}
	return false;
}