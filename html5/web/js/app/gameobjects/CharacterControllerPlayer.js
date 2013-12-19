/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CharacterControllerPlayer.js
 * Description : Controller for our player character
 *
 * Created     : 13/10/12
 *-----------------------------------------------------------
 */

function CharacterControllerPlayer(pathFinderNetwork)
{
    this.construct( pathFinderNetwork );
}

CharacterControllerPlayer.state_shooting = 0;
CharacterControllerPlayer.state_stopping = 1;
CharacterControllerPlayer.state_stopped = 2;


CharacterControllerPlayer.prototype.construct = function(pathFinderNetwork)
{
    this.updating = true;

    if( !pathFinderNetwork )
    {
        pathFinderNetwork = gEngine.collisionManager.pathFinderNetwork;
    }
    this.pathFinderNetwork = pathFinderNetwork;

    this.player = null;

    this.setHealth( 100.0, true );
    this.damageResistance = 0.0;

    this.moving = false;
    this.locationTarget = vec3.create();
    this.distanceToLocationTarget = CC_MAXFLOAT;
    this.movementMagnitude = 1.0;
    this.stopOnCollisions = false;
    this.receivedLastCollisionTime = 0.0;

    this.shootingState = CharacterControllerPlayer.state_stopped;
    this.shootingLocation = vec3.create();
    this.shootingTarget = null;
    this.shootingAimHelper = true;

    this.resetPathNodes();

    this.enabled = true;
};


CharacterControllerPlayer.prototype.destruct = function()
{
    if( this.shootingState !== CharacterControllerPlayer.state_stopped )
    {
        this.stopShooting();
    }
};


CharacterControllerPlayer.prototype.resetPathNodes = function()
{
    this.anchorNode = null;

    this.path = null;
    this.pathAnchorNode = null;
    this.currentPath = -1;

    if( this.moving )
    {
        this.goToScan( this.locationTarget, true );
    }
};


// ControllerBase
CharacterControllerPlayer.prototype.update = function(delta)
{
    this.movePlayer( delta );

    if( this.shootingState !== CharacterControllerPlayer.state_stopped )
    {
        if( this.shootingState === CharacterControllerPlayer.state_shooting )
        {
            if( this.shootingTarget )
            {
                if( !this.shootingTarget.isActive() )
                {
                    this.shootingTarget = null;
                }

                // Update our shoot target as we follow our target
                else
                {
                    vec3.copy( this.shootingLocation, this.shootingTarget.position );
                }
            }

            var shoot = true;
            if( this.shootingAimHelper )
            {
                shoot = false;
                this.player.aimWeapon( this.shootingLocation );
                var angleToTarget = this.player.getWeaponAimAngleToTarget( this.shootingLocation );
                if( angleToTarget < 10.0 )
                {
                    shoot = true;
                }
            }

            if( shoot )
            {
                if( !this.player.shootWeapon( delta ) )
                {
                    this.shootingState = CharacterControllerPlayer.state_stopping;
                    this.shootingTarget = null;
                }
            }
        }
        else
        {
            this.stopShooting();
        }
    }

    return true;
};


CharacterControllerPlayer.prototype.isPerformingAction = function()
{
    return this.shootingState !== CharacterControllerPlayer.state_stopped;
};


CharacterControllerPlayer.prototype.enable = function(toggle)
{
    this.enabled = toggle;
};


CharacterControllerPlayer.prototype.setPlayer = function(inPlayer)
{
    this.player = inPlayer;
};


CharacterControllerPlayer.prototype.isAI = function()
{
    return false;
};


CharacterControllerPlayer.prototype.getHealth = function()
{
    return this.health;
};


CharacterControllerPlayer.prototype.getHealthRatio = function()
{
    return this.health/this.maxHealth;
};


CharacterControllerPlayer.prototype.setHealth = function(inHealth, initialize)
{
    this.health = inHealth;
    if( initialize )
    {
        this.maxHealth = inHealth;
    }
};


CharacterControllerPlayer.prototype.resetHealth = function()
{
    this.health = this.maxHealth;
};


CharacterControllerPlayer.prototype.setMovementMagnitude = function(magnitude)
{
    this.movementMagnitude = magnitude;
};


CharacterControllerPlayer.prototype.goToScan = function(target, force)
{
    if( force || !vec3.equals( this.locationTarget, target ) )
    {
        var hitObject = CC.MovementCollisionCheck( this.player, this.player.position, target, CC.collision_static );
        if( hitObject )
        {
            this.goToUsingPath( target );
        }
        else
        {
            this.path = null;
            this.goTo( target );
        }
    }

    return this.locationTarget;
};


