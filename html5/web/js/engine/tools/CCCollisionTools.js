/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCCollisionTools.js
 * Description : Functionality for testing collision.
 *
 * Created     : 13/10/12
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

function CCCollisionManager()
{
}


CCCollisionManager.collideables = [];
CCCollisionManager.pathFinderNetwork = new CCPathFinderNetwork();


CC.collision_none          = 0x000000000;	// No collision
CC.collision_box           = 0x000000001;	// Anything with a collision box
CC.collision_static        = 0x000000002;	// Non-moveable objects
CC.collision_moveable      = 0x000000004;	// Moveable objects
CC.collision_character     = 0x000000008;	// Characters
CC.collision_ui            = 0x000000010;	// UI


CC.UpdateCollisions = function(collideable, dependantOnFlags)
{
	if( dependantOnFlags === undefined)
	{
		dependantOnFlags = true;
	}

	if( collideable.updateCollisions &&
		( !dependantOnFlags || collideable.collideableType & CC.collision_box ) )
	{
		// AABB
		var aabbMin = collideable.aabbMin;
		var aabbMax = collideable.aabbMax;
		var position = collideable.position;
		var collisionBounds = collideable.collisionBounds;
		aabbMin[0] = position[0] - collisionBounds[0];
		aabbMin[1] = position[1] - collisionBounds[1];
		aabbMin[2] = position[2] - collisionBounds[2];

		aabbMax[0] = position[0] + collisionBounds[0];
		aabbMax[1] = position[1] + collisionBounds[1];
		aabbMax[2] = position[2] + collisionBounds[2];

		collideable.updateCollisions = false;

		if( CCEngine.NativeUpdateCommands !== undefined )
		{
			CCEngine.NativeUpdateCommands += 'CC.UpdateCollisions;' + collideable.jsID + ';' + position[0] + ',' + position[1] + ',' + position[2] + ';' + collisionBounds[0] + ',' + collisionBounds[1] + ',' + collisionBounds[2] + '\n';
		}
	}
};


CC.CalculateMinMaxVectors = function(min, max)
{
	var temp;
	for( var i=0; i<3; ++i )
	{
		if( min[i] > max[i] )
		{
			temp = max[i];
			max[i] = min[i];
			min[i] = temp;
		}
	}

    if( min[1] > max[1] )
    {
        temp = max[1];
        max[1] = min[1];
        min[1] = temp;
    }
};


CC.BasicBoxCollisionCheck = function(sourceMin, sourceMax, targetMin, targetMax)
{
	if( sourceMax[2] >= targetMin[2] && sourceMin[2] <= targetMax[2] )
	{
		if( sourceMax[0] >= targetMin[0] && sourceMin[0] <= targetMax[0] )
		{
			if( sourceMax[1] >= targetMin[1] && sourceMin[1] <= targetMax[1] )
			{
				return true;
			}
		}
	}

	return false;
};


// Is there anything in this location?
CC.CollideableScan = function(min, max, sourceObject, flags, excludeInvisibles)
{
	if( flags === undefined )
	{
		flags = CC.collision_box;
	}

	var collideables = CCCollisionManager.collideables;
	var numberOfCollideables = collideables.length;

	var closestCollision = null;
	for( var i=0; i<numberOfCollideables; ++i )
	{
		var checkingObject = collideables[i];

		if( checkingObject !== sourceObject )
		{
            if( CC.HasFlag( checkingObject.collideableType, CC.collision_ui ) )
            {
                continue;
            }

            if( !checkingObject.shouldRender && excludeInvisibles)
            {
				continue;
            }

            if( CC.HasFlag( checkingObject.collideableType, CC.collision_box ) )
			{
				if( flags === CC.collision_box || CC.HasFlag( checkingObject.collideableType, flags ) )
				{
					CC.UpdateCollisions( checkingObject );
					var targetMin = checkingObject.aabbMin;
					var targetMax = checkingObject.aabbMax;

					if( CC.BasicBoxCollisionCheck( min, max, targetMin, targetMax ) )
					{
						closestCollision = checkingObject;
						break;
					}
				}
			}
		}
	}

	return closestCollision;
};


