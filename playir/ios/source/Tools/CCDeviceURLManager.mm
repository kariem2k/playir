/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCDeviceURLManager.mm
 *-----------------------------------------------------------
 */

#import "CCDefines.h"
#import "CCDeviceURLManager.h"


CCDeviceURLManager::CCDeviceURLManager()
{
    internal = [[CCDeviceURLManagerOC alloc] init];
}


CCDeviceURLManager::~CCDeviceURLManager()
{
    [internal release];
}


void CCDeviceURLManager::processRequest(CCURLRequest *inRequest)
{
    inRequest->state = CCURLRequest::in_flight;

    CCURLRequestPacket *urlRequestPacket = new CCURLRequestPacket();
    urlRequestPacket->request = inRequest;

    CCLAMBDA_2( ProcessRequest, CCDeviceURLManager, device, CCURLRequestPacket*, urlRequestPacket, {
        [device->internal processRequest: urlRequestPacket ];
    })

    gEngine->engineToNativeThread( new ProcessRequest( this, urlRequestPacket ) );
}


void CCDeviceURLManager::clear()
{
    [internal clear];
}


bool CCDeviceURLManager::isReadyToRequest()
{
    return true;
}



@implementation CCDeviceURLManagerOC


-(id)init
{
	self = [super init];
	if( self != NULL )
    {
    }
    return self;
}


-(void)dealloc
{
	currentRequests.deleteObjectsAndList();
	[super dealloc];
}


-(void)processRequest:(CCURLRequestPacket*)urlRequestPacket
{
    DEBUGLOG( "CCDeviceURLManager Request %s\n", urlRequestPacket->request->url.buffer );
    
    currentRequests.add( urlRequestPacket );

    CCURLRequest *request = urlRequestPacket->request;

	// Filter out spaces
	NSString *url = [[NSString alloc] initWithFormat:@"%s", request->url.buffer];
	[url stringByReplacingOccurrencesOfString:@" " withString:@"%20"];

#if DEBUGON
    //NSLog( @"NSMutableURLRequest: %@ \n", url );
#endif

    NSURLRequest *theRequest;

    if( request->postBody.length > 0 )
    {
        NSMutableURLRequest *postRequest = [[NSMutableURLRequest alloc] init];
        [postRequest setURL:[NSURL URLWithString:url]];
        [postRequest setHTTPMethod:@"POST"];

        NSString *contentType = [NSString stringWithFormat:@"multipart/form-data;boundary=%s", CCPOST_BOUNDARY];
        [postRequest addValue:contentType forHTTPHeaderField: @"Content-Type"];

        NSMutableData *body = [NSMutableData data];
        [body appendData:[NSData dataWithBytes:request->postBody.buffer length:request->postBody.length]];
        [postRequest setHTTPBody:body];

        theRequest = postRequest;
    }

    else
    {
        theRequest = [NSURLRequest requestWithURL:[NSURL URLWithString:url]
                                      cachePolicy:NSURLRequestUseProtocolCachePolicy
                                  timeoutInterval:15.0];
    }

    [url release];

    // create the connection with the request
    // and start loading the data
    urlRequestPacket->connection = [[NSURLConnection alloc] initWithRequest:theRequest delegate:self];
    if( urlRequestPacket->connection )
    {
        // Create the NSMutableData that will hold
        // the received data
        // receivedData is declared as a method instance elsewhere
        urlRequestPacket->data = [[NSMutableData data] retain];
    }
    else
    {
        // inform the user that the download could not be made
        CCASSERT( false );
    }
}


-(CCURLRequestPacket*)findRequest:(NSURLConnection*)connection
{
    for( int i=0; i<currentRequests.length; ++i )
    {
        if( currentRequests.list[i]->connection == connection )
        {
            return currentRequests.list[i];
        }
    }
    return NULL;
}


-(void)connection:(NSURLConnection*)connection didReceiveResponse:(NSURLResponse*)response
{
    CCURLRequestPacket *packet = [self findRequest:connection];
    if( packet == NULL )
    {
        return;
    }

    // this method is called when the server has determined that it
    // has enough information to create the NSURLResponse

    // it can be called multiple times, for example in the case of a
    // redirect, so each time we reset the data.
    // receivingData is declared as a method instance elsewhere
    [packet->data setLength:0];

    NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse*)response;
	if( [response respondsToSelector:@selector(allHeaderFields)] )
    {
        NSURL *url = [response URL];
        if( url != NULL )
        {
            NSString *urlString = [url absoluteString];
            if( urlString != NULL )
            {
                CCText *headerName = new CCText( "Location" );
                CCText *headerData = new CCText( [urlString UTF8String] );
                packet->request->header.names.add( headerName );
                packet->request->header.values.add( headerData );
            }
        }

		NSDictionary *dictionary = [httpResponse allHeaderFields];
        for( NSString *key in [dictionary allKeys] )
        {
            NSString *value = [dictionary objectForKey:key];
            CCText *headerName = new CCText( [key UTF8String] );
            CCText *headerData = new CCText( [value UTF8String] );
            packet->request->header.names.add( headerName );
            packet->request->header.values.add( headerData );
        }
	}
}


-(void)connection:(NSURLConnection*)connection didReceiveData:(NSData*)data
{
    CCURLRequestPacket *packet = [self findRequest:connection];
    if( packet == NULL )
    {
        return;
    }

    // append the new data to the receivingData
    // receivingData is declared as a method instance elsewhere
    [packet->data appendData:data];
}


-(void)connection:(NSURLConnection*)connection didFailWithError:(NSError*)error
{
    CCURLRequestPacket *packet = [self findRequest:connection];
    if( packet == NULL )
    {
        return;
    }

	// Copy over the recieved data
	CCNativeThreadLock();
	packet->request->state = CCURLRequest::failed;
    packet->request->data.set( (char*)[packet->data bytes], [packet->data length] );
	CCNativeThreadUnlock();

    // Clear
    currentRequests.remove( packet );
    delete packet;

    // inform the user
    DEBUGLOG( "Connection failed! Error - %s %s \n",
              [[error localizedDescription] UTF8String],
              [[[error userInfo] objectForKey:NSURLErrorFailingURLStringErrorKey] UTF8String] );

	// release the connection
    [connection release];
}


-(void)connectionDidFinishLoading:(NSURLConnection*)connection
{
    CCURLRequestPacket *packet = [self findRequest:connection];
    if( packet == NULL )
    {
        return;
    }

    // do something with the data
    // receivingData is declared as a method instance elsewhere
    //DEBUGLOG( "CCDeviceURLManager Received %s\n%s\n", packet->request->url.buffer, [packet->data bytes] );

	// Copy over the recieved data
    if( packet->request->state == CCURLRequest::in_flight )
    {
        CCNativeThreadLock();
        packet->request->state = CCURLRequest::succeeded;
        uint length = [packet->data length];
        if( length > 0 )
        {
            packet->request->data.set( (char*)[packet->data bytes], length );
        }
        CCNativeThreadUnlock();

        currentRequests.remove( packet );
        delete packet;
    }
    else
    {
        CCASSERT( false );
    }

    // release the connection
    [connection release];
}


-(void)clear
{
    currentRequests.deleteObjects();
}


@end