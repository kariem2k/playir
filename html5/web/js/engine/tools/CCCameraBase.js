/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCCameraBase.js
 * Description : Common functionality for scene cameras.
 *
 * Created     : 20/10/11
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

function CCCameraProjectionResults()
{
    this.vNear = vec3.create();
    this.vFar = vec3.create();
    this.vDirection = vec3.create();
    this.vLookAt = vec3.create();
}


function CCCameraBase()
{
	this.construct();
}
CCCameraBase.NextID = 0;

CCCameraBase.frustum_right	= 0*4;
CCCameraBase.frustum_left	= 1*4;
CCCameraBase.frustum_bottom	= 2*4;
CCCameraBase.frustum_top	= 3*4;
CCCameraBase.frustum_far	= 4*4;
CCCameraBase.frustum_near	= 5*4;
CCCameraBase.frustum_max	= 6*4;


CCCameraBase.prototype.construct = function()
{
	this.cameraID = CCCameraBase.NextID++;

	this.enabled = true;

	// Create our variables
	this.viewMatrix = mat4.create();
	this.projectionMatrix = mat4.create();

    this.currentLookAt = vec3.create();					// The current lookAt position
    this.currentRotatedPosition = vec3.create();		// The current rotated camera position

    this.lookAt = this.currentLookAt;//vec3.create();					// The next lookAt position
    this.rotatedPosition = this.currentRotatedPosition;//vec3.create();		// The next rotated camera position

    this.offset = vec3.create();						// The camera offset
    this.position = vec3.create();						// The position before rotation
    this.rotation = vec3.create();						// The rotation

	this.viewport = vec4.create();
	this.frustum = new CCRenderer.Float32Array( CCCameraBase.frustum_max * 4 );
	this.frustumClip = new CCRenderer.Float32Array( 16 );

	this.perspective = 60.0;

	this.cameraTouches = [];
    this.cameraTouches.push( new CCTouch() );
    this.cameraTouches.push( new CCTouch() );

	this.projectionResults = new CCCameraProjectionResults();

	this.visibleCollideables = [];
};


CCCameraBase.prototype.resize = function()
{
	this.recalcViewport();
};


CCCameraBase.prototype.setupViewport = function(x, y, width, height)
{
    if( CCEngine.NativeUpdateCommands !== undefined )
	{
		CCEngine.NativeUpdateCommands += 'CCCameraBase.setupViewport;' + this.cameraID + ';' + x + ';' + y + ';' + width + ';' + height + '\n';
	}

	this.viewportX = x;
    this.viewportY = y;
    this.viewportX2 = x+width;
    this.viewportY2 = y+height;
    this.viewportWidth = width;
    this.viewportHeight = height;
    this.invViewportWidth = 1.0 / this.viewportWidth;
    this.invViewportHeight = 1.0 / this.viewportHeight;

	var viewport = this.viewport;
	var renderer = gRenderer;

	//if( frameBufferID === -1 )
    {
		var temp;
        if( CCEngine.Orientation.target === 270.0 )
        {
			temp = width;
			width = height;
			height = temp;

			temp = x;
			x = y;
			y = temp;

			x = 1.0 - width - x;
        }
        else if( CCEngine.Orientation.target === 90.0 )
        {
			temp = width;
			width = height;
			height = temp;

			temp = x;
			x = y;
			y = temp;

            y = 1.0 - height - y;
        }
        // else if( orientation.target === 180.0f )
        // {
        //     x = 1.0f - width - x;
        //     y = 1.0f - height - y;
        // }
        // else
        // {
        // }
    }

	var invY = ( 1.0-height ) - y;

    var frameBufferWidth = renderer.width;
    var frameBufferHeight = renderer.height;
    var definedWidth = width * frameBufferWidth;
    var definedHeight = height * frameBufferHeight;
    viewport[0] = x * frameBufferWidth;
    viewport[1] = invY * frameBufferHeight;
    viewport[2] = definedWidth;
    viewport[3] = definedHeight;

    this.orientedAspectRatio = this.actualAspectRatio = definedWidth / definedHeight;
    //if( frameBufferID === -1 )
    {
        if( !CCEngine.IsPortrait() )
        {
            this.orientedAspectRatio = definedHeight / definedWidth;
        }
    }

    this.setPerspective();
};


