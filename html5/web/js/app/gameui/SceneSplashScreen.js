/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : SceneSplashScreen.js
 * Description : Splash screen tiles
 *
 * Created     : 03/10/12
 *-----------------------------------------------------------
 */

function SceneSplashScreen()
{
    this.construct();

    // Cache these images in the background
    gEngine.textureManager.getTextureHandle( "resources/common/uimenu/ui_vs.png" );
    gEngine.textureManager.getTextureHandle( "resources/common/uimenu/ui_vs_whitestripe.png" );
    gEngine.textureManager.getTextureHandle( "resources/common/uimenu/ui_vs_bluestripe.png" );
    gEngine.textureManager.getTextureHandle( "resources/common/uimenu/ui_vs_redstripe.png" );
}
ExtendPrototype( SceneSplashScreen, CCSceneAppUI );


SceneSplashScreen.prototype.setup = function()
{
    var self = this;

    var camera = gEngine.newSceneCamera( this );
    camera.setupViewport( 0.0, 0.0, 1.0, 1.0 );
    camera.setCameraWidth( SceneBackground.SceneWidth );
    camera.useSceneCollideables( this );

    var tile;
    {
        tile = new CCTile3DButton( this );
        this.tileWhiteStripe = tile;
        tile.shouldRender = false;
    }

    {
        {
            tile = new CCTile3DButton( this );
            tile.setDrawOrder( 201 );
            this.tileBlueStripe = tile;

            tile.translate( camera.targetWidth, 0.0, 0.0 );
        }
    }

    {
        {
            tile = new CCTile3DButton( this );
            tile.setDrawOrder( 201 );
            this.tileRedStripe = tile;

            tile.translate( -camera.targetWidth, 0.0, 0.0 );
        }
    }

    {
        tile = new CCTile3DButton( this );
        tile.setDrawOrder( 204 );
        this.tilePlayer1 = tile;

        tile = new CCTile3DButton( this );
        tile.setDrawOrder( 204 );
        this.tilePlayerCountry1 = tile;

        tile = new CCTile3DButton( this );
        tile.setupText( "", 1.0, true, false );
        tile.setDrawOrder( 205 );
        tile.setTextColour( gColour.set( 1.0, 0.0 ) );
        this.tilePlayer1Score = tile;
    }

    {
        tile = new CCTile3DButton( this );
        tile.setDrawOrder( 204 );
        this.tilePlayer2 = tile;

        tile = new CCTile3DButton( this );
        tile.setDrawOrder( 204 );
        this.tilePlayerCountry2 = tile;

        tile = new CCTile3DButton( this );
        tile.setupText( "", 1.0, true, false );
        tile.setDrawOrder( 205 );
        tile.setTextColour( gColour.set( 1.0, 0.0 ) );
        this.tilePlayer2Score = tile;
    }

    {
        tile = new CCTile3DButton( this );
        tile.setupTextured( "resources/common/uimenu/ui_vs.png" );
        tile.setDrawOrder( 205 );

        this.tileVS = tile;
    }


    this.tileWhiteStripe.setupTextured( "resources/common/uimenu/ui_vs_whitestripe.png", function()
    {
        self.tileBlueStripe.setupTextured( "resources/common/uimenu/ui_vs_bluestripe.png", function()
        {
            self.tileRedStripe.setupTextured( "resources/common/uimenu/ui_vs_redstripe.png", function()
            {
                self.tileBlueStripe.positionTileAbove( self.tileWhiteStripe );
                {
                    tile = new CCTile3DButton( self );
                    tile.setupTextured( "resources/common/uimenu/ui_vs_whitestripe.png" );
                    tile.setColour( gColour.set( 0.0, 0.5 ) );
                    tile.setDrawOrder( 202 );

                    tile.translate( 0.0, ( self.tileBlueStripe.collisionBounds[1] + tile.collisionBounds[1] ), 0.0 );

                    tile.removeFromScene();
                    self.tileBlueStripe.addChild( tile );
                }

                {
                    tile = new CCTile3DButton( self );
                    tile.setupTextured( "resources/common/uimenu/ui_vs_whitestripe.png" );
                    tile.setColour( gColour.set( 0.0, 0.5 ) );
                    tile.setDrawOrder( 203 );

                    tile.translate( 0.0, -( self.tileBlueStripe.collisionBounds[1] + tile.collisionBounds[1] ), 0.0 );

                    tile.removeFromScene();
                    self.tileBlueStripe.addChild( tile );
                }

                self.tileRedStripe.positionTileBelow( self.tileWhiteStripe );
                {
                    tile = new CCTile3DButton( self );
                    tile.setupTextured( "resources/common/uimenu/ui_vs_whitestripe.png" );
                    tile.setColour( gColour.set( 0.0, 0.5 ) );
                    tile.setDrawOrder( 203 );

                    tile.translate( 0.0, ( self.tileRedStripe.collisionBounds[1] + tile.collisionBounds[1] ), 0.0 );

                    tile.removeFromScene();
                    self.tileRedStripe.addChild( tile );
                }

                {
                    tile = new CCTile3DButton( self );
                    tile.setupTextured( "resources/common/uimenu/ui_vs_whitestripe.png" );
                    tile.setColour( gColour.set( 0.0, 0.5 ) );
                    tile.setDrawOrder( 202 );

                    tile.translate( 0.0, -( self.tileRedStripe.collisionBounds[1] + tile.collisionBounds[1] ), 0.0 );

                    tile.removeFromScene();
                    self.tileRedStripe.addChild( tile );
                }

                self.loaded = true;
                self.hide( true );
                if( self.onLoaded )
                {
                    self.onLoaded();
                    delete self.onLoaded;
                }
            });
        });
    });

    {
        this.hide( true );
    }

    this.requestResize();
};


