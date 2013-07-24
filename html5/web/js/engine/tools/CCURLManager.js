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

function CCURLRequest(url, postData, callback, priority, cacheFile, cacheFileTimeoutSeconds, timeout, returnBinary)
{
    this.url = url;
	this.postData = postData;
	this.callback = callback;
    this.priority = priority;
    this.cacheFile = cacheFile;
    this.cacheFileTimeoutSeconds = cacheFileTimeoutSeconds;
    this.timeout = timeout;
    this.timeRequestable = window.gEngine ? gEngine.lifetime + timeout : 0.0;
    this.returnBinary = returnBinary;
}

CCURLRequest.Not_Started = 1;
CCURLRequest.In_Flight = 2;
CCURLRequest.Failed = 3;
CCURLRequest.Timed_Out = 4;
CCURLRequest.Data_Error = 5;
CCURLRequest.Succeeded = 6;
CCURLRequest.Used_Cache = 7;
CCURLRequest.Failed_But_Used_Cache = 8;


function CCURLManager()
{
    this.requests = [];
}
window.gURLManager = null;


CCURLManager.prototype.findRequest = function(url, cacheFile)
{
	var requests = this.requests;
    for( var i=0; i<requests.length; ++i )
    {
		var request = requests[i];
		if( !request.checkingCache )
		{
			if( request.url === url )
			{
				if( request.cacheFile == cacheFile )
				{
					// Ignore advanced requests
					if( request.cacheFileTimeoutSeconds === -1 && request.timeout === 0.0 )
					{
						return request;
					}
				}
			}
		}
    }
    return null;
};
