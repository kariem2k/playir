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

	csActionStack.add( new CSAction( "CCDeviceURLManager::processRequest, ", inRequest->url.buffer ) );
}


void CCDeviceURLManager::downloadFinished(const char *url, const bool success, const char *result, const int length, const char *headers)
{
	// TODO:
	CCList<CCText> headerNames;
	CCList<CCText> headerValues;

	if( headers != NULL )
	{
		json_error_t error;
		json_t *jsonHeaders = json_loads( headers, 0, &error );
		if( jsonHeaders != NULL )
		{
			if( json_is_array( jsonHeaders ) )
			{
				const int jsonHeadersLength = json_array_size( jsonHeaders );
				for( int i=0; i<jsonHeadersLength; ++i )
				{
					json_t *jsonHeader = json_array_get( jsonHeaders, i );
					if( json_is_array( jsonHeader ) )
					{
						if( json_array_size( jsonHeader ) == 2 )
						{
							json_t *jsonKey = json_array_get( jsonHeader, 0 );
							json_t *jsonValue = json_array_get( jsonHeader, 1 );

							CCText *key = new CCText( json_string_value( jsonKey ) );
							CCText *value = new CCText( json_string_value( jsonValue ) );

							headerNames.add( key );
							headerValues.add( value );
						}
					}
				}
			}
		}
		json_decref( jsonHeaders );
	}

	if( success )
	{
		downloadFinished( url, true, result, length, headerNames, headerValues );
	}
	else
	{
		downloadFinished( url, false, NULL, 0, headerNames, headerValues );
	}
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
            currentRequests.remove( currentRequest );

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
				currentRequest->data.set( data, dataLength );
				currentRequest->state = CCURLRequest::succeeded;
			}
            break;
		}
	}
}