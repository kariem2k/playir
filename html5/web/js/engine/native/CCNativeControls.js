/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCJSONControls.js
 * Description : Controls interface.
 *
 * Created     : 05/11/11
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */


CCControls.prototype.create = function()
{
    return this;
};


CCControls.prototype.handleControls = function(touch, state)
{
    // Usually we update our controls on the next frame
    // However if we're changing states, update our previous tick now
    if( touch.touchMovingState )
    {
        if( touch.touchMovingState !== state )
        {
            this.updateTouch( touch, touch.touchMovingState );
            touch.touchMovingState = false;

            gEngine.updateControls();
        }
    }
};


CCControls.prototype.updateTouch = function(touch, state)
{
    var x = touch.rawX;
    var y = touch.rawY;

    this.updateTouchXY( touch, state, x, y );
};


CCControls.prototype.touchBegin = function(index, x, y)
{
    var touch = this.touches[index];
    touch.rawX = x;
    touch.rawY = y;

	this.handleControls( touch, CCControls.touch_pressed );
    this.updateTouch( touch, CCControls.touch_pressed );
    gEngine.updateControls();
};


CCControls.prototype.touchMove = function(index, x, y)
{
    var touch = this.touches[index];
    touch.rawX = x;
    touch.rawY = y;

	this.handleControls( touch, CCControls.touch_moving );
    touch.touchMovingState = CCControls.touch_moving;
};


CCControls.prototype.touchEnd = function(index)
{
    var touches = this.touches;
    for( var i=0; i<touches.length; ++i )
    {
        var touch = touches[i];
        this.handleControls( touch, CCControls.touch_released );
        this.updateTouch( touch, CCControls.touch_released );
    }
    gEngine.updateControls();
};


// Keyboard
CCControls.prototype.keyboardInput = function(character)
{
    var callbacks = this.onKeyboardCallbacks;
    for( var i=0; i<callbacks.length; ++i )
    {
        callbacks[i]( {}, character, true );
    }
};

CCControls.prototype.requestKeyboard = function(callback, popupKeyboard)
{
    this.onKeyboardCallbacks.addOnce( callback );

    if( popupKeyboard )
    {
        CCEngine.NativeUpdateCommands += 'CCControls.requestKeyboard\n';
    }
};


CCControls.prototype.removeKeyboard = function(callback)
{
    this.onKeyboardCallbacks.remove( callback );

    if( this.onKeyboardCallbacks.length === 0 )
    {
        CCEngine.NativeUpdateCommands += 'CCControls.removeKeyboard\n';
    }
};
