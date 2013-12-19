/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCNativePrimitiveSquare.js
 * Description : Handles the native specific square primitive.
 *
 * Created     : 19/03/13
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */


CCPrimitiveSquare.prototype.removeTexture = function()
{
	this.CCPrimitiveBase_removeTexture();
	CCEngine.NativeUpdateCommands += 'CCPrimitiveSquare.removeTexture;' + this.primitiveID + '\n';
};


CCPrimitiveSquare.prototype.render = function()
{
	gRenderer.unbindBuffers();
	CCEngine.NativeRenderCommands += 'CCPrimitiveSquare.render;' + this.primitiveID + '\n';
};


CCPrimitiveSquare.prototype.adjustTextureUVs = function()
{
    if( this.textureIndex >= 0 )
    {
        CCEngine.NativeUpdateCommands += 'CCPrimitiveBase.adjustTextureUVs;' + this.primitiveID + ';' + this.textureIndex + '\n';
    }
};


CCPrimitiveSquare.prototype.setTextureUVs = function(x1, y1, x2, y2)
{
	CCEngine.NativeUpdateCommands += 'CCPrimitiveSquare.setTextureUVs;' + this.primitiveID + ';' + x1 + ';' + y1 + ';' + x2 + ';' + y2 + '\n';
};


CCPrimitiveSquare.prototype.flipY = function()
{
	CCEngine.NativeUpdateCommands += 'CCPrimitiveSquare.flipY;' + this.primitiveID + '\n';
};
