/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : SceneManagerGame.js
 * Description : Game specific manager, handling sub-scenes.
 *
 * Created     : 26/11/12
 *-----------------------------------------------------------
 */

function SceneManagerGame()
{
    this.construct();
}
ExtendPrototype( SceneManagerGame, SceneManagerPlay );
var sceneManagerGame;


SceneManagerGame.DefaultPlayerTypes = [
    {
        type:"iBot",
        icon:"iBot_icon.png",
        obj:"iBot_body.obj",
        tex:"iBot_diffuse.jpg"
    },
    {
        type:"winBot",
        icon:"androBot_icon.png",
        obj:"winBot_body.obj",
        tex:"winBot_diffuse.jpg"
    }];
SceneManagerGame.HelpImage = "phonewars_helpscreen.jpg";


SceneManagerGame.prototype.construct = function()
{
    sceneManagerGame = this;

    this.SceneManagerPlay_construct();

    // Try to pre-load our cached game info
    var appInfoString = CC.LoadData( "appInfos" );
    if( appInfoString )
    {
        var appInfos = JSON.parse( appInfoString );
        if( appInfos )
        {
            for( var i=0; i<appInfos.length; ++i )
            {
                var appInfo = appInfos[i];
                if( appInfo.id === APP_ID )
                {
                    this.updateAppInfo( appInfo );
                    break;
                }
            }
        }
    }

    if( !this.playerTypes || this.playerTypes.length === 0 )
    {
        this.playerTypes = SceneManagerGame.DefaultPlayerTypes;
    }

    if( this.playerTypes.length < 2 )
    {
        this.playerTypes.push( SceneManagerGame.DefaultPlayerTypes[1] );
    }

    if( !this.playerType )
    {
        this.playerType = this.playerTypes[0].type;
    }

    // Pre-load character
    SceneManagerPlay.SpawnCharacter( this.playerType, function(player)
    {
        player.noScene = true;
        player.destruct();
    });

    {
        this.sceneBackground = new SceneBackground();
        gEngine.addScene( this.sceneBackground );

        this.sceneSplashScreen = new SceneSplashScreen();
        gEngine.addScene( this.sceneSplashScreen );

        this.scenePlayScreen = new ScenePlayScreen();
        gEngine.addScene( this.scenePlayScreen );

        this.sceneLeaderboards = new SceneLeaderboards();
        gEngine.addScene( this.sceneLeaderboards );

        this.sceneMultiLauncher = new SceneMultiUILauncher( this );
    }

    this.waitingForOpponent = false;
    this.waitingForOpponentStartedTimer = false;
    this.registeredPushNotification = false;

    this.tileFlag = null;

    // Load these textures in the background
    gEngine.textureManager.getTextureHandle( SceneManagerGame.HelpImage );
    gEngine.textureManager.getTextureHandle( SceneGameMap.DefaultMapImage );
};


// GameState enum
SceneManagerGame.GameState_SplashScreen = 0;
SceneManagerGame.GameState_CharacterSelectScreen = 1;
SceneManagerGame.GameState_ReadyToPlay1vs1 = 2;
SceneManagerGame.GameState_ReadyToPlayBattleRoyale = 3;
SceneManagerGame.GameState_Playing1vs1 = 4;
SceneManagerGame.GameState_PlayingBattleRoyale = 5;
SceneManagerGame.GameState_Leaderboards = 6;


SceneManagerGame.prototype.destruct = function()
{
    if( sceneManagerGame === this )
    {
        sceneManagerGame = null;
    }

    // Delete sub scenes
    {
        if( this.sceneLeaderboards )
        {
            this.sceneLeaderboards.destruct();
        }

        if( this.scenePlayScreen )
        {
            this.scenePlayScreen.destruct();
        }

        if( this.sceneSplashScreen )
        {
            this.sceneSplashScreen.destruct();
        }

        if( this.sceneBackground )
        {
            this.sceneBackground.destruct();
        }
    }

    this.SceneManagerPlay_destruct();
};


