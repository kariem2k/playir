/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : SceneCharacterEditor.js
 * Description : Edit characters.
 *
 * Created     : 24/05/13
 *-----------------------------------------------------------
 */

function SceneCharacterEditor(parentScene)
{
    MultiplayerManager.UpdateCallbacks.add( this );

    this.construct();

    // Inform our parent on delete
    if( parentScene )
    {
        this.setParent( parentScene );
    }

    this.cameraCentered = true;

    this.modelTiles = [];
    this.actions = [];
    this.info = {};

    gEngine.addScene( this );

    this.open();
}
ExtendPrototype( SceneCharacterEditor, CCSceneAppUI );


SceneCharacterEditor.prototype.deleteLater = function()
{
    if( this.sceneUIListModels )
    {
        this.sceneUIListModels.close();
        this.sceneUIListModels = null;
    }

    this.CCSceneAppUI_deleteLater();
};


SceneCharacterEditor.prototype.setup = function()
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

    this.menuTiles = [];
    this.bottomTiles = [];

    this.requestResize();
};


SceneCharacterEditor.prototype.syncUpdate = function(jsonData)
{
    if( jsonData.EditorCharacterCreated )
    {
        if( this.onClose )
        {
            this.info.objectID = jsonData.EditorCharacterCreated;
            this.onClose( this.info );
            this.close();
        }
    }
};


SceneCharacterEditor.prototype.updateScene = function(delta)
{
    var updated = this.CCSceneAppUI_updateScene( delta );

    if( !this.sceneUIListModels && !this.sceneAssetEditor )
    {
        var modelTiles = this.modelTiles;
        for( var i=0; i<modelTiles.length; ++i )
        {
            var tile = modelTiles[i];
            if( tile.modelObject )
            {
                tile.modelObject.rotateY( delta * 15.0 );
                tile.modelObject.model.animate( delta );
            }
        }
    }

    return updated;
};


SceneCharacterEditor.prototype.resize = function()
{
    this.CCSceneAppUI_resize();

    var camera = this.camera;
    var i, tile;

    this.updatedList();

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
        tile.setPositionX( camera.cameraHWidth - tile.collisionBounds[0] );
        y -= tile.collisionBounds[1];
        tile.setPositionY( y );
        y -= tile.collisionBounds[1];
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


SceneCharacterEditor.prototype.touchPressed = function(touch)
{
    var result = this.CCSceneAppUI_touchPressed( touch );
    return true;
};


SceneCharacterEditor.prototype.touchMoving = function(touch, touchDelta)
{
    var result = this.handleTilesTouch( touch, this.controlsMovingVertical ? CCControls.touch_movingVertical : CCControls.touch_movingHorizontal );
    if( result === CCSceneAppUI.tile_touchAction )
    {
        return true;
    }
    else
    {
        var modelTiles = this.modelTiles;
        for( var i=0; i<modelTiles.length; ++i )
        {
            var tile = modelTiles[i];
            if( tile.modelObject )
            {
                var x = touch.deltaX;
                var y = touch.deltaY;

                var camera = this.camera;
                var rotation = tile.modelObject.rotation;

                rotation[1] += x * 180.0;
                tile.modelObject.setRotationY( rotation[1] );

                rotation[0] += y * 180.0;
                tile.modelObject.setRotationX( rotation[0] );
            }
        }
        return true;
    }

    // Stop other views moving
    return true;
};


SceneCharacterEditor.prototype.touchReleased = function(touch, touchAction)
{
    var result = this.CCSceneAppUI_touchReleased( touch, touchAction );

    if( !result && this.sceneUIListModels )
    {
        this.sceneUIListModels.close();
        this.sceneUIListModels = null;
    }

    return true;
};


SceneCharacterEditor.prototype.open = function(message)
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
            tile.setupTexturedWidth( camera.cameraWidth * 0.1, "resources/editor/editor_tile_back.jpg", function()
            {
                self.showMenu();
            });
            tile.setColour( gColour.setRGBA( 1.0, 1.0, 1.0, 0.0 ) );
            tile.setDrawOrder( 220 );

            tile.onRelease.push( function()
            {
                if( self.onClose )
                {
                    self.onClose( false );
                }
                self.close();
            });
            this.addTile( tile, 0 );

            menuTiles.add( tile );
        }

        {
            tile = new CCTile3DButton( this );
            tile.setupTexturedWidth( camera.cameraWidth * 0.1, "resources/editor/editor_tile_tick.jpg", function()
            {
                self.showMenu();
            });
            tile.setColour( gColour.setRGBA( 1.0, 1.0, 1.0, 0.0 ) );
            tile.setDrawOrder( 220 );

            tile.onRelease.push( function()
            {
                self.onTick();
            });
            this.addTile( tile, 0 );

            menuTiles.add( tile );
        }
    }

    this.showMenu();
};


