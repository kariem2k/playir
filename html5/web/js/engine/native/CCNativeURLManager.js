/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCNativeURLManager.js
 * Description : Native manager for HTTP requests.
 *
 * Created     : 05/11/11
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

CCURLManager.prototype.create = function()
{
    this.nextRequestID = 0;

    return this;
};


CCURLManager.prototype.requestURL = function(url, postData, callback, priority, cacheFile, cacheFileTimeoutSeconds, timeout, returnBinary)
{
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

    if( timeout === undefined )
    {
        timeout = 0.0;
    }

    var request = new CCURLRequest( url, postData, callback, priority, cacheFile, cacheFileTimeoutSeconds, timeout, returnBinary );
    request.id = this.nextRequestID++;
    this.requests.push( request );

    CCEngine.NativeUpdateCommands += 'CCURLManager.requestURL;' + request.id + ';' + url + ';';

    if( postData )
    {
        CCEngine.NativeUpdateCommands += postData;
    }
    CCEngine.NativeUpdateCommands += ';' + priority + ';';

    if( cacheFile )
    {
        CCEngine.NativeUpdateCommands += cacheFile;
    }
    CCEngine.NativeUpdateCommands += ';';

    CCEngine.NativeUpdateCommands += cacheFileTimeoutSeconds + ';' + timeout + ';';

    if( returnBinary )
    {
        CCEngine.NativeUpdateCommands += "true";
    }

    CCEngine.NativeUpdateCommands += "\n";
};


CCURLManager.prototype.updateRequestPriority = function(url, filename, priority)
{
    CCEngine.NativeUpdateCommands += 'CCURLManager.updateRequestPriority;' + url + ';' + filename + ';' + priority + '\n';
};


CCURLManager.prototype.downloaded = function(id, state, responseText)
{
    var requests = this.requests;
    var request;
    for( var i=0; i<requests.length; ++i )
    {
        if( requests[i].id === id )
        {
            request = requests[i];
            break;
        }
    }

    if( request )
    {
        if( request.returnBinary )
        {
            if( responseText )
            {
                if( CCEngine.DeviceType === "WindowsPhone" )
                {
                    responseText = request.cacheFile;
                }
                else
                {
                    responseText = "file://" + responseText;
                }
            }
        }
		if( request.callback )
        {
            if( request.callback.run )
            {
                request.callback.run( state, responseText );
            }
            else
            {
                request.callback( state, responseText );
            }
        }
		else
		{
			if( httpRequestObject.status === 200 )
			{
				//console.log( "CCURLManager: No Callback\n" + responseText );
			}
			else
			{
				//console.log( "Status :" + status + " " + responseText );
			}
		}

        requests.remove( request );
    }
};


CCURLManager.prototype.setDomainTimeOut = function(domain, timeout)
{
    CCEngine.NativeUpdateCommands += 'CCURLManager.setDomainTimeOut;' + domain + ';' + timeout + '\n';
};
