/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : ScenePlayScreen.js
 * Description : Menu options to play our game
 *
 * Created     : 06/10/12
 *-----------------------------------------------------------
 */

function ScenePlayScreen()
{
    this.construct();
}
ExtendPrototype( ScenePlayScreen, CCSceneAppUI );


ScenePlayScreen.prototype.construct = function()
{
    this.CCSceneAppUI_construct();

    this.cameraCentered = true;

    {
        var camera = gEngine.newSceneCamera( this );
        camera.setupViewport( 0.0, 0.0, 1.0, 1.0 );
    }

    this.scenePlayerView = null;
    this.sceneProfileLogin = null;

    this.uiTiles = [];
    this.sideMenuTiles = [];
    this.mapMenuTiles = [];
};


ScenePlayScreen.prototype.destruct = function()
{
    this.deletePlayerView();
    this.closeProfileLogin();

    if( this.sceneMultiLauncher )
    {
        this.sceneMultiLauncher.hide();
    }

    this.CCSceneAppUI_destruct();
};


ScenePlayScreen.prototype.setup = function()
{
    var self = this;

    var camera = this.camera;
    camera.setCameraWidth( 640.0 );
    camera.useSceneCollideables( this );

    this.BORDERWIDTH_RATIO = 0.2;
    var borderWidth = camera.targetWidth * this.BORDERWIDTH_RATIO;
    var uiTiles = this.uiTiles;
    var sideMenuTiles = this.sideMenuTiles;

    var tile;
    {
        tile = new CCTile3DButton( this );
        tile.setColourAlpha( 0.0 );
        this.tileSideBackground = tile;
        tile.setupTexturedWidth( borderWidth, "ui_sidebackground.png", function()
        {
            self.imageLoaded();
        });
        tile.setDrawOrder( 199 );
        tile.setCollideable( false );

        this.addTile( tile );
        tile.setTouchDepressDepth( 0.0 );
    }

    // Create the user tile
    {
        tile = new TileSocialProfile( this );
        tile.setTileSize( borderWidth * 0.75 );
        tile.setPositionX( camera.targetWidth + tile.collisionBounds[0] );

        tile.setText( " ", false, tile.collisionSize.height * 0.2 );
        tile.setTextPosition( 0.0, tile.collisionBounds[1] * -0.45 );
        tile.setTextColour( gColour.set( 0.5, 0.0 ) );

        this.tileProfile = tile;
        tile.bufferInfo( 2, function (tile, success)
        {
            if( success )
            {
                self.setPlayerID( tile.getName() );
            }
        });

        tile.onRelease.push( function()
        {
            self.showProfileLogin();
        });
        this.addTile( tile, 0 );

        sideMenuTiles.add( tile );
        uiTiles.add( tile );
    }

    {
        tile = new CCTile3DButton( this );
        tile.setupTexturedWidth( borderWidth, "ui_practice.png", function()
        {
            self.imageLoaded();
        });

        tile.onRelease.push( function()
        {
            self.startOfflineGame();
        });
        this.addTile( tile, 0 );

        this.tilePractice = tile;
        sideMenuTiles.add( tile );
        uiTiles.add( tile );
    }

    {
        tile = new CCTile3DButton( this );
        tile.setupTexturedWidth( borderWidth, "ui_leaderboards.png", function()
        {
            self.imageLoaded();
        });

        tile.onRelease.push( function()
        {
            self.showLeaderboards();
        });
        this.addTile( tile, 0 );

        this.tileLeaderboards = tile;
        sideMenuTiles.add( tile );
        uiTiles.add( tile );
    }

    {
        tile = new CCTile3DButton( this );
        tile.setupTexturedWidth( borderWidth, "ui_help.png", function()
        {
            self.imageLoaded();
        });

        tile.onRelease.push( function()
        {
            self.showHelp();
        });
        this.addTile( tile, 0 );

        this.tileHelp = tile;
        sideMenuTiles.add( tile );
        uiTiles.add( tile );
    }

    this.tilePushNotifications = null;
    // {
    //     tile = new CCTile3DButton( this );
    //     tile.setupTile( borderWidth, 1.0 );

    //     LAMBDA_CONNECT_THIS( tile.onRelease, ScenePlayScreen, togglePushNotifications(); );
    //     this.addTile( tile, 0 );
    //     tilePushNotifications = tile;
    //     sideMenuTiles.add( tile );
    //     uiTiles.add( tile );

    //     disablePushNotifications();
    // }

    // Switch teams
    {
        {
            tile = new CCTile3DButton( this );
            tile.setupTexturedWidth( borderWidth * 0.5, "ui_arrow.png", function()
            {
                self.imageLoaded();
            });

            tile.onRelease.push( function()
            {
                self.switchTeams( -1 );
            });
            this.addTile( tile, 0 );

            this.tileSwitchTeamsLeft = tile;
            uiTiles.add( tile );
        }

        var OnImageDownloaded = function(tile)
        {
            return function()
            {
                tile.flipTileY();
                self.imageLoaded();
            };
        };

        {
            tile = new CCTile3DButton( this );
            tile.setupTexturedWidth( borderWidth * 0.5, "ui_arrow.png", new OnImageDownloaded( tile ) );

            tile.onRelease.push( function()
            {
                self.switchTeams( 1 );
            });
            this.addTile( tile, 0 );

            this.tileSwitchTeamsRight = tile;
            uiTiles.add( tile );
        }
    }

    // Play modes
    {
        var mapMenuTiles = this.mapMenuTiles;
        {
            tile = new CCTile3DButton( this );
            tile.setupTexturedWidth( borderWidth * 1.25, "ui_button_1vs1.png", function()
            {
                self.imageLoaded();
            });

            tile.onRelease.push( function()
            {
                self.start1vs1Game();
            });
            this.addTile( tile, 0 );

            uiTiles.add( tile );
            mapMenuTiles.add( tile );
        }

        {
            tile = new CCTile3DButton( this );
            tile.setupTexturedWidth( borderWidth * 1.25, "ui_button_battleroyale.png", function()
            {
                self.imageLoaded();
            });

            tile.onRelease.push( function()
            {
                self.startBattleRoyaleGame();
            });
            this.addTile( tile, 0 );

            uiTiles.add( tile );
            mapMenuTiles.add( tile );
        }
    }

    // Standard Menu Tile settings
    for( var i=0; i<uiTiles.length; ++i )
    {
        tile = uiTiles[i];
        tile.setDrawOrder( 205 );
        tile.setColourAlpha( 0.0 );
        tile.setCollideable( false );
    }

    this.lockCameraView();
    this.refreshCameraView();
};


