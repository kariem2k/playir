/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : SceneManagerPlay.js
 * Description : Play manager handling generic movement and actions.
 *
 * Created     : 03/10/12
 *-----------------------------------------------------------
 */

function SceneManagerPlay()
{
    this.construct();
}
ExtendPrototype( SceneManagerPlay, CCSceneAppUI );
var sceneManagerPlay;


SceneManagerPlay.prototype.construct = function()
{
    sceneManagerPlay = this;
    MultiplayerManager.UpdateCallbacks.addOnce( this );

    this.CCSceneAppUI_construct();

    this.cameraCentered = true;

    this.map = null;

    this.tileNotifications = undefined;
};


SceneManagerPlay.prototype.destruct = function()
{
    if( sceneManagerPlay === this )
    {
        sceneManagerPlay = null;
    }

    // Delete sub scenes
    if( this.map )
    {
        this.map.destruct();
    }

    this.CCSceneAppUI_destruct();
};


SceneManagerPlay.prototype.setup = function()
{
    var self = this;

    if( !this.camera )
    {
        var camera = gEngine.newSceneCamera( this );
        camera.setupViewport( 0.0, 0.0, 1.0, 1.0 );
        camera.useSceneCollideables( this );
    }

	this.CCSceneAppUI_setup();

    if( MultiplayerManager.LoggedIn )
    {
        this.syncLoggedIn();
    }
};


SceneManagerPlay.prototype.touchPressed = function(touch)
{
    return this.CCSceneAppUI_touchPressed( touch );
};


SceneManagerPlay.prototype.touchMoving = function(touch, touchDelta)
{
    return false;
};


SceneManagerPlay.prototype.touchReleased = function(touch, touchAction)
{
    return this.CCSceneAppUI_touchReleased( touch, touchAction );
};


SceneManagerPlay.prototype.syncDisconnected = function()
{
};


SceneManagerPlay.prototype.syncLoggedIn = function()
{
    this.setupPushNotifications();
};


SceneManagerPlay.prototype.syncUpdate = function(jsonData)
{
    if( jsonData.js )
    {
        eval( jsonData.js );
    }
    else
    {
        var map = this.map;
        if( map )
        {
            if( jsonData.addPlayer )
            {
                if( map.getMapType() === "1vs1" )
                {
                    if( map.getNumberOfPlayers() >= 2 )
                    {
                        if( this.tileNotifications )
                        {
                            this.tileNotifications.setText( "" );
                        }
                    }
                }
                else if( map.getMapType() === "BattleRoyale" )
                {
                    players = map.getNumberOfHumanPlayers();
                    text = "- ";
                    text += players;
                    text += " -";

                    if( this.tileNotifications )
                    {
                        this.tileNotifications.setText( text );
                    }
                }
            }
            else if( jsonData.removePlayer )
            {
                if( map.getMapType() === "BattleRoyale" )
                {
                    var players = map.getNumberOfHumanPlayers();
                    text = "- ";
                    text += players;
                    text += " -";

                    if( this.tileNotifications )
                    {
                        this.tileNotifications.setText( text );
                    }
                }
            }
        }
    }
};


// static const char *disablePushNotificationsFile = "disablePushNotifications";
SceneManagerPlay.prototype.setupPushNotifications = function()
{
    // if( CCFileManager::DoesFileExist( disablePushNotificationsFile, Resource_Cached ) === false )
    // {
    //     togglePushNotifications();
    // }
};


// void SceneManagerPlay::togglePushNotifications()
// {
//     if( MultiplayerManager::scene.isLoggedIn() )
//     {
//         const bool shouldRegisterPushNotification = !registeredPushNotification;
//         if( shouldRegisterPushNotification )
//         {
// #if defined( ANDROID ) && !defined( SAMSUNG )

//             if( CCFileManager::DoesFileExist( disablePushNotificationsFile, Resource_Cached ) )
//             {
//                 CCFileManager::DeleteCachedFile( disablePushNotificationsFile );
//             }

//             registeredPushNotification = true;
//             scenePlayScreen.enablePushNotifications();

//             class ThreadCallback : public CCLambdaCallback
//             {
//             public:
//                 ThreadCallback() {}
//                 void run()
//                 {
//                     CCJNI::GCMRegister();
//                 }
//             };

//             gEngine.engineToNativeThread( new ThreadCallback() );

// #endif
//         }
//         else
//         {
// #if defined( ANDROID ) && !defined( SAMSUNG )

//             CCFileManager::SaveCachedFile( disablePushNotificationsFile, ":)", 3 );

//             registeredPushNotification = false;
//             scenePlayScreen.disablePushNotifications();

//             class ThreadCallback : public CCLambdaCallback
//             {
//             public:
//                 ThreadCallback() {}
//                 void run()
//                 {
//                     CCJNI::GCMUnregister();
//                 }
//             };

//             gEngine.engineToNativeThread( new ThreadCallback() );

// #endif
//         }
//     }
// }


SceneManagerPlay.prototype.getPlayerTypeInfo = function(playerType)
{
    var playerTypes = this.playerTypes;
    for( var i=0; i<playerTypes.length; ++i )
    {
        var playerTypeInfo = playerTypes[i];
        if( playerTypeInfo.type === playerType )
        {
            return playerTypeInfo;
        }
    }

    return this.playerTypes[0];
};


SceneManagerPlay.prototype.spawnCharacter = function(type, onLoadedCallback)
{
    var playerTypes = this.playerTypes;
    if( playerTypes )
    {
        for( var i=0; i<playerTypes.length; ++i )
        {
            var playerType = playerTypes[i];
            if( type === playerType.type )
            {
                return CharacterPlayer.Spawn( type, playerType.obj, playerType.tex, playerType.speed, playerType.size, onLoadedCallback );
            }
        }
    }

    return CharacterPlayerAndroid.Spawn( "iBot", onLoadedCallback );
};


SceneManagerPlay.SpawnCharacter = function(type, onLoadedCallback)
{
    if( type.startsWith( "model." ) )
    {
        return CharacterPlayerModel.Spawn( type, onLoadedCallback );
    }

    if( type.startsWith( "character." ) )
    {
        return CharacterPlayerPrefab.Spawn( type, onLoadedCallback );
    }

    if( type.contains( "burger" ) ||
        type.contains( "fries" ) )
    {
        return CharacterPlayerBurger.Spawn( type, onLoadedCallback );
    }
    else if( type.contains( "androBot" ) ||
             type.contains( "iBot" ) ||
             type.contains( "winBot" ) )
    {
        return CharacterPlayerAndroid.Spawn( type, onLoadedCallback );
    }
    else if( type.contains( "webBot" ) )
    {
        return CharacterPlayerWeb.Spawn( type, onLoadedCallback );
    }
    else if( type.contains( "soldier" ) ||
             type.contains( "miniche" ) )
    {
        return CharacterPlayerSoldier.Spawn( type, onLoadedCallback );
    }
    else if( type.contains( "tank" ) )
    {
        return CharacterPlayerTank.Spawn( type, onLoadedCallback );
    }

    return sceneManagerPlay.spawnCharacter( type, onLoadedCallback );
};