// Is there an object that should collide next to us?
CC.SourceMin = vec3.create();
CC.SourceMax = vec3.create();
CC.CollisionCheck = function(sourceObject, targetLocation, requestCollisions, flags)
{
	var collisionBounds = sourceObject.collisionBounds;

	var sourceMin = CC.SourceMin;
	vec3.copy( sourceMin, [ targetLocation[0] - collisionBounds[0], targetLocation[1] - collisionBounds[1], targetLocation[2] - collisionBounds[2] ] );

	var sourceMax = CC.SourceMax;
	vec3.copy( sourceMax, [ targetLocation[0] + collisionBounds[0], targetLocation[1] + collisionBounds[1], targetLocation[2] + collisionBounds[2] ] );

	// Only collide with objects in our scene
	var collideables = sourceObject.inScene.collideables;
	var numberOfCollideables = collideables.length;

	var closestCollision = null;
	var UpdateCollisionsFunction = CC.UpdateCollisions;
	var BasicBoxCollisionCheckFunction = CC.BasicBoxCollisionCheck;

	for( var i=0; i<numberOfCollideables; ++i )
	{
		var checkingObject = collideables[i];

		if( checkingObject !== sourceObject )
		{
			if( checkingObject.collideableType & flags )
			{
				UpdateCollisionsFunction( checkingObject );
				var targetMin = checkingObject.aabbMin;
				var targetMax = checkingObject.aabbMax;

				if( BasicBoxCollisionCheckFunction( sourceMin, sourceMax, targetMin, targetMax ) )
				{
					if( sourceObject.shouldCollide( checkingObject, true ) )
					{
						closestCollision = checkingObject;
						if( requestCollisions )
						{
							closestCollision = sourceObject.requestCollisionWith( closestCollision );
						}
						if( closestCollision )
						{
							return closestCollision;
						}
					}
				}
			}
		}
	}

	return null;
};


// CC.LineIntersectionCheck = function(x1, y1, x2, y2, x3, y3, v2x2, v2y2)
// {
//     var x=((x1*y2-y1*x2)*(x3-v2x2)-(x1-x2)*(x3*v2y2-y3*v2x2))/((x1-x2)*(y3-v2y2)-(y1-y2)*(x3-v2x2));
//     var y=((x1*y2-y1*x2)*(y3-v2y2)-(y1-y2)*(x3*v2y2-y3*v2x2))/((x1-x2)*(y3-v2y2)-(y1-y2)*(x3-v2x2));
//     if (isNaN(x)||isNaN(y)) {
//         return false;
//     } else {
//         if (x1>=x2) {
//             if (!(x2<=x&&x<=x1)) {return false;}
//         } else {
//             if (!(x1<=x&&x<=x2)) {return false;}
//         }
//         if (y1>=y2) {
//             if (!(y2<=y&&y<=y1)) {return false;}
//         } else {
//             if (!(y1<=y&&y<=y2)) {return false;}
//         }
//         if (x3>=v2x2) {
//             if (!(v2x2<=x&&x<=x3)) {return false;}
//         } else {
//             if (!(x3<=x&&x<=v2x2)) {return false;}
//         }
//         if (y3>=v2y2) {
//             if (!(v2y2<=y&&y<=y3)) {return false;}
//         } else {
//             if (!(y3<=y&&y<=v2y2)) {return false;}
//         }
//     }
//     return true;
// };

