/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCEngine.js
 * Description : Handles the engine loop and feature managers.
 *
 * Created     : 24/07/11
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

function CCEngine()
{
	this.scenes = [];
	this.cameras = [];

	this.timeReal = 0;
	this.lifetime = 0;
	this.lastUpdate = 0;

	this.fpsTimer = 0.0;
	this.fpsTicks = 0;

	CCCameraBase.SetVisibleSortFunction( CCEngine.ZCompare );

	this.setup();
}
window.gEngine = null;

CCEngine.BackButtonStack = [];
CCEngine.DeviceType = "Web";
CCEngine.Orientation = {current:0.0, target:0.0};

CCEngine.IsPortrait = function()
{
	return CCEngine.Orientation.target === 0.0 || CCEngine.Orientation.target === 180.0;
};


CCEngine.SetOrientation = function(current, target)
{
	CCEngine.Orientation.current = current;
	CCEngine.Orientation.target = target;
};


CCEngine.ProjectOrientation = function(x, y, result)
{
	var temp;
	if( CCEngine.Orientation.target === 270.0 )
    {
		temp = x;
		x = y;
		y = temp;

        x = 1.0 - x;
    }
    else if( CCEngine.Orientation.target === 90.0 )
    {
		temp = x;
		x = y;
		y = temp;

        y = 1.0 - y;
    }
    else if( CCEngine.Orientation.target === 180.0 )
    {
        x = 1.0 - x;
    }
    else
    {
    }

    result( x, y );
};


CCEngine.ZCompare = function(a, b)
{
    var objectA = a;
    var objectB = b;
    var drawOrderA = objectA.drawOrder;
    var drawOrderB = objectB.drawOrder;

    if( drawOrderA === 200 || drawOrderB === 200 )
    {
        if( drawOrderA === 200 && drawOrderB === 200 )
        {
            var cameraPosition = CCCameraBase.currentCamera.currentRotatedPosition;
            var positionA = objectA.position;
            var positionB = objectB.position;
            var distanceA = vec3.distance( positionA, cameraPosition, true );
            var distanceB = vec3.distance( positionB, cameraPosition, true );

            // If A is smaller than B, swap
            return distanceB - distanceA;
        }

        // Largest to the back to be drawn last
        return drawOrderA - drawOrderB;
    }

    // Largest to the back to be drawn last
    return drawOrderA - drawOrderB;
};


CCEngine.prototype.updateTime = function()
{
    var currentTime = Date.now();

    var delta = ( currentTime - this.lastUpdate ) * 0.001;
    this.timeReal = delta;
	delta = delta > 0.05 ? 0.05 : delta;	// 20 fps
    this.lastUpdate = currentTime;

    return delta;
};


CCEngine.prototype.update = function(delta)
{
	this.lifetime += delta;

	var i, scene;

	// Remove any redundant scenes
    var scenes = this.scenes;
    var scenesLength = scenes.length;
	for( i=0; i<scenesLength; ++i )
	{
		scene = scenes[i];
		if( scene.shouldDelete() )
		{
			this.removeScene( scene );
			i--;
			scenesLength = scenes.length;

			gRenderer.pendingRender = true;
		}
	}

	//{
	//	this.fpsTimer += this.timeReal;
	//	this.fpsTicks++;
	//	if( this.fpsTimer > 1.0 )
	//	{
	//		this.fpsTimer -= 1.0;
	//		CC.DEBUGLOG( this.fpsTicks );
	//		this.fpsTicks = 0;
	//	}
	//}

	this.controls.update( delta );

    for( i=0; i<scenesLength; ++i )
    {
        scenes[i].update( delta );
    }
};


// Update our touch controls
CCEngine.prototype.updateControls = function()
{
	var controls = this.controls;

    // Update the controls from the inverse camera draw order
	var cameras = this.cameras;
	var camerasLength = cameras.length;
    var scenes = this.scenes;
    var scenesLength = scenes.length;

    for( var cameraIndex=camerasLength-1; cameraIndex>=0; --cameraIndex )
	{
		var camera = cameras[cameraIndex];
		if( !camera.enabled )
		{
			continue;
		}

		var scene;
		if( camera.scene )
		{
			scene = camera.scene;
			if( scene.updateControls( controls ) )
			{
				return true;
			}
		}
		else
		{
			for( var i=scenesLength-1; i>=0; --i )
			{
				scene = scenes[i];
				if( scene.camera === camera )
				{
					if( scene.updateControls( controls ) )
					{
						return true;
					}
				}
			}
		}
	}

    return false;
};


