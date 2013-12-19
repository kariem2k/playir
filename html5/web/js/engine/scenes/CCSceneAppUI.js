/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCSceneAppUI.js
 * Description : AppUI scene template.
 *
 * Created     : 20/10/11
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

function CCSceneAppUI()
{
    this.construct();
}
ExtendPrototype( CCSceneAppUI, CCSceneBase );


CCSceneAppUI.tile_touchNone = 0;
CCSceneAppUI.tile_touchCollision = 1;
CCSceneAppUI.tile_touchAction = 2;


CCSceneAppUI.prototype.construct = function()
{
	this.CCSceneBase_construct();

    this.tiles = [];
    this.cameraStickyTiles = [];
    this.touchDelta = new CCPoint();

	this.camera = null;
    this.cameraCentered = false;
    this.cameraReletivePositions = false;
    this.cameraScrolling = false;

    this.controlsEnabled = true;
    this.controlsFirstTouchedInThisScene = false;
    this.controlsMoving = false;
    this.controlsSwipeMomentum = false;

    this.minZoomOffset = 1.0;
    this.maxZoomOffset = 1000;

    this.resizing = false;
	this.resizeCallbacks = [];

    this.scrollBar = null;

    this.timers = [];
};


CCSceneAppUI.prototype.destruct = function()
{
    this.resizeCallbacks.length = 0;

    if( this.camera )
    {
        gEngine.removeCamera( this.camera );
        delete this.camera;
    }

    this.CCSceneBase_destruct();
};


CCSceneAppUI.prototype.setup = function()
{
	if( !this.camera )
	{
        var camera = gEngine.newSceneCamera( this );
		camera.setupViewport( 0.0, 0.0, 1.0, 1.0 );
	}

    this.camera.setCameraWidth( 640.0 );
    this.refreshCameraView();
    this.lockCameraView();
};


// If there's no camera it means the scene has been deleted before a callback has been triggered
// Usually happens during async loads
CCSceneAppUI.prototype.requestResize = function()
{
    if( this.camera )
    {
        this.resize();
    }
};


CCSceneAppUI.prototype.resize = function()
{
    var camera = this.camera;
    CC.ASSERT( camera );

    var previousCameraHeight = camera.targetHeight;

    camera.recalcViewport();

    camera.setCameraWidth( camera.targetWidth );
    if( this.cameraCentered )
    {
        if( this.cameraReletivePositions )
        {
            var objects = this.objects;
            for( i=0; i<objects.length; ++i )
            {
                var object = objects[i];
                var y = this.getReletiveY( object, previousCameraHeight );
                this.setReletiveY( object, y );
            }
        }
    }
    else
    {
        var newCameraHeight = camera.targetHeight;
        var heightDifference = previousCameraHeight - newCameraHeight;
        camera.targetLookAt[1] += heightDifference * 0.5;
    }

	var resizeCallbacks = this.resizeCallbacks;
    resizeCallbacks.emit();

    this.resizing = true;
};


CCSceneAppUI.prototype.resized = function()
{
    if( !this.cameraCentered )
    {
        this.refreshCameraView();
        this.lockCameraView();

        var camera = this.camera;
        camera.setLookAt( camera.targetLookAt, false );
        camera.flagUpdate();
    }
};


CCSceneAppUI.prototype.updateControls = function(controls)
{
	if( this.resizing )
	{
		return false;
	}

	var cameraRelativeTouches = this.camera.getRelativeTouches( controls.touches );
    var usingControls = this.handleTouches( cameraRelativeTouches[0], cameraRelativeTouches[1] );
    if( !usingControls )
    {
        return this.CCSceneBase_updateControls( controls );
    }

    return usingControls;
};


