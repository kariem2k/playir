/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCMovementInterpolator.js
 * Description : Handles the movement an object
 *
 * Created     : 03/10/12
 *-----------------------------------------------------------
 */

function CCMovementInterpolator(inObject, updateCollisions)
{
    this.object = inObject;
    this.object.addUpdater( this );

    this.updating = false;

    this.movementInterpolator = new CCInterpolatorListV3( CCInterpolatorX3Curve );
    this.updateCollisions = updateCollisions;
}


CCMovementInterpolator.prototype.update = function(delta)
{
    if( this.updating )
    {
        if( this.movementInterpolator.updating )
        {
            if( this.movementInterpolator.update( delta ) )
            {
                var object = this.object;
                if( this.updateCollisions )
                {
                    object.updateCollisions = true;
                    CCOctree.RefreshObject( object );
                }
                object.dirtyModelMatrix();
                return true;
            }
            else
            {
                this.updating = false;
            }
        }
        else
        {
            this.updating = false;
        }
    }
    return false;
};


CCMovementInterpolator.prototype.clear = function()
{
    if( this.updating )
    {
        this.updating = false;
        this.movementInterpolator.clear();
    }
};


CCMovementInterpolator.prototype.finish = function()
{
    if( this.updating )
    {
        this.update( CC_MAXFLOAT );
    }
};


CCMovementInterpolator.prototype.setMovement = function(target, inCallback)
{
    this.updating = true;
    this.movementInterpolator.pushV3( this.object.position, target, true, inCallback );
};


CCMovementInterpolator.prototype.setMovementX = function(x)
{
    var object = this.object;
    this.setMovement( vec3.clone( [ x, object.position[1], object.position[2] ] ) );
};


CCMovementInterpolator.prototype.translateMovementX = function(x)
{
    this.setMovementX( this.object.position[0] + x );
};


CCMovementInterpolator.prototype.translateMovementY = function(y)
{
    this.setMovementY( this.object.position[1] + y );
};


CCMovementInterpolator.prototype.setMovementY = function(y, inCallback)
{
    var object = this.object;
    this.setMovement( vec3.clone( [ object.position[0], y, object.position[2] ] ), inCallback );
};


CCMovementInterpolator.prototype.setMovementXY = function(x, y, inCallback)
{
    var object = this.object;
    this.setMovement( vec3.clone( [ x, y, object.position[2] ] ), inCallback );
};


CCMovementInterpolator.prototype.setMovementYZ = function(y, z, inCallback)
{
    var object = this.object;
    this.setMovement( vec3.clone( [ object.position[0], y, z ] ), inCallback );
};


CCMovementInterpolator.prototype.getMovementTarget = function()
{
    if( this.updating && this.movementInterpolator.interpolators.length > 0 )
    {
        return this.movementInterpolator.getTarget();
    }

    if( !this.positionCache )
    {
        this.positionCache = vec3.create();
    }
    vec3.copy( this.positionCache, this.object.position );

    return this.positionCache;
};


CCMovementInterpolator.prototype.setDuration = function(duration)
{
    this.movementInterpolator.setDuration( duration );
};