CCEngine.prototype.newSceneCamera = function(scene, index, CameraType, alwaysOnTop)
{
	if( !CameraType )
	{
		CameraType = CCCameraAppUI;
	}

	var camera = scene.camera = new CameraType();
	camera.scene = scene;

	// addCamera
	var cameras = this.cameras;
	if( index === undefined || index === null )
	{
		index = cameras.length;
	}

	if( alwaysOnTop )
	{
		camera.alwaysOnTop = true;
	}
	else
	{
		for( var i=cameras.length-1; i>0; --i )
		{
			if( cameras[i].alwaysOnTop )
			{
				index = i;
			}
		}
	}

	cameras.insert( camera, index );

	if( CCEngine.NativeUpdateCommands !== undefined )
	{
		CCEngine.NativeSyncCommands += 'CCEngine.newSceneCamera;' + scene.sceneID + ';' + camera.cameraID + '\n';
	}

	return camera;
};


CCEngine.prototype.removeCamera = function(camera)
{
	var cameras = this.cameras;
	if( cameras.remove( camera ) )
	{
		return true;
	}
	return false;
};


CCEngine.prototype.findCameraIndex = function(camera)
{
	return this.cameras.find( camera );
};


CCEngine.NewScene = function(scene)
{
	if( CCEngine.NativeSyncCommands !== undefined )
	{
		CCEngine.NativeSyncCommands += 'CCEngine.NewScene;' + scene.sceneID + '\n';
	}
};


CCEngine.prototype.addScene = function(scene)
{
	this.scenes.push( scene );
	scene.setup();
};


CCEngine.prototype.removeScene = function(scene)
{
	var scenes = this.scenes;
	if( scenes.remove( scene ) )
	{
		if( CCEngine.NativeUpdateCommands !== undefined )
		{
			CCEngine.NativeUpdateCommands += 'CCEngine.removeScene;' + scene.sceneID + '\n';
		}
		scene.destruct();
		return true;
	}
	alert( "CCEngine.prototype.removeScene failed" );
	return false;
};


CCEngine.prototype.addCollideable = function(collideable)
{
	CCCollisionManager.collideables.add( collideable );
	//CC.OctreeAddObject( CCCollisionManager.tree, collideable );
};


CCEngine.prototype.removeCollideable = function(collideable)
{
    CCCollisionManager.collideables.remove( collideable );
	//CC.OctreeRemoveObject( collideable );
};


CCEngine.EnableBackButton = function(scene)
{
	if( CCEngine.BackButtonStack.addOnce( scene ) )
	{
		if( CCEngine.BackButtonStack.length === 1 )
		{
			if( CCEngine.NativeUpdateCommands !== undefined )
			{
				CCEngine.NativeUpdateCommands += 'CCEngine.EnableBackButton;true\n';
			}
		}
	}
};


CCEngine.DisableBackButton = function(scene)
{
	if( CCEngine.BackButtonStack.remove( scene ) )
	{
		if( CCEngine.BackButtonStack.length === 0 )
		{
			if( CCEngine.NativeUpdateCommands !== undefined )
			{
				CCEngine.NativeUpdateCommands += 'CCEngine.EnableBackButton;false\n';
			}
		}
	}
};


CCEngine.prototype.handleBackButton = function()
{
	if( CCAPIFacebook.IsLoggingIn() )
    {
        CCAPIFacebook.FinishLogin();
        return true;
    }
    else if( CCAPITwitter.IsLoggingIn() )
    {
		CCAPITwitter.FinishLogin();
		return true;
    }
    else if( CCAPIGoogle.IsLoggingIn() )
    {
		CCAPIGoogle.FinishLogin();
		return true;
    }
    else
    {
		var scenes = this.scenes;
        for( var i=scenes.length-1; i>=0; --i )
        {
            var scene = scenes[i];
            if( scene.handleBackButton )
            {
				if( scene.handleBackButton() )
				{
					return true;
				}
			}
        }
    }

    // Restart game launcher before we quit
    if( CCEngine.BackButtonStack.find( gEngine ) !== -1 )
    {
		if( !this.sceneMultiLauncher )
		{
			this.sceneMultiLauncher = new SceneMultiUILauncher();
			this.sceneMultiLauncher.launchMulti();
			return true;
		}
    }

	return false;
};


CCEngine.Pause = function()
{
	CCEngine.paused = true;

	if( window.gEngine )
	{
		var scenes = gEngine.scenes;
		for( var i=scenes.length-1; i>=0; --i )
		{
			var scene = scenes[i];
			if( scene.onPause )
			{
				if( scene.onPause() )
				{
					return true;
				}
			}
		}
	}

	// Keep web sessions alive
	if( CCEngine.DeviceType !== "Web" )
	{
		MultiplayerManager.Disconnect();
	}

	CCAudioManager.Pause();

	// Reset key states
	gEngine.controls.onPause();
};


CCEngine.Resume = function()
{
	CCEngine.paused = false;

	MultiplayerManager.Connect();

	CCAudioManager.Resume();

	if( gRenderer )
	{
		gRenderer.pendingRender = true;
	}
};