CC.LineIntersectionCheck = function(v1x1, v1y1, v1x2, v1y2, v2x1, v2y1, v2x2, v2y2)
{
    var d1, d2;
    var a1, a2, b1, b2, c1, c2;

    // Convert vector 1 to a line (line 1) of infinite length.
    // We want the line in linear equation standard form: A*x + B*y + C = 0
    // See: http://en.wikipedia.org/wiki/Linear_equation
    a1 = v1y2 - v1y1;
    b1 = v1x1 - v1x2;
    c1 = ( v1x2 * v1y1 ) - ( v1x1 * v1y2 );

    // Every point (x,y), that solves the equation above, is on the line,
    // every point that does not solve it, is either above or below the line.
    // We insert (x1,y1) and (x2,y2) of vector 2 into the equation above.
    d1 = ( a1 * v2x1 ) + ( b1 * v2y1 ) + c1;
    d2 = ( a1 * v2x2 ) + ( b1 * v2y2 ) + c1;

    // If d1 and d2 both have the same sign, they are both on the same side of
    // our line 1 and in that case no intersection is possible. Careful, 0 is
    // a special case, that's why we don't test ">=" and "<=", but "<" and ">".
    if( d1 > 0 && d2 > 0 )
	{
		return false;
	}

    if( d1 < 0 && d2 < 0 )
	{
		return false;
	}

    // We repeat everything above for vector 2.
    // We start by calculating line 2 in linear equation standard form.
    a2 = v2y2 - v2y1;
    b2 = v2x1 - v2x2;
    c2 = ( v2x2 * v1y1 ) - ( v2x1 * v2y2 );

    // Calulate d1 and d2 again, this time using points of vector 1
    d1 = ( a2 * v1x1 ) + ( b2 * v1y1 ) + c2;
    d2 = ( a2 * v1x2 ) + ( b2 * v1y2 ) + c2;

    // Again, if both have the same sign (and neither one is 0),
    // no intersection is possible.
    if( d1 > 0 && d2 > 0 )
    {
		return false;
	}

    if( d1 < 0 && d2 < 0 )
    {
		return false;
	}

    // If we get here, only three possibilities are left. Either the two
    // vectors intersect in exactly one point or they are collinear
    // (they both lie both on the same infinite line), in which case they
    // may intersect in an infinite number of points or not at all.
    //if ((a1 * b2) - (a2 * b1) === 0.0f) return COLLINEAR;

    // If they are not collinear, they must intersect in exactly one point.
    return true;
};


CC.CollisionSourceX1 = new Array( 4 );
CC.CollisionSourceY1 = new Array( 4 );
CC.CollisionSourceX2 = new Array( 4 );
CC.CollisionSourceY2 = new Array( 4 );
CC.CollisionCheckingX = new Array( 4 );
CC.CollisionCheckingY = new Array( 4 );
CC.MovementLinesInsidePolygonCollisionCheck = function(startMin, startMax, targetMin, targetMax, checkingMin, checkingMax)
{
	var verts = 4;

	var sourceX1 = CC.CollisionSourceX1;
	var sourceY1 = CC.CollisionSourceY1;
	var sourceX2 = CC.CollisionSourceX2;
	var sourceY2 = CC.CollisionSourceY2;

	sourceX1[0] = startMin[0];
	sourceY1[0] = startMin[2];
	sourceX2[0] = targetMin[0];
	sourceY2[0] = targetMin[2];

	sourceX1[1] = startMin[0];
	sourceY1[1] = startMax[2];
	sourceX2[1] = targetMin[0];
	sourceY2[1] = targetMax[2];

	sourceX1[2] = startMax[0];
	sourceY1[2] = startMax[2];
	sourceX2[2] = targetMax[0];
	sourceY2[2] = targetMax[2];

	sourceX1[3] = startMax[0];
	sourceY1[3] = startMin[2];
	sourceX2[3] = targetMax[0];
	sourceY2[3] = targetMin[2];

	var checkingX = CC.CollisionCheckingX;
	var checkingY = CC.CollisionCheckingY;
	checkingX[0] = checkingMin[0];
	checkingY[0] = checkingMin[2];
	checkingX[1] = checkingMin[0];
	checkingY[1] = checkingMax[2];
	checkingX[2] = checkingMax[0];
	checkingY[2] = checkingMax[2];
	checkingX[3] = checkingMax[0];
	checkingY[3] = checkingMin[2];

	var i, j, c;
	var v1x1, v1y1, v1x2, v1y2;
	var v2x1, v2y1, v2x2, v2y2;
	var CollisionCheckFunction = CC.LineIntersectionCheck;

	for( var sourceIndex=0; sourceIndex<verts; ++sourceIndex )
	{
		v1x1 = sourceX1[sourceIndex];
		v1y1 = sourceY1[sourceIndex];
		v1x2 = sourceX2[sourceIndex];
		v1y2 = sourceY2[sourceIndex];

		for( var checkingIndex=0; checkingIndex<verts; ++checkingIndex )
		{
			if( checkingIndex > 0 )
			{
				v2x1 = checkingX[checkingIndex-1];
				v2y1 = checkingY[checkingIndex-1];
			}
			else
			{
				v2x1 = checkingX[verts-1];
				v2y1 = checkingY[verts-1];
			}
			v2x2 = checkingX[checkingIndex];
			v2y2 = checkingY[checkingIndex];

			if( CollisionCheckFunction( v1x1, v1y1, v1x2, v1y2, v2x1, v2y1, v2x2, v2y2 ) )
			{
				return true;
			}
		}
	}

	return false;
};


