/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : SceneUIListAudio.js
 * Description : UI for our Audio Info selector.
 *
 * Created     : 08/06/13
 *-----------------------------------------------------------
 */

function SceneUIListAudio(parentScene, onNew)
{
    MultiplayerManager.UpdateCallbacks.add( this );
    this.maxColumns = 4;

    this.onNew = onNew;

    var self = this;
    // Files are dropped in but not yet loaded
    this.onDragDropFunction = function(files, event)
    {
        self.onDragDrop( files, event );
    };
    gEngine.controls.onDragDrop.add( this.onDragDropFunction );

    this.construct( parentScene );
}
ExtendPrototype( SceneUIListAudio, SceneUIList );


SceneUIListAudio.prototype.deleteLater = function()
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
            socket.emit( 'EditorAudioUnregisterListUpdates' );
        }
    }

    this.SceneUIList_deleteLater();
};


SceneUIListAudio.prototype.setup = function()
{
    var parentCameraIndex = gEngine.findCameraIndex( this.parentScene.camera );
    var camera = gEngine.newSceneCamera( this, parentCameraIndex+1 );
    camera.setupViewport( 0.0, 0.0, 1.0, 1.0 );
    camera.setCameraWidth( 640.0 * 1.0, false );

    this.SceneUIList_setup();

    var self = this;
    var objectsList = this.objectsList;

    if( this.onNew )
    {
        var tileWidth = camera.targetWidth * 0.2;
        var tileHeight = tileWidth * 0.5;

        var tile = new CCTile3DButton( this );
        tile.setupText( "+", tileHeight, true, true );
        tile.setTileSize( tileWidth, tileHeight );
        tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
        tile.setColourAlpha( 0.0, false );
        tile.setColour( gColour.setRGBA( 0.25, 0.75, 0.25, 0.9 ) );
        tile.setTextColour( gColour.setRGBA( 1.0, 1.0, 1.0, 1.0 ) );

        tile.setDrawOrder( 205 );

        tile.onRelease.push( function()
        {
            self.onNew();
        });
        this.addTile( tile );

        this.tileNew = tile;
    }

    // Maps List received
    socket.emit( 'EditorAudioRequestList' );
    this.syncingUpdates = true;

    this.requestResize();
};


SceneUIListAudio.prototype.syncUpdate = function(jsonData)
{
    if( jsonData.EditorAudio )
    {
        var list = jsonData.EditorAudio;
        this.show( list );
        if( !this.loaded )
        {
            this.loaded = true;
            if( this.onLoaded )
            {
                this.onLoaded();
            }
        }
    }
    else if( jsonData.EditorAudioDeleted !== undefined )
    {
        var id = jsonData.EditorAudioDeleted;
        this.deleteObject( id );
    }
    else if( jsonData.EditorAudioUpdated )
    {
        var info = jsonData.EditorAudioUpdated;
        this.assetUpdated( info );
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


SceneUIListAudio.prototype.createObject = function(info)
{
    var self = this;
    var objectsList = this.objectsList;

    var SelectObjectFunction = function(id)
    {
        return function()
        {
            var objectIndex = 0;
            for( var i=0; i<objectsList.length; ++i )
            {
                if( objectsList[i].info )
                {
                    if( objectsList[i].info.id === id )
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
                if( self.onSelected )
                {
                    self.onSelected( self.getSelected() );
                }
            }
        };
    };

    var EditFunction = function(object)
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
    object.info = info;

    var objectIndex = objectsList.length;
    objectsList.add( object );

    if( MultiplayerManager.IsOwner( info.owners ) )
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
        tile.setupText( "" + info.id, tileHeight, true, true );
        tile.setTileSize( tileWidth, tileHeight );
        tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
        tile.setColourAlpha( 0.0, false );
        tile.setColour( gColour.set( 0.25, 0.9 ) );
        tile.setTextColour( gColour.setRGBA( 1.0, 1.0, 1.0, 1.0 ) );

        tile.setDrawOrder( 205 );

        tile.onRelease.push( new SelectObjectFunction( info.id ) );
        this.addTile( tile );

        object.tiles.add( tile );
    }

    {
        tile = new CCTile3DButton( this );
        tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
        tile.setColourAlpha( 0.0, false );
        tile.setColour( gColour.set( 1.0, 0.9 ) );

        tile.setDrawOrder( 205 );

        tile.onRelease.push( new SelectObjectFunction( info.id ) );
        this.addTile( tile );

        object.tiles.add( tile );

        object.tileMP3 = tile;
    }

    this.updateObject( object, info );

    // Edit
    if( this.onEdit )
    {
        tile = new CCTile3DButton( this );
        tile.setupText( "edit", tileHeight * 0.75, true, true );
        tile.setTileSize( tileWidth, tileHeight );
        tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
        tile.setColourAlpha( 0.0, false );
        tile.setColour( gColour.setRGBA( 0.25, 0.5, 0.75, 0.9 ) );
        tile.setTextColour( gColour.setRGBA( 1.0, 1.0, 1.0, 1.0 ) );

        tile.setDrawOrder( 205 );

        tile.onRelease.push( new EditFunction( object ) );
        this.addTile( tile );

        object.tiles.add( tile );
    }
};


SceneUIListAudio.prototype.updateObject = function(object, info)
{
    var tile = object.tileMP3;

    var camera = this.camera;
    var tileWidth = camera.targetWidth / this.maxColumns;
    var tileHeight = tileWidth * 0.175;

    var friendlyName = String.SplitBefore( info.mp3, "." );
    friendlyName += ".mp3";

    tile.setupText( friendlyName, tileHeight * 0.4, true, true );
    tile.setTileSize( tileWidth, tileHeight );
};


SceneUIListAudio.prototype.findAndSelect = function(info, callback)
{
    if( info.id )
    {
        this.findAndSelectID( info.id, callback );
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


SceneUIListAudio.prototype.findAndSelectID = function(id, callback)
{
    this.selectedObjectIndex = -1;
    this.highlightSelectedObject();

    var camera = this.camera;
    var objectsList = this.objectsList;

    var i, objectItr;
    for( i=0; i<objectsList.length; ++i )
    {
        objectItr = objectsList[i];
        if( objectItr.info.id === id )
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
            self.findAndSelectID( id, callback );
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


SceneUIListAudio.prototype.onDragDrop = function(files, event)
{
    if( event && event.target )
    {
        if( MultiplayerManager.LoggedIn )
        {
            if( !this.sceneEditor )
            {
                this.sceneEditor = new SceneAudioEditor( this );
                this.sceneEditor.open( "Upload Audio" );
            }
        }
    }
};
