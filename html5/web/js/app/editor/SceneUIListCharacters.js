/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : SceneUIListCharacters.js
 * Description : UI for our Character Info selector.
 *
 * Created     : 24/05/13
 *-----------------------------------------------------------
 */

function SceneUIListCharacters(parentScene, onNew)
{
    MultiplayerManager.UpdateCallbacks.add( this );
    this.maxColumns = 4;

    this.onNew = onNew;

    this.construct( parentScene );
}
ExtendPrototype( SceneUIListCharacters, SceneUIList );


SceneUIListCharacters.prototype.deleteLater = function()
{
    if( window.socket )
    {
        if( this.syncingUpdates )
        {
            this.syncingUpdates = false;
            socket.emit( 'EditorCharactersUnregisterListUpdates' );
        }
    }

    this.SceneUIList_deleteLater();
};


SceneUIListCharacters.prototype.setup = function()
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
    socket.emit( 'EditorCharactersRequestList' );
    this.syncingUpdates = true;

    this.requestResize();
};


SceneUIListCharacters.prototype.syncUpdate = function(jsonData)
{
    if( jsonData.EditorCharacters )
    {
        var list = jsonData.EditorCharacters;
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
    else if( jsonData.EditorCharacterDeleted )
    {
        var objectID = jsonData.EditorCharacterDeleted;
        this.deleteObject( objectID );
    }
    else if( jsonData.EditorCharacterUpdated )
    {
        var info = jsonData.EditorCharacterUpdated;
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


SceneUIListCharacters.prototype.createObject = function(info)
{
    var self = this;
    var objectsList = this.objectsList;

    var SelectObjectFunction = function(objectID)
    {
        return function()
        {
            var objectIndex = 0;
            for( var i=0; i<objectsList.length; ++i )
            {
                if( objectsList[i].info )
                {
                    if( objectsList[i].info.objectID === objectID )
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
        tile.setupText( "" + info.objectID, tileHeight, true, true );
        tile.setTileSize( tileWidth, tileHeight );
        tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
        tile.setColourAlpha( 0.0, false );
        tile.setColour( gColour.set( 0.25, 0.9 ) );
        tile.setTextColour( gColour.setRGBA( 1.0, 1.0, 1.0, 1.0 ) );

        tile.setDrawOrder( 205 );

        tile.onRelease.push( new SelectObjectFunction( info.objectID ) );
        this.addTile( tile );

        object.tiles.add( tile );
    }

    {
        tile = new CCTile3DButton( this );
        tile.setupTile( tileWidth, tileWidth );
        tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
        tile.setColourAlpha( 0.0, false );

        tile.setDrawOrder( 205 );

        tile.onRelease.push( new SelectObjectFunction( info.objectID ) );
        this.addTile( tile );

        object.tileModel = tile;

        object.tiles.add( tile );

        this.updateObject( object, info );
    }

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


SceneUIListCharacters.prototype.updateObject = function(object, info)
{
    var tile = object.tileModel;
    if( tile.character )
    {
        tile.removeChild( tile.character );
        tile.character.deleteLater();
    }

    var size = tile.collisionSize.width * 0.75;
    var character = tile.character = CharacterPlayerPrefab.Spawn( info.objectID );
    character.setSize( size );
    character.forceTransparent = true;
    tile.addChild( character );
};


SceneUIListCharacters.prototype.findAndSelect = function(info, callback)
{
    if( info.objectID )
    {
        this.findAndSelectID( info.objectID, callback );
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


SceneUIListCharacters.prototype.findAndSelectID = function(objectID, callback)
{
    this.selectedObjectIndex = -1;
    this.highlightSelectedObject();

    var camera = this.camera;
    var objectsList = this.objectsList;

    var i, objectItr;
    for( i=0; i<objectsList.length; ++i )
    {
        objectItr = objectsList[i];
        if( objectItr.info.objectID === objectID )
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
            self.findAndSelectID( objectID, callback );
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
