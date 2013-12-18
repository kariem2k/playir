/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCTexture2D.cpp
 *-----------------------------------------------------------
 */

#include "CCDefines.h"
#include "CCTexture2D.h"
#include "CCTextureManager.h"
#include "CCFileManager.h"

#include "CCDeviceRenderer.h"
#include "jpeglib.h"
#include "png.h"


CCTexture2D::CCTexture2D()
{
	m_pData = NULL;
	m_bHasAlpha = false;
	m_nBitsPerComponent = 0;

	m_pTextureResource = NULL;
	m_sampleState = NULL;
}


CCTexture2D::~CCTexture2D()
{
	if( m_pData != NULL )
	{
		delete[] m_pData;
		m_pData = NULL;
	}

	// Release the texture resource.
	if( m_pTextureResource != NULL )
	{
		m_pTextureResource->Release();
		m_pTextureResource = NULL;
	}

	// Release the sampler state.
	if( m_sampleState != NULL )
	{
		m_sampleState->Release();
		m_sampleState = NULL;
	}
}


bool CCTexture2D::load(const char *path, const CCResourceType resourceType)
{
    CCText dataFile( path );
    char *fileData = NULL;
	uint fileSize = 0;
	if( resourceType == Resource_Packaged )
	{
		fileSize = CCFileManager::GetPackagedFile( dataFile.buffer, &fileData );
	}
	else if( resourceType == Resource_Cached )
	{
		fileSize = CCFileManager::GetCachedFile( dataFile.buffer, &fileData );
	}

	if( fileData != NULL )
	{
		CCData data;
		data.set( fileData, fileSize );
		FREE_POINTER( fileData );

		if( CCText::Contains( path, ".png" ) )
		{
			unsigned char *rawImageData = loadPNG( data.buffer, data.length );
			if( rawImageData != NULL )
			{
				prepareData( rawImageData );
				return true;
			}
		}
		else if( CCText::Contains( path, ".jpg" ) )
		{
			unsigned char *rawImageData = loadJPG( data.buffer, data.length );
			if( rawImageData != NULL )
			{
				prepareData( rawImageData );
				return true;
			}
		}
	}

    return false;
}


enum CCTexture2DPixelFormat
{
	kCCTexture2DPixelFormat_RGBA8888,
	kCCTexture2DPixelFormat_RGB888,
	kCCTexture2DPixelFormat_RGBA4444,
	kCCTexture2DPixelFormat_RGB5A1,
	kCCTexture2DPixelFormat_RGB565,
	kCCTexture2DPixelFormat_A8,
	kCCTexture2DPixelFormat_AI88,
};


unsigned char* CCTexture2D::loadJPG(void *pData, int nDatalen)
{
	unsigned char * pOutData = NULL;

    /* these are standard libjpeg structures for reading(decompression) */
    struct jpeg_decompress_struct cinfo;
    struct jpeg_error_mgr jerr;
    /* libjpeg data structure for storing one row, that is, scanline of an image */
    JSAMPROW row_pointer[1] = {NULL};
    unsigned long location = 0;
    unsigned int i = 0;

    bool bRet = false;
    do
    {
        /* here we set up the standard libjpeg error handler */
        cinfo.err = jpeg_std_error( &jerr );

        /* setup decompression process and source, then read JPEG header */
        jpeg_create_decompress( &cinfo );

        jpeg_mem_src( &cinfo, (unsigned char *) pData, nDatalen );

        /* reading the image header which contains image information */
        int result = jpeg_read_header( &cinfo, true );

		// If we can't load our header, it means that this is a bad jpg
		if( result == 0 )
		{
			return false;
		}

        // we only support RGB or grayscale
        if (cinfo.jpeg_color_space != JCS_RGB)
        {
            if (cinfo.jpeg_color_space == JCS_GRAYSCALE || cinfo.jpeg_color_space == JCS_YCbCr)
            {
                cinfo.out_color_space = JCS_RGB;
            }
        }
        else
        {
            break;
        }

        /* Start decompression jpeg here */
        jpeg_start_decompress( &cinfo );

        /* init image info */
        row_pointer[0] = new unsigned char[cinfo.output_width*cinfo.output_components];
        if(! row_pointer[0])
		{
			break;
		}

        pOutData = new unsigned char[cinfo.output_width*cinfo.output_height*cinfo.output_components];
        if(! pOutData)
		{
			break;
		}

        /* now actually read the jpeg into the raw buffer */
        /* read one scan line at a time */
        while( cinfo.output_scanline < cinfo.image_height )
        {
            jpeg_read_scanlines( &cinfo, row_pointer, 1 );
            for( i=0; i<cinfo.image_width*cinfo.num_components;i++)
                pOutData[location++] = row_pointer[0][i];
        }

        jpeg_finish_decompress( &cinfo );
        jpeg_destroy_decompress( &cinfo );
        /* wrap up decompression, destroy objects, free pointers and close open files */

        m_nBitsPerComponent = 8;
        allocatedWidth = imageWidth = (short)(cinfo.image_width);
        allocatedHeight = imageHeight = (short)(cinfo.image_height);
		allocatedBytes = imageHeight * imageWidth * 3;
    } while (0);

    if( row_pointer[0] != NULL )
	{
		delete[] row_pointer[0];
		row_pointer[0] = NULL;
	}

    return pOutData;
}


