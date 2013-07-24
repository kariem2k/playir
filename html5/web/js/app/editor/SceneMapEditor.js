/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : SceneMapEditor.js
 * Description : Bird's eye view map editor.
 *
 * Created     : 15/12/12
 *-----------------------------------------------------------
 */

function SceneMapEditor(mapID, mapsManager, mapData)
{
    this.mapsManager = mapsManager;
    this.name = mapData.name;
    this.open = mapData.open;
    this.construct( mapID, "MapEditor" );

    this.syncUpdate( mapData );
}
ExtendPrototype( SceneMapEditor, SceneGameMap );


SceneMapEditor.prototype.construct = function(mapID, mapType)
{
    var self = this;

    this.SceneGameMap_construct( mapID, mapType );
    this.camera.setPerspective( 15.0 );
    this.camera.offsetInterpolator.setDuration( 0.3 );

    // Files are dropped in but not yet loaded
    this.onDragDropFunction = function(files, event)
    {
        self.mapsManager.onDragDrop( files, event );
    };
    gEngine.controls.onDragDrop.add( this.onDragDropFunction );

    this.selectedObjects = [];
};


SceneMapEditor.prototype.destruct = function()
{
    if( this.onDragDropFunction )
    {
        gEngine.controls.onDragDrop.remove( this.onDragDropFunction );
        this.onDragDropFunction = null;
    }

    this.selectedObjectsClear();

    this.SceneGameMap_destruct();
};


SceneMapEditor.prototype.deleteLater = function()
{
    if( this.sceneUI )
    {
        this.sceneUI.hideMenu( true );
        this.sceneUI = null;
    }

    this.SceneGameMap_deleteLater();
};


SceneMapEditor.prototype.setup = function()
{
    var self = this;

    this.SceneGameMap_setup();

    var camera = this.camera;
    camera.setRotationX( -80.0 );

    {
        var tile = new CCTile3DButton( this );
        tile.setTileSize( 1.0 );
        tile.tileModel.setRotationX( 270.0 );
        tile.setTileTexture( "resources/editor/editor_icon_resize.png" );
        tile.setDrawOrder( 204 );
        tile.renderPass = CCRenderer.render_post;

        tile.onPress.push( function(tile, touch)
        {
            self.objectResizingBegin( touch );
        });

        tile.onRelease.push( function()
        {
            self.objectResizingEnd();
        });
        this.addTile( tile );

        tile.setText( "" );
        tile.textObject.setRotationX( 270.0 );
        tile.setTextColour( gColour.set( 1.0, 1.0 ) );

        this.tileObjectResize = tile;
    }

    this.sceneUI = new SceneMapEditorUI( this, this.mapsManager );
    gEngine.addScene( this.sceneUI );
    this.sceneUI.setupMenu( this.mapID, this.name, this.open );
};


SceneMapEditor.prototype.setMapSize = function(size, zoom)
{
    if( zoom === undefined )
    {
        zoom = true;
    }

    this.SceneGameMap_setMapSize( size );

    var camera = this.camera;
    var mapSizeOffset;
    if( camera.targetWidth <= camera.targetHeight )
    {
        mapSizeOffset = camera.calcCameraOffsetForWidth( this.mapSize );
        this.minZoomOffset = camera.calcCameraOffsetForWidth( 300.0 );
    }
    else
    {
        mapSizeOffset = camera.calcCameraOffsetForHeight( this.mapSize );
        this.minZoomOffset = camera.calcCameraOffsetForHeight( 300.0 );
    }
    this.maxZoomOffset = mapSizeOffset * 2.0;
    if( this.maxZoomOffset > 30000.0 )
    {
        this.maxZoomOffset = 30000.0;
    }

    if( zoom )
    {
        camera.targetOffset[2] = mapSizeOffset * 1.25;
        camera.targetOffset[2] = CC.FloatClamp( camera.targetOffset[2], this.minZoomOffset, this.maxZoomOffset );
        camera.targetWidth = camera.calcCameraWidthForOffset( camera.targetOffset[2] );
        camera.flagUpdate();
    }
};


SceneMapEditor.prototype.updateScene = function(delta)
{
    return this.SceneGameMap_updateScene( delta );
};


