/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : SceneAudioEditor.js
 * Description : Edit audio.
 *
 * Created     : 08/06/13
 *-----------------------------------------------------------
 */

function SceneAudioEditor(parentScene, showLists)
{
    MultiplayerManager.UpdateCallbacks.add( this );

    this.construct();

    // Inform our parent on delete
    if( parentScene )
    {
        this.setParent( parentScene );
    }

    this.cameraCentered = true;
    gEngine.addScene( this );

    var self = this;

    // Per File Load
    this.onDragDropLoadFunction = function(file, event)
    {
        self.onDragDropLoad( file, event );
    };
    gEngine.controls.onDragDropLoad.add( this.onDragDropLoadFunction );

    if( showLists )
    {
        this.sceneUIListImages = new SceneUIListImages( this );
        this.sceneUIListImages.onSelected = function (imageInfo)
        {
            self.setAsset( imageInfo.tex );
        };
        this.sceneUIListImages.onDeleted = function (imageInfo)
        {
            EditorManager.EditorDeleteImage( imageInfo );
        };
    }

    this.info = {};

    CCEngine.EnableBackButton( this );
}
ExtendPrototype( SceneAudioEditor, CCSceneAppUI );


SceneAudioEditor.prototype.deleteLater = function()
{
    if( this.onDragDropLoadFunction )
    {
        gEngine.controls.onDragDropLoad.remove( this.onDragDropLoadFunction );
        this.onDragDropLoadFunction = null;
    }

    if( this.sceneUIListImages )
    {
        this.sceneUIListImages.close();
        this.sceneUIListImages = null;
    }

    this.CCSceneAppUI_deleteLater();
};


SceneAudioEditor.prototype.setup = function()
{
    var self = this;

    var camera = gEngine.newSceneCamera( this );
    camera.setupViewport( 0.0, 0.0, 1.0, 1.0 );
    camera.setCameraWidth( 400.0, false );

    var tile;
    {
        tile = new CCTile3DButton( self );
        tile.setupTile( camera.targetWidth, camera.targetHeight );
        tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
        tile.setColour( gColour.set( 0.25, 0.0 ) );
        tile.setColourAlpha( 0.95, true );

        tile.setDrawOrder( 204 );

        this.cameraStickyTiles.add( tile );

        this.tileBackground = tile;
    }

    {
        tile = new CCTile3DButton( this );
        tile.setupText( " ", 1.0, true, true );
        tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
        tile.setColour( gColour.setRGBA( 0.5, 0.65, 1.0, 0.0 ) );
        tile.setTextColour( gColour.setRGBA( 1.0, 1.0, 1.0, 0.0 ) );

        tile.setPositionX( ( camera.targetWidth * 0.5 ) + tile.collisionSize.width );
        //tile.movementInterpolator.setDuration( 2.0 );
        tile.setDrawOrder( 210 );

        this.tileAlert = tile;
    }

    {
        tile = new CCTile3DButton( this );
        tile.setupTile( 1.0 );
        tile.setText( "" );
        tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
        tile.setColourAlpha( 0.0, false );

        tile.setPositionY( -( camera.targetHeight * 0.5 ) - tile.collisionSize.height );
        tile.setDrawOrder( 210 );

        tile.onRelease.push( function (tile)
        {
            self.togglePlay();
        });
        this.addTile( tile );

        this.tileModel = tile;
    }

    this.menuTiles = [];
    this.bottomTiles = [];

    this.requestResize();
};


SceneAudioEditor.prototype.syncUpdate = function(jsonData)
{
    if( jsonData.EditorAudioCreated )
    {
        if( this.onClose )
        {
            this.info.id = jsonData.EditorAudioCreated;
            this.onClose( this.info );
            this.close();
        }
    }
};


SceneAudioEditor.prototype.updateScene = function(delta)
{
    var updated = this.CCSceneAppUI_updateScene( delta );

    var tile = this.tileModel;
    if( tile.modelObject )
    {
        tile.modelObject.rotateY( delta * 15.0 );
        tile.modelObject.model.animate( delta );
    }

    return updated;
};


