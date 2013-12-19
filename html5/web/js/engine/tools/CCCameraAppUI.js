/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCCameraAppUI.js
 * Description : AppUI Scene camera functionality.
 *
 * Created     : 20/10/11
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

function CCCameraAppUI()
{
    this.construct();

    this.targetWidth = 1.0;
    this.targetHeight = 1.0;

    this.targetOffset = vec3.create();
    this.targetLookAt = vec3.create();

	this.currentLookAtTarget = vec3.create();
	this.currentOffsetTarget = vec3.create();

	this.lookAtInterpolator = new CCInterpolatorV3( CCInterpolatorX3Curve ).setup( this.lookAt );
	var offsetInterpolator = this.offsetInterpolator = new CCInterpolatorV3( CCInterpolatorSin2Curve ).setup( this.offset );

	this.interpolating = true;
}
ExtendPrototype( CCCameraAppUI, CCCameraBase );


CCCameraAppUI.prototype.resize = function()
{
	this.CCCameraBase_resize();
	if( this.targetWidth )
	{
		this.setCameraWidth( this.targetWidth );
    }
};


CCCameraAppUI.prototype.setLookAt = function(newLookAt, interpolate)
{
	if( interpolate === undefined )
	{
		interpolate = true;
	}

	this.CCCameraBase_setLookAt( newLookAt );
	vec3.copy( this.currentLookAtTarget, this.lookAt );
	vec3.copy( this.targetLookAt, this.lookAt );

	this.lookAtInterpolator.setup( this.lookAt, this.currentLookAtTarget );

	if( !interpolate )
	{
		vec3.copy( this.currentLookAtTarget, this.lookAt );
	}
};


CCCameraAppUI.prototype.setOffset = function(newOffset)
{
	this.CCCameraBase_setOffset( newOffset );
	vec3.copy( this.currentOffsetTarget, this.offset );
	vec3.copy( this.targetOffset, this.offset );
	this.offsetInterpolator.setup( this.offset, this.currentOffsetTarget );
};


CCCameraAppUI.prototype.interpolateCamera = function(delta, speed)
{
	if( this.updating )
	{
		gRenderer.pendingRender = true;
		this.updating = false;

		if( this.interpolating )
		{
			var offset = this.offset;

			{
				var offsetInterpolator = this.offsetInterpolator;
				var currentOffsetTarget = this.currentOffsetTarget;
				var targetOffset = this.targetOffset;

				if( !vec3.equals( currentOffsetTarget, targetOffset ) )
				{
					vec3.copy( currentOffsetTarget, targetOffset );
					offsetInterpolator.setup( offset, currentOffsetTarget );
				}

				if( offsetInterpolator.update( delta ) )
				{
					this.refreshCameraSize();
					this.updating = true;
				}
			}

			{
				var lookAtInterpolator = this.lookAtInterpolator;
				var currentLookAtTarget = this.currentLookAtTarget;
				var targetLookAt = this.targetLookAt;
				var lookAt = this.lookAt;
				if( !vec3.equals( currentLookAtTarget, targetLookAt ) )
				{
					vec3.copy( currentLookAtTarget, targetLookAt );
					lookAtInterpolator.setup( lookAt, currentLookAtTarget );
				}

				if( lookAtInterpolator.update( delta * speed ) )
				{
					this.updating = true;
				}
			}

			// Now update our actual camera rotation and position
			{
				this.updateOffset( offset );
			}
		}

		return true;
	}

    return false;
};


// Set's the camera's width
CCCameraAppUI.prototype.setCameraWidth = function(inWidth, interpolate)
{
	this.targetWidth = this.cameraWidth = inWidth;
    this.targetOffset[2] = inWidth;

    if( CCEngine.IsPortrait() )
    {
		this.targetOffset[2] /= this.frustumWidth;
		this.cameraHeight = this.targetOffset[2] * this.frustumHeight;
	}
	else
	{
		this.targetOffset[2] /= this.frustumHeight;
		this.cameraHeight = this.targetOffset[2] * this.frustumWidth;
	}

    this.targetHeight = this.cameraHeight;
    this.cameraHWidth = this.cameraWidth * 0.5;
    this.cameraHHeight = this.cameraHeight * 0.5;

    this.flagUpdate();

    if( !interpolate )
    {
		this.setOffset( this.targetOffset );
    }
};


CCCameraAppUI.prototype.setCameraHeight = function(inHeight, interpolate)
{
	this.targetHeight = this.cameraHeight = inHeight;
    this.targetOffset[2] = inHeight;

    if( CCEngine.IsPortrait() )
    {
		this.targetOffset[2] /= this.frustumHeight;
		this.cameraWidth = this.targetOffset[2] * this.frustumWidth;
	}
	else
	{
		this.targetOffset[2] /= this.frustumWidth;
		this.cameraWidth = this.targetOffset[2] * this.frustumHeight;
	}

    this.targetWidth = this.cameraWidth;
    this.cameraHWidth = this.cameraWidth * 0.5;
    this.cameraHHeight = this.cameraHeight * 0.5;

    this.flagUpdate();
    if( !interpolate )
    {
		this.setOffset( this.targetOffset );
    }
};


CCCameraAppUI.prototype.refreshCameraSize = function()
{
    var currentOffset = this.offset;

    if( CCEngine.IsPortrait() )
    {
		this.cameraWidth = currentOffset[2] * this.frustumWidth;
		this.cameraHeight = currentOffset[2] * this.frustumHeight;
    }
    else
    {
		this.cameraWidth = currentOffset[2] * this.frustumHeight;
		this.cameraHeight = currentOffset[2] * this.frustumWidth;
    }

    this.cameraHWidth = this.cameraWidth * 0.5;
    this.cameraHHeight = this.cameraHeight * 0.5;
};


CCCameraAppUI.prototype.calcCameraOffsetForWidth = function(inWidth)
{
    var offsetZ = inWidth;
    if( CCEngine.IsPortrait() )
    {
		offsetZ /= this.frustumWidth;
    }
    else
    {
		offsetZ /= this.frustumHeight;
    }
    return offsetZ;
};


CCCameraAppUI.prototype.calcCameraOffsetForHeight = function(inHeight)
{
    var offsetZ = inHeight;
    if( CCEngine.IsPortrait() )
    {
		offsetZ /= this.frustumHeight;
    }
    else
    {
		offsetZ /= this.frustumWidth;
    }
    return offsetZ;
};


CCCameraAppUI.prototype.calcCameraWidthForOffset = function(inOffset)
{
    var width = inOffset;

    if( CCEngine.IsPortrait() )
    {
		width *= this.frustumWidth;
	}
	else
	{
		width *= this.frustumHeight;
	}

    return width;
};


CCCameraAppUI.prototype.calcCameraHeightForOffset = function(inOffset)
{
    var height = inOffset;

    if( CCEngine.IsPortrait() )
    {
		height *= this.frustumHeight;
	}
	else
	{
		height *= this.frustumWidth;
	}

    return height;
};
