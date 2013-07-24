/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCPrimitive3D.js
 * Description : 3d model base primitive
 *
 * Created     : 11/07/13
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

function CCPrimitive3D()
{
	this.construct();
}
ExtendPrototype( CCPrimitive3D, CCPrimitiveBase );


CCPrimitive3D.prototype.construct = function()
{
    if( CCPrimitive3D.Objects )
    {
        CCPrimitive3D.Objects.add( this );
    }

	this.CCPrimitiveBase_construct();

	this.vertexCount = 0;

    this.width = this.height = this.depth = 0.0;
    this.mmX = new CCMinMax();
    this.mmY = new CCMinMax();
    this.mmZ = new CCMinMax();

    this.cached = false;
    this.movedToOrigin = false;
    this.origin = vec3.create();
};


CCPrimitive3D.prototype.destruct = function()
{
    if( CCPrimitive3D.Objects )
    {
        CCPrimitive3D.Objects.remove( this );
    }

    if( !this.cached )
    {
        if( this.vertexPositionBuffer )
        {
            gRenderer.CCDeleteVertexBuffer( this.vertexPositionBuffer );
        }
    }

    if( this.vertexTextureBuffer )
    {
        gRenderer.CCDeleteVertexBuffer( this.vertexTextureBuffer );
    }

	this.CCPrimitiveBase_destruct();
};


CCPrimitive3D.prototype.load = function(filename, url, priority, callback)
{
    this.filename = filename;

	var self = this;
	gURLManager.requestURL( url,
        null,
        function(status, responseText)
        {
            if( status >= CCURLRequest.Succeeded )
            {
                self.loadData( responseText, callback );
            }
            else
            {
                callback( false );
            }
        },
        priority,
        filename );
};


CCPrimitive3D.prototype.loadData = function(fileData, callback)
{
    if( callback )
    {
        callback( false );
    }
};


CCPrimitive3D.prototype.getWidth = function()
{
    return this.width;
};


CCPrimitive3D.prototype.getHeight = function()
{
	return this.height;
};


CCPrimitive3D.prototype.getDepth = function()
{
	return this.depth;
};


CCPrimitive3D.prototype.getYMinMax = function()
{
	return this.mmY;
};


CCPrimitive3D.prototype.getYMinMaxAtZ = function(atZ, callback)
{
	var mmYAtZ = new CCMinMax();

    var vertices = this.vertices;
    var vertexCount = this.vertexCount;
    for( var i=0; i<vertexCount; ++i )
    {
        var index = i*3;
        var y = vertices[index+1];
        var z = vertices[index+2];

        if( z >= atZ )
        {
            mmYAtZ.consider( y );
        }
    }

    callback( mmYAtZ );
};


CCPrimitive3D.prototype.getZMinMax = function()
{
	return this.mmZ;
};


CCPrimitive3D.prototype.getOrigin = function()
{
	if( !this.movedToOrigin )
    {
        var origin = this.origin;
        origin[0] = this.mmX.min + ( this.width * 0.5 );
        origin[1] = this.mmY.min + ( this.height * 0.5 );
        origin[2] = this.mmZ.min + ( this.depth * 0.5 );
    }
    return this.origin;
};


CCPrimitive3D.prototype.moveVerticesToOrigin = function(callback)
{
    if( !this.movedToOrigin )
    {
        var origin = this.getOrigin();

        var mmX = this.mmX;
        var mmY = this.mmY;
        var mmZ = this.mmZ;

		mmX.reset();
        mmY.reset();
        mmZ.reset();

        var vertices = this.vertices;
        var vertexCount = this.vertexCount;
        for( var i=0; i<vertexCount; ++i )
        {
            var index = i*3;
            var x = index+0;
            var y = index+1;
            var z = index+2;

            vertices[x] -= origin[0];
            vertices[y] -= origin[1];
            vertices[z] -= origin[2];

            mmX.consider( vertices[x] );
            mmY.consider( vertices[y] );
            mmZ.consider( vertices[z] );
        }

        gRenderer.CCUpdateVertexBuffer( this.vertexPositionBuffer, vertices );

        this.movedToOrigin = true;
    }

    if( callback )
    {
        callback();
    }
};


CCPrimitive3D.prototype.hasMovedToOrigin = function()
{
	return this.movedToOrigin;
};