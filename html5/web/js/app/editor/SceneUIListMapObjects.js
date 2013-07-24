/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : SceneUIListMapObjects.js
 * Description : UI for our map selector.
 *
 * Created     : 22/11/12
 *-----------------------------------------------------------
 */

function SceneUIListMapObjects(parentScene, mapEditor)
{
    this.construct( parentScene );

    this.mapEditor = mapEditor;
}
ExtendPrototype( SceneUIListMapObjects, SceneUIList );


SceneUIListMapObjects.prototype.setup = function()
{
    var parentCameraIndex = gEngine.findCameraIndex( this.parentScene.camera );
    var camera = gEngine.newSceneCamera( this, parentCameraIndex+1 );
    camera.setupViewport( 0.0, 0.0, 0.25, 1.0 );
    camera.setCameraWidth( 640.0 * 0.25, false );

    this.SceneUIList_setup();
};

SceneUIListMapObjects.prototype.updateScene = function(delta)
{
    var updated = this.CCSceneAppUI_updateScene( delta );

    var objects = this.objectsList;
    for( var i=0; i<objects.length; ++i )
    {
        var object = objects[i];
        if( object.modelObject )
        {
            object.modelObject.rotateY( delta * 30.0 );
            object.modelObject.model.animate( delta );
        }
    }

    return updated;
};


SceneUIListMapObjects.prototype.render = function(camera, pass, alpha)
{
    this.CCSceneAppUI_render( camera, pass, alpha );
};


SceneUIListMapObjects.prototype.resizeLists = function( y )
{
    this.resizeList( this.objectsList, y );
};


