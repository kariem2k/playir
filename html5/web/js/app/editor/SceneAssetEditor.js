/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : SceneAssetEditor.js
 * Description : Edit images and models.
 *
 * Created     : 30/11/12
 *-----------------------------------------------------------
 */

function SceneAssetEditor(parentScene, supportObj, showLists, noSelect)
{
    MultiplayerManager.UpdateCallbacks.add( this );

    this.construct();

    this.supportObj = supportObj;
    this.noSelect = noSelect;

    // Inform our parent on delete
    if( parentScene )
    {
        this.setParent( parentScene );

        // Also delete this scene if our parent is deleted
        parentScene.linkScene( this );
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
        if( supportObj )
        {
            this.sceneUIListModels = new SceneUIListModels( this );
            this.sceneUIListModels.onSelected = function (info)
            {
                self.setAsset( info.obj, true );
                self.setAsset( info.tex, true );
            };
        }
        else
        {
            this.sceneUIListImages = new SceneUIListImages( this );
            this.sceneUIListImages.onSelected = function (imageInfo)
            {
                if( self.onSelected )
                {
                    self.onSelected( imageInfo );
                }
                else
                {
                    self.setImage( imageInfo );
                }
            };
        }
    }

    this.info = {};
    this.sceneSettings = new SceneAssetEditorSettings( this );

    CCEngine.EnableBackButton( this );
}
ExtendPrototype( SceneAssetEditor, CCSceneAppUI );


SceneAssetEditor.prototype.deleteLater = function()
{
    if( this.onDragDropLoadFunction )
    {
        gEngine.controls.onDragDropLoad.remove( this.onDragDropLoadFunction );
        this.onDragDropLoadFunction = null;
    }

    if( this.sceneUIListModels )
    {
        this.sceneUIListModels.close();
        this.sceneUIListModels = null;
    }

    if( this.sceneUIListImages )
    {
        this.sceneUIListImages.close();
        this.sceneUIListImages = null;
    }

    if( this.sceneSettings )
    {
        this.sceneSettings.deleteLater();
        this.sceneSettings = null;
    }

    this.CCSceneAppUI_deleteLater();
};


SceneAssetEditor.prototype.setup = function()
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
        tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
        tile.setColourAlpha( 0.0, false );

        tile.setPositionY( -( camera.targetHeight * 0.5 ) - tile.collisionSize.height );
        tile.setDrawOrder( 210 );

        this.tileModel = tile;
    }

    this.menuTiles = [];
    this.bottomTiles = [];

    this.requestResize();
};


SceneAssetEditor.prototype.syncUpdate = function(jsonData)
{
    if( jsonData.EditorModelCreated )
    {
        if( this.onClose )
        {
            this.info.objectID = jsonData.EditorModelCreated;
            this.onClose( this.info );
            this.close();
        }
    }
};


SceneAssetEditor.prototype.updateScene = function(delta)
{
    var updated = this.CCSceneAppUI_updateScene( delta );

    var tile = this.tileModel;
    if( tile.modelObject )
    {
        //tile.modelObject.rotateY( delta * 15.0 );
        tile.modelObject.model.animate( delta );
    }

    return updated;
};


SceneAssetEditor.prototype.resize = function()
{
    this.CCSceneAppUI_resize();

    var camera = this.camera;
    var i, tile;

    var idealAspectRatio = 1.5;//1080.0f/720.0;
    var aspectRatioAdjutment = camera.getAspectRatio() < 1.25 ? camera.getAspectRatio() / idealAspectRatio : 1.0;

    {
        tile = this.tileModel;
        var modelSize = camera.targetHeight * 0.65 * aspectRatioAdjutment;
        tile.setTileSize( modelSize );

        if( !this.supportObj )
        {
            if( tile.getTileTextureImage() )
            {
                tile.setTileTexturedFit( tile.collisionSize.height, tile.collisionSize.height );
            }
        }
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


SceneAssetEditor.prototype.touchPressed = function(touch)
{
    var result = this.CCSceneAppUI_touchPressed( touch );
    return true;
};


SceneAssetEditor.prototype.touchMoving = function(touch, touchDelta)
{
    var result = this.handleTilesTouch( touch, this.controlsMovingVertical ? CCControls.touch_movingVertical : CCControls.touch_movingHorizontal );
    if( result === CCSceneAppUI.tile_touchAction )
    {
        return true;
    }
    else
    {
        var tile = this.tileModel;
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

            return true;
        }
    }

    // Stop other views moving
    return true;
};


SceneAssetEditor.prototype.touchReleased = function(touch, touchAction)
{
    var result = this.CCSceneAppUI_touchReleased( touch, touchAction );
    return true;
};


SceneAssetEditor.prototype.open = function(message)
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
                if( self.updateDirtyFBXModel() )
                {
                }
                else
                {
                    self.onTick();
                }
            });
            this.addTile( tile, 0 );

            this.tileTick = tile;

            menuTiles.add( tile );
        }
    }

    this.showMenu();
};