CCSceneAppUI.prototype.handleTouches = function(touch1, touch2)
{
    var usingControls = false;

    // Handles two touches pressed
    if( touch1.usingTouch && touch2.usingTouch )
    {
        if( this.touchAllowed( touch1 ) )
        {
            if( this.controlsTouching === touch1 )
            {
                this.touchReleased( touch1, CCControls.touch_lost );
            }

            if( this.controlsTouching !== touch2 )
            {
                this.twoTouchesRegistered( touch1, touch2 );
            }

            usingControls = this.handleTwoTouches( touch1, touch2 );
        }
    }
    else
    {
        if( touch2.lastTimeReleased > 0.0 && this.touchAllowed( touch1 ) )
        {
            if( this.controlsTouching !== touch1 )
            {
                this.controlsFirstTouchedInThisScene = touch1.state === CCControls.touch_pressed;
                this.oneTouchRegistered( touch1 );
            }

            usingControls = this.handleOneTouch( touch1 );
        }

        // On touch release
        else if( this.controlsTouching )
        {
            if( this.controlsFirstTouchedInThisScene )
            {
                if( this.controlsTouching === touch1 && touch1.state === CCControls.touch_released )
                {
                    usingControls = this.touchReleased( touch1, CCControls.touch_released );
                }
                else
                {
                    this.touchReleased( touch1, CCControls.touch_lost );
                }
            }
            else
            {
                this.touchReleased( touch1, CCControls.touch_lost );
            }

            this.lockCameraView();

            // Reset state
            if( this.controlsMoving )
            {
                this.controlsMoving = false;
            }

            this.controlsTouching = false;
        }
    }

    return usingControls;
};


CCSceneAppUI.prototype.updateScene = function(delta)
{
	var updated = this.CCSceneBase_updateScene( delta );

    // Run through our timers first
    {
        var timers = this.timers;
        var length = timers.length;
        for( var i=0; i<length; ++i )
        {
            var timer = timers[i];
            if( !timer.update( delta ) )
            {
                // Delete on finish update
                timers.remove( timer );
                timer.finish();
                length = timers.length;
                --i;
            }
        }
    }

    return updated;
};


