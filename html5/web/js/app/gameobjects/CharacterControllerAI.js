/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CharacterControllerAI.js
 * Description : Handles the movement an object
 *
 * Created     : 13/10/12
 *-----------------------------------------------------------
 */

function CharacterControllerAI(pathFinderNetwork)
{
	this.construct( pathFinderNetwork );
}
ExtendPrototype( CharacterControllerAI, CharacterControllerPlayer );

CharacterControllerAI.cycle_off = 0;
CharacterControllerAI.cycle_inOrder = 1;
CharacterControllerAI.cycle_randomNodes = 2;		// Pick nodes at random
CharacterControllerAI.cycle_randomConnections = 3;	// Pick nodes connected to anchored node
CharacterControllerAI.cycle_towardsEnemy = 4;		// Pick nodes towards enemy

CharacterControllerAI.max_waypoints = 50;


CharacterControllerAI.prototype.construct = function(pathFinderNetwork)
{
	this.CharacterControllerPlayer_construct( pathFinderNetwork );

	this.waypoints = [];
	this.waypointCurrent = 0;

	this.waypointCycle = CharacterControllerAI.cycle_off;
	this.targetConnection = null;

	this.nodesPerMovementCycle = 0;
	this.waitTime = 0.0;

	this.enemy = null;
	this.scanForEnemyTimer = 0.0;
	this.scanForEnemyTime = 2.0;

	this.shouldFollowEnemy = true;
	this.followingEnemy = false;
	this.distanceToEnemy = CC_MAXFLOAT;

	this.shouldShootAtEnemy = true;
	this.shootingTimer = 0.0;
	this.shootingBurstTime = CC_MAXFLOAT;	// How long to keep shooting for
	this.lastShotTime = 0.0;
	this.shootingWaitTime = 0.0;			// How long to wait between reshooting
};


// BaseType
CharacterControllerAI.prototype.destruct = function()
{
	this.CharacterControllerPlayer_destruct();
};


// ControllerBase
CharacterControllerAI.prototype.update = function(delta)
{
	if( this.enabled )
    {
		var enemy = this.enemy;
		if( enemy )
        {
            if( !enemy.isActive() )
            {
                this.enemy = null;
            }
            else
            {
                this.scanForEnemyTimer += delta;
                if( this.scanForEnemyTimer > this.scanForEnemyTime )
                {
                    this.scanForEnemyTimer -= this.scanForEnemyTime;

                    this.distanceToEnemy = CC.Vector3Distance2D( this.player.position, this.enemy.position, true );
                    if( this.shouldFollowEnemy && this.distanceToEnemy < CC.SQUARE( 150.0 ) )
                    {
                        this.followEnemy();
                    }
                    else if( !this.moving )
                    {
                        // Restart tracking if we've stopped moving
                        if( this.followingEnemy )
                        {
                            this.followingEnemy = false;
                        }

                        this.nextWaypoint();
                    }
                }
            }
        }

        if( this.shootingState === CharacterControllerPlayer.state_stopped )
        {
        	this.lastShotTime += delta;
        	if( this.lastShotTime > this.shootingWaitTime )
			{
				if( this.followingEnemy )
				{
					if( !enemy )
					{
						this.followingEnemy = false;
					}
					else if( this.shouldShootAtEnemy )
					{
						if( this.distanceToEnemy < CC.SQUARE( 100.0 ) )
						{
							this.shoot( enemy.position, enemy );
							this.lastShotTime = 0.0;
						}
					}
				}
			}
        }
        else
        {
        	this.shootingTimer += delta;
        	if( this.shootingTimer > this.shootingBurstTime )
        	{
				this.stopShooting();
			}
        }
    }

    return this.CharacterControllerPlayer_update( delta );
};


CharacterControllerAI.prototype.isAI = function()
{
	return true;
};


// ControllerPlayer
CharacterControllerAI.prototype.movePlayer = function(delta)
{
	var player = this.player;

	if( this.waitTime > 0.0 )
	{
		player.movementDirection[2] = 0.0;
		this.waitTime -= delta;

		if( this.waitTime <= 0.0 )
		{
			this.nextWaypoint();
		}
	}
	else if( this.moving )
	{
		if( this.path )
		{
			this.CharacterControllerPlayer_movePlayer( delta );
		}
		else
		{
            var distance = CC.Vector3Distance2D( player.position, this.locationTarget, true );
            if( distance > ( 5.0 * 5.0 ) )
            {
                player.turnPlayer( this.locationTarget, delta );
            }
            else
			{
				if( this.landPlayerOnTarget( distance, delta ) )
                {
					if( !this.followingEnemy && this.enabled )
					{
						if( this.waypointCycle === CharacterControllerAI.cycle_randomConnections ||
							this.waypointCycle === CharacterControllerAI.cycle_towardsEnemy )
						{
							this.waitTime = ( CC.Random() % 5 ) + 1.0;
						}
						else
						{
							this.nextWaypoint();
						}
					}
				}
			}
		}
	}
};


// Ask the collidedWith object if we've collided
CharacterControllerAI.prototype.recieveCollisionFrom = function(collidedWith)
{
	if( this.followingEnemy )
	{
		this.followingEnemy = false;

		this.validateAnchorNode();
	}

	if( this.waypointCycle === CharacterControllerAI.cycle_randomConnections )
	{
		this.waitTime = 0.0;
		this.pickRandomConnection();
	}
	else
	{
		this.nextWaypoint();
	}
};


