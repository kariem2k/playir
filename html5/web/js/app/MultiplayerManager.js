/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : MultiplayerManager.js
 * Description : Handles talking to our multiplayer server
 *
 * Created     : 03/10/12
 *-----------------------------------------------------------
 */

function MultiplayerManager()
{
}

MultiplayerManager.LoggedIn = false;        // Logged in to our service?
MultiplayerManager.SessionID = "undefined";
MultiplayerManager.UserID = CC.LoadData( "userID" );
if( !MultiplayerManager.UserID )
{
    MultiplayerManager.UserID = "undefined";
}
MultiplayerManager.LinkedUsers = CC.LoadData( "MultiplayerManager.LinkedUsers" );
if( MultiplayerManager.LinkedUsers )
{
    MultiplayerManager.LinkedUsers = MultiplayerManager.LinkedUsers.split( "," );
}
else
{
    MultiplayerManager.LinkedUsers = [];
}
MultiplayerManager.Password = undefined;
MultiplayerManager.UpdateCallbacks = [];
MultiplayerManager.UserInfos = [];


MultiplayerManager.Disconnect = function()
{
    this.ForceDisconnected = true;
    if( window.SocketManager )
    {
        SocketManager.ForceDisconnect();
    }
};


MultiplayerManager.Emit = function(id)
{
    if( MultiplayerManager.LoggedIn && window.socket )
    {
        if( arguments.length === 1 )
        {
            window.socket.emit( id );
        }
        else if( arguments.length === 2 )
        {
            window.socket.emit( id, arguments[1] );
        }
        else if( arguments.length === 3 )
        {
            window.socket.emit( id, arguments[1], arguments[2] );
        }
        else if( arguments.length === 4 )
        {
            window.socket.emit( id, arguments[1], arguments[2], arguments[3] );
        }
        else if( arguments.length === 5 )
        {
            window.socket.emit( id, arguments[1], arguments[2], arguments[3], arguments[4] );
        }
        else
        {
            alert( "MultiplayerManager.Emit: Too many arguments" );
        }
        return true;
    }
    return false;
};


MultiplayerManager.Connect = function()
{
    if( MultiplayerManager.ForceDisconnected )
    {
        delete this.ForceDisconnected;
    }

    if( window.socket )
    {
        return;
    }

    if( window.SocketManager )
    {
        SocketManager.Restart();
        return;
    }

    // Start our connection to SocketIO
    var serverURL, httpServerURL;

    var httpPorts = [80, 4000];
    var currentPortIndex = 0;

    var SocketIOConnectionFunction = function (result)
    {
        // Retry on failed connection every 5 seconds
        if( !window.SocketManager )
        {
            setTimeout( function()
            {
                currentPortIndex++;
                if( currentPortIndex >= httpPorts.length )
                {
                    currentPortIndex = 0;
                }
                httpServerURL = "http://" + serverURL + ":" + httpPorts[currentPortIndex] + "/";

                CC.LoadScript( httpServerURL + "socketmanager.js", SocketIOConnectionFunction );
            }, 5000 );
        }
        else
        {
            var LoadClientServices = function (result)
            {
                CC.LoadScript( httpServerURL + "clientservices.js", function (result)
                {
                    if( result && window.services )
                    {
                        SocketManager.Start( serverURL, httpPorts[currentPortIndex] );
                    }
                    else
                    {
                        setTimeout( LoadClientServices, 5000 );
                    }
                });
            };
            LoadClientServices();
        }
    };

    if( DEBUG_UseLocalServer )
    {
        currentPortIndex = 1;
        serverURL = "192.168.1.89";
        //serverURL = "10.128.59.12";
        if( window.location.href.split( "/localhost/" ).length > 1 )
        {
            serverURL = "localhost";
        }
        httpServerURL = "http://" + serverURL + ":4000/";
        CC.LoadScript( httpServerURL + "socketmanager.js", SocketIOConnectionFunction );
    }
    else
    {
        var ServerConnectionFunction = function()
        {
            var url = "http://playir.com/backend/lobby.php?list&client=" + window.APP_ID;
            // If we want to access our production server from a local session
            if( MultiplayerManager.UseURLProxy( url ) )
            {
                url = SERVER_ROOT + "backend/helper.php?url=" + url + "&noCache=" + new Date().getTime();
            }
            gURLManager.requestURL( url,
                                    null,
                                    function(status, responseText)
                                    {
                                        if( status >= CCURLRequest.Succeeded && responseText && responseText.length > 0 )
                                        {
                                            serverURL = responseText.split( ":" )[0];
                                            httpServerURL = "http://" + responseText + "/";
                                            CC.LoadScript( httpServerURL + "socketmanager.js", SocketIOConnectionFunction );
                                        }
                                        else
                                        {
                                            setTimeout( ServerConnectionFunction, 10000 );
                                        }
                                    },
                                    1,
                                    "socketURL",
                                    0 );
        };
        ServerConnectionFunction();
    }
};


