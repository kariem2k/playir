/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : SceneManagerJoinMap.js
 * Description : Manages the loading of an online map
 *
 * Created     : 03/10/12
 *-----------------------------------------------------------
 */

function SceneManagerJoinMap(mapID, playerType, mapClassName, onBack)
{
    this.mapID = mapID;

    if( !playerType )
    {
        playerType = "iBot";
    }

    if( !mapClassName )
    {
        mapClassName = "SceneGameBattleRoyale";
    }

    this.playerType = playerType;
    this.mapClassName = mapClassName;
    this.onBack = onBack;

    this.autoConnect = true;
    this.construct();

    gEngine.addScene( this );
}
ExtendPrototype( SceneManagerJoinMap, SceneManagerPlay );


SceneManagerJoinMap.prototype.construct = function()
{
    this.SceneManagerPlay_construct();

    this.syncDisconnected();
};


SceneManagerJoinMap.prototype.syncDisconnected = function()
{
    if( !MultiplayerManager.ForceDisconnected )
    {
        var self = this;
        AlertsManager.Alert( "connecting...", function ()
        {
            if( self.onBack )
            {
                self.onBack();
            }
        });
    }
};


SceneManagerJoinMap.prototype.syncLoggedIn = function()
{
    this.SceneManagerPlay_syncLoggedIn();

    if( this.autoConnect )
    {
        this.requestJoinMap( this.mapID, this.playerType );
    }
    else
    {
        this.requestJoinMapRequired = true;
    }
};


SceneManagerJoinMap.prototype.requestJoinMap = function(mapID, playerType)
{
    this.requestJoinMapRequired = false;
    if( this.map )
    {
        this.map.deleteLater();
        this.map = null;
    }
    MultiplayerManager.RequestJoinMap( this.mapID, this.playerType );
};


SceneManagerJoinMap.prototype.createMap = function(mapID)
{
    return new window[this.mapClassName]( mapID );
};


SceneManagerJoinMap.prototype.syncUpdate = function(jsonData)
{
    if( jsonData.loadGame )
    {
        AlertsManager.Hide( "connecting..." );

        if( this.map )
        {
            this.map.setOffline();
            this.map.deleteLater();
            this.map = null;
        }

        var mapType = jsonData.type;
        var mapID = jsonData.loadGame;
        this.map = this.createMap( mapID );
        this.map.setParent( this );

        if( this.onBack )
        {
            var self = this;
            this.map.onBack = function()
            {
                self.deleteLater();
                self.onBack();
            };
        }

        this.map.syncUpdate( jsonData );
    }
    else if( jsonData.userInfo )
    {
        if( this.sceneLeaderboards )
        {
            this.sceneLeaderboards.updateLeaderboardData( SceneLeaderboards.Leaderboard_AllTime, jsonData.userInfo );
        }
    }

    this.SceneManagerPlay_syncUpdate( jsonData );
};


SceneManagerJoinMap.prototype.pauseConnection = function()
{
    this.autoConnect = false;
};


SceneManagerJoinMap.prototype.resumeConnection = function()
{
    this.autoConnect = true;
    if( this.requestJoinMapRequired )
    {
        this.requestToJoinMap( this.mapID, this.playerType );
    }
};


SceneManagerJoinMap.prototype.playerAction = function(actionID)
{
    if( this.map )
    {
        this.map.playerAction( actionID, true );
    }
};



// SceneMapsList
function SceneMapsList(parentScene)
{
    MultiplayerManager.UpdateCallbacks.addOnce( this );

    this.construct();

    this.controlsSwipeMomentum = true;

    if( parentScene )
    {
        this.setParent( parentScene );
        // If our parent scene is removed, remove this scene as well
        parentScene.linkScene( this );
    }

    {
        var camera = gEngine.newSceneCamera( this );
        camera.setupViewport( 0.0, 0.0, 1.0, 1.0 );
    }

    gEngine.addScene( this );

    if( parentScene )
    {
        var self = this;
        this.sceneUIBack = new SceneUIBack( this, function()
        {
            self.close();
        });
    }

    this.sceneMultiLauncher = new SceneMultiUILauncher( this );
    this.sceneMultiLauncher.show();

    this.open = true;
}
ExtendPrototype( SceneMapsList, CCSceneAppUI );


SceneMapsList.prototype.deleteLater = function()
{
    if( this.syncingUpdates )
    {
        MultiplayerManager.Emit( 'BSUnregisterMapsListUpdates' );
        this.syncingUpdates = false;
    }

    this.CCSceneAppUI_deleteLater();
};


