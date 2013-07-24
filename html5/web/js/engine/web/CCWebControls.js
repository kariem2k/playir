/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCWebControls.js
 * Description : Controls interface.
 *
 * Created     : 05/11/11
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

var RootWindow = window;
while( RootWindow.parent )
{
    if( RootWindow.parent === RootWindow )
    {
        break;
    }

    try
    {
        if( RootWindow.parent.document )
        {
            RootWindow = RootWindow.parent;
        }
        else
        {
            break;
        }
    }
    catch (e)
    {
        break;
    }
}


// Handles our mouse wheel controls
function CCWheel()
{
    this.delta = 0.0;
}


CCControls.prototype.create = function(table)
{
    this.table = table;

    this.wheel = new CCWheel();

    this.documentScroller = document.documentElement.scrollTop ? document.documentElement : document.body;

    this.tolerance = 0;
    if( BrowserType['mobile'] )
    {
        this.tolerance = 20;
    }

    // Register event handlers
    var self = this;
    {
        // Always register for touches
        document.addEventListener( 'touchstart', function (event)
        {
            self.touchStart( event );
        }, false );

        document.addEventListener( 'touchmove', function (event)
        {
            self.touchMove( event );
        }, false );

        document.addEventListener( 'touchend', function (event)
        {
            self.touchEnd( event );
        }, false );

        document.addEventListener( 'touchcancel', function (event)
        {
        }, false );

        document.addEventListener( 'gesturestart', function (event)
        {
        }, true );

        document.addEventListener( 'gesturechange', function (event)
        {
        }, true );

        document.addEventListener( 'gestureend', function (event)
        {
        }, true );

        // Destop only registrations
        if( !BrowserType['mobile'] )
        {
            document.onmousedown = function(event)
            {
                return self.mouseDown( event );
            };

            document.onmousemove = function(event)
            {
                self.mouseMove( event );
            };

            document.onmouseup = function(event)
            {
                self.mouseUp( event );
            };

            RootWindow.onmousewheel = document.onmousewheel = function (event)
            {
                self.mouseWheel( event );
            };
            if( RootWindow.addEventListener )
            {
                RootWindow.addEventListener( 'DOMMouseScroll', function (event)
                {
                    self.mouseWheel( event );
                }, true );
            }

            RootWindow.onkeydown = function(event)
            {
                return self.keyDown( event );
            };

            RootWindow.onkeyup = function(event)
            {
                return self.keyUp( event );
            };

            RootWindow.addEventListener( "paste", function (e)
            {
                // cancel paste
                e.preventDefault();

                // get text representation of clipboard
                var text = e.clipboardData.getData( "text/plain" );
                self.textInput( text );
            });

            // RootWindow.onkeypress = function(event)
            // {
            //     return self.keyboard( event, false );
            // };

            // RootWindow.onkeyup = function(event)
            // {
            //     return self.keyboard( event, false );
            // };

            // init event handlers
            RootWindow.addEventListener( "dragenter", function (event)
            {
                self.dragEnter( event );
            }, false );

            RootWindow.addEventListener( "dragexit", function (event)
            {
                self.dragExit( event );
            }, false );

            RootWindow.addEventListener( "dragover", function (event)
            {
                self.dragOver( event );
            }, false );

            RootWindow.addEventListener( "drop", function (event)
            {
                self.dragDrop( event );
            }, false );

            // Simulate a back button press?
            window.onhashchange = function(event)
            {
                var newURL = event.newURL;
                if( CC.PendingURLStack && CC.PendingURLStack.length > 0 )
                {
                    var firstPendingURL = CC.PendingURLStack[0];
                    if( newURL === firstPendingURL )
                    {
                        CC.PendingURLStack.safePop();
                        return;
                    }
                }
                if( CC.WindowURL !== event.newURL && !CC.WindowURLUpdatesDisabled )
                {
                    CC.WindowURLUpdatesDisabled = true;
                    while( gEngine.scenes.length > 0 )
                    {
                        gEngine.removeScene( gEngine.scenes.last() );
                    }
                    delete CC.WindowURLUpdatesDisabled;

                    CC.SetWindowURL( event.newURL, true );
                    gEngine.start();
                }
            };
        }
    }

    return this;
};