CC.MovementCollisionsPending = [];
CC.MovementCollisionsPendingNextID = 0;
CC.MovementCollisionCheckAsync = function(sourceObject, startPosition, targetPosition, flags, requestCollisions, callback)
{
	if( CCEngine.NativeUpdateCommands !== undefined  )
	{
		var command = {};
		command.id = CC.MovementCollisionsPendingNextID++;
		command.sourceObject = sourceObject;
		command.flags = flags;
		command.requestCollisions = requestCollisions;
		command.callback = callback;
		CC.MovementCollisionsPending.push( command );

		CCEngine.NativeUpdateCommands += 'CC.MovementCollisionCheckAsync;' + command.id + ';' + sourceObject.jsID + ';' + startPosition[0] + ',' + startPosition[1] + ',' + startPosition[2] + ';' + targetPosition[0] + ',' + targetPosition[1] + ',' + targetPosition[2] + '\n';
	}
	else
	{
		var collidedWith = CC.MovementCollisionCheck( sourceObject, startPosition, targetPosition, flags, requestCollisions );
		callback( collidedWith );
	}
};


CC.MovementCollisionCheckResult = function(id, collisionIDs)
{
	var MovementCollisionsPending = CC.MovementCollisionsPending;
	for( var i=0; i<MovementCollisionsPending.length; ++i )
	{
		var command = MovementCollisionsPending[i];
		if( command.id == id )
		{
			MovementCollisionsPending.remove( command );

			var sourceObject = command.sourceObject;
			var scene = sourceObject.inScene;

			if( scene )
			{
				var flags = command.flags;
				var requestCollisions = command.requestCollisions;
				var callback = command.callback;

				var collideables = scene.collideables;
				var collideablesLength = collideables.length;

				var collisionIDsLength = collisionIDs.length;
				for( var collisionIDsIndex=0; collisionIDsIndex<collisionIDsLength; ++collisionIDsIndex )
				{
					var jsID = collisionIDs[collisionIDsIndex];

					for( var collideableIndex=0; collideableIndex<collideablesLength; ++collideableIndex )
					{
						var collideable = collideables[collideableIndex];
						if( collideable.jsID === jsID )
						{
							if( collideable.collideableType & flags )
							{
								if( sourceObject.shouldCollide( collideable, true ) )
								{
									var collidedWith = collideable;
									if( requestCollisions )
									{
										collidedWith = sourceObject.requestCollisionWith( collidedWith );
									}
									if( collidedWith )
									{
										callback( collidedWith );
										return;
									}
									break;
								}
							}
						}
					}
				}

				callback( null );
			}
			break;
		}
	}
};