SceneAssetEditor.prototype.showMenu = function()
{
    if( this.enabled )
    {
        this.requestResize();

        var camera = this.camera;
        var menuTiles = this.menuTiles;

        var i, tile;

        if( this.info.tex || this.info.obj )
        {
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
        }

        for( i=0; i<menuTiles.length; ++i )
        {
            tile = menuTiles[i];
            if( !this.noSelect || tile !== this.tileTick || this.assetDirty )
            {
                tile.setTileMovementX( ( camera.targetWidth * 0.5 ) - tile.collisionBounds[0] );
                tile.setColourAlpha( 1.0, true );
                tile.enabled = true;
            }
            else
            {
                tile.setTileMovementX( ( camera.targetWidth * 0.5 ) + tile.collisionBounds[0] );
                tile.setColourAlpha( 0.0, true );
                tile.enabled = false;
            }
        }

        this.showControls();
    }
};


SceneAssetEditor.prototype.openControls = function()
{
    var i;

    var bottomTiles = this.bottomTiles;
    for( i=0; i<bottomTiles.length; ++i )
    {
        bottomTiles[i].deleteLater();
    }
    bottomTiles.length = 0;

    if( this.info.objectID )
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

        var tile;
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
                        if( self.supportObj )
                        {
                            AlertsManager.ConfirmationAlert( "Delete model?", function(result)
                            {
                                if( result )
                                {
                                    if( MultiplayerManager.LoggedIn )
                                    {
                                        EditorManager.EditorDeleteModel( self.info );
                                    }
                                    if( self.onClose )
                                    {
                                        self.onClose( false );
                                    }
                                    self.close();
                                }
                            });
                        }
                        else
                        {
                            AlertsManager.ConfirmationAlert( "Delete image?", function(result)
                            {
                                if( result )
                                {
                                    if( MultiplayerManager.LoggedIn )
                                    {
                                        EditorManager.EditorDeleteImage( self.info );
                                    }

                                    var tile = self.tileModel;
                                    tile.setTileTexture( "resources/textures/white.png" );
                                    delete self.info.tex;
                                    delete self.info.objectID;
                                    self.openControls();

                                    if( self.sceneSettings )
                                    {
                                        self.sceneSettings.close();
                                    }
                                }
                            });
                        }
                    }
                });
                this.addTile( tile, 0 );
                bottomTiles.add( tile );
            }
        }

        this.showControls();
    }
};


SceneAssetEditor.prototype.showControls = function(resizeRequired)
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


SceneAssetEditor.prototype.openModelSettings = function(model)
{
    if( this.sceneSettings )
    {
        this.sceneSettings.openModelSettings( model );
    }
};


SceneAssetEditor.prototype.openImageSettings = function(filename)
{
    if( this.sceneSettings )
    {
        this.sceneSettings.openImageSettings( filename );
    }
};


SceneAssetEditor.prototype.close = function()
{
    var self = this;
    var camera = this.camera;

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

    if( this.sceneSettings )
    {
        this.sceneSettings.close();
    }
};


SceneAssetEditor.prototype.setCulling = function(noCulling)
{
    this.info.noCulling = noCulling;

    var tile = this.tileModel;
    if( tile.modelObject )
    {
        tile.modelObject.setCulling( !noCulling );
    }

    this.sceneSettings.setCulling( noCulling );
};

