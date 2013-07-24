/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : SceneAssetEditorSettings.js
 * Description : UI for asset editor's settings.
 *
 * Created     : 18/05/13
 *-----------------------------------------------------------
 */

function SceneAssetEditorSettings(editor)
{
    this.construct();
    gEngine.addScene( this );
    this.editor = editor;
    this.info = editor.info;

    this.controlsSwipeMomentum = true;
}
ExtendPrototype( SceneAssetEditorSettings, CCSceneAppUI );


SceneAssetEditorSettings.prototype.setup = function()
{
    var self = this;

    var camera = gEngine.newSceneCamera( this );
    camera.setupViewport( 0.8, 0.2, 0.2, 0.7 );
    camera.setCameraWidth( 640.0 * 0.1, false );

    this.settingTiles = [];

    this.requestResize();
};


SceneAssetEditorSettings.prototype.resize = function()
{
    this.CCSceneAppUI_resize();

    var camera = this.camera;
    var i, tile;
    var tileMovementTarget;

    var idealAspectRatio = 1.5;//1080.0f/720.0;
    var aspectRatioAdjutment = camera.getAspectRatio() < 1.25 ? camera.getAspectRatio() / idealAspectRatio : 1.0;

    var y = camera.cameraHHeight;

    var settingTiles = this.settingTiles;
    for( i=0; i<settingTiles.length; ++i )
    {
        tile = settingTiles[i];
        tileMovementTarget = tile.getTileMovementTarget();

        y -= tile.collisionBounds[1];
        tile.setPositionY( y );
        tile.setTileMovementX( tileMovementTarget[0] );

        if( tile.tileDelete )
        {
            var tileDelete = tile.tileDelete;
            tileMovementTarget = tileDelete.getTileMovementTarget();

            tileDelete.setPositionY( y );

            tileDelete.setTileMovementX( tileMovementTarget[0] );
        }

        y -= tile.collisionBounds[1];
    }
};


SceneAssetEditorSettings.prototype.updateControls = function(controls)
{
    var usingControls = this.CCSceneAppUI_updateControls( controls );

    var cameraTouches = this.camera.cameraTouches;
    var touch = cameraTouches[0];
    if( touch.x > 0.0 && touch.x < 1.0 &&
        touch.y > 0.0 && touch.y < 1.0 &&
        touch.startX > 0.0 && touch.startX < 1.0 &&
        touch.startY > 0.0 && touch.startY < 1.0 )
    {
        // Monitor our wheel deltas
        if( controls.wheel && controls.wheel.delta !== 0.0 )
        {
            var delta = controls.wheel.delta;
            this.cameraScrolling = true;
            this.controlsMovingVertical = true;
            this.touchCameraMoving( 0.0, delta * 0.1 );
            return true;
        }
    }

    return usingControls;
};


SceneAssetEditorSettings.prototype.touchMovementAllowed = function(touch, touchDelta)
{
    var absDeltaX = Math.abs( touch.totalDeltaX );
    var absDeltaY = Math.abs( touch.totalDeltaY );
    if( absDeltaX > CCControls.TouchMovementThreashold.x || absDeltaY > CCControls.TouchMovementThreashold.y )
    {
        this.controlsMoving = true;
        touchDelta.x += touch.totalDeltaX;
        touchDelta.y += touch.totalDeltaY;

        this.controlsMovingVertical = true;
        return true;
    }
    return false;
};


SceneAssetEditorSettings.prototype.refreshCameraView = function()
{
    var tiles = this.tiles;

    if( tiles.length > 0 )
    {
        var top = -CC_MAXFLOAT;
        var bottom = CC_MAXFLOAT;

        for( var i=0; i<tiles.length; ++i )
        {
            var tile = tiles[i];

            var topY = tile.getTileMovementTarget()[1] + tile.collisionBounds[1];
            var bottomY = tile.getTileMovementTarget()[1] - tile.collisionBounds[1];

            if( topY > top )
            {
                top = topY;
            }

            if( bottomY < bottom )
            {
                bottom = bottomY;
            }
        }

        var camera = this.camera;
        this.sceneLeft = 0.0;
        this.sceneRight = 0.0;
        this.sceneTop = top - camera.targetHeight * 0.5;
        this.sceneBottom = bottom + camera.targetHeight * 0.5;
        if( this.sceneBottom > this.sceneTop )
        {
            this.sceneBottom = this.sceneTop;
        }
    }
};