SceneManagerGame.prototype.setup = function()
{
    var self = this;
	this.SceneManagerPlay_setup();

    var camera = this.camera;
    camera.setCameraWidth( SceneBackground.SceneWidth );

    var tile;
    {
        tile = new CCTile3DButton( this );
        tile.setupText( " ", camera.targetHeight * 0.0725, true, false );
        tile.setDrawOrder( 205 );
        tile.setTextColour( gColour.setRGBA( 1.0, 1.0, 1.0, 1.0 ) );

        tile.setTextBlinking( true );

        this.tileNotifications = tile;
        this.tileNotifications.setText( "tap to start" );
    }

    this.tileTitleMessages = [];
    {
        tile = new CCTile3DButton( this );
        tile.setupText( "", camera.targetHeight * 0.06, true, false );
        tile.setDrawOrder( 205 );
        tile.setTextColour( 1.0 );

        this.tileTitleMessages.add( tile );
    }

    {
        tile = new CCTile3DButton( this );
        tile.setupText( "", camera.targetHeight * 0.05, true, false );
        tile.setDrawOrder( 205 );
        tile.setTextColour( 1.0 );

        this.tileTitleMessages.add( tile );
    }

    {
        tile = new CCTile3DButton( this );
        tile.setupText( "", camera.targetHeight * 0.05, true, false );
        tile.setDrawOrder( 205 );
        tile.setTextColour( 1.0 );
        this.tilePlayerStatus = tile;
    }

    {
        tile = new CCTile3DButton( this );
        tile.setupTexturedWidth( camera.targetWidth * 0.085, "ui_back.png" );
        tile.setColourAlpha( 0.0 );
        tile.setDrawOrder( 205 );
        this.tileBack = tile;

        this.addTile( tile );
        tile.onRelease.push( function()
        {
            self.handleBackButton();
        });

        this.resizeCallbacks.push( function()
        {
            tile = self.tileBack;
            tile.setPositionXYZ( ( camera.targetWidth * 0.5 ) - tile.collisionBounds[0],
                                 ( camera.targetHeight * 0.5 ) - tile.collisionBounds[1],
                                  0.0 );
        });

        this.hideBack();
    }

    this.createFlag();

    this.gotoSplashScreenGameState();
};


SceneManagerGame.prototype.resize = function()
{
    this.SceneManagerPlay_resize();
    var camera = this.camera;

    if( this.tileNotifications )
    {
        var idealAspectRatio = 1.5;//1080.0f/720.0;
        var aspectRatioAdjutment = camera.getAspectRatio() < 1.25 ? camera.getAspectRatio() / idealAspectRatio : 1.0;

        var tile;
        {
            this.tileNotifications.setTextHeight( camera.targetHeight * 0.08 * aspectRatioAdjutment, true );

            {
                tile = this.tileTitleMessages[0];
                tile.setTextHeight( camera.targetHeight * 0.06 * aspectRatioAdjutment, true );
                tile.setPositionXYZ( -( camera.targetWidth * 0.5 ) + tile.collisionBounds[0], +( camera.targetHeight * 0.5 ) - tile.collisionBounds[1], 0.0 );
            }

            {
                tile = this.tileTitleMessages[1];
                tile.setTextHeight( camera.targetHeight * 0.06 * aspectRatioAdjutment, true );
                tile.positionTileBelow( this.tileTitleMessages[0] );
                tile.setPositionX( -( camera.targetWidth * 0.5 ) + tile.collisionBounds[0] );
            }

            {
                tile = this.tilePlayerStatus;
                tile.setTextHeight( camera.targetHeight * 0.05 * aspectRatioAdjutment, true );
                tile.positionTileBelow( this.tileTitleMessages[1] );
                tile.setPositionX( -( camera.targetWidth * 0.5 ) + tile.collisionBounds[0] );
            }
        }

        {
            tile = this.tileNotifications;
            var gameState = this.gameState;
            if( gameState === SceneManagerGame.GameState_CharacterSelectScreen || gameState === SceneManagerGame.GameState_ReadyToPlay1vs1 || gameState === SceneManagerGame.GameState_ReadyToPlayBattleRoyale )
            {
                tile.setPositionX( -camera.targetWidth * 0.2 * 0.5 );
            }
            else
            {
                tile.setPositionX( 0.0 );
            }
            tile.setPositionY( -camera.cameraHHeight + tile.collisionBounds[1] );
        }

        if( this.tileFlag )
        {
            tile = this.tileFlag;
            if( tile.getTileTextureImage() )
            {
                tile.setTileTexturedHeight( camera.cameraHeight * 0.05 * aspectRatioAdjutment );
            }
            tile.setPositionXYZ( ( camera.targetWidth * 0.5 ) - tile.collisionBounds[0], ( camera.targetHeight * 0.5 ) - tile.collisionBounds[1], 0.0 );
        }
    }
};


SceneManagerGame.prototype.handleBackButton = function()
{
    if( this.gameState === SceneManagerGame.GameState_CharacterSelectScreen ||
        this.gameState === SceneManagerGame.GameState_ReadyToPlay1vs1 ||
        this.gameState === SceneManagerGame.GameState_ReadyToPlayBattleRoyale )
    {
        this.gotoSplashScreenGameState();
        return true;
    }
    if( this.gameState === SceneManagerGame.GameState_Leaderboards )
    {
        this.exitLeaderboardsState();
        return true;
    }
    return false;
};


SceneManagerGame.prototype.render = function(camera, pass, alpha)
{
    //this.SceneManagerPlay_render( camera, pass, alpha );
};


SceneManagerGame.prototype.touchPressed = function(touch)
{
    return this.SceneManagerPlay_touchPressed( touch );
};


SceneManagerGame.prototype.touchMoving = function(touch, touchDelta)
{
    return false;
};


SceneManagerGame.prototype.touchReleased = function(touch, touchAction)
{
    return this.SceneManagerPlay_touchReleased( touch, touchAction );
};