CC.MovementAreaMin = vec3.create();
CC.MovementAreaMax = vec3.create();
CC.MovementStartMin = vec3.create();
CC.MovementStartMax = vec3.create();
CC.MovementTargetMin = vec3.create();
CC.MovementTargetMax = vec3.create();
CC.MovementAreaCollideables = [];
CC.MovementCollisionCheck = function(sourceObject, startPosition, targetPosition, flags, requestCollisions)
{
	var areaMin = CC.MovementAreaMin;
	var areaMax = CC.MovementAreaMax;
	var startMin = CC.MovementStartMin;
	var startMax = CC.MovementStartMax;
	var targetMin = CC.MovementTargetMin;
	var targetMax = CC.MovementTargetMax;

	var collisionBounds = sourceObject.collisionBounds;
	startMin[0] = startPosition[0] - collisionBounds[0];
	startMax[0] = startPosition[0] + collisionBounds[0];
	startMin[1] = startPosition[1] - collisionBounds[1];
	startMax[1] = startPosition[1] + collisionBounds[1];
	startMin[2] = startPosition[2] - collisionBounds[2];
	startMax[2] = startPosition[2] + collisionBounds[2];

	targetMin[0] = targetPosition[0] - collisionBounds[0];
	targetMax[0] = targetPosition[0] + collisionBounds[0];
	targetMin[1] = targetPosition[1] - collisionBounds[1];
	targetMax[1] = targetPosition[1] + collisionBounds[1];
	targetMin[2] = targetPosition[2] - collisionBounds[2];
	targetMax[2] = targetPosition[2] + collisionBounds[2];

	areaMin[0] = startMin[0] < targetMin[0] ? startMin[0] : targetMin[0];
	areaMin[1] = startMin[1];
	areaMin[2] = startMin[2] < targetMin[2] ? startMin[2] : targetMin[2];

	areaMax[0] = startMax[0] > targetMax[0] ? startMax[0] : targetMax[0];
	areaMax[1] = targetMax[1];
	areaMax[2] = startMax[2] > targetMax[2] ? startMax[2] : targetMax[2];

	// Only collide with objects in our scene
	var collideables = sourceObject.inScene.collideables;
	var numberOfCollideables = collideables.length;

	var UpdateCollisionsFunction = CC.UpdateCollisions;
	var BoxCollisionCheckFunction = CC.BasicBoxCollisionCheck;

	var areaCollideables = CC.MovementAreaCollideables;
	areaCollideables.length = 0;

	var i, checkingObject, checkingMin, checkingMax;
	for( i=0; i<numberOfCollideables; ++i )
	{
		checkingObject = collideables[i];
		if( checkingObject !== sourceObject )
		{
			if( checkingObject.collideableType & flags )
			{
				if( checkingObject.owner != sourceObject && sourceObject.owner != checkingObject )
				{
					UpdateCollisionsFunction( checkingObject );
					checkingMin = checkingObject.aabbMin;
					checkingMax = checkingObject.aabbMax;

					// Fast check to determine if the checking object is in our region of movement
					if( BoxCollisionCheckFunction( areaMin, areaMax, checkingMin, checkingMax ) )
					{
						areaCollideables.push( checkingObject );
					}
				}
			}
		}
	}

	// Adv check
	numberOfCollideables = areaCollideables.length;
	if( numberOfCollideables > 0 )
	{
		var sourceMin = startMin;
		var sourceMax = startMax;

		var collidedWith = null;
		var velocityX = targetPosition[0] - startPosition[0];
		var velocityZ = targetPosition[2] - startPosition[2];

		// Padding 1.0 reduces the number of collision errors we get when path finding
		var inverseBounds = sourceObject.inverseCollisionSize.width + 1.0;

		var velocityVsBoundingX = velocityX * inverseBounds;
		var velocityVsBoundingZ = velocityZ * inverseBounds;
		var absVelocityVsBoundingX = Math.abs( velocityVsBoundingX );
		var absVelocityVsBoundingZ = Math.abs( velocityVsBoundingZ );
		if( absVelocityVsBoundingX > 1.0 || absVelocityVsBoundingZ > 1.0 )
		{
			var furthestIncrement = absVelocityVsBoundingX > absVelocityVsBoundingZ ? absVelocityVsBoundingX : absVelocityVsBoundingZ;
			var numberOfIncrements = Math.round( furthestIncrement + 0.5 );

			var inverseNumberOfIncrements = 1.0 / numberOfIncrements;
			var incrementsX = velocityX * inverseNumberOfIncrements;
			var incrementsZ = velocityZ * inverseNumberOfIncrements;
			var incrementIndex = 0;
			do
			{
				sourceMin[0] += incrementsX;
				sourceMin[2] += incrementsZ;
				sourceMax[0] += incrementsX;
				sourceMax[2] += incrementsZ;

				for( i=0; i<numberOfCollideables; ++i )
				{
					checkingObject = areaCollideables[i];
					checkingMin = checkingObject.aabbMin;
					checkingMax = checkingObject.aabbMax;

					if( BoxCollisionCheckFunction( sourceMin, sourceMax, checkingMin, checkingMax ) )
					{
						if( sourceObject.shouldCollide( checkingObject, true ) )
						{
							collidedWith = checkingObject;
							if( requestCollisions )
							{
								collidedWith = sourceObject.requestCollisionWith( collidedWith );
							}
							if( collidedWith )
							{
								return collidedWith;
							}
						}
					}
				}
				++incrementIndex;
			} while( incrementIndex < numberOfIncrements && !collidedWith );
		}
		else
		{
			sourceMin[0] += velocityX;
			sourceMin[2] += velocityZ;
			sourceMax[0] += velocityX;
			sourceMax[2] += velocityZ;

			for( i=0; i<numberOfCollideables; ++i )
			{
				checkingObject = areaCollideables[i];
				checkingMin = checkingObject.aabbMin;
				checkingMax = checkingObject.aabbMax;

				if( BoxCollisionCheckFunction( sourceMin, sourceMax, checkingMin, checkingMax ) )
				{
					if( sourceObject.shouldCollide( checkingObject, true ) )
					{
						collidedWith = checkingObject;
						if( requestCollisions )
						{
							collidedWith = sourceObject.requestCollisionWith( collidedWith );
						}
						if( collidedWith )
						{
							return collidedWith;
						}
					}
				}
			}
		}
	}

	return null;
};


