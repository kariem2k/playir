/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCPathFinderNetwork.js
 * Description : Network of nodes used for path finding.
 *
 * Created     : 13/10/12
 *-----------------------------------------------------------
 */

function Path()
{
	this.endDirection = 0;
	this.distance = 0.0;
	this.directions = [];
}


function PathConnection()
{
	this.distance = undefined;
	this.angle = undefined;
	this.node = undefined;
}


function PathNode()
{
	this.point = vec3.create();
	this.connections = [];
}


function CCPathFinderNetwork()
{
	this.nodes = [];
	this.testNodes = [];	// Used for searching for an anchor node (findClosestNodeToPathTarget)

	// Used for path finding
	this.path = undefined;
	this.pathingFrom = undefined;
}


CCPathFinderNetwork.prototype.view = function()
{
	var nodes = this.nodes;
	if( nodes.length > 0 )
    {
		var renderer = gRenderer;

        gEngine.textureManager.setTextureIndex( 1 );
        var nodeColour = gColour.setRGBA( 1.0, 0.0, 0.0, 0.125 );
		renderer.CCSetColour( nodeColour );

		var i, node;
        var start = vec3.create();
        var end = vec3.create();

        {
            for( i=0; i<nodes.length; ++i )
            {
                node = nodes[i];
                CCRenderer.GLPushMatrix();
                CCRenderer.GLTranslate( node.point );
                renderer.CCRenderCube( true );
                CCRenderer.GLPopMatrix();
            }

            for( i=0; i<nodes.length; ++i )
            {
                node = nodes[i];
                var connections = node.connections;
                for( var j=0; j<connections.length; ++j )
                {
					var connection = connections[j].node.point;
					vec3.copy( start, [ node.point[0], 2.0, node.point[2] ] );
					vec3.copy( end, [ connection[0], 2.0, connection[2] ] );
					renderer.CCRenderLine( start, end );
                }
            }
        }

        if( this.path )
        {

			var pathColour = gColour.setRGBA( 0.0, 1.0, 0.25, 1.0 );
			{
				renderer.CCSetColour( pathColour );

				var currentNode = this.pathingFrom;
				var path = this.path;
				for( i=0; i<path.endDirection; ++i )
				{
					var connectionIndex = path.directions[i];
					if( connectionIndex < currentNode.connections.length )
					{
						var toNode = currentNode.connections[connectionIndex].node;
						start.set( [ currentNode.point[0], 3.0, currentNode.point[2] ] );
						end.set( [ toNode.point[0], 3.0, toNode.point[2] ] );
						renderer.CCRenderLine( start, end );
						currentNode = toNode;
					}
				}
			}
		}
    }
};


CCPathFinderNetwork.prototype.addNode = function(point, parent)
{
	var node = new PathNode();
	node.point = point;
	if( parent )
	{
		node.parent = parent;
	}
	this.nodes.add( node );
	this.testNodes.add( node );
	return node;
};


CCPathFinderNetwork.prototype.addCollideable = function(collideable, extents)
{
	var maxIncrement = 150.0;
	var minIncrement = 50.0;

	var startX = collideable.aabbMin[0] - minIncrement;
	var endX = collideable.aabbMax[0] + minIncrement;
	var width = endX - startX;
	var numberOfIncrements = Math.round( ( width / maxIncrement ) + 0.5 );
	var spacingX = width / numberOfIncrements;

	var startZ = collideable.aabbMin[2] - minIncrement;
	var endZ = collideable.aabbMax[2] + minIncrement;
	var depth = endZ - startZ;
	numberOfIncrements = Math.round( ( depth / maxIncrement ) + 0.5  );
	var spacingZ = depth / numberOfIncrements;

	var x, z;

	// Front and back rows
	for( x=startX; x<endX+1.0; x+=spacingX )
	{
        if( x > -extents[0] && x < extents[0] )
        {
            for( z=startZ; z<endZ+1.0; z+=depth )
            {
                if( z > -extents[2] && z < extents[2] )
                {
                    this.addNode( vec3.clone( [ x, 0.0, z ] ), collideable );
                }
            }
		}
	}

	// Left and right rows
	for( z=startZ+spacingZ; z<endZ+1.0-spacingZ; z+=depth-spacingZ )
	{
        if( z > -extents[2] && z < extents[2] )
        {
            for( x=startX; x<endX+1.0; x+=spacingX )
            {
                if( x > -extents[0] && x < extents[0] )
                {
                    this.addNode( vec3.clone( [ x, 0.0, z ] ), collideable );
                }
            }
		}
	}
};


CCPathFinderNetwork.prototype.removeCollideable = function(collideable)
{
	var nodes = this.nodes;
	var testNodes = this.testNodes;
	for( var i=0; i<nodes.length; ++i )
	{
		var node = nodes[i];
		if( node.parent === collideable )
		{
			nodes.remove( node );
			testNodes.remove( node );
			--i;
		}
	}
};


