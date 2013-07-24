/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCControls.js
 * Description : Base Controls interface.
 *
 * Created     : 05/11/11
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

function CCControls()
{
    // Two touches by default
    this.touches = [];
    this.touches.push( new CCTouch() );
    this.touches.push( new CCTouch() );

    this.keys = [];

    this.onKeyboardCallbacks = [];
    this.onDragDrop = [];
    this.onDragDropLoad = [];
}


CCControls.touch_pressed = 1;
CCControls.touch_movingHorizontal = 2;
CCControls.touch_movingVertical = 3;
CCControls.touch_moving = 4;
CCControls.touch_released = 5;
CCControls.touch_lost = 6;

CCControls.twotouch_unassigned = 7;
CCControls.twotouch_zooming = 8;
CCControls.twotouch_rotating = 9;

CCControls.TouchMovementThreashold = new CCPoint( 0.00125125 );
CCControls.DOUBLE_TAP_THRESHOLD = 0.2;

CCControls.max_last_deltas = 50;


// Converts our screen controls to relative space for our scenes
function CCTouch()
{
    // Input before being handled by engine
    this.rawX = 0.0;
    this.rawY = 0.0;

    // Engine status of touch
    this.x = 0.0;
    this.y = 0.0;

    this.startX = 0.0;
    this.startY = 0.0;

    this.deltaX = 0.0;
    this.deltaY = 0.0;

    this.totalDeltaX = 0.0;
    this.totalDeltaY = 0.0;

    this.timeHeld = 0.0;
    this.lastTimeReleased = 0.0;

    this.state = CCControls.touch_released;

    this.usingTouch = false;       // Simple query of state

    var lastDeltas = this.lastDeltas = new Array( CCControls.max_last_deltas );
    for( var i=0; i<lastDeltas.length; ++i )
    {
        var lastDelta = {};
        lastDelta.time = 0;
        lastDelta.delta = new CCPoint();
        lastDeltas[i] = lastDelta;
    }
}


CCTouch.prototype.averageLastDeltas = function()
{
    if( !this.averageDeltas )
    {
        this.averageDeltas = new CCPoint();
    }
    var averageDeltas = this.averageDeltas;

    var numberOfDeltas = 0;
    var lifetime = gEngine.lifetime;
    var lastDeltas = this.lastDeltas;
    for( var i=0; i<lastDeltas.length; ++i )
    {
        var lastDelta = lastDeltas[i];
        var difference = lifetime - lastDelta.time;
        if( difference < 0.25 )
        {
            averageDeltas.x += lastDelta.delta.x;
            averageDeltas.y += lastDelta.delta.y;
            numberOfDeltas++;
        }
        else
        {
            break;
        }
    }
    if( numberOfDeltas > 1 )
    {
        averageDeltas.x /= numberOfDeltas;
        averageDeltas.y /= numberOfDeltas;
    }
    return averageDeltas;
};


CCControls.prototype.update = function(delta)
{
    var updatedTouchState = false;

    var touches = this.touches;
    for( var i=0; i<touches.length; ++i )
    {
        var touch = touches[i];
        if( touch.touchMovingState )
        {
            updatedTouchState = true;

            this.updateTouch( touch, touch.touchMovingState );
            touch.touchMovingState = false;
        }

        if( touch.state < CCControls.touch_released )
        {
            touch.timeHeld += delta;

            // Only update last deltas if touch is being held
            var lastDeltas = touch.lastDeltas;
            for( var lastDeltaIndex=lastDeltas.length-1; lastDeltaIndex>0; --lastDeltaIndex )
            {
                var prev = lastDeltas[lastDeltaIndex-1];
                var next = lastDeltas[lastDeltaIndex];
                next.time = prev.time;
                next.delta.x = prev.delta.x;
                next.delta.y = prev.delta.y;
            }
            lastDeltas[0].time = gEngine.lifetime;
            lastDeltas[0].delta.x = touch.deltaX;
            lastDeltas[0].delta.y = touch.deltaY;
        }
        else
        {
            touch.lastTimeReleased += delta;
        }
    }

    if( updatedTouchState )
    {
        gEngine.updateControls();
    }
};


CCControls.prototype.updateTouchXY = function(touch, state, x, y)
{
    if( touch.state < CCControls.touch_released )
    {
        var deltaX = touch.deltaX = x - touch.x;
        var deltaY = touch.deltaY = y - touch.y;
        touch.x = x;
        touch.y = y;
        touch.totalDeltaX += deltaX;
        if( deltaY !== 0 )
        {
            touch.totalDeltaY += deltaY;
        }
    }
    else
    {
        touch.timeHeld = 0.0;
        touch.x = x;
        touch.y = y;
        touch.startX = x;
        touch.startY = y;
        touch.deltaX = 0.0;
        touch.deltaY = 0.0;
        touch.totalDeltaX = 0.0;
        touch.totalDeltaY = 0.0;

        touch.lastTimeReleased = 0.0;
    }

    touch.state = state;
    touch.usingTouch = state < CCControls.touch_released;
};


CCControls.TouchActionMoving = function(touchAction)
{
    if( touchAction >= CCControls.touch_movingHorizontal && touchAction <= CCControls.touch_moving )
    {
        return true;
    }
    return false;
};


CCControls.TouchSetMovementThreashold = function(x, y)
{
    CCControls.TouchMovementThreashold.x = x;
    CCControls.TouchMovementThreashold.y = y;
};


CCControls.prototype.onPause = function()
{
    for( var i=0; i<this.keys.length; ++i )
    {
        if( this.keys[i] )
        {
            this.keys[i] = false;
        }
    }
};