SceneCharacterEditor.prototype.showMenu = function()
{
    if( this.enabled )
    {
        this.requestResize();

        var camera = this.camera;
        var menuTiles = this.menuTiles;

        var i, tile;

        for( i=0; i<menuTiles.length; ++i )
        {
            tile = menuTiles[i];
            tile.setPositionX( ( camera.targetWidth * 0.5 ) + tile.collisionSize.width );
            tile.translateTileMovementX( -tile.collisionSize.width * 1.5 );
            tile.setColourAlpha( 1.0, true );
            tile.enabled = true;
        }

        this.showControls();
    }
};


SceneCharacterEditor.prototype.openControls = function()
{
    if( this.info && this.info.objectID )
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
            tile = new CCTile3DButton( this );
            tile.setupTextured( "resources/editor/editor_icon_delete.jpg", new LoadedImageFunction( tile ) );
            tile.setColour( gColour.setRGBA( 0.5, 0.0, 0.0, 0.0 ) );
            tile.setDrawOrder( 220 );

            tile.onRelease.push( function()
            {
                if( MultiplayerManager.LoggedIn )
                {
                    AlertsManager.ConfirmationAlert( "Delete character?", function(result)
                    {
                        if( result )
                        {
                            if( MultiplayerManager.LoggedIn )
                            {
                                EditorManager.EditorDeleteCharacter( self.info );
                            }
                            self.close();
                        }
                    });
                }
            });
            this.addTile( tile, 0 );
            bottomTiles.add( tile );
        }

        this.showControls();
    }
};


SceneCharacterEditor.prototype.showControls = function(resizeRequired)
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
                tile.setTileMovementY( ( -camera.targetHeight * 0.5 ) + tile.collisionBounds[1] );
            }
            tile.setColourAlpha( 1.0, true );
            tile.enabled = true;
        }
    }
};