SceneAssetEditor.prototype.setAnimationFPSCompression = function(ratio)
{
    if( ratio > 0 && ratio < 10 )
    {
        var tile = this.tileModel;
        if( tile.modelObject )
        {
            var model = tile.modelObject.model;
            if( model )
            {
                var info = this.info;
                if( info.sourceObj )
                {
                    var currentRatio = model.getAnimationFPSCompression();
                    if( ratio !== currentRatio )
                    {
                        var sourceFBX = info.sourceObj;
                        var filenameSplit = sourceFBX.split( '.' );
                        var filename = filenameSplit[0];
                        filename += '.';
                        filename += filenameSplit[filenameSplit.length-1];
                        this.convertFBX( filename, sourceFBX, ratio );
                    }
                }
            }
        }
    }
    else
    {
        AlertsManager.TimeoutAlert( "please select value between 1 - 9", 2.0 );
    }
};


SceneAssetEditor.prototype.setAnimation = function(index)
{
    var tile = this.tileModel;
    if( tile.modelObject )
    {
        var model = tile.modelObject.model;
        if( model )
        {
            if( model.getAnimation() !== index )
            {
                model.setAnimation( index );
                this.openModelSettings( model );
            }
        }
    }
};


SceneAssetEditor.prototype.deleteAnimation = function(animationName)
{
    var tile = this.tileModel;
    if( tile.modelObject )
    {
        var model = tile.modelObject.model;
        if( model )
        {
            var primitive = model.primitive;
            if( primitive )
            {
                if( primitive.deleteAnimation( animationName ) )
                {
                    AlertsManager.Notification( "editor", "deleted " + animationName, null, 2.0, EditorManager.LightRed, true );

                    this.openModelSettings( model );
                }
            }
        }
    }
};


SceneAssetEditor.prototype.toggleAnimationFrame = function(index)
{
    var tile = this.tileModel;
    if( tile.modelObject )
    {
        var model = tile.modelObject.model;
        if( model )
        {
            model.toggleAnimationFrame( index );
            this.openModelSettings( model );
        }
    }
};


SceneAssetEditor.prototype.moveAnimationFrame = function(oldIndex, newIndex)
{
    var tile = this.tileModel;
    if( tile.modelObject )
    {
        var model = tile.modelObject.model;
        if( model )
        {
            var primitive = model.primitive;
            if( primitive )
            {
                if( primitive.moveAnimationFrame( oldIndex, newIndex ) )
                {
                    AlertsManager.Notification( "editor", "moved frame " + (oldIndex+1), null, 2.0, EditorManager.LightRed, true );
                    primitive.toggleAnimationFrame( newIndex );

                    this.openModelSettings( model );
                }
            }
        }
    }
};


SceneAssetEditor.prototype.deleteAnimationFrame = function(index)
{
    var tile = this.tileModel;
    if( tile.modelObject )
    {
        var model = tile.modelObject.model;
        if( model )
        {
            var primitive = model.primitive;
            if( primitive )
            {
                if( primitive.deleteAnimationFrame( index ) )
                {
                    AlertsManager.Notification( "editor", "deleted frame " + (index+1), null, 2.0, EditorManager.LightRed, true );
                    primitive.toggleAnimationFrame( index );

                    this.openModelSettings( model );
                }
            }
        }
    }
};


SceneAssetEditor.prototype.toggleSubmodel = function(submodelName)
{
    if( this.tileModel )
    {
        if( this.tileModel.modelObject )
        {
            var model = this.tileModel.modelObject.model;
            if( model )
            {
                var primitive = model.primitive;
                if( primitive )
                {
                    primitive.toggleSubmodel( submodelName );
                    this.openModelSettings( model );
                }
            }
        }
    }
};


SceneAssetEditor.prototype.deleteSubmodel = function(submodelName)
{
    if( this.tileModel )
    {
        if( this.tileModel.modelObject )
        {
            var model = this.tileModel.modelObject.model;
            if( model )
            {
                var primitive = model.primitive;
                if( primitive )
                {
                    if( primitive.deleteSubmodel( submodelName ) )
                    {
                        this.updateDirtyFBXModel();
                    }
                }
            }
        }
    }
};


