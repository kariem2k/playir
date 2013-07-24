/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : SceneUIEditor.js
 * Description : UI editor view.
 *
 * Created     : 01/06/13
 *-----------------------------------------------------------
 */

function SceneUIEditor(info, manager)
{
    this.info = info;
    this.manager = manager;
    this.construct();
    this.cameraCentered = true;
    this.cameraReletivePositions = true;

    this.customJSMarker = "// custom functions below this point will remain unmodified by the UI Editor (please don't delete this marker)";

    gEngine.addScene( this );
}
ExtendPrototype( SceneUIEditor, CCSceneAppUI );


SceneUIEditor.prototype.construct = function()
{
    var self = this;

    this.CCSceneAppUI_construct();

    // Files are dropped in but not yet loaded
    this.onDragDropFunction = function(files, event)
    {
        self.manager.onDragDrop( files, event );
    };
    gEngine.controls.onDragDrop.add( this.onDragDropFunction );

    this.onKeyboardFunction = function(event, key, pressed)
    {
        return self.onKeyboard( event, key, pressed );
    };
    gEngine.controls.requestKeyboard( this.onKeyboardFunction, false );

    this.selectedObjects = [];
    this.uiObjects = [];
};


SceneUIEditor.prototype.destruct = function()
{
    if( this.onDragDropFunction )
    {
        gEngine.controls.onDragDrop.remove( this.onDragDropFunction );
        this.onDragDropFunction = null;
    }

    if( this.onKeyboardFunction )
    {
        gEngine.controls.removeKeyboard( this.onKeyboardFunction );
        delete this.onKeyboardFunction;
    }

    this.selectedObjectsClear();

    this.CCSceneAppUI_destruct();
};


SceneUIEditor.prototype.deleteLater = function()
{
    if( this.sceneUI )
    {
        this.sceneUI.hideMenu( true );
        this.sceneUI = null;
    }

    this.CCSceneAppUI_deleteLater();
};


SceneUIEditor.prototype.setup = function()
{
    var self = this;

    var camera = gEngine.newSceneCamera( this );
    this.setupViewport();
    camera.offsetInterpolator.setDuration( 0.3 );

    this.CCSceneAppUI_setup();

    var tile;
    {
        tile = new CCTile3DButton( this );
        tile.setTileSize( 1.0 );
        tile.setTileTexture( "resources/editor/editor_icon_resize.png" );
        tile.setDrawOrder( 204 );
        tile.renderPass = CCRenderer.render_post;

        tile.onPress.push( function (tile, touch)
        {
            self.objectResizingBegin( tile, touch );
        });

        tile.onRelease.push( function()
        {
            self.objectResizingEnd();
        });
        this.addTile( tile );

        tile.setTextColour( gColour.set( 1.0, 1.0 ) );

        tile.setRotationZ( 45.0 );

        this.tileObjectResize = tile;
    }
    {
        tile = new CCTile3DButton( this );
        tile.setTileSize( 1.0 );
        tile.setTileTexture( "resources/editor/editor_icon_resize.png" );
        tile.setDrawOrder( 204 );
        tile.renderPass = CCRenderer.render_post;

        tile.onPress.push( function (tile, touch)
        {
            self.objectResizingBegin( tile, touch );
        });

        tile.onRelease.push( function()
        {
            self.objectResizingEnd();
        });
        this.addTile( tile );

        tile.setTextColour( gColour.set( 1.0, 1.0 ) );

        this.tileObjectResizeWidth = tile;
    }
    {
        tile = new CCTile3DButton( this );
        tile.setTileSize( 1.0 );
        tile.setTileTexture( "resources/editor/editor_icon_resize.png" );
        tile.setDrawOrder( 204 );
        tile.renderPass = CCRenderer.render_post;

        tile.onPress.push( function (tile, touch)
        {
            self.objectResizingBegin( tile, touch );
        });

        tile.onRelease.push( function()
        {
            self.objectResizingEnd();
        });
        this.addTile( tile );

        tile.setTextColour( gColour.set( 1.0, 1.0 ) );

        tile.setRotationZ( -90.0 );

        this.tileObjectResizeHeight = tile;
    }

    this.sceneUI = new SceneUIEditorUI( this, this.manager );
    this.sceneUI.setupMenu( this.info );
};


