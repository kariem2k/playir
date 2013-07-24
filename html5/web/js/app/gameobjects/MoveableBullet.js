/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : MoveableBullet.js
 * Description : A bullet that hits other characters
 *
 * Created     : 09/10/12
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

function MoveableBullet(inLife, inMovementSpeed, inDamage)
{
    this.construct( inLife, inMovementSpeed, inDamage );
}
ExtendPrototype( MoveableBullet, CCMoveable );


MoveableBullet.prototype.construct = function(inLife, inMovementSpeed, inDamage)
{
    this.CCMoveable_construct();

    if( !inLife )
    {
        inLife = 1.0;
    }

    if( !inMovementSpeed )
    {
        inMovementSpeed = 200.0;
    }

    if( !inDamage )
    {
        inDamage = 5.0;
    }

    this.gravity = false;

    this.life = inLife;
    this.movementSpeed = inMovementSpeed;
    this.damage = inDamage;
};


MoveableBullet.prototype.destruct = function()
{
    this.CCMoveable_destruct();
};


// ObjectBase
MoveableBullet.prototype.update = function(delta)
{
	if( this.life <= 0.0 )
	{
        if( this.onEndLife )
        {
            this.onEndLife();
        }
        else
        {
            this.deleteLater();
        }
	}
	else
	{
		this.life -= delta;
		this.CCMoveable_update( delta );

//        if( model )
//        {
//            if( model.getColour )
//            {
//                CCToTarget( model.colour.alpha, 1.0, gameTime.delta * 2.0 );
//            }
//        }
	}
    return true;
};


MoveableBullet.prototype.applyVelocity = function(delta, movementMagnitude)
{
    var velocity = this.velocity;
    var velocityX = velocity[0] * delta;
    var velocityZ = velocity[2] * delta;

    var position = this.position;
    var startPosition = CCMoveable.HorizontalVelocityStartPosition;

    vec3.copy( startPosition, position );
    position[0] += velocityX;
    position[2] += velocityZ;

    var self = this;
    var collisionFlags = CC.collision_static | CC.collision_moveable;
    CC.MovementCollisionCheckAsync( this, startPosition, position, collisionFlags, true, function(collidedWidth)
    {
    });
};


MoveableBullet.prototype.renderModel = function(alpha)
{
	if( alpha )
    {
        this.CCMoveable_renderModel( alpha );
    }
    else
    {
        this.CCMoveable_renderModel( alpha );
    }
};


// CCCollideable

// Ask to report a collision to the collidedWith object
MoveableBullet.prototype.requestCollisionWith = function(collidedWith)
{
	if( this.attack( collidedWith ) )
    {
        return this.CCMoveable_requestCollisionWith( collidedWith );
    }
    return null;
};


// Ask the collidedWith object if we've collided
MoveableBullet.prototype.recieveCollisionFrom = function(collisionSource, x, y, z)
{
    if( this.life > 0.0 )
    {
        if( this.attack( collisionSource ) )
        {
            return this.CCMoveable_recieveCollisionFrom( collisionSource, x, y, z );
        }
    }
    return null;
};


MoveableBullet.prototype.reportAttack = function(attackedBy, attackType, force, damage, x, y, z)
{
	return false;
};


MoveableBullet.prototype.attack = function(victim)
{
	if( victim.shouldRender )
    {
        var velocity = this.velocity;
        if( victim.reportAttack( this.owner, "default", this.movementSpeed, this.damage, velocity[0], velocity[1], velocity[2] ) )
        {
            // Killed someone callback..
        }

        this.life = 0.0;
        this.deactivate();
        return true;
    }
    return false;
};