CCCameraBase.prototype.recalcViewport = function()
{
	this.setupViewport( this.viewportX, this.viewportY, this.viewportWidth, this.viewportHeight );
};


CCCameraBase.prototype.setViewport = function()
{
    var renderer = gRenderer;
    var viewport = this.viewport;
    renderer.GLViewport( viewport[0], viewport[1], viewport[2], viewport[3] );
    renderer.GLScissor( viewport[0], viewport[1], viewport[2], viewport[3] );
};


CCCameraBase.prototype.setPerspective = function(perspective)
{
	if( perspective !== undefined )
	{
		this.perspective = perspective;
	}
    this.gluPerspective( this.perspective * this.viewportWidth, this.actualAspectRatio, 1.0, 40000.0 );
};


CCCameraBase.prototype.update = function()
{
	CCCameraBase.currentCamera = this;

    var viewMatrix = this.viewMatrix;
    mat4.identity( this.viewMatrix );

    var currentRotatedPosition = this.currentRotatedPosition;
    var currentLookAt = this.currentLookAt;

    if( CCEngine.Orientation.current !== 0.0 )
    {
		CC.MatrixRotateDegrees( viewMatrix, CCEngine.Orientation.current, 0.0, 0.0, 1.0 );
    }
    this.gluLookAt( currentRotatedPosition[0], currentRotatedPosition[1], currentRotatedPosition[2],
                    currentLookAt[0], currentLookAt[1], currentLookAt[2],
                    0.0, 1.0, 0.0 );

    //var rotatedPosition = this.rotatedPosition;
    //var lookAt = this.lookAt;
    //vec3.copy( currentRotatedPosition, rotatedPosition );
    //vec3.copy( currentLookAt, lookAt );

    gRenderer.CCSetViewMatrix( this );

	this.ExtractFrustum();

	this.updateVisibleCollideables();
};


CCCameraBase.prototype.interpolateCamera = function(delta, speed)
{
	if( this.updating )
	{
		gRenderer.pendingRender = true;
		this.updating = false;
		return true;
	}
	return false;
};


CCCameraBase.prototype.setLookAt = function(newLookAt)
{
	vec3.copy( this.lookAt, newLookAt );
};


CCCameraBase.prototype.setLookAtX = function(x)
{
	this.lookAt[0] = x;
	this.setLookAt( this.lookAt );
};


CCCameraBase.prototype.setLookAtY = function(y)
{
	this.lookAt[1] = y;
	this.setLookAt( this.lookAt );
};


CCCameraBase.prototype.setOffset = function(offsetTarget)
{
    this.updateOffset( offsetTarget );
};


CCCameraBase.prototype.updateOffset = function(offsetTarget)
{
	var lookAt = this.lookAt;
	var position = this.position;
	var rotatedPosition = this.rotatedPosition;
	var rotation = this.rotation;

	vec3.copy( this.offset, offsetTarget );

	vec3.copy( position, lookAt );
	vec3.add( position, position, this.offset );
	vec3.copy( rotatedPosition, position );

	CC.Vector3RotateAboutX( rotatedPosition, rotation[0], position, lookAt );
	CC.Vector3RotateAboutY( rotatedPosition, rotation[1], rotatedPosition, lookAt );
};


CCCameraBase.prototype.updateLookAtDirection = function(position, direction)
{
    var lookAt = this.lookAt;
	var rotatedPosition = this.rotatedPosition;
	var rotation = this.rotation;

	vec3.copy( rotatedPosition, position );

    vec3.copy( lookAt, rotatedPosition );
    lookAt[0] += direction[2];
	CC.Vector3RotateAboutX( lookAt, rotation[0], lookAt, position );
	CC.Vector3RotateAboutY( lookAt, rotation[1], lookAt, position );
};


