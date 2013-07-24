/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCRenderable.js
 * Description : A renderable component.
 *
 * Created     : 23/10/11
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

function CCRenderable()
{
	this.construct();
}
CCRenderable.NextID = 0;


CCRenderable.prototype.construct = function()
{
    this.jsID = CCRenderable.NextID++;

    this.modelMatrix = mat4.create();
    this.position = vec3.create();
    this.rotation = vec3.create();
    this.scale = vec3.clone( [ 1, 1, 1 ] );

    this.colour = null;

	this.shouldRender = true;
    this.dirtyModelMatrix();
};


CCRenderable.prototype.destruct = function()
{
};


CCRenderable.prototype.dirtyModelMatrix = function()
{
    gRenderer.pendingRender = true;
	this.updateModelMatrix = true;
};


CCRenderable.prototype.refreshModelMatrix = function()
{
	if( this.updateModelMatrix )
    {
        this.updateModelMatrix = false;

        CCRenderer.ModelMatrixIdentity( this );

        CCRenderer.ModelMatrixTranslate( this, this.position );

        CCRenderer.ModelMatrixScale( this, this.scale );

        var rotation = this.rotation;
        CCRenderer.ModelMatrixRotate( this, rotation[0], [ 1.0, 0.0, 0.0 ] );
        CCRenderer.ModelMatrixRotate( this, rotation[1], [ 0.0, 1.0, 0.0 ] );
        CCRenderer.ModelMatrixRotate( this, rotation[2], [ 0.0, 0.0, 1.0 ] );
    }
};


CCRenderable.prototype.setPosition = function(vector)
{
    this.setPositionXYZ( vector[0], vector[1], vector[2] );
};


CCRenderable.prototype.setPositionXYZ = function(x, y, z)
{
    var position = this.position;
    position[0] = x;
    position[1] = y;
    position[2] = z;
    this.dirtyModelMatrix();

    if( CCEngine.NativeUpdateCommands !== undefined )
    {
        CCEngine.NativeUpdateCommands += 'CCRenderable.setPositionXYZ;' + this.jsID + ';' + position[0] + ';' + position[1] + ';' + position[2] + '\n';
    }
};


CCRenderable.prototype.setPositionX = function(x)
{
	this.setPositionXYZ( x, this.position[1], this.position[2] );
};


CCRenderable.prototype.setPositionY = function(y)
{
    this.setPositionXYZ( this.position[0], y, this.position[2] );
};


CCRenderable.prototype.setPositionZ = function(z)
{
    this.setPositionXYZ( this.position[0], this.position[1], z );
};


CCRenderable.prototype.setPositionXY = function(x, y)
{
    this.setPositionXYZ( x, y, this.position[2] );
};


CCRenderable.prototype.setPositionXZ = function(x, z)
{
    this.setPositionXYZ( x, this.position[1], z );
};


CCRenderable.prototype.setPositionYZ = function(y, z)
{
    this.setPositionXYZ( this.position[0], y, z );
};


CCRenderable.prototype.translate = function(x, y, z)
{
    if( y === undefined )
    {
        y = 0;
    }

    if( z === undefined )
    {
        z = 0;
    }

	var position = this.position;
    position[0] += x;
	position[1] += y;
	position[2] += z;
    this.dirtyModelMatrix();

    if( CCEngine.NativeUpdateCommands !== undefined )
    {
        CCEngine.NativeUpdateCommands += 'CCRenderable.setPositionXYZ;' + this.jsID + ';' + position[0] + ';' + position[1] + ';' + position[2] + '\n';
    }
};


CCRenderable.prototype.rotationUpdated = function()
{
    this.dirtyModelMatrix();

    if( CCEngine.NativeUpdateCommands !== undefined )
    {
        var rotation = this.rotation;
        CCEngine.NativeUpdateCommands += 'CCRenderable.setRotationXYZ;' + this.jsID + ';' + rotation[0] + ';' + rotation[1] + ';' + rotation[2] + '\n';
    }
};


CCRenderable.prototype.setRotationX = function(x)
{
    this.rotation[0] = x;
    this.rotationUpdated();
};


CCRenderable.prototype.setRotationY = function(y)
{
    this.rotation[1] = y;
    this.rotationUpdated();
};


CCRenderable.prototype.setRotationZ = function(z)
{
    this.rotation[2] = z;
    this.rotationUpdated();
};


CCRenderable.prototype.rotateY = function(y)
{
    this.rotation[1] += y;
    this.rotation[1] = CC.ClampRotation( this.rotation[1] );
    this.rotationUpdated();
};


CCRenderable.prototype.rotateZ = function(z)
{
    this.rotation[2] += z;
    this.rotation[2] = CC.ClampRotation( this.rotation[2] );
    this.rotationUpdated();
};


CCRenderable.prototype.setScale = function(inScale)
{
    var scale = this.scale;
    if( typeof( inScale ) === "number" )
    {
        vec3.copy( this.scale, [ inScale, inScale, inScale ] );
    }
    else
    {
        vec3.copy( this.scale, inScale );
    }
    this.dirtyModelMatrix();

    if( CCEngine.NativeUpdateCommands !== undefined )
    {
        CCEngine.NativeUpdateCommands += 'CCRenderable.setScale;' + this.jsID + ';' + scale[0] + ';' + scale[1] + ';' + scale[2] + '\n';
    }
};


CCRenderable.prototype.getColour = function()
{
    if( this.colour )
    {
        return this.colour;
    }
    return null;
};