/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCVectors.js
 * Description : Contains point respresentative structures.
 *
 * Created     : 20/10/11
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */


// glMatrix extensions
vec3.equals = function(a, b)
{
    return ( a[0] === b[0] && a[1] === b[1] && a[2] === b[2] );
};


vec3.distance = function(from, to, squared)
{
    var difference = vec3.clone( to );
    vec3.subtract( difference, difference, from );
    vec3.scale( difference, difference, 0.5 );

    if( squared )
    {
        return vec3.squaredLength( difference );
    }
    return vec3.length( difference );
};


vec3.unitize = function(vec) {

    var absX = Math.abs( vec[0] );
    var absY = Math.abs( vec[1] );
    var absZ = Math.abs( vec[2] );

    var dividedBy = 1.0;
    if( absX > absY )
    {
        if( absX > absZ )
        {
            dividedBy = 1.0 / absX;
        }
        else
        {
            dividedBy = 1.0 / absZ;
        }
    }
    else if( absY > absZ )
    {
        dividedBy = 1.0 / absY;
    }
    else
    {
        dividedBy = 1.0 / absZ;
    }

    vec[0] *= dividedBy;
    vec[1] *= dividedBy;
    vec[2] *= dividedBy;
    return vec;
};


vec3.fromString = function(string)
{
    var vector = vec3.create();

    var split = string.split( "," );
    if( split.length === 3 )
    {
        vector[0] = parseFloat( split[0] );
        vector[1] = parseFloat( split[1] );
        vector[2] = parseFloat( split[2] );
    }

    return vector;
};


vec3.toString = function(vector)
{
    var string = "";
    string += vector[0];
    string += ",";
    string += vector[1];
    string += ",";
    string += vector[2];

    return string;
};


mat4.multiplyVec4 = function(mat, vec, dest) {
    if(!dest) { dest = vec; }

    var x = vec[0], y = vec[1], z = vec[2], w = vec[3];

    dest[0] = mat[0]*x + mat[4]*y + mat[8]*z + mat[12]*w;
    dest[1] = mat[1]*x + mat[5]*y + mat[9]*z + mat[13]*w;
    dest[2] = mat[2]*x + mat[6]*y + mat[10]*z + mat[14]*w;
    dest[3] = mat[3]*x + mat[7]*y + mat[11]*z + mat[15]*w;

    return dest;
};




function CCSize(width, height)
{
    this.width = this.height = 0.0;

    if( width )
    {
        this.width = width;
    }

    if( height )
    {
        this.height = height;
    }
}



function CCPoint(x, y)
{
    if( !x )
    {
        x = 0.0;
    }

    if( !y )
    {
        y = x;
    }

    this.x = x;
    this.y = y;
}



function CCMinMax()
{
    this.reset();
}


CCMinMax.prototype.reset = function()
{
    this.min = CC_MAXFLOAT;
    this.max = -CC_MAXFLOAT;
};


CCMinMax.prototype.consider = function(value)
{
    this.min = Math.min( this.min, value );
    this.max = Math.max( this.max, value );
};


CCMinMax.prototype.size = function()
{
    return this.max - this.min;
};



// A colour vector
function CCColour(r, g, b, a)
{
    if( r !== undefined )
    {
        // If we have all three componenets, we treat them as individual values
        if( g !== undefined && b !== undefined )
        {
            this.setRGBA( r, g, b, a );
        }

        // If we only have one component, we treat it as colour/alpha
        else
        {
            this.set( r, g );
        }
    }

    // No input, we make it white
    else
    {
        this.white();
    }
}


CCColour.prototype.equals = function(colour)
{
    return this.r === colour.r && this.g === colour.g && this.b === colour.b & this.a === colour.a;
};


CCColour.prototype.white = function()
{
    this.setRGBA( 1.0, 1.0, 1.0, 1.0 );
	return this;
};


CCColour.prototype.set = function(colour, alpha)
{
    if( typeof( colour ) === "number" )
    {
        this.setRGBA( colour, colour, colour, alpha );
    }
    else
    {
        this.setRGBA( colour.r, colour.g, colour.b, colour.a );
    }
    return this;
};


CCColour.prototype.setRGBA = function(r, g, b, a)
{
    if( a === undefined )
    {
        a = 1.0;
    }

    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
    return this;
};


CCColour.prototype.setInt = function(r, g, b, a)
{
    // If we don't have a b, it means we passed in a grey into the r channel
    if( b === undefined )
    {
        a = g;
        b = r;
        g = r;
    }

    if( a === undefined )
    {
        a = 1.0;
    }

	var multiple = 1.0 / 255.0;
	this.setRGBA( r * multiple, g * multiple, b * multiple, a );
	return this;
};


CCColour.prototype.toString = function()
{
    var string = "";
    string += this.r;
    string += ",";
    string += this.g;
    string += ",";
    string += this.b;
    string += ",";
    string += this.a;
    return string;
};


CCColour.prototype.fromString = function(string)
{
    if( string && string.length > 0 )
    {
        var colourSplit = string.split( "," );
        if( colourSplit.length > 0 )
        {
            if( colourSplit[0].length > 0 )
            {
                this.r = CC.FloatClamp( parseFloat( colourSplit[0] ), 0.0, 1.0 );
            }
        }
        if( colourSplit.length > 1 )
        {
            if( colourSplit[1].length > 0 )
            {
                this.g = CC.FloatClamp( parseFloat( colourSplit[1] ), 0.0, 1.0 );
            }
        }
        if( colourSplit.length > 2 )
        {
            if( colourSplit[2].length > 0 )
            {
                this.b = CC.FloatClamp( parseFloat( colourSplit[2] ), 0.0, 1.0 );
            }
        }
        if( colourSplit.length > 3 )
        {
            if( colourSplit[3].length > 0 )
            {
                this.a = CC.FloatClamp( parseFloat( colourSplit[3] ), 0.0, 1.0 );
            }
        }
    }
    return this;
};


var gColour = new CCColour();



function CCVector3Target()
{
	this.current = vec3.create();
	this.target = vec3.create();
}


CCVector3Target.prototype.equals = function()
{
	return vec3.equals( this.current, this.target );
};