SceneManagerGame.prototype.updateAppInfo = function(appInfo)
{
    var facebookID = appInfo.facebookID;
    if( facebookID )
    {
        CCAPIFacebook.APP_ID = facebookID;
    }

    var backgroundImage = appInfo.backgroundImage;
    if( backgroundImage )
    {
        SceneBackground.BackgroundImage = backgroundImage;
        if( this.sceneBackground )
        {
            this.sceneBackground.refreshBackgroundImage();
        }
    }

    if( appInfo.helpImage )
    {
        SceneManagerGame.HelpImage = appInfo.helpImage;
        gEngine.textureManager.getTextureHandle( SceneManagerGame.HelpImage );
    }

    if( appInfo.defaultMapImage )
    {
        SceneGameMap.DefaultMapImage = appInfo.defaultMapImage;
        gEngine.textureManager.getTextureHandle( SceneGameMap.DefaultMapImage );
    }

    var i;
    var playerTypes = appInfo.playerTypes;
    if( playerTypes && playerTypes.length >= 2 )
    {
        this.playerTypes = playerTypes;

        // See if our playerType is already selected
        {
            var playerTypeFound = false;
            if( this.playerType )
            {
                for( i=0; i<playerTypes.length; ++i )
                {
                    var playerTypeInfo = playerTypes[i];
                    if( playerTypeInfo.type === this.playerType )
                    {
                        playerTypeFound = true;
                        break;
                    }
                }
            }

            // Reset our playerType
            if( !playerTypeFound )
            {
                this.playerType = this.playerTypes[0].type;

                if( !this.map )
                {
                    if( this.gameState === SceneManagerGame.GameState_CharacterSelectScreen )
                    {
                        this.scenePlayScreen.showPlayerView( this.playerType );
                    }
                }
            }
        }
    }

    if( this.gameState === SceneManagerGame.GameState_SplashScreen )
    {
        this.showSplashScreen();
    }
};


SceneManagerGame.prototype.showSplashScreen = function()
{
    this.scenePlayScreen.hide();

    this.sceneBackground.show();

    var playerTypes = this.playerTypes;
    this.sceneSplashScreen.show( playerTypes[0].type, null, playerTypes[1].type, null );
};


SceneManagerGame.prototype.hideSplashScreen = function()
{
    this.sceneSplashScreen.hide();
};


SceneManagerGame.prototype.showPlayer1 = function(character)
{
    var sceneSplashScreen = this.sceneSplashScreen;
    var sceneLeaderboards = this.sceneLeaderboards;
    if( sceneSplashScreen.isShowingPlayer2() )
    {
        this.hideSplashScreen();
    }

    if( !sceneSplashScreen.isShowingPlayer1() )
    {
        var countryCode = sceneLeaderboards.getPlayerCountryCode( character.getUserID() );
        sceneSplashScreen.showPlayer1( character.getType(), countryCode, 0.5 );

        var tileStripe = sceneSplashScreen.getPlayer1Stripe();
        tileStripe.setColourAlpha( 0.25, true );

        var tileScore = sceneSplashScreen.getPlayer1Score();
        var userInfo = sceneLeaderboards.getUserIDData( SceneLeaderboards.Leaderboard_AllTime, character.getUserID() );
        if( userInfo )
        {
            var winRatio = "";
            winRatio += userInfo.wins;
            winRatio += " / ";
            winRatio += userInfo.losses;
            tileScore.setText( winRatio, false );
            tileScore.setTextColourAlpha( 1.0, true );
        }
    }
};


SceneManagerGame.prototype.showPlayer2 = function(character)
{
    var sceneSplashScreen = this.sceneSplashScreen;
    var sceneLeaderboards = this.sceneLeaderboards;
    if( sceneSplashScreen.isShowingPlayer1() )
    {
        this.hideSplashScreen();
    }

    if( !sceneSplashScreen.isShowingPlayer2() )
    {
        var countryCode = sceneLeaderboards.getPlayerCountryCode( character.getUserID() );
        sceneSplashScreen.showPlayer2( character.getType(), countryCode, 0.5 );

        var tileStripe = sceneSplashScreen.getPlayer2Stripe();
        tileStripe.setColourAlpha( 0.25, true );

        var tileScore = sceneSplashScreen.getPlayer2Score();
        var userInfo = sceneLeaderboards.getUserIDData( SceneLeaderboards.Leaderboard_AllTime, character.getUserID() );
        if( userInfo )
        {
            var winRatio = "";
            winRatio += userInfo.wins;
            winRatio += " / ";
            winRatio += userInfo.losses;
            tileScore.setText( winRatio, false );
            tileScore.setTextColourAlpha( 1.0, true );
        }
    }
};


SceneManagerGame.prototype.backgroundTilePressed = function()
{
    if( this.gameState === SceneManagerGame.GameState_SplashScreen )
    {
        this.gotoCharacterSelectScreenState();
    }
    else if( this.gameState === SceneManagerGame.GameState_Leaderboards )
    {
        this.gameState = SceneManagerGame.GameState_Leaderboards;
    }
};