CCCameraBase.prototype.getRelativeTouches = function(screenTouches)
{
	var cameraTouches = this.cameraTouches;

	for( var i=0; i<screenTouches.length; ++i )
	{
		var screenTouch = screenTouches[i];
		var cameraTouch = cameraTouches[i];

		cameraTouch.state = screenTouch.state;

		cameraTouch.x = screenTouch.x;
		cameraTouch.y = screenTouch.y;
		cameraTouch.startX = screenTouch.startX;
		cameraTouch.startY = screenTouch.startY;
		cameraTouch.deltaX = screenTouch.deltaX;
		cameraTouch.deltaY = screenTouch.deltaY;
		cameraTouch.totalDeltaX = screenTouch.totalDeltaX;
		cameraTouch.totalDeltaY = screenTouch.totalDeltaY;

		cameraTouch.usingTouch = screenTouch.usingTouch;
		cameraTouch.timeHeld = screenTouch.timeHeld;
		cameraTouch.lastTimeReleased = screenTouch.lastTimeReleased;

		var viewportX = this.viewportX;
		var invViewportWidth = this.invViewportWidth;
		var viewportY = this.viewportY;
		var invViewportHeight = this.invViewportHeight;

		cameraTouch.startX -= viewportX;
		cameraTouch.startX *= invViewportWidth;
		cameraTouch.startY -= viewportY;
		cameraTouch.startY *= invViewportHeight;

		cameraTouch.x -= viewportX;
		cameraTouch.x *= invViewportWidth;
		cameraTouch.y -= viewportY;
		cameraTouch.y *= invViewportHeight;

		cameraTouch.deltaX *= invViewportWidth;
		cameraTouch.deltaY *= invViewportHeight;
		cameraTouch.totalDeltaX *= invViewportWidth;
		cameraTouch.totalDeltaY *= invViewportHeight;

		var screenLastDeltas = screenTouch.lastDeltas;
		var cameraLastDeltas = cameraTouch.lastDeltas;
        for( var deltaIndex=0; deltaIndex<screenLastDeltas.length; ++deltaIndex )
        {
            var screenLastDelta = screenLastDeltas[deltaIndex];
            var cameraLastDelta = cameraLastDeltas[deltaIndex];
            cameraLastDelta.time = screenLastDelta.time;
            cameraLastDelta.delta.x = screenLastDelta.delta.x * invViewportWidth;
            cameraLastDelta.delta.y = screenLastDelta.delta.y * invViewportHeight;
        }
	}

	return cameraTouches;
};


CCCameraBase.prototype.setRotationX = function(inRotation)
{
    this.rotation[0] = inRotation;
    this.updating = true;
};


CCCameraBase.prototype.setRotationY = function(inRotation)
{
    this.rotation[1] = inRotation;
    this.updating = true;
};


CCCameraBase.prototype.setRotationZ = function(inRotation)
{
    this.rotation[2] = inRotation;
    this.updating = true;
};


CCCameraBase.prototype.incrementRotationX = function(increment)
{
    this.rotation[0] += increment;
    this.setRotationX( this.rotation[0] );
};


CCCameraBase.prototype.incrementRotationY = function(increment)
{
    this.rotation[1] += increment;
    this.setRotationY( this.rotation[1] );
};


CCCameraBase.prototype.incrementRotationZ = function(increment)
{
    this.rotation[2] += increment;
    this.setRotationZ( this.rotation[2] );
};


CCCameraBase.SetVisibleSortFunction = function(callback)
{
	CCCameraBase.VisibleSortFunction = callback;
};


CCCameraBase.prototype.useSceneCollideables = function(scene)
{
	this.collideables = scene.collideables;
	if( CCEngine.NativeUpdateCommands !== undefined )
	{
		CCEngine.NativeUpdateCommands += 'CCCameraBase.useSceneCollideables;' + this.cameraID + ';' + scene.sceneID + '\n';
	}
};