CCControls.prototype.handleControls = function(touch, state)
{
    var table = this.table;

    // Ensure our touch is within our canvas bounds
    var touchOverTable = this.isOverObject( touch, table );
    if( !touchOverTable )
    {
        state = CCControls.touch_lost;
    }
    else
    {
        // Ensure our touch started in our canvas bounds
        // Might disable in future if we want to support Win8 style slide from outside menus
        if( state === CCControls.touch_moving )
        {
            if( touch.state >= CCControls.touch_released )
            {
                state = CCControls.touch_lost;
            }
        }
    }

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

    if( state === CCControls.touch_pressed )
    {
        this.updateTouch( touch, state );
        gEngine.updateControls();
    }
    else if( state >= CCControls.touch_released )
    {
        this.updateTouch( touch, state );
        gEngine.updateControls();
    }
    else
    {
        touch.touchMovingState = state;
    }

    return touchOverTable;
};


CCControls.prototype.updateTouch = function(touch, state)
{
    var table = this.table;
    var tableDimensions = table.dimensions;
    var x = ( touch.rawX - tableDimensions.x ) / tableDimensions.totalWidth;
    var y = ( touch.rawY - tableDimensions.y ) / tableDimensions.totalHeight;

    this.updateTouchXY( touch, state, x, y );
};


CCControls.prototype.leftClick = function(event)
{
    var leftClick = false;
    if( !event )
    {
        event = RootWindow.event;
    }

    if( !event )
	{
        return false;
	}

    if( event.which )
    {
        leftClick = ( event.which === 1 );
    }
    else if( event.button )
    {
        leftClick = ( event.button === 1 ) || ( event.button === 0 );
    }

    return leftClick;
};


CCControls.prototype.mouseUpdate = function(event)
{
	if( !event )
    {
        event = RootWindow.event;
    }

    var x, y;
    if( event.pageX )
    {
        x = event.pageX;
    }
    else
    {
        x = event.clientX;
        x += this.documentScroller.scrollLeft;
    }

    if( event.mouseY )
    {
        y = event.pageY;
    }
    else
    {
        y = event.clientY;
        y += this.documentScroller.scrollTop;
    }

    var touch = this.touches[0];
    touch.rawX = x;
    touch.rawY = y;
};


CCControls.prototype.touchUpdate = function(event)
{
    var touches = this.touches;
    for( var i=0; i<event.touches.length && i<touches.length; ++i )
    {
        var touchEvent = event.touches[i];
        if( touchEvent )
        {
            var touch = touches[i];
            touch.rawX = touchEvent.clientX;
            touch.rawY = touchEvent.clientY;
        }
    }
};


CCControls.prototype.isOverObject = function(touch, target)
{
	return this.isOverObjectTolerated( touch, target, this.tolerance, this.tolerance );
};


CCControls.prototype.isOverObjectTolerated = function(touch, target, xTolerance, yTolerance)
{
	var dimensions = target.dimensions;
	var table = target.table;
	var x = touch.rawX;
	var y = touch.rawY;

    var x1 = dimensions.x;
    var y1 = dimensions.y;
    var x2 = x1 + dimensions.totalWidth;
    var y2 = y1 + dimensions.totalHeight;

	x1 -= xTolerance;
	y1 -= yTolerance;
	x2 += xTolerance;
	y2 += yTolerance;

	//alert( x + ' ' + y + ' ' + x1 + ' ' + y1 + ' ' + x2 + ' ' + y2 );
    if( x > x1 && x < x2 && y > y1 && y < y2 )
	{
		this.overObject = target;
		return true;
	}

	return false;
};



CCControls.prototype.mouseDown = function(event)
{
    if( !event )
    {
        event = RootWindow.event;
    }
    if( !this.leftClick( event ) )
	{
        return true;
	}
	this.clicking = true;

	this.mouseUpdate( event );

    var touch = this.touches[0];
	if( this.handleControls( touch, CCControls.touch_pressed ) )
    {
        if( event )
        {
            if( event.preventDefault )
            {
                event.preventDefault();
            }
            event.returnValue = false;
        }
        return false;
    }

    return true;
};


