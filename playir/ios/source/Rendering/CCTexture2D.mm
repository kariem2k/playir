/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCTexture2D.mm
 *-----------------------------------------------------------
 */

#import "CCDefines.h"
#import "CCTexture2D.h"
#import "CCTextureManager.h"
#import "CCDeviceFileManager.h"


CCTexture2D::CCTexture2D()
{
    buffer = NULL;
}


CCTexture2D::~CCTexture2D()
{
    if( buffer != NULL )
    {
        free( buffer );
    }
}


#define uint8 unsigned char
#define uint32 unsigned int

bool CCTexture2D::load(const char *path, const CCResourceType resourceType)
{
#ifdef DEBUGON
    DEBUGLOG( "CCTexture2D::load %s %f\n", path, gEngine->time.lifetime );
#endif

    CCText fullFilePath;
    if( resourceType == Resource_Cached )
    {
        fullFilePath = CCDeviceFileManager::GetDocsFolder();
    }
    else
    {
        fullFilePath = [[[NSBundle mainBundle] resourcePath] UTF8String];
    }

    CCText filename( path );
    filename.stripDirectory();

    fullFilePath += "/";
    fullFilePath += filename.buffer;

    // Use CG routines to load texture...
	const bool isPNG = strstr( path, ".png" ) != NULL;

	CGDataProviderRef cgDataProviderRef = CGDataProviderCreateWithFilename( fullFilePath.buffer );
	if( cgDataProviderRef != NULL )
	{
		// Load image
		CGImageRef image = NULL;
		if( isPNG )
        {
            image = CGImageCreateWithPNGDataProvider( cgDataProviderRef, NULL, false, kCGRenderingIntentDefault );
        }
		else
        {
            image = CGImageCreateWithJPEGDataProvider( cgDataProviderRef, NULL, false, kCGRenderingIntentDefault );
        }

        if( image == NULL )
        {
            //CCASSERT( image != NULL );
            return false;
        }

		CGDataProviderRelease( cgDataProviderRef );

		// Get information about image
		CGBitmapInfo info = CGImageGetBitmapInfo( image );
		CGColorSpaceModel colormodel = CGColorSpaceGetModel( CGImageGetColorSpace( image ) );
		size_t bpp = CGImageGetBitsPerPixel( image );
		if( bpp < 8 || bpp > 32 || ( colormodel != kCGColorSpaceModelMonochrome && colormodel != kCGColorSpaceModelRGB ) )
		{
			// This loader does not support all possible CCCmage types, such as paletted images
			CGImageRelease( image );
            CCASSERT( false );
            return false;
		}

		// Decide formats using bpp
		switch( bpp )
		{
                // Easy formats
			case 24 : { internal = format = GL_RGB; break; }
			case 16 : { internal = format = GL_LUMINANCE_ALPHA; break; }
			case 8  : { internal = format = GL_LUMINANCE; break; }

                // Possibly trickier format
			case 32 :
			{
				internal = format = GL_RGBA;
				switch( info & kCGBitmapAlphaInfoMask )
				{
					case kCGImageAlphaFirst:
					case kCGImageAlphaNoneSkipFirst:
					case kCGImageAlphaPremultipliedFirst:
					{
						// Alpha first requires swap
						format = GL_BGRA;
						break;
					}
				}
				break;
			}

                // Error
			default:
			{
                // Couldn't handle image bpp
				CGImageRelease( image );
                CCASSERT( false );
				return false;
			}
		}

		// Get pixel data
		CFDataRef data = CGDataProviderCopyData( CGImageGetDataProvider( image ) );
        CCASSERT( data != NULL );

		GLubyte *pixels = (GLubyte*)CFDataGetBytePtr( data );
		CCASSERT( pixels != NULL );

		allocatedWidth = imageWidth = CGImageGetWidth( image );
		allocatedHeight = imageHeight = CGImageGetHeight( image );
        uint32 components = ( bpp >> 3 );

		// Shuffle image data if format is one we don't support
		uint rowBytes = CGImageGetBytesPerRow( image );
		if( format == GL_BGRA )
		{
			uint imgWide = rowBytes / components;
			uint num = imgWide * imageHeight;
			uint32_t *p = (uint32_t*)pixels;

			if ((info & kCGBitmapByteOrderMask) != kCGBitmapByteOrder32Host)
			{
				// Convert from ARGB to BGRA
				for( uint i=0; i<num; ++i )
                {
                    p[i] = (p[i] << 24) | ((p[i] & 0xFF00) << 8) | ((p[i] >> 8) & 0xFF00) | (p[i] >> 24);
                }
			}

			// All current iPhoneOS devices support BGRA via an extension.
            static bool BGRASupport = ExtensionSupported( "GL_IMG_texture_format_BGRA8888" );
			if( !BGRASupport )
			{
				format = GL_RGBA;

				// Convert from BGRA to RGBA
				for( uint i=0; i<num; ++i )
                {
#if __LITTLE_ENDIAN__
					p[i] = ((p[i] >> 16) & 0xFF) | (p[i] & 0xFF00FF00) | ((p[i] & 0xFF) << 16);
#else
                    p[i] = ((p[i] & 0xFF00) << 16) | (p[i] & 0xFF00FF) | ((p[i] >> 16) & 0xFF00);
#endif
                }
			}
		}

		// Remove alpha from non-png formats
		uint8* srcPixel = (uint8*)pixels;
		uint8* destPixel = (uint8*)pixels;
		if( ( bpp==32 ) && ( !isPNG ) )
		{
			uint32 count = imageWidth * imageHeight;
			if( format == GL_RGBA )
			{
				while( count )
				{
					destPixel[0] = srcPixel[0];
					destPixel[1] = srcPixel[1];
					destPixel[2] = srcPixel[2];
					destPixel += 3;
					srcPixel += 4;
					--count;
				}
			}
			else
			{
				// First 4 pixels will corrupt each other, so use special swap
				uint32 fCount = 4;
				while ((fCount)&&(count))
				{
					uint32 p = *(uint32*)srcPixel;
					uint8* p8 = (uint8*)&p;
					destPixel[2] = p8[0];
					destPixel[1] = p8[1];
					destPixel[0] = p8[2];
					destPixel += 3;
					srcPixel += 4;
					--fCount;
					--count;
				}

				// Handle the rest of the pixels
				while (count)
				{
					destPixel[2] = srcPixel[0];
					destPixel[1] = srcPixel[1];
					destPixel[0] = srcPixel[2];
					destPixel += 3;
					srcPixel += 4;
					--count;
				}
			}

			internal = format = GL_RGB;
			rowBytes -= ( rowBytes >> 2 );
			bpp = 24;
            components = ( bpp >> 3 );
		}

        // Copy our image buffer
        allocatedWidth = CCNextPowerOf2( imageWidth );
        allocatedHeight = CCNextPowerOf2( imageHeight );
        GLuint dstBytes = allocatedWidth * components;
        buffer = (GLubyte*)malloc( dstBytes * allocatedHeight );
        for( uint32 y=0; y<imageHeight; ++y )
        {
            memcpy( &buffer[y*dstBytes], &pixels[y*rowBytes], rowBytes );
        }

        // How much space is the texture?
        allocatedBytes = allocatedWidth * allocatedHeight * components;

        // Clean up
        CFRelease( data );
        CGImageRelease( image );

        return true;
	}

	return false;
}


void CCTexture2D::createGLTexture(const bool generateMipMap)
{
	// Stuff pixels into an OpenGL texture
	glGenTextures( 1, &glName );

    const CCTextureName *currentBindedTexture = gEngine->textureManager->getCurrentGLTexture();
    gEngine->textureManager->bindTexture( this );

    glTexParameteri( GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR );
    if( generateMipMap )
    {
        glTexParameteri( GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR_MIPMAP_LINEAR );
    }
    else
    {
        glTexParameteri( GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR );
    }
	//glTexParameteri( GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE );
	//glTexParameteri( GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE );

    glTexImage2D( GL_TEXTURE_2D, 0, internal, allocatedWidth, allocatedHeight, 0, format, GL_UNSIGNED_BYTE, buffer );

    if( generateMipMap )
    {
        glGenerateMipmap( GL_TEXTURE_2D );
    }

    if( buffer != NULL )
    {
        free( buffer );
        buffer = NULL;
    }

    gEngine->textureManager->bindTexture( currentBindedTexture );
}