SceneManagerGame.prototype.exitLeaderboardsState = function()
{
    if( this.gameState === SceneManagerGame.GameState_Leaderboards )
    {
        this.hideBack();
        this.sceneLeaderboards.hide();
        this.gotoCharacterSelectScreenState();
    }
};


SceneManagerGame.prototype.gotoSplashScreenGameState = function()
{
    CCEngine.DisableBackButton( this );

    this.setGameState( SceneManagerGame.GameState_SplashScreen );

    if( !this.waitingForOpponent )
    {
        this.tileNotifications.setText( "tap to start" );
    }

    this.showSplashScreen();
    this.showFlag();

    if( this.sceneMultiLauncher )
    {
        this.sceneMultiLauncher.show();
    }
};


SceneManagerGame.prototype.gotoCharacterSelectScreenState = function()
{
    if( this.gameState !== SceneManagerGame.GameState_CharacterSelectScreen )
    {
        CCEngine.EnableBackButton( this );

        this.sceneBackground.show();
        this.timers.length = 0;

        this.showFlag();
        this.tileNotifications.setText( "connecting" );
        this.setGameState( SceneManagerGame.GameState_CharacterSelectScreen );
        this.updatedGameState();

        if( MultiplayerManager.LoggedIn )
        {
            if( this.waitingForOpponent )
            {
                this.readyToPlay1vs1();
            }
        }

        this.hideSplashScreen();

        this.scenePlayScreen.show( this.playerType );

        if( this.sceneMultiLauncher )
        {
            this.sceneMultiLauncher.show();
        }
    }
};


SceneManagerGame.prototype.start1vs1 = function()
{
    // Cancel other mode
    if( this.gameState === SceneManagerGame.GameState_ReadyToPlayBattleRoyale )
    {
        this.toggleWaitingForOpponent( false );
        this.timers.length = 0;
        this.tileNotifications.setText( "connecting" );
        this.setGameState( SceneManagerGame.GameState_CharacterSelectScreen );
        this.updatedGameState();
    }

    if( this.gameState === SceneManagerGame.GameState_CharacterSelectScreen )
    {
        if( this.isUsablePlayer() )
        {
            this.tileNotifications.setText( "connecting" );
            if( MultiplayerManager.LoggedIn )
            {
                this.readyToPlay1vs1();
                return true;
            }
        }
    }
    else if( this.gameState === SceneManagerGame.GameState_ReadyToPlay1vs1 || this.gameState === SceneManagerGame.GameState_ReadyToPlayBattleRoyale )
    {
        this.toggleWaitingForOpponent( false );
        this.timers.length = 0;
        this.tileNotifications.setText( "connecting" );
        this.setGameState( SceneManagerGame.GameState_CharacterSelectScreen );
        this.updatedGameState();
    }

    return false;
};


SceneManagerGame.prototype.startBattleRoyale = function(mapID)
{
    // Cancel other mode
    if( this.gameState === SceneManagerGame.GameState_ReadyToPlay1vs1 )
    {
        this.toggleWaitingForOpponent( false );
        this.timers.length = 0;
        this.tileNotifications.setText( "connecting" );
        this.setGameState( SceneManagerGame.GameState_CharacterSelectScreen );
        this.updatedGameState();
    }

    if( this.gameState === SceneManagerGame.GameState_CharacterSelectScreen )
    {
        if( this.isUsablePlayer() )
        {
            this.tileNotifications.setText( "connecting" );
            if( MultiplayerManager.LoggedIn )
            {
                this.readyToPlayBattleRoyale( mapID );
                return true;
            }
        }
    }
    else if( this.gameState === SceneManagerGame.GameState_ReadyToPlay1vs1 || this.gameState === SceneManagerGame.GameState_ReadyToPlayBattleRoyale )
    {
        this.toggleWaitingForOpponent( false );
        this.timers.length = 0;
        this.tileNotifications.setText( "connecting" );
        this.setGameState( SceneManagerGame.GameState_CharacterSelectScreen );
        this.updatedGameState();
    }

    return false;
};


SceneManagerGame.prototype.setGameState = function(state)
{
    if( this.gameState !== state )
    {
        this.gameState = state;
        this.requestResize();
    }
};


SceneManagerGame.prototype.toggleWaitingForOpponent = function(toggle)
{
    if( this.waitingForOpponent !== toggle )
    {
        this.waitingForOpponent = toggle;

        if( !this.waitingForOpponent )
        {
            if( MultiplayerManager.LoggedIn )
            {
                BurgersClient.unregisterPlayer();
            }

            if( this.gameState === SceneManagerGame.GameState_ReadyToPlay1vs1 )
            {
                this.tileNotifications.setText( "connecting" );
                this.setGameState( SceneManagerGame.GameState_CharacterSelectScreen );
                this.updatedGameState();
            }
        }
    }

    if( this.waitingForOpponentStartedTimer )
    {
        this.waitingForOpponentStartedTimer = false;
    }
};