SceneAssetEditorSettings.prototype.lockCameraView = function()
{
    if( this.cameraScrolling )
    {
        return;
    }

    var camera = this.camera;

    if( camera.targetLookAt[0] < this.sceneLeft )
    {
        camera.targetLookAt[0] = this.sceneLeft;
        camera.flagUpdate();
    }
    if( camera.targetLookAt[0] > this.sceneRight )
    {
        camera.targetLookAt[0] = this.sceneRight;
        camera.flagUpdate();
    }

    if( camera.targetLookAt[1] > this.sceneTop )
    {
        camera.targetLookAt[1] = this.sceneTop;
        camera.flagUpdate();
    }
    else if( camera.targetLookAt[1] < this.sceneBottom )
    {
        camera.targetLookAt[1] = this.sceneBottom;
        camera.flagUpdate();
    }
};


SceneAssetEditorSettings.prototype.openModelSettings = function(model)
{
    var self = this;
    var camera = this.camera;

    var tileWidth = camera.targetWidth;
    var tileHeight = camera.targetWidth * 0.125;
    var textHeight = tileHeight * 0.9;

    var optionTileWidth = tileWidth - tileHeight;

    var i, tile, tileDelete;

    // Setting tiles
    var settingTiles = this.settingTiles;
    var animate = settingTiles.length === 0;
    for( i=0; i<settingTiles.length; ++i )
    {
        tile = settingTiles[i];
        if( tile.tileDelete )
        {
            tile.tileDelete.deleteLater();
        }
        tile.deleteLater();
    }
    settingTiles.length = 0;
    {
        {
            tile = new CCTile3DButton( this );
            tile.setupText( "Settings", textHeight, true, true );
            tile.setTileSize( tileWidth, tileHeight );

            tile.setTextColour( gColour.set( 1.0, 1.0 ), true );
            tile.setColour( gColour.set( 0.25, 0.0 ) );
            tile.setDrawOrder( 220 );
            this.addTile( tile, 0 );
            settingTiles.add( tile );
        }

        if( model )
        {
            var primitive = model.primitive;
            if( primitive )
            {
                if( this.info.obj )
                {
                    tile = new CCTile3DButton( this );
                    tile.setupText( "Filesize : ...", textHeight, true, true );
                    tile.setTileSize( tileWidth, tileHeight );

                    tile.setTextColour( gColour.set( 1.0, 1.0 ), true );
                    tile.setColour( gColour.set( 0.25, 0.0 ) );
                    tile.setDrawOrder( 220 );

                    settingTiles.add( tile );

                    var url = MultiplayerManager.GetAssetURL( this.info.obj );
                    var filename = url.stripDirectory();
                    filename = String.StripEquals( filename );

                    if( primitive )
                    {
                        if( primitive.fileSize && !primitive.dirty )
                        {
                            var fileSize = primitive.fileSize;
                            tile.setText( "Filesize: " + ( fileSize / 1024 / 1024 ).toFixed( 2 ) + " mb" );
                        }
                    }
                }

                if( this.info.obj )
                {
                    tile = new CCTile3DButton( this );
                    tile.setupText( " ", textHeight, true, true );
                    tile.setTileSize( tileWidth, tileHeight );

                    tile.setTextColour( gColour.set( 0.0, 1.0 ), true );
                    tile.setColour( gColour.set( 0.85, 0.0 ) );
                    tile.setDrawOrder( 220 );
                    this.tileCulling = tile;

                    tile.onRelease.push( function()
                    {
                        self.editor.setCulling( !self.info.noCulling );
                    });
                    this.addTile( tile, 0 );

                    this.editor.setCulling( this.info.noCulling );

                    settingTiles.add( tile );
                }

                var animations = primitive.animations;
                if( animations && animations.length > 0 )
                {
                    {
                        tile = new CCTile3DButton( this );
                        tile.setupText( "Animations", textHeight, true, true );
                        tile.setTileSize( tileWidth, tileHeight );

                        tile.setTextColour( gColour.set( 1.0, 1.0 ), true );
                        tile.setColour( gColour.set( 0.25, 0.0 ) );
                        tile.setDrawOrder( 220 );

                        settingTiles.add( tile );
                    }

                    var SetAnimationFPSCompression = function(index)
                    {
                        return function()
                        {
                            AlertsManager.InputAlert( "", function(result)
                            {
                                if( result )
                                {
                                    var ratio = parseInt( result, 10 );
                                    self.editor.setAnimationFPSCompression( ratio );
                                }
                            },
                            {
                                letter:false
                            });
                        };
                    };

                    {
                        var animationFPSCompression = model.getAnimationFPSCompression();
                        tile = new CCTile3DButton( this );
                        tile.setupText( "1/" + animationFPSCompression + " fps compression", textHeight, true, true );
                        tile.setTileSize( tileWidth, tileHeight );

                        tile.setColour( gColour.set( 1.0, 0.0 ) );
                        tile.setDrawOrder( 220 );

                        tile.onRelease.push( new SetAnimationFPSCompression( animationFPSCompression ) );
                        this.addTile( tile, 0 );
                        settingTiles.add( tile );
                    }

                    var SetAnimation = function(index)
                    {
                        return function()
                        {
                            self.editor.setAnimation( index );
                        };
                    };

                    var DeleteAnimation = function(animationName)
                    {
                        return function()
                        {
                            self.editor.deleteAnimation( animationName );
                        };
                    };

                    var currentAnimationIndex = model.getAnimation();
                    var animation;

                    for( i=0; i<animations.length; ++i )
                    {
                        animation = animations[i];

                        tile = new CCTile3DButton( this );
                        tile.setupText( animation.name, textHeight, true, true );
                        tile.setTileSize( optionTileWidth, tileHeight );

                        tile.setTextColour( gColour.set( 0.0, 1.0 ), true );

                        tile.setColour( gColour.set( 0.85, 0.0 ) );
                        if( currentAnimationIndex === i )
                        {
                            tile.setColour( EditorManager.LightGreen );
                        }

                        tile.setDrawOrder( 220 );

                        tile.onRelease.push( new SetAnimation( i ) );
                        this.addTile( tile, 0 );

                        settingTiles.add( tile );

                        // Delete
                        {
                            tileDelete = new CCTile3DButton( this );
                            tileDelete.setupTile( tileHeight );
                            tileDelete.setTileTexture( "resources/editor/editor_icon_delete.jpg" );
                            tileDelete.setColour( EditorManager.Red );
                            tileDelete.setDrawOrder( 221 );

                            tileDelete.onRelease.push( new DeleteAnimation( animation.name ) );
                            this.addTile( tileDelete, 0 );

                            tile.tileDelete = tileDelete;
                        }
                    }

                    {
                        tile = new CCTile3DButton( this );
                        tile.setupText( "Frames", textHeight, true, true );
                        tile.setTileSize( tileWidth, tileHeight );

                        tile.setTextColour( gColour.set( 1.0, 1.0 ), true );
                        tile.setColour( gColour.set( 0.25, 0.0 ) );
                        tile.setDrawOrder( 220 );

                        settingTiles.add( tile );
                    }

                    var ToggleAnimationFrame = function(index)
                    {
                        return function()
                        {
                            self.editor.toggleAnimationFrame( index );
                        };
                    };

                    var DeleteAnimationFrame = function(index)
                    {
                        return function()
                        {
                            self.editor.deleteAnimationFrame( index );
                        };
                    };


                    var currentAnimationFrameIndex = model.getAnimationFrame();
                    animation = animations[currentAnimationIndex];

                    var frames = animation.frames;
                    this.tileAnimationFrames = [];
                    for( i=0; i<frames.length; ++i )
                    {
                        tile = new CCTile3DButton( this );
                        tile.setupText( "Frame " + (i+1), textHeight, true, true );
                        tile.setTileSize( optionTileWidth, tileHeight );

                        tile.setTextColour( gColour.set( 0.0, 1.0 ), true );
                        tile.setColour( gColour.set( 0.85, 0.0 ) );
                        if( i === currentAnimationFrameIndex )
                        {
                            tile.setColour( EditorManager.LightBlue );
                        }
                        tile.setDrawOrder( 220 );

                        tile.onRelease.push( new ToggleAnimationFrame( i ) );

                        tile.touchMovementAllowed = true;

                        if( i === currentAnimationFrameIndex )
                        {
                            tile.onPress.push( function (tile)
                            {
                                tile.setDrawOrder( 221 );
                            });
                            tile.onMove.push( function (tile, touchPosition)
                            {
                                self.movingAnimationFrame( tile, touchPosition );
                            });
                            tile.onLoss.push( function (tile, touchLost)
                            {
                                var newY = tile.position[1];
                                tile.setPositionY( tile.touchPosition[1] );
                                if( !touchLost && tile.touchMoved )
                                {
                                    self.movedAnimationFrame( tile, newY );
                                }
                                tile.setDrawOrder( 220 );
                            });
                        }

                        this.addTile( tile, 0 );
                        this.tileAnimationFrames.push( tile );

                        settingTiles.add( tile );

                        // Delete
                        {
                            tileDelete = new CCTile3DButton( this );
                            tileDelete.setupTile( tileHeight );
                            tileDelete.setTileTexture( "resources/editor/editor_icon_delete.jpg" );
                            tileDelete.setColour( EditorManager.Red );
                            tileDelete.setDrawOrder( 221 );

                            tileDelete.onRelease.push( new DeleteAnimationFrame( i ) );
                            this.addTile( tileDelete, 0 );

                            tile.tileDelete = tileDelete;
                        }
                    }
                }

                var submodels = primitive.submodels;
                if( submodels )
                {
                    {
                        tile = new CCTile3DButton( this );
                        tile.setupText( "Submodels", textHeight, true, true );
                        tile.setTileSize( tileWidth, tileHeight );

                        tile.setTextColour( gColour.set( 1.0, 1.0 ), true );
                        tile.setColour( gColour.set( 0.25, 0.0 ) );
                        tile.setDrawOrder( 220 );

                        settingTiles.add( tile );
                    }

                    var ToggleSubmodel = function(submodelName)
                    {
                        return function()
                        {
                            self.editor.toggleSubmodel( submodelName );
                        };
                    };

                    var DeleteSubmodel = function(submodelName)
                    {
                        return function()
                        {
                            self.editor.deleteSubmodel( submodelName );
                        };
                    };

                    for( i=0; i<submodels.length; ++i )
                    {
                        var submodel = submodels[i];

                        tile = new CCTile3DButton( this );
                        tile.setupText( submodel.name, textHeight, true, true );
                        tile.setTileSize( optionTileWidth, tileHeight );

                        tile.setTextColour( gColour.set( 0.0, 1.0 ), true );
                        if( submodel.disabled )
                        {
                            tile.setColour( EditorManager.Red );
                        }
                        else
                        {
                            tile.setColour( gColour.set( 0.85, 0.0 ) );
                        }
                        tile.setDrawOrder( 220 );

                        tile.onRelease.push( new ToggleSubmodel( submodel.name ) );
                        this.addTile( tile, 0 );

                        settingTiles.add( tile );

                        // Delete
                        {
                            tileDelete = new CCTile3DButton( this );
                            tileDelete.setupTile( tileHeight );
                            tileDelete.setTileTexture( "resources/editor/editor_icon_delete.jpg" );
                            tileDelete.setColour( EditorManager.Red );
                            tileDelete.setDrawOrder( 221 );

                            tileDelete.onRelease.push( new DeleteSubmodel( submodel.name ) );
                            this.addTile( tileDelete, 0 );

                            tile.tileDelete = tileDelete;
                        }
                    }
                }
            }
        }
    }

    for( i=0; i<settingTiles.length; ++i )
    {
        tile = settingTiles[i];

        if( animate )
        {
            tile.setPositionX( camera.cameraHWidth + tile.collisionSize.width );
        }
        else
        {
            tile.setPositionX( camera.cameraHWidth - tile.collisionBounds[0] );
            tile.setColourAlpha( 1.0, false );
            tile.setTextColourAlpha( 1.0, false );
        }

        if( tile.tileDelete )
        {
            tileDelete = tile.tileDelete;
            tileDelete.setPositionX( tile.position[0] - tile.collisionBounds[0] - tileDelete.collisionBounds[0] );

            if( !animate )
            {
                tileDelete.setColourAlpha( 1.0, false );
            }
        }
    }

    this.showSettings( false );
};