typedef struct
{
    unsigned char* data;
    int size;
    int offset;
}tImageSource;

static void pngReadCallback(png_structp png_ptr, png_bytep data, png_size_t length)
{
    tImageSource* isource = (tImageSource*)png_get_io_ptr(png_ptr);

    if((int)(isource->offset + length) <= isource->size)
    {
        memcpy(data, isource->data+isource->offset, length);
        isource->offset += length;
    }
    else
    {
        png_error(png_ptr, "pngReaderCallback failed");
    }
}

#define CC_RGB_PREMULTIPLY_APLHA(vr, vg, vb, va) \
    (unsigned)(((unsigned)((unsigned char)(vr) * ((unsigned char)(va) + 1)) >> 8) | \
    ((unsigned)((unsigned char)(vg) * ((unsigned char)(va) + 1) >> 8) << 8) | \
    ((unsigned)((unsigned char)(vb) * ((unsigned char)(va) + 1) >> 8) << 16) | \
    ((unsigned)(unsigned char)(va) << 24))


unsigned char* CCTexture2D::loadPNG(void *pData, int nDatalen)
{
    png_byte        header[8]   = {0};
    png_structp     png_ptr     =   0;
    png_infop       info_ptr    = 0;
    unsigned char * pImateData  = NULL;
	unsigned char * pOutData = NULL;

    do
    {
        // png header len is 8 bytes
    	if(nDatalen < 8)
		{
			break;
		}

       //  check the data is png or not
        memcpy(header, pData, 8);
		//memcpy(data, pData, 97184);

		if(png_sig_cmp(header, 0, 8))
		{
			break;
		}

		// init png_struct

		 png_ptr = png_create_read_struct(PNG_LIBPNG_VER_STRING, NULL, NULL, NULL);
		//png_ptr = png_create_read_struct(PNG_LIBPNG_VER_STRING, errPointer, NULL, NULL);
		//png_ptr = png_create_read_struct(PNG_LIBPNG_VER_STRING, errPointer, (png_voidp)user_error_ptr, user_error_fn, user_warning_fn);
		if(!png_ptr)
		{
			break;
		}

		// init png_info
		info_ptr = png_create_info_struct(png_ptr);
		if(!info_ptr)
		{
			break;
		}

        if(setjmp(png_jmpbuf(png_ptr)))
		{
			break;
		}
        // set the read call back function
        tImageSource imageSource;
        imageSource.data    = (unsigned char*)pData;
        imageSource.size    = nDatalen;
        imageSource.offset  = 0;
        png_set_read_fn(png_ptr, &imageSource, pngReadCallback);

        // read png
        // PNG_TRANSFORM_EXPAND: perform set_expand()
        // PNG_TRANSFORM_PACKING: expand 1, 2 and 4-bit samples to bytes
        // PNG_TRANSFORM_STRIP_16: strip 16-bit samples to 8 bits
        // PNG_TRANSFORM_GRAY_TO_RGB: expand grayscale samples to RGB (or GA to RGBA)
        png_read_png(png_ptr, info_ptr, PNG_TRANSFORM_EXPAND | PNG_TRANSFORM_PACKING
            | PNG_TRANSFORM_STRIP_16 | PNG_TRANSFORM_GRAY_TO_RGB, 0);

        int         color_type  = 0;
        png_uint_32 nWidth = 0;
        png_uint_32 nHeight = 0;
        int         nBitsPerComponent = 0;
        png_get_IHDR(png_ptr, info_ptr, &nWidth, &nHeight, &nBitsPerComponent, &color_type, 0, 0, 0);

         //init image info
        m_bHasAlpha = ( info_ptr->color_type & PNG_COLOR_MASK_ALPHA ) ? true : false;

         //allocate memory and read data
        int components = 3;
        if (m_bHasAlpha)
        {
            components = 4;
        }

        pImateData = new unsigned char[nHeight * nWidth * components];
        if(! pImateData)
		{
			break;
		}

        png_bytep * rowPointers = png_get_rows(png_ptr, info_ptr);

         //copy data to image info
        int bytesPerRow = nWidth * components;
        if(m_bHasAlpha)
        {
            unsigned int *tmp = (unsigned int *)pImateData;
            for(unsigned int i = 0; i < nHeight; i++)
            {
                for(int j = 0; j < bytesPerRow; j += 4)
                {
                    *tmp++ = CC_RGB_PREMULTIPLY_APLHA( rowPointers[i][j], rowPointers[i][j + 1],
                        rowPointers[i][j + 2], rowPointers[i][j + 3]);
                }
            }
        }
        else
        {
            for (unsigned int j = 0; j < nHeight; ++j)
            {
                memcpy(pImateData + j * bytesPerRow, rowPointers[j], bytesPerRow);
            }
        }

        pOutData	= pImateData;
        pImateData  = NULL;

        m_nBitsPerComponent = nBitsPerComponent;
        allocatedHeight = imageHeight = (short)nHeight;
        allocatedWidth = imageWidth = (short)nWidth;
		allocatedBytes = nHeight * nWidth * components;

    } while (0);

	if( pImateData != NULL )
	{
		delete[] pImateData;
		pImateData = NULL;
	}

    if (png_ptr)
    {
        png_destroy_read_struct(&png_ptr, (info_ptr) ? &info_ptr : 0, 0);
    }
    return pOutData;
}