CharacterControllerPlayer.prototype.goToUsingPath = function(target)
{
    var player = this.player;

    var targetNode = this.pathFinderNetwork.findClosestNodeToPathTarget( player, target, false );
    if( !targetNode )
    {
        this.path = null;
        this.goTo( target );
        return;
    }

    this.anchorNode = null;
    this.validateAnchorNode();

    this.pathAnchorNode = this.anchorNode;
    if( this.pathAnchorNode )
    {
        var path = this.path = this.pathFinderNetwork.findPath( this.player, this.pathAnchorNode, targetNode );

        var hitObject;

        // Failed pathing?
        if( path.directions.length === 0 )
        {
            //this.path = this.pathFinderNetwork.findPath( this.player, pathAnchorNode, targetNode );
            this.path = null;
        }
        else
        {
            // See if we can head straight to our target
            if( path.endDirection === 0 )
            {
                hitObject = CC.MovementCollisionCheck( player, player.position, target, CC.collision_static );
                if( !hitObject )
                {
                    this.path = null;
                }
            }

            // Check if we can head straight to our first path
            else
            {
                var pathAnchorNode = this.pathAnchorNode;
                var pathDirection = path.directions[0];
                if( pathAnchorNode && pathDirection < pathAnchorNode.connections.length )
                {
                    var usingConnection = pathAnchorNode.connections[pathDirection];
                    var pathTarget = usingConnection.node.point;
                    hitObject = CC.MovementCollisionCheck( player, player.position, pathTarget, CC.collision_static );
                    if( hitObject )
                    {
                        this.currentPath = -1;
                    }
                    else
                    {
                        this.currentPath = 0;
                    }
                }
                else
                {
                    this.currentPath = 0;
                }
            }
        }
    }
    else
    {
        this.path = null;
    }

    this.goTo( target );
};


CharacterControllerPlayer.prototype.goTo = function(target)
{
    var player = this.player;

    this.distanceToLocationTarget = CC_MAXFLOAT;
    this.setLocationTarget( target );
    this.player.movementDirection[2] = this.movementMagnitude;

    this.moveAction();
};


CharacterControllerPlayer.prototype.setLocationTarget = function(target)
{
    var locationTarget = this.locationTarget;
    vec3.copy( locationTarget, target );
    locationTarget[1] += this.player.collisionBounds[1];
    if( locationTarget[1] !== this.player.collisionBounds[1] )
    {
        locationTarget[1] = this.player.collisionBounds[1];
    }
};


CharacterControllerPlayer.prototype.validateAnchorNode = function()
{
    if( !this.anchorNode )
    {
        this.anchorNode = this.pathFinderNetwork.findClosestNodeToPathTarget( this.player, this.player.position, true );
    }
};


CharacterControllerPlayer.prototype.shootAt = function(enemy)
{
    if( enemy )
    {
        this.shoot( enemy.position, enemy );
    }
};


CharacterControllerPlayer.prototype.shoot = function(target, enemy, actionID)
{
    if( this.shootingState !== CharacterControllerPlayer.state_shooting )
    {
        this.shootingState = CharacterControllerPlayer.state_shooting;
    }

    if( target )
    {
        vec3.copy( this.shootingLocation, target );
        this.shootingLocation[1] += this.player.collisionBounds[1];
    }

    if( enemy )
    {
        this.shootingTarget = enemy;
    }

    this.player.readyWeapon( actionID );
};


CharacterControllerPlayer.prototype.scanForEnemy = function(target)
{
    var hScanArea = this.player.collisionSize.width * 2.0;

    var min = vec3.clone( target );
    min[0] -= hScanArea;
    min[2] -= hScanArea;

    var max = vec3.clone( target );
    max[0] += hScanArea;
    max[2] += hScanArea;

    return CC.CollideableScan( min, max, this.player, CC.collision_character );
};


CharacterControllerPlayer.prototype.stopShooting = function()
{
    this.shootingState = CharacterControllerPlayer.state_stopped;
    this.player.unReadyWeapon();

    if( this.player.setActionID )
    {
        this.player.setCurrentActionPriority( 0 );
        if( this.moving )
        {
            this.player.setMovementAnimation();
        }
        else
        {
            this.player.setIdleAnimation();
        }
    }
};


// Ask the collidedWith object if we've collided
CharacterControllerPlayer.prototype.recieveCollisionFrom = function(collisionSource)
{
    if( this.moving )
    {
        if( this.stopOnCollisions )
        {
            this.player.movementDirection[2] = 0.0;
            this.stopAction();
        }
        else if( !this.collidedWhileMoving )
        {
            this.collidedWhileMoving = true;
            this.collidedWhileMovingTime = gEngine.lifetime;
            if( !this.collidedWhileMovingPosition )
            {
                this.collidedWhileMovingPosition = vec3.clone( this.player.position );
            }
            else
            {
                vec3.copy( this.collidedWhileMovingPosition, this.player.position );
            }
        }
    }
};


CharacterControllerPlayer.prototype.reportAttack = function(attackedBy, attackType, force, damage, x, y, z)
{
};