SceneAssetEditorSettings.prototype.openImageSettings = function(filename)
{
    var self = this;
    var camera = this.camera;

    var tileWidth = camera.targetWidth;
    var tileHeight = camera.targetWidth * 0.125;
    var textHeight = tileHeight * 0.9;

    var optionTileWidth = tileWidth - tileHeight;

    var i, tile, tileDelete;

    // Setting tiles
    var settingTiles = this.settingTiles;
    for( i=0; i<settingTiles.length; ++i )
    {
        tile = settingTiles[i];
        if( tile.tileDelete )
        {
            tile.tileDelete.deleteLater();
        }
        tile.deleteLater();
    }
    settingTiles.length = 0;
    {
        {
            tile = new CCTile3DButton( this );
            tile.setupText( filename, textHeight * 0.75, true, true );
            tile.setTileSize( tileWidth, tileHeight );

            tile.setColour( gColour.set( 1.0, 0.0 ) );
            tile.setDrawOrder( 220 );

            tile.onRelease.push( function()
            {
                window.prompt( "Filename", filename );
            });
            this.addTile( tile, 0 );
            settingTiles.add( tile );
        }

        {
            tile = new CCTile3DButton( this );
            tile.setupText( "Settings", textHeight, true, true );
            tile.setTileSize( tileWidth, tileHeight );

            tile.setTextColour( gColour.set( 1.0, 1.0 ), true );
            tile.setColour( gColour.set( 0.25, 0.0 ) );
            tile.setDrawOrder( 220 );

            this.addTile( tile, 0 );

            settingTiles.add( tile );
        }

        {
            var fileExtension = filename.getExtension();

            tile = new CCTile3DButton( this );
            tile.setupText( "Format: " + fileExtension, textHeight, true, true );
            tile.setTileSize( tileWidth, tileHeight );

            tile.setColour( gColour.set( 1.0, 0.0 ) );
            tile.setDrawOrder( 220 );

            tile.onRelease.push( function()
            {
                if( fileExtension === "png" )
                {
                    self.editor.convertImage( "jpg" );
                }
                else if( self.editor.info.sourceTex )
                {
                    var sourceFilenameExtension = self.editor.info.sourceTex.getExtension();
                    if( sourceFilenameExtension === "png" )
                    {
                        self.editor.setAsset( self.editor.info.sourceTex );
                    }
                }
            });
            this.addTile( tile, 0 );
            settingTiles.add( tile );
        }

        {
            tile = new CCTile3DButton( this );
            tile.setupText( "Tiling: 1.0", textHeight, true, true );
            tile.setTileSize( tileWidth, tileHeight );

            tile.setColour( gColour.set( 1.0, 0.0 ) );
            tile.setDrawOrder( 220 );

            tile.onRelease.push( function()
            {
                var current = "1.0";
                if( self.info.tiling )
                {
                    current = self.info.tiling;
                }
                AlertsManager.InputAlert( current, function(result)
                {
                    if( result )
                    {
                        if( current !== result )
                        {
                            var newFloat = parseFloat( result );
                            self.editor.convertImage( null, newFloat );
                        }
                    }
                },
                {
                    dot:true
                });
            });
            this.addTile( tile, 0 );
            settingTiles.add( tile );
        }
    }

    for( i=0; i<settingTiles.length; ++i )
    {
        tile = settingTiles[i];
        tile.setPositionX( camera.cameraHWidth + tile.collisionBounds[0] );

        if( tile.tileDelete )
        {
            tileDelete = tile.tileDelete;
            tileDelete.setPositionX( camera.cameraHWidth + tileDelete.collisionBounds[0] );
        }
    }

    this.showSettings( false );
};


