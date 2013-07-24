/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCWebTextureManager.js
 * Description : Manages the loading and setting of textures.
 *
 * Created     : 20/10/11
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

CCTextureManager.prototype.assignTextureIndex = function(url)
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

    var OnDowloadFunction = function(textureHandle)
    {
        return function()
        {
            textureHandle.downloaded = true;
            if( textureHandle.onDownload )
            {
                gRenderer.pendingRender = true;
                for( i=0; i<textureHandle.onDownload.length; ++i )
                {
                    textureHandle.onDownload[i]( textureHandle );
                }
                delete textureHandle.onDownload;
            }
        };
    };

    textureHandle = gRenderer.gl.createTexture();
    textureHandle.filename = filename;
	textureHandle.src = url;
    textureHandle.image = new Image();
    textureHandle.image.crossOrigin = "Anonymous";
    textureHandle.image.textureHandle = textureHandle;
    textureHandle.downloaded = false;             // Has the image been downloaded?
    textureHandle.openGL = false;                 // Has the image been loaded into OpenGL?
    textureHandle.image.onload = new OnDowloadFunction( textureHandle );
    textureHandle.image.onerror = function()
    {
        var textureHandle = this.textureHandle;
        if( textureHandle.onDownload )
        {
            for( i=0; i<textureHandle.onDownload.length; ++i )
            {
                textureHandle.onDownload[i]( null );
            }
            delete textureHandle.onDownload;
        }
    };
    textureHandles.push( textureHandle );

    // If we want to simulate bad internet connectivity we can enforce a minimum transfer time
    if( debugSlowNetwork )
    {
        var DownloadImageFunction = function(textureHandle, url)
        {
            return function()
            {
                textureHandle.image.src = url;
            };
        };
        setTimeout( new DownloadImageFunction( textureHandle, url ), 2000 );
    }
    else
    {
        textureHandle.image.src = url;
    }

    return length;
};


CCTextureManager.prototype.setupOpenGLTexture = function(textureHandle)
{
    var gl = gRenderer.gl;
    gl.activeTexture( gl.TEXTURE0 );
    gl.bindTexture( gl.TEXTURE_2D, textureHandle );
    //gl.pixelStorei( gl.UNPACK_FLIP_Y_WEBGL, true );
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureHandle.image );

    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR );

    // Mip map square textures
    var width = textureHandle.image.width;
    if( ( width === textureHandle.image.height ) &&   // Is square?
        ( width > 1 ) &&
        ( ( width & ( width - 1 ) ) === 0 ) )   // Is power of 2?
    {
        gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR );
        gl.generateMipmap( gl.TEXTURE_2D );
    }

	// Required if using non power of 2 textures
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE );
	gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE );

    gl.bindTexture( gl.TEXTURE_2D, null );

    textureHandle.openGL = true;
};


CCTextureManager.prototype.setTextureIndex = function(index)
{
    if( index !== this.currentTextureIndex )
    {
        var textureHandle = this.textureHandles[index];
        if( !textureHandle.openGL )
        {
            if( textureHandle.downloaded )
            {
                this.setupOpenGLTexture( textureHandle );
            }
            else
            {
				if( index !== 0 )
				{
					this.setTextureIndex( 0 );
				}
				return;
            }
        }

		this.currentTextureIndex = index;

		var gl = gRenderer.gl;
		gl.bindTexture( gl.TEXTURE_2D, textureHandle );
		//gl.uniform1i( gRenderer.shaderProgram.samplerUniform, 0 );
    }
};


CCTextureManager.GetBase64Image = function(img)
{
    // Create an empty canvas element
    var canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;

    // Copy the image contents to the canvas
    var ctx = canvas.getContext( "2d" );
    ctx.drawImage(img, 0, 0);

    // Get the data-URL formatted image
    // Firefox supports PNG and JPEG. You could check img.src to guess the
    // original format, but be aware the using "image/jpeg" will re-encode the image.
    var dataURL = canvas.toDataURL("image/png");

    return dataURL.replace( /^data:image\/(png|jpg);base64,/, "" );
};


CCTextureManager.UnlockTextureData = function(textureHandle)
{
    var imageData = CCTextureManager.GetBase64Image( textureHandle.image );
    textureHandle.image = new Image();
    textureHandle.image.textureHandle = textureHandle;
    textureHandle.image.onload = function()
    {
        var textureHandle = this.textureHandle;
        if( textureHandle.onDownload )
        {
            textureHandle.onDownload.callback( textureHandle );
            textureHandle.onDownload = false;
        }
        textureHandle.downloaded = true;
    };
    textureHandle.image.src = "data:image/gif;base64," + imageData;
};