CCCameraBase.prototype.updateVisibleCollideables = function()
{
    // Update visible objects
    if( this.collideables )
    {
        CC.ScanVisibleCollideables( this.frustum, this.collideables, this.visibleCollideables );
    }
    else
    {
    	//CC.ScanVisibleCollideables( this.frustum, gEngine.collisionManager.collideables, this.visibleCollideables );
        CCOctree.ScanVisibleCollideables( this.frustum, this.visibleCollideables );
    }
    this.visibleCollideables.sort( CCCameraBase.VisibleSortFunction );
};


CCCameraBase.prototype.gluPerspective = function(fovy, aspect, zNear, zFar)
{
    var top = zNear * Math.tan( fovy * Math.PI / 360.0 );
    var right = top * aspect;

    var zNearScale = 1.0 / zNear;
    this.frustumWidth = right * 2.0 * zNearScale;
    this.frustumHeight = top * 2.0 * zNearScale;

    mat4.frustum( this.projectionMatrix, -right, right, -top, top, zNear, zFar );

	if( CCEngine.NativeUpdateCommands !== undefined )
	{
		CCEngine.NativeUpdateCommands += 'CCCameraBase.gluPerspective;' + this.cameraID + ';' + right + ';' + top + ';' + zNear + ';'+ zFar + '\n';
	}
};


CCCameraBase.prototype.project3D = function(x, y)
{
	CCEngine.ProjectOrientation( x, y, function(projectedX, projectedY)
	{
		x = projectedX;
		y = projectedY;
	});

	var viewport = this.viewport;
	y = 1.0 - y;

	x *= viewport[2];
    x += viewport[0];
	y *= viewport[3];
    y += viewport[1];

    var projectionResults = this.projectionResults;
	if( this.gluUnProject( x, y, 0.0, projectionResults.vNear ) &&
        this.gluUnProject( x, y, 1.0, projectionResults.vFar ) )
	{
		// Figure out our ray's direction
        vec3.copy( projectionResults.vDirection, projectionResults.vFar );
		vec3.subtract( projectionResults.vDirection, projectionResults.vDirection, projectionResults.vNear );
		vec3.unitize( projectionResults.vDirection );

		vec3.copy( projectionResults.vLookAt, projectionResults.vNear );
		var projectionOffset = vec3.create();
		vec3.scale( projectionOffset, projectionResults.vDirection, projectionResults.vNear[2] );
		vec3.add( projectionResults.vLookAt, projectionResults.vLookAt, projectionOffset );
		return true;
	}

	return false;
};


CCCameraBase.prototype.project3DY = function(result, x, y, offset)
{
    if( this.project3D( x, y ) )
	{
		var projectionResults = this.projectionResults;
		// Cast the ray from our near plane
		if( ( typeof( offset ) !== "number" ) )
		{
            offset = projectionResults.vNear[1] / Math.abs( projectionResults.vDirection[1] );
		}

		vec3.scale( result, projectionResults.vDirection, offset );
		vec3.add( result, result, projectionResults.vNear );
	}
};


CCCameraBase.prototype.flagUpdate = function()
{
	this.updating = true;
};