void CCTexture2D::prepareData(unsigned char *pRawImageData)
{
	allocatedWidth = CCNextPowerOf2( imageWidth );
	allocatedHeight = CCNextPowerOf2( imageHeight );

	const uint32_t POTWidth = allocatedWidth;
	const uint32_t POTHeight = allocatedHeight;

	// always load premultiplied images
	unsigned char*			data = NULL;
	unsigned int*			inPixel32 = NULL;
	unsigned short*			outPixel16 = NULL;
	CCSize					imageSize;

	// compute pixel format
	if(m_bHasAlpha)
	{
		m_pixelFormat = kCCTexture2DPixelFormat_RGBA8888;
	}
	else
	{
		if (m_nBitsPerComponent >= 8)
		{
			m_pixelFormat = kCCTexture2DPixelFormat_RGB888;
		}
		else
		{
			DEBUGLOG("cocos2d: CCTexture2D: Using RGB565 texture since image has no alpha");
			m_pixelFormat = kCCTexture2DPixelFormat_RGB565;
		}
	}

	switch(m_pixelFormat)
	{
		case kCCTexture2DPixelFormat_RGBA8888:
		case kCCTexture2DPixelFormat_RGBA4444:
		case kCCTexture2DPixelFormat_RGB5A1:
		case kCCTexture2DPixelFormat_RGB565:
		case kCCTexture2DPixelFormat_A8:
			if(imageWidth == allocatedWidth && imageHeight == allocatedHeight)
			{
				data = new unsigned char[POTHeight * POTWidth * 4];
				memcpy(data, pRawImageData, POTHeight * POTWidth * 4);
			}
			else
			{
				data = new unsigned char[POTHeight * POTWidth * 4];
				memset(data, 0, POTHeight * POTWidth * 4);

				unsigned char* pPixelData = (unsigned char*)pRawImageData;
				unsigned char* pTargetData = (unsigned char*)data;

				for(int y = 0; y < imageHeight; ++y)
				{
					memcpy(pTargetData+POTWidth*4*y, pPixelData+(imageWidth)*4*y, (imageWidth)*4);
				}
			}

			break;
		case kCCTexture2DPixelFormat_RGB888:
			data = new unsigned char[POTHeight * POTWidth * 4];
			memset(data, 0, POTHeight * POTWidth * 4);
			if(imageWidth == (short)POTWidth && imageHeight == (short)POTHeight)
			{
				for (int i = 0; i < POTHeight; ++i)
				{
					for (int j = 0; j < POTWidth; ++j)
					{
						int m = (i * POTWidth * 4) + (j * 4);
						int n = (i * POTWidth * 3) + (j * 3);
						data[m+0] = pRawImageData[n+0];
						data[m+1] = pRawImageData[n+1];
						data[m+2] = pRawImageData[n+2];
						data[m+3] = 255;
					}
				}
			}
			else
			{
				for (int i = 0; i < imageHeight; ++i)
				{
					for (int j = 0; j < imageWidth; ++j)
					{
						int m = (i * POTWidth * 4) + (j * 4);
						int n = (i * imageWidth * 3) + (j * 3);
						data[m+0] = pRawImageData[n+0];
						data[m+1] = pRawImageData[n+1];
						data[m+2] = pRawImageData[n+2];
						data[m+3] = 255;
					}
				}
			}
			break;
		default:
			CCASSERT( false );
	}

	// Repack the pixel data into the right format

	if(m_pixelFormat == kCCTexture2DPixelFormat_RGB565) 
	{
		//Convert "RRRRRRRRRGGGGGGGGBBBBBBBBAAAAAAAA" to "RRRRRGGGGGGBBBBB"
		unsigned char *tempData = new unsigned char[POTHeight * POTWidth * 2];
		inPixel32 = (unsigned int*)data;
		outPixel16 = (unsigned short*)tempData;

		unsigned int length = POTWidth * POTHeight;
		for(unsigned int i = 0; i < length; ++i, ++inPixel32)
		{
			*outPixel16++ =
				((((*inPixel32 >> 0) & 0xFF) >> 3) << 11) |  // R
				((((*inPixel32 >> 8) & 0xFF) >> 2) << 5) |   // G
				((((*inPixel32 >> 16) & 0xFF) >> 3) << 0);   // B
		}

		delete [] data;
		data = tempData;
	}
	else if (m_pixelFormat == kCCTexture2DPixelFormat_RGBA4444) 
	{
		//Convert "RRRRRRRRRGGGGGGGGBBBBBBBBAAAAAAAA" to "RRRRGGGGBBBBAAAA"
		unsigned char *tempData = new unsigned char[POTHeight * POTWidth * 2];
		inPixel32 = (unsigned int*)data;
		outPixel16 = (unsigned short*)tempData;

		unsigned int length = POTWidth * POTHeight;
		for(unsigned int i = 0; i < length; ++i, ++inPixel32)
		{
			*outPixel16++ =
			((((*inPixel32 >> 0) & 0xFF) >> 4) << 12) | // R
			((((*inPixel32 >> 8) & 0xFF) >> 4) << 8) | // G
			((((*inPixel32 >> 16) & 0xFF) >> 4) << 4) | // B
			((((*inPixel32 >> 24) & 0xFF) >> 4) << 0); // A
		}

		delete [] data;
		data = tempData;
	}
	else if (m_pixelFormat == kCCTexture2DPixelFormat_RGB5A1)
	{
		//Convert "RRRRRRRRRGGGGGGGGBBBBBBBBAAAAAAAA" to "RRRRRGGGGGBBBBBA"
		unsigned char *tempData = new unsigned char[POTHeight * POTWidth * 2];
		inPixel32 = (unsigned int*)data;
		outPixel16 = (unsigned short*)tempData;

		unsigned int length = POTWidth * POTHeight;
		for(unsigned int i = 0; i < length; ++i, ++inPixel32)
		{
 			*outPixel16++ =
			((((*inPixel32 >> 0) & 0xFF) >> 3) << 11) | // R
			((((*inPixel32 >> 8) & 0xFF) >> 3) << 6) | // G
			((((*inPixel32 >> 16) & 0xFF) >> 3) << 1) | // B
			((((*inPixel32 >> 24) & 0xFF) >> 7) << 0); // A
		}

		delete []data;
		data = tempData;
	}
	else if (m_pixelFormat == kCCTexture2DPixelFormat_A8)
	{
		// fix me, how to convert to A8
		m_pixelFormat = kCCTexture2DPixelFormat_RGBA8888;
	}

	m_pData = data;

	delete[] pRawImageData;
}