SceneUIListMapObjects.prototype.showObjects = function(objects)
{
    var self = this;

    var i, j, tile, tiles, object, newObject;

    var objectsList = this.objectsList;
    for( i=0; i<objectsList.length; ++i )
    {
        object = objectsList[i];

        if( objects.length > i )
        {
            newObject = objects[i];
        }
        else
        {
            newObject = null;
        }

        if( object.object !== newObject )
        {
            objectsList.remove( object );
            for( j=0; j<object.tiles.length; ++j )
            {
                tile = object.tiles[j];
                this.tiles.remove( tile );
                tile.deleteLater();
            }
            --i;
        }
    }

    var FindObjectFunction = function(object)
    {
        return function()
        {
            self.mapEditor.findObject( object );
        };
    };

    var EditImageFunction = function(object)
    {
        return function()
        {
            self.mapEditor.sceneUI.openAssetEditor( "Select Map Image", false, true, function (tex)
            {
                if( tex )
                {
                    self.mapEditor.mapsManager.handleEditMapTexture( tex );
                }
            });

            var currentTexture = "";
            if( object.model && object.model.primitives.length > 0 )
            {
                var primitive = object.model.primitives[0];
                var textureHandle = primitive.getTextureHandle();
                if( textureHandle )
                {
                    self.mapEditor.sceneUI.sceneAssetEditor.sceneUIListImages.findAndSelect( textureHandle.filename );
                }
            }
        };
    };

    var EditModelFunction = function(object)
    {
        return function()
        {
            self.mapEditor.sceneUI.openAssetEditor( "Edit Model", true, false, function (modelInfo)
            {
                if( modelInfo )
                {
                    var modelID = modelInfo.objectID;
                    socket.emit( 'EditorObjectModel', object.getID(), modelID );
                }
                self.mapEditor.sceneUI.objectEditorOpen( objects );
            });

            self.mapEditor.sceneUI.openModelsList();
            self.mapEditor.sceneUI.findAndSelectModelID( object.modelID, function (result)
            {
                if( result )
                {
                    var modelInfo = self.mapEditor.sceneUI.getSelectedModel();
                    self.mapEditor.sceneUI.sceneAssetEditor.setModel( modelInfo );
                }
                else
                {
                    self.mapEditor.sceneUI.sceneAssetEditor.setAsset( object.obj );
                    self.mapEditor.sceneUI.sceneAssetEditor.setAsset( object.tex );
                }
                self.mapEditor.sceneUI.closeModelsList();
            });
        };
    };

    var DeleteObjectFunction = function(object)
    {
        return function()
        {
            self.mapEditor.deleteObject( object );
        };
    };

    // Use this function call to create a closure which remembers the mapID
    var LoadModelFunction = function(object, tile, tex)
    {
        return function(model3d)
        {
            if( model3d )
            {
                var modelObject = new CCObject();
                tile.addChild( modelObject );
                modelObject.setModel( model3d );
                modelObject.setTransparent();
                modelObject.setReadDepth( false );

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

                object.modelObject = modelObject;
            }
        };
    };

    var camera = this.camera;
    var tileWidth = camera.targetWidth;
    var tileHeight = camera.targetWidth * 0.125;

    var newObjects = [];
    for( i=0; i<objects.length; ++i )
    {
        newObject = objects[i];

        var text;

        // Do we already have this object loaded?
        if( objectsList.length > i )
        {
            object = objectsList[i];
            if( object.object === newObject )
            {
                text = "size:" + CC.FloatLimitPrecision( newObject.collisionSize.width );
                text += " x:" + CC.FloatLimitPrecision( newObject.position[0] );
                text += " z:" + CC.FloatLimitPrecision( newObject.position[2] );
                tile = object.tileDescription;
                tile.setText( text );
                continue;
            }
        }

        object = {};
        object.object = newObject;
        object.tiles = [];
        objectsList.add( object );
        newObjects.add( object );

        {
            tile = new CCTile3DButton( this );
            tile.setupText( newObject.getID(), tileHeight * 0.75, true, true );
            tile.setTileSize( tileWidth, tileHeight );
            tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
            tile.setColourAlpha( 0.0, false );
            tile.setColour( gColour.set( 0.25, 0.9 ) );
            tile.setTextColour( gColour.setRGBA( 1.0, 1.0, 1.0, 1.0 ) );

            tile.setDrawOrder( 205 );

            tile.onRelease.push( new FindObjectFunction( newObject ) );
            this.addTile( tile );

            object.tiles.add( tile );
        }

        if( newObject.obj )
        {
            tile = new CCTile3DButton( this );
            tile.setupTile( tileWidth, tileWidth );
            tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
            tile.setColourAlpha( 0.0, false );

            tile.setDrawOrder( 205 );

            tile.onRelease.push( new FindObjectFunction( newObject ) );
            this.addTile( tile );

            object.tiles.add( tile );

            // Load in a 3D static mesh
            CCModel3D.CacheModel( newObject.obj, true, new LoadModelFunction( object, tile, newObject.tex ) );
        }

        // Size
        {
            tile = new CCTile3DButton( this );
            object.tileDescription = tile;
            text = "size:" + CC.FloatLimitPrecision( newObject.collisionSize.width );
            text += " x:" + CC.FloatLimitPrecision( newObject.position[0] );
            text += " z:" + CC.FloatLimitPrecision( newObject.position[2] );
            tile.setupText( text, tileHeight * 0.75, true, true );
            tile.setTileSize( tileWidth, tileHeight );
            tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
            tile.setColourAlpha( 0.0, false );
            tile.setColour( gColour.set( 0.25, 0.9 ) );
            tile.setTextColour( gColour.setRGBA( 1.0, 1.0, 1.0, 1.0 ) );

            tile.setDrawOrder( 205 );

            this.addTile( tile );

            object.tiles.add( tile );
        }

        if( newObject.objectID === "ground" )
        {
            // Image
            {
                tile = new CCTile3DButton( this );
                tile.setupText( "edit image", tileHeight * 0.75, true, true );
                tile.setTileSize( tileWidth, tileHeight );
                tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
                tile.setColourAlpha( 0.0, false );
                tile.setColour( gColour.setRGBA( 0.25, 0.5, 0.75, 0.9 ), true );
                tile.setTextColour( gColour.setRGBA( 1.0, 1.0, 1.0, 1.0 ) );

                tile.setDrawOrder( 205 );

                tile.onRelease.push( new EditImageFunction( newObject ) );
                this.addTile( tile );

                object.tiles.add( tile );
            }
        }
        else
        {
            // Edit
            if( newObject.modelID )
            {
                tile = new CCTile3DButton( this );
                tile.setupText( "edit model", tileHeight * 0.75, true, true );
                tile.setTileSize( tileWidth, tileHeight );
                tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
                tile.setColourAlpha( 0.0, false );
                tile.setColour( gColour.setRGBA( 0.25, 0.5, 0.75, 0.9 ), true );
                tile.setTextColour( gColour.setRGBA( 1.0, 1.0, 1.0, 1.0 ) );

                tile.setDrawOrder( 205 );

                tile.onRelease.push( new EditModelFunction( newObject ) );
                this.addTile( tile );

                object.tiles.add( tile );
            }

            // Delete
            {
                tile = new CCTile3DButton( this );
                tile.setupText( "delete", tileHeight * 0.75, true, true );
                tile.setTileSize( tileWidth, tileHeight );
                tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
                tile.setColourAlpha( 0.0, false );
                tile.setColour( gColour.setRGBA( 0.75, 0.25, 0.25, 0.9 ) );
                tile.setTextColour( gColour.setRGBA( 1.0, 1.0, 1.0, 1.0 ) );

                tile.setDrawOrder( 205 );

                tile.onRelease.push( new DeleteObjectFunction( newObject ) );
                this.addTile( tile );

                object.tiles.add( tile );
            }
        }
    }

    // Add some noise to the animations of the menu show/hide sequences
    var duration = 1.0;
    for( i=0; i<objectsList.length; ++i )
    {
        tiles = objectsList[i].tiles;
        for( j=0; j>tiles.length; ++j )
        {
            tile = tiles[j];
            tile.movementInterpolator.setDuration( duration );
            duration += 0.125;
        }
    }

    this.requestResize();

    for( i=0; i<newObjects.length; ++i )
    {
        tiles = newObjects[i].tiles;
        for( j=0; j<tiles.length; ++j )
        {
            tile = tiles[j];
            tile.setPositionX( ( -camera.targetWidth * 0.5 ) - tile.collisionSize.width );
            tile.translateTileMovementX( tile.collisionSize.width * 1.5 );
            tile.setColourAlpha( 1.0, true );
            tile.setCollideable( true );
        }
    }
};