SceneMapsList.prototype.setup = function()
{
    this.maps = [];
    this.mapTiles = [];

    var camera = this.camera;
    camera.setCameraWidth( 640.0, false );
    camera.useSceneCollideables( this );

    var tile;
    {
        tile = new CCTile3DButton( this );
        tile.setupTile( camera.targetWidth, camera.targetHeight );
        tile.setTileTexture( "editor_tile_background.jpg" );
        tile.setColour( gColour.set( 0.25, 0.0 ) );
        tile.setColourAlpha( 0.95, true );

        tile.setDrawOrder( 203 );

        this.cameraStickyTiles.add( tile );

        this.tileBackground = tile;
        this.tileBackground.shouldRender = false;
    }

    // Request maps
    if( MultiplayerManager.Emit( 'BSRequestMapsList' ) )
    {
        this.syncingUpdates = true;
    }

    {
        var idealAspectRatio = 1.5;//1080.0f/720.0;
        var aspectRatioAdjutment = camera.getAspectRatio() < 1.25 ? camera.getAspectRatio() / idealAspectRatio : 1.0;

        tile = new CCTile3DButton( this );
        tile.setupText( "More Maps", camera.targetHeight * 0.1 * aspectRatioAdjutment, true, false );
        tile.setTextColour( gColour.set( 0.75, 1.0 ) );
        tile.setDrawOrder( 204 );
        this.tileMapsList = tile;

        this.addTile( tile );
    }

    this.requestResize();
};


SceneMapsList.prototype.render = function(camera, pass, alpha)
{
    //this.CCSceneAppUI_render( camera, pass, alpha );
};


SceneMapsList.prototype.resize = function()
{
    this.CCSceneAppUI_resize();

    var camera = this.camera;
    var tile;

    {
        tile = this.tileBackground;
        tile.setTileSize( camera.targetWidth, camera.targetHeight );
    }

    if( this.tileMapsList )
    {
        tile = this.tileMapsList;
        var y = tile.getTileMovementTarget()[1] - tile.collisionBounds[1];
        this.listMapTiles( this.maps, y );
    }
};


SceneMapsList.prototype.listMapTiles = function(maps, y)
{
    var camera = this.camera;
    var columns = 3;
    var sideSpacing = camera.targetWidth * 0.1;
    var tileSpacing = camera.targetWidth * 0.025;
    var tileWidth = ( camera.targetWidth - ( tileSpacing * (columns-1) ) - ( sideSpacing * 2 ) ) / columns;
    var tileHeight = tileWidth * 0.5;

    var hTileWidth = tileWidth * 0.5;
    var x = -( camera.targetWidth * 0.5 ) + sideSpacing + hTileWidth;
    y -= ( tileHeight + tileSpacing ) * 0.5;

    var columnIndex = 0;
    for( i=0; i<maps.length; ++i )
    {
        var tile = maps[i].tile;
        tile.setTileSize( tileWidth, tileHeight );
        tile.setTextHeight( tileHeight * 0.25 );
        tile.setPositionXYZ( x, y, 0.0 );
        x += tileWidth + tileSpacing;

        columnIndex++;
        if( columnIndex >= columns )
        {
            columnIndex = 0;
            x = -( camera.targetWidth * 0.5 ) + sideSpacing + hTileWidth;
            y -= ( tileHeight + tileSpacing );
        }
    }
};


SceneMapsList.prototype.updateControls = function(controls)
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


SceneMapsList.prototype.touchPressed = function(touch)
{
    if( this.CCSceneAppUI_touchPressed( touch ) )
    {
        return true;
    }

    // Always take over the controls
    return true;
};


SceneMapsList.prototype.touchMovementAllowed = function(touch, touchDelta)
{
    var absDeltaX = Math.abs( touch.totalDeltaX );
    var absDeltaY = Math.abs( touch.totalDeltaY );
    if( absDeltaX > CCControls.TouchMovementThreashold.x || absDeltaY > CCControls.TouchMovementThreashold.y )
    {
        this.controlsMoving = true;
        touchDelta.x += touch.totalDeltaX;
        touchDelta.y += touch.totalDeltaY;

        // Always move vertically in this view
        this.controlsMovingVertical = true;
        return true;
    }

    return false;
};


SceneMapsList.prototype.touchMoving = function(touch, touchDelta)
{
    return this.CCSceneAppUI_touchMoving( touch, touchDelta );
};