CC.MovementCollisionReCheckAreaCollideables = function(sourceObject, startPosition, targetPosition, flags, requestCollisions)
{
	var areaMin = CC.MovementAreaMin;
	var areaMax = CC.MovementAreaMax;
	var startMin = CC.MovementStartMin;
	var startMax = CC.MovementStartMax;
	var targetMin = CC.MovementTargetMin;
	var targetMax = CC.MovementTargetMax;

	var collisionBounds = sourceObject.collisionBounds;
	startMin[0] = startPosition[0] - collisionBounds[0];
	startMax[0] = startPosition[0] + collisionBounds[0];
	startMin[1] = startPosition[1] - collisionBounds[1];
	startMax[1] = startPosition[1] + collisionBounds[1];
	startMin[2] = startPosition[2] - collisionBounds[2];
	startMax[2] = startPosition[2] + collisionBounds[2];

	var i, checkingObject, checkingMin, checkingMax;

	var BoxCollisionCheckFunction = CC.BasicBoxCollisionCheck;

	// Adv check
	var areaCollideables = CC.MovementAreaCollideables;
	numberOfCollideables = areaCollideables.length;
	if( numberOfCollideables > 0 )
	{
		var sourceMin = startMin;
		var sourceMax = startMax;

		var collidedWith = null;
		var velocityX = targetPosition[0] - startPosition[0];
		var velocityZ = targetPosition[2] - startPosition[2];

		// Padding 1.0 reduces the number of collision errors we get when path finding
		var inverseBounds = sourceObject.inverseCollisionSize.width + 1.0;

		var velocityVsBoundingX = velocityX * inverseBounds;
		var velocityVsBoundingZ = velocityZ * inverseBounds;
		var absVelocityVsBoundingX = Math.abs( velocityVsBoundingX );
		var absVelocityVsBoundingZ = Math.abs( velocityVsBoundingZ );
		if( absVelocityVsBoundingX > 1.0 || absVelocityVsBoundingZ > 1.0 )
		{
			var furthestIncrement = absVelocityVsBoundingX > absVelocityVsBoundingZ ? absVelocityVsBoundingX : absVelocityVsBoundingZ;
			var numberOfIncrements = Math.round( furthestIncrement + 0.5 );

			var inverseNumberOfIncrements = 1.0 / numberOfIncrements;
			var incrementsX = velocityX * inverseNumberOfIncrements;
			var incrementsZ = velocityZ * inverseNumberOfIncrements;
			var incrementIndex = 0;
			do
			{
				sourceMin[0] += incrementsX;
				sourceMin[2] += incrementsZ;
				sourceMax[0] += incrementsX;
				sourceMax[2] += incrementsZ;

				for( i=0; i<numberOfCollideables; ++i )
				{
					checkingObject = areaCollideables[i];
					checkingMin = checkingObject.aabbMin;
					checkingMax = checkingObject.aabbMax;

					if( BoxCollisionCheckFunction( sourceMin, sourceMax, checkingMin, checkingMax ) )
					{
						if( sourceObject.shouldCollide( checkingObject, true ) )
						{
							collidedWith = checkingObject;
							if( requestCollisions )
							{
								collidedWith = sourceObject.requestCollisionWith( collidedWith );
							}
							if( collidedWith )
							{
								return collidedWith;
							}
						}
					}
				}
				++incrementIndex;
			} while( incrementIndex < numberOfIncrements && !collidedWith );
		}
		else
		{
			sourceMin[0] += velocityX;
			sourceMin[2] += velocityZ;
			sourceMax[0] += velocityX;
			sourceMax[2] += velocityZ;

			for( i=0; i<numberOfCollideables; ++i )
			{
				checkingObject = areaCollideables[i];
				checkingMin = checkingObject.aabbMin;
				checkingMax = checkingObject.aabbMax;

				if( BoxCollisionCheckFunction( sourceMin, sourceMax, checkingMin, checkingMax ) )
				{
					if( sourceObject.shouldCollide( checkingObject, true ) )
					{
						collidedWith = checkingObject;
						if( requestCollisions )
						{
							collidedWith = sourceObject.requestCollisionWith( collidedWith );
						}
						if( collidedWith )
						{
							return collidedWith;
						}
					}
				}
			}
		}
	}

	return null;
};