void CCTexture2D::createGLTexture(const bool generateMipMap)
{
	//ASSERT(this->initWithData(data, pixelFormat, POTWidth, POTHeight, imageSize), "Create texture failed!");
	initGLTexture( m_pData, m_pixelFormat );

	//CGContextRelease(context);
	delete[] m_pData;
	m_pData = NULL;
}


bool CCTexture2D::initGLTexture(const void *data, CCTexture2DPixelFormat pixelFormat)
{
	int dxFormat = DXGI_FORMAT_R8G8B8A8_UNORM;
	int dataSizeByte = 4;

	setTexParameters( GL_LINEAR, GL_LINEAR, GL_CLAMP_TO_EDGE, GL_CLAMP_TO_EDGE );

	// Specify OpenGL texture image
	switch(pixelFormat)
	{
	case kCCTexture2DPixelFormat_RGBA8888:
		dxFormat = DXGI_FORMAT_R8G8B8A8_UNORM;
		dataSizeByte = 4;
		break;
	case kCCTexture2DPixelFormat_RGB888:
		dxFormat = DXGI_FORMAT_R8G8B8A8_UNORM;
		dataSizeByte = 4;
		break;
	case kCCTexture2DPixelFormat_RGBA4444:
		dxFormat = DXGI_FORMAT_B4G4R4A4_UNORM;
		dataSizeByte = 4;
		break;
	case kCCTexture2DPixelFormat_RGB5A1:
		dxFormat = DXGI_FORMAT_B5G5R5A1_UNORM;
		dataSizeByte = 2;
		break;
	case kCCTexture2DPixelFormat_RGB565:
		dxFormat = DXGI_FORMAT_B5G6R5_UNORM;
		dataSizeByte = 2;
		break;
	case kCCTexture2DPixelFormat_AI88:
		dxFormat = DXGI_FORMAT_R8G8_UNORM;
		dataSizeByte = 2;
		break;
	case kCCTexture2DPixelFormat_A8:
		dxFormat = DXGI_FORMAT_A8_UNORM;
		dataSizeByte = 1;
		break;
	default:
		CCASSERT_MESSAGE( false, "NSInternalInconsistencyException");

	}
	Microsoft::WRL::ComPtr<ID3D11Device1> &pdevice = gDeviceRenderer->getDevice();
	ID3D11Texture2D *tex;
	D3D11_TEXTURE2D_DESC tdesc;
	D3D11_SUBRESOURCE_DATA tbsd;
	tbsd.pSysMem = data;
	tbsd.SysMemPitch = allocatedWidth*dataSizeByte;
	tbsd.SysMemSlicePitch = allocatedWidth*allocatedHeight*dataSizeByte; // Not needed since this is a 2d texture

	tdesc.Width = allocatedWidth;
	tdesc.Height = allocatedHeight;
	tdesc.MipLevels = 1;
	tdesc.ArraySize = 1;

	tdesc.SampleDesc.Count = 1;
	tdesc.SampleDesc.Quality = 0;
	tdesc.Usage = D3D11_USAGE_DEFAULT;
	tdesc.Format = (DXGI_FORMAT)dxFormat;
	tdesc.BindFlags = D3D11_BIND_RENDER_TARGET | D3D11_BIND_SHADER_RESOURCE;

	tdesc.CPUAccessFlags = 0;
	tdesc.MiscFlags = 0;

	if(FAILED(pdevice->CreateTexture2D(&tdesc,&tbsd,&tex)))
	{
		return false;
	}

	D3D11_SHADER_RESOURCE_VIEW_DESC srvDesc;
	D3D11_TEXTURE2D_DESC desc;
	// Get a texture description to determine the texture
	// format of the loaded texture.
	tex->GetDesc( &desc );

	// Fill in the D3D11_SHADER_RESOURCE_VIEW_DESC structure.
	srvDesc.Format = desc.Format;
	srvDesc.ViewDimension = D3D11_SRV_DIMENSION_TEXTURE2D;
	srvDesc.Texture2D.MostDetailedMip = 0;
	srvDesc.Texture2D.MipLevels = desc.MipLevels;

	// Create the shader resource view.
	pdevice->CreateShaderResourceView( tex, &srvDesc, &m_pTextureResource );
	glName = (GLuint)m_pTextureResource;
	if ( tex )
	{
		tex->Release();
		tex = 0;
	}

	//m_tContentSize = contentSize;
	//m_ePixelFormat = pixelFormat;
	//m_fMaxS = contentSize.width / (float)(allocatedWidth);
	//m_fMaxT = contentSize.height / (float)(allocatedHeight);

	//m_bHasPremultipliedAlpha = false;

	//m_eResolutionType = kCCResolutionUnknown;

	return true;
}