ScenePlayScreen.prototype.imageLoaded = function()
{
    if( this.showing )
    {
        this.showMainView();
    }
    else
    {
        this.hideMainView();
    }
};


ScenePlayScreen.prototype.resize = function()
{
    this.CCSceneAppUI_resize();
    if( this.showing )
    {
        this.showMainView();
    }
};


ScenePlayScreen.prototype.render = function(camera, pass, alpha)
{
    //this.CCSceneAppUI_render( camera, pass, alpha );
};


ScenePlayScreen.prototype.deletingChild = function(inScene)
{
    if( inScene === this.sceneProfileLogin )
    {
        this.sceneProfileLogin = null;

        this.showMainView();
        if( this.scenePlayerView )
        {
            this.scenePlayerView.enabled = true;
            this.scenePlayerView.camera.enabled = true;
        }
        if( sceneManagerGame )
        {
            sceneManagerGame.camera.enabled = true;
        }
    }

    this.CCSceneAppUI_deletingChild( inScene );
};


ScenePlayScreen.prototype.touchPressed = function(touch)
{
    return this.CCSceneAppUI_touchPressed( touch );
};


ScenePlayScreen.prototype.touchMoving = function(touch, touchDelta)
{
    return false;
};


ScenePlayScreen.prototype.touchReleased = function(touch, touchAction)
{
    return this.CCSceneAppUI_touchReleased( touch, touchAction );
};


ScenePlayScreen.prototype.show = function(playerType)
{
    this.showMainView();
    this.showPlayerView( playerType );
};


