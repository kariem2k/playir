/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCMoveable.js
 * Description : A scene managed moveable object.
 *
 * Created     : 09/10/12
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

function CCMoveable()
{
	this.construct();
}
ExtendPrototype( CCMoveable, CCCollideable );

CCMoveable.gravityForce = 200.0;


CCMoveable.prototype.construct = function()
{
	this.CCCollideable_construct();

    this.collideableType = CC.AddFlag( this.collideableType, CC.collision_moveable );

	this.moveable = true;
	this.movementSpeed = 75.0;
	this.decelerationSpeed = this.movementSpeed * 2.0;

	this.movementDirection = vec3.create();

	this.velocity = vec3.create();
	this.movementVelocity = vec3.create();
	this.additionalVelocity = vec3.create();

	this.gravity = true;
};


CCMoveable.prototype.destruct = function()
{
	this.CCCollideable_destruct();
};


// CCObject
CCMoveable.prototype.update = function(delta)
{
	this.CCCollideable_update( delta );
	this.updateMovement( delta );
	return true;
};


// CCCollideable
CCMoveable.prototype.requestCollisionWith = function(collidedWith)
{
	var velocity = this.velocity;
	return collidedWith.recieveCollisionFrom( this, velocity[0], velocity[1], velocity[2] );
};


CCMoveable.prototype.isMoveable = function()
{
	return true;
};


CCMoveable.prototype.updateMovement = function(delta)
{
	if( this.moveable )
    {
        var movementMagnitude = this.applyMovementDirection( delta );

        var velocity = this.velocity;
        var additionalVelocity = this.additionalVelocity;
        vec3.copy( velocity, this.movementVelocity );

        var additionalMagnitude = vec3.squaredLength( additionalVelocity );
        if( additionalMagnitude > 0.0 )
        {
			vec3.add( velocity, velocity, additionalVelocity );
            var deceleration = this.decelerationSpeed * delta;
            additionalVelocity[0] = CC.ToTarget( additionalVelocity[0], 0.0, deceleration );
            additionalVelocity[1] = CC.ToTarget( additionalVelocity[1], 0.0, deceleration );
            additionalVelocity[2] = CC.ToTarget( additionalVelocity[2], 0.0, deceleration );
        }

        var velocityMagnitude = vec3.squaredLength( velocity );
        if( velocityMagnitude > 0.0 )
        {
            this.applyVelocity( delta, movementMagnitude );

            this.dirtyModelMatrix();
            this.updateCollisions = true;
            CC.UpdateCollisions( this );
        }
    }
};


CCMoveable.prototype.applyMovementDirection = function(delta)
{
	var movementDirection = this.movementDirection;
	var rotation = this.rotation;
	var movementVelocity = this.movementVelocity;

	var movementMagnitude = vec3.squaredLength( movementDirection );
	if( movementMagnitude > 0.0 )
	{
		// Z movement
		var forwardSpeed = this.movementSpeed;
		var zMovementSpeed = movementDirection[2] * forwardSpeed;
		var rotationInRadians = CC.DEGREES_TO_RADIANS( rotation[1] );
		var xAmount = Math.sin( rotationInRadians ) * zMovementSpeed;
		var zAmount = Math.cos( rotationInRadians ) * zMovementSpeed;

		// X Movement
		if( movementDirection[0] !== 0.0 )
		{
			var xMovementSpeed = movementDirection[0] * movementSpeed;
			rotationInRadians = CC.DEGREES_TO_RADIANS( rotation[1] + 90.0 );
			xAmount += Math.sin( rotationInRadians ) * xMovementSpeed;
			zAmount += Math.cos( rotationInRadians ) * xMovementSpeed;
		}

		movementVelocity[0] = xAmount;
		movementVelocity[2] = zAmount;
	}
    else
    {
		movementVelocity[0] = 0.0;
		movementVelocity[2] = 0.0;
    }

	return movementMagnitude;
};


CCMoveable.prototype.applyVelocity = function(delta, movementMagnitude)
{
	var velocity = this.velocity;
	var movementVelocity = this.movementVelocity;

	var velocityX = velocity[0] * delta;
	var velocityZ = velocity[2] * delta;
	if( velocityX !== 0.0 || velocityZ !== 0.0 )
	{
		this.applyHorizontalVelocity( velocityX, velocityZ );

		// Deceleration
		if( movementMagnitude === 0.0 )
		{
			var movementDeceleration = this.decelerationSpeed * delta;
            movementVelocity[0] = CC.ToTarget( movementVelocity[0], 0.0, movementDeceleration );
            movementVelocity[2] = CC.ToTarget( movementVelocity[2], 0.0, movementDeceleration );
		}
	}

	// Gravity
	if( this.gravity )
	{
		var collidedWith = null;
		movementVelocity[1] -= CCMoveable.gravityForce * delta;
		var velocityY = velocity[1] * delta;

		if( velocityY > 0.0 )
		{
			collidedWith = this.applyVerticalVelocity( velocityY );
		}
		else
		{
			collidedWith = this.applyVerticalVelocity( velocityY );
		}

		this.reportVerticalCollision( collidedWith );

		// Ensure we have a velocity so we're checked for movement next frame
		if( !collidedWith && movementVelocity[1] === 0.0 )
		{
			movementVelocity[1] = CC_SMALLFLOAT;
		}
	}
};