SceneAudioEditor.prototype.resize = function()
{
    this.CCSceneAppUI_resize();

    var camera = this.camera;
    var i, tile;

    var idealAspectRatio = 1.5;//1080.0f/720.0;
    var aspectRatioAdjutment = camera.getAspectRatio() < 1.25 ? camera.getAspectRatio() / idealAspectRatio : 1.0;

    {
        tile = this.tileModel;
        tile.setTextHeight( camera.targetHeight * 0.065 * aspectRatioAdjutment, true );
        tile.setTileSize( tile.collisionSize.width * 1.1, tile.collisionSize.height * 1.5 );
    }

    {
        tile = this.tileAlert;
        tile.setTileSize( camera.targetWidth, camera.targetHeight * 0.15 );
        tile.setTextHeight( tile.collisionBounds[1] );

        var targetPosition = tile.getTileMovementTarget();
        targetPosition[1] = camera.targetHeight * 0.5 - tile.collisionBounds[1];
        tile.setPosition( targetPosition );
    }

    {
        this.tileBackground.setTileSize( camera.targetWidth, camera.targetHeight );
    }

    var y = camera.cameraHHeight;
    var menuTiles = this.menuTiles;
    for( i=0; i<menuTiles.length; ++i )
    {
        tile = menuTiles[i];

        var x = tile.getTileMovementTarget()[0];
        y -= tile.collisionBounds[1];
        tile.setPositionY( y );
        y -= tile.collisionBounds[1];

        tile.setTileMovementX( x );
    }

    var bottomTiles = this.bottomTiles;
    var tileHeight = camera.targetHeight * 0.075;
    for( i=0; i<bottomTiles.length; ++i )
    {
        tile = bottomTiles[i];
        tile.setTileSize( tileHeight );

        if( i === 0 )
        {
            tile.setPositionX( camera.cameraHWidth - tile.collisionBounds[0] );
        }
        else
        {
            tile.positionTileLeftX( bottomTiles[i-1] );
        }
    }
    this.showControls( false );
};


SceneAudioEditor.prototype.touchPressed = function(touch)
{
    var result = this.CCSceneAppUI_touchPressed( touch );
    return true;
};


SceneAudioEditor.prototype.touchMoving = function(touch, touchDelta)
{
    var result = this.handleTilesTouch( touch, this.controlsMovingVertical ? CCControls.touch_movingVertical : CCControls.touch_movingHorizontal );
    if( result === CCSceneAppUI.tile_touchAction )
    {
        return true;
    }

    // Stop other views moving
    return true;
};


SceneAudioEditor.prototype.touchReleased = function(touch, touchAction)
{
    var result = this.CCSceneAppUI_touchReleased( touch, touchAction );
    return true;
};


SceneAudioEditor.prototype.open = function(message)
{
    this.message = message;

    var self = this;
    var camera = this.camera;

    var i, tile;

    // Tick/Cross buttons
    var menuTiles = this.menuTiles;
    for( i=0; i<menuTiles.length; ++i )
    {
        menuTiles[i].deleteLater();
    }
    menuTiles.length = 0;
    {
        {
            tile = new CCTile3DButton( this );
            tile.setupTexturedWidth( camera.cameraWidth * 0.1, "resources/editor/editor_tile_back.jpg", function (tile)
            {
                tile.setPositionX( ( camera.targetWidth * 0.5 ) + tile.collisionBounds[0] );
                self.showMenu();
            });
            tile.setColour( gColour.setRGBA( 1.0, 1.0, 1.0, 0.0 ) );
            tile.setDrawOrder( 220 );

            tile.onRelease.push( function()
            {
                self.handleBackButton();
            });
            this.addTile( tile, 0 );

            menuTiles.add( tile );
        }

        {
            tile = new CCTile3DButton( this );
            tile.setupTexturedWidth( camera.cameraWidth * 0.1, "resources/editor/editor_tile_tick.jpg", function (tile)
            {
                tile.setPositionX( ( camera.targetWidth * 0.5 ) + tile.collisionBounds[0] );
                self.showMenu();
            });
            tile.setColour( gColour.setRGBA( 1.0, 1.0, 1.0, 0.0 ) );
            tile.setDrawOrder( 220 );

            tile.onRelease.push( function()
            {
                socket.emit( 'EditorAudioCreate', self.info.mp3 );

                if( self.onClose )
                {
                    // Close callback will be fired once the server creates our model
                    // SyncUpdate
                }
                else
                {
                    self.close();
                }
            });
            this.addTile( tile, 0 );

            menuTiles.add( tile );
        }
    }

    this.showMenu();
};