MultiplayerManager.DetectGeoLocation = function()
{
    var url = "http://playir.com/backend/mapper.php?ip";
    if( MultiplayerManager.UseURLProxy( url ) )
    {
        url = SERVER_ROOT + "backend/helper.php?url=" + url;
    }
    gURLManager.requestURL( url,
                            null,
                            function(status, responseText)
                            {
                                if( status >= CCURLRequest.Succeeded )
                                {
                                    MultiplayerManager.DetectedGeoLocation( responseText );
                                }
                            });

    //var geoLocationData = '{ "statusCode" : "OK", "statusMessage" : "", "ipAddress" : "86.162.101.232", "countryCode" : "UK", "countryName" : "UNITED KINGDOM", "regionName" : "ENGLAND", "cityName" : "LONDON", "zipCode" : "-", "latitude" : "51.5085", "longitude" : "-0.12574", "timeZone" : "+01:00" }';
    //MultiplayerManager.DetectedGeoLocation();
};


MultiplayerManager.DetectedGeoLocation = function(geoLocationData)
{
    if( geoLocationData && geoLocationData.length > 0 )
    {
        try
        {
            var root = JSON.parse( geoLocationData );
            if( root )
            {
                if( root.statusCode === "OK" )
                {
                    var geoLocationCountryCode = root.countryCode;
                    if( geoLocationCountryCode && geoLocationCountryCode.length === 2 )
                    {
                        MultiplayerManager.geoLocationCountryCode = geoLocationCountryCode.toLowerCase();

                        if( window.sceneManagerGame )
                        {
                            sceneManagerGame.createFlag();
                        }
                    }
                }
            }
        }
        catch (error)
        {
        }
    }
};


MultiplayerManager.RequestJoinMap = function(mapID, playerType)
{
    MultiplayerManager.Emit( 'BSJoinMap', playerType, mapID );
};


MultiplayerManager.SyncLoadedMap = function(location)
{
    if( MultiplayerManager.LoggedIn )
    {
        BurgersClient.enteredGame( location );
    }
};


MultiplayerManager.LocationVector = vec3.create();

MultiplayerManager.SyncServerPlayerGotoLocation = function(map, location)
{
    if( map.isOnlineGame() )
    {
        if( MultiplayerManager.LoggedIn )
        {
            var mapBounds = map.getMapBounds();
            var LocationVector = MultiplayerManager.LocationVector;
            LocationVector[0] = location[0] / mapBounds.width;
            LocationVector[1] = location[1];
            LocationVector[2] = location[2] / mapBounds.width;
            var tLocation = vec3.toString( LocationVector );
            BurgersClient.gotoLocation( tLocation );
        }
    }
};


MultiplayerManager.SyncServerPlayerShootAt = function(map, targetID)
{
    if( map.isOnlineGame() )
    {
        if( MultiplayerManager.LoggedIn )
        {
            BurgersClient.shootAt( targetID );
        }
    }
};


MultiplayerManager.SyncShootAtTarget = function(map, targetLocation)
{
    if( map.isOnlineGame() )
    {
        var mapBounds = map.getMapBounds();
        var LocationVector = MultiplayerManager.LocationVector;
        LocationVector[0] = location[0] / mapBounds.width;
        LocationVector[1] = location[1];
        LocationVector[2] = location[2] / mapBounds.width;
        var tLocation = vec3.toString( LocationVector );
        MultiplayerManager.Emit( 'SyncShootAtTarget', targetLocation );
    }
};


