/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCURLManager.js
 * Description : Manager for HTTP requests.
 *
 * Created     : 05/11/11
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

CCURLManager.prototype.create = function()
{
    this.domainTimeOuts = [];
    this.finish();

    this.xhr = new XMLHttpRequest();
    return this;
};


CCURLManager.prototype.ready = function()
{
    // We need our filemanager ready in order to save
    if( !this.request )
    {
        if( this.xhr.readyState === 4 || this.xhr.readyState === 0 )
        {
            return true;
        }
    }

    return false;
};


CCURLManager.prototype.open = function()
{
	var xhr = this.xhr;
	var request = this.request;
	if( request.postData )
	{
        xhr.open( 'POST', request.url, true );
	}
	else
	{
        xhr.open( 'GET', request.url, true );
	}

    if( request.returnBinary )
    {
        xhr.responseType = "arraybuffer";
    }
    else
    {
        xhr.responseType = "";
    }

    var self = this;
	xhr.onreadystatechange = function()
    {
        self.receiveData();
    };
};


CCURLManager.prototype.start = function()
{
    this.xhr.send( this.request.postData );
};


CCURLManager.prototype.finish = function()
{
    this.request = false;
};


CCURLManager.prototype.requestURL = function(url, postData, callback, priority, cacheFile, cacheFileTimeoutSeconds, timeout, returnBinary)
{
    if( postData )
    {
        var formData = new FormData();
        for( var key in postData )
        {
            formData.append( key, postData[key] );
        }
        postData = formData;
    }

    if( priority === undefined )
    {
        priority = 0;
    }

    if( !cacheFile )
    {
        cacheFile = null;
    }

    if( cacheFileTimeoutSeconds === undefined || cacheFileTimeoutSeconds === null )
    {
        cacheFileTimeoutSeconds = -1;
    }

    if( timeout === undefined || timeout === null  )
    {
        timeout = 0.0;
    }

    var request = new CCURLRequest( url, postData, callback, priority, cacheFile, cacheFileTimeoutSeconds, timeout, returnBinary );
    this.requests.push( request );
    //console.log( "request", JSON.stringify( request ) );

    if( priority > 0 )
    {
        this.requests.insert( request, 0 );
    }

    CCURLManager.RequestUpdate();
};


CCURLManager.RequestUpdate = function()
{
    if( !CCURLManager.RequestingUpdate )
    {
        CCURLManager.RequestingUpdate = true;
        setTimeout( function()
        {
            CCURLManager.Update();
        }, window.debugSlowNetwork ? 2000 : 50 );
    }
};


CCURLManager.prototype.updateRequestPriority = function(url, filename, priority)
{
    if( priority > 0 )
    {
        var request = this.findRequest( url, filename );
        if( request )
        {
            this.requests.insert( request, 0 );
        }
    }
};