SceneMapEditor.prototype.updateCamera = function(delta)
{
    var updated = false;

    var camera = this.camera;
    var lookAtSpeed = this.controlsMoving && !this.cameraScrolling ? 20.0 : 1.5;
    if( this.camera.interpolateCamera( delta, lookAtSpeed ) )
    {
        // Tell the scroll bar where to go
        if( this.scrollBar )
        {
            //this.scrollBar->reposition( camera->getLookAt()[1], cameraWidth, cameraHeight );
        }

        var tile;

        var cameraStickyTiles = this.cameraStickyTiles;
        for( var i=0; i<cameraStickyTiles.length; ++i )
        {
            tile = cameraStickyTiles[i];
            tile.setPosition( this.camera.currentLookAt ) ;
        }

        {
            var cameraHeight = camera.calcCameraHeightForOffset( camera.offset[2] );
            tile = this.tileObjectResize;
            var size = cameraHeight * 0.05;
            tile.setTileSize( size, size, size );

            tile.setTextScale( 0.5 );
            var textHeight = size * 0.5;
            tile.setTextPosition( 0.0, 0.0, -( size * 0.5 + textHeight * 0.25 ) );
            this.objectResized();
        }

        updated = true;
    }
    else
    {
        if( this.cameraScrolling )
        {
            this.cameraScrolling = false;
            this.lockCameraView();
            updated = true;
        }

        if( this.resizing )
        {
            this.resizing = false;
            this.refreshCameraView();
            this.lockCameraView();
            updated = true;
        }
    }

    return updated;
};


SceneMapEditor.prototype.postRender = function(camera, pass, alpha)
{
    if( this.camera === camera )
    {
        this.SceneGameMap_postRender( camera, pass, alpha );

        if( pass === CCRenderer.render_main && alpha )
        {
            var renderer = gRenderer;

            var object;

            var selectedObjects = this.selectedObjects;
            if( selectedObjects.length > 0 )
            {
                gEngine.textureManager.setTextureIndex( 1 );
                renderer.CCDefaultTexCoords();
                renderer.CCSetColour( gColour.setRGBA( 1.0, 0.0, 0.0, 0.5 ) );
                for( var i=0; i<selectedObjects.length; ++i )
                {
                    object = selectedObjects[i];
                    CCRenderer.GLPushMatrix();
                        CCRenderer.GLTranslate( object.position );
                        CCRenderer.GLScale( [ object.collisionSize.width, 1.0, object.collisionSize.width ] );
                        renderer.CCRenderCube( true );
                    CCRenderer.GLPopMatrix();
                }
            }

            if( this.selectionBoxStart && this.selectionBoxEnd )
            {
                var selectionBoxStart = this.selectionBoxStart;
                var selectionBoxEnd = this.selectionBoxEnd;

                var size = vec3.clone( selectionBoxEnd );
                vec3.subtract( size, selectionBoxEnd, selectionBoxStart );

                var position = vec3.clone( selectionBoxStart );
                position[0] += size[0] * 0.5;
                position[1] += size[1] * 0.5;
                position[2] += size[2] * 0.5;

                gEngine.textureManager.setTextureIndex( 1 );
                renderer.CCSetColour( gColour.setRGBA( 1.0, 0.0, 0.0, 0.5 ) );
                CCRenderer.GLPushMatrix();
                    CCRenderer.GLTranslate( position );
                    CCRenderer.GLScale( [ size[0], 1.0, size[2] ] );
                    renderer.CCRenderCube( true );
                CCRenderer.GLPopMatrix();
            }
        }
    }
};


SceneMapEditor.prototype.updateControls = function(controls)
{
    var usingControls = this.SceneGameMap_updateControls( controls );

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
            var camera = this.camera;
            camera.targetOffset[2] += camera.targetOffset[2] * delta * 0.1;
            camera.targetOffset[2] = CC.FloatClamp( camera.targetOffset[2], this.minZoomOffset, this.maxZoomOffset );
            camera.targetWidth = camera.calcCameraWidthForOffset( camera.targetOffset[2] );
            camera.flagUpdate();
            return true;
        }
    }

    return usingControls;
};


SceneMapEditor.prototype.handleTwoTouches = function(touch1, touch2)
{
    // Find out the position of our touches
    var topTouch = touch1;
    var bottomTouch = touch2;
    if( touch1.y < touch2.y )
    {
        topTouch = touch2;
        bottomTouch = touch1;
    }
    var rightTouch = touch1;
    var leftTouch = touch2;
    if( touch1.x < touch2.x )
    {
        rightTouch = touch2;
        leftTouch = touch1;
    }
    var combinedDelta = topTouch.deltaY + rightTouch.deltaX + -bottomTouch.deltaY + -leftTouch.deltaX;
    return this.touchCameraZooming( combinedDelta );
};