MultiplayerManager.SyncHealth = function(map, health)
{
    if( map.isOnlineGame() )
    {
        MultiplayerManager.Emit( 'SyncHealth', health );
    }
};


MultiplayerManager.SyncPlayerAction = function(map, actionID)
{
    if( map.isOnlineGame() )
    {
        MultiplayerManager.Emit( 'SyncPlayerAction', actionID );
    }
};


MultiplayerManager.SyncRegisterDamage = function(victimID, attackerID, damage)
{
    MultiplayerManager.Emit( 'SyncRegisterDamage', victimID, attackerID, damage );
};


MultiplayerManager.SyncServerRegisterPickup = function(playerID, pickupType, pickupID)
{
    MultiplayerManager.Emit( 'BSRegisterPickup', playerID, pickupType, pickupID ? pickupID : "0" );
};


MultiplayerManager.SyncMessage = function(message, toID)
{
    MultiplayerManager.Emit( 'SyncMessage', message, toID );
};


MultiplayerManager.IsOwner = function(owners)
{
    if( MultiplayerManager.admin )
    {
        return true;
    }

    if( owners )
    {
        var i;
        var LinkedUsers = MultiplayerManager.LinkedUsers;
        for( i=0; i<owners.length; ++i )
        {
            var ownerID = owners[i];
            if( ownerID === MultiplayerManager.UserID )
            {
                return true;
            }

            for( var j=0; j<LinkedUsers.length; ++j )
            {
                var linkedID = LinkedUsers[j];
                if( ownerID === linkedID )
                {
                    return true;
                }
            }
        }
    }
    return false;
};


MultiplayerManager.UseURLProxy = function(url)
{
    if( window.tizen )
    {
        return false;
    }

    if( url.getDomain() !== WINDOW_DOMAIN )
    {
        return true;
    }
    return false;
};


MultiplayerManager.GetAssetURL = function(path)
{
    if( path.isHTTP() )
    {
        return path;
    }

    if( path.containsDirectory() )
    {
        return SERVER_ROOT + path;
    }

    if( window.tizen )
    {
        var PackagedFiles = CCEngine.PackagedFiles;
        if( PackagedFiles )
        {
            for( var i=0; i<PackagedFiles.length; ++i )
            {
                var packagedFile = PackagedFiles[i];
                if( packagedFile === path )
                {
                    return "packaged/" + packagedFile;
                }
            }
        }
    }

    var filename = path.stripDirectory();
    var url = SERVER_ASSETS_URL + 'assets/?file=' + filename;

    // If we want to access our production server from a local session
    if( MultiplayerManager.UseURLProxy( url ) )
    {
        url = SERVER_ROOT + "backend/helper.php?url=" + url;
    }

    return url;
};


MultiplayerManager.LoadCountry = function(tile, countryCode, callback)
{
    tile.shouldRender = false;

    if( countryCode && countryCode.length === 2 )
    {
        var geoLocationCountryCode = countryCode.toLowerCase();

        var src = "flag_";
        src += geoLocationCountryCode;
        src += ".png";

        if( tile.tileSquares.length === 0 )
        {
            tile.setupTextured( src, callback );
        }
        else
        {
            tile.setupTexturedHeight( tile.collisionSize.height, src, callback );
        }
        tile.shouldRender = true;
    }
};


MultiplayerManager.LoadLocalUserInfo = function(callback)
{
    CCFileManager.Load( APP_ID + ".db", function (data)
    {
        callback( data );
    });
    CCFileManager.Save( APP_ID + ".db", JSON.stringify( this.db ) );
};


MultiplayerManager.SaveLocalUserInfo = function(data)
{
    CCFileManager.Save( APP_ID + ".db", data );
};


MultiplayerManager.IsUserLoggedIn = function()
{
    var userInfo = MultiplayerManager.GetUserInfo( MultiplayerManager.UserID );
    if( userInfo )
    {
        return userInfo.facebook || userInfo.twitter || userInfo.google;
    }
    return false;
};


