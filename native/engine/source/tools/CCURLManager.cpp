/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCURLManager.cpp
 *-----------------------------------------------------------
 */

#include "CCDefines.h"
#include "CCDeviceURLManager.h"
#include "CCFileManager.h"
#include <time.h>


CCURLManager::CCURLManager()
{
    deviceURLManager = new CCDeviceURLManager();

    highPriorityRequestsPending = false;
}


CCURLManager::~CCURLManager()
{
    flushPendingRequests();

    DELETE_POINTER( deviceURLManager );

    domainTimeOuts.deleteObjectsAndList();
}


void CCURLManager::update()
{
    // Have any requests finished?
    if( currentRequests.length > 0 )
    {
        for( int i=0; i<currentRequests.length; ++i )
        {
            CCURLRequest *currentRequest = currentRequests.list[i];
            if( currentRequest->state >= CCURLRequest::failed )
            {
                finishURL( currentRequest );
            }
        }
    }

    // Should start processing new requests
    if( isReadyToRequest() )
	{
        // Start a request
        // There's two streams going, one for anything, one for higher priority requests
        while( currentRequests.length < 2 && requestQueue.length > 0 )
		{
            CCURLRequest *pendingRequest = requestQueue.list[0];
            ASSERT( pendingRequest->state == CCURLRequest::not_started );

            // Don't process any low priority requests if we already have one in progress
            if( currentRequests.length == 1 )
            {
                if( pendingRequest->priority == 0 )
                {
                    break;
                }
            }

            const bool removed = requestQueue.remove( pendingRequest );
            ASSERT( removed );
            currentRequests.add( pendingRequest );
        }
	}

    // Either cache or kick off our download if we haven't started our current requests
    for( int i=0; i<currentRequests.length; ++i )
    {
        CCURLRequest *currentRequest = currentRequests.list[i];
        if( currentRequest->state == CCURLRequest::not_started )
        {
            if( gEngine->time.lifetime < currentRequest->timeRequestable )
            {
                continue;
            }

            if( currentRequest->checkCache )
            {
                if( currentRequest->cacheChecked == false )
                {
                    currentRequest->cacheChecked = true;

                    // See if the data has been cached
                    if( useCacheFile( currentRequest ) )
                    {
                        currentRequest = NULL;
                    }
                }
            }

            if( currentRequest != NULL )
            {
                // Check to see if the url needs to wait for the domain to be ready
                bool wait = false;
                for( int i=0; i<domainTimeOuts.length; ++i )
                {
                    DomainTimeOut *domainTimeOut = domainTimeOuts.list[i];
                    if( CCText::Contains( currentRequest->url.buffer, domainTimeOut->name.buffer ) )
                    {
                        const float nextRequestTime = domainTimeOut->lastRequested + domainTimeOut->timeout;
                        if( gEngine->time.lifetime < nextRequestTime )
                        {
                            wait = true;
                        }
                        break;
                    }
                }

                if( wait == false )
                {
                    currentRequest->timeRequested = gEngine->time.lifetime;
                    deviceURLManager->processRequest( currentRequest );

                    // Record the last request of this domain
                    for( int i=0; i<domainTimeOuts.length; ++i )
                    {
                        DomainTimeOut *domainTimeOut = domainTimeOuts.list[i];
                        if( CCText::Contains( currentRequest->url.buffer, domainTimeOut->name.buffer ) )
                        {
                            domainTimeOut->lastRequested = gEngine->time.lifetime;
                            break;
                        }
                    }
                }
            }
        }
    }
}


void CCURLManager::flushPendingRequests()
{
    deviceURLManager->clear();

    // Clean up our request object
    currentRequests.deleteObjects();
    requestQueue.deleteObjects();
}


void CCURLManager::requestURL(const char *url,
                              CCURLCallback *inCallback,
                              const int priority)
{
    requestURLAndCacheAfterTimeout( url, inCallback, priority, NULL, 0, 0.0f );
}

void CCURLManager::requestURLAfterTimeout(const char *url,
                                          CCURLCallback *inCallback,
                                          const int priority,
                                          const float timeout)
{
    requestURLAndCacheAfterTimeout( url, inCallback, priority, NULL, 0, timeout );
}

void CCURLManager::requestURLAndCache(const char *url,
                                      CCURLCallback *inCallback,
                                      const int priority,
                                      const char *cacheFile,
                                      const int cacheFileTimeoutSeconds)
{
    requestURLAndCacheAfterTimeout( url, inCallback, priority, cacheFile, cacheFileTimeoutSeconds, 0.0f );
}


