/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : SceneUIList.js
 * Description : UI for our object selectors.
 *
 * Created     : 24/05/13
 *-----------------------------------------------------------
 */

function SceneUIList(parentScene)
{
    this.construct( parentScene );
}
ExtendPrototype( SceneUIList, CCSceneAppUI );


SceneUIList.prototype.construct = function(parentScene)
{
    if( !this.maxColumns )
    {
        this.maxColumns = 1;
    }

    this.CCSceneAppUI_construct();
    {
        // Inform our parent on delete
        this.setParent( parentScene );
    }

    gEngine.addScene( this );
};


SceneUIList.prototype.setup = function()
{
    if( !this.camera )
    {
        var camera = gEngine.newSceneCamera( this );
        camera.setupViewport( 0.0, 0.0, 0.125, 1.0 );
        camera.setCameraWidth( 640.0 * 0.125, false );
    }

    {
        var tile = new CCTile3DButton( this );
        tile.setupTile();
        tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
        tile.setColour( gColour.set( 0.5, 0.0 ) );
        tile.setColourAlpha( 0.95, true );

        tile.setDrawOrder( 200 );

        this.cameraStickyTiles.add( tile );

        this.tileBackground = tile;
    }

    this.selectedObjectIndex = -1;
    this.objectsList = [];
    this.yourObjects = [];
    this.otherObjects = [];

    this.requestResize();
};


SceneUIList.prototype.updateScene = function(delta)
{
    var updated = this.CCSceneAppUI_updateScene( delta );

    if( this.selectedObjectIndex !== -1 )
    {
        var objects = this.objectsList;
        if( this.selectedObjectIndex < objects.length )
        {
            var object = objects[this.selectedObjectIndex];
            if( object.modelObject )
            {
                object.modelObject.rotateY( delta * 30.0 );
                object.modelObject.model.animate( delta );
            }
        }
    }

    return updated;
};


SceneUIList.prototype.resize = function()
{
    this.CCSceneAppUI_resize();

    var camera = this.camera;

    var tile;
    {
        tile = this.tileBackground;
        tile.setTileSize( camera.targetWidth, camera.targetHeight );
    }

    this.resizeLists( camera.cameraHHeight );
};


SceneUIList.prototype.resizeLists = function(y)
{
    var camera = this.camera;

    if( this.tileNew )
    {
        var tile = this.tileNew;
        y -= tile.collisionBounds[1];
        tile.setPositionXY( ( -camera.targetWidth * 0.5 ) + tile.collisionBounds[0], y );
        y -= tile.collisionBounds[1];

        y -= camera.cameraHHeight * 0.05;
    }

    y = this.resizeList( this.yourObjects, y );
    y -= camera.cameraHHeight * 0.05;
    this.resizeList( this.otherObjects, y );
};


SceneUIList.prototype.resizeList = function(list, currentY)
{
    var camera = this.camera;

    var maxColumns = this.maxColumns;
    var xIncrement = camera.targetWidth / maxColumns;
    var xStart = ( -camera.targetWidth * 0.5 ) + ( xIncrement * 0.5 );

    var i, j, object, tiles, tile;

    var columnIndex = 0;

    var x = xStart;
    var y = currentY;
    var bottomY = y;
    for( i=0; i<list.length; ++i )
    {
        currentY = y;

        object = list[i];
        tiles = object.tiles;
        for( j=0; j<tiles.length; ++j )
        {
            tile = tiles[j];

            currentY -= tile.collisionBounds[1];
            tile.setPositionXYZ( x, currentY, 0.0 );
            currentY -= tile.collisionBounds[1];
        }

        if( currentY < bottomY )
        {
            bottomY = currentY;
        }

        x += xIncrement;
        if( columnIndex === maxColumns-1 )
        {
            columnIndex = 0;
            x = xStart;

            y = bottomY;
        }
        else
        {
            columnIndex++;
        }
    }
    return bottomY;
};


SceneUIList.prototype.updateControls = function(controls)
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


SceneUIList.prototype.touchPressed = function(touch)
{
    if( this.CCSceneAppUI_touchPressed( touch ) )
    {
        return true;
    }

    // Always take over the controls
    return true;
};


SceneUIList.prototype.touchMovementAllowed = function(touch, touchDelta)
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


SceneUIList.prototype.touchMoving = function(touch, touchDelta)
{
    return this.CCSceneAppUI_touchMoving( touch, touchDelta );
};


SceneUIList.prototype.touchReleased = function(touch, touchAction)
{
    return this.CCSceneAppUI_touchReleased( touch, touchAction );
};


SceneUIList.prototype.refreshCameraView = function()
{
    this.sceneLeft = 0.0;
    this.sceneRight = 0.0;
    this.sceneTop = 0.0;
    this.sceneBottom = 0.0;

    var objectsList = this.objectsList;
    for( var i=0; i<objectsList.length; ++i )
    {
        var object = objectsList[i];
        var bottomTile = object.tiles.last();
        var bottomY = bottomTile.getTileMovementTarget()[1] - bottomTile.collisionBounds[1];
        if( bottomY < this.sceneBottom )
        {
            this.sceneBottom = bottomY;

            if( this.sceneBottom > this.sceneTop )
            {
                this.sceneBottom = this.sceneTop;
            }
        }
    }
};


SceneUIList.prototype.lockCameraView = function()
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


