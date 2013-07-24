/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCAPITwitter.js
 * Description : Handles Twitter API.
 *
 * Created     : 31/01/13
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

function CCAPITwitter() {}
CCAPITwitter.m_user = undefined;


CCAPITwitter.RequestPhotoID = function(photoInterface, photoID, priority)
{
	var url = "http://multiplay.io/twitter/users/";
	url += photoID;
	url += ".jpg";

	if( url.getDomain() !== windowDomain )
	{
        url = SERVER_ROOT + "backend/helper.php?url=" + url;
	}

	gEngine.textureManager.getTextureHandle( url,
		function (textureHandle)
		{
			photoInterface.APIDownloadedPhoto( url, photoID );
		});
};


CCAPITwitter.ClearCache = function()
{
	delete CCAPITwitter.m_user;
	CC.DeleteData( "twitter.me" );
};


CCAPITwitter.StartLogin = function(tweetSkippable, callback)
{
	if( !CCAPITwitter.m_onLoginResult )
	{
		var url = "http://multiplay.io/twitter/?auto";
		if( tweetSkippable )
		{
			url += "&tweetSkippable";
		}

		if( url.getDomain() !== windowDomain )
		{
			url += "&redirect_uri=" + SERVER_ROOT + "/twitter/";
		}


		CCEngine.WebViewOpen( url, function (webViewController, opened)
		{
			if( opened )
			{
				CCAPITwitter.m_onLoginResult = callback;
			}
		},
		CCAPITwitter.ProcessLogin,
		{width:480, height:480} );
	}
};


CCAPITwitter.ProcessLogin = function(webViewController, url, open)
{
	if( open )
	{
		var splitURL = url.split( "/twitter/index.php?connected=" );
		if( splitURL.length > 1 )
		{
			var username = splitURL[1].split( "&" );
			CCAPITwitter.m_user = username[0];
			CC.SaveData( "twitter.me", username[0] );

			CCAPITwitter.FinishLogin( true );
		}
	}
	else
	{
		CCAPITwitter.FinishLogin( false );
	}
};


CCAPITwitter.FinishLogin = function(connected)
{
	CCEngine.WebViewClose();

	if( CCAPITwitter.m_onLoginResult )
    {
        if( connected )
        {
			CCAPITwitter.m_onLoginResult();
			delete CCAPITwitter.m_onLoginResult;
        }
        else
        {
            delete CCAPITwitter.m_onLoginResult;
        }
    }
};


CCAPITwitter.IsLoggingIn = function()
{
	return !!CCAPITwitter.m_onLoginResult;
};