SceneMapEditor.prototype.touchPressed = function(touch)
{
    var camera = this.camera;

    var hitLocation, projectionResults, offset, i;

    if( this.sceneUI.selectionBoxActive )
    {
        if( camera.project3D( touch.x, touch.y ) )
        {
            hitLocation = vec3.create();

            // Project touch to y = 0
            projectionResults = camera.projectionResults;
            offset = projectionResults.vNear[1] / Math.abs( projectionResults.vDirection[1] );
            vec3.scale( hitLocation, projectionResults.vDirection, offset );
            vec3.add( hitLocation, hitLocation, projectionResults.vNear );

            this.selectionBoxStart = hitLocation;
        }
    }
    else
    {
        var result = this.handleTilesTouch( touch, CCControls.touch_pressed );
        if( result === CCSceneAppUI.tile_touchAction )
        {
            return true;
        }
        else
        {
            var selectedObjects = this.selectedObjects;
            if( selectedObjects.length > 0 )
            {
                var containsPlayers = true;
                for( i=0; i<selectedObjects.length; ++i )
                {
                    if( !selectedObjects[i].playerID )
                    {
                        containsPlayers = false;
                        break;
                    }
                }

                if( !containsPlayers )
                {
                    if( camera.project3D( touch.x, touch.y ) )
                    {
                        hitLocation = vec3.create();

                        // Project touch to y = 0
                        projectionResults = camera.projectionResults;
                        offset = projectionResults.vNear[1] / Math.abs( projectionResults.vDirection[1] );
                        vec3.scale( hitLocation, projectionResults.vDirection, offset );
                        vec3.add( hitLocation, hitLocation, projectionResults.vNear );

                        // See if we're touching an object that's been selected
                        for( i=0; i<selectedObjects.length; ++i )
                        {
                            var object = selectedObjects[i];
                            CC.UpdateCollisions( object );
                            if( CC.BasicBoxCollisionCheck( object.aabbMin, object.aabbMax, hitLocation, hitLocation ) )
                            {
                                this.touchPressedStartLocation = hitLocation;
                                return true;
                            }
                        }
                    }
                }
            }
        }
    }
    return false;
};


SceneMapEditor.prototype.touchMoving = function(touch, touchDelta)
{
    var camera = this.camera;

    var hitLocation, projectionResults, offset;

    // Callback for when a touch is moving
    var allowCameraMovement = true;
    if( this.sceneUI.selectionBoxActive )
    {
        allowCameraMovement = false;

        if( camera.project3D( touch.x, touch.y ) )
        {
            hitLocation = this.selectionBoxEnd ? this.selectionBoxEnd : vec3.create();

            // Project touch to y = 0
            projectionResults = camera.projectionResults;
            offset = projectionResults.vNear[1] / Math.abs( projectionResults.vDirection[1] );
            vec3.scale( hitLocation, projectionResults.vDirection, offset );
            vec3.add( hitLocation, hitLocation, projectionResults.vNear );

            this.selectionBoxEnd = hitLocation;
        }
    }

    // If we've selected one object we're going to move it instead
    else if( this.touchPressedStartLocation )
    {
        allowCameraMovement = false;

        if( camera.project3D( touch.x, touch.y ) )
        {
            hitLocation = vec3.create();

            // Project touch to y = 0
            projectionResults = camera.projectionResults;
            offset = projectionResults.vNear[1] / Math.abs( projectionResults.vDirection[1] );
            vec3.scale( hitLocation, projectionResults.vDirection, offset );
            vec3.add( hitLocation, hitLocation, projectionResults.vNear );

            var movement = vec3.clone( hitLocation );
            vec3.subtract( movement, movement, this.touchPressedStartLocation );

            var i, object;
            if( this.touchPressedResizing )
            {
                this.objectResizingMove( hitLocation, movement );
            }

            else
            {
                this.movingObjects = true;

                var selectedObjects = this.selectedObjects;
                for( i=0; i<selectedObjects.length; ++i )
                {
                    object = selectedObjects[i];
                    if( !object.playerID && object !== this.ground )
                    {
                        object.translate( movement[0], movement[1], movement[2] );
                    }
                }

                this.objectResized();
            }

            this.touchPressedStartLocation = hitLocation;
            return true;
        }
    }
    else
    {
        // Run through all the tiles
        var result = this.handleTilesTouch( touch, this.controlsMovingVertical ? CCControls.touch_movingVertical : CCControls.touch_movingHorizontal );
        if( result === CCSceneAppUI.tile_touchAction )
        {
            return true;
        }
    }

    if( allowCameraMovement )
    {
        return this.touchCameraMoving( touchDelta.x, touchDelta.y );
    }
    return false;
};


