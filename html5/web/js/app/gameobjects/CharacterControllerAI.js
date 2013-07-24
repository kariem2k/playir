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
CharacterControllerAI.cycle_random = 2;
CharacterControllerAI.cycle_aiNodes = 3;

CharacterControllerAI.max_waypoints = 50;


CharacterControllerAI.prototype.construct = function(pathFinderNetwork)
{
	this.CharacterControllerPlayer_construct( pathFinderNetwork );

	this.waypoints = [];
	this.waypointCurrent = 0;

	this.waypointCycle = CharacterControllerAI.cycle_off;
	this.targetConnection = null;

	this.nodesPerMovementCycle = 0;
	this.wait = 0.0;

	this.enemy = null;
	this.scanForEnemyTimer = 0.0;
	this.followingEnemy = false;
	this.distanceToEnemy = CC_MAXFLOAT;
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
                if( this.scanForEnemyTimer > 2.0 )
                {
                    this.scanForEnemyTimer -= 2.0;

                    this.distanceToEnemy = CC.Vector3Distance2D( this.player.position, this.enemy.position, true );
                    if( this.distanceToEnemy < CC.SQUARE( 100.0 ) )
                    {
                        this.targetEnemy();
                    }
                    else if( !this.moving )
                    {
                        // Restart tracking if we've stopped moving
                        if( this.followingEnemy )
                        {
                            this.followingEnemy = false;
                        }

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
                            else
                            {
                                this.nextWaypoint();
                            }
                        }
                    }
                }
            }
        }

        if( this.shootingState === CharacterControllerPlayer.state_stopped )
        {
            if( this.followingEnemy )
            {
                if( !enemy )
                {
                    this.followingEnemy = false;
                }
                else if( this.distanceToEnemy < CC.SQUARE( 50.0 ) )
                {
                    this.shoot( enemy.position, enemy );
                }
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

	if( this.wait > 0.0 )
	{
		player.movementDirection.z = 0.0;
		this.wait -= delta;

		if( this.wait <= 0.0 )
		{
			this.goTo( this.targetConnection.node.point );
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
				var i;

				if( this.waypointCycle === CharacterControllerAI.cycle_aiNodes && this.enabled && !this.followingEnemy )
				{
                    if( !this.pathAnchorNode || !this.targetConnection )
                    {
						this.validateAnchorNode();
                        this.pickRandomNode();
                    }
					else if( this.targetConnection.distance > 10.0 || distance < 0.1 )
					{
						this.pathAnchorNode = this.targetConnection.node;
						this.anchorNode = this.pathAnchorNode;

						if( this.nodesPerMovementCycle++ > 10 )
						{
							var shouldWait = CC.Random() % 5;
							if( shouldWait === 0 )
							{
								this.wait = ( CC.Random() % 15 ) + 5.0;
							}
							else
							{
								movementMagnitude = ( ( CC.Random() % 5 ) * 0.1 ) + 0.3;
							}
							this.nodesPerMovementCycle = 0;
						}

						// Pick a path from that node
						var randomType = CC.Random() % 5;
						if( randomType > 1 )
						{
							var closestConnection = 0;
							var closestAngle = CC_MAXFLOAT;

							var pathAnchorNode = this.pathAnchorNode;
							var pathAnchorNodeConnections = pathAnchorNode.connections;
							var pathAnchorNodeConnectionsLength = pathAnchorNodeConnections.length;
							for( i=0; i<pathAnchorNodeConnectionsLength; ++i )
							{
								var angleDistance = CC.DistanceBetweenAngles( player.rotation[1], pathAnchorNodeConnections[i].angle );
								if( angleDistance < closestAngle )
								{
									closestConnection = i;
									closestAngle = angleDistance;
								}
							}

							if( pathAnchorNodeConnections.length > 0 )
							{
								this.targetConnection = pathAnchorNodeConnections[closestConnection];
								this.goTo( this.targetConnection.node.point );
							}
							else
							{

							}
						}
						else
						{
							this.pickRandomNode();
						}
					}
				}
				else
				{
                    if( this.landPlayerOnTarget( distance, delta ) )
                    {
                        if( this.enabled && !this.followingEnemy )
                        {
                            if( this.waypointCycle === CharacterControllerAI.cycle_off )
                            {
                                if( this.waypoints.length > 0 )
                                {
                                    this.waypoints.length--;
                                    if( this.waypoints.length > 0 )
                                    {
                                        for( i=0; i<this.waypoints.length; ++i )
                                        {
                                            this.waypoints[i] = this.waypoints[i+1];
                                        }
                                        this.goToUsingPath( this.waypoints[0] );
                                    }
                                }
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

	if( this.waypointCycle === CharacterControllerAI.cycle_random )
	{
		this.nextWaypoint();
	}
	else if( this.waypointCycle === CharacterControllerAI.cycle_aiNodes )
	{
		this.wait = 0.0;
		this.pickRandomNode();
	}
	else if( this.waypointCycle === CharacterControllerAI.cycle_inOrder )
	{
		this.nextWaypoint();
	}
	else
	{
		this.waypointCycle = this.waypointCycle;
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


CharacterControllerAI.prototype.targetEnemy = function()
{
    this.goToUsingPath( this.enemy.position );
    this.followingEnemy = true;
};


CharacterControllerAI.prototype.setWaypointCycle = function(inCycleType)
{
	this.waypointCycle = inCycleType;

    if( this.enabled )
    {
        if( this.waypointCycle === CharacterControllerAI.cycle_random )
        {
            this.waypointCurrent = CC.Random() % this.waypoints.length;
            this.goTo( waypoints[this.waypointCurrent] );
        }
        else if( this.waypointCycle === CharacterControllerAI.cycle_aiNodes )
        {
			this.validateAnchorNode();
            this.pickRandomNode();
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
	if( this.waypointCycle === CharacterControllerAI.cycle_inOrder )
	{
		this.waypointCurrent++;
		if( this.waypointCurrent >= this.waypoints.length )
		{
			this.waypointCurrent = 0;
		}
	}
	else if( this.waypointCycle === CharacterControllerAI.cycle_random )
	{
		this.waypointCurrent = CC.Random() % this.waypoints.length;
	}

	if( this.waypointCurrent < this.waypoints.length )
	{
		this.goToUsingPath( this.waypoints[this.waypointCurrent] );
	}
};


CharacterControllerAI.prototype.pickRandomNode = function()
{
	if( this.anchorNode && this.anchorNode.connections.length > 0 )
	{
		var randomPath = CC.Random() % this.anchorNode.connections.length;
		this.targetConnection = this.anchorNode.connections[randomPath];
		this.goTo( this.targetConnection.node.point );
	}
};