SceneAssetEditor.prototype.setModel = function(sourceInfo)
{
    this.info.objectID = sourceInfo.objectID;
    this.info.owners = sourceInfo.owners;
    this.info.obj = sourceInfo.obj;
    this.info.sourceObj = sourceInfo.sourceObj;
    this.info.tex = sourceInfo.tex;
    this.info.noCulling = sourceInfo.noCulling;

    if( this.info.obj )
    {
        this.setAsset( this.info.obj );
    }

    if( this.info.tex )
    {
        this.setAsset( this.info.tex );
    }

    if( this.info.noCulling !== undefined )
    {
        this.setCulling( this.info.noCulling );
    }

    this.openControls();
};


SceneAssetEditor.prototype.setImage = function(sourceInfo)
{
    this.info = CC.DeepCopy( sourceInfo );

    if( this.info.tex )
    {
        this.setAsset( this.info.tex, true );
    }

    this.openControls();
};


SceneAssetEditor.prototype.setAsset = function(filename, calledFromList)
{
    if( filename )
    {
        var self = this;
        var info = this.info;
        var tile = this.tileModel;

        var fileExtension = filename.getExtension();
        if( fileExtension === "png" || fileExtension === "jpg" )
        {
            if( calledFromList )
            {
                if( this.assetDirty )
                {
                    this.assetDirty = false;
                    this.showMenu();
                }
            }
            else
            {
                if( !this.assetDirty )
                {
                    this.assetDirty = true;
                    this.showMenu();
                }
            }

            info.tex = filename;

            if( tile.modelObject )
            {
                var model3d = tile.modelObject.model;
                model3d.setTexture( info.tex );
            }

            gEngine.textureManager.getTextureHandle( info.tex, function (textureHandle)
            {
                if( textureHandle && textureHandle.image )
                {
                    if( !self.supportObj )
                    {
                        self.openImageSettings( info.tex );
                    }
                    tile.setTileTexture( info.tex );
                    self.showMenu();
                }
            });

            if( !calledFromList )
            {
                if( this.sceneUIListModels )
                {
                    this.sceneUIListModels.findAndSelect( info );
                }
                else if( this.sceneUIListImages )
                {
                    this.sceneUIListImages.findAndSelect( info.tex );
                }
            }

            return true;
        }
        else if( this.supportObj )
        {
            if( ( fileExtension === "obj" || fileExtension === "fbxi" ) )
            {
                info.obj = filename;

                if( !calledFromList )
                {
                    if( info.tex && this.sceneUIListModels )
                    {
                        this.sceneUIListModels.findAndSelect( info );
                    }
                }

                AlertsManager.Alert( "updating..." );
                CCModel3D.CacheModel( info.obj, true, function (model3d)
                {
                    AlertsManager.Hide( "updating..." );
                    if( model3d )
                    {
                        if( !tile.modelObject )
                        {
                            var modelObject = new CCObject();
                            tile.addChild( modelObject );

                            modelObject.setColour( gColour.set( 1.0, 1.0 ) );
                            modelObject.setTransparent();

                            tile.modelObject = modelObject;
                            self.showMenu();
                        }
                        tile.modelObject.setModel( model3d );
                        self.openModelSettings( model3d );

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

                            if( info.tex )
                            {
                                model3d.setTexture( info.tex );
                            }
                        }
                    }
                },
                2 );
                return true;
            }
            else if( fileExtension === "fbx" )
            {
                info.sourceObj = filename;
            }
        }
    }

    return false;
};


SceneAssetEditor.prototype.onDragDropLoad = function(file, event)
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


