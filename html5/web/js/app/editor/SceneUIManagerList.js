/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : SceneUIManagerList.js
 * Description : UI for our map selector.
 *
 * Created     : 22/11/12
 *-----------------------------------------------------------
 */

function SceneUIManagerList(parentScene)
{
    // If our parent scene is removed, remove this scene as well
    parentScene.linkScene( this );

    // Inform our parent on delete
    this.setParent( parentScene );

    this.construct();
}
ExtendPrototype( SceneUIManagerList, SceneManagerList );


SceneUIManagerList.prototype.deleteLater = function()
{
    this.SceneManagerList_deleteLater();
};


SceneUIManagerList.prototype.setup = function()
{
    this.SceneManagerList_setup();

    this.ui = [];

    this.addList( "Your UIs", EditorManager.LightRed );
    this.addList( "Public UIs", SceneMapsManagerList.ColourOpenTitle );

    // Request
    socket.emit( 'EditorUIRequestList' );
    this.syncingUpdates = true;

    this.loading = true;
    AlertsManager.ModalAlert( "loading..." );
};


SceneUIManagerList.prototype.syncUpdate = function(jsonData)
{
    var privateTiles = this.tileLists[0].list;
    var publicTiles = this.tileLists[1].list;
    var tiles = this.tiles;

    var info, i, tile;

    if( jsonData.EditorUI )
    {
        if( this.loading )
        {
            this.loading = false;
            AlertsManager.Hide( "loading..." );
        }

        var self = this;
        var list = jsonData.EditorUI;

        // List received
        // Use this function call to create a closure which remembers the id
        var OpenUIFunction = function(info)
        {
            return function()
            {
                self.parentScene.openUI( info );
            };
        };

        {
            for( i=0; i<privateTiles.length; ++i )
            {
                tile = privateTiles[i];
                tiles.remove( tile );
                tile.deleteLater();
            }
            privateTiles.length = 0;
        }
        {
            for( i=0; i<publicTiles.length; ++i )
            {
                tile = publicTiles[i];
                tiles.remove( tile );
                tile.deleteLater();
            }
            publicTiles.length = 0;
        }

        // Make tiles for each ui
        for( i=0; i<list.length; ++i )
        {
            info = list[i];

            tile = new CCTile3DButton( this );
            tile.setupText( info.id + "\n" + info.name, 1.0, true, true );
            tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
            tile.setColourAlpha( 0.0, false );

            tile.setTextColour( gColour.set( 0.0, 1.0 ) );

            if( info.open )
            {
                tile.setColour( SceneMapsManagerList.ColourOpenTitle );
            }
            else
            {
                tile.setColour( SceneMapsManagerList.ColourClosedTitle );
            }

            tile.setDrawOrder( 205 );

            tile.onRelease.push( new OpenUIFunction( info ) );
            this.addTile( tile );

            if( info.open )
            {
                publicTiles.add( tile );
            }
            else
            {
                privateTiles.add( tile );
            }

            tile.id = info.id;
        }

        // New Tiles
        {
            tile = new CCTile3DButton( this );
            tile.setupText( "+", 1.0, true, true );
            tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
            tile.setColourAlpha( 0.0, false );

            tile.setTextColour( gColour.set( 0.125, 1.0 ) );
            tile.setColour( gColour.set( 0.5, 0.9 ) );

            tile.setDrawOrder( 205 );

            tile.onRelease.push( function()
            {
                self.parentScene.createUI( true );
            });
            this.addTile( tile );
            publicTiles.add( tile );
        }

        {
            tile = new CCTile3DButton( this );
            tile.setupText( "+", 1.0, true, true );
            tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
            tile.setColourAlpha( 0.0, false );

            tile.setTextColour( gColour.set( 0.0, 1.0 ) );
            tile.setColour( gColour.set( 0.5, 0.9 ) );

            tile.setDrawOrder( 205 );

            tile.onRelease.push( function()
            {
                self.parentScene.createUI( false );
            });
            this.addTile( tile );
            privateTiles.add( tile );
        }

        this.requestResize();
    }
    else if( jsonData.EditorUIUpdated )
    {
        info = jsonData.EditorUIUpdated;
        id = info.id;

        var uiTile;
        for( i=0; i<privateTiles.length; ++i )
        {
            tile = privateTiles[i];
            if( id === tile.id )
            {
                uiTile = tile;
                break;
            }
        }
        if( !uiTile )
        {
            for( i=0; i<publicTiles.length; ++i )
            {
                tile = publicTiles[i];
                if( id === tile.id )
                {
                    uiTile = tile;
                    break;
                }
            }
        }

        if( uiTile )
        {
            uiTile.setText( info.id + "\n" + info.name );
        }
    }
};