ScenePlayScreen.prototype.showMainView = function()
{
    this.showing = true;
    this.controlsEnabled = true;

    var camera = this.camera;
    this.enabled = true;
    camera.enabled = true;

    var uiTiles = this.uiTiles;
    var sideMenuTiles = this.sideMenuTiles;

    var tile;
    var i;
    {
        tile = this.tileSideBackground;
        tile.setColourAlpha( 1.0, true );
        tile.setCollideable( true );
        tile.setPositionYZ( 0.0,
                            0.0 );
        tile.setTileMovementX( camera.targetWidth * 0.5 + tile.collisionBounds[0] -tile.collisionSize.width );
    }

    {
        var yOffset = 0.0;
        {
            var menuHeight = 0.0;
            for( i=0; i<sideMenuTiles.length; ++i )
            {
                tile = sideMenuTiles[i];
                menuHeight += tile.collisionSize.height;
            }
            yOffset = -menuHeight * 0.6;
        }

        // Not really a quarter
        var quarterHeight = camera.targetHeight * 0.075125;
        if( yOffset > quarterHeight )
        {
            yOffset = quarterHeight;
        }

        if( this.tileSideBackground.getTileTextureImage() )
        {
            tile = this.tileProfile;
            tile.setPositionY( -tile.collisionBounds[1] - yOffset );
            tile.setTileMovementX( this.tileSideBackground.getTileMovementTarget()[0] );
            tile.setTextColourAlpha( 0.85, true );
        }
    }

    {
        tile = this.tilePractice;
        tile.positionTileBelowY( this.tileProfile );
    }

    {
        tile = this.tileLeaderboards;
        tile.positionTileBelowY( this.tilePractice );
    }

    {
        tile = this.tileHelp;
        tile.positionTileBelowY( this.tileLeaderboards );
    }

    if( this.tilePushNotifications )
    {
        tile = this.tilePushNotifications;
        tile.positionTileBelow( this.tileHelp );
        tile.translateTileMovementX( -tile.collisionSize.width );
    }

    {
        var borderWidth = camera.targetWidth * this.BORDERWIDTH_RATIO;
        {
            tile = this.tileSwitchTeamsLeft;
            tile.setPositionX( -camera.targetWidth * 0.5 + tile.collisionBounds[0] );
            tile.setPositionY( 0.0 );
        }

        {
            tile = this.tileSwitchTeamsRight;
            tile.setPositionX( camera.targetWidth * 0.5 - tile.collisionBounds[0] - borderWidth );
            tile.setPositionY( 0.0 );
        }
    }

    {
        var borderOffset = camera.targetWidth * this.BORDERWIDTH_RATIO * 0.5;
        var y = camera.targetHeight * 0.5 * 0.666;

        var mapMenuTiles = this.mapMenuTiles;
        var totalWidth = mapMenuTiles[0].collisionSize.width * mapMenuTiles.length;
        var x = -borderOffset - totalWidth * 0.5;
        for( i=0; i<mapMenuTiles.length; ++i )
        {
            tile = mapMenuTiles[i];
            x += tile.collisionBounds[0];
            tile.setPositionX( x );
            x += tile.collisionBounds[0];
            tile.setPositionY( -y );
        }
    }

    for( i=0; i<sideMenuTiles.length; ++i )
    {
        tile = sideMenuTiles[i];
        if( tile !== this.tileProfile )
        {
            tile.setTileMovementX( camera.targetWidth * 0.5 + tile.collisionBounds[0] -tile.collisionSize.width );
        }
    }

    for( i=0; i<uiTiles.length; ++i )
    {
        tile = uiTiles[i];
        tile.setColourAlpha( 1.0, true );
        tile.setCollideable( true );
    }
};


ScenePlayScreen.prototype.hide = function()
{
    this.deletePlayerView();
    this.hideMainView();
};


ScenePlayScreen.prototype.hideMainView = function()
{
    var self = this;

    this.showing = false;
    this.controlsEnabled = false;

    var camera = this.camera;
    var uiTiles = this.uiTiles;
    var sideMenuTiles = this.sideMenuTiles;

    var tile;
    if( this.tileSideBackground )
    {
        tile = this.tileSideBackground;
        tile.setColourAlpha( 0.0, true, function()
        {
            self.enabled = false;
            camera.enabled = false;
        });
        tile.setCollideable( false );
        tile.setTileMovementX( camera.targetWidth * 0.5 + tile.collisionBounds[0] );
    }

    if( this.tileProfile )
    {
        tile = this.tileProfile;
        tile.setTileMovementX( camera.targetWidth * 0.5 + tile.collisionBounds[0] );
        tile.setTextColourAlpha( 0.0, true );
    }

    var i;

    for( i=0; i<sideMenuTiles.length; ++i )
    {
        tile = sideMenuTiles[i];
        if( tile !== this.tileProfile )
        {
            tile.translateTileMovementX( tile.collisionSize.width );
        }
    }

    for( i=0; i<uiTiles.length; ++i )
    {
        tile = uiTiles[i];
        tile.setColourAlpha( 0.0, true );
        tile.setCollideable( false );
    }

    this.closeProfileLogin();
};


ScenePlayScreen.prototype.showPlayerView = function(playerType)
{
    this.deletePlayerView();

    var borderWidth = this.BORDERWIDTH_RATIO;
    var sceneWidth = 1.0 - borderWidth;
    this.scenePlayerView = new ScenePlayerView( this, sceneWidth, playerType );
    gEngine.addScene( this.scenePlayerView );
};