SceneAssetEditor.prototype.prepareUpload = function(file, data)
{
    var self = this;

    var filename = file.name;
    filename = filename.toLowerCase();
    var fileExtension = filename.getExtension();

    // Hidden feature: Rename jpegs
    if( fileExtension === "jpeg" )
    {
        var newFilename = filename.stripExtension();
        newFilename += ".jpg";
        self.upload( newFilename, data, true );
    }

    // Hidden feature: If it's a bmp convert to png
    else if( fileExtension === "bmp" )
    {
        AlertsManager.ModalAlert( "converting bmp..." );
        CCTextureManager.ConvertBase64Image( data, function(newData)
        {
            AlertsManager.Hide( "converting bmp..." );
            if( newData )
            {
                var newFilename = filename.stripExtension();
                newFilename += ".jpg";
                self.upload( newFilename, newData, true );
            }
            else
            {
                AlertsManager.TimeoutAlert( "failed to convert bmp :(", 2.0 );
            }
        });
    }
    else if( fileExtension === "png" )
    {
        CCTextureManager.ValidateImageResolution( data, "image/png", 1024, function(validatedData)
        {
            self.upload( filename, validatedData, true );
        });
    }
    else if( fileExtension === "jpg" )
    {
        CCTextureManager.ValidateImageResolution( data, "image/jpeg", 1024, function(validatedData)
        {
            self.upload( filename, validatedData, true );
        });
    }
    else if( this.supportObj )
    {
        if( fileExtension === "obj" )
        {
            if( file.size > 1024 * 1024 * 2 )
            {
                AlertsManager.TimeoutAlert( "file size too large", 2.0 );
            }
            else
            {
                this.upload( filename, data );
            }
        }
        else if( fileExtension === "fbx" )
        {
            var dataBuffer = new Uint8Array( data );
            this.uploadFBX( filename, dataBuffer );
        }
        else if( fileExtension === "fbxi" )
        {
            this.uploadFBXiJSON( filename, data );
        }
        else
        {
            AlertsManager.TimeoutAlert( "only .png .jpg .obj .fbx supported", 2.0 );
        }
    }
    else
    {
        AlertsManager.TimeoutAlert( "only .png .jpg supported", 2.0 );
    }
};


SceneAssetEditor.prototype.convertImage = function(format, tiling)
{
    var filename = this.info.sourceTex ? this.info.sourceTex : this.info.tex;
    var filenameExtension = filename.getExtension();

    if( !format )
    {
        format = this.info.tex.getExtension();
    }

    if( !tiling )
    {
        tiling = 1.0;
    }

    var changedFormat = format !== filenameExtension;
    var changedTiling = tiling !== 1.0;

    if( !changedFormat && !changedTiling )
    {
        delete this.info.tiling;
        this.setAsset( filename );
    }
    else
    {
        var self = this;
        AlertsManager.ModalAlert( "converting..." );
        gEngine.textureManager.getTextureHandle( filename, function (textureHandle)
        {
            if( textureHandle.image )
            {
                CCTextureManager.ConvertImage( textureHandle.image, format, tiling, function(newData)
                {
                    AlertsManager.Hide( "converting..." );
                    if( newData )
                    {
                        self.info.tiling = tiling;
                        if( !self.info.sourceTex )
                        {
                            self.info.sourceTex = filename;
                        }
                        var newFilename = filename.stripExtension() + tiling;
                        newFilename += "." + format;
                        self.upload( newFilename, newData, true );
                    }
                    else
                    {
                        AlertsManager.TimeoutAlert( "failed to convert :(", 2.0 );
                    }
                });
            }
            else
            {
                AlertsManager.TimeoutAlert( "failed to convert :(", 2.0 );
            }
        });
    }
};


SceneAssetEditor.prototype.upload = function(filename, data, base64)
{
    var self = this;

    AlertsManager.ModalAlert( "uploading..." );
    var url = SERVER_ASSETS_URL + 'assets/upload.php';

    var postData = { "filename": filename };
    postData.file = new Blob( [data], { "type" : "text\/plain" } );
    if( base64 )
    {
        postData.base64 = true;
    }

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
            AlertsManager.Hide( "uploading..." );

            if( !uploaded )
            {
                AlertsManager.TimeoutAlert( "failed to upload :(", 2.0 );
            }
        },
        1 );
};


