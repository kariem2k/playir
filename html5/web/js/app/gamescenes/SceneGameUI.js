/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : SceneGameUI.js
 * Description : UI for our in game scene
 *
 * Created     : 10/10/12
 *-----------------------------------------------------------
 */


function PlayerTile()
{
    this.userID = undefined;
    this.tileFlag = null;
    this.tileProfile = null;
    this.tileHealthIcon = null;
    this.tileHealthBar = null;

    this.tileFireIcon = null;
    this.tileFireCharge = [];
}


function SceneGameUI(sceneMap)
{
    this.construct();

    this.cameraCentered = true;

    {
        this.sceneMap = sceneMap;

        // If our parent scene is removed, remove this scene as well
        sceneMap.linkScene( this );

        // If this scene is removed, remove our parent scene as well
        this.linkScene( sceneMap );
    }

    {
        var parentCameraIndex = gEngine.findCameraIndex( sceneMap.camera );

        var camera = gEngine.newSceneCamera( this, parentCameraIndex+1 );
        camera.setupViewport( 0.0, 0.0, 1.0, 1.0 );
    }

    this.playerTiles = new Array( 2 );
    for( var i=0; i<this.playerTiles.length; ++i )
    {
        this.playerTiles[i] = new PlayerTile();
    }

    gEngine.addScene( this );
}
ExtendPrototype( SceneGameUI, CCSceneAppUI );


SceneGameUI.prototype.setup = function()
{
    var self = this;
    var camera = this.camera;
    camera.setCameraWidth( 640.0, false );
    camera.useSceneCollideables( this );

    var tile;
    var playerTiles = this.playerTiles;

    var LoadPlayerTileImages = function(playerTile)
    {
        return function()
        {
            var height = playerTile.tileHealthIcon.collisionSize.height;
            playerTile.tileHealthBar.setupTexturedHeight( height, null, function()
            {
                self.requestResize();
            });

            for( i=0; i<playerTile.tileFireCharge.length; ++i )
            {
                playerTile.tileFireCharge[i].setupTexturedHeight( height, "resources/common/uigame/ui_fire_charge.png", function()
                {
                    self.requestResize();
                });
            }
        };
    };

    for( var playerIndex=0; playerIndex<playerTiles.length; ++playerIndex )
    {
        var playerTile = playerTiles[playerIndex];
        // Health
        {
            {
                tile = new CCTile3DButton( this );
                tile.getTileScaleInterpolator().setDuration( 0.25 );
                tile.shouldRender = false;
                tile.setDrawOrder( 202 );
                playerTile.tileHealthIcon = tile;

                if( playerIndex === 1 )
                {
                    tile.flipTileY();
                }
            }
            {
                tile = new TileOverlay( this );
                if( playerIndex === 1 )
                {
                    tile.flipTileY();
                }
                tile.shouldRender = false;
                playerTile.tileHealthBar = tile;
            }
            {
                //tile = new TileOverlay( this );
                //playerTile.tileHealthBar = tile;
            }
        }

        // Fire
        {
            {
                tile = new CCTile3DButton( this );
                tile.setupTexturedWidth( camera.cameraWidth * 0.05, "resources/common/uigame/ui_fire_icon.png", function()
                {
                    self.requestResize();
                });
                tile.getTileScaleInterpolator().setDuration( 0.25 );
                tile.shouldRender = false;
                tile.setDrawOrder( 203 );
                playerTile.tileFireIcon = tile;

                if( playerIndex === 1 )
                {
                    tile.flipTileY();
                }
            }
            for( var i=0; i<5; ++i )
            {
                tile = new CCTile3DButton( this );
                tile.getTileScaleInterpolator().setDuration( 0.25 );
                tile.shouldRender = false;
                playerTile.tileFireCharge.add( tile );
            }
        }

        // Flag
        {
            tile = new CCTile3DButton( this );
            tile.shouldRender = false;
            playerTile.tileFlag = tile;
        }

        // Profiles
        {
            tile = new TileSocialProfile( this, true );
            tile.setTileSize( camera.cameraWidth * 0.1 );
            tile.shouldRender = false;
            playerTile.tileProfile = tile;
        }

        playerTile.tileHealthIcon.setupTexturedWidth( camera.cameraWidth * 0.05, "resources/common/uigame/ui_health_icon.png", new LoadPlayerTileImages( playerTile ) );
    }

    {
        tile = new CCTile3DButton( this );
        tile.setupTexturedWidth( camera.cameraWidth * 0.085, "resources/common/uimenu/ui_back.png", function()
        {
            self.requestResize();
        });
        tile.setDrawOrder( 204 );
        this.tileBack = tile;

        tile.onRelease.push( function()
        {
            self.backPressed();
        });
        this.addTile( tile, 0 );
    }

    {
        tile = new CCTile3DButton( this );
        this.tileNotification = tile;
    }

    {
        var idealAspectRatio = 1.5;//1080.0f/720.0;
        var aspectRatioAdjutment = camera.getAspectRatio() < 1.25 ? camera.getAspectRatio() / idealAspectRatio : 1.0;

        tile = new CCTile3DButton( this );
        tile.setupText( "", camera.targetHeight * 0.1 * aspectRatioAdjutment, true, false );
        tile.setDrawOrder( 204 );
        tile.setTextColour( 1.0 );
        this.tileTimer = tile;
        this.time = 0;
    }

    this.requestResize();
};