SceneManagerGame.prototype.syncDisconnected = function()
{
    if( this.gameState >= SceneManagerGame.GameState_CharacterSelectScreen && this.gameState <= SceneManagerGame.GameState_PlayingBattleRoyale )
    {
       this.tileNotifications.setText( "connecting" );
    }

    this.SceneManagerPlay_syncDisconnected();
};


SceneManagerGame.prototype.syncLoggedIn = function()
{
    this.SceneManagerPlay_syncLoggedIn();

    var guestName = "Guest ";
    guestName += MultiplayerManager.UserID;
    guestName = guestName.strip( "." );
    this.scenePlayScreen.setPlayerID( guestName );

    var leaderboard = this.sceneLeaderboards.leaderboardsData[this.sceneLeaderboards.currentLeaderboardType];
    if( leaderboard.length === 0 )
    {
        this.sceneLeaderboards.requestLeaderboard();
    }

    this.updatedGameState();
};


SceneManagerGame.prototype.updatedGameState = function()
{
    if( MultiplayerManager.LoggedIn )
    {
        var map = this.map;
        if( map )
        {
            // If we're not playing a practice match, quit and go back to the splash screen
            if( map.isOnlineGame() )
            {
                map.deleteLater();
                this.map = null;

                // Go back to start screen
                this.hideSplashScreen();
                this.gotoSplashScreenGameState();
            }

            // If we're playing a practice match and we're not queuing, remove the connecting text
            else
            {
                this.tileNotifications.setText( "" );
            }
        }
        else
        {
            if( this.gameState === SceneManagerGame.GameState_SplashScreen )
            {
            }
            else
            {
                if( this.gameState === SceneManagerGame.GameState_ReadyToPlay1vs1 ||
                    this.gameState === SceneManagerGame.GameState_ReadyToPlayBattleRoyale )
                {
                    this.setGameState( SceneManagerGame.GameState_CharacterSelectScreen );
                }

                if( this.gameState === SceneManagerGame.GameState_CharacterSelectScreen )
                {
                    this.tileNotifications.setText( "select game mode" );
                }
            }
        }
    }
};


SceneManagerGame.prototype.readyToPlay1vs1 = function()
{
    this.toggleWaitingForOpponent( true );
    if( !this.map )
    {
        this.setGameState( SceneManagerGame.GameState_ReadyToPlay1vs1 );
    }

    BurgersClient.registerPlayer( this.playerType, "1vs1" );
};


SceneManagerGame.prototype.readyToPlayBattleRoyale = function(mapID)
{
    if( !this.map )
    {
        this.setGameState( SceneManagerGame.GameState_ReadyToPlayBattleRoyale );
    }

    // Join a specific battle royale game
    if( mapID )
    {
        MultiplayerManager.RequestJoinMap( mapID, this.playerType );
    }

    // Register a player for matchmaking
    else
    {
        BurgersClient.registerPlayer( this.playerType, "BattleRoyale" );
    }
};


SceneManagerGame.prototype.displayGameTileMessages = function(broadcast)
{
    var messages = broadcast.messages;
    for( var i=0; i<messages.length; ++i )
    {
        var tile = this.tileTitleMessages[i];
        tile.setText( messages[i], true );
    }

    this.requestResize();

    // If we're waiting to play or we're playing a practice match
    if( this.waitingForOpponent )
    {
        if( broadcast.queuePosition !== undefined )
        {
            var broadcastQueuePosition = broadcast.queuePosition;
            var text = "queueing to play ";
            text += broadcastQueuePosition;
            this.tileNotifications.setText( text, true );
        }
        else
        {
            this.tileNotifications.setText( "waiting for opponent", true );
        }
    }
};


