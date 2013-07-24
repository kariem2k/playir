/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : SceneManagerList.js
 * Description : UI for our map selector.
 *
 * Created     : 31/05/13
 *-----------------------------------------------------------
 */

function SceneManagerList(parentScene)
{
    this.construct();

    // If our parent scene is removed, remove this scene as well
    parentScene.linkScene( this );

    // Inform our parent on delete
    this.setParent( parentScene );
}
ExtendPrototype( SceneManagerList, CCSceneAppUI );


SceneManagerList.prototype.construct = function()
{
    MultiplayerManager.UpdateCallbacks.add( this );

    this.CCSceneAppUI_construct();
    {
        var parentCameraIndex = gEngine.findCameraIndex( this.parentScene.camera );

        var camera = gEngine.newSceneCamera( this, parentCameraIndex+1 );
        camera.setupViewport( 0.0, 0.0, 1.0, 1.0 );
    }

    var self = this;
    this.sceneUIBack = new SceneUIBack( this, function()
    {
        self.parentScene.close();
    }, true );
};


SceneManagerList.prototype.deleteLater = function()
{
    if( this.sceneUIBack )
    {
        this.sceneUIBack.close();
        this.sceneUIBack = null;
    }

    this.CCSceneAppUI_deleteLater();
};


SceneManagerList.prototype.setup = function()
{
    var self = this;
    var camera = this.camera;
    camera.setCameraWidth( 100.0, false );

    var tile;
    {
        tile = new CCTile3DButton( self );
        tile.setupTile( camera.targetWidth, camera.targetHeight );
        //tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
        tile.setColour( gColour.set( 0.25, 0.0 ) );
        tile.setColourAlpha( 0.9, true );

        tile.setDrawOrder( 203 );

        this.cameraStickyTiles.add( tile );

        this.tileBackground = tile;
    }

    this.tileLists = [];
};


SceneManagerList.prototype.syncUpdate = function(jsonData)
{
};


SceneManagerList.prototype.updateCamera = function(delta)
{
    return this.CCSceneAppUI_updateCamera( delta );
};


SceneManagerList.prototype.render = function(camera, pass, alpha)
{
    this.CCSceneAppUI_render( camera, pass, alpha );
};


SceneManagerList.prototype.resize = function()
{
    this.CCSceneAppUI_resize();

    var camera = this.camera;
    var tile;

    {
        tile = this.tileBackground;
        tile.setTileSize( camera.targetWidth, camera.targetHeight );
    }

    var y;

    var tileLists = this.tileLists;
    for( var i=0; i<tileLists.length; ++i )
    {
        var tileList = tileLists[i];
        var title = tileList.title;
        var list = tileList.list;

        if( i === 0 )
        {
            tile = title;
            tile.setTextHeight( camera.targetHeight * 0.055, true );
            y = tile.getTileMovementTarget()[1] - tile.collisionBounds[1];
            this.listTiles( list, y );
        }
        else
        {
            tile = this.tileLists[i-1].list.last();
            if( !tile )
            {
                tile = title;
            }
            y = tile.getTileMovementTarget()[1] - tile.collisionBounds[1];

            tile = title;
            tile.setTextHeight( camera.targetHeight * 0.055, true );

            y -= tile.collisionBounds[1];
            y -= tile.collisionSize.height;
            tile.setPositionY( y );

            y = tile.getTileMovementTarget()[1] - tile.collisionBounds[1];
            this.listTiles( list, y );
        }
    }
};


SceneManagerList.prototype.listTiles = function(tiles, y)
{
    var camera = this.camera;
    var columns = 3;
    var sideSpacing = camera.targetWidth * 0.1;
    var tileSpacing = camera.targetWidth * 0.025;
    var tileWidth = ( camera.targetWidth - ( tileSpacing * (columns-1) ) - ( sideSpacing * 2 ) ) / columns;
    var tileHeight = tileWidth * 0.5;

    var hTileWidth = tileWidth * 0.5;
    var hTileHeight = tileHeight * 0.5;
    var x = -( camera.targetWidth * 0.5 ) + sideSpacing + hTileWidth;
    y -= ( tileHeight + tileSpacing ) * 0.5;

    var columnIndex = 0;
    for( i=0; i<tiles.length; ++i )
    {
        var tile = tiles[i];
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


SceneManagerList.prototype.updateControls = function(controls)
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


SceneManagerList.prototype.touchPressed = function(touch)
{
    if( this.CCSceneAppUI_touchPressed( touch ) )
    {
        return true;
    }

    return false;
};


SceneManagerList.prototype.touchMovementAllowed = function(touch, touchDelta)
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


SceneManagerList.prototype.touchMoving = function(touch, touchDelta)
{
    return this.CCSceneAppUI_touchMoving( touch, touchDelta );
};


SceneManagerList.prototype.touchReleased = function(touch, touchAction)
{
    return this.CCSceneAppUI_touchReleased( touch, touchAction );
};


SceneManagerList.prototype.refreshCameraView = function()
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
        this.sceneTop -= this.camera.cameraHeight * 0.5;
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


SceneManagerList.prototype.lockCameraView = function()
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


SceneManagerList.prototype.addList = function(name, colour)
{
    var tileList = {};

    var tile = new CCTile3DButton( this );
    tile.setupText( name, 1.0, true, false );
    tile.setTextColour( colour );
    tile.setDrawOrder( 204 );
    this.tilePublic = tile;

    this.addTile( tile );
    tile.setTouchDepressDepth( 0.0 );

    tileList.title = tile;
    tileList.list = [];

    this.tileLists.push( tileList );
};
