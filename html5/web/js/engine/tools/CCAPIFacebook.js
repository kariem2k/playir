/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCAPIFacebook.js
 * Description : Handles Facebook API.
 *
 * Created     : 30/10/11
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

function CCAPIFacebook() {}
CCAPIFacebook.APP_ID = "138263572915502";
CCAPIFacebook.API_PERMISSIONS = "user_photos,publish_stream,";
CCAPIFacebook.API_URL = "https://graph.facebook.com/";


function CCFBCallback(callback, url, cacheFile)
{
	this.callback = callback;
    this.url = url;
    this.cacheFile = cacheFile;
}

CCFBCallback.prototype.run = function(status, responseText)
{
	function Reply() {}
	var reply = new Reply();
	reply.data = responseText;
	reply.state = status;
    reply.url = this.url;
    if( !responseText || responseText.length === 0 )
    {
		reply.state = CCURLRequest.Data_Error;
    }
	else if( responseText.contains( "OAuthException" ) )
	{
		reply.state = CCURLRequest.Data_Error;
	}
	else if( responseText === "false" )
	{
		reply.state = CCURLRequest.Data_Error;
	}

	if( reply.state === CCURLRequest.Succeeded )
	{
		CC.SaveData( this.cacheFile, responseText );
	}
	else
	{
		var data = CC.LoadData( this.cacheFile );
        if( data !== undefined )
        {
			reply.state = CCURLRequest.Failed_But_Used_Cache;
			reply.data = data;
        }
	}

	this.callback.reply = reply;
	this.callback.run();
};


CCAPIFacebook.SetCacheFile = function(apiCall)
{
    apiCall.replace( ".", "/" );
    return "facebook." + apiCall;
};


CCAPIFacebook.Request = function(inCallback, apiCall, priority, refresh, timeout, limit, offset)
{
	if( refresh === undefined )
	{
		refresh = false;
	}

	if( timeout === undefined )
	{
		timeout = 0;
	}

    var url = CCAPIFacebook.API_URL;
    url += apiCall;

    var cacheFile = CCAPIFacebook.SetCacheFile( apiCall );

    // If we don't have a userAccessToken we should try to fail
	if( !CCAPIFacebook.m_userAccessToken )
	{
		// If we need it, fail
		if( refresh )
		{
			if( inCallback )
			{
				inCallback.run();
			}
			return;
		}

		// If our data isn't cached, fail
		var data = CC.LoadData( cacheFile );
        if( data === undefined )
        {
			if( inCallback )
			{
				inCallback.run();
			}
			return;
        }
	}

    if( CCAPIFacebook.m_userAccessToken )
    {
		url += "?access_token=" + CCAPIFacebook.m_userAccessToken;
    }

    if( limit )
    {
        url += "&limit=";
        url += limit;
    }

    if( offset !== undefined )
    {
        url += "&offset=";
        url += offset;
    }

    var proxyURL = url;
    if( MultiplayerManager.UseURLProxy( url ) )
	{
        proxyURL = SERVER_ROOT + "backend/helper.php?url=" + url;
		proxyURL = url;
    }

	gURLManager.requestURL( proxyURL,
							null,
							new CCFBCallback( inCallback, url, cacheFile ) );
};


CCAPIFacebook.RequestFBURL = function(inCallback, url, priority, refresh, timeout)
{
	if( !CCAPIFacebook.m_userAccessToken )
	{
		//return;
	}

	if( !refresh )
	{
		refresh = false;
	}

	if( !timeout )
	{
		timeout = 0;
	}

    var cacheFile = String.SplitAfter( url, "facebook.com/" );
    {
        cacheFile = String.RemoveBetweenIncluding( cacheFile, "access_token=", "&" );

        cacheFile = String.ReplaceChar( cacheFile, '/', '.' );
        cacheFile = String.ReplaceChar( cacheFile, '?', '.' );
        cacheFile = String.ReplaceChar( cacheFile, '&', '.' );
        cacheFile = String.ReplaceChar( cacheFile, '=', '.' );
    }

    // Replace access token
    var escapedURL = String.RemoveBetweenIncluding( url, "access_token=", "&" );
    escapedURL += "&access_token=" + CCAPIFacebook.m_userAccessToken;

	gURLManager.requestURL( escapedURL,
                            null,
                            new CCFBCallback( inCallback, url ).run,
                            0,
                            cacheFile,
                            refresh ? 0 : -1,
                            timeout );
};


