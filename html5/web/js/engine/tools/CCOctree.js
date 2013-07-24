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

function CCOctree()
{
}


CC.ScanVisibleCollideables = function(frustum, collideables, visibleCollideables)
{
	visibleCollideables.length = 0;

	var length = collideables.length;
    for( var i=0; i<length; ++i )
    {
        var object = collideables[i];
		if( object.isActive() && object.shouldRender )
		{
			if( CC.CubeInFrustum( frustum, object.aabbMin, object.aabbMax ) )
			{
				visibleCollideables.push( object );
			}
		}
    }
};


CCOctree.RenderVisibleObjects = function(camera, pass, alpha)
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
                scene.renderOctreeObject( object, camera, pass, alpha );
            }
            else
            {
				//DEBUGLOG( "CCOctreeRenderVisibleObjects ERROR: Object has no scene : %s\n", object->getDebugName() );
            }
		}
	}
};