CCSceneAppUI.prototype.updateCamera = function(delta)
{
    var updated = false;

	var lookAtSpeed = this.controlsMoving && !this.cameraScrolling ? 20.0 : 1.5;
	if( this.camera.interpolateCamera( delta, lookAtSpeed ) )
    {
        // Tell the scroll bar where to go
        if( this.scrollBar )
        {
            //this.scrollBar->reposition( camera->getLookAt()[1], cameraWidth, cameraHeight );
        }

        var cameraStickyTiles = this.cameraStickyTiles;
        for( var i=0; i<cameraStickyTiles.length; ++i )
        {
            var tile = cameraStickyTiles[i];
            tile.setPosition( this.camera.currentLookAt ) ;
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


CCSceneAppUI.prototype.render = function(camera, pass, alpha)
{
	if( this.camera === camera )
	{
		this.CCSceneBase_render( camera, pass, alpha );
	}
};


CCSceneAppUI.prototype.renderVisibleObject = function(object, camera, pass, alpha)
{
    if( this.camera === camera )
    {
        object.renderObject( camera, alpha );
    }
};


CCSceneAppUI.prototype.refreshCameraView = function()
{
    this.sceneLeft = 0.0;
    this.sceneRight = 0.0;
    this.sceneTop = 0.0;
    this.sceneBottom = 0.0;
};


// Lock the camera on something interesting
CCSceneAppUI.prototype.lockCameraView = function()
{
    if( this.cameraScrolling )
    {
        return;
    }

    this.camera.flagUpdate();
    gRenderer.pendingRender = true;
    this.camera.targetLookAt[0] = 0.0;
    this.camera.targetLookAt[1] = 0.0;
};


CCSceneAppUI.prototype.scrollCameraToTop = function()
{
    this.camera.targetLookAt[1] = this.sceneTop;
    this.camera.flagUpdate();
};


CCSceneAppUI.prototype.addTile = function(inTile, index)
{
    this.tiles.push( inTile );

    if( index !== undefined )
    {
        this.tiles.insert( inTile, index );
    }
};


CCSceneAppUI.prototype.touchAllowed = function(touch)
{
    if( this.enabled && this.controlsEnabled )
    {
        if( touch.state < CCControls.touch_released )
        {
            return touch.x > 0.0 && touch.x < 1.0 &&
                   touch.y > 0.0 && touch.y < 1.0 &&
                   touch.startX > 0.0 && touch.startX < 1.0 &&
                   touch.startY > 0.0 && touch.startY < 1.0;
       }
    }
    return false;
};


CCSceneAppUI.prototype.handleOneTouch = function(touch1)
{
    var usingControls = false;

    this.touchDelta.x = touch1.deltaX;
    this.touchDelta.y = touch1.deltaY;
    if( !this.controlsMoving )
    {
        if( this.touchMovementAllowed( touch1, this.touchDelta ) )
        {
        }
        else
        {
            usingControls = this.touchPressed( touch1 );
        }
    }

    if( this.controlsMoving )
    {
        usingControls = this.touchMoving( touch1, this.touchDelta );
    }

    return usingControls;
};


CCSceneAppUI.prototype.handleTwoTouches = function(touch1, touch2)
{
    return false;
};


CCSceneAppUI.prototype.oneTouchRegistered = function(touch)
{
    this.controlsTwoTouchAction = CCControls.twotouch_unassigned;
    this.controlsTouching = touch;
};


CCSceneAppUI.prototype.twoTouchesRegistered = function(touch1, touch2)
{
    this.controlsTwoTouchAction = CCControls.twotouch_unassigned;
    this.controlsTouching = touch2;
};


CCSceneAppUI.prototype.touchPressed = function(touch)
{
    return this.handleTilesTouch( touch, CCControls.touch_pressed ) >= CCSceneAppUI.tile_touchCollision;
};


CCSceneAppUI.prototype.touchMovementAllowed = function(touch, touchDelta)
{
    var absDeltaX = Math.abs( touch.totalDeltaX );
    var absDeltaY = Math.abs( touch.totalDeltaY );
    if( absDeltaX > CCControls.TouchMovementThreashold.x || absDeltaY > CCControls.TouchMovementThreashold.y )
    {
        this.controlsMoving = true;
        touchDelta.x += touch.totalDeltaX;
        touchDelta.y += touch.totalDeltaY;

        this.controlsMovingVertical = absDeltaY > absDeltaX;
        return true;
    }
    return false;
};


CCSceneAppUI.prototype.touchMoving = function(touch, touchDelta)
{
    var result = this.handleTilesTouch( touch, this.controlsMovingVertical ? CCControls.touch_movingVertical : CCControls.touch_movingHorizontal );
    if( result === CCSceneAppUI.tile_touchAction )
    {
        return true;
    }
    else
    {
        return this.touchCameraMoving( touchDelta.x, touchDelta.y );
    }
};


CCSceneAppUI.prototype.touchCameraMoving = function(x, y)
{
    var camera = this.camera;
    var delta;

    if( this.controlsMovingVertical )
    {
        if( y !== 0.0 )
        {
            delta = y * camera.cameraHeight;
            if( camera.targetLookAt[1] > this.sceneTop || camera.targetLookAt[1] < this.sceneBottom )
            {
                delta *= 0.5;
            }
            camera.targetLookAt[1] += delta;

            var cameraHeightStretch = camera.targetHeight * 0.1;
            camera.targetLookAt[1] = CC.FloatClamp( camera.targetLookAt[1], this.sceneBottom - cameraHeightStretch, this.sceneTop + cameraHeightStretch );

            camera.flagUpdate();
            return true;
        }
    }
    else
    {
        if( x !== 0.0 )
        {
            delta = x * camera.cameraWidth;
            if( camera.targetLookAt[0] > this.sceneRight || camera.targetLookAt[0] < this.sceneLeft )
            {
                delta *= 0.5;
            }
            camera.targetLookAt[0] -= delta;

            var cameraWidthStretch = camera.targetWidth * 0.1;
            camera.targetLookAt[0] = CC.FloatClamp( camera.targetLookAt[0], this.sceneLeft - cameraWidthStretch, this.sceneRight + cameraWidthStretch );

            camera.flagUpdate();
            return true;
        }
    }

    return true;
};


CCSceneAppUI.prototype.touchCameraZooming = function(amount)
{
    // Callback for when two touches are panning the camera to rotate
    var camera = this.camera;

    camera.targetOffset[2] -= amount * 2.0 * camera.offset[2];
    camera.targetOffset[2] = CC.FloatClamp( camera.targetOffset[2], this.minZoomOffset, this.maxZoomOffset );
    camera.flagUpdate();

    return false;
};


CCSceneAppUI.prototype.touchCameraRotating = function(x, y)
{
    // Callback for when two touches are panning the camera to rotate
    var camera = this.camera;
    var rotation = camera.rotation;

    rotation[1] += -x * 180.0;
    rotation[1] = CC.FloatClamp( rotation[1], -45.0, 45.0 );
    camera.setRotationY( rotation[1] );

    rotation[0] += -y * 180.0;
    rotation[0] = CC.FloatClamp( rotation[0], -45.0, 45.0 );
    camera.setRotationX( rotation[0] );

    camera.flagUpdate();
    return true;
};


CCSceneAppUI.prototype.touchReleased = function(touch, touchAction)
{
    // Find pressed tile
    var result = this.handleTilesTouch( touch, touchAction );
    var usingControls = ( result === CCSceneAppUI.tile_touchAction );
    if( !usingControls && touchAction === CCControls.touch_released )
    {
        usingControls = this.touchReleaseSwipe( touch );
    }
    return usingControls;
};


CCSceneAppUI.prototype.handleTilesTouch = function(touch, touchAction)
{
    var camera = this.camera;
    if( camera.project3D( touch.x, touch.y ) )
    {
        var tiles = this.tiles;

        var projectionResults = camera.projectionResults;

        // Scan to see if we're blocked by a collision
        var hitPosition = vec3.create();
        var hitObject = CC.BasicLineCollisionCheck( tiles,
                                                    projectionResults.vNear,
                                                    projectionResults.vFar,
                                                    hitPosition,
                                                    true,
                                                    CC.collision_ui );

        // Fill in the hitPosition variable if nothing has been hit
        if( !hitObject )
        {
            hitPosition = projectionResults.vLookAt;
        }

        var actioned = false;
        var length = tiles.length;
        for( var i=0; i<length; ++i )
        {
            var tile = tiles[i];
            if( tile.handleProjectedTouch( projectionResults, hitObject, hitPosition, touch, touchAction ) )
            {
                actioned |= true;
                if( touchAction < CCControls.touch_released )
                {
                    break;
                }
            }
        }

        if( actioned )
        {
            return CCSceneAppUI.tile_touchAction;
        }

        if( hitObject )
        {
            return CCSceneAppUI.tile_touchCollision;
        }
    }
    return CCSceneAppUI.tile_touchNone;
};


CCSceneAppUI.prototype.touchReleaseSwipe = function(touch)
{
    if( this.controlsSwipeMomentum )
    {
        var maxTimeHeld = 0.5;
        if( touch.timeHeld < maxTimeHeld )
        {
            var camera = this.camera;
            var minMovementThreashold = 0.1;
            if( this.controlsMovingVertical )
            {
                if( touch.totalDeltaY < -minMovementThreashold )
                {
                    camera.targetLookAt[1] -= camera.cameraHHeight * 0.5;
                    camera.flagUpdate();
                    this.lockCameraView();
                    return true;
                }
                else if( touch.totalDeltaY > minMovementThreashold )
                {
                    camera.targetLookAt[1] += camera.cameraHHeight * 0.5;
                    camera.flagUpdate();
                    this.lockCameraView();
                    return true;
                }
            }
            else
            {
                if( touch.totalDeltaX < -minMovementThreashold )
                {
                    camera.targetLookAt[0] += camera.cameraHWidth;
                    camera.flagUpdate();
                    this.lockCameraView();
                    return true;
                }
                else if( touch.totalDeltaX > minMovementThreashold )
                {
                    camera.targetLookAt[0] -= camera.cameraHWidth;
                    camera.flagUpdate();
                    this.lockCameraView();
                    return true;
                }
            }
        }
    }
    return false;
};


// Used for re-positioning tiles
CCSceneAppUI.prototype.getReletiveWidth = function(object)
{
    return ( object.collisionSize.width / this.camera.targetWidth );
};


CCSceneAppUI.prototype.getReletiveHeight = function(object)
{
    return ( object.collisionSize.height / this.camera.targetHeight );
};


CCSceneAppUI.prototype.getReletiveX = function(object)
{
    var x = object.position[0];
    // if( x > 0 )
    // {
    //     x += object.collisionBounds[0];
    // }
    // else if( x < 0 )
    // {
    //     x -= object.collisionBounds[0];
    // }
    return ( x / ( this.camera.targetWidth * 0.5 ) );
};


CCSceneAppUI.prototype.getReletiveY = function(object, screenHeight)
{
    if( screenHeight === undefined )
    {
        screenHeight = this.camera.targetHeight;
    }

    var y = object.position[1];
    // if( y > 0 )
    // {
    //     y += object.collisionBounds[1];
    // }
    // else if( y < 0 )
    // {
    //     y -= object.collisionBounds[1];
    // }
    return ( y / ( screenHeight * 0.5 ) );
};


CCSceneAppUI.prototype.setReletiveWidth = function(object, value)
{
    value *= this.camera.targetWidth;

    var aspectRatio = object.collisionSize.height / object.collisionSize.width;
    if( object.aspectRatioLocked )
    {
        object.setTileSize( value, value * aspectRatio );
    }
    else
    {
        object.setTileSize( value, object.collisionSize.height );
    }
};


CCSceneAppUI.prototype.setReletiveHeight = function(object, value)
{
    value *= this.camera.targetHeight;

    var aspectRatio = object.collisionSize.height / object.collisionSize.width;
    if( object.aspectRatioLocked )
    {
        object.setTileSize( value / aspectRatio, value );
    }
    else
    {
        object.setTileSize( object.collisionSize.width, value );
    }
};


CCSceneAppUI.prototype.setReletiveX = function(object, value)
{
    var hCameraWidth = this.camera.targetWidth * 0.5;
    value *= hCameraWidth;

    var hWidth = object.collisionBounds[0];
    // if( value + hWidth > hCameraWidth )
    // {
    //     value = hCameraWidth - hWidth;
    //     if( value - hWidth < hCameraWidth )
    //     {
    //         value = 0.0;
    //     }
    // }
    // else if( value - hWidth < -hCameraWidth )
    // {
    //     value = -hCameraWidth + hWidth;
    // }
    object.setPositionX( value );
};


CCSceneAppUI.prototype.setReletiveY = function(object, value)
{
    var hCameraHeight = this.camera.targetHeight * 0.5;

    value *= hCameraHeight;

    var hHeight = object.collisionBounds[1];
    // if( value + hHeight > hCameraHeight )
    // {
    //     value = hCameraHeight - hHeight;
    //     if( value - hHeight < hCameraHeight )
    //     {
    //         value = 0.0;
    //     }
    // }
    // else if( value - hHeight < -hCameraHeight )
    // {
    //     value = -hCameraHeight + hHeight;
    // }
    object.setPositionY( value );
};