CCAPIFacebook.RequestPhotoID = function(fbInterface, photoID, priority)
{
	var url = "http://softpoetry.com/backend/facebook.php?profilethumb=" + photoID;

	if( CCAPIFacebook.m_userAccessToken )
	{
		url += "&token=" + CCAPIFacebook.m_userAccessToken;
	}

	gEngine.textureManager.getTextureHandle( url,
		function (textureHandle)
		{
			fbInterface.APIDownloadedPhoto( url, photoID );
		});
};


CCAPIFacebook.SetUserAccessToken = function(token)
{
	CCAPIFacebook.m_userAccessToken = token;
};


CCAPIFacebook.GetUserAccessToken = function()
{
	return CCAPIFacebook.m_userAccessToken;
};


CCAPIFacebook.ClearCache = function()
{
	delete CCAPIFacebook.m_userAccessToken;
	CC.DeleteData( "facebook.me" );
};


CCAPIFacebook.GetAuthorizationURL = function()
{
	var authorizationURL = "https://www.facebook.com/dialog/oauth";
    authorizationURL += "?client_id=";
    authorizationURL += CCAPIFacebook.APP_ID;

	authorizationURL += "&redirect_uri=http://softpoetry.com/backend/facebook.php?domain=" + SERVER_ROOT.getDomain() + "&";

    authorizationURL += "type=user_agent&";
    authorizationURL += "display=popup&";
    authorizationURL += "scope=";
    authorizationURL += CCAPIFacebook.API_PERMISSIONS;
    return authorizationURL;
};


CCAPIFacebook.StartLogin = function(callback)
{
	if( !CCAPIFacebook.m_onLoginResult )
	{
		CCEngine.WebViewOpen( CCAPIFacebook.GetAuthorizationURL(), function (webViewController, opened)
		{
			if( opened )
			{
				CCAPIFacebook.m_onLoginResult = callback;
			}
		},
		CCAPIFacebook.ProcessLogin,
		{width:480, height:480} );
	}
};


CCAPIFacebook.ProcessLogin = function(webViewController, url, open)
{
	if( open )
	{
		if( url.contains( "connected.php" ) )
		{
			var splitURL = url.split( "#access_token" );
			if( splitURL.length > 1 )
			{
				var token = String.SplitBetween( url, "#access_token=", "&" );
				CCAPIFacebook.SetUserAccessToken( token );
			}
			CCAPIFacebook.FinishLogin();
			return;
		}

		// Only allow certain actions on Tizen devices, as there is no close button
		if( window.tizen )
		{
			if( !url.contains( "facebook.com/recover/initiate/" ) &&
				!url.contains( "facebook.com/login/identify?" ) )
			{
				var allowedURLs = [
					"about:blank",
					"login.php?",
					"dialog/oauth",
					"facebook.php",
					"connected.php"
				];
				for( var i=0; i<allowedURLs.length; ++i )
				{
					if( url.contains( allowedURLs[i] ) )
					{
						return;
					}
				}
			}
			CCAPIFacebook.FinishLogin();
            AlertsManager.TimeoutAlert( "only login function is available", 15.0 );
		}
	}
	else
	{
        CCAPIFacebook.FinishLogin();
	}
};


CCAPIFacebook.FinishLogin = function()
{
	CCEngine.WebViewClose();

	if( CCAPIFacebook.m_onLoginResult )
    {
        if( CCAPIFacebook.m_userAccessToken )
        {
			gURLManager.setDomainTimeOut( "facebook.com", 1.0 );
			CCAPIFacebook.m_onLoginResult();
			delete CCAPIFacebook.m_onLoginResult;
        }
        else
        {
            delete CCAPIFacebook.m_onLoginResult;
        }
    }
};


CCAPIFacebook.IsLoggingIn = function()
{
	return !!CCAPIFacebook.m_onLoginResult;
};