void CCTexture2D::setTexParameters(const uint minFilter, const uint magFilter, const uint wrapS, const uint wrapT)
{
	D3D11_SAMPLER_DESC samplerDesc;
	int filter = -1;
	int u = -1;
	int v = -1;
	bool bcreat = true;
	ZeroMemory(&samplerDesc,sizeof(D3D11_SAMPLER_DESC));
	if ( m_sampleState )
	{
		m_sampleState->GetDesc(&samplerDesc);
		filter = samplerDesc.Filter;
		u = samplerDesc.AddressU;
		v = samplerDesc.AddressV;
	}

	if ( magFilter == GL_NEAREST )
	{
		switch(minFilter)
		{
		case GL_NEAREST:
			filter = D3D11_FILTER_MIN_MAG_MIP_POINT;
			break;
		case GL_LINEAR:
			filter = D3D11_FILTER_MIN_LINEAR_MAG_MIP_POINT;
			break;
		case GL_NEAREST_MIPMAP_NEAREST:
			filter = D3D11_FILTER_MIN_POINT_MAG_MIP_LINEAR;
			break;
		case GL_LINEAR_MIPMAP_NEAREST:
			filter = D3D11_FILTER_MIN_POINT_MAG_LINEAR_MIP_POINT;
			break;
		case GL_NEAREST_MIPMAP_LINEAR:
			filter = D3D11_FILTER_MIN_LINEAR_MAG_MIP_POINT;
			break;
		case GL_LINEAR_MIPMAP_LINEAR:
			filter = D3D11_FILTER_MIN_LINEAR_MAG_POINT_MIP_LINEAR;
			break;
		}
	}

	if ( magFilter == GL_LINEAR )
	{
		switch(minFilter)
		{
		case GL_NEAREST:
			filter = D3D11_FILTER_MIN_POINT_MAG_MIP_LINEAR;
			break;
		case GL_LINEAR:
			filter = D3D11_FILTER_MIN_MAG_MIP_LINEAR;
			break;
		case GL_NEAREST_MIPMAP_NEAREST:
			filter = D3D11_FILTER_MIN_POINT_MAG_LINEAR_MIP_POINT;
			break;
		case GL_LINEAR_MIPMAP_NEAREST:
			filter = D3D11_FILTER_MIN_LINEAR_MAG_MIP_POINT;
			break;
		case GL_NEAREST_MIPMAP_LINEAR:
			filter = D3D11_FILTER_MIN_MAG_LINEAR_MIP_POINT;
			break;
		case GL_LINEAR_MIPMAP_LINEAR:
			filter = D3D11_FILTER_MIN_LINEAR_MAG_POINT_MIP_LINEAR;
			break;
		}
	}

	if ( wrapS == GL_REPEAT )
	{
		u = D3D11_TEXTURE_ADDRESS_WRAP;
	}
	else if ( wrapS == GL_CLAMP_TO_EDGE )
	{
		u = D3D11_TEXTURE_ADDRESS_CLAMP;
	}

	if ( wrapT == GL_REPEAT )
	{
		v = D3D11_TEXTURE_ADDRESS_WRAP;
	}
	else if ( wrapT == GL_CLAMP_TO_EDGE )
	{
		v = D3D11_TEXTURE_ADDRESS_CLAMP;
	}

	if ( (filter==samplerDesc.Filter) && (u==samplerDesc.AddressU) && (v==samplerDesc.AddressV) )
	{
		bcreat = false;
	}
	else
	{
		if ( m_sampleState )
		{
			m_sampleState->Release();
			m_sampleState = 0;
		}
	}

	samplerDesc.Filter = (D3D11_FILTER)filter;
	samplerDesc.AddressU = static_cast<D3D11_TEXTURE_ADDRESS_MODE>(u);
	samplerDesc.AddressV = static_cast<D3D11_TEXTURE_ADDRESS_MODE>(v);
	samplerDesc.AddressW = static_cast<D3D11_TEXTURE_ADDRESS_MODE>(u);

	samplerDesc.MipLODBias = 0.0f;
	samplerDesc.MaxAnisotropy = 1;
	samplerDesc.ComparisonFunc = D3D11_COMPARISON_ALWAYS;
	samplerDesc.BorderColor[0] = samplerDesc.BorderColor[1] = samplerDesc.BorderColor[2] = samplerDesc.BorderColor[3] = 0;
	samplerDesc.MinLOD = 0;
	samplerDesc.MaxLOD = D3D11_FLOAT32_MAX;

	if ( bcreat )
	{
		gDeviceRenderer->getDevice()->CreateSamplerState(&samplerDesc, &m_sampleState);
	}
}