MultiplayerManager.RegisterFacebook = function()
{
    if( MultiplayerManager.LoggedIn )
    {
        var self = this;

        TileSocialProfile.GetFBInfo( 2, function (id, name)
        {
            if( id && name )
            {
                if( MultiplayerManager.Emit( 'BSRegisterFacebook', id, name ) )
                {
                    var userInfo = MultiplayerManager.GetUserInfo( MultiplayerManager.UserID );
                    if( userInfo )
                    {
                        userInfo.facebook = true;
                    }
                    var UpdateCallbacks = MultiplayerManager.UpdateCallbacks;
                    for( i=0; i<UpdateCallbacks.length; ++i )
                    {
                        if( UpdateCallbacks[i].syncLoggedIntoSocialNetwork )
                        {
                            UpdateCallbacks[i].syncLoggedIntoSocialNetwork( "facebook", id, name );
                        }
                    }
                }
            }
        });
    }
};


MultiplayerManager.RegisterTwitter = function()
{
    if( MultiplayerManager.LoggedIn )
    {
        var self = this;

        var username = TileSocialProfile.GetTwitterInfo();
        if( username )
        {
            if( MultiplayerManager.Emit( 'BSRegisterTwitter', username ) )
            {
                var userInfo = MultiplayerManager.GetUserInfo( MultiplayerManager.UserID );
                if( userInfo )
                {
                    userInfo.twitter = true;
                }
                var UpdateCallbacks = MultiplayerManager.UpdateCallbacks;
                for( i=0; i<UpdateCallbacks.length; ++i )
                {
                    if( UpdateCallbacks[i].syncLoggedIntoSocialNetwork )
                    {
                        UpdateCallbacks[i].syncLoggedIntoSocialNetwork( "twitter", username, "@" + username );
                    }
                }
            }
        }
    }
};


MultiplayerManager.RegisterGoogle = function()
{
    if( MultiplayerManager.LoggedIn )
    {
        var self = this;

        TileSocialProfile.GetGoogleInfo( function (id, name)
        {
            if( id && name )
            {
                if( MultiplayerManager.Emit( 'BSRegisterGoogle', id, name ) )
                {
                    var userInfo = MultiplayerManager.GetUserInfo( MultiplayerManager.UserID );
                    if( userInfo )
                    {
                        userInfo.google = true;
                    }
                    var UpdateCallbacks = MultiplayerManager.UpdateCallbacks;
                    for( i=0; i<UpdateCallbacks.length; ++i )
                    {
                        if( UpdateCallbacks[i].syncLoggedIntoSocialNetwork )
                        {
                            UpdateCallbacks[i].syncLoggedIntoSocialNetwork( "google", id );
                        }
                    }
                }
            }
        });
    }
};


MultiplayerManager.UpdateUserInfo = function(userInfo)
{
    for( var i=0; i<this.UserInfos.length; ++i )
    {
        var itr = this.UserInfos[i];
        if( itr.userID === userInfo.userID )
        {
            this.UserInfos[i] = userInfo;
            return;
        }
    }

    this.UserInfos.add( userInfo );
};


MultiplayerManager.GetUserInfo = function(userID)
{
    for( var i=0; i<this.UserInfos.length; ++i )
    {
        var itr = this.UserInfos[i];
        if( itr.userID === userID )
        {
            return itr;
        }
    }
    return null;
};