CCCameraBase.prototype.gluLookAt = function(eyex, eyey, eyez,
											centerx, centery, centerz,
											upx, upy, upz)
{
    var x = vec3.create();
    var y = vec3.create();
    var z = vec3.create();

	/* Make rotation matrix */

	/* Z vector */
	z[0] = eyex - centerx;
	z[1] = eyey - centery;
	z[2] = eyez - centerz;
	var mag = Math.sqrt( z[0] * z[0] + z[1] * z[1] + z[2] * z[2] );
	if( mag )
	{	/* mpichler, 19950515 */
		z[0] /= mag;
		z[1] /= mag;
		z[2] /= mag;
	}

	/* Y vector */
	y[0] = upx;
	y[1] = upy;
	y[2] = upz;

	/* X vector = Y cross Z */
	x[0] = y[1] * z[2] - y[2] * z[1];
	x[1] = -y[0] * z[2] + y[2] * z[0];
	x[2] = y[0] * z[1] - y[1] * z[0];

	/* Recompute Y = Z cross X */
	y[0] = z[1] * x[2] - z[2] * x[1];
	y[1] = -z[0] * x[2] + z[2] * x[0];
	y[2] = z[0] * x[1] - z[1] * x[0];

	/* mpichler, 19950515 */
	/* cross product gives area of parallelogram, which is < 1.0 for
	 * non-perpendicular unit-length vectors; so normalize x, y here
	 */

	mag = Math.sqrt( x[0] * x[0] + x[1] * x[1] + x[2] * x[2] );
	if( mag )
	{
		x[0] /= mag;
		x[1] /= mag;
		x[2] /= mag;
	}

	mag = Math.sqrt( y[0] * y[0] + y[1] * y[1] + y[2] * y[2] );
	if( mag )
	{
		y[0] /= mag;
		y[1] /= mag;
		y[2] /= mag;
	}

    var m = mat4.create();
	m[4*0+0] = x[0];
	m[4*1+0] = x[1];
	m[4*2+0] = x[2];
	m[4*3+0] = 0.0;
	m[4*0+1] = y[0];
	m[4*1+1] = y[1];
	m[4*2+1] = y[2];
	m[4*3+1] = 0.0;
	m[4*0+2] = z[0];
	m[4*1+2] = z[1];
	m[4*2+2] = z[2];
	m[4*3+2] = 0.0;
	m[4*0+3] = 0.0;
	m[4*1+3] = 0.0;
	m[4*2+3] = 0.0;
	m[4*3+3] = 1.0;

    var viewMatrix = this.viewMatrix;
    CC.MatrixMultiply( viewMatrix, m, viewMatrix );

	/* Translate Eye to Origin */
    var eyeVector = vec3.create();
    eyeVector[0] = -eyex;
    eyeVector[1] = -eyey;
    eyeVector[2] = -eyez;
    mat4.translate( viewMatrix, viewMatrix, eyeVector );
};


CCCameraBase.FinalMatrix = mat4.create();
CCCameraBase.Input = vec4.create();
CCCameraBase.Out = vec4.create();
CCCameraBase.prototype.gluUnProject = function(winX, winY, winZ, resultVector)
{
	var finalMatrix = CCCameraBase.FinalMatrix;
	var input = CCCameraBase.Input;
	var out = CCCameraBase.Out;

	// Note: mat4.multiply's parameters are inversed to the logical c++ implementation
	mat4.multiply( finalMatrix, this.projectionMatrix, this.viewMatrix );
	if( !mat4.invert( finalMatrix, finalMatrix ) )
	{
		return false;
	}

	input[0] = winX;
	input[1] = winY;
	input[2] = winZ;
	input[3] = 1.0;

	/* Map x and y from window coordinates */
	var viewport = this.viewport;
	input[0] = ( input[0] - viewport[0] ) / viewport[2];
	input[1] = ( input[1] - viewport[1] ) / viewport[3];

	/* Map to range -1 to 1 */
	input[0] = input[0] * 2 - 1;
	input[1] = input[1] * 2 - 1;
	input[2] = input[2] * 2 - 1;

	mat4.multiplyVec4( finalMatrix, input, out );
	if( out[3] === 0.0 )
	{
		return false;
	}

	out[0] /= out[3];
	out[1] /= out[3];
	out[2] /= out[3];
	resultVector[0] = out[0];
	resultVector[1] = out[1];
	resultVector[2] = out[2];

	return true;
};