SceneCharacterEditor.prototype.close = function()
{
    var self = this;
    var camera = this.camera;

    this.tileBackground.setColourAlpha( 0.0, true );

    var tile, i;

    {
        tile = this.tileAlert;
        tile.setTextColourAlpha( 0.0, true );
        tile.setColourAlpha( 0.0, true, function()
        {
            self.deleteLater();
        });
        tile.translateTileMovementX( -( camera.targetWidth * 0.5 ) - tile.collisionSize.width );
    }

    var modelTiles = this.modelTiles;
    for( i=0; i<modelTiles.length; ++i )
    {
        tile = modelTiles[i];
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


SceneCharacterEditor.prototype.onTick = function()
{
    var info = this.info;
    info.actions = this.actions;
    socket.emit( 'EditorCharacterCreate', info );

    if( this.onClose )
    {
        // Close callback will be fired once the server creates our model
        // SyncUpdate
    }
    else
    {
        this.close();
    }
};


SceneCharacterEditor.prototype.setCharacter = function(characterInfo)
{
    this.info = characterInfo;

    if( characterInfo.actions )
    {
        this.actions = characterInfo.actions;
    }

    this.updatedList();
    this.openControls();
};


SceneCharacterEditor.prototype.selectModel = function(index, modelInfo)
{
    if( !this.sceneUIListModels )
    {
        this.sceneUIListModels = new SceneUIListModels( this, true );
    }

    if( index !== undefined )
    {
        this.sceneUIListModels.findAndSelectID( this.actions[index].modelID );
    }
    else if( modelInfo )
    {
        this.sceneUIListModels.findAndSelectID( modelInfo.objectID );
    }
    else
    {
        this.sceneUIListModels.unselect();
    }

    var self = this;
    this.sceneUIListModels.onSelected = function (modelInfo)
    {
        self.sceneUIListModels.close();
        self.sceneAssetEditor = new SceneAssetEditor( self, true );
        if( index !== undefined )
        {
            self.sceneAssetEditor.open( "Select Action for " + self.actions[index].actionID );
        }
        else
        {
            self.sceneAssetEditor.open( "Select New Action" );
        }
        self.sceneAssetEditor.onClose = function (newModelInfo)
        {
            if( newModelInfo )
            {
                if( index !== undefined )
                {
                    self.assignModel( newModelInfo, index );
                }
                else
                {
                    self.addModel( newModelInfo );
                }
            }
            else
            {
                self.selectModel( index, modelInfo );
            }
        };
        self.sceneAssetEditor.setModel( modelInfo );
    };

    // If a new model is uploaded
    this.sceneUIListModels.onUpload = function (newModelInfo)
    {
        if( newModelInfo )
        {
            if( index !== undefined )
            {
                self.assignModel( newModelInfo, index );
            }
            else
            {
                self.addModel( newModelInfo );
            }
            self.sceneUIListModels.close();
        }
    };
};


SceneCharacterEditor.prototype.addModel = function(modelInfo)
{
    var modelID = modelInfo.objectID;
    var actionID = "action." + this.actions.length;

    var action = {};
    action.modelID = modelID;
    action.actionID = actionID;
    this.actions.add( action );

    var self = this;
    DBAssets.LoadModelID( modelID, function()
    {
        self.updatedList();
    });
};


SceneCharacterEditor.prototype.assignModel = function(modelInfo, index)
{
    var modelID = modelInfo.objectID;

    var action = this.actions[index];
    action.modelID = modelID;

    var self = this;
    DBAssets.LoadModelID( modelID, function()
    {
        self.updatedList();
    });
};


SceneCharacterEditor.prototype.updatedList = function()
{
    var self = this;
    var camera = this.camera;

    var tile, i;
    var modelTiles = this.modelTiles;

    for( i=0; i<modelTiles.length; ++i )
    {
        tile = modelTiles[i];
        this.tiles.remove( tile );

        if( tile.tileAction )
        {
            this.tiles.remove( tile.tileAction );
            tile.tileAction.deleteLater();
        }

        if( tile.tileSFX )
        {
            this.tiles.remove( tile.tileSFX );
            tile.tileSFX.deleteLater();
        }

        if( tile.tileDelete )
        {
            this.tiles.remove( tile.tileDelete );
            tile.tileDelete.deleteLater();
        }

        tile.deleteLater();
    }
    modelTiles.length = 0;

    // Use this function call to create a closure which remembers the mapID
    var LoadModelFunction = function(tile, tex)
    {
        return function(model3d)
        {
            if( model3d )
            {
                var modelObject = tile.modelObject;
                if( !tile.modelObject )
                {
                    modelObject = new CCObject();
                    tile.addChild( modelObject );
                    modelObject.setTransparent();
                    tile.modelObject = modelObject;
                    modelObject.setReadDepth( false );
                    modelObject.setWriteDepth( false );
                }
                modelObject.setModel( model3d );

                // Adjust model size
                {
                    var size = tile.collisionSize.width * 0.75;
                    var scaleFactor;

                    var modelWidth = model3d.getWidth() > model3d.getDepth() ? model3d.getWidth() : model3d.getDepth();
                    var modelHeight = model3d.getHeight();

                    if( modelWidth > modelHeight )
                    {
                        scaleFactor = size / modelWidth;
                    }
                    else
                    {
                        scaleFactor = size / modelHeight;
                    }
                    model3d.setScale( scaleFactor );
                }

                if( tex )
                {
                    model3d.setTexture( tex );
                }
            }
        };
    };

    var actions = this.actions;

    var tileArea = ( camera.targetWidth * 0.8 );
    if( actions.length === 0 )
    {
        tileArea *= 0.25;
    }
    var modelSize = tileArea / (actions.length+1);

    var ModelInfoLoaded = function (tile)
    {
        return function (modelInfo)
        {
            if( modelInfo.obj )
            {
                CCModel3D.CacheModel( modelInfo.obj, true, new LoadModelFunction( tile, modelInfo.tex ) );
            }
        };
    };

    var SelectModelFunction = function (index)
    {
        return function()
        {
            self.selectModel( index );
        };
    };

    var RenameActionFunction = function (index)
    {
        return function ()
        {
            var actions = self.actions;
            var actionID = actions[index].actionID;
            AlertsManager.InputAlert( actionID, function(result)
            {
                if( result )
                {
                    var found = false;
                    for( var i=0; i<actions.length; ++i )
                    {
                        if( result === actions[i].actionID )
                        {
                            found = true;
                            break;
                        }
                    }
                    if( !found )
                    {
                        actions[index].actionID = result;
                        self.updatedList();
                    }
                }
            });
        };
    };

    var RenameSFXFunction = function (index)
    {
        return function ()
        {
            var actions = self.actions;
            var sfxID = actions[index].sfxID;
            AlertsManager.InputAlert( sfxID ? sfxID : "", function(result)
            {
                if( result )
                {
                    actions[index].sfxID = result;
                    self.updatedList();
                }
                else
                {
                    if( actions[index].sfxID )
                    {
                        delete actions[index].sfxID;
                        self.updatedList();
                    }
                }
            });
        };
    };

    var DeleteFunction = function (index)
    {
        return function ()
        {
            if( self.sceneUIListModels )
            {
                self.sceneUIListModels.close();
                self.sceneUIListModels = null;
            }
            self.actions.removeIndex( index );
            self.updatedList();
        };
    };

    var x = -tileArea * 0.5;

    for( i=0; i<actions.length; ++i )
    {
        var action = actions[i];

        x += modelSize * 0.5;

        tile = new CCTile3DButton( this );
        tile.setupTile( modelSize );
        tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
        tile.setColourAlpha( 0.0, false );
        tile.setColourAlpha( 1.0, true );
        tile.setPositionX( x );

        tile.setDrawOrder( 205 );
        modelTiles.add( tile );

        tile.onRelease.push( new SelectModelFunction( i ) );
        this.addTile( tile, 0 );

        var modelID = action.modelID;
        DBAssets.LoadModelID( modelID, new ModelInfoLoaded( tile ) );

        var tileSize = tileArea * 0.05;

        // Action
        var actionID = action.actionID;
        {
            var tileAction = new CCTile3DButton( this );
            tileAction.setupText( actionID, tileArea * 0.025, true, true );
            tileAction.setTextColour( gColour.set( 1.0, 1.0 ) );
            tileAction.setTileSize( modelSize, tileSize );
            tileAction.setTileTexture( "resources/editor/editor_tile_background.jpg" );
            tileAction.setColour( EditorManager.LightBlue );
            tileAction.setColourAlpha( 0.0, false );
            tileAction.setColourAlpha( 1.0, true );
            tileAction.setDrawOrder( 221 );

            tileAction.positionTileAbove( tile );

            tileAction.onRelease.push( new RenameActionFunction( i ) );
            this.addTile( tileAction, 0 );

            tile.tileAction = tileAction;
        }

        // SFX
        var sfxID = action.sfxID;
        {
            var tileSFX = new CCTile3DButton( this );
            tileSFX.setupText( sfxID ? sfxID : "SFX...", tileArea * 0.025, true, true );
            tileSFX.setTextColour( gColour.set( 1.0, 1.0 ) );
            tileSFX.setTileSize( modelSize, tileSize );
            tileSFX.setTileTexture( "resources/editor/editor_tile_background.jpg" );
            tileSFX.setColour( EditorManager.LightBlue );
            tileSFX.setColourAlpha( 0.0, false );
            tileSFX.setColourAlpha( 1.0, true );
            tileSFX.setDrawOrder( 221 );

            tileSFX.positionTileBelow( tile );

            tileSFX.onRelease.push( new RenameSFXFunction( i ) );
            this.addTile( tileSFX, 0 );

            tile.tileSFX = tileSFX;
        }

        // Delete
        {
            var tileDelete = new CCTile3DButton( this );
            tileDelete.setupText( "delete", tileArea * 0.025, true, true );
            tileDelete.setTextColour( gColour.set( 1.0, 1.0 ) );
            tileDelete.setTileSize( modelSize, tileSize );
            tileDelete.setTileTexture( "resources/editor/editor_tile_background.jpg" );
            tileDelete.setColour( EditorManager.Red );
            tileDelete.setColourAlpha( 1.0, true );
            tileDelete.setDrawOrder( 221 );

            tileDelete.positionTileBelow( tile.tileSFX );

            tileDelete.onRelease.push( new DeleteFunction( i ) );
            this.addTile( tileDelete, 0 );

            tile.tileDelete = tileDelete;
        }

        x += modelSize * 0.5;
    }

    {
        x += modelSize * 0.5;

        tile = new CCTile3DButton( this );
        tile.setupText( "+", modelSize * 0.5, true, true );
        tile.setTextColour( gColour.set( 1.0, 1.0 ) );
        tile.setTileSize( modelSize );
        tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
        tile.setColour( gColour.setRGBA( 0.25, 0.75, 0.25, 0.0 ) );
        tile.setColourAlpha( 1.0, true );
        tile.setPositionX( x );

        tile.setDrawOrder( 205 );
        modelTiles.add( tile );

        tile.onRelease.push( function()
        {
            self.selectModel();
        });
        this.addTile( tile );

        x += modelSize * 0.5;
    }
};
