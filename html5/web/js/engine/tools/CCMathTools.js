/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCVectors.js
 * Description : Collection of math tools.
 *
 * Created     : 29/10/11
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

var CC_SMALLFLOAT = 0.01;
var CC_MAXFLOAT = 1000000000;
var CC_PI = Math.PI;
var CC_HPI = CC_PI * 0.5;


CC.DEGREES_TO_RADIANS = function(angle)
{
	return CC_PI * angle / 180.0;
};


CC.RADIANS_TO_DEGREES = function(angle)
{
    return 180.0 * angle / CC_PI;
};


CC.SQUARE = function(value)
{
    return value * value;
};


CC.Random = function(amount)
{
    if( !amount )
    {
        amount = 100000;
    }

    // Value between 0 - amount
	var random = Math.random();
	var randomInt = Math.round( random * amount );
	return randomInt;
};


CC.RandomDualInt = function()
{
	return CC.Random( 1 ) * 2 - 1;
};


// Float operations
CC.FloatRandom = function()
{
    var random = Math.random();
    return random;
};


CC.FloatRandomDualSided = function()
{
    return ( CC.FloatRandom() - 0.5 ) * 2.0;
};


CC.FloatClamp = function(value, min, max)
{
    value = Math.min( max, value );
    value = Math.max( min, value );
    return value;
};


CC.FloatLimitPrecision = function(value, precision)
{
    if( !precision )
    {
        precision = 2;
    }
    return value.toFixed ? Number( value.toFixed( precision ) ) : value;
    //return Math.round( value * 100 ) / 100;
};


CC.ToTarget = function(current, target, speed)
{
    if( current < target )
    {
        current += speed;
        if( current > target )
        {
            current = target;
        }
    }
    else
    {
        current -= speed;
        if( current < target )
        {
            current = target;
        }
    }
    return current;
};


CC.ToRotation = function(current, target, amount)
{
    var incrementRotation = target - current;
    incrementRotation = CC.ClampRotation( incrementRotation );

    var decrementRotation = current - target;
    decrementRotation = CC.ClampRotation( decrementRotation );

    if( decrementRotation < incrementRotation )
    {
        if( target > current )
        {
            target -= 360.0;
        }

        current -= amount;
        current = current < target ? target : current;
    }
    else if( decrementRotation > incrementRotation )
    {
        if( target < current )
        {
            target += 360.0;
        }

        current += amount;
        current = current > target ? target : current;
    }
    else
    {
        // Rotate clockwise towards target if equal distance?
        if( target > current )
        {
            if( target > current )
            {
                target -= 360.0;
            }

            current -= amount;
            current = current < target ? target : current;
        }
        else
        {
            if( target < current )
            {
                target += 360.0;
            }

            current += amount;
            current = current > target ? target : current;
        }
    }

    current = CC.ClampRotation( current );
    return current;
};


CC.Distance = function(first, second)
{
    return Math.abs( first - second );
};


CC.DistanceBetweenAngles = function(first, second)
{
    var distance1 = first - second;
    var distance2 = second - first;
    distance1 = CC.ClampRotation( distance1 );
    distance2 = CC.ClampRotation( distance2 );

    return distance1 < distance2 ? distance1 : distance2;
};


CC.ClampRotation = function(rotation)
{
    while( rotation >= 360.0 )
    {
        rotation -= 360.0;
    }

    while( rotation < 0.0 )
    {
        rotation += 360.0;
    }

    return rotation;
};


CC.Vector3RotateAboutX = function(rotatedPosition, rotation, from, about)
{
    // Move to origin
    var y = from[1] - about[1];
    var z = from[2] - about[2];

    var rotationInRadians = CC.DEGREES_TO_RADIANS( rotation );
    var cosAngle = Math.cos( rotationInRadians );
    var sinAngle = Math.sin( rotationInRadians );

    rotatedPosition[1] = ( y * cosAngle ) - ( z * sinAngle );
    rotatedPosition[2] = ( y * sinAngle ) + ( z * cosAngle );

    rotatedPosition[1] += about[1];
    rotatedPosition[2] += about[2];
};


CC.Vector3RotateY = function(rotatedPosition, rotation)
{
    var x = rotatedPosition[0];
    var z = rotatedPosition[2];

    var rotationInRadians = CC.DEGREES_TO_RADIANS( rotation );
    var cosAngle = Math.cos( rotationInRadians );
    var sinAngle = Math.sin( rotationInRadians );

    rotatedPosition[0] = ( x * cosAngle ) + ( z * sinAngle );
    rotatedPosition[2] = -( x * sinAngle ) + ( z * cosAngle );
};


CC.Vector3RotateAboutY = function(rotatedPosition, rotation, from, about)
{
    // Move to origin
    var x = from[0] - about[0];
    var z = from[2] - about[2];

    var rotationInRadians = CC.DEGREES_TO_RADIANS( rotation );
    var cosAngle = Math.cos( rotationInRadians );
    var sinAngle = Math.sin( rotationInRadians );

    rotatedPosition[0] = ( x * cosAngle ) + ( z * sinAngle );
    rotatedPosition[2] = -( x * sinAngle ) + ( z * cosAngle );

    rotatedPosition[0] += about[0];
    rotatedPosition[2] += about[2];
};


