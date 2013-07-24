/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCInterpolators.js
 * Description : Interpolators for various curves.
 *
 * Created     : 30/04/11
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

function CCVarPointer(inValue)
{
    this.value = inValue;
}



function CCInterpolator()
{
    this.construct();
}


CCInterpolator.prototype.construct = function()
{
    this.speed = 1.0;
    this.onInterpolated = [];

    this.updating = false;
};


CCInterpolator.prototype.setDuration = function(duration)
{
    this.speed = 1.0/duration;
};


CCInterpolator.prototype.finish = function()
{
    this.update( CC_MAXFLOAT );
};



function CCInterpolatorSin2Curve()
{
    this.construct();
}
ExtendPrototype( CCInterpolatorSin2Curve, CCInterpolator );


CCInterpolatorSin2Curve.prototype.construct = function()
{
	this.CCInterpolator_construct();

    this.interpolationCurveMultiple = 1 / Math.sin( 2 );

    this.current = false;
    this.target = undefined;
    this.start = undefined;
    this.length = undefined;
    this.amount = 1.0;
};


CCInterpolatorSin2Curve.prototype.setup = function(inCurrent, inTarget)
{
    if( this.current !== inCurrent || this.target !== inTarget )
    {
        this.current = inCurrent;
        this.target = inTarget;

        this.ready();
    }
    else if( this.current.value === this.target )
    {
        this.amount = 1.0;
    }

    this.updating = true;
};


CCInterpolatorSin2Curve.prototype.ready = function()
{
    this.start = this.current.value;
    this.length = this.target - this.start;
    if( this.current.value === this.target )
    {
        this.amount = 1.0;
    }
    else
    {
        this.amount = 0.0;
    }

    this.updating = true;
};


CCInterpolatorSin2Curve.prototype.incrementAmount = function(delta)
{
    if( this.amount !== 1.0 )
    {
        this.amount = CC.ToTarget( this.amount, 1.0, delta * this.speed );
        return true;
    }
    return false;
};


CCInterpolatorSin2Curve.prototype.calculatePercentage = function()
{
    var percentage = Math.sin( this.amount * 2.0 ) * this.interpolationCurveMultiple;
    return percentage;
};


CCInterpolatorSin2Curve.prototype.updateInterpolation = function(percentage)
{
    var movement = this.length * percentage;
    this.current.value = movement + this.start;
};


CCInterpolatorSin2Curve.prototype.update = function(delta)
{
    this.updating = false;

    var current = this.current;
    if( current )
    {
        if( this.incrementAmount( delta ) )
        {
            var percentage = this.calculatePercentage();
            this.updateInterpolation( percentage );
            this.updating = true;
        }
        else if( current.value !== this.target )
        {
            current.value = this.target;
            this.current = false;
            this.updating = true;
        }
        else
        {
            this.current = false;
        }
    }
    else
    {
        var onInterpolated = this.onInterpolated;
        var length = onInterpolated.length;
        if( length > 0 )
        {
            var i;

            var pendingCallbacks = [];
            for( i=0; i<length; ++i )
            {
                pendingCallbacks.add( onInterpolated[i] );
            }
            onInterpolated.length = 0;

            for( i=0; i<length; ++i )
            {
                pendingCallbacks[i].run();
            }
        }
    }
    return this.updating;
};


CCInterpolatorSin2Curve.prototype.equals = function(inCurrent, inTarget)
{
    // Ignore if we're already doing this
    if( this.current === inCurrent && this.target === inTarget )
    {
        return true;
    }
    return false;
};



// CCInterpolatorX2Curve
function CCInterpolatorX2Curve()
{
    this.construct();
}
ExtendPrototype( CCInterpolatorX2Curve, CCInterpolatorSin2Curve, true );


CCInterpolatorX2Curve.prototype.calculatePercentage = function()
{
    var percentage = this.amount * this.amount;
    return percentage;
};


function CCInterpolatorX3Curve()
{
    this.construct();
}
ExtendPrototype( CCInterpolatorX3Curve, CCInterpolatorSin2Curve, true );


CCInterpolatorX3Curve.prototype.calculatePercentage = function()
{
    var sudoAmount = this.amount - 1.0;
    var percentage = 1.0 + ( sudoAmount * sudoAmount * sudoAmount );
    return percentage;
};



// An interpolator which handles interpolating a vec3
function CCInterpolatorV3(type)
{
	this.type = type;
	this.construct();
}
ExtendPrototype( CCInterpolatorV3, CCInterpolator );


CCInterpolatorV3.prototype.construct = function()
{
	this.CCInterpolator_construct();

    this.xPointer = new CCVarPointer();
    this.yPointer = new CCVarPointer();
    this.zPointer = new CCVarPointer();
    this.x = new this.type();
    this.y = new this.type();
    this.z = new this.type();

	this.onInterpolated = [];
};