SceneManagerGame.prototype.syncUpdate = function(jsonData)
{
    var map = this.map;

    var i, length, jsonPlayer;

    if( jsonData.appInfo )
    {
        this.updateAppInfo( jsonData.appInfo );
    }
    else if( jsonData.gameTitleMessages )
    {
        this.displayGameTileMessages( jsonData.gameTitleMessages );
    }
    else if( jsonData.status )
    {
        this.tilePlayerStatus.setText( jsonData.status, true );
        this.requestResize();
    }
    else if( jsonData.loadGame )
    {
        var mapType = jsonData.type;

        var newChallenger = ( this.gameState === SceneManagerGame.GameState_Playing1vs1 );
        if( map )
        {
            this.matchEnd( false );
        }

        var mapID = jsonData.loadGame;
        this.loadGame( mapID, mapType, jsonData );

        if( newChallenger )
        {
            this.tileNotifications.setText( "here comes a new challenger" );
        }

        var jsonPlayers = jsonData.players;
        if( jsonPlayers )
        {
            if( Array.isArray( jsonPlayers ) )
            {
                var playerIDs = new Array( 2 );
                var playerTypes = new Array( 2 );

                length = jsonPlayers.length;
                for( i=0; i<length; ++i )
                {
                    jsonPlayer = jsonPlayers[i];
                    if( jsonPlayer )
                    {
                        playerIDs[i] = jsonPlayer.userID;
                        playerTypes[i] = jsonPlayer.playerType;

                        this.sceneLeaderboards.updateLeaderboardData( SceneLeaderboards.Leaderboard_AllTime, jsonPlayer );
                    }
                }

                // If we have both player types, show our splash screen with them
                if( playerTypes[0] && playerTypes[1] )
                {
                    this.sceneSplashScreen.hide();
                    this.sceneSplashScreen.show( playerTypes[0], this.sceneLeaderboards.getPlayerCountryCode( playerIDs[0] ),
                                                 playerTypes[1], this.sceneLeaderboards.getPlayerCountryCode( playerIDs[1] ) );
                }
            }
        }
    }
    else if( jsonData.GameWon !== undefined )
    {
        var result = jsonData.GameWon;
        if( result === "abandoned" )
        {
            if( map )
            {
                map.setOffline();
                this.spawnOfflineGame();
            }
            else
            {
                this.gotoSplashScreenGameState();
                this.gotoCharacterSelectScreenState();
            }
            this.readyToPlay1vs1();
        }
        else if( result === "draw" )
        {
            this.matchResult( false );
        }
        else if( result )
        {
            if( jsonData.disconnected )
            {
                var playerDisconnectedID = jsonData.disconnected;

                if( map )
                {
                    var player = map.getPlayerFromID( MultiplayerManager.SessionID );
                    var disconnectedPlayer = map.getPlayerFromID( playerDisconnectedID );
                    if( player && disconnectedPlayer && player !== disconnectedPlayer )
                    {
                        var aiController = new CharacterControllerAI( map.getPathFinderNetwork() );
                        disconnectedPlayer.setupAI( aiController );

                        if( !map.gameStarted() )
                        {
                            aiController.enable( false );
                        }

                        aiController.setWaypointCycle( CharacterControllerAI.cycle_randomConnections );
                        aiController.setMovementMagnitude( 0.75 );
                        aiController.setEnemy( player );

                        map.setMapID( "" );
                        this.readyToPlay1vs1();
                    }
                    else
                    {
                        this.matchResult( true );
                    }
                }
            }
            else
            {
                this.matchResult( true );
            }
        }
        else
        {
            this.matchResult( false );
        }
    }
    else if( jsonData.leaderboards )
    {
        var leaderboardType = this.sceneLeaderboards.parseLeaderboardType( jsonData );

        var leaderboardsData = jsonData.leaderboards;
        if( Array.isArray( leaderboardsData ) )
        {
            length = leaderboardsData.length;
            for( i=0; i<length; ++i )
            {
                jsonPlayer = leaderboardsData[i];
                if( jsonPlayer )
                {
                    this.sceneLeaderboards.updateLeaderboardData( leaderboardType, jsonPlayer );
                }
            }

            if( this.gameState === SceneManagerGame.GameState_Leaderboards )
            {
                this.sceneLeaderboards.show();
            }
        }
    }
    else if( jsonData.userInfo )
    {
        jsonPlayer = jsonData.userInfo;
        if( jsonPlayer )
        {
            this.sceneLeaderboards.updateLeaderboardData( SceneLeaderboards.Leaderboard_AllTime, jsonPlayer );
        }
    }

    this.SceneManagerPlay_syncUpdate( jsonData );
};


SceneManagerGame.prototype.loadGame = function(mapID, mapType, jsonData)
{
    var self = this;


    if( this.sceneMultiLauncher )
    {
        this.sceneMultiLauncher.hide();
    }

    if( mapID )
    {
        if( this.waitingForOpponent )
        {
            this.toggleWaitingForOpponent( false );
        }
    }

    if( !this.waitingForOpponent )
    {
        this.tileNotifications.setText( "loading" );
    }

    var timers = this.timers;
    timers.length = 0;

    this.showSplashScreen();
    this.setGameState( SceneManagerGame.GameState_Playing1vs1 );
    this.hideFlag();

    var timer = new CCTimer();
    timer.onTime.add( function()
    {
        self.hideSplashScreen();
        self.sceneBackground.hide();
        if( mapType === "1vs1" )
        {
            self.loadedGame( new SceneGame1vs1( mapID ) );
        }
        else if( mapType === "BattleRoyale" )
        {
            self.loadedGame( new SceneGameBattleRoyale( mapID ) );
        }

        if( jsonData )
        {
            self.map.syncUpdate( jsonData );
        }
    });
    timer.start( 2.0 );
    timers.add( timer );
};


SceneManagerGame.prototype.loadedGame = function(map)
{
    var self = this;
    map.onBack = function()
    {
        self.toggleWaitingForOpponent( false );
        self.matchEnd( false );
    };

    this.map = map;
    map.setParent( this );

    // Offline game
    if( !map.isOnlineGame() )
    {
        this.spawnOfflineGame();
    }
};


