/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : SceneUIAlert.js
 * Description : UI for alert notifications.
 *
 * Created     : 30/11/12
 *-----------------------------------------------------------
 */

function SceneUIAlert(message, confirmationRequired, inputRequired, confirmationOptions)
{
    this.construct();

    this.cameraCentered = true;

    gEngine.addScene( this );

    this.message = message;

    var self = this;
    this.onKeyboardFunction = function(event, key, pressed)
    {
        return self.onKeyboard( event, key, pressed );
    };
    gEngine.controls.requestKeyboard( this.onKeyboardFunction, inputRequired );

    if( inputRequired )
    {
        this.inputRequired = true;
        this.inputBlinkTimer = 0.0;
    }
    else if( confirmationRequired )
    {
        this.confirmationRequired = true;
    }

    if( confirmationOptions )
    {
        this.confirmationOptions = confirmationOptions;
        this.confirmationTiles = [];
    }
}
ExtendPrototype( SceneUIAlert, CCSceneAppUI );


SceneUIAlert.prototype.deleteLater = function()
{
    AlertsManager.RemovingAlert( this );

    if( this.onKeyboardFunction )
    {
        gEngine.controls.removeKeyboard( this.onKeyboardFunction );
        delete this.onKeyboardFunction;
    }

    this.CCSceneAppUI_deleteLater();
};


SceneUIAlert.prototype.setup = function()
{
    var self = this;

    var camera = gEngine.newSceneCamera( this, null, null, true );
    camera.setupViewport( 0.0, 0.0, 1.0, 1.0 );
    camera.setCameraWidth( 640.0, false );
    camera.useSceneCollideables( this );

    var tile;
    {
        tile = new CCTile3DButton( this );
        tile.setupTile( camera.targetWidth, camera.targetHeight );
        tile.setColour( gColour.set( 0.1, 0.0 ) );
        tile.setColourAlpha( 0.9, true );

        tile.setDrawOrder( 204 );

        this.cameraStickyTiles.add( tile );

        this.tileBackground = tile;
    }

    {
        tile = new CCTile3DButton( this );
        tile.setupText( " ", 1.0, true, true );
        tile.setColour( gColour.setRGBA( 0.05, 0.05, 0.05, 0.0 ) );
        tile.setTextColour( gColour.set( 1.0, 0.0 ) );

        tile.setDrawOrder( 205 );

        this.tileAlert = tile;
    }

    this.menuTiles = [];

    this.requestResize();
};


SceneUIAlert.prototype.updateScene = function(delta)
{
    var updated = this.CCSceneAppUI_updateScene( delta );

    if( this.inputRequired )
    {
        this.inputBlinkTimer += delta;
        var rate = 0.5;
        if( this.inputBlinkTimer > rate )
        {
            this.inputBlinkTimer -= rate;
            this.tileAlert.textObject.setEndMarker( !this.tileAlert.textObject.getEndMarker() );
        }
    }

    return updated;
};


SceneUIAlert.prototype.render = function(camera, pass, alpha)
{
    this.CCSceneAppUI_render( camera, pass, alpha );
};


SceneUIAlert.prototype.resize = function()
{
    this.CCSceneAppUI_resize();

    var camera = this.camera;
    var tile, i;

    {
        var textHeight;
        if( this.inputOptions && this.inputOptions.height !== undefined )
        {
            textHeight = this.inputOptions.height;
        }
        else
        {
            textHeight = 0.5;
        }
        tile = this.tileAlert;
        tile.setTileSize( camera.targetWidth, camera.targetHeight * 0.3 );
        tile.setTextHeight( tile.collisionBounds[1] * textHeight );
    }

    if( this.tileBackground )
    {
        this.tileBackground.setTileSize( camera.targetWidth, camera.targetHeight );
    }

    if( this.confirmationTiles )
    {
        var confirmationOptionsWidth = camera.targetWidth * 0.5;
        var confirmationOptionsHeight = confirmationOptionsWidth * 0.1;
        this.tileAlert.setTextPosition( undefined, confirmationOptionsHeight * 0.75 );

        var confirmationOptionsTileWidth = confirmationOptionsWidth / this.confirmationOptions.length;
        for( i=0; i<this.confirmationTiles.length; ++i )
        {
            tile = this.confirmationTiles[i];
            tile.setTileSize( confirmationOptionsTileWidth, confirmationOptionsHeight );
            tile.setTextHeight( tile.collisionSize.height * 0.66 );
        }

        var x = -confirmationOptionsWidth * 0.5;
        for( i=0; i<this.confirmationTiles.length; ++i )
        {
            tile = this.confirmationTiles[i];
            x += tile.collisionBounds[0];
            tile.setPositionX( x );
            tile.setPositionY( -tile.collisionBounds[1] );
            x += tile.collisionBounds[0];
        }
    }

    var menuTiles = this.menuTiles;
    for( i=0; i<menuTiles.length; ++i )
    {
        tile = menuTiles[i];
        if( i === 0 )
        {
            tile.setPositionXYZ( camera.cameraHWidth - tile.collisionBounds[0],
                                 camera.cameraHHeight - tile.collisionBounds[1],
                                 0.0 );
        }
        else
        {
            tile.positionTileBelow( menuTiles[i-1] );
        }
    }
};


