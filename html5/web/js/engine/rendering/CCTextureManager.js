/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCTextureManager.js
 * Description : Manages the loading and setting of textures.
 *
 * Created     : 20/10/11
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

function CCTextureManager()
{
	this.fontPages = [];

    this.currentTextureIndex = -1;
    this.textureHandles = [];

    this.assignTextureIndex( "transparent.png" );
    this.assignTextureIndex( "white.png" );
    this.setTextureIndex( 1 );
}


CCTextureManager.prototype.loadFont = function(font)
{
	var fontPage = new CCTextureFontPageFile( font );
	fontPage.load();
	this.fontPages.push( fontPage );

    if( CCEngine.NativeUpdateCommands !== undefined )
    {
        CCEngine.NativeUpdateCommands += "CCTextureManager.loadFont;" + font + '\n';
    }
};


CCTextureManager.prototype.getTextureHandleIndex = function(index)
{
    var textureHandles = this.textureHandles;
    if( index >= 0 && index < textureHandles.length )
    {
        var texture = textureHandles[index];
        return texture;
    }

    return null;
};


CCTextureManager.prototype.getTextureHandleIndexAsync = function(index, onDownloadedCallback)
{
    var handle = this.textureHandles[index];
    if( handle.downloaded )
    {
        if( onDownloadedCallback )
        {
            onDownloadedCallback( handle );
        }
    }
    else if( onDownloadedCallback )
    {
        if( !handle.onDownload )
        {
            handle.onDownload = [];
        }
        handle.onDownload.push( onDownloadedCallback );
    }
};


CCTextureManager.prototype.getTextureHandle = function(src, onDownloadedCallback)
{
    var textureHandleIndex = this.assignTextureIndex( src );
    this.getTextureHandleIndexAsync( textureHandleIndex, onDownloadedCallback );
};


// Ensure image is < maxResolution
CCTextureManager.ValidateImageResolution = function(base64Data, targetEncoding, maxResolution, callback)
{
    AlertsManager.ModalAlert( "processing..." );

    // Load the image data
    var image = new Image();
    image.onload = function()
    {
        var validatedData = base64Data;

        if( image.width > maxResolution || image.height > maxResolution )
        {
            // Create an empty canvas element the size of the image
            var canvas = document.createElement( "canvas" );

            if( image.width > maxResolution )
            {
                canvas.width = maxResolution;
                canvas.height = ( image.height / image.width ) * maxResolution;
            }
            else if( image.height > maxResolution )
            {
                canvas.width = ( image.width / image.height ) * maxResolution;
                canvas.height = maxResolution;
            }

            // Copy the image contents to the canvas
            var ctx = canvas.getContext( "2d" );
            ctx.drawImage( image, 0, 0, canvas.width, canvas.height );

            // Get the data-URL formatted image
            validatedData = canvas.toDataURL( targetEncoding );
        }

        AlertsManager.Hide( "processing..." );
        callback( validatedData );
    };

    image.onabort = function()
    {
        AlertsManager.Hide( "processing..." );
        callback();
    };

    image.onerror = function()
    {
        AlertsManager.Hide( "processing..." );
        callback();
    };

    image.src = base64Data;
};


CCTextureManager.ConvertBase64Image = function(base64Data, callback)
{
    // Load the image data
    var image = new Image();
    image.onload = function()
    {
        // Create an empty canvas element the size of the image
        var canvas = document.createElement( "canvas" );
        canvas.width = image.width;
        canvas.height = image.height;

        // Copy the image contents to the canvas
        var ctx = canvas.getContext( "2d" );
        ctx.drawImage( image, 0, 0 );

        // Get the data-URL formatted image
        var dataURL = canvas.toDataURL( "image/jpeg" );
        callback( dataURL );
    };

    image.onabort = function()
    {
        callback();
    };

    image.onerror = function()
    {
        callback();
    };

    image.src = base64Data;
};


CCTextureManager.ConvertImage = function(image, format, tiling, callback)
{
    // Create an empty canvas element the size of the image
    var canvas = document.createElement( "canvas" );
    canvas.width = image.width;
    canvas.height = image.height;

    if( tiling > 0 )
    {
        var newWidth = image.width / tiling;
        var newHeight = image.height / tiling;

        // Copy the image contents to the canvas
        var ctx = canvas.getContext( "2d" );
        var y = 0.0;

        while( y < canvas.height )
        {
            var x = 0.0;
            while( x < canvas.width )
            {
                ctx.drawImage( image, x, y, newWidth, newHeight );
                x += newWidth;
            }
            y += newHeight;
        }
    }

    // Get the data-URL formatted image
    if( format === "jpg" )
    {
        callback( canvas.toDataURL( "image/jpeg" ) );
    }
    else if( format === "png" )
    {
        callback( canvas.toDataURL( "image/png" ) );
    }
    else
    {
        callback( false );
    }
};
