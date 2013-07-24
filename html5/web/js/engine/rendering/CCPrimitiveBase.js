/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCPrimitiveBase.js
 * Description : Base drawable component.
 *
 * Created     : 23/10/11
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

function CCPrimitiveBase()
{
}
CCPrimitiveBase.NextID = 0;


CCPrimitiveBase.prototype.construct = function()
{
    this.primitiveID = CCPrimitiveBase.NextID++;

    this.textureIndex = -1;
    this.customUVs = null;      // Custom UV coordinates
    this.adjustedUVs = null;    // Adjusted UV coordinates from our custom UVs based on texture allocation size
};


CCPrimitiveBase.prototype.destruct = function()
{
};


CCPrimitiveBase.prototype.setTexture = function(src, mipmap, load, alwaysResident)
{
    this.textureIndex = gEngine.textureManager.assignTextureIndex( src );

    if( CCEngine.NativeUpdateCommands !== undefined )
    {
        CCEngine.NativeUpdateCommands += 'CCPrimitiveBase.setTexture;' + this.primitiveID + ';' + this.textureIndex + '\n';
    }

    var self = this;
    gEngine.textureManager.getTextureHandleIndexAsync( this.textureIndex, function (textureHandle)
    {
        if( textureHandle && textureHandle.image )
        {
            if( self.adjustTextureUVs )
            {
                self.adjustTextureUVs();
            }
        }
    });
};


CCPrimitiveBase.prototype.getTextureHandle = function()
{
    if( this.textureIndex >= 0 )
    {
        var textureHandle = gEngine.textureManager.getTextureHandleIndex( this.textureIndex );
        if( textureHandle )
        {
            return textureHandle;
        }
    }
    return null;
};


CCPrimitiveBase.prototype.getTextureImage = function()
{
    var handle = this.getTextureHandle();
    if( handle && handle.downloaded && handle.image )
    {
        return handle.image;
    }
    return null;
};


CCPrimitiveBase.prototype.removeTexture = function()
{
    this.textureIndex = -1;
};


CCPrimitiveBase.prototype.render = function()
{
    if( this.textureIndex !== -1 )
    {
        gEngine.textureManager.setTextureIndex( this.textureIndex );
    }
    else
    {
        gEngine.textureManager.setTextureIndex( 1 );
    }

    this.renderVertices( gRenderer );
};


CCPrimitiveBase.prototype.renderOutline = function()
{
};
