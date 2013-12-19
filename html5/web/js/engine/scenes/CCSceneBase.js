/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCSceneBase.js
 * Description : Handles the drawing and updating of objects.
 *
 * Created     : 03/08/11
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

function CCSceneBase()
{
    this.construct();
}
CCSceneBase.NextSceneID = 0;

CCSceneBase.prototype.construct = function()
{
	this.sceneID = CCSceneBase.NextSceneID++;
	CCEngine.NewScene( this );

	this.enabled = true;
	this.deletingScene = false;

    this.objects = [];
    this.collideables = [];

	if( !this.parentScene )
	{
		this.parentScene = null;
	}
	this.linkedScenes = [];

	this.lifetime = 0.0;
};


CCSceneBase.prototype.destruct = function()
{
	this.deleteLater();

	var objects = this.objects;
	while( objects.length > 0 )
	{
		objects[0].destruct();
	}

	this.enabled = false;
};


CCSceneBase.prototype.deleteLater = function()
{
	MultiplayerManager.UpdateCallbacks.remove( this );
    CCEngine.DisableBackButton( this );

	var collideables = this.collideables;
	for( var i=0; i<collideables.length; ++i )
	{
		var collideable = collideables[i];
		collideable.collideableType = CC.collision_none;
	}

	this.deletingScene = true;
	this.deleteLinkedScenesLater();

	if( this.parentScene )
	{
		this.parentScene.deletingChild( this );
		this.parentScene = null;
	}
};


CCSceneBase.prototype.setup = function()
{
};


CCSceneBase.prototype.resize = function()
{
};


CCSceneBase.prototype.resized = function()
{
};


CCSceneBase.prototype.deleteLaterFromParent = function()
{
	this.deleteLater();
};


CCSceneBase.prototype.deleteLinkedScenesLater = function()
{
	var linkedScenes = this.linkedScenes;
	while( linkedScenes.length > 0 )
	{
		var linkedScene = linkedScenes[0];
		linkedScene.unlinkScene( this );
		linkedScenes.remove( linkedScene );
		linkedScene.deleteLaterFromParent();
	}
};


CCSceneBase.prototype.shouldDelete = function()
{
	return this.deletingScene;
};


CCSceneBase.prototype.updateControls = function(controls)
{
    return false;
};


CCSceneBase.prototype.update = function(delta)
{
    this.lifetime += delta;

    if( this.enabled )
	{
		var updated = this.updateScene( delta );
		updated |= this.updateCamera( delta );
		return updated;
	}

    return false;
};


CCSceneBase.prototype.updateScene = function(delta)
{
	var objects = this.objects;
    for( var i=0; i<objects.length; ++i )
    {
		var object = objects[i];
		//if( object.isActive() )
		if( object.deletingObjectCountdown === 0 )	// Optimization: Inlined function call
		{
			object.update( delta );
		}
		else if( object.deletingObjectCountdown > 0 )
		{
			if( --object.deletingObjectCountdown === 0 )
			{
				object.destruct();
				--i;
			}
		}
    }
};


CCSceneBase.prototype.updateCamera = function(delta)
{
};


CCSceneBase.prototype.render = function(camera, pass, alpha)
{
    var objects = this.objects;
    var length = objects.length;
    for( var i=0; i<length; ++i )
    {
        var object = objects[i];
        if( object.renderPass === pass )
        {
			//if( !object.octreeRender && object.isActive() )
			if( !object.octreeRender && object.deletingObjectCountdown === 0 )	// Optimization: Inlined function call
			{
				object.renderObject( camera, alpha );
			}
        }
    }
};


CCSceneBase.prototype.renderVisibleObject = function(object, camera, pass, alpha)
{
    if( camera === gEngine.cameras[0] )
    {
        object.renderObject( camera, alpha );
    }
};


CCSceneBase.prototype.addObject = function(object)
{
	object.inScene = this;
	this.objects.push( object );
};


CCSceneBase.prototype.removeObject = function(object)
{
	object.inScene = null;
	this.objects.remove( object );
};


CCSceneBase.prototype.addCollideable = function(collideable)
{
    this.collideables.add( collideable );
	gEngine.collisionManager.addCollideable( collideable );

	if( CCEngine.NativeUpdateCommands !== undefined )
	{
		CCEngine.NativeUpdateCommands += 'CCSceneBase.addCollideable;' + this.sceneID + ';' + collideable.jsID + '\n';
	}
};


CCSceneBase.prototype.removeCollideable = function(collideable)
{
    this.collideables.remove( collideable );
	gEngine.collisionManager.removeCollideable( collideable );

	if( CCEngine.NativeUpdateCommands !== undefined )
	{
		CCEngine.NativeUpdateCommands += 'CCSceneBase.removeCollideable;' + this.sceneID + ';' + collideable.jsID + '\n';
	}
};


// Tells the scene to inform on deletes
CCSceneBase.prototype.setParent = function(inParent)
{
	this.parentScene = inParent;
};


CCSceneBase.prototype.deletingChild = function(inScene)
{
	// Try to remove pointers automatically :)
	var keys = Object.keys( this );
	for( var i=0; i<keys.length; ++i )
	{
		var key = keys[i];
		if( this[key] === inScene )
		{
			this[key] = null;
		}
	}
};


// Linked scenes are deleted along with this scene
CCSceneBase.prototype.linkScene = function(inScene)
{
    this.linkedScenes.add( inScene );
};


CCSceneBase.prototype.unlinkScene = function(inScene)
{
    this.linkedScenes.remove( inScene );

    if( inScene === this.parentScene )
    {
		this.parentScene.deletingChild( this );
		this.parentScene = null;
    }
};
