/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCTexture2D.h
 * Description : Windows specific texture loader for PNG/JPG.
 *               Based on Cocus 2D for Windows Phone 8
 *               http://www.cocos2d-iphone.org/archives/2062
 *
 * Created     : 05/01/12
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

#ifndef __CCTEXTURE2D_H__
#define __CCTEXTURE2D_H__


#include "CCTextureBase.h"

class ID3D11ShaderResourceView;
class ID3D11SamplerState;
enum CCTexture2DPixelFormat;


class CCTexture2D : public CCTextureBase
{
    typedef CCTextureBase super;
	
	unsigned char *m_pData;
	CCTexture2DPixelFormat m_pixelFormat;
	bool m_bHasAlpha;
	int m_nBitsPerComponent;

	ID3D11ShaderResourceView* m_pTextureResource;
	ID3D11SamplerState* m_sampleState;


public:
    CCTexture2D();
    virtual ~CCTexture2D();

protected:
    virtual bool load(const char *name, const CCResourceType resourceType);

	unsigned char* loadJPG(void *pData, int nDatalen);
	unsigned char* loadPNG(void *pData, int nDatalen);

	void prepareData(unsigned char *pData);

    virtual void createGLTexture(const bool generateMipMap);
	bool initGLTexture(const void *data, CCTexture2DPixelFormat pixelFormat);
	void setTexParameters(const uint minFilter, const uint magFilter, const uint wrapS, const uint wrapT);

public:
	ID3D11ShaderResourceView* getTextureView() const { return m_pTextureResource; }
	ID3D11SamplerState* getSampler() const { return m_sampleState; }
};


#endif // __CCTEXTURE2D_H__