ScenePlayScreen.prototype.deletePlayerView = function()
{
    if( this.scenePlayerView )
    {
        this.scenePlayerView.deleteLater();
        this.scenePlayerView = null;
    }
};


ScenePlayScreen.prototype.showProfileLogin = function()
{
    if( this.controlsEnabled )
    {
        if( !this.sceneProfileLogin )
        {
            this.hideMainView();
            if( this.scenePlayerView )
            {
                this.scenePlayerView.enabled = false;
                this.scenePlayerView.camera.enabled = false;
            }
            if( sceneManagerGame )
            {
                sceneManagerGame.camera.enabled = false;
            }

            this.controlsEnabled = false;
            this.sceneProfileLogin = new SceneProfileLogin( this );
        }
        sceneManagerGame.toggleWaitingForOpponent( false );
    }
};


ScenePlayScreen.prototype.closeProfileLogin = function()
{
    if( this.sceneProfileLogin )
    {
        this.sceneProfileLogin.close();
    }
};


ScenePlayScreen.prototype.loggedIntoFacebook = function()
{
    var self = this;
    this.tileProfile.setFacebookID( "me" );
    this.tileProfile.bufferFBInfo( 2, false, function (tile, success)
    {
        if( success )
        {
            self.setPlayerID( tile.getName() );
        }
    });
};


ScenePlayScreen.prototype.loggedIntoTwitter = function()
{
    var self = this;
    this.tileProfile.bufferTwitterInfo( 2, function (tile, success)
    {
        if( success )
        {
            self.setPlayerID( tile.getName() );
        }
    });
};


ScenePlayScreen.prototype.loggedIntoGoogle = function()
{
    var self = this;
    this.tileProfile.bufferGoogleInfo( 2, function (tile, success)
    {
        if( success )
        {
            self.setPlayerID( tile.getName() );
        }
    });
};


ScenePlayScreen.prototype.setPlayerID = function(playerID)
{
    var newPlayerID = playerID;
    newPlayerID = newPlayerID.replace( " ", "\n" );
    var currentPlayerID = this.tileProfile.textObject.getText();
    if( currentPlayerID !== newPlayerID )
    {
        if( this.tileProfile.isCollideable() )
        {
            this.tileProfile.setTextColourAlpha( 0.0 );
            this.tileProfile.setTextColourAlpha( 0.85, true );
        }
        this.tileProfile.setText( newPlayerID );
    }
};


ScenePlayScreen.prototype.enablePushNotifications = function()
{
    // if( tilePushNotifications )
    // {
    //     CCTile3DButton *tile = tilePushNotifications;
    //     tile->setupTexturedWidth( tile->collisionSize.width, "ui_pushnotifications_on.png", Resource_Packaged, true );
    // }
};


ScenePlayScreen.prototype.disablePushNotifications = function()
{
    // if( tilePushNotifications )
    // {
    //     CCTile3DButton *tile = tilePushNotifications;
    //     tile->setupTexturedWidth( tile->collisionSize.width, "ui_pushnotifications_off.png", Resource_Packaged, true );
    // }
};


ScenePlayScreen.prototype.startOfflineGame = function()
{
    if( sceneManagerGame )
    {
        if( sceneManagerGame.startOfflineGame() )
        {
            this.controlsEnabled = false;
        }
    }
};


ScenePlayScreen.prototype.start1vs1Game = function()
{
    if( MultiplayerManager.LoggedIn )
    {
        if( sceneManagerGame )
        {
            sceneManagerGame.start1vs1();
        }
    }
};


ScenePlayScreen.prototype.startBattleRoyaleGame = function()
{
    if( MultiplayerManager.LoggedIn )
    {
        if( sceneManagerGame )
        {
            if( sceneManagerGame.startBattleRoyale() )
            {
                this.controlsEnabled = false;
            }
        }
    }
};


ScenePlayScreen.prototype.switchTeams = function(direction)
{
    sceneManagerGame.switchTeams( direction );
};


ScenePlayScreen.prototype.showLeaderboards = function()
{
    if( this.controlsEnabled )
    {
        if( sceneManagerGame.showLeaderboards() )
        {
            this.controlsEnabled = false;
        }
    }
};


ScenePlayScreen.prototype.showHelp = function()
{
    if( this.controlsEnabled )
    {
        new SceneUIImage( this );
    }
};
