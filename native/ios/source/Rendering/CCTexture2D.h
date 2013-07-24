/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCTexture2D.h
 * Description : iOS specific texture loader for PNG/JPG.
 *
 * Created     : 27/04/10
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

#ifndef __CCTEXTURE2D_H__
#define __CCTEXTURE2D_H__


#include "CCTextureBase.h"

class CCTexture2D : public CCTextureBase
{
	typedef CCTextureBase super;

    GLenum format, internal;
    GLubyte *buffer;



public:
	CCTexture2D();
	virtual ~CCTexture2D();

protected:
	virtual bool load(const char *path, const CCResourceType resourceType);
	virtual void createGLTexture(const bool generateMipMap);

private:
	static bool extensionSupported(const char* extension);
};


#endif // __CCTEXTURE2D_H__