SceneMapEditor.prototype.touchReleased = function(touch, touchAction)
{
    var usingControls = false;

    if( this.touchPressedStartLocation )
    {
        delete this.touchPressedStartLocation;
    }

    if( this.sceneUI.selectionBoxActive )
    {
        usingControls = this.handleSelectionBox( touch );
    }
    else if( this.movingObjects )
    {
        usingControls = true;

        this.mapsManager.objectsMoved();

        delete this.movingObjects;
    }
    else
    {
        // Find pressed tile
        var result = this.handleTilesTouch( touch, touchAction );
        usingControls = result === CCSceneAppUI.tile_touchAction;
        if( !usingControls && touchAction >= CCControls.touch_released )
        {
            // Shoot
            if( this.oneTouchDoubleTapped )
            {
            }

            // Panning
            else if( this.controlsMoving )
            {
                if( this.touchPressedResizing )
                {
                    this.objectResizingEnd();
                    usingControls = true;
                }
                else
                {
                    usingControls = this.touchReleaseSwipe( touch );
                }
            }
            else if( touchAction === CCControls.touch_released )
            {
                // Create an object
                if( this.sceneUI.creatingObjects )
                {
                    usingControls = this.handleCreatingObjects( touch );
                }

                // Detect an object
                if( !usingControls )
                {
                    usingControls = this.handleObjectSelection( touch );
                }
            }
        }
    }

    if( this.oneTouchDoubleTappedLastPress )
    {
        this.oneTouchDoubleTappedLastPress = false;
    }

    if( this.oneTouchDoubleTapped )
    {
        this.oneTouchDoubleTappedLastPress = true;
        this.oneTouchDoubleTapped = false;
    }

    return usingControls;
};


SceneMapEditor.prototype.touchReleaseSwipe = function(touch)
{
    return this.CCSceneAppUI_touchReleaseSwipe( touch );
};


SceneMapEditor.prototype.refreshCameraView = function()
{
    var collisionBounds = this.ground.collisionBounds;
    this.sceneLeft = -collisionBounds[0];
    this.sceneRight = collisionBounds[0];
    this.sceneTop = collisionBounds[2];
    this.sceneBottom = -collisionBounds[2];
};


SceneMapEditor.prototype.updatePathFinder = function()
{
    var pathFinderNetwork = this.pathFinderNetwork;
    var selectedObjects = this.selectedObjects;
    for( var i=0; i<selectedObjects.length; ++i )
    {
        var object = selectedObjects[i];
        if( !object.playerID && object !== this.ground )
        {
            pathFinderNetwork.removeCollideable( object );
            pathFinderNetwork.addCollideable( object, this.ground.collisionBounds );
        }
    }

    this.SceneGameMap_updatePathFinder();
};


SceneMapEditor.prototype.removeEnemyID = function(playerID)
{
    var selectedObjects = this.selectedObjects;
    for( var i=0; i<selectedObjects.length; ++i )
    {
        var object = selectedObjects[i];
        if( object.playerID === playerID )
        {
            this.selectedObjectsRemove( object );
            break;
        }
    }

    this.SceneGameMap_removeEnemyID( playerID );
};


SceneMapEditor.prototype.syncRemoveStaticObject = function(objectID)
{
    var selectedObjects = this.selectedObjects;
    for( var i=0; i<selectedObjects.length; ++i )
    {
        var object = selectedObjects[i];
        if( object.getID() === objectID )
        {
            this.selectedObjectsRemove( object );
            break;
        }
    }

    this.SceneGameMap_syncRemoveStaticObject( objectID );
};


// Safe way to add objects to our selected list
SceneMapEditor.prototype.selectedObjectsAdd = function(object)
{
    if( object )
    {
        if( object.getMovementInterpolator() )
        {
            object.getMovementInterpolator().finish();
        }

        if( this.selectedObjects.find( object ) === -1 )
        {
            this.selectedObjects.add( object );
            this.selectedObjectsUpdated();
        }
    }
};


SceneMapEditor.prototype.selectedObjectsRemove = function(object)
{
    this.selectedObjects.remove( object );
    this.selectedObjectsUpdated();
};


SceneMapEditor.prototype.selectedObjectsClear = function()
{
    this.selectedObjects.length = 0;
    this.selectedObjectsUpdated();
};