SceneManagerGame.prototype.spawnOfflineGame = function()
{
    var map = this.map;

    var i;

    // Spawn walls
    {
        var sandbagLocations = [];
        sandbagLocations.add( [0.0, 0.0, 0.0] );
        sandbagLocations.add( [-50.0, 0.0, -100.0] );
        sandbagLocations.add( [50.0, 0.0, -100.0] );
        sandbagLocations.add( [-50.0, 0.0, 100.0] );
        sandbagLocations.add( [50.0, 0.0, 100.0] );

        var objFile = "barbedwire.obj";
        var texFile = "barbedwire_diffuse.png";
        var sandbagWidth = 30.0;
        for( i=0; i<sandbagLocations.length; ++i )
        {
            map.spawnStaticObject( "sandbag"+i, objFile, texFile, null, sandbagWidth, 90.0, sandbagLocations[i] );
        }
    }

    this.spawnOfflinePlayers();

    var player1 = map.getPlayerFromID( MultiplayerManager.SessionID );
    var player2 = map.getPlayerFromID( "player2" );

    map.syncPlayerSetLocation( player1.getPlayerID(), vec3.clone( [-50.0, player1.position[1], 0.0] ) );
    map.syncPlayerSetLocation( player2.getPlayerID(), vec3.clone( [50.0, player2.position[1], 0.0] ) );

    for( i=0; i<4; ++i )
    {
        var pickup = map.spawnPickup( "healthpack", "health", null );
        var mapBounds = map.getMapBounds();
        var location = vec3.create();
        location[0] = mapBounds.width * 0.9 * CC.FloatRandomDualSided();
        location[2] = mapBounds.height * 0.9 * CC.FloatRandomDualSided();
        pickup.setPositionXZ( location[0], location[2] );
        map.adjustCollisionPlacement( pickup );
    }

    {
        var aiController = new CharacterControllerAI( map.getPathFinderNetwork() );
        player2.setupAI( aiController );
        aiController.enable( false );

        //aiController.scanWaypoints( CC.SQUARE( 75.0 ) );
        aiController.setWaypointCycle( CharacterControllerAI.cycle_randomConnections );
        aiController.setMovementMagnitude( 0.5 );
        aiController.setEnemy( player1 );
    }

    map.syncPlayerHealth( player1.getPlayerID(), 100.0, true );
    map.syncPlayerHealth( player2.getPlayerID(), 100.0, true );

    if( map.getNumberOfPlayers() >= 2 )
    {
        if( !this.waitingForOpponent )
        {
            this.tileNotifications.setText( "" );
        }
        map.startIntro();
    }
};


SceneManagerGame.prototype.spawnOfflinePlayers = function()
{
    var map = this.map;

    // Spawn player1
    var player1 = map.spawnCharacter( this.playerType, MultiplayerManager.SessionID, MultiplayerManager.UserID );
    map.assignPlayerCharacter( player1 );

    // Spawn player2
    var player2;
    if( this.playerType.contains( this.playerTypes[0].type ) )
    {
        player2 = map.spawnCharacter( this.playerTypes[1].type, "player2" );
    }
    else
    {
        player2 = map.spawnCharacter( this.playerTypes[0].type, "player2" );
    }
    map.addEnemy( player2 );
};


SceneManagerGame.prototype.matchResult = function(won)
{
    if( this.map )
    {
        if( won )
        {
            this.map.startWinning();
        }
        else
        {
            this.map.startLosing();
        }
    }
    else
    {
        this.matchEnd( true );
    }
};


SceneManagerGame.prototype.matchEnd = function(showLeaderboards)
{
    this.hideSplashScreen();

    if( this.map )
    {
        // Scores probably have changed
        if( this.map.isOnlineGame() )
        {
            this.sceneLeaderboards.dirtyLeaderboards();
        }

        this.map.deleteLater();
        this.map = null;
    }

    // Go to leaderboards
    if( showLeaderboards )
    {
        this.showLeaderboards();

        // Skip leaderboards if waiting for an opponent (practice match)
        if( this.waitingForOpponent )
        {
            this.exitLeaderboardsState();
        }
    }
    else
    {
        this.gotoCharacterSelectScreenState();
    }
};


SceneManagerGame.prototype.startOfflineGame = function()
{
    if( !this.map )
    {
        this.loadGame( null, "1vs1", 500.0 );
        return true;
    }
    return false;
};


