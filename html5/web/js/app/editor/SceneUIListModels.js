/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : SceneUIListModels.js
 * Description : UI for our modelInfo selector.
 *
 * Created     : 06/02/13
 *-----------------------------------------------------------
 */

function SceneUIListModels(parentScene, listenForDrops)
{
    MultiplayerManager.UpdateCallbacks.add( this );

    this.maxColumns = 3;

    if( listenForDrops )
    {
        var self = this;
        // Files are dropped in but not yet loaded
        this.onDragDropFunction = function(files, event)
        {
            self.onDragDrop( files, event );
        };
        gEngine.controls.onDragDrop.add( this.onDragDropFunction );
    }

    this.construct( parentScene );
}
ExtendPrototype( SceneUIListModels, SceneUIList );


SceneUIListModels.prototype.deleteLater = function()
{
    if( this.onDragDropFunction )
    {
        gEngine.controls.onDragDrop.remove( this.onDragDropFunction );
        this.onDragDropFunction = null;
    }

    if( window.socket )
    {
        if( this.syncingUpdates )
        {
            this.syncingUpdates = false;
            socket.emit( 'EditorModelsUnregisterListUpdates' );
        }
    }

    this.SceneUIList_deleteLater();
};


SceneUIListModels.prototype.setup = function()
{
    var camera = gEngine.newSceneCamera( this );
    camera.setupViewport( 0.0, 0.0, 0.3, 1.0 );
    camera.setCameraWidth( 640.0 * 0.3, false );

    this.SceneUIList_setup();

    // Maps List received
    socket.emit( 'EditorModelsRequestList' );
    this.syncingUpdates = true;
};


SceneUIListModels.prototype.updateScene = function(delta)
{
    var updated = this.SceneUIList_updateScene( delta );
    return updated;
};


SceneUIListModels.prototype.syncUpdate = function(jsonData)
{
    if( jsonData.EditorModels )
    {
        var models = jsonData.EditorModels;
        this.show( models );
        if( !this.loaded )
        {
            this.loaded = true;
            if( this.onLoaded )
            {
                this.onLoaded();
            }
        }
    }
    else if( jsonData.EditorModelDeleted )
    {
        var objectID = jsonData.EditorModelDeleted;
        this.deleteObject( objectID );
    }
    else if( jsonData.EditorModelUpdated )
    {
        var modelInfo = jsonData.EditorModelUpdated;
        this.assetUpdated( modelInfo );
        if( !this.loaded )
        {
            this.loaded = true;
            if( this.onLoaded )
            {
                this.onLoaded();
            }
        }
    }
};


SceneUIListModels.prototype.show = function(list)
{
    var self = this;
    var camera = this.camera;

    var i, tile, tiles, j;

    var objectsList = this.objectsList;
    while( objectsList.length > 0 )
    {
        object = objectsList[0];
        objectsList.remove( object );
        for( i=0; i<object.tiles.length; ++i )
        {
            tile = object.tiles[i];
            this.tiles.remove( tile );
            tile.deleteLater();
        }
    }

    var ScoreModel = function(info)
    {
        var score = 0;

        var objectID = info.objectID;

        var dotSplit = objectID.split( '.' );
        if( dotSplit.length > 1 )
        {
            score = parseInt( dotSplit[1], 10 );
        }

        if( MultiplayerManager.IsOwner( info.owners ) )
        {
            score += 1000;
        }
        if( info.sourceObj )
        {
            score += 1000;
        }
        return score;
    };

    list.sort( function(a, b)
    {
        return ScoreModel( b ) - ScoreModel( a );
    });

    for( i=0; i<list.length; ++i )
    {
        var info = list[i];
        this.createObject( info );
    }

    this.updatedList();
    this.highlightSelectedObject();
};


SceneUIListModels.prototype.updatedList = function()
{
    var objectsList = this.objectsList;

    // Sort list
    var ScoreModel = function(info)
    {
        var score = 0;

        var objectID = info.objectID;

        var dotSplit = objectID.split( '.' );
        if( dotSplit.length > 1 )
        {
            score = parseInt( dotSplit[1], 10 );
        }

        if( MultiplayerManager.IsOwner( info.owners ) )
        {
            score += 1000;
        }
        if( info.sourceObj )
        {
            score += 1000;
        }
        return score;
    };

    this.yourObjects.sort( function(a, b)
    {
        return ScoreModel( b.info ) - ScoreModel( a.info );
    });

    this.otherObjects.sort( function(a, b)
    {
        return ScoreModel( b.info ) - ScoreModel( a.info );
    });

    this.SceneUIList_updatedList();
};


