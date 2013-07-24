/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : SceneUIListImages.js
 * Description : UI for our image selector.
 *
 * Created     : 28/02/13
 *-----------------------------------------------------------
 */

function SceneUIListImages(parentScene, maxColumns, cameraWidth, onNew)
{
    MultiplayerManager.UpdateCallbacks.add( this );

    if( !maxColumns )
    {
        maxColumns = 2;
    }

    if( !cameraWidth )
    {
        cameraWidth = 0.2;
    }

    this.maxColumns = maxColumns;
    this.cameraWidth = cameraWidth;

    this.onNew = onNew;

    this.construct( parentScene );
}
ExtendPrototype( SceneUIListImages, SceneUIList );


SceneUIListImages.prototype.deleteLater = function()
{
    if( window.socket )
    {
        if( this.syncingUpdates )
        {
            this.syncingUpdates = false;
            socket.emit( 'EditorImagesUnregisterListUpdates' );
        }
    }

    this.SceneUIList_deleteLater();
};


SceneUIListImages.prototype.setup = function()
{
    var camera = gEngine.newSceneCamera( this );
    camera.setupViewport( 0.0, 0.0, this.cameraWidth, 1.0 );
    camera.setCameraWidth( 640.0 * this.cameraWidth, false );

    this.SceneUIList_setup();

    var self = this;
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
    socket.emit( 'EditorImagesRequestList' );
    this.syncingUpdates = true;
};


SceneUIListImages.prototype.syncUpdate = function(jsonData)
{
    if( jsonData.EditorImages )
    {
        var images = jsonData.EditorImages;
        this.show( images );
        if( !this.loaded )
        {
            this.loaded = true;
            if( this.onLoaded )
            {
                this.onLoaded();
            }
        }
    }
    else if( jsonData.EditorImageDeleted )
    {
        var objectID = jsonData.EditorImageDeleted;
        this.deleteObject( objectID );
    }
    else if( jsonData.EditorImageUpdated )
    {
        var imageInfo = jsonData.EditorImageUpdated;
        this.assetUpdated( imageInfo );
    }
};


SceneUIListImages.prototype.render = function(camera, pass, alpha)
{
    this.SceneUIList_render( camera, pass, alpha );
};


SceneUIListImages.prototype.createObject = function(imageInfo)
{
    var self = this;
    var objectsList = this.objectsList;

    var SelectObjectFunction = function(imageID)
    {
        return function()
        {
            var objectIndex = 0;
            for( var i=0; i<objectsList.length; ++i )
            {
                if( objectsList[i].info )
                {
                    if( objectsList[i].info.objectID === imageID )
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

    var camera = this.camera;
    var tileWidth = camera.targetWidth / this.maxColumns;
    var tileHeight = tileWidth * 0.125;

    var object = {};
    object.tiles = [];
    object.info = imageInfo;

    var objectIndex = objectsList.length;
    objectsList.add( object );

    if( MultiplayerManager.IsOwner( imageInfo.owners ) )
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
        tile.setupText( "" + imageInfo.objectID, tileHeight * 0.75, true, true );
        tile.setTileSize( tileWidth, tileHeight );
        tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
        tile.setColourAlpha( 0.0, false );
        tile.setColour( gColour.set( 0.25, 0.9 ) );
        tile.setTextColour( gColour.setRGBA( 1.0, 1.0, 1.0, 1.0 ) );

        tile.setDrawOrder( 205 );

        tile.onRelease.push( new SelectObjectFunction( imageInfo.objectID ) );
        this.addTile( tile );

        object.tiles.add( tile );
    }

    if( imageInfo.tex )
    {
        tile = new CCTile3DButton( this );
        tile.setupTexturedFit( tileWidth, tileWidth, false, imageInfo.tex );
        tile.setColourAlpha( 0.0, false );

        tile.setDrawOrder( 205 );

        tile.onRelease.push( new SelectObjectFunction( imageInfo.objectID ) );
        this.addTile( tile );

        object.tiles.add( tile );
    }
};


SceneUIListImages.prototype.findAndSelect = function(tex, callback)
{
    this.selectedObjectIndex = -1;
    this.highlightSelectedObject();

    var camera = this.camera;
    var objectsList = this.objectsList;

    var i, objectItr;
    for( i=0; i<objectsList.length; ++i )
    {
        objectItr = objectsList[i];
        if( objectItr.info.tex === tex )
        {
            if( this.selectedObjectIndex !== i )
            {
                this.selectedObjectIndex = i;
                this.highlightSelectedObject();

                if( this.onSelected )
                {
                    this.onSelected( this.getSelected() );
                }
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
            self.findAndSelect( tex, callback );
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