SceneManagerGame.prototype.isUsablePlayer = function(launchShop)
{
    if( launchShop === undefined )
    {
        launchShop = true;
    }

    var playerTypeInfo = this.getPlayerTypeInfo( this.playerType );
    if( playerTypeInfo )
    {
        var playerItemCode;
        if( playerTypeInfo.type === "doubleburger" || playerTypeInfo.type === "doublefries" )
        {
            playerItemCode = "burgers_doubleweapons";
        }
        else if( playerTypeInfo.type === "miniche" || playerTypeInfo.type === "soldier" )
        {
            playerItemCode = "tanks_switchTeams";
        }
        if( playerItemCode )
        {
            if( !SceneItemShop.HasPurchasedNonConsumable( playerItemCode ) )
            {
                if( launchShop )
                {
                    var self = this;
                    new SceneItemShop( "Get coins to unlock\nall game characters", playerItemCode, true, "unlock", "unlock", "unlock", function (type, itemCode, value)
                    {
                        CC.SaveData( "shop." + playerItemCode + ".item" );
                        self.scenePlayScreen.showPlayerView( self.playerType );
                    });
                }
                return false;
            }
        }
    }
    return true;
};


SceneManagerGame.prototype.switchTeams = function(direction)
{
    var playerTypeIndex = 0;
    var playerTypes = this.playerTypes;
    for( var i=0; i<playerTypes.length; ++i )
    {
        if( this.playerType === playerTypes[i].type )
        {
            playerTypeIndex = i;
            break;
        }
    }

    if( direction > 0 )
    {
        playerTypeIndex++;
        if( playerTypeIndex >= playerTypes.length )
        {
            playerTypeIndex = 0;
        }
    }
    else if( direction < 0 )
    {
        playerTypeIndex--;
        if( playerTypeIndex < 0 )
        {
            playerTypeIndex = playerTypes.length-1;
        }
    }

    this.playerType = playerTypes[playerTypeIndex].type;

    if( !this.map )
    {
        // Go back to character select screen
        this.setGameState( SceneManagerGame.GameState_CharacterSelectScreen );
        if( MultiplayerManager.LoggedIn )
        {
            if( this.waitingForOpponent )
            {
                this.toggleWaitingForOpponent( false );
            }
        }
        this.updatedGameState();
        this.scenePlayScreen.showPlayerView( this.playerType );
    }
};


SceneManagerGame.prototype.showLeaderboards = function()
{
    if( MultiplayerManager.LoggedIn )
    {
        if( this.sceneMultiLauncher )
        {
            this.sceneMultiLauncher.hide();
        }

        this.showBack();

        this.setGameState( SceneManagerGame.GameState_Leaderboards );
        this.hideFlag();
        this.scenePlayScreen.hide();
        this.sceneBackground.show();
        this.sceneLeaderboards.show();

        if( !this.waitingForOpponent )
        {
            this.tileNotifications.setText( "" );
        }

        return true;
    }
    return false;
};


SceneManagerGame.prototype.showBack = function()
{
    this.tileBack.setColourAlpha( 1.0, true );
    this.tileBack.setCollideable( true );
};


SceneManagerGame.prototype.hideBack = function()
{
    this.tileBack.setColourAlpha( 0.0, true );
    this.tileBack.setCollideable( false );
};


SceneManagerGame.prototype.createFlag = function()
{
    if( MultiplayerManager.geoLocationCountryCode )
    {
        var file = "flag_";
        file += MultiplayerManager.geoLocationCountryCode;
        file += ".png";

        if( !this.tileFlag )
        {
            var self = this;
            var camera = this.camera;

            var tile = new CCTile3DButton( this );
            tile.setupTextured( file, function()
            {
                self.requestResize();
                self.showFlag();
            });
            tile.tileScaleInterpolator.setDuration( 0.25 );
            this.tileFlag = tile;
            return;
        }
    }

    this.hideFlag();
};


SceneManagerGame.prototype.showFlag = function()
{
    if( this.gameState !== SceneManagerGame.GameState_Playing1vs1 && this.gameState !== SceneManagerGame.GameState_PlayingBattleRoyale )
    {
        if( this.tileFlag )
        {
            this.tileFlag.setTileScale( 0.0, false );
            this.tileFlag.setTileScale( 1.0, true );
            this.tileFlag.setColourAlpha( 1.0, true );
        }
    }
};


SceneManagerGame.prototype.hideFlag = function()
{
    if( this.tileFlag )
    {
        this.tileFlag.setTileScale( 0.0, true );
        this.tileFlag.setColourAlpha( 0.0, true );
    }
};


SceneManagerGame.prototype.syncLoggedIntoSocialNetwork = function(network)
{
    if( network === "facebook" )
    {
        this.scenePlayScreen.loggedIntoFacebook();
    }
    else if( network === "twitter" )
    {
        this.scenePlayScreen.loggedIntoTwitter();
    }
    else if( network === "google" )
    {
        this.scenePlayScreen.loggedIntoGoogle();
    }
};


SceneManagerGame.prototype.getConstUserIDData = function(userID)
{
    if( this.sceneLeaderboards )
    {
        return this.sceneLeaderboards.getConstUserIDData( SceneLeaderboards.Leaderboard_AllTime, userID );
    }
};


SceneManagerGame.prototype.getStatusPositionY = function()
{
    return this.tilePlayerStatus.aabbMin[1];
};