SceneAssetEditorSettings.prototype.show = function(resize)
{
    if( resize === undefined )
    {
        resize = true;
    }

    this.showSettings( resize );
};


SceneAssetEditorSettings.prototype.showSettings = function(resize)
{
    if( this.enabled )
    {
        this.requestResize();

        var camera = this.camera;
        var settingTiles = this.settingTiles;

        var i, tile;
        for( i=0; i<settingTiles.length; ++i )
        {
            tile = settingTiles[i];
            tile.setTileMovementX( ( camera.targetWidth * 0.5 ) - tile.collisionBounds[0] );
            tile.setColourAlpha( 1.0, true );
            tile.enabled = true;

            if( tile.tileDelete )
            {
                var tileDelete = tile.tileDelete;
                tileDelete.setTileMovementX( ( camera.targetWidth * 0.5 ) - tile.collisionSize.width - tileDelete.collisionBounds[0] );
                tileDelete.setColourAlpha( 1.0, true );
                tileDelete.enabled = true;
            }
        }
    }
};


SceneAssetEditorSettings.prototype.setCulling = function(noCulling)
{
    if( this.tileCulling )
    {
        if( noCulling )
        {
            this.tileCulling.setText( "No Culling" );
        }
        else
        {
            this.tileCulling.setText( "Backface Culling" );
        }
    }

    this.showSettings();
};


