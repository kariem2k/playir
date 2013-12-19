/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCNativeEngine.js
 * Description : Handles the native specific engine setup.
 *
 * Created     : 04/03/13
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

CCEngine.NativeSyncCommands = "";
CCEngine.NativeUpdateCommands = "";
CCEngine.NativeRenderCommands = "";


CCEngine.prototype.setup = function()
{
	gEngine = this;

    gURLManager = new CCURLManager().create();

	this.controls = new CCControls().create();
};


CCEngine.prototype.setupRenderer = function(width, height)
{
	new CCRenderer().create( width, height );

	this.textureManager = new CCTextureManager();
};


CCEngine.prototype.resize = function()
{
	var scenes = this.scenes;
	var length = scenes.length;
	for( var i=0; i<length; ++i )
	{
		var scene = scenes[i];
		scene.resize();
		scene.resized();
	}
};


CCEngine.prototype.setSize = function(width, height)
{
	if( gRenderer )
	{
		gRenderer.setSize( width, height );
	}

	{
		var scenes = this.scenes;
		var length = scenes.length;
		for( var i=0; i<length; ++i )
		{
			var scene = scenes[i];
			scene.resize();
			scene.resized();
		}
	}
};


CCEngine.prototype.updateOrientation = function(current, target)
{
	CCEngine.SetOrientation( current, target );
	var scenes = this.scenes;
	var length = scenes.length;
	for( var i=0; i<length; ++i )
	{
		var scene = scenes[i];
		scene.resize();
		scene.resized();
	}
};


CCEngine.prototype.render = function()
{
    var renderer = gRenderer;
	if( renderer.beginRender() )
	{
		var RenderVisibleObjectsFunction = CC.RenderVisibleObjects;

        var render_background = CCRenderer.render_background;
        var render_finished = CCRenderer.render_finished;

        var i, scene;
		var scenes = this.scenes;
		var scenesLength = scenes.length;

		var cameras = this.cameras;
		var camerasLength = cameras.length;
		for( var cameraIndex=0; cameraIndex<camerasLength; ++cameraIndex )
		{
			var camera = cameras[cameraIndex];
			if( !camera.enabled )
			{
				continue;
			}

			camera.setViewport();

			var lookAt = camera.lookAt;
			var rotatedPosition = camera.rotatedPosition;

			//camera.update();
			CCEngine.NativeSyncCommands += 'CCCameraBase.update;' + camera.cameraID + ';' + vec3.toString( rotatedPosition ) + ';' + vec3.toString( lookAt ) + '\n';
			CCEngine.NativeRenderCommands += 'CCCameraBase.set;' + camera.cameraID + '\n';

			// Update the camera results
			// var currentLookAt = camera.currentLookAt;
			// vec3.copy( currentLookAt, lookAt );
			// var currentRotatedPosition = camera.currentRotatedPosition;
			// vec3.copy( currentRotatedPosition, rotatedPosition );

			for( var pass=render_background; pass<render_finished; ++pass )
			{
				//renderer.CCSetBlend( false );
				renderer.blendEnabled = false;
				CCEngine.NativeRenderCommands += 'CCRenderer.CCSetBlend;false\n';

				//renderer.CCSetDepthWrite( true );		// Depth sort opaque objects
				renderer.depthWriteEnabled = true;
				CCEngine.NativeRenderCommands += 'CCRenderer.CCSetDepthWrite;true\n';

				//renderer.CCSetDepthRead( true );
				renderer.depthReadEnabled = true;
				CCEngine.NativeRenderCommands += 'CCRenderer.CCSetDepthRead;true\n';

				// Render all the opaque non-collideables
				if( camera.scene )
				{
					camera.scene.render( camera, pass, false );
				}
				else
				{
					for( i=0; i<scenesLength; ++i )
					{
						scene = scenes[i];
						scene.render( camera, pass, false );
					}
				}

				// Render all the visible opaque collideables
				RenderVisibleObjectsFunction( camera, pass, false );

				// Transparent
				//renderer.CCSetBlend( true );
				renderer.blendEnabled = true;
				CCEngine.NativeRenderCommands += 'CCRenderer.CCSetBlend;true\n';

				//renderer.CCSetDepthWrite( false );	// No depth sorting for transparent objects
				renderer.depthWriteEnabled = false;
				CCEngine.NativeRenderCommands += 'CCRenderer.CCSetDepthWrite;false\n';

				//renderer.CCSetDepthRead( false );
				renderer.depthReadEnabled = false;
				CCEngine.NativeRenderCommands += 'CCRenderer.CCSetDepthRead;false\n';

				// Render all the transparent non-collideables
				if( camera.scene )
				{
					camera.scene.render( camera, pass, true );
				}
				else
				{
					for( i=0; i<scenesLength; ++i )
					{
						scene = scenes[i];
						scene.render( camera, pass, true );
					}
				}

				// Render all the visible transparent collideables
				RenderVisibleObjectsFunction( camera, pass, true );

				// Render all the transparent non-collideables
				if( camera.scene )
				{
					if( camera.scene.postRender )
					{
						camera.scene.postRender( camera, pass, true );
					}
				}
				else
				{
					for( i=0; i<scenesLength; ++i )
					{
						scene = scenes[i];
						if( scene.postRender )
						{
							scene.postRender( camera, pass, true );
						}
					}
				}
			}
		}

		this.resyncVisibles = true;
	}
};