SceneAssetEditor.prototype.uploadFBX = function(filename, data, animationFPSCompression)
{
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

    var self = this;
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
                    var sourceFBX = responseText;
                    if( MultiplayerManager.LoggedIn )
                    {
                        uploaded = true;
                        self.convertFBX( filename, sourceFBX, animationFPSCompression );
                    }
                }
            }

            if( !uploaded )
            {
                AlertsManager.TimeoutAlert( "failed to upload fbx :(", 2.0 );
            }
        },
        1 );
};


SceneAssetEditor.prototype.convertFBX = function(filename, sourceFBX, animationFPSCompression)
{
    var self = this;

    AlertsManager.ModalAlert( "processing..." );

    var sourceURL = MultiplayerManager.GetAssetURL( sourceFBX );

    // Remove any helper redirects
    if( sourceURL.contains( 'backend/helper.php?url=' ) )
    {
        sourceURL = String.SplitAfter( sourceURL, 'backend/helper.php?url=' );
    }

    var postData = {};
    postData.url = SocketManager.httpServerURL + '/fbx2json';
    postData.sourceURL = sourceURL;

    if( animationFPSCompression )
    {
        postData.animationFPSCompression = animationFPSCompression;
    }

    var url = SERVER_ROOT + "backend/helper.php?post";

    //console.log( url, postData );

    gURLManager.requestURL(
        url,
        postData,
        function(status, responseText)
        {
            AlertsManager.Hide( "processing..." );

            var uploaded = false;
            if( status >= CCURLRequest.Succeeded )
            {
                if( responseText )
                {
                    uploaded = true;
                    self.uploadFBXiJSON( filename + 'i', responseText, sourceFBX );
                }
            }

            if( !uploaded )
            {
                AlertsManager.TimeoutAlert( "failed to process fbx :(", 2.0 );
            }
        },
        1 );
};


SceneAssetEditor.prototype.uploadFBXiJSON = function(filename, data, sourceFBX)
{
    var self = this;

    AlertsManager.ModalAlert( "uploading..." );

    // Re-compress json data
    var json = JSON.parse( data );
    data = JSON.stringify( json, function(key, val)
    {
        return val.toFixed ? Number( val.toFixed( 4 ) ) : val;
    });

    //console.log( md5( data ) );

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

                        if( sourceFBX )
                        {
                            self.setAsset( sourceFBX );
                        }
                    }
                }
            }

            if( !uploaded )
            {
                AlertsManager.TimeoutAlert( "failed to upload processed fbx :(", 2.0 );
            }
        },
        1 );
};


// If we've modified the json of a loaded FBXiModel it'll need re-uploading
SceneAssetEditor.prototype.updateDirtyFBXModel = function()
{
    var tile = this.tileModel;
    if( tile.modelObject )
    {
        var model = tile.modelObject.model;
        if( model )
        {
            var primitive = model.primitive;
            if( primitive )
            {
                if( primitive.dirty )
                {
                    var self = this;
                    AlertsManager.ModalAlert( "updating..." );
                    primitive.exportJSONString( function (jsonString)
                    {
                        AlertsManager.Hide( "updating..." );

                        var obj = self.info.obj;
                        var filenameSplit = obj.split( '.' );
                        var filename = filenameSplit[0];
                        filename += '.';
                        filename += filenameSplit[filenameSplit.length-1];

                        self.uploadFBXiJSON( filename, jsonString );

                    });
                    return true;
                }
            }
        }
    }

    return false;
};


SceneAssetEditor.prototype.handleBackButton = function()
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


SceneAssetEditor.prototype.onTick = function()
{
    if( MultiplayerManager.LoggedIn )
    {
        if( this.info.obj )
        {
            socket.emit( 'EditorModelCreate', this.info );
        }
        else if( this.info.tex )
        {
            if( this.assetDirty )
            {
                socket.emit( 'EditorImageCreate', this.info );
            }
        }

        if( this.onClose )
        {
            if( this.supportObj )
            {
                // Close callback will be fired once the server creates our model
                // SyncUpdate
            }
            else
            {
                this.onClose( this.info.tex );
                this.close();
            }
        }
        else
        {
            this.close();
        }
    }
};