SceneMapEditor.prototype.selectedObjectsUpdated = function()
{
    if( this.sceneUI )
    {
        if( this.sceneUI.selectionBoxActive )
        {
            this.sceneUI.handleSelectionButton();
        }

        var selectedObjects = this.selectedObjects;

        // Try to find a matching model from our list
        if( this.sceneUI.creatingObjects )
        {
            if( selectedObjects && selectedObjects.length > 0 )
            {
                var object = selectedObjects[0];

                var findObject = true;
                for( var i=1; i<selectedObjects.length; ++i )
                {
                    if( object.obj !== selectedObjects[i].obj ||
                        object.tex !== selectedObjects[i].tex )
                    {
                        findObject = false;
                        break;
                    }
                }

                if( findObject )
                {
                    if( object.modelID )
                    {
                        this.sceneUI.findAndSelectModelID( object.modelID );
                    }
                }
            }
        }

        // Open our object editor
        else
        {
            if( selectedObjects && selectedObjects.length > 0 )
            {
                this.sceneUI.objectEditorOpen( selectedObjects );
            }
            else
            {
                this.sceneUI.objectEditorClose();
            }
        }
    }

    this.objectResized();
};


SceneMapEditor.prototype.handleSelectionBox = function(touch)
{
    var camera = this.camera;
    if( this.selectionBoxStart && camera.project3D( touch.x, touch.y ) )
    {
        var hitLocation = vec3.create();

        // Project touch to y = 0
        var projectionResults = camera.projectionResults;
        var offset = projectionResults.vNear[1] / Math.abs( projectionResults.vDirection[1] );
        vec3.scale( hitLocation, projectionResults.vDirection, offset );
        vec3.add( hitLocation, hitLocation, projectionResults.vNear );

        var selectionBoxMin = this.selectionBoxStart;
        var selectionBoxMax = hitLocation;
        CC.CalculateMinMaxVectors( selectionBoxMin, selectionBoxMax );

        var selectedObjects = this.selectedObjects;
        selectedObjects.length = 0;

        var objects = this.players;
        var i, object;
        for( i=0; i<objects.length; ++i )
        {
            object = objects[i];
            CC.UpdateCollisions( object );
            if( CC.BasicBoxCollisionCheck( object.aabbMin, object.aabbMax, selectionBoxMin, selectionBoxMax ) )
            {
                selectedObjects.add( object );
            }
        }

        objects = this.staticObjects;
        for( i=0; i<objects.length; ++i )
        {
            object = objects[i];
            CC.UpdateCollisions( object );
            if( CC.BasicBoxCollisionCheck( object.aabbMin, object.aabbMax, selectionBoxMin, selectionBoxMax ) )
            {
                selectedObjects.add( object );
            }
        }

        this.selectedObjectsUpdated();


        delete this.selectionBoxStart;
        if( this.selectionBoxEnd )
        {
            delete this.selectionBoxEnd;
        }
    }
    return true;
};


SceneMapEditor.prototype.handleObjectSelection = function(touch)
{
    if( this.sceneUI.creatingObjects )
    {
        this.sceneUI.handleCreateButton();
    }

    var camera = this.camera;
    var hitObject = null;
    var hitLocation = vec3.create();

    // Test if we're aiming at an object
    if( camera.project3D( touch.x, touch.y ) )
    {
        var projectionResults = camera.projectionResults;
        var collideables = this.collideables;

        // Scan to see if we're blocked by a collision
        hitObject = CC.BasicLineCollisionCheck( collideables,
                                                projectionResults.vNear,
                                                projectionResults.vFar,
                                                hitLocation,
                                                true,
                                                CC.collision_box,
                                                null,
                                                false, true );

        // See if there's an object nearby
        if( !hitObject )
        {
            // Project touch to y = 0
            var offset = projectionResults.vNear[1] / Math.abs( projectionResults.vDirection[1] );
            vec3.scale( hitLocation, projectionResults.vDirection, offset );
            vec3.add( hitLocation, hitLocation, projectionResults.vNear );

            var hScanArea = camera.targetWidth * 0.01;
            var min = vec3.clone( hitLocation );
            min[0] -= hScanArea;
            min[2] -= hScanArea;

            var max = vec3.clone( hitLocation );
            max[0] += hScanArea;
            max[2] += hScanArea;

            hitObject = CC.CollideableScan( min, max, null, CC.collision_box, true );
        }
    }

    // Report back to our mapsManager
    this.mapsManager.objectSelected( hitObject, hitLocation );

    return !!hitObject;
};