SceneAudioEditor.prototype.showMenu = function()
{
    if( this.enabled )
    {
        this.requestResize();

        var camera = this.camera;
        var menuTiles = this.menuTiles;

        var i, tile;

        {
            tile = this.tileAlert;
            tile.setTextColourAlpha( 1.0, true );
            tile.setColourAlpha( 0.5, true );
            tile.setText( this.message );

            tile.setTileMovementX( 0.0 );
        }

        {
            tile = this.tileModel;
            if( tile.modelObject )
            {
                tile.setColourAlpha( 0.5, true );
            }
            else
            {
                tile.setColourAlpha( 1.0, true );
            }

            tile.setTileMovementY( 0.0 );
        }

        for( i=0; i<menuTiles.length; ++i )
        {
            tile = menuTiles[i];
            tile.setTileMovementX( ( camera.targetWidth * 0.5 ) - tile.collisionBounds[0] );
            tile.setColourAlpha( 1.0, true );
            tile.enabled = true;
        }

        this.showControls();
    }
};


SceneAudioEditor.prototype.openControls = function()
{
    if( this.info.id )
    {
        var self = this;
        var camera = this.camera;

        var LoadedImageFunction = function(tile)
        {
            return function()
            {
                tile.setPositionY( -camera.cameraHHeight - tile.collisionBounds[1] );
                self.showControls();
            };
        };

        var i, tile;

        var bottomTiles = this.bottomTiles;
        for( i=0; i<bottomTiles.length; ++i )
        {
            bottomTiles[i].deleteLater();
        }
        bottomTiles.length = 0;

        if( MultiplayerManager.IsOwner( this.info.owners ) )
        {
            {
                tile = new CCTile3DButton( this );
                tile.setupTextured( "resources/editor/editor_icon_delete.jpg", new LoadedImageFunction( tile ) );
                tile.setColour( EditorManager.Red );
                tile.setDrawOrder( 220 );

                tile.onRelease.push( function()
                {
                    if( MultiplayerManager.LoggedIn )
                    {
                        AlertsManager.ConfirmationAlert( "Delete audio?", function(result)
                        {
                            if( result )
                            {
                                if( self.onClose )
                                {
                                    self.onClose( false );
                                }

                                if( MultiplayerManager.LoggedIn )
                                {
                                    EditorManager.EditorDeleteAudio( self.info );
                                }
                                self.close();
                            }
                        });
                    }
                });
                this.addTile( tile, 0 );
                bottomTiles.add( tile );
            }
        }

        this.showControls();
    }
};


SceneAudioEditor.prototype.showControls = function(resizeRequired)
{
    if( this.enabled )
    {
        if( resizeRequired === undefined )
        {
            resizeRequired = true;
        }

        if( resizeRequired )
        {
            this.requestResize();
        }

        var camera = this.camera;
        var bottomTiles = this.bottomTiles;

        var i, tile;
        for( i=0; i<bottomTiles.length; ++i )
        {
            tile = bottomTiles[i];
            var targetY = ( -camera.targetHeight * 0.5 ) + tile.collisionBounds[1];
            if( tile.position[1] > targetY )
            {
                tile.setPositionY( targetY );
            }
            else
            {
                tile.setTileMovementY( targetY );
            }
            tile.setColourAlpha( 1.0, true );
            tile.enabled = true;
        }
    }
};


SceneAudioEditor.prototype.close = function()
{
    var self = this;
    var camera = this.camera;

    this.stop();

    this.tileBackground.setColourAlpha( 0.0, true );

    var tile;

    {
        tile = this.tileAlert;
        tile.setTextColourAlpha( 0.0, true );
        tile.setColourAlpha( 0.0, true, function()
        {
            self.deleteLater();
        });
        tile.translateTileMovementX( -( camera.targetWidth * 0.5 ) - tile.collisionSize.width );
    }

    {
        tile = this.tileModel;
        tile.setColourAlpha( 0.0, true );
        tile.setTileMovementY( -( camera.targetHeight * 0.5 ) - tile.collisionSize.height );
    }

    var menuTiles = this.menuTiles;
    for( i=0; i<menuTiles.length; ++i )
    {
        tile = menuTiles[i];
        tile.translateTileMovementX( ( camera.targetWidth * 0.5 ) + tile.collisionSize.width );
        tile.setColour( gColour.setRGBA( 1.0, 1.0, 1.0, 0.0 ), true );
        tile.enabled = false;
    }

    var bottomTiles = this.bottomTiles;
    for( i=0; i<bottomTiles.length; ++i )
    {
        tile = bottomTiles[i];
        tile.translateTileMovementY( -tile.collisionSize.height );
        tile.setColourAlpha( 0.0, true );
    }
};


