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

CCPrimitiveObj.prototype.destruct = function()
{
	CCEngine.NativeUpdateCommands += 'CCPrimitiveObj.destruct;' + this.primitiveID + '\n';

	this.CCPrimitive3D_destruct();
};


CCPrimitiveObj.prototype.load = function(filename, url, priority, callback)
{
	this.filename = filename;
	this.loadedCallback = callback;

    this.vertexPositionBuffer = gRenderer.CCCreateVertexBuffer();
    this.vertexTextureBuffer = gRenderer.CCCreateVertexBuffer();

	CCEngine.NativeUpdateCommands += 'CCPrimitiveObj.load;' + this.primitiveID + ';' + this.vertexPositionBuffer + ';' + this.vertexTextureBuffer + ';' + url + ';' + filename + '\n';
};


CCPrimitiveObj.prototype.loaded = function(json)
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


CCPrimitiveObj.prototype.render = function()
{
	gRenderer.unbindBuffers();
	CCEngine.NativeRenderCommands += 'CCPrimitiveObj.render;' + this.primitiveID + '\n';
};