CCURLRequest* CCURLManager::findUnprocessedRequest(const char *url, const char *cacheFile)
{
    for( int i=0; i<requestQueue.length; ++i )
    {
        CCURLRequest *request = requestQueue.list[i];
        ASSERT( request != NULL );
        ASSERT( request->url.length < 1000 );
        ASSERT( request->state == CCURLRequest::not_started );
        if( CCText::Equals( request->url.buffer, url ) )
        {
            if( request->cacheFileTimeoutSeconds == -1 )
            {
                bool matchingCacheState = false;
                if( cacheFile == NULL )
                {
                    if( request->cacheFile.length == 0 )
                    {
                        matchingCacheState = true;
                    }
                }
                else
                {
                    if( CCText::Equals( request->cacheFile, cacheFile ) )
                    {
                        matchingCacheState = true;
                    }
                }

                if( matchingCacheState )
                {
                    return request;
                    break;
                }
            }
        }
    }
    return NULL;
}


void CCURLManager::requestURLAndCacheAfterTimeout(const char *url,
                                                  CCURLCallback *inCallback,
                                                  const int priority,
                                                  const char *cacheFile,
                                                  const int cacheFileTimeoutSeconds,
                                                  const float timeout)
{
    ASSERT( priority >= 0 && priority <= 4 );
    if( priority > 0 )
    {
        highPriorityRequestsPending = true;
    }

    CCURLRequest *urlRequest = NULL;

    // Ignore advanced requests
    if( timeout == 0.0f && cacheFileTimeoutSeconds == -1 )
    {
        urlRequest = findUnprocessedRequest( url, cacheFile );
    }

    if( urlRequest == NULL )
    {
        urlRequest = new CCURLRequest();
        urlRequest->url.set( url );
        urlRequest->priority = priority;
        urlRequest->cacheFileTimeoutSeconds = cacheFileTimeoutSeconds;
        urlRequest->timeRequestable = gEngine->time.lifetime + timeout;

        if( cacheFile != NULL )
        {
            urlRequest->cacheFile = cacheFile;
        }

        // If our priority is 0 push it to the back
        requestQueue.add( urlRequest );

        // If we have a higher priority reinsert it in the right spot
        if( priority > 0 )
        {
            for( int i=0; i<requestQueue.length; ++i )
            {
                CCURLRequest *request = requestQueue.list[i];
                if( request->priority < priority )
                {
#if 0 && defined DEBUGON
                    DEBUGLOG( "\n\nBefore \n" );
                    for( int j=0; j<requestQueue.length; ++j )
                    {
                        DEBUGLOG( "RequestQueue %i priority: %i \n%s \n", j, requestQueue.list[j]->priority, requestQueue.list[j]->url.buffer );
                    }

#endif

                    requestQueue.reinsert( urlRequest, i );

#if 0 && defined DEBUGON
                    DEBUGLOG( "\nAfter \n" );
                    for( int j=0; j<requestQueue.length; ++j )
                    {
                        DEBUGLOG( "RequestQueue %i priority: %i \n%s \n", j, requestQueue.list[j]->priority, requestQueue.list[j]->url.buffer );
                    }

#endif
                    break;
                }
            }
        }
    }

    // If we already have a request, check it's priority level
    else
    {
        updateRequestPriority( urlRequest, priority );
    }

    if( inCallback != NULL )
    {
        inCallback->reply = urlRequest;
        urlRequest->onComplete.add( inCallback );
    }

    // Is this request already cached?
    if( urlRequest->checkCache )
    {
        if( gEngine->time.lifetime >= urlRequest->timeRequestable )
        {
            if( urlRequest->cacheChecked == false )
            {
                urlRequest->cacheChecked = true;

                // See if the data has been cached
                if( useCacheFile( urlRequest ) )
                {
                    const bool removed = requestQueue.remove( urlRequest );
                    ASSERT( removed );
                    currentRequests.add( urlRequest );
                    finishURL( urlRequest );
                }

#ifdef DEBUGON
				// For stepping through any cache misses
				else
				{
					useCacheFile( urlRequest );
				}
#endif
            }
        }
    }
}


void CCURLManager::updateRequestPriority(CCURLRequest *urlRequest, const int priority)
{
    if( urlRequest->priority != priority )
    {
        if( urlRequest->priority > priority )
        {
            urlRequest->priority = priority;
        }

        urlRequest->priority = priority;

        // If our new priority is 0, push it to the back of the queue
        if( priority == 0 )
        {
            const bool removed = requestQueue.remove( urlRequest );
            ASSERT( removed );
            requestQueue.add( urlRequest );
        }

        // If our new priority is greater, make sure it's positioned appropriately
        else
        {
            const int urlIndex = requestQueue.find( urlRequest );
            const int previousIndex = urlIndex - 1;
            const int nextIndex = urlIndex + 1;
            bool correctSlot = true;

            // Ensure the previous request has a greater or equal priority
            if( previousIndex >= 0 )
            {
                CCURLRequest *request = requestQueue.list[previousIndex];
                if( request->priority < priority )
                {
                    correctSlot = false;
                }
            }

            // Ensure the next request has a less than or equal priority
            if( nextIndex < requestQueue.length )
            {
                CCURLRequest *request = requestQueue.list[nextIndex];
                if( request->priority > priority )
                {
                    correctSlot = false;
                }
            }

            // Otherwise reinsert it in the correct priority
            if( correctSlot == false )
            {
                const bool removed = requestQueue.remove( urlRequest );
                ASSERT( removed );
                requestQueue.add( urlRequest );
                for( int i=0; i<requestQueue.length; ++i )
                {
                    CCURLRequest *request = requestQueue.list[i];
                    if( request->priority < priority )
                    {
                        requestQueue.reinsert( urlRequest, i );
                        break;
                    }
                }
            }
        }
    }
}