CCPathFinderNetwork.prototype.addFillerNodes = function(collideable)
{
	CC.UpdateCollisions( collideable );

	var maxIncrement = 100.0;
	var minIncrement = maxIncrement;

	var startX = collideable.aabbMin[0] + minIncrement;
	var endX = collideable.aabbMax[0] - minIncrement;
	var width = endX - startX;
	var numberOfIncrements = Math.round( ( width / maxIncrement ) + 0.5  );
    if( numberOfIncrements < 1.0 )
    {
        numberOfIncrements = 1.0;
    }
	var spacingX = width / numberOfIncrements;

	var startZ = collideable.aabbMin[2] + minIncrement;
	var endZ = collideable.aabbMax[2] - minIncrement;
	var depth = endZ - startZ;
	numberOfIncrements = Math.round( ( depth / maxIncrement ) + 0.5  );
    if( numberOfIncrements < 1.0 )
    {
        numberOfIncrements = 1.0;
    }
	var spacingZ = depth / numberOfIncrements;

	for( var x=startX; x<endX+1.0; x+=spacingX )
	{
		for( var z=startZ; z<endZ+1.0; z+=spacingZ )
		{
			this.addNode( vec3.clone( [ x, 0.0, z ] ) );
		}
	}
};


CCPathFinderNetwork.prototype.linkDistantNodes = function()
{
	var nodes = this.nodes;
	if( nodes.length > 0 )
	{
		var BIG_FLOAT = 10000.0;
		var topLeft = this.findClosestNode( [-BIG_FLOAT, 0.0, -BIG_FLOAT ] );
		var topRight = this.findClosestNode( [BIG_FLOAT, 0.0, -BIG_FLOAT ] );
		var bottomLeft = this.findClosestNode( [-BIG_FLOAT, 0.0, BIG_FLOAT ] );
		var bottomRight = this.findClosestNode( [BIG_FLOAT, 0.0, BIG_FLOAT ] );

		if( topLeft && topRight && bottomLeft && bottomRight )
		{
			var startX = topLeft.point[0] < bottomLeft.point[0] ? topLeft.point[0] : bottomLeft.point[0];
			var endX = topRight.point[0] > bottomRight.point[0] ? topRight.point[0] : bottomRight.point[0];
			var startZ = topLeft.point[2] < topRight.point[2] ? topLeft.point[2] : topRight.point[2];
			var endZ = bottomLeft.point[2] > bottomRight.point[2] ? bottomLeft.point[2] : bottomRight.point[2];

			var x = startX;
			var z = startZ;
			var increment = 150.0;
			while( x < endX && z < endZ )
			{
				x += increment;
				if( x >= endX )
				{
					x = startX + increment;
					z += increment;
				}

				if( z < endZ )
				{
					this.addNode( vec3.clone( [ x, 0.0, z ] ) );
				}
			}
		}
	}
};


CCPathFinderNetwork.prototype.removeFillerNodes = function()
{
	var nodes = this.nodes;
	var testNodes = this.testNodes;
	for( var i=0; i<nodes.length; ++i )
	{
		var node = nodes[i];
		if( !node.parent )
		{
			nodes.remove( node );
			testNodes.remove( node );
			--i;
		}
	}
};


CCPathFinderNetwork.prototype.clear = function()
{
	this.nodes.length = 0;
    this.pathingFrom = null;
};


// Connect our nodes
CCPathFinderNetwork.prototype.connect = function()
{
	this.removeFillerNodes();
	this.linkDistantNodes();

	var nodes = this.nodes;
	var i, connections, currentNode, connection;

	// Reset our connections
	for( i=0; i<nodes.length; ++i )
	{
		currentNode = nodes[i];
		connections = currentNode.connections;
		connections.length = 0;
	}

	var maxNodeDistance = CC.SQUARE( 200.0 );
	for( i=0; i<nodes.length; ++i )
	{
		currentNode = nodes[i];
		connections = currentNode.connections;

		for( var j=0; j<nodes.length; ++j )
		{
			var targetNode = nodes[j];
			if( currentNode !== targetNode )
			{
				var distance = CC.Vector3Distance2D( currentNode.point, targetNode.point );
				if( distance < maxNodeDistance )
				{
					var angle = CC.AngleTowardsVector( currentNode.point, targetNode.point );

					// Check to see if we already have this angle
					//if( false )
					{
						var angleFoundIndex = -1;
						for( var k=0; k<connections.length; ++k )
						{
							if( angle === connections[k].angle )
							{
								angleFoundIndex = k;
								break;
							}
						}

						// We already have an angle connected closer
						if( angleFoundIndex !== -1 )
						{
							if( distance >= connections[angleFoundIndex].distance )
							{
								continue;
							}
							else
							{
								connections.remove( connections[angleFoundIndex] );
							}
						}

						// Insert our node
						var newConnection = new PathConnection();
						newConnection.distance = distance;
						newConnection.angle = angle;
						newConnection.node = targetNode;
						connections.add( newConnection );
					}
				}
			}
		}
	}
};



