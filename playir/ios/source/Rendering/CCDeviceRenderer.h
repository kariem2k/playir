/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCDeviceRenderer.h
 * Description : iOS specific OpenGL renderer.
 *
 * Created     : 01/05/10
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

#ifndef __CCDEVICERENDERER_H__
#define __CCDEVICERENDERER_H__


#include "CCRenderer.h"

#define ENABLE_MULTISAMPLING 1

class CCDeviceRenderer : public CCRenderer
{
public:
    typedef CCRenderer super;

    CCDeviceRenderer();
	virtual ~CCDeviceRenderer();

	void bind();
	void resolve();

private:
	bool linkProgram(GLuint prog);
    int getShaderUniformLocation(const char *name);
    bool loadShader(CCShader *shader);

    virtual bool createContext();
	bool createDefaultFrameBuffer(CCFrameBufferObject &fbo);

    void refreshScreenSize();

private:
	EAGLContext *context;

    bool useMultisampling;
#if ENABLE_MULTISAMPLING
    // Buffer definitions for the MSAA
    GLuint frameBufferMSAA, renderBufferMSAA;
#endif
};


#endif // __CCDEVICERENDERER_H__