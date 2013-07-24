/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCAPIGoogle.js
 * Description : Handles Google API.
 *
 * Created     : 21/05/13
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

function CCAPIGoogle() {}
CCAPIGoogle.User = undefined;


CCAPIGoogle.RequestPhotoID = function(photoInterface, photoID, priority)
{
	var url = "http://playitor.com/google+/users/";
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


CCAPIGoogle.ClearCache = function()
{
	delete CCAPIGoogle.User;
	CC.DeleteData( "google.me" );
};


CCAPIGoogle.StartLogin = function(callback)
{
	if( !CCAPIGoogle.m_onLoginResult )
	{
		var url = "http://playitor.com/google+/?auto";

		if( url.getDomain() !== SERVER_ROOT.getDomain() )
		{
			url += "&redirect_uri=" + SERVER_ROOT + "google+/";
		}

		CCEngine.WebViewOpen( url, function (webViewController, opened)
		{
			if( opened )
			{
				CCAPIGoogle.m_onLoginResult = callback;
			}
		},
		CCAPIGoogle.ProcessLogin,
		{width:480, height:480} );
	}
};


CCAPIGoogle.ProcessLogin = function(webViewController, url, open)
{
	if( open )
	{
		var splitURL = url.split( "?" );
		if( splitURL.length > 1 )
		{
			var parametersString = splitURL[1];
			var parametersSplit = parametersString.split( "&" );

			var id;
			var name;
			for( var i=0; i<parametersSplit.length; ++i )
			{
				var parameters = parametersSplit[i];
				var parameterSplit = parameters.split( "=" );
				if( parameterSplit.length > 1 )
				{
					var key = parameterSplit[0];
					var value = parameterSplit[1];

					if( key === "id" )
					{
						id = value;
					}
					else if( key === "name" )
					{
						name = unescape( value );
					}
				}
			}

			if( id && name )
			{
				var username = splitURL[1].split( "&" );
				CCAPIGoogle.User = {};
				CCAPIGoogle.User.id = id;
				CCAPIGoogle.User.name = name;
				CC.SaveData( "google.me", JSON.stringify( CCAPIGoogle.User ) );

				CCAPIGoogle.FinishLogin( true );
			}
		}
	}
	else
	{
		CCAPIGoogle.FinishLogin( false );
	}
};


CCAPIGoogle.FinishLogin = function(connected)
{
	CCEngine.WebViewClose();

	if( CCAPIGoogle.m_onLoginResult )
    {
        if( connected )
        {
			CCAPIGoogle.m_onLoginResult();
			delete CCAPIGoogle.m_onLoginResult;
        }
        else
        {
            delete CCAPIGoogle.m_onLoginResult;
        }
    }
};


CCAPIGoogle.IsLoggingIn = function()
{
	return !!CCAPIGoogle.m_onLoginResult;
};