// Take over controls
SceneUIAlert.prototype.updateControls = function(controls)
{
    this.CCSceneAppUI_updateControls( controls );
    return true;
};


SceneUIAlert.prototype.touchMovementAllowed = function(touch, touchDelta)
{
    return false;
};


SceneUIAlert.prototype.setTimeout = function(timeout)
{
    var self = this;
    var timer = new CCTimer();
    timer.onTime.push( function()
    {
        self.close();
    });
    timer.start( timeout );
    this.timers.push( timer );
};


SceneUIAlert.prototype.open = function()
{
    var self = this;
    var i;

    var tile = this.tileAlert;
    tile.setTextColourAlpha( 1.0, true );
    tile.setColourAlpha( 0.95, true );
    tile.setText( this.message );
    tile.setTextBlinking( true );

    var camera = this.camera;
    tile.setPositionX( ( camera.targetWidth * 0.5 ) + tile.collisionSize.width );

    // Push up the input position to allow for a virtual keyboard
    if( CCEngine.DeviceType !== "Web" )
    {
        if( this.inputRequired )
        {
            tile.setPositionY( camera.targetHeight * 0.25 );
        }
    }
    tile.setTileMovementX( 0.0 );


    if( this.confirmationOptions )
    {
        var OptionFunction = function(index)
        {
            return function()
            {
                self.closeCallback( index );
                self.close();
            };
        };

        var TimerFunction = function(tile, i)
        {
            return function()
            {
                tile.setTextColourAlpha( 1.0, true );
                tile.setColourAlpha( 0.95, true );
            };
        };

        for( i=0; i<this.confirmationOptions.length; ++i )
        {
            tile = new CCTile3DButton( this );
            tile.setTileTexture( "editor_tile_background.jpg" );

            tile.setText( this.confirmationOptions[i] );

            tile.setColour( gColour.set( 1.0, 0.0 ) );
            tile.setTextColour( gColour.set( 0.0, 0.0 ) );

            var timer = new CCTimer();
            timer.onTime.push( new TimerFunction( tile, i ) );
            timer.start( 0.5 + ( i * 0.5 ) );
            this.timers.push( timer );

            tile.setDrawOrder( 205 );

            tile.onRelease.push( new OptionFunction( i+1 ) );
            this.addTile( tile, 0 );

            this.confirmationTiles.push( tile );
        }
    }

    var menuTiles = this.menuTiles;
    for( i=0; i<menuTiles.length; ++i )
    {
        menuTiles[i].deleteLater();
    }
    menuTiles.length = 0;

    if( this.modal )
    {
    }
    else
    {
        CCEngine.EnableBackButton( this );
        if( this.inputRequired || this.confirmationRequired )
        {
            {
                tile = new CCTile3DButton( this );
                tile.setupTexturedWidth( camera.cameraWidth * 0.1, "editor_tile_cross.jpg", function()
                {
                    self.showMenu();
                });
                tile.setColour( gColour.setRGBA( 1.0, 1.0, 1.0, 0.0 ) );
                tile.setDrawOrder( 220 );

                tile.onRelease.push( function()
                {
                    if( self.closeCallback )
                    {
                        self.closeCallback( false );
                    }
                    self.close();
                });
                this.addTile( tile, 0 );

                menuTiles.add( tile );
            }

            {
                tile = new CCTile3DButton( this );
                tile.setupTexturedWidth( camera.cameraWidth * 0.1, "editor_tile_tick.jpg", function()
                {
                    self.showMenu();
                });
                tile.setColour( gColour.setRGBA( 1.0, 1.0, 1.0, 0.0 ) );
                tile.setDrawOrder( 220 );

                tile.onRelease.push( function()
                {
                    if( self.closeCallback )
                    {
                        if( self.inputRequired )
                        {
                            var text = self.tileAlert.getText();
                            text = text.formatSpacesAndTabs();
                            self.closeCallback( text );
                        }
                        else if( self.confirmationRequired )
                        {
                            self.closeCallback( true );
                        }
                    }
                    self.close();
                });
                this.addTile( tile, 0 );

                menuTiles.add( tile );
            }
        }
        else
        {
            tile = new CCTile3DButton( this );
            tile.setupTexturedWidth( camera.cameraWidth * 0.1, "editor_tile_back.jpg", function()
            {
                self.showMenu();
            });
            tile.setColour( gColour.setRGBA( 1.0, 1.0, 1.0, 0.0 ) );
            tile.setDrawOrder( 205 );

            tile.onRelease.push( function()
            {
                if( self.closeCallback )
                {
                    self.closeCallback();
                }
                self.close();
            });
            this.addTile( tile, 0 );

            menuTiles.add( tile );
        }
    }

    this.showMenu();
};