SceneSplashScreen.prototype.resize = function()
{
    this.CCSceneAppUI_resize();

    var camera = this.camera;

    var idealAspectRatio = 1.5;//1080.0f/720.0;
    var aspectRatioAdjutment = camera.getAspectRatio() < 1.25 ? camera.getAspectRatio() / idealAspectRatio : 1.0;

    var textHeight = camera.targetHeight * 0.15 * aspectRatioAdjutment;

    this.tilePlayer1Score.setTextHeight( textHeight, false );
    this.tilePlayer2Score.setTextHeight( textHeight, false );
};


SceneSplashScreen.prototype.render = function(camera, pass, alpha)
{
    //this.CCSceneAppUI_render( camera, pass, alpha );
};


SceneSplashScreen.prototype.touchPressed = function(touch)
{
    return this.CCSceneAppUI_touchPressed( touch );
};


SceneSplashScreen.prototype.touchMoving = function(touch, touchDelta)
{
    return false;
};


SceneSplashScreen.prototype.touchReleased = function(touch, touchAction)
{
    return this.CCSceneAppUI_touchReleased( touch, touchAction );
};


SceneSplashScreen.prototype.show = function(player1, country1, player2, country2)
{
    if( this.loaded )
    {
        this.showPlayer1( player1, country1 );
        this.showPlayer2( player2, country2 );

        this.tileVS.setTileMovement( vec3.create() );
        this.tileVS.setColourAlpha( 1.0, true );
    }
    else
    {
        var self = this;
        this.onLoaded = function()
        {
            self.show( player1, country1, player2, country2 );
        };
    }
};


SceneSplashScreen.prototype.hide = function(instantly)
{
    var self = this;

    if( !instantly )
    {
        if( this.onLoaded )
        {
            delete this.onLoaded;
        }
    }

    this.timers.length = 0;

    var camera = this.camera;
    this.tileBlueStripe.setColourAlpha( 0.0, !instantly, function()
    {
        self.enabled = false;
        camera.enabled = false;
    });
    this.tileBlueStripe.setTextColourAlpha( 0.0, !instantly );
    this.tileRedStripe.setColourAlpha( 0.0, !instantly );
    this.tileRedStripe.setTextColourAlpha( 0.0, !instantly );
    this.tileVS.setColourAlpha( 0.0, !instantly );
    this.tilePlayer1Score.setTextColourAlpha( 0.0, !instantly );
    this.tilePlayer2Score.setTextColourAlpha( 0.0, !instantly );

    if( instantly )
    {
        this.tileBlueStripe.setPositionX( -camera.targetWidth );
        this.tilePlayer1.setPositionX( camera.targetWidth );
        this.tilePlayerCountry1.setPositionX( -camera.targetWidth );
        this.tileRedStripe.setPositionX( camera.targetWidth );
        this.tilePlayer2.setPositionX( -camera.targetWidth );
        this.tilePlayerCountry2.setPositionX( camera.targetWidth );
        this.tileVS.setPositionZ( camera.targetOffset[2] );
    }
    else
    {
        this.tileBlueStripe.setTileMovementX( -camera.targetWidth );
        this.tilePlayer1.setTileMovementX( camera.targetWidth );
        this.tilePlayerCountry1.setTileMovementX( -camera.targetWidth );
        this.tileRedStripe.setTileMovementX( camera.targetWidth );
        this.tilePlayer2.setTileMovementX( -camera.targetWidth );
        this.tilePlayerCountry2.setTileMovementX( camera.targetWidth );
        this.tileVS.setTileMovement( vec3.clone( [ 0.0, 0.0, camera.targetOffset[2] * 1.0 ] ) );
    }

    this.showingPlayer1 = this.showingPlayer2 = false;
};


