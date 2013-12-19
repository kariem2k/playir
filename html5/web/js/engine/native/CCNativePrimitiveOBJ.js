/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCNativePrimitiveObj.js
 * Description : Handles the native specific obj primitive.
 *
 * Created     : 04/03/13
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

CCPrimitiveOBJ.prototype.destruct = function()
{
	CCEngine.NativeUpdateCommands += 'CCPrimitiveOBJ.destruct;' + this.primitiveID + '\n';

	this.CCPrimitive3D_destruct();
};


CCPrimitiveOBJ.prototype.load = function(filename, url, priority, callback)
{
	this.filename = filename;
	this.loadedCallback = callback;

    this.vertexPositionBuffer = gRenderer.CCCreateVertexBuffer();
    this.vertexTextureBuffer = gRenderer.CCCreateVertexBuffer();

	CCEngine.NativeUpdateCommands += 'CCPrimitiveOBJ.load;' + this.primitiveID + ';' + this.vertexPositionBuffer + ';' + this.vertexTextureBuffer + ';' + url + ';' + filename + '\n';
};


CCPrimitiveOBJ.prototype.reference = function(filename, callback)
{
	this.filename = filename;

	if( callback )
	{
		this.loadedCallback = callback;
	}

    this.vertexPositionBuffer = gRenderer.CCCreateVertexBuffer();
    this.vertexTextureBuffer = gRenderer.CCCreateVertexBuffer();

	CCEngine.NativeUpdateCommands += 'CCPrimitiveOBJ.reference;' + this.primitiveID + ';' + this.vertexPositionBuffer + ';' + this.vertexTextureBuffer + ';' + filename + '\n';
};


CCPrimitiveOBJ.prototype.loaded = function(json)
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
	}

	if( callback )
	{
		callback( this.vertexCount > 0 );
    }
};


CCPrimitiveOBJ.prototype.render = function()
{
	gRenderer.unbindBuffers();
	CCEngine.NativeRenderCommands += 'CCPrimitiveOBJ.render;' + this.primitiveID + '\n';
};