CCEngine.prototype.clearVisibles = function()
{
	var collideables = gEngine.collisionManager.collideables;
	var collideablesLength = collideables.length;

	var i, collideable;

	for( i=0; i<collideablesLength; ++i )
	{
		collideable = collideables[i];
		collideable.visible = false;
	}
};


CCEngine.prototype.updateCameraResults = function(cameraID, inViewMatrix, visibleIDs)
{
	if( this.resyncVisibles )
	{
		this.clearVisibles();
		this.resyncVisibles = false;
	}

	var collideables = gEngine.collisionManager.collideables;
	var collideablesLength = collideables.length;

	var i, collideable;

	var visibleIDsLength = visibleIDs.length;

	var cameras = this.cameras;
	var camerasLength = cameras.length;
	for( var cameraIndex=0; cameraIndex<camerasLength; ++cameraIndex )
	{
		var camera = cameras[cameraIndex];
		if( camera.cameraID === cameraID )
		{
			var viewMatrix = camera.viewMatrix;
			for( i=0; i<16; ++i )
			{
				viewMatrix[i] = inViewMatrix[i];
			}

			var visibleCollideables = camera.visibleCollideables;
			if( visibleCollideables.length !== visibleIDsLength )
			{
				visibleCollideables.length = visibleIDsLength;
			}

			for( var visibleIDIndex=0; visibleIDIndex<visibleIDsLength; ++ visibleIDIndex )
			{
				// Find out corresponding object
				var jsID = visibleIDs[visibleIDIndex];
				var visibleCollideable = visibleCollideables[visibleIDIndex];
				if( !visibleCollideable || visibleCollideable.jsID !== jsID )
				{
					for( i=0; i<collideablesLength; ++i )
					{
						collideable = collideables[i];
						if( collideable.jsID === jsID )
						{
							visibleCollideables[visibleIDIndex] = collideable;
							collideable.visible = true;
							break;
						}
					}
				}
				else
				{
					visibleCollideable.visible = true;
				}
			}
			break;
		}
	}
};


CCEngine.prototype.processCppCommands = function(cppCommands)
{
	var length = cppCommands.length;
	for( var i=0; i<length; ++i )
	{
		var command = cppCommands[i];
		if( command.id === "gEngine.updateCameraResults" )
		{
			this.updateCameraResults( command.cameraID, command.viewMatrix, command.visibles );
		}
		else if( command.id === "gEngine.controls.touchBegin" )
		{
			this.controls.touchBegin( command.index, command.x, command.y );
		}
		else if( command.id === "gEngine.controls.touchMove" )
		{
			this.controls.touchMove( command.index, command.x, command.y );
		}
		else if( command.id === "gEngine.controls.touchEnd" )
		{
			this.controls.touchEnd( command.index );
		}
		else if( command.id === "CC.MovementCollisionCheckResult" )
		{
			CC.MovementCollisionCheckResult( command.collisionRequestID, command.collisions );
		}
		else if( command.id === "gEngine.resume" )
		{
			this.resume();
		}
		else if( command.id === "gEngine.handleBackButton" )
		{
			this.handleBackButton();
		}
		else if( command.id === "CCEngine.InAppPurchased" )
		{
			SceneItemShop.InAppPurchased();
		}
	}
};


CCEngine.WebViewOpen = function(url, onOpenCallback, onUpdateCallback, params)
{
	if( onUpdateCallback )
	{
		CCEngine.WebViewCallback = onUpdateCallback;
		CCEngine.NativeUpdateCommands += 'CCEngine.WebViewOpen;' + url + '\n';
	}
	else
	{
		CCEngine.NativeUpdateCommands += 'CCEngine.WebBrowserOpen;' + url + '\n';
	}

	if( onOpenCallback )
	{
		onOpenCallback( null, true );
	}
};


CCEngine.WebViewProcessURL = function(url, open)
{
	if( CCEngine.WebViewCallback )
	{
		CCEngine.WebViewCallback( null, url, open );
	}
};


CCEngine.WebViewClose = function()
{
	if( CCEngine.WebViewCallback )
	{
		delete CCEngine.WebViewCallback;
	}
	CCEngine.NativeUpdateCommands += 'CCEngine.WebViewClose\n';
};


CCEngine.IsWebViewOpen = function(webViewController)
{
	return false;
};


CCEngine.GetWebView = function(title)
{
	return null;
};


CCEngine.UpdateNotification = function()
{
	if( gEngine.lifetime < 1.0 )
	{
		SceneMultiManager.RestartClient();
	}
	else
	{
		AlertsManager.Notification( "", "Update Available", function()
		{
			SceneMultiManager.RestartClient();
		});
	}
};