bool CCURLManager::useCacheFile(CCURLRequest *urlRequest, bool ignoreTimeout)
{
    if( ignoreTimeout || urlRequest->cacheFileTimeoutSeconds != 0 )
    {
        // See if the data has been cached
        if( urlRequest->cacheFile.length > 0 )
        {
            char *fileData = NULL;
            struct stat fileInfo;
            int fileSize = 0;

            CCResourceType resourceType = CCFileManager::FindFile( urlRequest->cacheFile.buffer );
            if( resourceType == Resource_Packaged )
            {
                if( urlRequest->cacheFileTimeoutSeconds > 0 )
                {
                    DEBUGLOG( "CCURLManager::useCacheFile::Error::Using Packaged File with a timeout request. Temp Ignoring timeout" );
                    ignoreTimeout = true;
                    ASSERT( false );
                }
                fileSize = CCFileManager::GetPackagedFile( urlRequest->cacheFile.buffer, &fileData, false, &fileInfo );
            }
            else if( resourceType == Resource_Cached )
            {
                fileSize = CCFileManager::GetCachedFile( urlRequest->cacheFile.buffer, &fileData, false, &fileInfo );
            }

            if( /*false*/ fileSize > 0 )
            {
                // In seconds
                time_t timeNow = time( NULL );
#if defined( Q_OS_WIN ) || defined( ANDROID ) || defined( Q_OS_LINUX ) || defined( WP8 ) || defined( WIN8 )
                time_t timeSince = timeNow - fileInfo.st_mtime;
#else
                time_t timeSince = timeNow - fileInfo.st_mtimespec.tv_sec;
#endif
                if( ignoreTimeout ||
                    urlRequest->cacheFileTimeoutSeconds == -1 ||
                    urlRequest->cacheFileTimeoutSeconds > timeSince )
                {
                    urlRequest->state = CCURLRequest::used_cache;
                    urlRequest->data.set( fileData, fileSize );
                    FREE_POINTER( fileData );
                    return true;
                }
            }
        }
    }
    return false;
}


void CCURLManager::finishURL(CCURLRequest *request)
{
    // Validate data
    if( request->state == CCURLRequest::succeeded )
    {
        if( request->data.buffer == NULL || request->data.length == 0 )
        {
            request->state = CCURLRequest::failed;
        }
    }

    // Save out our result?
    if( request->cacheFile.length > 0 )
    {
        if( request->state == CCURLRequest::succeeded )
        {
            CCFileManager::SaveCachedFile( request->cacheFile.buffer, request->data.buffer, request->data.length );
        }
    }

    // Handle failed
    if( request->state == CCURLRequest::failed )
    {
        if( useCacheFile( request, true ) )
        {
            request->state = CCURLRequest::failed_but_used_cache;
        }
    }

    //LAMBDA_EMIT_ONCE( request->onComplete );
    for( int i=0; i<request->onComplete.length; ++i )
    {
        CCLambdaCallback *callback = request->onComplete.list[i];
        callback->safeRun();
    }
    request->onComplete.deleteObjectsAndList();

    // Clean up our request object
    const bool removed = currentRequests.remove( request );
    ASSERT( removed );
    delete request;

    // Reset our high priority marker
    if( highPriorityRequestsPending )
    {
        highPriorityRequestsPending = false;
        for( int i=0; i<requestQueue.length; ++i )
        {
            CCURLRequest *request = requestQueue.list[i];
            if( request->priority > 0 )
            {
                highPriorityRequestsPending = true;
                break;
            }
        }
        if( highPriorityRequestsPending == false )
        {
            for( int i=0; i<currentRequests.length; ++i )
            {
                CCURLRequest *request = currentRequests.list[i];
                if( request->priority > 0 )
                {
                    highPriorityRequestsPending = true;
                    break;
                }
            }
        }
    }
}


void CCURLManager::setDomainTimeOut(const char *domain, float timeout)
{
    for( int i=0; i<domainTimeOuts.length; ++i )
    {
        DomainTimeOut *domainTimeOut = domainTimeOuts.list[i];
        if( CCText::Equals( domain, domainTimeOut->name.buffer ) )
        {
            return;
        }
    }

    DomainTimeOut *domainTimeOut = new DomainTimeOut();
    domainTimeOut->name = domain;
    domainTimeOut->timeout = timeout;
    domainTimeOuts.add( domainTimeOut );
}


bool CCURLManager::isReadyToRequest()
{
    if( requestQueue.length > 0 )
    {
        if( deviceURLManager->isReadyToRequest() )
        {
            return true;
        }
    }
    return false;
}
