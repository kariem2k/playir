/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCTexture2D.h
 * Description : Android specific texture loader for JPG/GIF/PNG.
 *
 * Created     : 15/05/11
 * Author(s)   : Chris Bowers, Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

#ifndef __CCTEXTURE2D_H__
#define __CCTEXTURE2D_H__

#include "CCTextureBase.h"

class CCTexture2D : public CCTextureBase
{
    typedef CCTextureBase super;

    CCText filename;
    CCResourceType resourceType;
    float rawWidth, rawHeight;



public:
	CCTexture2D();
    virtual ~CCTexture2D();

protected:
    virtual bool load(const char *name, const CCResourceType resourceType);
    virtual void createGLTexture(const bool generateMipMap);

public:
    virtual float getRawWidth() const { return (float)rawWidth; }
    virtual float getRawHeight() const { return (float)rawHeight; }

    static bool DoesTextureExist(const char *path, const CCResourceType resourceType);
};

#endif // __TEXTURE2D_H__
