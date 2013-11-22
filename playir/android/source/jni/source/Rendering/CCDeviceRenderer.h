/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCDeviceRenderer.h
 * Description : Android specific OpenGL renderer.
 *
 * Created     : 15/05/11
 * Author(s)   : Chris Bowers, Ashraf Samy Hegab
 *-----------------------------------------------------------
 */


#ifndef __CCDEVICERENDERER_H__
#define __CCDEVICERENDERER_H__

#include "CCRenderer.h"

class CCDeviceRenderer : public CCRenderer
{
public:
	~CCDeviceRenderer();

    virtual void resolve();

private:
	bool linkProgram(GLuint &prog);
    int getShaderUniformLocation(const char *name);
    bool loadShader(CCShader *shader);

    bool createContext() { return true; };
	bool createDefaultFrameBuffer(CCFrameBufferObject &fbo);

    void refreshScreenSize();
};


#endif // __CCDEVICERENDERER_H__