SceneMapsList.prototype.touchReleased = function(touch, touchAction)
{
    return this.CCSceneAppUI_touchReleased( touch, touchAction );
};


SceneMapsList.prototype.refreshCameraView = function()
{
    this.sceneLeft = 0.0;
    this.sceneRight = 0.0;
    this.sceneTop = 0.0;
    this.sceneBottom = 0.0;

    var tiles = this.tiles;
    var tile = tiles.first();
    if( tile )
    {
        this.sceneTop = tile.getTileMovementTarget()[1] + tile.collisionBounds[1];

        if( this.sceneTop < this.sceneBottom )
        {
            this.sceneTop = this.sceneBottom;
        }

        this.sceneTop += tile.collisionSize.height;
        this.sceneTop -= this.camera.targetHeight * 0.5;
    }

    tile = tiles.last();
    if( tile )
    {
        this.sceneBottom = tile.getTileMovementTarget()[1] - tile.collisionBounds[1];

        if( this.sceneBottom > this.sceneTop )
        {
            this.sceneBottom = this.sceneTop;
        }
    }
};


SceneMapsList.prototype.lockCameraView = function()
{
    if( this.cameraScrolling )
    {
        return;
    }

    var camera = this.camera;
    camera.flagUpdate();
    camera.targetLookAt[0] = 0.0;

    if( camera.targetLookAt[1] > this.sceneTop )
    {
        camera.targetLookAt[1] = this.sceneTop;
    }
    else if( camera.targetLookAt[1] < this.sceneBottom )
    {
        camera.targetLookAt[1] = this.sceneBottom;
    }
};


SceneMapsList.prototype.syncUpdate = function(jsonData)
{
    var self = this;
    var maps, i, map, mapID, tileText;

    if( jsonData.mapListUpdated )
    {
        map = jsonData.mapListUpdated;
        mapID = map.mapID;

        maps = this.maps;
        for( i=0; i<maps.length; ++i )
        {
            var mapItr = maps[i];
            if( mapID === mapItr.mapID )
            {
                map.tile = mapItr.tile;
                maps[i] = map;
                break;
            }
        }

        if( map.tile )
        {
            tileText = map.name;
            tileText += "\n Players:";
            tileText += map.players;
            tileText += " Objects:";
            tileText += map.objects;

            map.tile.setText( tileText );
        }
    }
    else if( jsonData.mapsList )
    {
        // Use this function call to create a closure which remembers the mapID
        var LoadMapFunction = function(mapID)
        {
            return function()
            {
                self.close();
                new SceneManagerJoinMap( mapID, null, null, function()
                {
                    new SceneMapsList();
                });
            };
        };

        // Update our maps list
        maps = this.maps;
        while( maps.length > 0 )
        {
            map = maps[i];
            maps.remove( map );
            map.tile.deleteLater();
        }

        for( i=0; i<jsonData.mapsList.length; ++i )
        {
            maps.add( jsonData.mapsList[i] );
        }

        maps.sort( function(a,b)
        {
            if( b.players !== a.players )
            {
                return b.players - a.players;   // Biggest first
            }
            return b.objects - a.objects;       // Biggest first
        });

        // Make tiles for each map
        var tile;
        for( i=0; i<maps.length; ++i )
        {
            map = maps[i];
            mapID = map.mapID;
            var mapName = map.name;

            tileText = mapName;
            tileText += "\n Players:";
            tileText += map.players;
            tileText += " Objects:";
            tileText += map.objects;

            tile = new CCTile3DButton( this );
            tile.setupText( tileText, 1.0, true, true );
            tile.setTileTexture( "editor_tile_background.jpg" );
            tile.setColourAlpha( 0.0, false );
            tile.setColour( gColour.set( 0.85, 0.9 ), true );
            tile.setTextColour( gColour.set( 0.125, 1.0 ) );

            tile.setDrawOrder( 205 );

            tile.onRelease.push( new LoadMapFunction( mapID ) );
            this.addTile( tile );

            map.tile = tile;
        }

        this.requestResize();
        this.refreshCameraView();
    }
};


SceneMapsList.prototype.close = function()
{
    if( this.open )
    {
        this.open = false;

        if( this.sceneUIBack )
        {
            this.sceneUIBack.close();
        }

        var self = this;
        this.tileBackground.setColourAlpha( 0.0, true, function()
        {
            self.deleteLater();
        });

        var camera = this.camera;
        camera.targetLookAt[1] = camera.targetHeight;
        camera.flagUpdate();
    }
};