CCInterpolatorV3.prototype.setup = function(inCurrent, inTarget, inCallback)
{
    if( typeof( inTarget ) === "number" )
    {
        inTarget = vec3.clone( [ inTarget, inTarget, inTarget ] );
    }
    this.current = inCurrent;
    this.xPointer.value = inCurrent[0];
    this.yPointer.value = inCurrent[1];
    this.zPointer.value = inCurrent[2];

	inTarget = inTarget ? inTarget : inCurrent;
	this.setTarget( inTarget, inCallback );

	return this;
};


CCInterpolatorV3.prototype.setTarget = function(inTarget, inCallback)
{
    this.x.setup( this.xPointer, inTarget[0] );
    this.y.setup( this.yPointer, inTarget[1] );
    this.z.setup( this.zPointer, inTarget[2] );

	this.onInterpolated.length = 0;
	if( inCallback )
	{
		this.onInterpolated.push( inCallback );
	}

    this.updating = true;
};


CCInterpolatorV3.prototype.ready = function()
{
    this.xPointer.value = this.current[0];
    this.yPointer.value = this.current[1];
    this.zPointer.value = this.current[2];

    this.x.ready();
    this.y.ready();
    this.z.ready();

    this.updating = true;
};


CCInterpolatorV3.prototype.update = function(delta)
{
    var deltaSpeed = delta * this.speed;
    this.updating = this.x.update( deltaSpeed );
    this.updating |= this.y.update( deltaSpeed );
    this.updating |= this.z.update( deltaSpeed );

    if( this.updating )
    {
        this.current[0] = this.xPointer.value;
        this.current[1] = this.yPointer.value;
        this.current[2] = this.zPointer.value;
    }
	else
	{
        var onInterpolated = this.onInterpolated;
        var length = onInterpolated.length;
        if( length > 0 )
        {
            var i;

            var pendingCallbacks = [];
            for( i=0; i<length; ++i )
            {
                pendingCallbacks.push( onInterpolated[i] );
            }
            onInterpolated.length = 0;

            for( i=0; i<length; ++i )
            {
                pendingCallbacks[i]();
            }
        }
	}

    return this.updating;
};


CCInterpolatorV3.prototype.equals = function(inCurrent, inTarget)
{
    if( this.x.equals( inCurrent[0], inTarget[0] ) &&
        this.y.equals( inCurrent[1], inTarget[1] ) &&
        this.z.equals( inCurrent[2], inTarget[2] ) )
    {
        return true;
    }
    return false;
};


CCInterpolatorV3.prototype.getAmount = function(delta)
{
    return vec3.clone( [ this.x.amount, this.y.amount, this.z.amount ] );
};


CCInterpolatorV3.prototype.getTarget = function(delta)
{
    return vec3.clone( [ this.x.target, this.y.target, this.z.target ] );
};



// A list of interpolators
function CCInterpolatorListV3(type)
{
	this.type = type ? type : CCInterpolatorSin2Curve;
	this.construct();
    this.interpolators = [];
}
ExtendPrototype( CCInterpolatorListV3, CCInterpolator );


CCInterpolatorListV3.prototype.clear = function()
{
    this.interpolators.length = 0;
};


CCInterpolatorListV3.prototype.pushV3 = function(inCurrent, inTarget, replace, inCallback)
{
    this.updating = true;

    var i, interpolator;

    var interpolators = this.interpolators;
    if( interpolators.length > 0 )
    {
        if( replace )
        {
            var found = false;
            for( i=0; i<interpolators.length; ++i )
            {
                interpolator = interpolators[i];
                if( interpolator.equals( inCurrent, inTarget ) )
                {
                    found = true;
                    interpolator.onInterpolated.push( inCallback );

                    if( i !== 0 )
                    {
                        interpolator.ready();
                    }
                }
                else
                {
                    interpolators.splice( i, 1 );
                }
            }

            if( found )
            {
                return false;
            }
        }
        else
        {
            for( i=0; i<interpolators.length; ++i )
            {
                interpolator = interpolators[i];
                if( interpolator.equals( inCurrent, inTarget ) )
                {
                    return false;
                }
            }
        }
    }

    if( inCurrent !== inTarget )
    {
        interpolator = new CCInterpolatorV3( this.type ).setup( inCurrent, inTarget, inCallback );
        interpolators.push( interpolator );
    }
    return true;
};


CCInterpolatorListV3.prototype.update = function(delta)
{
    this.updating = false;

    var interpolators = this.interpolators;
    if( interpolators.length > 0 )
    {
        var interpolator = interpolators[0];
        if( !interpolator.update( delta * this.speed ) )
        {
            interpolators.splice( 0, 1 );

            // If there's another interpolation planned, tell it to ready itself to interpolate
            if( interpolators.length > 0 )
            {
                interpolators[0].ready();
            }
            else
            {
                return false;
            }
        }
        this.updating = true;
    }
    return this.updating;
};