CC.RotateXAboutY = function(x, z, cosAngle, sinAngle)
{
    return ( x * cosAngle ) + ( z * sinAngle );
};


CC.RotateZAboutY = function(x, z, cosAngle, sinAngle)
{
    return -( x * sinAngle ) + ( z * cosAngle );
};


CC.RotatePoint = function(point, rotation)
{
    var x = point.x;
    var y = point.y;

    var rotationInRadians = CC.DEGREES_TO_RADIANS( rotation );
    var cosAngle = Math.cos( rotationInRadians );
    var sinAngle = Math.sin( rotationInRadians );

    point.x = ( x * cosAngle ) + ( y * sinAngle );
    point.y = -( x * sinAngle ) + ( y * cosAngle );
};


CC.AngleTowards = function(fromX, fromZ, toX, toZ)
{
    var y = fromX - toX;
    var x = fromZ - toZ;

    var angle = CC.RADIANS_TO_DEGREES( Math.atan2( y, x ) );
    angle = CC.ClampRotation( angle );

    return angle;
};


CC.AngleTowardsVector = function(from, to)
{
    return CC.AngleTowards( from[0], from[2], to[0], to[2] );
};


CC.Vector3Magnitude = function(vector, squared)
{
    if( squared === undefined )
    {
        squared = true;
    }

    if( squared )
    {
        return vec3.squaredLength( vector );
    }
    return vec3.length( vector );
};


CC.Vector3Distance = function(from, to, squared)
{
    if( squared === undefined )
    {
        squared = true;
    }

    var difference = vec3.create( to );
    vec3.subtract( difference, difference, from );
    vec3.scale( difference, difference, 0.5 );

    return CC.Vector3Magnitude( difference, squared );
};


CC.Vector3Distance2D = function(from, to, squared)
{
    if( squared === undefined )
    {
        squared = true;
    }

    var differenceX = from[0] - to[0];
    var differenceZ = from[2] - to[2];

    var result = differenceX * differenceX + differenceZ * differenceZ;
    return squared ? result : Math.sqrt( result );
};


CC.Vector3Direction = function(start, end)
{
    var result = vec3.create();
    result[0] = end[0] - start[0];
    result[1] = end[1] - start[1];
    result[2] = end[2] - start[2];
    vec3.normalize( result, result );
    return result;
};


CC.tmpMatrix = mat4.create();
CC.MatrixMultiply = function(result, srcA, srcB)
{
    var tmp = CC.tmpMatrix;
    for( var i=0; i<16; i+=4 )
    {
        tmp[i+0] = (srcA[i+0] * srcB[0]) + (srcA[i+1] * srcB[4+0]) + (srcA[i+2] * srcB[8+0]) + (srcA[i+3] * srcB[12+0]);
        tmp[i+1] = (srcA[i+0] * srcB[1]) + (srcA[i+1] * srcB[4+1]) + (srcA[i+2] * srcB[8+1]) + (srcA[i+3] * srcB[12+1]);
        tmp[i+2] = (srcA[i+0] * srcB[2]) + (srcA[i+1] * srcB[4+2]) + (srcA[i+2] * srcB[8+2]) + (srcA[i+3] * srcB[12+2]);
        tmp[i+3] = (srcA[i+0] * srcB[3]) + (srcA[i+1] * srcB[4+3]) + (srcA[i+2] * srcB[8+3]) + (srcA[i+3] * srcB[12+3]);
    }
	mat4.copy( result, tmp );
};


CC.MatrixRotateDegrees = function(result, angle, x, y, z)
{
	angle = -angle;
    var mag = Math.sqrt(x * x + y * y + z * z);

    var sinAngle = Math.sin( angle * CC_PI / 180.0 );
    var cosAngle = Math.cos( angle * CC_PI / 180.0 );
    if ( mag > 0.0 )
    {
        var xx, yy, zz, xy, yz, zx, xs, ys, zs;
        var rotMat = mat4.create();

        x /= mag;
        y /= mag;
        z /= mag;

        xx = x * x;
        yy = y * y;
        zz = z * z;
        xy = x * y;
        yz = y * z;
        zx = z * x;
        xs = x * sinAngle;
        ys = y * sinAngle;
        zs = z * sinAngle;
        var oneMinusCos = 1.0 - cosAngle;

        rotMat[0*4+0] = (oneMinusCos * xx) + cosAngle;
        rotMat[0*4+1] = (oneMinusCos * xy) - zs;
        rotMat[0*4+2] = (oneMinusCos * zx) + ys;
        rotMat[0*4+3] = 0.0;

        rotMat[1*4+0] = (oneMinusCos * xy) + zs;
        rotMat[1*4+1] = (oneMinusCos * yy) + cosAngle;
        rotMat[1*4+2] = (oneMinusCos * yz) - xs;
        rotMat[1*4+3] = 0.0;

        rotMat[2*4+0] = (oneMinusCos * zx) - ys;
        rotMat[2*4+1] = (oneMinusCos * yz) + xs;
        rotMat[2*4+2] = (oneMinusCos * zz) + cosAngle;
        rotMat[2*4+3] = 0.0;

        rotMat[3*4+0] = 0.0;
        rotMat[3*4+1] = 0.0;
        rotMat[3*4+2] = 0.0;
        rotMat[3*4+3] = 1.0;

        CC.MatrixMultiply( result, rotMat, result );
    }
};