CCControls.prototype.touchStart = function(event)
{
	this.touchUpdate( event );

    var touches = this.touches;
    for( var i=0; i<event.touches.length && i<touches.length; ++i )
    {
        var touch = touches[i];
        if( this.handleControls( touch, CCControls.touch_pressed ) )
        {
            event.preventDefault();
        }
    }
};


CCControls.prototype.mouseUp = function(event)
{
    if( !this.leftClick( event ) )
        return;

    var touch = this.touches[0];
    this.handleControls( touch, CCControls.touch_released );
    this.clicking = false;
};


CCControls.prototype.touchEnd = function(event)
{
    var touches = this.touches;
    for( var i=0; i<touches.length; ++i )
    {
        var touch = this.touches[i];
        if( this.handleControls( touch, CCControls.touch_released ) )
        {
            event.preventDefault();
        }
    }
};


CCControls.prototype.mouseMove = function(event)
{
	if( !this.clicking )
        return;

	this.mouseUpdate( event );

    var touch = this.touches[0];
	this.handleControls( touch, CCControls.touch_moving );
};


CCControls.prototype.touchMove = function(event)
{
	this.touchUpdate( event );

    var touches = this.touches;
    for( var i=0; i<event.touches.length && i<touches.length; ++i )
    {
        var touch = touches[i];
        if( this.handleControls( touch, CCControls.touch_moving ) )
        {
            event.preventDefault();
        }
    }
};



// Drag and drop controls
CCControls.prototype.dragEnter = function(event)
{
    event.stopPropagation();
    event.preventDefault();
};


CCControls.prototype.dragExit = function(event)
{
    event.stopPropagation();
    event.preventDefault();
};


CCControls.prototype.dragOver = function(event)
{
    event.stopPropagation();
    event.preventDefault();
};


CCControls.prototype.dragDrop = function(event)
{
    event.stopPropagation();
    event.preventDefault();

    var onDragDropLoad = this.onDragDropLoad;
    var OnLoadFunction = function(file)
    {
        return function(event)
        {
            if( onDragDropLoad )
            {
                for( i=0; i<onDragDropLoad.length; ++i )
                {
                    onDragDropLoad[i]( file, event );
                }
            }
        };
    };

    var OnErrorFunction = function(file)
    {
        return function(event)
        {
            if( onDragDropLoad )
            {
                for( i=0; i<onDragDropLoad.length; ++i )
                {
                    onDragDropLoad[i]( file, event );
                }
            }
        };
    };

    var OnAbortFunction = function(file)
    {
        return function(event)
        {
            if( onDragDropLoad )
            {
                for( i=0; i<onDragDropLoad.length; ++i )
                {
                    onDragDropLoad[i]( file, event );
                }
            }
        };
    };

    var files = event.dataTransfer.files;

    // Inform our listeners of a data transfer coming soon
    if( this.onDragDrop )
    {
        for( i=0; i<this.onDragDrop.length; ++i )
        {
            this.onDragDrop[i]( files, event );
        }
    }

    for( var fileIndex=0; fileIndex<files.length; ++fileIndex )
    {
        var file = files[fileIndex];

        var reader = new FileReader();

        // init the reader event handlers
        reader.onload = new OnLoadFunction( file );
        reader.onerror = new OnErrorFunction( file );
        reader.onabort = new OnAbortFunction( file );

        // begin the read operation
        var fileExtension = file.name.getExtension();
        if( fileExtension === "png" || fileExtension === "jpg" || fileExtension === "jpeg" || fileExtension === "bmp" )
        {
            reader.readAsDataURL( file );
        }
        else if( fileExtension === "fbx" ||
                 fileExtension === "mp3" ||
                 fileExtension === "zip" )
        {
            reader.readAsArrayBuffer( file );
        }
        else
        {
            reader.readAsText( file );
            //reader.readAsBinaryString( file );
        }
    }
};