CC.LineCheckGetIntersection = function(dist1, dist2, vec3Point1, vec3Point2, vec3HitLocation)
{
	if( ( dist1 * dist2 ) >= 0.0 )
	{
		return false;
	}

	if( dist1 === dist2 )
	{
		return false;
	}

    // point1 + ( point2 - point1 ) * ( -dst1 / ( dst2 - dst1 ) );
    vec3.copy( vec3HitLocation, vec3Point2 );
    vec3.subtract( vec3HitLocation, vec3HitLocation, vec3Point1 );
	vec3.scale( vec3HitLocation, vec3HitLocation, -dist1 / ( dist2 - dist1 ) );
    vec3.add( vec3HitLocation, vec3HitLocation, vec3Point1 );

	return true;
};


CC.LineCheckInBox = function(hit, boxMin, boxMax, axis)
{
	if( axis === 1 && hit[2] >= boxMin[2] && hit[2] < boxMax[2] && hit[1] >= boxMin[1] && hit[1] < boxMax[1] )
	{
		return true;
	}

	if( axis === 2 && hit[2] >= boxMin[2] && hit[2] < boxMax[2] && hit[0] > boxMin[0] && hit[0] < boxMax[0] )
	{
		return true;
	}

	if( axis === 3 && hit[0] >= boxMin[0] && hit[0] < boxMax[0] && hit[1] >= boxMin[1] && hit[1] < boxMax[1] )
	{
		return true;
	}

	return false;
};


// returns true if line (start, end) intersects with the box (boxMin, boxMax)
// returns intersection point in hitLocation
CC.LineCheckBox = function(start, end, boxMin, boxMax, hitLocation)
{
	if( end[0] < boxMin[0] && start[0] < boxMin[0] )
	{
		return false;
	}

	if( end[0] > boxMax[0] && start[0] > boxMax[0] )
	{
		return false;
	}

	if( end[1] < boxMin[1] && start[1] < boxMin[1] )
	{
		return false;
	}

	if( end[1] > boxMax[1] && start[1] > boxMax[1] )
	{
		return false;
	}

	if( end[2] < boxMin[2] && start[2] < boxMin[2] )
	{
		return false;
	}

	if( end[2] > boxMax[2] && start[2] > boxMax[2] )
	{
		return false;
	}

	if( start[0] > boxMin[0] && start[0] < boxMax[0] &&
		start[1] > boxMin[1] && start[1] < boxMax[1] &&
		start[2] > boxMin[2] && start[2] < boxMax[2] )
	{
		vec3.copy( hitLocation, start );
		return true;
	}

	var i;

	var hits = new Array( 6 );
	for( i=0; i<6; ++i )
	{
		hits[i] = vec3.create();
	}
	var hitResult = new Array( 6 );

	var lineCheckGetIntersection = CC.LineCheckGetIntersection;
    var lineCheckInBox = CC.LineCheckInBox;
	hitResult[0] = lineCheckGetIntersection( start[0]-boxMin[0], end[0]-boxMin[0], start, end, hits[0] ) && lineCheckInBox( hits[0], boxMin, boxMax, 1 );
	hitResult[1] = lineCheckGetIntersection( start[1]-boxMin[1], end[1]-boxMin[1], start, end, hits[1] ) && lineCheckInBox( hits[1], boxMin, boxMax, 2 );
	hitResult[2] = lineCheckGetIntersection( start[2]-boxMin[2], end[2]-boxMin[2], start, end, hits[2] ) && lineCheckInBox( hits[2], boxMin, boxMax, 3 );
	hitResult[3] = lineCheckGetIntersection( start[0]-boxMax[0], end[0]-boxMax[0], start, end, hits[3] ) && lineCheckInBox( hits[3], boxMin, boxMax, 1 );
	hitResult[4] = lineCheckGetIntersection( start[1]-boxMax[1], end[1]-boxMax[1], start, end, hits[4] ) && lineCheckInBox( hits[4], boxMin, boxMax, 2 );
	hitResult[5] = lineCheckGetIntersection( start[2]-boxMax[2], end[2]-boxMax[2], start, end, hits[5] ) && lineCheckInBox( hits[5], boxMin, boxMax, 3 );

    var distance = vec3.create();
    var hitDistance = false;
    for( i=0; i<6; ++i )
    {
        if( hitResult[i] )
        {
			vec3.subtract( distance, start, hits[i] );
            var currentHitDistance = vec3.squaredLength( distance );
            if( !hitDistance || currentHitDistance < hitDistance )
            {
                hitDistance = currentHitDistance;
				vec3.copy( hitLocation, hits[i] );
                hit = true;
            }
        }
    }

	return hitDistance;
};