SceneAudioEditor.prototype.setInfo = function(info)
{
    this.info = info;

    if( info.mp3 )
    {
        this.setAsset( info.mp3 );
    }

    this.openControls();
};


SceneAudioEditor.prototype.setAsset = function(filename)
{
    if( filename )
    {
        var self = this;
        var info = this.info;
        var tile = this.tileModel;

        var fileExtension = filename.getExtension();
        if( fileExtension === "mp3" )
        {
            info.mp3 = filename;

            var friendlyName = String.SplitBefore( filename, "." );
            friendlyName += ".mp3";
            tile.setText( friendlyName, true );
            this.requestResize();

            if( this.sceneUIListImages )
            {
                this.sceneUIListImages.findAndSelect( filename );
            }

            this.play();

            return true;
        }
    }

    return false;
};


SceneAudioEditor.prototype.onDragDropLoad = function(file, event)
{
    if( event && event.target && event.target.result )
    {
        if( MultiplayerManager.LoggedIn )
        {
            var data = event.target.result;
            this.prepareUpload( file, data );
        }
    }
};


SceneAudioEditor.prototype.prepareUpload = function(file, data)
{
    var self = this;

    var filename = file.name;
    filename = filename.toLowerCase();
    var fileExtension = filename.getExtension();

    if( fileExtension === "mp3" )
    {
        var dataBuffer = new Uint8Array( data );
        this.uploadMP3( filename, dataBuffer );
    }
    else
    {
        AlertsManager.TimeoutAlert( "only .mp3 is supported", 2.0 );
    }
};


SceneAudioEditor.prototype.uploadMP3 = function(filename, data)
{
    var self = this;

    AlertsManager.ModalAlert( "uploading..." );

    var url = SERVER_ASSETS_URL + 'assets/upload.php';

    var postData = { "filename": filename };
    postData.file = new Blob( [data], { "type" : "text\/plain" } );

    // If we want to access our production server from a local session
    if( url.getDomain() !== windowDomain )
    {
        postData.url = url;
        url = SERVER_ROOT + "backend/helper.php?uploadfile";
    }

    gURLManager.requestURL(
        url,
        postData,
        function(status, responseText)
        {
            AlertsManager.Hide( "uploading..." );

            var uploaded = false;
            if( status >= CCURLRequest.Succeeded )
            {
                if( responseText )
                {
                    var filename = responseText;
                    if( MultiplayerManager.LoggedIn )
                    {
                        uploaded = self.setAsset( filename );
                    }
                }
            }

            if( !uploaded )
            {
                AlertsManager.TimeoutAlert( "failed to upload mp3 :(", 2.0 );
            }
        },
        1 );
};


SceneAudioEditor.prototype.togglePlay = function()
{
    var tile = this.tileModel;
    var id = "audioeditor";

    if( CCAudioManager.IsPlaying( id ) )
    {
        tile.setColour( EditorManager.LightRed, true );
        CCAudioManager.Stop( id );
    }
    else if( this.info )
    {
        if( this.info.mp3 )
        {
            tile.setColour( EditorManager.LightYellow, true );
            CCAudioManager.Play( id, this.info.mp3, true, false, function()
            {
                tile.setColour( EditorManager.LightGreen, true );
            });
        }
    }
};


SceneAudioEditor.prototype.play = function()
{
    var tile = this.tileModel;
    var id = "audioeditor";

    if( this.info )
    {
        if( this.info.mp3 )
        {
            tile.setColour( EditorManager.LightYellow, true );
            CCAudioManager.Play( id, this.info.mp3, true, false, function()
            {
                tile.setColour( EditorManager.LightGreen, true );
            });
        }
    }
};


SceneAudioEditor.prototype.stop = function()
{
    var tile = this.tileModel;
    var id = "audioeditor";

    if( CCAudioManager.IsPlaying( id ) )
    {
        tile.setColour( EditorManager.LightRed, true );
        CCAudioManager.Stop( id );
    }
};


SceneAudioEditor.prototype.handleBackButton = function()
{
    if( !this.disabledBackButton )
    {
        this.disabledBackButton = true;
        if( this.onClose )
        {
            this.onClose( false );
        }
        this.close();
        return true;
    }
    return false;
};