SceneSplashScreen.prototype.showPlayer1 = function(playerType, countryCode, time)
{
    if( !time )
    {
        time = 1.0;
    }

    if( this.showingPlayer1 !== playerType )
    {
        this.showingPlayer1 = playerType;

        var self = this;
        var camera = this.camera;
        this.enabled = true;
        camera.enabled = true;

        var tilePlayer1 = this.tilePlayer1;
        var tilePlayerCountry1 = this.tilePlayerCountry1;
        var tileBlueStripe = this.tileBlueStripe;

        var timer = new CCTimer();
        timer.onTime.push( function()
        {
            {
                SceneSplashScreen.LoadPlayerType( tilePlayer1, playerType, function(tile)
                {
                    if( self.showingPlayer1 )
                    {
                        tile.positionTileAbove( self.tileWhiteStripe );
                        tile.setPositionX( -camera.targetWidth * 0.75 );

                        tile.setTileMovementX( -camera.targetWidth * 0.5 + tile.collisionBounds[0] );

                        self.tilePlayer1Score.setPositionXY( 0.5, tileBlueStripe.position[1] );
                    }
                });
            }

            {
                MultiplayerManager.LoadCountry( tilePlayerCountry1, countryCode, function (tile, textureHandle)
                {
                    if( self.showingPlayer1 )
                    {
                        tile.setPosition( tileBlueStripe.position );
                        tile.setPositionX( camera.targetWidth * 0.75 );

                        tile.setTileMovementX( camera.targetWidth * 0.5 - tile.collisionBounds[0] );
                    }
                });
            }
        });
        timer.start( time );
        this.timers.push( timer );

        tileBlueStripe.setColourAlpha( 0.9, true );
        tileBlueStripe.setTileMovementX( 0.0 );
    }
};


SceneSplashScreen.prototype.showPlayer2 = function(playerType, countryCode, time)
{
    if( !time )
    {
        time = 1.25;
    }
    if( this.showingPlayer2 !== playerType )
    {
        this.showingPlayer2 = playerType;

        var self = this;
        var camera = this.camera;
        this.enabled = true;
        camera.enabled = true;

        var tilePlayer2 = this.tilePlayer2;
        var tilePlayerCountry2 = this.tilePlayerCountry2;
        var tileRedStripe = this.tileRedStripe;

        var timer = new CCTimer();
        timer.onTime.push( function()
        {
            {
                tilePlayer2.resetTileUVs();
                SceneSplashScreen.LoadPlayerType( tilePlayer2, playerType, function(tile)
                {
                    if( self.showingPlayer2 )
                    {
                        tile.flipTileY();

                        tile.positionTileAbove( tileRedStripe );
                        tile.translate( 0.0, -tileRedStripe.collisionSize.height, 0.0 );
                        tile.setPositionX( camera.targetWidth * 0.75 );

                        tile.setTileMovementX( camera.targetWidth * 0.5 - tile.collisionBounds[0] );

                        self.tilePlayer2Score.setPositionXY( 0.5, tileRedStripe.position[1] );
                    }
                });
            }

            {
                MultiplayerManager.LoadCountry( tilePlayerCountry2, countryCode, function (tile, textureHandle)
                {
                    if( self.showingPlayer2 )
                    {
                        tile.setPosition( tileRedStripe.position );
                        tile.setPositionX( -camera.targetWidth * 0.75 );

                        tile.setTileMovementX( -camera.targetWidth * 0.5 + tile.collisionBounds[0] );
                    }
                });
            }
        });
        timer.start( time );
        this.timers.push( timer );

        tileRedStripe.setColourAlpha( 0.9, true );
        tileRedStripe.setTileMovementX( 0.0 );
    }
};


SceneSplashScreen.LoadPlayerType = function(tile, playerType, callback)
{
    var playerTypeInfo = sceneManagerGame.getPlayerTypeInfo( playerType );
    if( playerTypeInfo.icon )
    {
        tile.setupTextured( playerTypeInfo.icon, callback );
    }
    else
    {
        callback( tile );
    }
};


SceneSplashScreen.prototype.isShowingPlayer1 = function()
{
    return this.showingPlayer1;
};


SceneSplashScreen.prototype.isShowingPlayer2 = function()
{
    return this.showingPlayer2;
};


SceneSplashScreen.prototype.getPlayer1Stripe = function()
{
    return this.tileBlueStripe;
};


SceneSplashScreen.prototype.getPlayer2Stripe = function()
{
    return this.tileRedStripe;
};


SceneSplashScreen.prototype.getPlayer1Score = function()
{
    return this.tilePlayer1Score;
};


SceneSplashScreen.prototype.getPlayer2Score = function()
{
    return this.tilePlayer2Score;
};