CCPathFinderNetwork.prototype.findClosestNodes = function(position, radius, vectors, length)
{
	var nodes = this.nodes;

	for( var i=0; i<nodes.length && vectors.length<length; ++i )
	{
		var node = nodes[i];
		if( node.connections.length > 0 )
		{
			var distance = CC.Vector3Distance2D( position, node.point );
			if( distance < radius )
			{
				vectors.add( node.point );
			}
		}
	}

	return vectors.length;
};


CCPathFinderNetwork.prototype.findClosestNodeToPathTarget = function(objectToPath, position, withConnections)
{
	var i;
	var nodes = this.testNodes;
	var nodesLength = nodes.length;
	for( i=0; i<nodesLength; ++i )
	{
		nodes[i].distance = undefined;
	}

	nodes.sort( function (a, b)
	{
		var distanceA = a.distance = ( a.distance !== undefined ) ? a.distance : CC.Vector3Distance2D( a.point, position );
		var distanceB = b.distance = ( b.distance !== undefined ) ? b.distance : CC.Vector3Distance2D( b.point, position );
		return ( distanceA - distanceB );
	});

	var closestNode = null;
	var closestDistance = CC_MAXFLOAT;
	var MovementCollisionCheckFunction = CC.MovementCollisionCheck;

	for( i=0; i<nodesLength; ++i )
	{
		var node = nodes[i];
		if( !withConnections || node.connections.length > 0 )
		{
			var distance = node.distance;
			if( distance < closestDistance )
			{
                var hitObject = MovementCollisionCheckFunction( objectToPath, position, node.point, CC.collision_static );
                if( hitObject )
                {
                    continue;
                }
                if( !hitObject )
                {
                    closestDistance = distance;
                    closestNode = node;
                }
			}
		}
	}

	if( closestNode )
	{
		return closestNode;
	}

	return null;
};


CCPathFinderNetwork.prototype.findClosestNode = function(position)
{
	var nodes = this.nodes;

	var closestNode = null;
	var closestDistance = CC_MAXFLOAT;

	for( var i=0; i<nodes.length; ++i )
	{
		var node = nodes[i];
		var distance = CC.Vector3Distance2D( node.point, position );
		if( distance < closestDistance )
		{
			closestDistance = distance;
			closestNode = node;
		}
	}

	return closestNode;
};


CCPathFinderNetwork.compareNode = undefined;
CCPathFinderNetwork.targetNode = undefined;
function followPathCompare(a, b)
{
	var pathA = CCPathFinderNetwork.compareNode.connections[a];
	var pathB = CCPathFinderNetwork.compareNode.connections[b];

	var pathADistance = CC.Vector3Distance2D( pathA.node.point, CCPathFinderNetwork.targetNode.point );
	var pathBDistance = CC.Vector3Distance2D( pathB.node.point, CCPathFinderNetwork.targetNode.point );

	return ( pathADistance - pathBDistance );
}


CCPathFinderNetwork.prototype.findPath = function(objectToPath, fromNode, toNode)
{
	if( fromNode && toNode )
    {
        var previousNodes = [];
        previousNodes.add( fromNode );

        CCPathFinderNetwork.targetNode = toNode;
        this.path = new Path();
        this.followPath( objectToPath, this.path, 0, 0.0, previousNodes, fromNode, toNode );

        this.pathingFrom = fromNode;
        return this.path;
    }
    return null;
};


CCPathFinderNetwork.prototype.followPath = function(objectToPath,
													path, currentDirection,
													currentDistance,
													previousNodes,
													fromNode, toNode)
{
	var i;

	// Node found
	if( fromNode === toNode )
	{
		path.endDirection = currentDirection;
		path.distance = currentDistance;
		return true;
	}

	var nextDirection = currentDirection+1;
	if( nextDirection >= 10 )
	{
		// Give up
		return false;
	}

	CCPathFinderNetwork.compareNode = fromNode;
	var connections = fromNode.connections;
	var connectionsLength = connections.length;

	var values = new Array( connectionsLength );
	for( i=0; i<connectionsLength; ++i )
	{
		values[i] = i;
	}
	values.sort( followPathCompare );

	var MovementCollisionCheckFunction = CC.MovementCollisionCheck;

	for( i=0; i<connectionsLength; ++i )
	{
		var nextConnection = connections[ values[i] ];

		var targetNode = nextConnection.node;

		// Previously followed?
		if( previousNodes.find( targetNode ) >= 0 )
		{
			continue;
		}

		var collidedWith = MovementCollisionCheckFunction( objectToPath, fromNode.point, targetNode.point, CC.collision_static );
		if( collidedWith )
		{
			continue;
		}

		var pathDistance = currentDistance + nextConnection.distance;
		previousNodes.add( targetNode );

		if( this.followPath( objectToPath, path, nextDirection, pathDistance, previousNodes, targetNode, toNode ) )
		{
			path.directions[currentDirection] = values[i];
			return true;
		}
	}

	return false;
};