SceneUIEditor.prototype.setupViewport = function()
{
    var frameBufferWidth = gRenderer.width;
    var frameBufferHeight = gRenderer.height;
    var targetAspectRatio = 720.0 / 1080.0;
    var targetFrameHeight = targetAspectRatio * ( frameBufferWidth * 0.5 );
    var viewportHeight = targetFrameHeight / frameBufferHeight;
    var viewportY = ( 1.0 - viewportHeight ) * 0.5;
    this.camera.setupViewport( 0.25, viewportY, 0.5, viewportHeight );
};


SceneUIEditor.prototype.resize = function()
{
    this.setupViewport();
    this.CCSceneAppUI_resize();
    this.selectedObjectsUpdated();
};


SceneUIEditor.prototype.updateScene = function(delta)
{
    return this.CCSceneAppUI_updateScene( delta );
};


SceneUIEditor.prototype.updateCamera = function(delta)
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
            var size = cameraHeight * 0.05;
            this.tileObjectResize.setTileSize( size, size, size );
            this.tileObjectResizeWidth.setTileSize( size, size, size );
            this.tileObjectResizeHeight.setTileSize( size, size, size );
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


SceneUIEditor.prototype.postRender = function(camera, pass, alpha)
{
    if( this.camera === camera )
    {
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
                        CCRenderer.GLScale( [ object.collisionSize.width, object.collisionSize.height, 1.0 ] );
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
                    CCRenderer.GLScale( [ size[0], size[1], 1.0 ] );
                    renderer.CCRenderCube( true );
                CCRenderer.GLPopMatrix();
            }
        }
    }
};


SceneUIEditor.prototype.updateControls = function(controls)
{
    var usingControls = this.CCSceneAppUI_updateControls( controls );
    return usingControls;
};


SceneUIEditor.prototype.handleTwoTouches = function(touch1, touch2)
{
    return false;
};


SceneUIEditor.prototype.touchPressed = function(touch)
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
            offset = projectionResults.vNear[2] / Math.abs( projectionResults.vDirection[2] );
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
                if( camera.project3D( touch.x, touch.y ) )
                {
                    hitLocation = vec3.create();

                    // Project touch to y = 0
                    projectionResults = camera.projectionResults;
                    offset = projectionResults.vNear[2] / Math.abs( projectionResults.vDirection[2] );
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
    return false;
};