CCMoveable.prototype.getCollisionPosition = function(thisObjectPosition, thisObjectBounds, collidedObjectPosition, collidedObjectBounds)
{
	var collisionPosition = collidedObjectPosition;
	if( collisionPosition < thisObjectPosition )
	{
		collisionPosition += collidedObjectBounds;
		collisionPosition += thisObjectBounds;
		collisionPosition += CC_SMALLFLOAT;

		if( collisionPosition > thisObjectPosition )
		{
			collisionPosition = thisObjectPosition;
		}
	}
	else
	{
		collisionPosition -= collidedObjectBounds;
		collisionPosition -= thisObjectBounds;
		collisionPosition -= CC_SMALLFLOAT;

		if( collisionPosition < thisObjectPosition )
		{
			collisionPosition = thisObjectPosition;
		}
	}

	return collisionPosition;
};


CCMoveable.HorizontalVelocityStartPosition = vec3.create();
CCMoveable.prototype.applyHorizontalVelocity = function(velocityX, velocityZ)
{
	var position = this.position;
	var startPosition = CCMoveable.HorizontalVelocityStartPosition;

	vec3.copy( startPosition, position );
	position[0] += velocityX;
	position[2] += velocityZ;

	var self = this;
	var collisionFlags = CC.collision_static | CC.collision_moveable;
	var collidedWith = CC.MovementCollisionCheck( this, startPosition, position, collisionFlags, true );
	if( collidedWith )
	{
		// If we're still active after the collision
		if( CC.HasFlag( self.collideableType, CC.collision_box ) )
		{
			var areaCollideables = CC.MovementAreaCollideables;

			var collisionBounds = self.collisionBounds;
			var additionalVelocity = self.additionalVelocity;

			position[0] -= velocityX;

			var collidedWithZ = collidedWith;
			if( velocityZ !== 0.0 )
			{
				collidedWithZ = CC.MovementCollisionReCheckAreaCollideables( self, startPosition, position, collisionFlags, true );
			}

			if( collidedWithZ )
			{
				position[2] -= velocityZ;
				position[0] += velocityX;

				var collidedWithX = collidedWith;
				if( velocityX !== 0.0 )
				{
					collidedWithX = CC.MovementCollisionReCheckAreaCollideables( self, startPosition, position, collisionFlags, true );
				}

				if( collidedWithX )
				{
					position[0] -= velocityX;

					// Moving failed

					// Kill the additional velocity
					additionalVelocity[0] = 0.0;
					additionalVelocity[2] = 0.0;
				}

				// Moving X passed
				else
				{
					var collisionZ = self.getCollisionPosition( position[2], collisionBounds[2], collidedWith.position[2], collidedWith.collisionBounds[2] );
					position[2] = collisionZ;

					// Kill the z additional velocity
					additionalVelocity[2] = 0.0;
				}
			}
			// Moving Z passed
			else
			{
				var collisionX = self.getCollisionPosition( position[0], collisionBounds[0], collidedWith.position[0], collidedWith.collisionBounds[0] );
				position[0] = collisionX;

				// Kill the x additional velocity
				additionalVelocity[0] = 0.0;
			}
		}
	}
};


CCMoveable.prototype.applyVerticalVelocity = function(increment)
{
	var position = this.position;

	position[1] += increment;

	var collidedWith = CC.CollisionCheck( this, position, true, CC.collision_box );
	if( collidedWith )
	{
		var collisionBounds = this.collisionBounds;

		position[1] -= increment;
		var originalPosition = position[1];

		// Since basic collision check doesn't return the actual closest collision, keep re-running the check until we're collision free
		var currentlyCollidingWith = collidedWith;
		while( currentlyCollidingWith )
		{
			position[1] = originalPosition;
			collidedWith = currentlyCollidingWith;
			position[1] = this.getCollisionPosition( position[1], collisionBounds[1], collidedWith.position[1], collidedWith.collisionBounds[1] );
			if( position[1] === originalPosition )
			{
				currentlyCollidingWith = null;
			}
			else
			{
				currentlyCollidingWith = CC.CollisionCheck( this, position, false, CC.collision_box );
			}
		}
	}

	return collidedWith;
};


CCMoveable.prototype.reportVerticalCollision = function(collidedWith)
{
	if( collidedWith )
	{
		this.movementVelocity[1] = 0.0;
	}
};


CCMoveable.prototype.setGravityForce = function(force)
{
	CCMoveable.gravityForce = force;
};


CCMoveable.prototype.setVelocity = function(x, y, z)
{
	var movementVelocity = this.movementVelocity;
	movementVelocity[0] = x;
	movementVelocity[1] = y;
	movementVelocity[2] = z;
};


CCMoveable.prototype.setAdditionalVelocity = function(x, y, z)
{
	var additionalVelocity = this.additionalVelocity;
	additionalVelocity[0] = x;
	additionalVelocity[1] = y;
	additionalVelocity[2] = z;
};


CCMoveable.prototype.incrementAdditionalVelocity = function(x, y, z)
{
	var additionalVelocity = this.additionalVelocity;
	additionalVelocity[0] += x;
	additionalVelocity[1] += y;
	additionalVelocity[2] += z;
};