SceneGameUI.prototype.render = function(camera, pass, alpha)
{
    //this.CCSceneAppUI_render( camera, pass, alpha );
};


SceneGameUI.prototype.resize = function()
{
    this.CCSceneAppUI_resize();

    var camera = this.camera;

    var tile, i;

    if( this.tileBack )
    {
        tile = this.tileBack;
        tile.setPositionXYZ( camera.cameraHWidth - tile.collisionBounds[0],
                             camera.cameraHHeight - tile.collisionBounds[1],
                             0.0 );
    }

    var playerTile, tileProfile, tileFlag, tileHealthIcon, tileHealthBar, tileFireIcon, tileFireCharge;

    // Position player 1 on the left
    {
        playerTile = this.playerTiles[0];
        tileProfile = playerTile.tileProfile;
        tileFlag = playerTile.tileFlag;
        tileHealthIcon = playerTile.tileHealthIcon;
        tileHealthBar = playerTile.tileHealthBar;
        tileFireIcon = playerTile.tileFireIcon;
        tileFireCharge = playerTile.tileFireCharge;

        if( tileProfile && tileFlag && tileHealthIcon && tileHealthBar && tileFireIcon && tileFireCharge.length > 0 )
        {
            tile = tileProfile;
            tile.setPositionXYZ( -camera.cameraHWidth + tile.collisionBounds[0],
                                 -camera.cameraHHeight + tile.collisionBounds[1],
                                  0.0 );

            tileFlag.positionTileAbove( tile );

            tileFireIcon.positionTileRight( tile );
            tileFireIcon.setPositionY( -camera.cameraHHeight + tileFireIcon.collisionBounds[1] );
            for( i=0; i<tileFireCharge.length; ++i )
            {
                if( i === 0 )
                {
                    tileFireCharge[i].positionTileRight( tileFireIcon );
                }
                else
                {
                    tileFireCharge[i].positionTileRight( tileFireCharge[i-1] );
                }
            }

            tileHealthIcon.positionTileAbove( tileFireIcon );
            tileHealthBar.positionTileRight( tileHealthIcon );
        }
    }

    // Position player 2 on the right
    {
        playerTile = this.playerTiles[1];
        tileProfile = playerTile.tileProfile;
        tileFlag = playerTile.tileFlag;
        tileHealthIcon = playerTile.tileHealthIcon;
        tileHealthBar = playerTile.tileHealthBar;
        tileFireIcon = playerTile.tileFireIcon;
        tileFireCharge = playerTile.tileFireCharge;

        if( tileProfile && tileFlag && tileHealthIcon && tileHealthBar && tileFireIcon && tileFireCharge.length > 0 )
        {
            tile = tileProfile;
            tile.setPositionXYZ( camera.cameraHWidth - tile.collisionBounds[0],
                                 -camera.cameraHHeight + tile.collisionBounds[1],
                                 0.0 );

            tileFlag.positionTileAbove( tile );

            tileFireIcon.positionTileLeft( tile );
            tileFireIcon.setPositionY( -camera.cameraHHeight + tileFireIcon.collisionBounds[1] );
            for( i=0; i<tileFireCharge.length; ++i )
            {
                if( i === 0 )
                {
                    tileFireCharge[i].positionTileLeft( tileFireIcon );
                }
                else
                {
                    tileFireCharge[i].positionTileLeft( tileFireCharge[i-1] );
                }
            }

            tileHealthIcon.positionTileAbove( tileFireIcon );
            tileHealthBar.positionTileLeft( tileHealthIcon );
        }
    }
};