CCURLManager.Update = function()
{
    CCURLManager.RequestingUpdate = false;

    var self = gURLManager;

    // 1st Check if we have requests
    // 2nd: Check if we have cached results
    // 3rd: See if httpManager is ready
    // 4th: See if we can access that domain
    // 5th: Download

    var CheckCacheFunction = function(request)
    {
        return function( data )
        {
            delete request.checkingCache;

            if( data !== undefined )
            {
                // TODO: See if time data was saved is > request.cacheFileTimeoutSeconds
                if( request.callback )
                {
                    // Remove request from stack
                    requests.remove( request );
                    if( request.callback.run )
                    {
                        request.callback.run( CCURLRequest.Used_Cache, data, null );
                    }
                    else
                    {
                        request.callback( CCURLRequest.Used_Cache, data, null );
                    }
                }
            }
            CCURLManager.RequestUpdate();
        };
    };

    // Start our next request
    var requests = self.requests;
    for( var i=0; i<requests.length; ++i )
    {
        var request = requests[i];
        if( window.gEngine && request.timeRequestable > gEngine.lifetime )
        {
            continue;
        }

        // Cache is checked asynchronously
        if( request.checkingCache )
        {
            continue;
        }

        if( !request.postData && !request.checkedCache && request.cacheFileTimeoutSeconds !== 0.0 )
        {
            request.checkedCache = true;
            var cacheFile = request.cacheFile;
            if( cacheFile )
            {
                request.checkingCache = true;
                CCFileManager.Load( cacheFile, new CheckCacheFunction( request ), request.priority );
                continue;
            }
        }

        if( self.ready() )
        {
            var domainTimeOuts = self.domainTimeOuts;
            var length = domainTimeOuts.length;
            for( var domainIndex=0; domainIndex<domainTimeOuts.length; ++domainIndex )
            {
                var domainTimeOut = domainTimeOuts[domainIndex];
                if( request.url.split( domainTimeOut.name ).length > 1 )
                {
                    var nextRequestTime = domainTimeOut.lastRequested + domainTimeOut.timeout;
                    if( gEngine.lifetime < nextRequestTime )
                    {
                        break;
                    }
                    domainTimeOut.lastRequested = gEngine.lifetime;
                    break;
                }
            }

            // Remove request from stack
            requests.remove( request );

            // Being download
            //console.log( "download", JSON.stringify( request ) );
            self.download( request );
            break;
        }
    }

    if( requests.length > 0 )
    {
        CCURLManager.RequestUpdate();
    }
};


CCURLManager.prototype.receiveData = function()
{
    var xhr = this.xhr;
    if( xhr.readyState === 4 )
    {
        var request = this.request;
        //console.log( "receiveData", JSON.stringify( request ) );

        //var headers = xhr.getAllResponseHeaders().toLowerCase();
        //console.log( headers );

        var state = ( xhr.status === 200 || xhr.status === 0 ) ? CCURLRequest.Succeeded : CCURLRequest.Failed;
        var response;
        if( request.returnBinary )
        {
            response = xhr.response ? new Uint8Array( xhr.response ) : null;
        }
        else
        {
            response = xhr.responseText;
        }

        var runCallback = true;
        if( request.cacheFile )
        {
            if( state === CCURLRequest.Succeeded )
            {
                CCFileManager.Save( request.cacheFile, response );
            }
            else
            {
                var CheckCacheFunction = function(request)
                {
                    return function( data )
                    {
                        if( data !== undefined )
                        {
                            if( request.callback.run )
                            {
                                request.callback.run( CCURLRequest.Used_Cache, data, null );
                            }
                            else
                            {
                                request.callback( CCURLRequest.Used_Cache, data, null );
                            }
                        }
                        else
                        {
                            request.callback( CCURLRequest.Failed, null, null );
                        }
                        CCURLManager.RequestUpdate();
                    };
                };
                if( request.callback )
                {
                    CCFileManager.Load( request.cacheFile, new CheckCacheFunction( request ), request.priority );
                }
                runCallback = false;
            }
        }

		if( runCallback && request.callback )
        {
            if( request.callback.run )
            {
                request.callback.run( state, response, xhr );
            }
            else
            {
                request.callback( state, response, xhr );
            }
        }

		// Finish
		this.finish();

        if( this.requests.length > 0 )
        {
            CCURLManager.RequestUpdate();
        }
    }
};


CCURLManager.prototype.download = function(request)
{
    this.request = request;
    this.open();
    this.start();
};


CCURLManager.prototype.setDomainTimeOut = function(domain, timeout)
{
	var domainTimeOuts = this.domainTimeOuts;
	var length = domainTimeOuts.length;
	for( var i=0; i<length; ++i )
	{
		if( domainTimeOuts[i].name === domain )
		{
			return;
		}
	}

	var domainTimeOut = {};
	domainTimeOut.name = domain;
	domainTimeOut.timeout = timeout;
	domainTimeOut.lastRequested = 0.0;
	domainTimeOuts.push( domainTimeOut );
};