CC.BasicLineCollisionCheck = function(list,
                                      start, end,
                                      hitPosition,
                                      collideInsideObjects,
                                      flags,
                                      sourceObject,
                                      stopAtAnyCollision,
                                      excludeInvisibles)
{
	var hitDistance = CC_MAXFLOAT;
	var hitObject = null;

	var checkingHitPosition = vec3.create();
	var length = list.length;
    for( var i=0; i<length; ++i )
	{
		var checkingObject = list[i];
		if( checkingObject !== sourceObject )
		{
			if( checkingObject.isActive() && checkingObject.isCollideable() && CC.HasFlag( checkingObject.collideableType, flags ) )
			{
				if( !checkingObject.shouldRender && excludeInvisibles)
                {
					continue;
                }

				CC.UpdateCollisions( checkingObject );
				var targetMin = checkingObject.aabbMin;
				var targetMax = checkingObject.aabbMax;

				var checkingHitDistance = CC.LineCheckBox( start, end, targetMin, targetMax, checkingHitPosition );
				if( checkingHitDistance !== false )
				{
					if( checkingHitDistance < hitDistance && ( collideInsideObjects || checkingHitDistance > 0.0 ) )
					{
						hitDistance = checkingHitDistance;
						hitObject = checkingObject;
						if( hitPosition )
						{
							vec3.copy( hitPosition, checkingHitPosition );
						}

						if( stopAtAnyCollision )
						{
							return hitObject;
						}
					}
				}
			}
		}
	}

	return hitObject;
};


CC.CubeInFrustum = function(frustum, min, max)
{
	var c;
	var c2 = 0;

	var end = CCCameraBase.frustum_max;
	for( var i=0; i<end; i+=4 )
	{
		var minX = frustum[i+0] * min[0];
		var minY = frustum[i+1] * min[1];
		var minZ = frustum[i+2] * min[2];

		var maxX = frustum[i+0] * max[0];
		var maxY = frustum[i+1] * max[1];
		var maxZ = frustum[i+2] * max[2];

		c = 0;
		var frustumW = frustum[i+3];
		if( minX + minY + minZ + frustumW > 0 )
		{
			c++;
		}
		if( maxX + minY + minZ + frustumW > 0 )
		{
			c++;
		}
		if( minX + maxY + minZ + frustumW > 0 )
		{
			c++;
		}
		if( maxX + maxY + minZ + frustumW > 0 )
		{
			c++;
		}
		if( minX + minY + maxZ + frustumW > 0 )
		{
			c++;
		}
		if( maxX + minY + maxZ + frustumW > 0 )
		{
			c++;
		}
		if( minX + maxY + maxZ + frustumW > 0 )
		{
			c++;
		}
		if( maxX + maxY + maxZ + frustumW > 0 )
		{
			c++;
		}

		if( c === 0 )
		{
			return 0;
		}
		else if( c === 8 )
		{
			c2++;
		}
	}
	return ( c2 === 6 ) ? 2 : 1;
};
