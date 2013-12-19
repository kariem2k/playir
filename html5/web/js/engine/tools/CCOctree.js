/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCOctree.js
 * Description : Octree container used for collisions and rendering.
 *
 * Created     : 14/10/12
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */


CC.CollideablesInFrustum = function(frustum, collideables, visibleCollideables)
{
	// Cache frustum function
    var CubeInFrustum = CC.CubeInFrustum;

	var length = collideables.length;
    for( var i=0; i<length; ++i )
    {
        var object = collideables[i];

        // Unrolled object.isActive() call -> !object.deletingObjectCountdown
		if( !object.deletingObjectCountdown && object.shouldRender )
		{
			if( CubeInFrustum( frustum, object.aabbMin, object.aabbMax ) )
			{
				visibleCollideables.push( object );
				object.visible = true;
			}
		}
    }
};


CC.ScanVisibleCollideables = function(frustum, collideables, visibleCollideables)
{
	visibleCollideables.length = 0;
	CC.CollideablesInFrustum( frustum, collideables, visibleCollideables );
};


CC.RenderVisibleObjects = function(camera, pass, alpha)
{
	var visibleCollideables = camera.visibleCollideables;
	var length = visibleCollideables.length;

	for( var i=0; i<length; ++i )
	{
		var object = visibleCollideables[i];
		if( object && object.renderPass === pass )
		{
			var scene = object.inScene;
            if( scene )
            {
                // Ask the scene if we should render this obejct
                scene.renderVisibleObject( object, camera, pass, alpha );
            }
            else
            {
				//DEBUGLOG( "CCRenderVisibleObjects ERROR: Object has no scene : %s\n", object.getDebugName() );
            }
		}
	}
};


function CCOctree()
{
}

CCOctree.MAX_TREE_OBJECTS = 64;

CCOctree.leaf_bottom_front_left = 0;
CCOctree.leaf_bottom_front_right = 1;
CCOctree.leaf_bottom_back_left = 2;
CCOctree.leaf_bottom_back_right = 3;
CCOctree.leaf_top_front_left = 4;
CCOctree.leaf_top_front_right = 5;
CCOctree.leaf_top_back_left = 6;
CCOctree.leaf_top_back_right = 7;


function CCOctree(inParent, position, size)
{
	this.parent = inParent;
	this.leafs = null;
	this.objects = [];

	this.hSize = size * 0.5;
	this.min = vec3.clone( position );
	this.max = vec3.clone( position );
	vec3.addValue( this.min, -this.hSize );
	vec3.addValue( this.max, this.hSize );
}


CCOctree.DeleteLeafs = function(tree)
{
	// Ensure all our leafs are deleted
	if( tree.leafs )
	{
		for( var i=0; i<8; ++i )
		{
			if( tree.leafs[i] )
			{
				var leaf = tree.leafs[i];
				CCOctree.DeleteLeafs( leaf );
			}
		}

		delete tree.leafs;
	}
};


// Create the top leafs
CCOctree.SplitTopLeafs = function(tree, index, position)
{
	position = vec3.clone( position );
	position[1] += tree.hSize;
	var leaf = new CCOctree( tree, position, tree.hSize );
	tree.leafs[index+4] = leaf;
};


CCOctree.Split = function(tree)
{
    //CCASSERT( tree.leafs == NULL );
	tree.leafs = [];

	// Create our leaf nodes
	var index = CCOctree.leaf_bottom_front_left;
	var position = vec3.clone( tree.min );
    vec3.addValue( position, tree.hSize * 0.5 );
    var leaf = new CCOctree( tree, position, tree.hSize );
	tree.leafs[index] = leaf;
	CCOctree.SplitTopLeafs( tree, index, position );

	index = CCOctree.leaf_bottom_front_right;
	position[0] += tree.hSize;
	leaf = new CCOctree( tree, position, tree.hSize );
	tree.leafs[index] = leaf;
	CCOctree.SplitTopLeafs( tree, index, position );

	index = CCOctree.leaf_bottom_back_right;
	position[2] += tree.hSize;
	leaf = new CCOctree( tree, position, tree.hSize );
	tree.leafs[index] = leaf;
	CCOctree.SplitTopLeafs( tree, index, position );

	index = CCOctree.leaf_bottom_back_left;
	position[0] -= tree.hSize;
	leaf = new CCOctree( tree, position, tree.hSize );
	tree.leafs[index] = leaf;
	CCOctree.SplitTopLeafs( tree, index, position );

	// Now we need to sort our objects into our new leafs
	var objects = tree.objects;
	while( objects.length > 0 )
	{
		collideable = tree.objects[0];
        CCOctree.RemoveObjectsOctree( tree, collideable );
        CC.UpdateCollisions( collideable );

		for( var i=0; i<8; ++i )
		{
			leaf = tree.leafs[i];
			if( CCOctree.IsInLeaf( leaf, collideable.aabbMin, collideable.aabbMax ) )
			{
				CCOctree.AddObject( leaf, collideable );
			}
		}
	}
};