// Wheel
CCControls.prototype.mouseWheel = function(event)
{
    var delta = 0;

    // For IE
    if( !event )
    {
        event = RootWindow.event;
    }

    // IE/Opera
    if( event.wheelDelta )
    {
        if( BrowserType['chrome'] )
        {
            delta = event.wheelDelta / 360;
        }
        else
        {
            delta = event.wheelDelta / 120;
        }
    }
    else if( event.detail )
    {
        // In Mozilla, sign of delta is different than in IE, also, delta is multiple of 3.
        delta = -event.detail/3;
    }

    this.mouseUpdate( event );
    var touchOverTable = this.isOverObject( this.touches[0], this.table );
    if( touchOverTable )
    {
        this.wheel.delta = delta;
        gEngine.updateControls();
        this.wheel.delta = 0.0;

        if( event.preventDefault )
        {
            event.preventDefault();
        }
        event.returnValue = false;

        this.mouseUpdate( event );
        var touch = this.touches[0];
        this.handleControls( touch, CCControls.touch_released );
        return false;
    }
    return true;
};



// Keyboard
CCControls.prototype.keyDown = function(event, pressed)
{
    var keyCode = event.which;
    this.keys[keyCode] = true;
    return this.keyboardInput( event, true );
};


CCControls.prototype.keyUp = function(event, pressed)
{
    var keyCode = event.which;
    this.keys[keyCode] = false;
};


CCControls.prototype.keyboardInput = function(event, pressed)
{
    if( !event )
    {
        event = RootWindow.event;
    }

    var keyCode = event.which;
    var key;
    if( keyCode === 38 )
    {
        key = "up";
    }
    else if( keyCode === 40 )
    {
        key = "down";
    }
    else if( keyCode === 37 )
    {
        key = "left";
    }
    else if( keyCode === 39 )
    {
        key = "right";
    }

    else if( keyCode === 8 )
    {
        key = "backspace";
    }
    else if( keyCode === 27 )
    {
        key = "escape";
    }
    else if( keyCode === 13 )
    {
        key = "return";
    }
    else if( keyCode === 190 )
    {
        key = ".";
    }
    else if( keyCode === 188 )
    {
        key = ",";
    }
    else if( keyCode === 186 )
    {
        if( event.shiftKey )
        {
            key = ":";
        }
    }
    else if( keyCode === 189 )
    {
        key = "-";
    }
    else if( keyCode === 57 && event.shiftKey )
    {
        key = "(";
    }
    else if( keyCode === 48 && event.shiftKey )
    {
        key = ")";
    }
    else if( keyCode === 49 && event.shiftKey )
    {
        key = "!";
    }
    else if( keyCode === 222 )
    {
        if( event.shiftKey )
        {
            key = "\"";
        }
        else
        {
            key = "'";
        }
    }
    else
    {
        key = String.fromCharCode( keyCode );
        if( !event.shiftKey )
        {
            key = key.toLowerCase();
        }
    }

    var callbacks = this.onKeyboardCallbacks;
    var override = false;
    for( var i=callbacks.length-1; i>=0; --i )
    {
        override = callbacks[i]( event, key, pressed );
        if( override )
        {
            break;
        }
    }

    if( override || key === "backspace" )
    {
        if( event && event.preventDefault )
        {
            event.preventDefault();
        }
        return false;
    }
    else
    {
        // Back button simulation
        if( key === "escape" )
        {
            gEngine.handleBackButton();
        }
    }
    return true;
};


CCControls.prototype.textInput = function(text)
{
    var callbacks = this.onKeyboardCallbacks;

    for( var iText=0; iText<text.length; ++iText )
    {
        var key = text[iText];
        var event = {};
        for( var i=0; i<callbacks.length; ++i )
        {
            callbacks[i]( event, key, true );
        }
    }
};


CCControls.prototype.requestKeyboard = function(callback, popupKeyboard)
{
    this.onKeyboardCallbacks.addOnce( callback );
};


CCControls.prototype.removeKeyboard = function(callback)
{
    this.onKeyboardCallbacks.remove( callback );
};