CCCameraBase.prototype.ExtractFrustum = function()
{
	var proj = this.projectionMatrix;
	var	modv = this.viewMatrix;
	var clip = this.frustumClip;
	var t;
	var frustum = this.frustum;
	var frustum_right	= CCCameraBase.frustum_right;
	var frustum_left	= CCCameraBase.frustum_left;
	var frustum_bottom	= CCCameraBase.frustum_bottom;
	var frustum_top		= CCCameraBase.frustum_top;
	var frustum_far		= CCCameraBase.frustum_far;
	var frustum_near	= CCCameraBase.frustum_near;

	/* Combine the two matrices (multiply projection by modelview) */
	clip[ 0] = modv[ 0] * proj[ 0] + modv[ 1] * proj[ 4] + modv[ 2] * proj[ 8] + modv[ 3] * proj[12];
	clip[ 1] = modv[ 0] * proj[ 1] + modv[ 1] * proj[ 5] + modv[ 2] * proj[ 9] + modv[ 3] * proj[13];
	clip[ 2] = modv[ 0] * proj[ 2] + modv[ 1] * proj[ 6] + modv[ 2] * proj[10] + modv[ 3] * proj[14];
	clip[ 3] = modv[ 0] * proj[ 3] + modv[ 1] * proj[ 7] + modv[ 2] * proj[11] + modv[ 3] * proj[15];

	clip[ 4] = modv[ 4] * proj[ 0] + modv[ 5] * proj[ 4] + modv[ 6] * proj[ 8] + modv[ 7] * proj[12];
	clip[ 5] = modv[ 4] * proj[ 1] + modv[ 5] * proj[ 5] + modv[ 6] * proj[ 9] + modv[ 7] * proj[13];
	clip[ 6] = modv[ 4] * proj[ 2] + modv[ 5] * proj[ 6] + modv[ 6] * proj[10] + modv[ 7] * proj[14];
	clip[ 7] = modv[ 4] * proj[ 3] + modv[ 5] * proj[ 7] + modv[ 6] * proj[11] + modv[ 7] * proj[15];

	clip[ 8] = modv[ 8] * proj[ 0] + modv[ 9] * proj[ 4] + modv[10] * proj[ 8] + modv[11] * proj[12];
	clip[ 9] = modv[ 8] * proj[ 1] + modv[ 9] * proj[ 5] + modv[10] * proj[ 9] + modv[11] * proj[13];
	clip[10] = modv[ 8] * proj[ 2] + modv[ 9] * proj[ 6] + modv[10] * proj[10] + modv[11] * proj[14];
	clip[11] = modv[ 8] * proj[ 3] + modv[ 9] * proj[ 7] + modv[10] * proj[11] + modv[11] * proj[15];

	clip[12] = modv[12] * proj[ 0] + modv[13] * proj[ 4] + modv[14] * proj[ 8] + modv[15] * proj[12];
	clip[13] = modv[12] * proj[ 1] + modv[13] * proj[ 5] + modv[14] * proj[ 9] + modv[15] * proj[13];
	clip[14] = modv[12] * proj[ 2] + modv[13] * proj[ 6] + modv[14] * proj[10] + modv[15] * proj[14];
	clip[15] = modv[12] * proj[ 3] + modv[13] * proj[ 7] + modv[14] * proj[11] + modv[15] * proj[15];

	/* Extract the numbers for the RIGHT plane */
	frustum[frustum_right+0] = clip[ 3] - clip[ 0];
	frustum[frustum_right+1] = clip[ 7] - clip[ 4];
	frustum[frustum_right+2] = clip[11] - clip[ 8];
	frustum[frustum_right+3] = clip[15] - clip[12];

	/* Normalize the result */
	t = Math.sqrt( frustum[frustum_right+0] * frustum[frustum_right+0] + frustum[frustum_right+1] * frustum[frustum_right+1] + frustum[frustum_right+2] * frustum[frustum_right+2] );
	frustum[frustum_right+0] /= t;
	frustum[frustum_right+1] /= t;
	frustum[frustum_right+2] /= t;
	frustum[frustum_right+3] /= t;

	/* Extract the numbers for the LEFT plane */
	frustum[frustum_left+0] = clip[ 3] + clip[ 0];
	frustum[frustum_left+1] = clip[ 7] + clip[ 4];
	frustum[frustum_left+2] = clip[11] + clip[ 8];
	frustum[frustum_left+3] = clip[15] + clip[12];

	/* Normalize the result */
	t = Math.sqrt( frustum[frustum_left+0] * frustum[frustum_left+0] + frustum[frustum_left+1] * frustum[frustum_left+1] + frustum[frustum_left+2] * frustum[frustum_left+2] );
	frustum[frustum_left+0] /= t;
	frustum[frustum_left+1] /= t;
	frustum[frustum_left+2] /= t;
	frustum[frustum_left+3] /= t;

	/* Extract the BOTTOM plane */
	frustum[frustum_bottom+0] = clip[ 3] + clip[ 1];
	frustum[frustum_bottom+1] = clip[ 7] + clip[ 5];
	frustum[frustum_bottom+2] = clip[11] + clip[ 9];
	frustum[frustum_bottom+3] = clip[15] + clip[13];

	/* Normalize the result */
	t = Math.sqrt( frustum[frustum_bottom+0] * frustum[frustum_bottom+0] + frustum[frustum_bottom+1] * frustum[frustum_bottom+1] + frustum[frustum_bottom+2] * frustum[frustum_bottom+2] );
	frustum[frustum_bottom+0] /= t;
	frustum[frustum_bottom+1] /= t;
	frustum[frustum_bottom+2] /= t;
	frustum[frustum_bottom+3] /= t;

	/* Extract the TOP plane */
	frustum[frustum_top+0] = clip[ 3] - clip[ 1];
	frustum[frustum_top+1] = clip[ 7] - clip[ 5];
	frustum[frustum_top+2] = clip[11] - clip[ 9];
	frustum[frustum_top+3] = clip[15] - clip[13];

	/* Normalize the result */
	t = Math.sqrt( frustum[frustum_top+0] * frustum[frustum_top+0] + frustum[frustum_top+1] * frustum[frustum_top+1] + frustum[frustum_top+2] * frustum[frustum_top+2] );
	frustum[frustum_top+0] /= t;
	frustum[frustum_top+1] /= t;
	frustum[frustum_top+2] /= t;
	frustum[frustum_top+3] /= t;

	/* Extract the FAR plane */
	frustum[frustum_far+0] = clip[ 3] - clip[ 2];
	frustum[frustum_far+1] = clip[ 7] - clip[ 6];
	frustum[frustum_far+2] = clip[11] - clip[10];
	frustum[frustum_far+3] = clip[15] - clip[14];

	/* Normalize the result */
	t = Math.sqrt( frustum[frustum_far+0] * frustum[frustum_far+0] + frustum[frustum_far+1] * frustum[frustum_far+1] + frustum[frustum_far+2] * frustum[frustum_far+2] );
	frustum[frustum_far+0] /= t;
	frustum[frustum_far+1] /= t;
	frustum[frustum_far+2] /= t;
	frustum[frustum_far+3] /= t;

	/* Extract the NEAR plane */
	frustum[frustum_near+0] = clip[ 3] + clip[ 2];
	frustum[frustum_near+1] = clip[ 7] + clip[ 6];
	frustum[frustum_near+2] = clip[11] + clip[10];
	frustum[frustum_near+3] = clip[15] + clip[14];

	/* Normalize the result */
	t = Math.sqrt( frustum[frustum_near+0] * frustum[frustum_near+0] + frustum[frustum_near+1] * frustum[frustum_near+1] + frustum[frustum_near+2] * frustum[frustum_near+2] );
	frustum[frustum_near+0] /= t;
	frustum[frustum_near+1] /= t;
	frustum[frustum_near+2] /= t;
	frustum[frustum_near+3] /= t;
};


CCCameraBase.prototype.getAspectRatio = function()
{
	return this.orientedAspectRatio;
};
