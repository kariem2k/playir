/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCNativePrimitiveFBX.js
 * Description : Handles the native specific FBX primitive.
 *
 * Created     : 10/05/13
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

CCPrimitiveFBX.prototype.destruct = function()
{
	CCEngine.NativeUpdateCommands += 'CCPrimitiveFBX.destruct;' + this.primitiveID + '\n';

	this.CCPrimitive3D_destruct();
};


CCPrimitiveFBX.prototype.load = function(filename, url, priority, callback)
{
	this.filename = filename;
	this.loadedCallback = callback;

	CCEngine.NativeUpdateCommands += 'CCPrimitiveFBX.load;' + this.primitiveID + ';' + url + ';' + filename + '\n';
};


CCPrimitiveFBX.prototype.loaded = function(json)
{
	var callback = this.loadedCallback;
	if( this.loadedCallback )
	{
		delete this.loadedCallback;
	}

	if( json )
	{
		this.fileSize = json.fileSize;

		this.vertexCount = json.vertexCount;

		this.mmX.min = json.mmXmin;
		this.mmX.max = json.mmXmax;
		this.mmY.min = json.mmYmin;
		this.mmY.max = json.mmYmax;
		this.mmZ.min = json.mmZmin;
		this.mmZ.max = json.mmZmax;

		this.width = this.mmX.size();
		this.height = this.mmY.size();
		this.depth = this.mmZ.size();

		if( this.animations )
		{
			if( json.animationFPS )
			{
				this.animationFPS = json.animationFPS;
			}

			if( json.animationFPSCompression )
			{
				this.animationFPSCompression = json.animationFPSCompression;
			}

			this.setAnimation( 0 );
			this.nextFrame();
		}
	}

	if( callback )
	{
		callback( this.vertexCount > 0 );
    }
};


CCPrimitiveFBX.prototype.loadedAnimation = function(name)
{
	if( !this.animations )
	{
		this.animations = [];
	}
	var animation = {};
	animation.name = name;
	animation.frames = [];
	this.animations.push( animation );
};


CCPrimitiveFBX.prototype.loadedAnimationFrame = function(array)
{
	if( this.animations && this.animations.length > 0 )
	{
		var animation = this.animations[this.animations.length-1];
		animation.frames.push( array );
	}
};


CCPrimitiveFBX.prototype.moveVerticesToOrigin = function(callback)
{
    if( !this.movedToOrigin )
    {
		this.getOrigin();

		CCEngine.NativeUpdateCommands += 'CCPrimitive3D.moveVerticesToOrigin;' + this.primitiveID + '\n';

		if( callback )
		{
			this.moveVerticesToOriginCallback = callback;
		}
    }
    else
    {
		if( callback )
		{
			callback();
		}
    }
};


CCPrimitiveFBX.prototype.interpolateFrames = function(currentAnimationIndex, currentFrameIndex, nextAnimationIndex, nextFrameIndex, frameDelta)
{
	CCEngine.NativeUpdateCommands += 'CCPrimitiveFBX.interpolateFrames;' + this.primitiveID + ';' + currentAnimationIndex + ';' + currentFrameIndex + ';' + nextAnimationIndex + ';' + nextFrameIndex + ';' + frameDelta + '\n';
};