SceneGameUI.prototype.touchPressed = function(touch)
{
    return this.CCSceneAppUI_touchPressed( touch );
};


SceneGameUI.prototype.touchMoving = function(touch, touchDelta)
{
    return false;
};


SceneGameUI.prototype.touchReleased = function(touch, touchAction)
{
    return this.CCSceneAppUI_touchReleased( touch, touchAction );
};


SceneGameUI.prototype.getProfilePlayerID = function(index)
{
    var playerTile = this.playerTiles[index];
    return playerTile.playerID;
};


SceneGameUI.prototype.setProfile = function(index, playerID, userID)
{
    var playerTile = this.playerTiles[index];
    playerTile.playerID = playerID;
    playerTile.userID = userID;

    var tileProfile = playerTile.tileProfile;
    var tileFlag = playerTile.tileFlag;
    var tileHealthIcon = playerTile.tileHealthIcon;
    var tileHealthBar = playerTile.tileHealthBar;

    tileProfile.shouldRender = true;
    tileHealthIcon.shouldRender = true;
    tileHealthBar.shouldRender = true;

    playerTile.tileFireIcon.shouldRender = true;

    if( sceneManagerGame )
    {
        var userInfo = sceneManagerGame.getConstUserIDData( userID );
        if( userInfo )
        {
            if( userInfo.facebook && userInfo.facebook.facebookID.length > 0 )
            {
                tileProfile.setFacebookID( userInfo.facebook.facebookID );
                tileProfile.bufferFBProfilePhoto( 2 );
            }
            else if( userInfo.twitter && userInfo.twitter.username )
            {
                tileProfile.setTwitterID( userInfo.twitter.username );
                tileProfile.bufferTwitterProfilePhoto( 2 );
            }
            else if( userInfo.google && userInfo.google.id )
            {
                tileProfile.setGoogleID( userInfo.google.id );
                tileProfile.bufferGoogleProfilePhoto( 2 );
            }

            var self = this;
            MultiplayerManager.LoadCountry( tileFlag, userInfo.countryCode, function (tile, textureHandle)
            {
                var scale = tile.collisionSize.width / tile.collisionSize.height;
                var camera = self.camera;
                tileFlag.setTileSize( camera.targetWidth * 0.1, ( camera.targetWidth * 0.1 ) / scale );
                self.requestResize();
            });
        }
        else if( userID === MultiplayerManager.UserID )
        {
            // Clear our IDs and re-buffer
            tileProfile.setFacebookID();
            tileProfile.setTwitterID();
            tileProfile.bufferInfo( 2 );
        }
    }
    this.requestResize();
};


SceneGameUI.prototype.removeProfile = function(index)
{
    var playerTile = this.playerTiles[index];
    var tileProfile = playerTile.tileProfile;
    var tileFlag = playerTile.tileFlag;
    var tileHealthIcon = playerTile.tileHealthIcon;
    var tileHealthBar = playerTile.tileHealthBar;

    tileProfile.shouldRender = false;
    tileFlag.shouldRender = false;
    tileHealthIcon.shouldRender = false;
    tileHealthBar.shouldRender = false;

    playerTile.tileFireIcon.shouldRender = false;
    for( var i=0; i<playerTile.tileFireCharge.length; ++i )
    {
        playerTile.tileFireCharge[i].shouldRender = false;
    }
};


SceneGameUI.prototype.setHealth = function(index, alpha)
{
    var playerTile = this.playerTiles[index];
    var tileHealthIcon = playerTile.tileHealthIcon;
    var tileHealthBar = playerTile.tileHealthBar;

    if( alpha >= 0.0 )
    {
        alpha = CC.FloatClamp( alpha, 0.0, 1.0 );
        tileHealthBar.setAmount( alpha );
    }

    if( !tileHealthIcon.getTileScaleInterpolator().updating )
    {
        tileHealthIcon.setTileScale( 1.5, true, function()
        {
            tileHealthIcon.setTileScale( 1.0, true );
        });
    }
};