function onServerUpdate(service, id, jsonData)
{
    var UpdateCallbacks = MultiplayerManager.UpdateCallbacks;

    var HandleUpdateFunction = function()
    {
        // DEPRECTED: Use BSLoggedIn and BSUpdate after clients >= 8
        var i;
        if( id === "BurgersLoggedIn" )
        {
            if( !MultiplayerManager.ForceDisconnected && window.socket )
            {
                var serviceID = service.serviceID;
                MultiplayerManager.LoggedIn = true;

                // Our linked users are sent in the jsonData packet
                if( jsonData )
                {
                    MultiplayerManager.LinkedUsers = jsonData;
                    CC.SaveData( "MultiplayerManager.LinkedUsers", MultiplayerManager.LinkedUsers );
                }

                BurgersClient.registerDevice( CCEngine.DeviceType, APP_ID, CLIENT_VERSION );

                for( i=0; i<UpdateCallbacks.length; ++i )
                {
                    if( UpdateCallbacks[i].syncLoggedIn )
                    {
                        UpdateCallbacks[i].syncLoggedIn();
                    }
                }

                // Listen for SyncMessage
                socket.onOnly( 'SyncMessage', function (message, fromPlayerID, fromUserID)
                {
                    for( i=0; i<UpdateCallbacks.length; ++i )
                    {
                        if( UpdateCallbacks[i].syncMessage )
                        {
                            UpdateCallbacks[i].syncMessage( message, fromPlayerID, fromUserID );
                        }
                    }
                });
            }
        }
        else if( id === "UpdateLinkedUsers" )
        {
            if( jsonData )
            {
                MultiplayerManager.LinkedUsers = jsonData;
                CC.SaveData( "MultiplayerManager.LinkedUsers", MultiplayerManager.LinkedUsers );
            }
        }
        else if( id === "BurgersGameUpdate" )
        {
            var pendingCallbacks = UpdateCallbacks.slice( 0 );
            for( i=0; i<pendingCallbacks.length; ++i )
            {
                if( pendingCallbacks[i].syncUpdate )
                {
                    pendingCallbacks[i].syncUpdate( jsonData );
                }
            }

            if( jsonData.Restart )
            {
                SceneMultiManager.RestartClient();
            }
            else if( jsonData.SoftRestart )
            {
                JSManager.SoftRestart( jsonData );
            }
            else if( jsonData.userInfo )
            {
                var userInfo = jsonData.userInfo;
                if( userInfo.userID === MultiplayerManager.UserID )
                {
                    // Try to log into our social networks if they're missing from the server
                    if( !userInfo.facebook )
                    {
                        MultiplayerManager.RegisterFacebook();
                    }
                    if( !userInfo.twitter )
                    {
                        MultiplayerManager.RegisterTwitter();
                    }
                    if( !userInfo.google )
                    {
                        MultiplayerManager.RegisterGoogle();
                    }
                }
                MultiplayerManager.UpdateUserInfo( userInfo );
            }
            else if( jsonData.appInfo )
            {
                var appInfo = jsonData.appInfo;

                var appInfos;
                var appInfoString = CC.LoadData( "appInfos" );
                if( appInfoString )
                {
                    appInfos = JSON.parse( appInfoString );
                    if( !appInfos )
                    {
                        appInfos = [];
                    }
                }
                else
                {
                    appInfos = [];
                }

                var found = false;
                for( i=0; i<appInfos.length; ++i )
                {
                    if( appInfos[i].id === appInfo.id )
                    {
                        found = true;
                        appInfos[i] = appInfo;
                        break;
                    }
                }

                if( !found )
                {
                    appInfos.push( appInfo );
                }

                CC.SaveData( "appInfos", JSON.stringify( appInfos ) );

                // Finally check our .js
                if( appInfo.jsSync )
                {
                    if( SceneMultiManager.LoadingGame )
                    {
                        SceneMultiManager.LoadingAppInfoUpdated = true;
                        return;
                    }
                    JSManager.RuntimePatch( appInfo.jsFiles );
                }
            }
        }
    };

    // Queue server update to be run after Engine update
    //requestAnimFrame( HandleUpdateFunction );
    HandleUpdateFunction();
}


function onConnect(sessionID, sessionPassword)
{
    if( MultiplayerManager.ForceDisconnected )
    {
        if( window.SocketManager )
        {
            SocketManager.ForceDisconnect();
        }
    }

    if( MultiplayerManager.LoggedIn )
    {
        MultiplayerManager.LoggedIn = false;
    }

    MultiplayerManager.SessionID = sessionID;
    var userID = getUserID( sessionID );
    var password = getPassword( sessionPassword );
    MultiplayerManager.UserID = userID;
    MultiplayerManager.Password = password;
    login( userID, password );

    registerSocketServices( socket );
}


function onDisconnect()
{
    if( MultiplayerManager.LoggedIn )
    {
        MultiplayerManager.LoggedIn = false;
    }

    var UpdateCallbacks = MultiplayerManager.UpdateCallbacks;
    for( i=0; i<UpdateCallbacks.length; ++i )
    {
        if( UpdateCallbacks[i].syncDisconnected )
        {
            UpdateCallbacks[i].syncDisconnected();
        }
    }

    disconnectServices();
}


function updateServices()
{
}