SceneUIAlert.prototype.showMenu = function()
{
    if( this.enabled )
    {
        var camera = this.camera;
        var menuTiles = this.menuTiles;

        this.requestResize();

        var i;
        for( i=0; i<menuTiles.length; ++i )
        {
            tile = menuTiles[i];
            tile.setPositionX( ( camera.targetWidth * 0.5 ) + tile.collisionSize.width );
            tile.translateTileMovementX( -tile.collisionSize.width * 1.5 );
            tile.setColourAlpha( 1.0, true );
            tile.setCollideable( true );
        }
    }
};


SceneUIAlert.prototype.close = function()
{
    var i;
    var self = this;

    if( this.tileBackground )
    {
        this.tileBackground.setColourAlpha( 0.0, true );
    }

    var tile = this.tileAlert;
    tile.setTextColourAlpha( 0.0, true );
    tile.setColourAlpha( 0.0, true, function()
    {
        self.deleteLater();
    });

    var camera = this.camera;
    tile.translateTileMovementX( -( camera.targetWidth * 0.5 ) - tile.collisionSize.width );

    if( this.confirmationTiles )
    {
        for( i=0; i<this.confirmationTiles.length; ++i )
        {
            tile = this.confirmationTiles[i];
            tile.setColourAlpha( 0.0, true );
            tile.setTextColourAlpha( 0.0, true );
            tile.setCollideable( false );
            tile.translateTileMovementX( -( camera.targetWidth * 0.5 ) - tile.collisionSize.width );
        }
    }

    var menuTiles = this.menuTiles;
    for( i=0; i<menuTiles.length; ++i )
    {
        tile = menuTiles[i];
        tile.translateTileMovementX( ( camera.targetWidth * 0.5 ) + tile.collisionSize.width );
        tile.setColour( gColour.setRGBA( 1.0, 1.0, 1.0, 0.0 ), true );
        tile.setCollideable( false );
    }
};


SceneUIAlert.prototype.handleBackButton = function()
{
    if( !this.modal )
    {
        if( !this.disabledBackButton )
        {
            if( this.closeCallback )
            {
                this.closeCallback( false );
            }
            this.close();
            return true;
        }
    }
    return false;
};


SceneUIAlert.prototype.onKeyboard = function(event, key, pressed)
{
    if( event.metaKey )
    {
        return false;
    }

    if( event.ctrlKey )
    {
        return false;
    }

    if( pressed )
    {
        var text = this.tileAlert.getText();
        if( key === "return" )
        {
            if( this.closeCallback )
            {
                text = text.formatSpacesAndTabs();
                this.closeCallback( text );
            }
            this.close();
            return true;
        }
        else if( key === "backspace" )
        {
            if( text.length > 0 )
            {
                text = text.substring( 0, text.length-1 );
                this.tileAlert.setText( text );
            }
            return true;
        }
        else if( key.length === 1 )
        {
            var allowed = false;
            if( key >= "a" && key <= "z" ||
                key >= "A" && key <= "Z" )
            {
                if( this.inputOptions.letter || this.inputOptions.letter === undefined )
                {
                    allowed = true;
                }
            }
            else if( key >= "0" && key <= "9" )
            {
                if( this.inputOptions.number || this.inputOptions.number === undefined )
                {
                    allowed = true;
                }
            }
            else if( key === " " )
            {
                if( this.inputOptions.space )
                {
                    allowed = true;
                }
            }
            else if( key === "." )
            {
                if( this.inputOptions.dot )
                {
                    allowed = true;
                }
            }
            else if( key === "," )
            {
                if( this.inputOptions.comma )
                {
                    allowed = true;
                }
            }
            else if( key === "-" )
            {
                if( this.inputOptions.minus )
                {
                    allowed = true;
                }
            }
            else if( key === "!" || key === "(" || key === ")" || key === "\"" || key === "'" || key === ":" )
            {
                if( this.inputOptions.functional )
                {
                    allowed = true;
                }
            }

            if( allowed )
            {
                if( this.inputOptions.length !== undefined )
                {
                    if( text.length < this.inputOptions.length )
                    {
                        text += key;
                        this.tileAlert.setText( text );
                    }
                }
                else if( text.length < 24 )
                {
                    text += key;
                    this.tileAlert.setText( text );
                }
            }
            return true;
        }
    }

    return false;
};