CharacterControllerPlayer.prototype.movePlayer = function(delta)
{
    if( this.moving )
    {
        var player = this.player;
        var path = this.path;
        var pathAnchorNode = this.pathAnchorNode;

        var distance, target, hitObject;

        if( this.collidedWhileMoving )
        {
            var difference = gEngine.lifetime - this.collidedWhileMovingTime;
            if( difference > 0.25 )
            {
                var movementLength = vec3.distance( this.collidedWhileMovingPosition, this.player.position );
                if( movementLength > 0.5 )
                {
                    this.collidedWhileMoving = false;
                }
                else
                {
                    // Stop if we keep colliding here
                    this.player.movementDirection[2] = 0.0;
                    this.stopAction();
                }
            }
        }

        if( path )
        {
            if( !pathAnchorNode )
            {
                this.path = null;
            }

            // Required to go to our anchor node first
            else if( this.currentPath === -1 )
            {
                target = pathAnchorNode.point;
                player.turnPlayer( target, delta );

                distance = CC.Vector3Distance2D( player.position, target, true );
                if( distance < ( 1.0 * 1.0 ) )
                {
                    this.currentPath = 0;
                }
            }

            // Follow our path
            else
            {
                var validPath = false;
                if( this.currentPath < path.endDirection )
                {
                    var pathDirection = path.directions[this.currentPath];
                    if( pathDirection < pathAnchorNode.connections.length )
                    {
                        var usingConnection = pathAnchorNode.connections[pathDirection];
                        target = usingConnection.node.point;
                        if( target )
                        {
                            validPath = true;

                            player.turnPlayer( target, delta );

                            distance = CC.Vector3Distance2D( player.position, target, true );
                            if( distance < ( 100.0 * 100.0 ) )
                            {
                                var goToNext = distance < ( 0.1 + player.collisionBounds[1] );
                                if( !goToNext )
                                {
                                    var testTarget = this.locationTarget;

                                    // First test if we can get to the final position
                                    {
                                        hitObject = CC.MovementCollisionCheck( player, player.position, testTarget, CC.collision_static );
                                        goToNext = !hitObject;
                                    }

                                    if( this.currentPath+1 < path.endDirection )
                                    {
                                        // We can get to our final position, cancel our pathing
                                        if( goToNext )
                                        {
                                            goToNext = false;
                                            this.path = null;
                                        }
                                        else
                                        {
                                            var nextConnection = usingConnection.node.connections[path.directions[this.currentPath+1]];
                                            testTarget = nextConnection.node.point;
                                            if( !testTarget )
                                            {
                                                testTarget = locationTarget;
                                            }

                                            hitObject = CC.MovementCollisionCheck( player, player.position, testTarget, CC.collision_static );
                                            goToNext = !hitObject;
                                        }
                                    }
                                }

                                if( goToNext )
                                {
                                    this.pathAnchorNode = usingConnection.node;
                                    this.anchorNode = pathAnchorNode;
                                    this.currentPath++;
                                    if( this.currentPath >= path.endDirection )
                                    {
                                        this.path = null;
                                    }
                                }
                            }
                        }
                    }
                }

                if( !validPath )
                {
                    // Try again?
                    this.goTo( this.locationTarget );
                }
            }
        }
        else
        {
            distance = CC.Vector3Distance2D( player.position, this.locationTarget, true );
            if( distance > ( 5.0 * 5.0 ) )
            {
                player.turnPlayer( this.locationTarget, delta );
            }
            else
            {
                this.landPlayerOnTarget( distance, delta );
            }
        }

        this.player.dirtyModelMatrix();
    }
};


CharacterControllerPlayer.prototype.landPlayerOnTarget = function(distance, delta)
{
    var player = this.player;
    var locationTarget = this.locationTarget;

    // If we're not zoning in on our target
    if( this.distanceToLocationTarget === CC_MAXFLOAT )
    {
        // Rotate towards our target first if we're pointing away from our target
        var angleTowardsTarget = CC.AngleTowardsVector( locationTarget, player.position );
        var angleDistance = CC.DistanceBetweenAngles( player.rotation[1], angleTowardsTarget );
        if( angleDistance > 15.0 )
        {
            player.turnPlayer( locationTarget, delta );
            player.movementDirection[2] = 0.0;
            return false;
        }
        else
        {
            this.distanceToLocationTarget = distance;
        }
    }

    // Now we are rotated towards our target
    if( distance <= this.distanceToLocationTarget )
    {
        this.distanceToLocationTarget = distance;
        player.movementDirection[2] = 0.5;
    }

    // As soon as we move past our target position, we know we've hit it
    else
    {
        var collidedWith = CC.CollisionCheck( player, locationTarget, true, CC.collision_box );
        if( !collidedWith )
        {
            player.setPosition( locationTarget );
        }
        player.movementDirection[2] = 0.0;
        this.stopAction();
        return true;
    }
    return false;
};


CharacterControllerPlayer.prototype.moveAction = function()
{
    if( this.player.setMovementAnimation )
    {
        this.player.setMovementAnimation();
    }
    this.moving = true;

    if( this.collidedWhileMoving )
    {
        this.collidedWhileMoving = false;
    }
};


CharacterControllerPlayer.prototype.stopAction = function()
{
    // As we've stopped, finalize our target location
    this.setLocationTarget( this.player.position );

    if( this.player.setIdleAnimation )
    {
        this.player.setIdleAnimation();
    }
    this.moving = false;
};
