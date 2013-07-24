/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCRenderer.h
 * Description : Common OpenGL renderer.
 *
 * Created     : 01/05/10
 * Author(s)   : Ashraf Samy Hegab, Chris Wilson
 *-----------------------------------------------------------
 */

#ifndef __CCRENDERER_H__
#define __CCRENDERER_H__


#include "CCFrameBufferManager.h"


enum CCRenderFlags
{
    render_all				= 0x000000001,
    render_collisionBoxes	= 0x000000002,
    render_collisionTrees	= 0x000000004,
    render_pathFinder		= 0x000000008,
    render_noPyramids		= 0x000000010,
    render_fontPage         = 0x000000012
};

enum CCRenderPass
{
	render_background,
	render_main,
	render_finished
};

inline CCRenderPass operator++(CCRenderPass &pass, int)
{
   const CCRenderPass previous = pass;
   const int i = static_cast<int>(pass);
   pass = static_cast<CCRenderPass>((i + 1) % 7);
   return previous;
}

// uniform index
enum
{
	UNIFORM_PROJECTIONMATRIX,
    UNIFORM_VIEWMATRIX,
    UNIFORM_MODELMATRIX,
    UNIFORM_MODELCOLOUR,

    UNIFORM_MODELNORMALMATRIX,
    UNIFORM_LIGHTPOSITION,
    UNIFORM_LIGHTDIFFUSE,

    UNIFORM_CAMERAPOSITION,

    TEXTURE_DIFFUSE,
    TEXTURE_ENV,

    NUM_UNIFORMS
};

// attribute index
enum
{
    ATTRIB_VERTEX,
	ATTRIB_TEXCOORD,
    ATTRIB_COLOUR,
    ATTRIB_NORMAL,
    NUM_ATTRIBUTES
};

struct CCShader
{
    CCShader(const char *name);

    void use();
    void enableAttributeArray(const uint index);
    void disableAttributeArray(const uint index);

    const char *name;
    GLint uniforms[NUM_UNIFORMS];

#ifdef QT
    class QGLShaderProgram *program;
#else
    GLuint program;
#endif
};


class CCRenderer
{
    friend class CCFrameBufferManager;

protected:
    CCSize screenSize;
    CCSize inverseScreenSize;
    float aspectRatio;

    CCShader *currentShader;
    CCList<CCShader> shaders;
    bool usingOpenGL2;

public:
    CCFrameBufferManager frameBufferManager;
	uint renderFlags;

protected:
	struct RenderState
	{
		RenderState()
		{
			blendEnabled = false;
			depthReadEnabled = false;
			depthWriteEnabled = false;
			cullingEnabled = false;
			cullingType = 0;
		}

		bool blendEnabled;
		bool depthReadEnabled;
		bool depthWriteEnabled;
		bool cullingEnabled;
		GLint cullingType;
	};
	static RenderState ActiveRenderState;
	static RenderState PendingRenderState;



public:
	CCRenderer();
    virtual ~CCRenderer();

    bool setup();

    bool openGL2() { return usingOpenGL2; }

    // Calculates the screen size parameters
    void setupScreenSizeParams();

    virtual void bind();
    virtual void clear(const bool colour);
    virtual void resolve() {};

protected:
    virtual int getShaderUniformLocation(const char *name) = 0;
    CCShader* loadShader(const char *name);
    virtual bool loadShader(CCShader *shader) = 0;
    virtual bool loadShaders();

    virtual bool createContext() { return true; }
    virtual bool createDefaultFrameBuffer(CCFrameBufferObject &fbo) = 0;

    // Gets the current screen size from the view
    virtual void refreshScreenSize() = 0;

public:
    void setupOpenGL();

    inline FBOType getDefaultFrameBuffer() { return frameBufferManager.defaultFBO.getFrameBuffer(); }

    inline const CCShader* getShader() { return currentShader; }
    bool setShader(const char *name, const bool useVertexColours=false, const bool useVertexNormals=false);

    const CCSize& getScreenSize() { return screenSize; }
    const CCSize& getInverseScreenSize() { return inverseScreenSize; }
    float getAspectRatio() { return aspectRatio; }

	// Render API wrapper
    // Tell the renderer that the pointer contents has been updated
    virtual void updateVertexPointer(const uint index, const void *pointer) {};

    // Tell the renderer that the pointer should no longer be cached
    virtual void derefVertexPointer(const uint index, const void *pointer) {};

	static void CCSetRenderStates(const bool setModelViewProjectionMatrix=false);

	static void CCSetBlend(const bool toggle);
	static bool CCGetBlendState();

	static void CCSetDepthRead(const bool toggle);
	static bool CCGetDepthReadState();
	static void CCSetDepthWrite(const bool toggle);
	static bool CCGetDepthWriteState();

	static void CCSetCulling(const bool toggle);

	static void CCSetFrontCulling();
	static void CCSetBackCulling();
	static GLint CCGetCullingType();
};


extern CCRenderer *gRenderer;

extern void CCSetModelViewProjectionMatrix();

// Attempt to simulate OpenGL interface to shaders
extern void GLViewport(const GLint x, const GLint y, const GLsizei width, const GLsizei height);
extern void GLEnable(const GLenum cap);
extern void GLDisable(const GLenum cap);
extern void GLCullFace(const GLenum mode);
extern void GLBindTexture(const GLenum mode, const class CCTextureName *texture);

extern void GLDrawArrays(GLenum mode, GLint first, GLsizei count);
extern void GLDrawElements(GLenum mode, GLsizei count, GLenum type, const void *indices);

extern void GLVertexPointer(GLint size, GLenum type, GLsizei stride, const GLvoid *pointer, const GLsizei count);
extern void GLTexCoordPointer(GLint size, GLenum type, GLsizei stride, const GLvoid *pointer);
extern void GLColor4f(GLfloat r, GLfloat g, GLfloat b, GLfloat a);

extern void CCSetVertexAttribute(const uint attribute,
                               GLint size, GLenum type, GLsizei stride,
                               const GLvoid *pointer, const bool normalized, const GLsizei count);
extern void CCSetUniformVector3(const uint uniform,
                                const float x, const float y, const float z);
extern void CCSetUniformVector4(const uint uniform,
                                const float x, const float y, const float z, const float w);

extern void GLVertexAttribPointer(uint index, int size, GLenum type, bool normalized, int stride, const void *pointer, const GLsizei count);
extern void GLUniform3fv(int location, int count, const GLfloat *value);
extern void GLUniform4fv(int location, int count, const GLfloat *value);
extern void GLUniformMatrix4fv(int location, int count, bool transpose, const GLfloat value[4][4]);

#endif // __CCRENDERER_H__