CCOctree.AddObject = function(tree, collideable)
{
	// If the object is outside the octree's limits, just add to main tree
	if( !tree.parent )
	{
		CC.UpdateCollisions( collideable, false );

		var objectMin = collideable.aabbMin;
		var objectMax = collideable.aabbMax;
		if( objectMax[0] < tree.min[0] )
		{
			tree.objects.push( collideable );
			collideable.octrees.push( tree );
			return;
		}

		if( objectMax[1] < tree.min[1] )
		{
			tree.objects.push( collideable );
			collideable.octrees.push( tree );
			return;
		}

		if( objectMax[2] < tree.min[2] )
		{
			tree.objects.push( collideable );
			collideable.octrees.push( tree );
			return;
		}

		if( objectMin[0] > tree.max[0] )
		{
			tree.objects.push( collideable );
			collideable.octrees.push( tree );
			return;
		}

		if( objectMin[1] > tree.max[1] )
		{
			tree.objects.push( collideable );
			collideable.octrees.push( tree );
			return;
		}

		if( objectMin[2] > tree.max[2] )
		{
			tree.objects.push( collideable );
			collideable.octrees.push( tree );
			return;
		}
	}

	// Insert in an approperate leaf node
	if( tree.leafs )
	{
        CCOctree.RemoveObjectsOctree( tree, collideable );

		for( var i=0; i<8; ++i )
		{
			var leaf = tree.leafs[i];
			if( CCOctree.IsInLeaf( leaf, collideable.aabbMin, collideable.aabbMax ) )
			{
				CCOctree.AddObject( leaf, collideable );
			}
		}
	}

	// Unless we don't have any
    else if( tree.objects.length < CCOctree.MAX_TREE_OBJECTS )
	{
        tree.objects.push( collideable );
		collideable.octrees.push( tree );
        //LOG_NEWMAX( "Max trees per object", maxOctreesPerObject, collideable.octrees.length );
	}

    // Give up because the tree is too small..
    else if( tree.hSize < 100.0 )
    {
        tree.objects.push( collideable );
        collideable.octrees.push( tree );
        //LOG_NEWMAX( "Max trees per object", maxOctreesPerObject, collideable.octrees.length );
    }

	// If we have too many objects split the octree
	else
	{
		CCOctree.Split( tree );

		// Try again
		CCOctree.AddObject( tree, collideable );
	}
};


CCOctree.RemoveObjectsOctree = function(tree, collideable)
{
    tree.objects.remove( collideable );
    collideable.octrees.remove( tree );
};


CCOctree.RemoveObject = function(collideable)
{
	var octrees = collideable.octrees;
	while( octrees.length > 0 )
	{
		var tree = octrees[0];
        CCOctree.RemoveObjectsOctree( tree, collideable );

		if( tree.objects.length === 0 )
		{
			if( gEngine.collisionManager.pruneTreesTimer <= 0.0 )
			{
				gEngine.collisionManager.pruneTreesTimer = 0.5;
			}
		}
	}
};


CCOctree.RefreshObject = function(object)
{
	CCOctree.RemoveObject( object );

	// Unrolled object.isActive() call -> !object.deletingObjectCountdown
	if( !object.deletingObjectCountdown && object.shouldRender )
	{
		CCOctree.AddObject( gEngine.collisionManager.octree, object );
	}

    //CCASSERT( object.numberOfOctrees > 0 );
};


CCOctree.PruneTree = function(tree)
{
	if( tree.leafs )
	{
		var hasObjects = CCOctree.HasObjects( tree );
		if( !hasObjects )
		{
			CCOctree.DeleteLeafs( tree );
		}
		else
		{
			for( var i=0; i<8; ++i )
			{
				CCOctree.PruneTree( tree.leafs[i] );
			}
		}
	}
};


CCOctree.IsInLeaf = function(leaf, targetMin, targetMax)
{
	var sourceMin = leaf.min;
	var sourceMax = leaf.max;

	if( sourceMax[1] >= targetMin[1] && sourceMin[1] <= targetMax[1] )
	{
		if( sourceMax[0] >= targetMin[0] && sourceMin[0] <= targetMax[0] )
		{
			if( sourceMax[2] >= targetMin[2] && sourceMin[2] <= targetMax[2] )
			{
				return true;
			}
		}
	}

	return false;
};