SceneUIEditor.prototype.touchMoving = function(touch, touchDelta)
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
            offset = projectionResults.vNear[2] / Math.abs( projectionResults.vDirection[2] );
            vec3.scale( hitLocation, projectionResults.vDirection, offset );
            vec3.add( hitLocation, hitLocation, projectionResults.vNear );

            this.selectionBoxEnd = hitLocation;

            gRenderer.pendingRender = true;
            return true;
        }
    }

    // If we've selected one object we're going to move it instead
    else if( this.touchPressedStartLocation )
    {
        allowCameraMovement = false;

        if( camera.project3D( touch.x, touch.y ) )
        {
            hitLocation = vec3.create();

            // Project touch to z = 0
            projectionResults = camera.projectionResults;
            offset = projectionResults.vNear[2] / Math.abs( projectionResults.vDirection[2] );
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
                    object.translate( movement[0], movement[1], movement[2] );
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


SceneUIEditor.prototype.touchReleased = function(touch, touchAction)
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

        delete this.movingObjects;

        this.manager.objectsMoved();
        this.selectedObjectsUpdated();
    }
    else if( this.sceneUI.creatingObjects )
    {
        usingControls = this.handleCreatingObjects( touch );
        this.sceneUI.handleCreateButton();
    }
    else
    {
        // Find pressed tile
        var result = this.handleTilesTouch( touch, touchAction );
        usingControls = result === CCSceneAppUI.tile_touchAction;
        if( !usingControls && touchAction >= CCControls.touch_released )
        {
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


SceneUIEditor.prototype.touchCameraMoving = function(x, y)
{
    return false;
};


SceneUIEditor.prototype.touchReleaseSwipe = function(touch)
{
    return false;
};


// Safe way to add objects to our selected list
SceneUIEditor.prototype.selectedObjectsAdd = function(object)
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


SceneUIEditor.prototype.selectedObjectsRemove = function(object)
{
    this.selectedObjects.remove( object );
    this.selectedObjectsUpdated();
};


SceneUIEditor.prototype.selectedObjectsClear = function()
{
    this.selectedObjects.length = 0;
    this.selectedObjectsUpdated();
};


SceneUIEditor.prototype.selectedObjectsUpdated = function()
{
    if( this.sceneUI )
    {
        if( this.sceneUI.selectionBoxActive )
        {
            this.sceneUI.handleSelectionButton();
        }

        var selectedObjects = this.selectedObjects;

        if( selectedObjects && selectedObjects.length > 0 )
        {
            this.sceneUI.objectEditorOpen( selectedObjects );
        }
        else
        {
            this.sceneUI.objectEditorClose();
        }
    }

    this.objectResized();
};


SceneUIEditor.prototype.handleSelectionBox = function(touch)
{
    var camera = this.camera;
    if( this.selectionBoxStart && camera.project3D( touch.x, touch.y ) )
    {
        var hitLocation = vec3.create();

        // Project touch to y = 0
        var projectionResults = camera.projectionResults;
        var offset = projectionResults.vNear[2] / Math.abs( projectionResults.vDirection[2] );
        vec3.scale( hitLocation, projectionResults.vDirection, offset );
        vec3.add( hitLocation, hitLocation, projectionResults.vNear );

        var selectionBoxMin = this.selectionBoxStart;
        var selectionBoxMax = hitLocation;
        CC.CalculateMinMaxVectors( selectionBoxMin, selectionBoxMax );

        var selectedObjects = this.selectedObjects;
        selectedObjects.length = 0;

        var objects = this.uiObjects;
        for( i=0; i<objects.length; ++i )
        {
            var object = objects[i];
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


SceneUIEditor.prototype.handleObjectSelection = function(touch)
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
    }

    // Report back to our manager
    this.manager.objectSelected( hitObject, hitLocation );

    return !!hitObject;
};


SceneUIEditor.prototype.handleCreatingObjects = function(touch)
{
    var camera = this.camera;
    var hitObject = null;
    var hitLocation = vec3.create();

    // Test if we're aiming at an object
    if( camera.project3D( touch.x, touch.y ) )
    {
        var projectionResults = camera.projectionResults;

        // Project touch to z = 0
        var offset = projectionResults.vNear[2] / Math.abs( projectionResults.vDirection[2] );
        vec3.scale( hitLocation, projectionResults.vDirection, offset );
        vec3.add( hitLocation, hitLocation, projectionResults.vNear );

        // Report back to our manager that we should create an object
        this.selectedObjectsClear();
        this.createObject( hitLocation );
    }

    return !hitObject;
};


SceneUIEditor.prototype.createObject = function(position, type)
{
    if( !type || !window[type] )
    {
        type = "CCTile3DButton";
    }

    var tile = new window[type]( this );
    if( type === "CCTile3DButton" )
    {
        tile.setupTile( 30.0 );
    }
    else if( type === "TileOverlay" )
    {
        tile.setupTexturedHeight( 30.0 );
        tile.aspectRatioLocked = true;
    }
    else if( type === "TileSocialProfile" )
    {
        tile.setTileSize( this.camera.targetHeight * 0.1 );
        tile.aspectRatioLocked = true;
    }
    this.uiObjects.add( tile );

    tile.setPositionXY( position[0], position[1] );

    this.updatedObject( tile );
    this.manager.objectCreated();
};


SceneUIEditor.prototype.findObject = function(object)
{
    var camera = this.camera;
    camera.targetOffset[2] = camera.calcCameraOffsetForWidth( object.collisionSize.width * 4.0 );
    camera.targetOffset[2] = CC.FloatClamp( camera.targetOffset[2], this.minZoomOffset, this.maxZoomOffset );
    camera.targetLookAt[0] = object.position[0];
    camera.targetLookAt[2] = object.position[2];
    camera.flagUpdate();
};


SceneUIEditor.prototype.updatedObject = function(object)
{
    this.manager.objectUpdated();

    this.collideables.sort( function(a, b)
    {
        return b.drawOrder - a.drawOrder;
    });


    this.uiObjects.sort( function(a, b)
    {
        return b.drawOrder - a.drawOrder;
    });

    var camera = this.camera;
    var tile = object;
    if( tile.fullScreen )
    {
        var image = tile.getTileTextureFilename();
        if( image )
        {
            tile.setupTexturedFit( camera.targetWidth, camera.targetHeight, true, image );
        }
        else
        {
            tile.setTileSize( camera.targetWidth, camera.targetHeight );
        }
    }

    this.selectedObjectsUpdated();
};


SceneUIEditor.prototype.deleteObject = function(object)
{
    var uiObjects = this.uiObjects;
    for( var i=0; i<uiObjects.length; ++i )
    {
        if( uiObjects[i] === object )
        {
            uiObjects.remove( object );
            this.tiles.remove( object );
            this.selectedObjectsRemove( object );
            object.deleteLater();
            this.manager.objectDeleted();
            break;
        }
    }
};


SceneUIEditor.prototype.objectResizingBegin = function(tile, touch)
{
    var camera = this.camera;
    if( camera.project3D( touch.x, touch.y ) )
    {
        var hitLocation = vec3.create();

        // Project touch to y = 0
        var projectionResults = camera.projectionResults;
        var offset = projectionResults.vNear[2] / Math.abs( projectionResults.vDirection[2] );
        vec3.scale( hitLocation, projectionResults.vDirection, offset );
        vec3.add( hitLocation, hitLocation, projectionResults.vNear );

        this.touchPressedStartLocation = hitLocation;

        if( tile === this.tileObjectResize )
        {
            this.touchPressedResizing = this.tileObjectResize;
        }
        else if( tile === this.tileObjectResizeWidth )
        {
            this.touchPressedResizing = this.tileObjectResizeWidth;
        }
        else if( tile === this.tileObjectResizeHeight )
        {
            this.touchPressedResizing = this.tileObjectResizeHeight;
        }
    }
};


SceneUIEditor.prototype.objectResizingMove = function(hitLocation, movement)
{
    this.touchPressedResizing.setPositionXY( hitLocation[0], hitLocation[1] );

    var selectedObjects = this.selectedObjects;

    var size;
    if( selectedObjects.length > 0 )
    {
        for( i=0; i<selectedObjects.length; ++i )
        {
            object = selectedObjects[i];
            if( this.touchPressedResizing === this.tileObjectResize ||
                this.touchPressedResizing === this.tileObjectResizeWidth )
            {
                size = ( object.collisionBounds[0] * 2.0 ) + ( movement[0] * 2.0 );
            }
            else if( this.touchPressedResizing === this.tileObjectResizeHeight )
            {
                size = ( object.collisionBounds[1] * 2.0 ) + ( movement[1] * 2.0 );
            }

            if( size < 10.0 )
            {
                size = 10.0;
            }
            if( size > this.camera.targetWidth * 1.5 )
            {
                size = this.camera.targetWidth * 1.5;
            }

            var aspectRatio = object.collisionSize.height / object.collisionSize.width;

            if( this.touchPressedResizing === this.tileObjectResize )
            {
                object.setTileSize( size, size * aspectRatio );
            }
            else if( this.touchPressedResizing === this.tileObjectResizeWidth )
            {
                object.setTileSize( size, object.aspectRatioLocked ? size * aspectRatio : object.collisionSize.height );
            }
            else if( this.touchPressedResizing === this.tileObjectResizeHeight )
            {
                object.setTileSize( object.aspectRatioLocked ? size / aspectRatio : object.collisionSize.width, size );
            }
        }
    }

    this.objectResized();
};


SceneUIEditor.prototype.objectResized = function()
{
    this.tileObjectResize.setPositionXY( this.camera.targetWidth, this.camera.targetHeight );
    this.tileObjectResizeWidth.setPositionXY( this.camera.targetWidth, this.camera.targetHeight );
    this.tileObjectResizeHeight.setPositionXY( this.camera.targetWidth, this.camera.targetHeight );

    var selectedObjects = this.selectedObjects;
    for( var i=0; i<selectedObjects.length; ++i )
    {
        var object = selectedObjects[i];
        if( !object.fullScreen )
        {
            var tile;
            tile = this.tileObjectResize;
            tile.setPositionXY( object.aabbMax[0], object.aabbMax[1] );
            tile.translate( tile.collisionBounds[0], tile.collisionBounds[1], 0.0 );

            tile = this.tileObjectResizeWidth;
            tile.setPositionXY( object.aabbMax[0], object.position[1] );
            tile.translate( tile.collisionBounds[0], 0.0, 0.0 );

            tile = this.tileObjectResizeHeight;
            tile.setPositionXY( object.position[0], object.aabbMax[1] );
            tile.translate( 0.0, tile.collisionBounds[1], 0.0 );
            break;
        }
    }
};


SceneUIEditor.prototype.objectResizingEnd = function()
{
    delete this.touchPressedResizing;
    delete this.touchPressedStartLocation;

    this.refreshCameraView();

    this.manager.objectsResized();
    this.selectedObjectsUpdated();
};


SceneUIEditor.prototype.startJS = function()
{
    this.js = "";
    this.jsIndent = 0;
};


SceneUIEditor.prototype.endJS = function()
{
    var js = this.js;
    delete this.js;
    delete this.jsIndent;
    return js;
};


SceneUIEditor.prototype.addJS = function(js)
{
    if( !js )
    {
        js = "";
    }
    else
    {
        if( js === "}" || js === "};" )
        {
            this.jsIndent--;
        }

        for( var i=0; i<this.jsIndent; ++i )
        {
            this.js += "\t";
        }

        if( js === "{" )
        {
            this.jsIndent++;
        }
    }
    this.js += js + "\n";
};


SceneUIEditor.prototype.validateJS = function(js)
{
    var validatedJS = "";
    var openSplit = js.split( "(" );
    if( openSplit.length > 1 )
    {
        validatedJS = openSplit[0];
        var closeSplit = openSplit[1].split( ")" );
        if( closeSplit.length > 0 )
        {
            var parameters = closeSplit[0];
            parameters = parameters.formatSpacesAndTabs();
            if( parameters.length > 0 )
            {
                var openDoubleQuote = -1;
                var openSingleQuote = -1;
                for( var i=0; i<parameters.length; ++i )
                {
                    var character = parameters[i];
                    if( character === "\"" )
                    {
                        if( openDoubleQuote !== -1 )
                        {
                            if( openDoubleQuote < openSingleQuote )
                            {
                                openSingleQuote = -1;
                            }
                            openDoubleQuote = -1;
                        }
                        else
                        {
                            openDoubleQuote = i;
                        }
                    }
                    else if( character === "'" )
                    {
                        if( openSingleQuote !== -1 )
                        {
                            if( openSingleQuote < openDoubleQuote )
                            {
                                openDoubleQuote = -1;
                            }
                            openSingleQuote = -1;
                        }
                        else
                        {
                            openSingleQuote = i;
                        }
                    }
                }

                if( openDoubleQuote !== -1 && openSingleQuote !== -1 )
                {
                    if( openDoubleQuote > openSingleQuote )
                    {
                        openDoubleQuote = false;
                    }
                    else
                    {
                        openSingleQuote = false;
                    }
                }

                if( openDoubleQuote !== -1 )
                {
                    parameters += "\"";
                }
                else if( openSingleQuote !== -1 )
                {
                    parameters += "'";
                }
            }
            validatedJS += "( ";
            validatedJS += parameters;
            validatedJS += " )";
        }
        else
        {
            validatedJS += "()";
        }
    }
    return validatedJS;
};


SceneUIEditor.prototype.exportJS = function()
{
    var i;

    this.startJS();
    this.addJS( "// This function will be overritten if modified by the UI Editor" );
    this.addJS( "function " + this.info.name + "(parentScene)" );
    this.addJS( "{" );
    this.addJS( "this.jsSyncReCreate = true;    // Tell our engine that it's ok to reset this class if it's JS code is updated" );
    this.addJS( "this.construct();" );
    this.addJS( "this.cameraCentered = true;" );
    this.addJS( "this.cameraReletivePositions = true;" );
    this.addJS( "gEngine.addScene( this );" );
    this.addJS( "" );
    this.addJS( "if( parentScene ) ");
    this.addJS( "{" );
    this.addJS( "this.setParent( parentScene );         // Tell our parent when this class is deleted" );
    this.addJS( "this.parentScene.linkScene( this );    // Tell our parent to delete this class when it is deleted" );
    this.addJS( "}" );
    this.addJS( "}" );
    this.addJS( "ExtendPrototype( " + this.info.name + ", CCSceneAppUI );" );

    this.addJS();
    this.addJS();
    this.addJS( "// This function can be tweaked, however aggressive changes will be overriten if modified by the UI Editor." );
    this.addJS( this.info.name + ".prototype.setup = function()" );
    this.addJS( "{" );
    this.addJS( "var self = this;" );
    this.addJS();
    this.addJS( "this.CCSceneAppUI_setup();" );
    this.addJS();
    this.addJS( "var tile;" );
    this.addJS();

    var uiObjects = this.uiObjects;
    var tile, image;

    // Cache images in back to front order
    var cachedImages = [];
    for( i=uiObjects.length-1; i>=0; --i )
    {
        tile = uiObjects[i];
        if( tile.constructor.name === "TileSocialProfile" )
        {
            continue;
        }
        var textureHandle = tile.getTileTextureHandle();
        if( textureHandle && textureHandle.image )
        {
            if( !textureHandle.src.contains( "/resources/" ) )
            {
                if( cachedImages.length === 0 )
                {
                    this.addJS( "// Load images in back to front order" );
                }
                if( cachedImages.find( textureHandle.filename ) === -1 )
                {
                    cachedImages.push( textureHandle.filename );
                    this.addJS( "gEngine.textureManager.getTextureHandle( \"" + textureHandle.filename + "\" );" );
                }
            }
        }
    }
    if( cachedImages.length > 0 )
    {
        this.addJS();
    }

    this.addJS( "this.uiObjects = [];" );

    for( i=0; i<uiObjects.length; ++i )
    {
        tile = uiObjects[i];
        this.addJS( "{" );
        this.addJS( "tile = new " + tile.constructor.name + "( this );" );

        if( tile.name )
        {
            this.addJS( "this." + tile.name + " = tile;" );
        }

        this.addJS( "this.uiObjects.push( tile );" );

        if( tile.drawOrder !== 100 )
        {
            this.addJS( "tile.setDrawOrder( " + tile.drawOrder + " );" );
        }

        this.addJS( "tile.setTileSize( " + tile.collisionSize.width + ", " + tile.collisionSize.height + " );" );

        this.addJS( "this.setReletiveX( tile, " + this.getReletiveX( tile ) + " );" );
        this.addJS( "this.setReletiveY( tile, " + this.getReletiveY( tile ) + " );" );

        image = tile.getTileTextureFilename();
        if( tile.constructor.name === "TileSocialProfile" )
        {
        }
        else if( tile.constructor.name === "TileOverlay" )
        {
        }
        else if( image )
        {
            this.addJS();
            this.addJS( "tile.setTileTexture( \"" + image + "\" );" );
        }

        this.addJS();
        this.addJS( "tile.setColour( gColour.fromString( \"" + tile.colour.toString() + "\" ) );" );
        if( tile.isBlinking() )
        {
            this.addJS( "tile.setBlinking( true );" );
        }

        if( tile.aspectRatioLocked )
        {
            this.addJS();
            this.addJS( "tile.aspectRatioLocked = true;" );
        }

        if( tile.fullScreen )
        {
            this.addJS( "tile.fullScreen = true;" );
        }

        if( tile.flipped )
        {
            this.addJS();
            this.addJS( "tile.flipTileY();" );
        }

        var text = tile.getText();
        if( text )
        {
            this.addJS();
            var textScale = tile.textScale;
            if( textScale !== undefined )
            {
                this.addJS( "tile.setTextScale( " + textScale + " );" );
            }
            this.addJS( "tile.setText( \"" + text + "\" );" );
            this.addJS( "tile.setTextColour( gColour.fromString( \"" + tile.textObject.colour.toString() + "\" ) );" );
            if( tile.isTextBlinking() )
            {
                this.addJS( "tile.setTextBlinking( true );" );
            }
        }

        if( tile.get3DModelFilename() )
        {
            this.addJS();
            this.addJS( "tile.set3DModel( \"" + tile.get3DModelFilename() + "\", \"" + tile.get3DModelTextureFilename() + "\" );" );
            if( tile.model3dObject.colour )
            {
                if( !gColour.white().equals( tile.model3dObject.colour ) )
                {
                    this.addJS( "tile.model3dObject.setColour( gColour.fromString( \"" + tile.model3dObject.colour.toString() + "\" ) );" );
                }
            }
            if( tile.model3dAnimationSpeed )
            {
                this.addJS( "tile.set3DModelAnimationSpeed( " + tile.model3dAnimationSpeed + " );" );
            }
        }

        if( tile.onPress.length > 0 || tile.onRelease.length > 0 || tile.onLoss.length > 0 )
        {
            this.addJS();
            if( tile.onPress.length > 0 )
            {
                this.addJS( "tile.onPress.push( function() { " + tile.onPress[0] + "; } );" );
            }
            if( tile.onRelease.length > 0 )
            {
                this.addJS( "tile.onRelease.push( function() { " + tile.onRelease[0] + "; } );" );
            }
            if( tile.onLoss.length > 0 )
            {
                this.addJS( "tile.onLoss.push( function() { " + tile.onLoss[0] + "; } );" );
            }
            this.addJS( "this.addTile( tile );" );
        }
        this.addJS( "}" );
        this.addJS();
    }

    this.addJS( "if( this.setupFinish )" );
    this.addJS( "{" );
    this.addJS( "// Custom setup should be written into a setupFinish function" );
    this.addJS( "this.setupFinish();" );
    this.addJS( "}" );
    this.addJS();

    this.addJS( "this.requestResize();" );
    this.addJS( "};" );

    this.addJS();
    this.addJS();
    this.addJS( "// This function will be overritten if modified by the UI Editor" );
    this.addJS( this.info.name + ".prototype.resize = function()" );
    this.addJS( "{" );
    this.addJS( "var self = this;" );
    this.addJS( "this.CCSceneAppUI_resize();" );
    this.addJS( "var camera = this.camera;" );
    this.addJS();
    this.addJS( "var tile;" );

    for( i=0; i<uiObjects.length; ++i )
    {
        tile = uiObjects[i];
        if( tile.fullScreen )
        {
            this.addJS( "{" );
            this.addJS( "tile = this.uiObjects[" + i + "];" );

            image = tile.getTileTextureFilename();
            if( image )
            {
                this.addJS( "tile.setupTexturedFit( camera.targetWidth, camera.targetHeight, true, \"" + image + "\" );" );
            }
            else
            {
                this.addJS( "tile.setTileSize( camera.targetWidth, camera.targetHeight );" );
            }
            this.addJS( "}" );
        }
    }
    this.addJS( "};" );

    this.addJS();
    this.addJS();
    this.addJS( "// This function will be overritten if modified by the UI Editor" );
    this.addJS( this.info.name + ".prototype.touchCameraMoving = function()" );
    this.addJS( "{" );
    this.addJS( "return false;" );
    this.addJS( "};" );
    this.addJS( "" );
    this.addJS( "" );

    this.addJS( "// While it is recommended to write new functions for this class in a new file," );
    this.js += this.customJSMarker;
    if( this.customJS )
    {
        this.js += this.customJS;
    }

    if( window.console && console.log )
    {
        console.log( this.js );
    }

    return this.endJS();
};


SceneUIEditor.prototype.loadJS = function(js)
{
    var jsLines = js.split( "\n" );

    var line, formattedLine;

    var tile, parameters, i;
    for( i=0; i<jsLines.length; ++i )
    {
        line = jsLines[i];
        line = line.formatSpacesAndTabs();
        if( line.startsWith( "tile" ) )
        {
            // TileOverlay
            if( line.startsWith( "tile = new TileOverlay" ) )
            {
                tile = new TileOverlay( this );
                tile.setupTile( 30.0 );
                this.uiObjects.add( tile );
            }

            // TileSocialProfile
            else if( line.startsWith( "tile = new TileSocialProfile" ) )
            {
                tile = new TileSocialProfile( this );
                this.uiObjects.add( tile );
            }

            // CCTile3DButton
            else if( line.startsWith( "tile = new CCTile3DButton" ) )
            {
                tile = new CCTile3DButton( this );
                tile.setupTile( 30.0 );
                this.uiObjects.add( tile );
            }

            else if( line.startsWith( "tile.setTileSize" ) ||
                     line.startsWith( "tile.setPositionXY" ) ||
                     line.startsWith( "tile.setTextScale" ) ||
                     line.startsWith( "tile.setColour" ) ||
                     line.startsWith( "tile.setText" ) ||
                     line.startsWith( "tile.setTextColour" ) ||
                     line.startsWith( "tile.setTextBlinking" ) ||
                     line.startsWith( "tile.setTileTexture" ) ||
                     line.startsWith( "tile.aspectRatioLocked" ) ||
                     line.startsWith( "tile.flipTileY" ) ||
                     line.startsWith( "tile.setDrawOrder" ) ||
                     line.startsWith( "tile.set3DModel" ) ||
                     line.startsWith( "tile.set3DModelAnimationSpeed" ) ||
                     line.startsWith( "tile.model3dObject.setColour" ) )
            {
                try
                {
                    eval( line );
                }
                catch (e)
                {
                    if( window.console && console.log )
                    {
                        console.log( e );
                    }
                }
            }
            else if( line.startsWith( "tile.fullScreen" ) )
            {
                tile.fullScreen = true;
                var image = tile.getTileTextureFilename();
                if( image )
                {
                    tile.setupTexturedFit( this.camera.targetWidth, this.camera.targetHeight, true, image );
                }
                else
                {
                    tile.setTileSize( this.camera.targetWidth, this.camera.targetHeight );
                }
            }
            else if( line.startsWith( "tile.onPress" ) ||
                     line.startsWith( "tile.onRelease" ) ||
                     line.startsWith( "tile.onLoss" ) )
            {
                if( tile )
                {
                    formattedLine = String.SplitBetween( line, "{", "}" );
                    formattedLine = formattedLine.formatSpacesAndTabs();
                    if( formattedLine.length > 0 )
                    {
                        if( formattedLine[formattedLine.length-1] === ";" )
                        {
                            formattedLine = formattedLine.substring( 0, formattedLine.length-1 );
                        }
                    }

                    if( line.startsWith( "tile.onPress" ) )
                    {
                        tile.onPress.push( formattedLine );
                    }
                    else if( line.startsWith( "tile.onRelease" ) )
                    {
                        tile.onRelease.push( formattedLine );
                    }
                    else if( line.startsWith( "tile.onLoss" ) )
                    {
                        tile.onLoss.push( formattedLine );
                    }
                }
            }
        }
        else if( line.startsWith( "this." ) )
        {
            if( line.startsWith( "this.setReletive" ) )
            {
                if( tile )
                {
                    try
                    {
                        eval( line );
                    }
                    catch (e)
                    {
                        if( window.console && console.log )
                        {
                            console.log( e );
                        }
                    }
                }
            }
            else if( line.contains( "= tile;" ) )
            {
                if( tile )
                {
                    formattedLine = String.SplitBetween( line, "this.", "=" );
                    formattedLine = formattedLine.formatSpacesAndTabs();
                    tile.name = formattedLine;
                }
            }
        }
    }

    var customJSSplit = js.split( this.customJSMarker );
    if( customJSSplit.length > 1 )
    {
        this.customJS = customJSSplit[1];
        for( i=2; i<customJSSplit.length; ++i )
        {
            this.customJS += this.customJSMarker;
            this.customJS += customJSSplit[i];
        }
    }

    return true;
};


SceneUIEditor.prototype.onKeyboard = function(event, key, pressed)
{
    if( event.metaKey )
    {
        return false;
    }

    if( event.ctrlKey )
    {
        return false;
    }

    if( pressed )
    {
        var selectedObjects = this.selectedObjects;
        if( selectedObjects.length > 0 )
        {
            var x = 0.0;
            var y = 0.0;
            if( key === "up" )
            {
                y = 1.0;
            }
            else if( key === "down" )
            {
                y = -1.0;
            }
            else if( key === "left" )
            {
                x = -1.0;
            }
            else if( key === "right" )
            {
                x = 1.0;
            }

            if( x !== 0.0 || y !== 0.0 )
            {
                for( var i=0; i<selectedObjects.length; ++i )
                {
                    object = selectedObjects[i];
                    this.setReletiveX( object, Math.round( ( this.getReletiveX( object ) * 100.0 ) + x ) / 100.0 );
                    this.setReletiveY( object, Math.round( ( this.getReletiveY( object ) * 100.0 ) + y ) / 100.0 );
                }

                this.manager.objectsMoved();
                this.selectedObjectsUpdated();
            }
        }
    }

    return false;
};