SceneUIList.prototype.close = function()
{
    var self = this;
    var tile;
    {
        tile = this.tileBackground;
        tile.setColourAlpha( 0.0, true, function()
        {
            self.deleteLater();
        });
    }

    var camera = this.camera;
    var objectsList = this.objectsList;
    for( var i=0; i<objectsList.length; ++i )
    {
        var tiles = objectsList[i].tiles;
        for( var j=0; j<tiles.length; ++j )
        {
            tile = tiles[j];
            tile.setTileMovementX( ( -camera.targetWidth * 0.5 ) - tile.collisionSize.width );
            tile.setColour( gColour.setRGBA( 1.0, 1.0, 1.0, 0.0 ), true );
            tile.setCollideable( false );
        }
    }
};


SceneUIList.prototype.assetUpdated = function(info)
{
    var camera = this.camera;
    var objectsList = this.objectsList;

    var object, i, objectItr;

    var infoID = info.objectID ? info.objectID : info.id;
    for( i=0; i<objectsList.length; ++i )
    {
        objectItr = objectsList[i];
        var objectItrID = objectItr.info.objectID ? objectItr.info.objectID : objectItr.info.id;
        if( objectItrID === infoID )
        {
            object = objectItr;
            break;
        }
    }

    if( object )
    {
        if( this.updateObject )
        {
            this.updateObject( object, info );
        }
    }
    else
    {
        this.createObject( info );
    }

    this.updatedList();
};


SceneUIList.prototype.deleteObject = function(id)
{
    var self = this;
    var objectsList = this.objectsList;
    var yourObjects = this.yourObjects;
    var otherObjects = this.otherObjects;

    var i, tile, j;

    for( i=0; i<objectsList.length; ++i )
    {
        var object = objectsList[i];
        if( object.info.objectID === id || object.info.id === id )
        {
            objectsList.remove( object );
            yourObjects.remove( object );
            otherObjects.remove( object );
            for( j=0; j<object.tiles.length; ++j )
            {
                tile = object.tiles[j];
                this.tiles.remove( tile );
                tile.deleteLater();
            }

            if( i === this.selectedObjectIndex )
            {
                this.selectedObjectIndex = -1;
            }
            break;
        }
    }

    this.updatedList();
};


SceneUIList.prototype.updatedList = function()
{
    var camera = this.camera;
    var objectsList = this.objectsList;
    var tiles, i, tile, j;

    // Add some noise to the animations of the menu show/hide sequences
    var duration = 1.0;
    for( i=0; i<objectsList.length; ++i )
    {
        tiles = objectsList[i].tiles;
        for( j=0; j<tiles.length; ++j )
        {
            tile = tiles[j];
            tile.movementInterpolator.setDuration( duration );
            //duration += 0.125;
        }
    }

    this.requestResize();

    this.refreshList( this.yourObjects );
    this.refreshList( this.otherObjects );

    this.highlightSelectedObject();
};


SceneUIList.prototype.refreshList = function(list)
{
    var camera = this.camera;

    var maxColumns = this.maxColumns;
    var xIncrement = camera.targetWidth / maxColumns;
    var xStart = ( -camera.targetWidth * 0.5 ) + ( xIncrement * 0.5 );

    var x = xStart;
    var columnIndex = 0;

    for( var i=0; i<list.length; ++i )
    {
        var tiles = list[i].tiles;
        for( var j=0; j<tiles.length; ++j )
        {
            var tile = tiles[j];
            tile.setPositionX( ( -camera.targetWidth * 0.5 ) - tile.collisionSize.width );
            tile.setTileMovementX( x );
            tile.setCollideable( true );
        }

        x += xIncrement;
        if( columnIndex === maxColumns-1 )
        {
            columnIndex = 0;
            x = xStart;
        }
        else
        {
            columnIndex++;
        }
    }
};


SceneUIList.prototype.show = function(list)
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

    for( i=0; i<list.length; ++i )
    {
        var info = list[i];
        this.createObject( info );
    }

    this.updatedList();
    this.highlightSelectedObject();
};


SceneUIList.prototype.highlightSelectedObject = function()
{
    var camera = this.camera;
    var selectedObjectIndex = this.selectedObjectIndex;
    var objectsList = this.objectsList;
    for( var i=0; i<objectsList.length; ++i )
    {
        var tiles = objectsList[i].tiles;
        for( var j=0; j<tiles.length; ++j )
        {
            var tile = tiles[j];
            if( i === selectedObjectIndex )
            {
                if( j === tiles.length-1 )
                {
                    camera.targetLookAt[1] = tile.position[1];
                    this.refreshCameraView();
                    this.lockCameraView();
                }

                if( j === 0 )
                {
                    tile.setColour( gColour.setRGBA( 0.4, 0.5, 0.75, 0.0 ), true );
                }
                tile.setColourAlpha( 1.0, true );
            }
            else
            {
                if( j === 0 )
                {
                    tile.setColour( gColour.set( 0.25, 0.0 ), true );
                }
                tile.setColourAlpha( 0.75, true );
            }
        }
    }
};


SceneUIList.prototype.getSelected = function()
{
    if( this.selectedObjectIndex >= 0 && this.selectedObjectIndex < this.objectsList.length )
    {
        return this.objectsList[this.selectedObjectIndex].info;
    }
    return null;
};


SceneUIList.prototype.updating = function()
{
    this.loaded = false;
};


SceneUIList.prototype.unselect = function()
{
    this.selectedObjectIndex = -1;
    this.highlightSelectedObject();
}