CCInterpolatorListV3.prototype.finished = function()
{
    return this.interpolators.length === 0;
};


CCInterpolatorListV3.prototype.getTarget = function()
{
    if( this.interpolators.length > 0 )
    {
        return this.interpolators.last().getTarget();
    }
    return vec3.create();
};



// An interpolator for interpolating colours
function CCInterpolatorColour(type)
{
	this.type = type ? type : CCInterpolatorX2Curve;
	this.construct();
}
ExtendPrototype( CCInterpolatorColour, CCInterpolator );


CCInterpolatorColour.prototype.construct = function()
{
	this.CCInterpolator_construct();

    this.rPointer = new CCVarPointer();
    this.gPointer = new CCVarPointer();
    this.bPointer = new CCVarPointer();
    this.aPointer = new CCVarPointer();
    this.r = new this.type();
    this.g = new this.type();
    this.b = new this.type();
    this.a = new this.type();

	this.onInterpolated = [];
};


CCInterpolatorColour.prototype.equals = function(inCurrent, inTarget)
{
	if( this.x.equals( inCurrent.r, inTarget.r ) &&
		this.y.equals( inCurrent.g, inTarget.g ) &&
		this.z.equals( inCurrent.b, inTarget.b ) &&
		this.a.equals( inCurrent.a, inTarget.a ) )
	{
		return true;
	}
	return false;
};


CCInterpolatorColour.prototype.setup = function(inCurrent, inTarget, inCallback)
{
    this.current = inCurrent;
    this.rPointer.value = inCurrent.r;
    this.gPointer.value = inCurrent.g;
    this.bPointer.value = inCurrent.b;
    this.aPointer.value = inCurrent.a;

	inTarget = inTarget ? inTarget : inCurrent;
	this.setTarget( inTarget, inCallback );

	return this;
};


CCInterpolatorColour.prototype.setTarget = function(inTarget, inCallback)
{
    this.r.setup( this.rPointer, inTarget.r );
    this.g.setup( this.gPointer, inTarget.g );
    this.b.setup( this.bPointer, inTarget.b );
    this.a.setup( this.aPointer, inTarget.a );

	this.onInterpolated.length = 0;
	if( inCallback )
	{
		this.onInterpolated.push( inCallback );
	}

    this.updating = true;
};


CCInterpolatorColour.prototype.setTargetAlpha = function(inTargetAlpha, inCallback)
{
    this.a.setup( this.aPointer, inTargetAlpha );

	this.onInterpolated.length = 0;
	if( inCallback )
	{
		this.onInterpolated.push( inCallback );
	}

    this.updating = true;
};


CCInterpolatorColour.prototype.ready = function()
{
    this.rPointer.value = this.current.r;
    this.gPointer.value = this.current.g;
    this.bPointer.value = this.current.b;
    this.aPointer.value = this.current.a;

    this.r.ready();
    this.g.ready();
    this.b.ready();
    this.a.ready();

    this.updating = true;
};


CCInterpolatorColour.prototype.update = function(delta)
{
    var deltaSpeed = delta * this.speed;
    this.updating = this.r.update( deltaSpeed );
    this.updating |= this.g.update( deltaSpeed );
    this.updating |= this.b.update( deltaSpeed );
    this.updating |= this.a.update( deltaSpeed );

    if( this.updating )
    {
        this.current.r = this.rPointer.value;
        this.current.g = this.gPointer.value;
        this.current.b = this.bPointer.value;
        this.current.a = this.aPointer.value;
    }
	else
	{
		var onInterpolated = this.onInterpolated;
        var length = onInterpolated.length;
        if( length > 0 )
        {
            var i;

            var pendingCallbacks = [];
            for( i=0; i<length; ++i )
            {
                pendingCallbacks.push( onInterpolated[i] );
            }
            onInterpolated.length = 0;

            for( i=0; i<length; ++i )
            {
                pendingCallbacks[i]();
            }
        }
	}

    return this.updating;
};


CCInterpolatorColour.prototype.getTarget = function()
{
    var target = new CCColour();
    target.r = this.r.target;
    target.g = this.g.target;
    target.b = this.b.target;
    target.a = this.a.target;
    return target;
};



// CCTimer
function CCTimer()
{
    this.time = 0.0;
    this.updating = false;
    this.interval = 0.0;
    this.onTime = [];
}


CCTimer.prototype.update = function(delta)
{
    if( this.updating )
    {
        var real = gEngine.timeReal;
        this.time -= real;
        if( this.time <= 0.0 )
        {
            this.updating = false;
        }
        return true;
    }
    return false;
};


CCTimer.prototype.finish = function()
{
    this.onTime.emit();
};


CCTimer.prototype.start = function(timeout)
{
    this.interval = timeout;
    this.restart();
};


CCTimer.prototype.stop = function()
{
    this.updating = false;
};


CCTimer.prototype.restart = function()
{
    this.time = this.interval;
    this.updating = true;
};