CCOctree.HasObjects = function(tree)
{
	if( tree.objects.length > 0 )
    {
        return true;
    }

	if( tree.leafs )
	{
		for( var i=0; i<8; ++i )
		{
			if( CCOctree.HasObjects( tree.leafs[i] ) )
            {
                return true;
            }
		}
	}

	return false;
};


CCOctree.Render = function(tree)
{
	// if( !tree.parent )
	// {
	// 	//GLDisableDepth();
	// }

	// if( tree.objects.length > 0 )
	// {
	// 	const float full = tree.objects.length / (float)CCOctree.MAX_TREE_OBJECTS;
	// 	//glLineWidth( tree.numberOfObjects * 0.05f );
 //        CCColour colour( full, 1.0f - full, 0.0f, 1.0f );
	// 	CCSetColour( colour );
	// 	CCRenderCubeMinMax( tree.min, tree.max, true );
	// }

	// if( tree.leafs )
	// {
	// 	for( var i=0; i<8; ++i )
	// 	{
	// 		CCOctreeRender( tree.leafs[i] );
	// 	}
	// }

	// if( !tree.parent )
	// {
	// 	//GLEnableDepth();
	// 	//glLineWidth( LINE_WIDTH );
	// }
};


CCOctree.ListVisibles = function(leafs, collideables)
{
	var leafsLength = leafs.length;
	for( var leafIndex=0; leafIndex<leafsLength; ++leafIndex )
	{
		var leaf = leafs[leafIndex];
		var leafObjects = leaf.objects;
		var leafObjectsLength = leaf.objects.length;
		for( var i=0; i<leafObjectsLength; ++i )
		{
			var collideable = leafObjects[i];

			// Unrolled collideable.isActive() call -> !collideable.deletingObjectCountdown
			if( !collideable.deletingObjectCountdown && collideable.shouldRender )
			{
                if( collideable.shouldRender && collideable.octreeRender )
				{
					collideables.addOnce( collideable );
				}
			}
		}
	}
};


CCOctree.FillLeafsInFrustum = function(frustum, tree, leafsList)
{
	var i;
	var leafs = tree.leafs;
    if( leafs )
    {
        for( i=0; i<8; ++i )
        {
			var leaf = leafs[i];
			if( !tree.parent || CC.CubeInFrustum( frustum, leaf.min, leaf.max ) )
			{
				CCOctree.FillLeafsInFrustum( frustum, leaf, leafsList );
            }
        }
    }
    else
    {
		leafsList.push( tree );
    }
};


CCOctree.VisibleLeafs = [];
CCOctree.VisibleCollideables = [];
CCOctree.ScanVisibleCollideables = function(frustum, visibleCollideables)
{
	var leafs = CCOctree.VisibleLeafs;
	var octreeCollideables = CCOctree.VisibleCollideables;

    // First find all the octrees that collide with the frustum
    leafs.length = 0;
    CCOctree.FillLeafsInFrustum( frustum, gEngine.collisionManager.octree, leafs );

    // Then list all the objects from the octrees
    octreeCollideables.length = 0;
    CCOctree.ListVisibles( leafs, octreeCollideables );

    // Finally find all the collideables that collide with the frustum
    visibleCollideables.length = 0;
    CC.CollideablesInFrustum( frustum, octreeCollideables, visibleCollideables );

    return visibleCollideables;
};



// Used by CollisionTools
CCOctree.ListCollideables = function(collideables, leafs)
{
	var leafsLength = leafs.length;
	for( var leafIndex=0; leafIndex<leafsLength; ++leafIndex )
	{
		var leaf = leafs[leafIndex];
		var leafObjects = leaf.objects;
		var leafObjectsLength = leaf.objects.length;
		for( var i=0; i<leafObjectsLength; ++i )
		{
			var collideable = leafObjects[i];

			// Unrolled collideable.isActive() call -> !collideable.deletingObjectCountdown
			if( !collideable.deletingObjectCountdown && collideable.shouldRender )
			{
                if( !CC.HasFlag( collideable.collideableType, CC.collision_none ) )
				{
					collideables.addOnce( collideable );
				}
			}
		}
	}
};


CCOctree.ListLeafs = function(tree, targetMin, targetMax, leafsList)
{
	var i;
	if( tree.leafs )
	{
		for( i=0; i<8; ++i )
		{
            CCOctree.ListLeafs( tree.leafs[i], targetMin, targetMax, leafsList );
		}
	}
	else if( tree.objects.length > 0 )
	{
		var length = leafsList.length;
		for( i=0; i<length; ++i )
		{
			if( leafsList[i] == tree )
			{
				return;
			}
		}

		if( CCOctree.IsInLeaf( tree, targetMin, targetMax ) )
		{
			leafsList.push( tree );
		}
	}
};