CharacterControllerAI.prototype.reportAttack = function(attackedBy, attackType, force, damage, x, y, z)
{
	return this.CharacterControllerPlayer_reportAttack( attackedBy, attackType, force, damage, x, y, z );
};


CharacterControllerAI.prototype.setEnemy = function(inEnemy)
{
	this.enemy = inEnemy;
};


CharacterControllerAI.prototype.followEnemy = function()
{
	this.goToUsingPath( this.enemy.position );
	this.followingEnemy = true;
};


CharacterControllerAI.prototype.setWaypointCycle = function(inCycleType)
{
	this.waypointCycle = inCycleType;

    if( this.enabled )
    {
        if( this.waypointCycle === CharacterControllerAI.cycle_randomNodes )
        {
            this.waypointCurrent = CC.Random() % this.waypoints.length;
            this.goTo( waypoints[this.waypointCurrent] );
        }
        else if( this.waypointCycle === CharacterControllerAI.cycle_randomConnections )
        {
			this.validateAnchorNode();
            this.pickRandomConnection();
        }
    }
};


CharacterControllerAI.prototype.addWaypoint = function(target)
{
	this.waypoints.add( target );

	if( this.enabled && !this.moving )
	{
		this.waypointCurrent = this.waypoints.length-1;
		this.goToUsingPath( target );
	}
};


CharacterControllerAI.prototype.scanWaypoints = function(radius, amount)
{
	if( amount === undefined )
	{
		amount = CharacterControllerAI.max_waypoints;
	}

	var points = [];
	var found = this.pathFinderNetwork.findClosestNodes( this.player.position, radius, points, amount );
	for( var i=0; i<found; ++i )
	{
		this.addWaypoint( points[i] );
	}
};


CharacterControllerAI.prototype.nextWaypoint = function()
{
	if( this.waypointCycle === CharacterControllerAI.cycle_randomConnections )
	{
		if( this.targetConnection && this.targetConnection.node )
		{
			this.anchorNode = this.targetConnection.node;
			this.pickClosestAngledConnection();
		}
		else
		{
			this.pickRandomConnection();
		}
	}
	else if( this.waypointCycle === CharacterControllerAI.cycle_towardsEnemy )
	{
		if( this.enemy )
		{
			var player = this.player;
			var enemy = this.enemy;
			var distance = CC.Vector3Distance2D( player.position, enemy.position, true );
			if( distance > CC.SQUARE( player.collisionSize.width * 3.0 ) )
			{
				var direction = CC.Vector3Direction( player.position, enemy.position );

				var target = direction;
				vec3.scale( target, direction, player.collisionSize.width );
				vec3.add( direction, player.position, direction );

				this.goTo( target );
			}
		}
	}
	else
	{
		if( this.waypointCycle === CharacterControllerAI.cycle_off )
		{
			if( this.waypoints.length > 0 )
			{
				for( var i=0; i<this.waypoints.length-1; ++i )
				{
					this.waypoints[i] = this.waypoints[i+1];
				}
				this.waypoints.length--;

				if( this.waypoints.length > 0 )
				{
					goToUsingPath( waypoints[0] );
				}
			}
		}
		else if( this.waypointCycle === CharacterControllerAI.cycle_inOrder )
		{
			this.waypointCurrent++;
			if( this.waypointCurrent >= this.waypoints.length )
			{
				this.waypointCurrent = 0;
			}
		}
		else if( this.waypointCycle === CharacterControllerAI.cycle_randomNodes )
		{
			this.waypointCurrent = CC.Random() % this.waypoints.length;
		}

		if( this.waypointCurrent < this.waypoints.length )
		{
			this.goToUsingPath( this.waypoints[this.waypointCurrent] );
		}
	}
};


CharacterControllerAI.prototype.pickClosestAngledConnection = function()
{
	if( this.enabled )
    {
		if( this.anchorNode && this.anchorNode.connections.length > 0 )
		{
			var player = this.player;

			var closestConnection = 0;
			var closestAngle = CC_MAXFLOAT;

			var anchorNode = this.anchorNode;
			var anchorNodeConnections = anchorNode.connections;
			for( i=0; i<anchorNodeConnections.length; ++i )
			{
				var angleDistance = CC.DistanceBetweenAngles( player.rotation[1], anchorNodeConnections[i].angle );
				if( angleDistance < closestAngle )
				{
					closestConnection = i;
					closestAngle = angleDistance;
				}
			}

			this.targetConnection = anchorNodeConnections[closestConnection];
			this.goTo( this.targetConnection.node.point );
		}
		else
		{
			this.anchorNode = null;
			this.validateAnchorNode();
			this.pickRandomConnection();
		}
	}
};


CharacterControllerAI.prototype.pickRandomConnection = function()
{
	if( this.enabled )
    {
		this.validateAnchorNode();
		if( this.anchorNode && this.anchorNode.connections.length > 0 )
		{
			var randomPath = CC.Random() % this.anchorNode.connections.length;
			this.targetConnection = this.anchorNode.connections[randomPath];
			this.goTo( this.targetConnection.node.point );
		}
	}
};