SceneUIListModels.prototype.createObject = function(modelInfo)
{
    var self = this;
    var objectsList = this.objectsList;

    var SelectObjectFunction = function(modelID)
    {
        return function()
        {
            var objectIndex = 0;
            for( var i=0; i<objectsList.length; ++i )
            {
                if( objectsList[i].info )
                {
                    if( objectsList[i].info.objectID === modelID )
                    {
                        objectIndex = i;
                        break;
                    }
                }
            }

            if( self.selectedObjectIndex !== objectIndex )
            {
                self.selectedObjectIndex = objectIndex;
                self.highlightSelectedObject();
            }

            if( self.onSelected )
            {
                self.onSelected( self.getSelected() );
            }
        };
    };

    var EditModelFunction = function(object)
    {
        return function()
        {
            self.onEdit( object.info );
        };
    };

    var camera = this.camera;
    var tileWidth = camera.targetWidth / this.maxColumns;
    var tileHeight = tileWidth * 0.2;

    var object = {};
    object.tiles = [];
    object.info = modelInfo;

    var objectIndex = objectsList.length;
    objectsList.add( object );

    if( MultiplayerManager.IsOwner( modelInfo.owners ) )
    {
        this.yourObjects.add( object );
    }
    else
    {
        this.otherObjects.add( object );
    }

    var tile;
    {
        tile = new CCTile3DButton( this );
        tile.setupText( "" + modelInfo.objectID, tileHeight, true, true );
        tile.setTileSize( tileWidth, tileHeight );
        tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
        tile.setColourAlpha( 0.0, false );
        tile.setColour( gColour.set( 0.25, 0.9 ) );
        tile.setTextColour( gColour.setRGBA( 1.0, 1.0, 1.0, 1.0 ) );

        tile.setDrawOrder( 205 );

        tile.onRelease.push( new SelectObjectFunction( modelInfo.objectID ) );
        this.addTile( tile );

        object.tiles.add( tile );
    }

    if( modelInfo.obj )
    {
        tile = new CCTile3DButton( this );
        tile.setupTile( tileWidth, tileWidth );
        tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
        tile.setColourAlpha( 0.0, false );

        tile.setDrawOrder( 205 );

        tile.onRelease.push( new SelectObjectFunction( modelInfo.objectID ) );
        this.addTile( tile );

        object.tileModel = tile;

        object.tiles.add( tile );

        this.updateObject( object, modelInfo );
    }

    // Edit
    if( this.onEdit )
    {
        tile = new CCTile3DButton( this );
        tile.setupText( "edit", tileHeight * 0.75, true, true );
        tile.setTileSize( tileWidth, tileHeight );
        tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
        tile.setColour( EditorManager.LightBlue );
        tile.setColourAlpha( 0.0, false );
        tile.setColourAlpha( 0.9, true );
        tile.setTextColour( gColour.setRGBA( 1.0, 1.0, 1.0, 1.0 ) );

        tile.setDrawOrder( 205 );

        tile.onRelease.push( new EditModelFunction( object ) );
        this.addTile( tile );

        object.tiles.add( tile );
    }
};


SceneUIListModels.prototype.updateObject = function(object, modelInfo)
{
    var self = this;
    object.info = modelInfo;

    // Use this function call to create a closure which remembers the mapID
    var LoadModelFunction = function(object, tile, tex)
    {
        return function(model3d)
        {
            if( model3d )
            {
                tile.removeText();

                var modelObject = object.modelObject;
                if( !object.modelObject )
                {
                    modelObject = new CCObject();
                    tile.addChild( modelObject );
                    modelObject.setTransparent();
                    modelObject.setReadDepth( false );
                    object.modelObject = modelObject;
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

    if( modelInfo.obj )
    {
        var tile = object.tileModel;
        tile.setText( "loading...", false, tile.collisionSize.height * 0.1 );
        tile.setTextBlinking( true );
        CCModel3D.CacheModel( modelInfo.obj, true, new LoadModelFunction( object, tile, modelInfo.tex ) );
    }
};


SceneUIListModels.prototype.findAndSelect = function(modelInfo, callback)
{
    if( modelInfo.objectID )
    {
        this.findAndSelectID( modelInfo.objectID, callback );
        return;
    }

    this.selectedObjectIndex = -1;
    this.highlightSelectedObject();

    var camera = this.camera;
    var objectsList = this.objectsList;

    var i, objectItr;
    for( i=0; i<objectsList.length; ++i )
    {
        objectItr = objectsList[i];
        if( objectItr.info.obj === modelInfo.obj )
        {
            if( objectItr.info.tex === modelInfo.tex )
            {
                if( objectItr.info.noCulling === modelInfo.noCulling )
                {
                    if( this.selectedObjectIndex !== i )
                    {
                        this.selectedObjectIndex = i;
                        this.highlightSelectedObject();
                    }

                    if( callback )
                    {
                        callback( true );
                    }
                    return;
                }
            }
        }
    }

    // Try again once we've fully loaded
    if( !this.loaded )
    {
        var self = this;
        this.onLoaded = function()
        {
            self.findAndSelect( modelInfo, callback );
        };
    }
    else
    {
        if( callback )
        {
            callback( false );
        }
    }
};


SceneUIListModels.prototype.findAndSelectID = function(modelID, callback)
{
    this.selectedObjectIndex = -1;
    this.highlightSelectedObject();

    var camera = this.camera;
    var objectsList = this.objectsList;

    var i, objectItr;
    for( i=0; i<objectsList.length; ++i )
    {
        objectItr = objectsList[i];
        if( objectItr.info.objectID === modelID )
        {
            if( this.selectedObjectIndex !== i )
            {
                this.selectedObjectIndex = i;
                this.highlightSelectedObject();
            }

            if( callback )
            {
                callback( true );
            }
            return;
        }
    }

    // Try again once we've fully loaded
    if( !this.loaded )
    {
        var self = this;
        this.onLoaded = function()
        {
            self.findAndSelectID( modelID, callback );
        };
    }
    else
    {
        if( callback )
        {
            callback( false );
        }
    }
};


SceneUIListModels.prototype.onDragDrop = function(files, event)
{
    if( event && event.target )
    {
        if( MultiplayerManager.LoggedIn )
        {
            if( !this.sceneEditor )
            {
                this.sceneEditor = new SceneAssetEditor( this, true );
                this.sceneEditor.open( "Create Model" );
            }

            if( this.onUpload )
            {
                this.sceneEditor.onClose = this.onUpload;
            }
        }
    }
};