SceneMapEditor.prototype.handleCreatingObjects = function(touch)
{
    var camera = this.camera;
    var hitObject = null;
    var hitLocation = vec3.create();

    // Test if we're aiming at an object
    if( camera.project3D( touch.x, touch.y ) )
    {
        var projectionResults = camera.projectionResults;
        var collideables = this.collideables;

        // Scan to see if we're blocked by a collision
        hitObject = CC.BasicLineCollisionCheck( collideables,
                                                projectionResults.vNear,
                                                projectionResults.vFar,
                                                hitLocation,
                                                true,
                                                CC.collision_box,
                                                this.ground,
                                                false );

        // See if there's an object nearby
        if( !hitObject )
        {
            // Project touch to y = 0
            var offset = projectionResults.vNear[1] / Math.abs( projectionResults.vDirection[1] );
            vec3.scale( hitLocation, projectionResults.vDirection, offset );
            vec3.add( hitLocation, hitLocation, projectionResults.vNear );

            // Report back to our mapsManager that we should create an object
            this.selectedObjectsClear();
            this.mapsManager.createObject( hitLocation );
        }
    }

    return !hitObject;
};


SceneMapEditor.prototype.findObject = function(object)
{
    var camera = this.camera;
    camera.targetOffset[2] = camera.calcCameraOffsetForWidth( object.collisionSize.width * 4.0 );
    camera.targetOffset[2] = CC.FloatClamp( camera.targetOffset[2], this.minZoomOffset, this.maxZoomOffset );
    camera.targetLookAt[0] = object.position[0];
    camera.targetLookAt[2] = object.position[2];
    camera.flagUpdate();
};


SceneMapEditor.prototype.deleteObject = function(object)
{
    this.mapsManager.deleteObject( object );
};


SceneMapEditor.prototype.objectResizingBegin = function(touch)
{
    var camera = this.camera;
    if( camera.project3D( touch.x, touch.y ) )
    {
        var hitLocation = vec3.create();

        // Project touch to y = 0
        var projectionResults = camera.projectionResults;
        var offset = projectionResults.vNear[1] / Math.abs( projectionResults.vDirection[1] );
        vec3.scale( hitLocation, projectionResults.vDirection, offset );
        vec3.add( hitLocation, hitLocation, projectionResults.vNear );

        this.touchPressedStartLocation = hitLocation;
        this.touchPressedResizing = true;
    }
};


SceneMapEditor.prototype.objectResizingMove = function(hitLocation, movement)
{
    this.tileObjectResize.setPositionXZ( hitLocation[0], hitLocation[2] );

    var selectedObjects = this.selectedObjects;

    var size;
    for( i=0; i<selectedObjects.length; ++i )
    {
        object = selectedObjects[i];
        if( object === this.ground )
        {
            size = ( object.collisionBounds[0] * 2.0 ) + ( movement[0] * 2.0 );

            if( size < 200 )
            {
                size = 200;
            }

            if( size > 5000 )
            {
                size = 5000;
            }

            this.setMapSize( size, false );
        }
        else if( !object.playerID )
        {
            size = ( object.collisionBounds[0] * 2.0 ) + ( movement[0] * 2.0 );
            if( size < 10.0 )
            {
                size = 10.0;
            }
            if( size > this.mapSize * 0.5 )
            {
                size = this.mapSize * 0.5;
            }

            object.resize( size );
        }
    }

    this.objectResized();
};


SceneMapEditor.prototype.objectResized = function()
{
    var tile = this.tileObjectResize;
    tile.setPositionXY( this.camera.targetWidth, this.camera.targetHeight );

    var selectedObjects = this.selectedObjects;
    for( var i=0; i<selectedObjects.length; ++i )
    {
        var object = selectedObjects[i];
        if( !object.playerID )
        {
            tile.setPositionXZ( object.aabbMax[0], object.aabbMin[2] );
            tile.translate( tile.collisionBounds[0], 0.0, -tile.collisionBounds[2] );

            tile.setText( "" + CC.FloatLimitPrecision( object.collisionSize.width ) );
            break;
        }
    }
};


SceneMapEditor.prototype.objectResizingEnd = function()
{
    delete this.touchPressedResizing;
    delete this.touchPressedStartLocation;

    this.refreshCameraView();

    var selectedObjects = this.selectedObjects;
    if( selectedObjects.length > 0 )
    {
        this.mapsManager.objectsResized();
    }
};