SceneGameUI.prototype.setFire = function(index)
{
    var playerTile = this.playerTiles[index];
    var tile = playerTile.tileFireIcon;
    if( !tile.getTileScaleInterpolator().updating )
    {
        tile.setTileScale( 1.5, true, function()
        {
            tile.setTileScale( 1.0, true );
        });
    }
};


SceneGameUI.prototype.setAmmo = function(index, ammo)
{
    var playerTile = this.playerTiles[index];
    if( ammo >= 0.0 )
    {
        var tile, bulletIndex;
        for( bulletIndex=0; bulletIndex<playerTile.tileFireCharge.length; ++bulletIndex )
        {
            tile = playerTile.tileFireCharge[bulletIndex];
            tile.shouldRender = false;
        }

        ammo = CC.FloatClamp( ammo, 0.0, 1.0 );
        ammo *= 5.0;

        bulletIndex = 0;
        while( ammo > 0.0 )
        {
            tile = playerTile.tileFireCharge[bulletIndex++];
            tile.shouldRender = true;

            if( ammo < 1.0 )
            {
                tile.setColourAlpha( ammo );
            }
            else
            {
                tile.setColourAlpha( 1.0 );
            }

            ammo -= 1.0;
        }
    }
};


SceneGameUI.prototype.fight = function()
{
    var camera = this.camera;
    var tile = this.tileNotification;
    tile.setupTexturedWidth( camera.cameraWidth * 0.2, "resources/common/uigame/ui_fight.png" );
    tile.setColourAlpha( 0.0 );

    tile.setTileScale( 0.0 );
    tile.setTileScale( 2.0, true );
    tile.getColourInterpolator().setDuration( 0.25 );
    tile.setColourAlpha( 1.0, true, function()
    {
        tile.getColourInterpolator().setDuration( 2.0 );
        tile.setColourAlpha( 0.0, true );
    });
};


SceneGameUI.prototype.win = function()
{
    var camera = this.camera;
    var tile = this.tileNotification;
    tile.setupTexturedWidth( camera.cameraWidth * 0.2, "resources/common/uigame/ui_win.png" );
    tile.setColourAlpha( 0.0 );

    tile.setTileScale( 0.0 );
    tile.setTileScale( 2.0, true );
    tile.getColourInterpolator().setDuration( 0.25 );
    tile.setColourAlpha( 1.0, true, function()
    {
        tile.getColourInterpolator().setDuration( 5.0 );
        tile.setColourAlpha( 0.0, true );
    });
};


SceneGameUI.prototype.lose = function()
{
    var camera = this.camera;
    var tile = this.tileNotification;
    tile.setupTexturedWidth( camera.cameraWidth * 0.2, "resources/common/uigame/ui_lose.png" );
    tile.setColourAlpha( 0.0 );

    tile.setTileScale( 0.0 );
    tile.setTileScale( 2.0, true );
    tile.getColourInterpolator().setDuration( 0.25 );
    tile.setColourAlpha( 1.0, true, function()
    {
        tile.getColourInterpolator().setDuration( 5.0 );
        tile.setColourAlpha( 0.0, true );
    });
};


SceneGameUI.prototype.setTime = function(time)
{
    var intTime = Math.round( time + 0.5 );
    if( intTime !== this.time )
    {
        var tile = this.tileTimer;
        var value = "" + intTime + " ";
        tile.setText( value, true );

        if( this.tileBack )
        {
            tile.positionTileLeft( this.tileBack );
        }
        else
        {
            var camera = this.camera;
            tile.setPositionXYZ( camera.cameraHWidth - tile.collisionBounds[0],
                                 camera.cameraHHeight - tile.collisionBounds[1],
                                  0.0 );
        }

        this.time = intTime;
    }
};


SceneGameUI.prototype.backPressed = function()
{
    if( this.sceneMap )
    {
        this.sceneMap.handleBackButton();
    }
};
