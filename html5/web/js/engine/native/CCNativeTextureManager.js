/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCNativeTextureManager.js
 * Description : Manages the loading and setting of textures.
 *
 * Created     : 20/10/11
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

CCTextureManager.prototype.assignTextureIndex = function(url, mipmap)
{
    url = MultiplayerManager.GetAssetURL( url );

    var textureHandles = this.textureHandles;
    var length = textureHandles.length;

    var textureHandle;
    var filename = url.getFilename();
    for( var i=0; i<length; ++i )
    {
        textureHandle = textureHandles[i];
        if( filename === textureHandle.filename )
        {
            return i;
        }
    }

    textureHandle = {};
    textureHandle.filename = filename;
	textureHandle.src = url;
    textureHandle.mipmap = mipmap;
    textureHandle.downloaded = false;         // Has the image been downloaded?
    textureHandles.push( textureHandle );

    CCEngine.NativeUpdateCommands += 'CCTextureManager.assignTextureIndex;' + length + ';' + url + ';' + ( mipmap ? "true" : "true" ) + '\n';

    return length;
};


// Don't assign a filepath to a texture, just reference the filename
// Used for linking to natively loaded special textures (i.e. for camera access)
CCTextureManager.prototype.referenceTexture = function(filename, mipmap)
{
    var textureHandles = this.textureHandles;
    var length = textureHandles.length;

    var textureHandle;
    for( var i=0; i<length; ++i )
    {
        textureHandle = textureHandles[i];
        if( filename === textureHandle.filename )
        {
            return i;
        }
    }

    textureHandle = {};
    textureHandle.filename = filename;
    textureHandle.src = filename;
    textureHandle.mipmap = mipmap;
    textureHandle.downloaded = false;         // Has the image been downloaded?
    textureHandles.push( textureHandle );

    CCEngine.NativeUpdateCommands += 'CCTextureManager.referenceTexture;' + length + ';' + filename + ';' + ( mipmap ? "true" : "true" ) + '\n';

    return length;
};


CCTextureManager.DownloadedImage = function(index, width, height, allocatedWidth, allocatedHeight)
{
    if( gEngine && gEngine.textureManager )
    {
        if( width !== undefined && height !== undefined )
        {
            gEngine.textureManager.downloadedImage( index, width, height, allocatedWidth, allocatedHeight );
        }
        else
        {
            gEngine.textureManager.downloadError( index, width, height, allocatedWidth, allocatedHeight );
        }
    }
};


CCTextureManager.prototype.downloadedImage = function(index, width, height, allocatedWidth, allocatedHeight)
{
    var textureHandle = this.getTextureHandleIndex( index );
    if( textureHandle && !textureHandle.downloaded )
    {
        textureHandle.image = {};
        textureHandle.image.width = width;
        textureHandle.image.height = height;

        if( allocatedWidth && allocatedHeight )
        {
            textureHandle.image.allocatedWidth = allocatedWidth;
            textureHandle.image.allocatedHeight = allocatedHeight;
        }

        textureHandle.downloaded = true;

        if( textureHandle.onDownload )
        {
            for( i=0; i<textureHandle.onDownload.length; ++i )
            {
                textureHandle.onDownload[i]( textureHandle );
            }
            delete textureHandle.onDownload;
        }
    }
};


CCTextureManager.prototype.downloadError = function(index)
{
    var textureHandle = this.getTextureHandleIndex( index );
    if( textureHandle && !textureHandle.downloaded )
    {
        // Retry 3 times?
        if( !textureHandle.downloadRetries )
        {
            textureHandle.downloadRetries = 0;
        }

        if( textureHandle.downloadRetries < 3 )
        {
            textureHandle.downloadRetries++;
            this.assignTextureIndex( textureHandle.src, textureHandle.mipmap );
            return;
        }

        //console.log( "textureHandle.image.onerror", url );
        if( textureHandle.onDownload )
        {
            for( i=0; i<textureHandle.onDownload.length; ++i )
            {
                textureHandle.onDownload[i]( null );
            }
            delete textureHandle.onDownload;
        }
    }
};


CCTextureManager.prototype.setTextureIndex = function(index)
{
    if( index !== this.currentTextureIndex )
    {
		this.currentTextureIndex = index;
        CCEngine.NativeRenderCommands += 'CCTextureManager.setTextureIndex;' + index + '\n';
    }
};