SceneAssetEditorSettings.prototype.close = function()
{
    var self = this;
    var camera = this.camera;

    var i, tile;

    var settingTiles = this.settingTiles;
    for( i=0; i<settingTiles.length; ++i )
    {
        tile = settingTiles[i];
        tile.setTileMovementX( ( camera.targetWidth * 0.5 ) + tile.collisionBounds[0] );
        tile.setColour( gColour.setRGBA( 1.0, 1.0, 1.0, 0.0 ), true );
        tile.enabled = false;

        if( tile.tileDelete )
        {
            var tileDelete = tile.tileDelete;
            tileDelete.setTileMovementX( ( camera.targetWidth * 0.5 ) + tileDelete.collisionBounds[0] );
            tileDelete.setColour( gColour.setRGBA( 1.0, 1.0, 1.0, 0.0 ), true );
            tileDelete.enabled = false;
        }
    }
};


SceneAssetEditorSettings.prototype.movingAnimationFrame = function(movingTile, position)
{
    var top = -CC_MAXFLOAT;
    var bottom = CC_MAXFLOAT;
    for( var i=0; i<this.tileAnimationFrames.length; ++i )
    {
        var tile = this.tileAnimationFrames[i];
        var tilePosition = tile.position;
        if( tile === movingTile )
        {
            tilePosition = tile.touchPosition;
        }
        var tileTop = tilePosition[1] + tile.collisionBounds[1];
        if( tileTop > top )
        {
            top = tileTop;
        }

        var tileBottom = tilePosition[1] - tile.collisionBounds[1];
        if( tileBottom < bottom )
        {
            bottom = tileBottom;
        }
    }

    var newY = CC.FloatClamp( position[1], bottom, top );
    movingTile.setPositionY( newY );
};


SceneAssetEditorSettings.prototype.movedAnimationFrame = function(tile, newY)
{
    var currentIndex = this.tileAnimationFrames.find( tile );
    if( currentIndex !== -1 )
    {
        var i, tileAnimationFrame;

        var newIndex = this.tileAnimationFrames.length-1;
        for( i=0; i<this.tileAnimationFrames.length; ++i )
        {
            tileAnimationFrame = this.tileAnimationFrames[i];
            if( newY > tileAnimationFrame.position[1] )
            {
                newIndex = i;
                break;
            }
        }

        if( currentIndex !== newIndex )
        {
            this.editor.moveAnimationFrame( currentIndex, newIndex );
        }

        // var startY = this.tileAnimationFrames[0].position[1];
        // this.tileAnimationFrames.insert( tile, newIndex );

        // for( i=0; i<this.tileAnimationFrames.length; ++i )
        // {
        //     tileAnimationFrame = this.tileAnimationFrames[i];

        //     if( i === 0 )
        //     {
        //         tileAnimationFrame.setPositionY( startY );
        //     }
        //     else
        //     {
        //         tileAnimationFrame.positionTileBelowY( this.tileAnimationFrames[i-1] );
        //     }
        // }
    }
};
