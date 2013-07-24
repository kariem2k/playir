/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : SceneMapsManagerList.js
 * Description : UI for our map selector.
 *
 * Created     : 22/11/12
 *-----------------------------------------------------------
 */

function SceneMapsManagerList(parentScene)
{
    // If our parent scene is removed, remove this scene as well
    parentScene.linkScene( this );

    // Inform our parent on delete
    this.setParent( parentScene );

    this.construct();
}
ExtendPrototype( SceneMapsManagerList, SceneManagerList );

SceneMapsManagerList.ColourOpenTitle = new CCColour().setRGBA( 0.125, 0.75, 0.0, 0.9 );
SceneMapsManagerList.ColourClosedTitle = new CCColour().setRGBA( 0.75, 0.125, 0.0, 1.0 );


SceneMapsManagerList.prototype.deleteLater = function()
{
    if( window.socket )
    {
        if( this.syncingUpdates )
        {
            this.syncingUpdates = false;
            socket.emit( 'EditorMapsUnregisterListUpdates' );
        }
    }

    this.SceneManagerList_deleteLater();
};


SceneMapsManagerList.prototype.setup = function()
{
    this.SceneManagerList_setup();

    this.maps = [];

    this.addList( "Your Public Maps", SceneMapsManagerList.ColourOpenTitle );
    this.addList( "Your Private Maps", SceneMapsManagerList.ColourClosedTitle );

    // Request maps
    socket.emit( 'EditorMapsRequestList' );
    this.syncingUpdates = true;

    this.loadingFirstMaps = true;
    AlertsManager.ModalAlert( "loading..." );
};


SceneMapsManagerList.prototype.syncUpdate = function(jsonData)
{
    var publicTiles = this.tileLists[0].list;
    var privateTiles = this.tileLists[1].list;

    var map, i, tile, tileText;

    if( jsonData.EditorMaps )
    {
        if( this.loadingFirstMaps )
        {
            this.loadingFirstMaps = false;
            AlertsManager.Hide( "loading..." );
        }

        var self = this;

        var maps = jsonData.EditorMaps;

        // Maps List received
        // Use this function call to create a closure which remembers the mapID
        var EnterMapFunction = function(mapID)
        {
            return function()
            {
                self.parentScene.enterMap( mapID );
            };
        };

        var tiles = this.tiles;
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

        // Make tiles for each map
        for( i=0; i<maps.length; ++i )
        {
            map = maps[i];

            tileText = map.name;
            tileText += "\nid:" + map.mapID;
            tileText += "\n Players:";
            tileText += map.players;
            tileText += " Objects:";
            tileText += map.objects;

            tile = new CCTile3DButton( this );
            tile.setupText( tileText, 1.0, true, true );
            tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
            tile.setColourAlpha( 0.0, false );

            tile.setTextColour( gColour.set( 0.0, 1.0 ) );

            if( map.open )
            {
                tile.setColour( SceneMapsManagerList.ColourOpenTitle );
            }
            else
            {
                tile.setColour( SceneMapsManagerList.ColourClosedTitle );
            }

            tile.setDrawOrder( 205 );

            tile.onRelease.push( new EnterMapFunction( map.mapID ) );
            this.addTile( tile );

            if( map.open )
            {
                publicTiles.add( tile );
            }
            else
            {
                privateTiles.add( tile );
            }

            tile.mapID = map.mapID;
        }

        // New Map Tiles
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
                self.parentScene.newMap( true );
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
                self.parentScene.newMap( false );
            });
            this.addTile( tile );
            privateTiles.add( tile );
        }

        this.requestResize();
    }
    else if( jsonData.EditorMapsListUpdated )
    {
        map = jsonData.EditorMapsListUpdated;
        mapID = map.mapID;

        var mapTile;
        for( i=0; i<privateTiles.length; ++i )
        {
            tile = privateTiles[i];
            if( mapID === tile.mapID )
            {
                mapTile = tile;
                break;
            }
        }
        if( !mapTile )
        {
            for( i=0; i<publicTiles.length; ++i )
            {
                tile = publicTiles[i];
                if( mapID === tile.mapID )
                {
                    mapTile = tile;
                    break;
                }
            }
        }

        if( mapTile )
        {
            tileText = map.name;
            tileText += "\nid:" + map.mapID;
            tileText += "\n Players:";
            tileText += map.players;
            tileText += " Objects:";
            tileText += map.objects;

            mapTile.setText( tileText );
        }
    }
};
