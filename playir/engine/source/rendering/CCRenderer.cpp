/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCRenderer.cpp
 *-----------------------------------------------------------
 */

#include "CCDefines.h"


// OpenGL 1.1
#ifdef IOS
#include <OpenGLES/ES1/gl.h>
#endif


CCShader::CCShader(const char *name)
{
    this->name = name;
}


void CCShader::use()
{
#if defined PROFILEON
    CCProfiler profile( "CCShader::use()" );
#endif

#ifndef DXRENDERER

#ifdef QT
    program->bind();
#else
	glUseProgram( program );
#endif

    DEBUG_OPENGL();

    CCRefreshRenderAttributes();

#endif
}


void CCShader::enableAttributeArray(const uint index)
{
#ifndef DXRENDERER

#ifdef QT
    program->enableAttributeArray( index );
#else
    glEnableVertexAttribArray( index );
#endif

#endif
}


void CCShader::disableAttributeArray(const uint index)
{
#ifndef DXRENDERER

#ifdef QT
    program->disableAttributeArray( index );
#else
    glDisableVertexAttribArray( index );
#endif

#endif
}



CCRenderer *gRenderer = NULL;
CCRenderer::RenderState CCRenderer::ActiveRenderState;
CCRenderer::RenderState CCRenderer::PendingRenderState;


CCRenderer::CCRenderer()
{
	gRenderer = this;
}


CCRenderer::~CCRenderer()
{
	gRenderer = NULL;
}


bool CCRenderer::setup()
{
    usingOpenGL2 = true;
	renderFlags = render_all;
    if( !createContext() || !loadShaders() )
    {
        return false;
    }
    DEBUG_OPENGL();

    // All current iPhoneOS devices support BGRA via an extension.
    BGRASupport = CCTextureBase::ExtensionSupported( "GL_IMG_texture_format_BGRA8888" );

    frameBufferManager.setup();
    DEBUG_OPENGL();

    // Screen dimensions
    setupScreenSizeParams();

    return true;
}


void CCRenderer::setupScreenSizeParams()
{
    refreshScreenSize();
    inverseScreenSize.width = 1.0f / screenSize.width;
    inverseScreenSize.height = 1.0f / screenSize.height;
    aspectRatio = screenSize.width / screenSize.height;
}


CCShader* CCRenderer::loadShader(const char *name)
{
    CCShader *shader = new CCShader( name );

    if( loadShader( shader ) )
    {
        currentShader = shader;
        // Get uniform locations
        shader->uniforms[UNIFORM_PROJECTIONMATRIX] = getShaderUniformLocation( "u_projectionMatrix" );
        shader->uniforms[UNIFORM_VIEWMATRIX] = getShaderUniformLocation( "u_viewMatrix" );
        shader->uniforms[UNIFORM_MODELMATRIX] = getShaderUniformLocation( "u_modelMatrix" );
        shader->uniforms[UNIFORM_MODELCOLOUR] = getShaderUniformLocation( "u_modelColour" );

        shader->uniforms[UNIFORM_MODELNORMALMATRIX] = getShaderUniformLocation( "u_modelNormalMatrix" );
        shader->uniforms[UNIFORM_LIGHTPOSITION] = getShaderUniformLocation( "u_lightPosition" );
        shader->uniforms[UNIFORM_LIGHTDIFFUSE] = getShaderUniformLocation( "u_lightDiffuse" );

        shader->uniforms[UNIFORM_CAMERAPOSITION] = getShaderUniformLocation( "u_cameraPosition" );

        shader->uniforms[TEXTURE_DIFFUSE] = getShaderUniformLocation( "s_diffuseTexture" );
        shader->uniforms[TEXTURE_ENV] = getShaderUniformLocation( "s_envTexture" );

        shaders.add( shader );
        return shader;
    }
    delete shader;
    CCASSERT( false );
    return NULL;
}


bool CCRenderer::loadShaders()
{
    while( shaders.length > 0 )
    {
        CCShader *shader = shaders.pop();
        delete shader;
    }

    if( usingOpenGL2 )
    {
        loadShader( "basic" );
        loadShader( "basic_vc" );
        loadShader( "alphacolour" );
        loadShader( "phong" );
        loadShader( "phongenv" );
    }
    return true;
}


void CCRenderer::bind()
{
    // Reset our render states
    CCSetDepthWrite( true );
	CCSetRenderStates();
}


void CCRenderer::clear(const bool colour)
{
    const float frameBufferWidth = frameBufferManager.getWidth( -1 );
    const float frameBufferHeight = frameBufferManager.getHeight( -1 );
    GLViewport( 0, 0, (int)frameBufferWidth, (int)frameBufferHeight );
    GLScissor( 0, 0, (int)frameBufferWidth, (int)frameBufferHeight );

    bool depthWriteEnabled = PendingRenderState.depthWriteEnabled;
    if( !depthWriteEnabled )
    {
        CCSetDepthWrite( true );
        CCSetRenderStates();
    }

    GLClear( colour );

    if( !depthWriteEnabled )
    {
        CCSetDepthWrite( false );
        CCSetRenderStates();
    }
}


void CCRenderer::GLClear(const bool colour)
{
#ifndef DXRENDERER
    if( colour )
    {
        glClear( GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT );
    }
    else
    {
        glClear( GL_DEPTH_BUFFER_BIT );
    }
#endif
}


void CCRenderer::setupOpenGL()
{
    if( usingOpenGL2 )
    {
        // Use shader program
        currentShader = shaders.list[0];
        currentShader->use();

        currentShader->enableAttributeArray( ATTRIB_VERTEX );
        currentShader->enableAttributeArray( ATTRIB_TEXCOORD );
        DEBUG_OPENGL();
    }
    else
    {
#ifdef IOS
        // GL_TEXTURE_2D is not a valid argument to glEnable in OpenGL ES 2.0
        glEnable( GL_TEXTURE_2D );
        glEnableClientState( GL_VERTEX_ARRAY );
        glEnableClientState( GL_TEXTURE_COORD_ARRAY );
        glDisableClientState( GL_COLOR_ARRAY );
        DEBUG_OPENGL();

        CCSetColour( CCColour() );
#endif
    }

#ifndef DXRENDERER
    glClearColor( 0.0f, 0.0f, 0.0f, 1.0f );
    DEBUG_OPENGL();
#endif

    CCSetDepthRead( true );
    CCSetDepthWrite( true );
#ifndef DXRENDERER
    glDepthFunc( GL_LEQUAL );
    DEBUG_OPENGL();

    glBlendFunc( GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA );

    glEnable( GL_SCISSOR_TEST );
    DEBUG_OPENGL();
#endif
    GLEnable( GL_BLEND );
    DEBUG_OPENGL();

#ifndef DXRENDERER
#ifndef Q_OS_SYMBIAN
    glClearDepthf( 1.0f );
    DEBUG_OPENGL();
#endif

    glLineWidth( LINE_WIDTH );
    DEBUG_OPENGL();
#endif

    // Enable back face culling
    CCSetCulling( true );
    CCSetBackCulling();
}


bool CCRenderer::setShader(const char *name, const bool useVertexColours, const bool useVertexNormals)
{
#if defined PROFILEON
    CCProfiler profile( "CCRenderer::setShader()" );
#endif

#ifndef DXRENDERER
    if( usingOpenGL2 == false )
    {
        return false;
    }

    // Hash map optimzation?
    if( CCText::Equals( currentShader->name, name ) == false )
    {
        for( int i=0; i<shaders.length; ++i )
        {
            CCShader *shader = shaders.list[i];
            if( CCText::Equals( shader->name, name ) )
            {
                currentShader = shader;
                currentShader->use();

                static bool usingVertexColours = false, usingVertexNormals = false;
                if( useVertexColours )
                {
                    if( usingVertexColours == false )
                    {
                        currentShader->enableAttributeArray( ATTRIB_COLOUR );
                        usingVertexColours = true;
                    }
                }
                else if( usingVertexColours )
                {
                    currentShader->disableAttributeArray( ATTRIB_COLOUR );
                    usingVertexColours = false;
                }

                if( useVertexNormals )
                {
                    if( usingVertexNormals == false )
                    {
                        currentShader->enableAttributeArray( ATTRIB_NORMAL );
                        usingVertexNormals = true;
                    }
                }
                else if( usingVertexNormals )
                {
                    currentShader->disableAttributeArray( ATTRIB_NORMAL );
                    usingVertexNormals = false;
                }

                if( currentShader->uniforms[UNIFORM_CAMERAPOSITION] != -1 )
                {
                    const CCVector3 &position = CCCameraBase::CurrentCamera->getRotatedPosition();
                    CCSetUniformVector3( UNIFORM_CAMERAPOSITION, position.x, position.y, position.z );
                }

//                    if( currentShader->uniforms[TEXTURE_DIFFUSE] != -1 )
//                    {
//                        glUniform1i( currentShader->uniforms[TEXTURE_DIFFUSE], 0 );
//                    }

#ifndef QT
                if( currentShader->uniforms[TEXTURE_ENV] != -1 )
                {
                    glUniform1i( currentShader->uniforms[TEXTURE_ENV], 1 );
                }
#endif
                return true;
            }
        }

        CCASSERT( false );
        return false;
    }
#endif

    return false;
}


void CCRenderer::CCSetRenderStates(const bool setModelViewProjectionMatrix)
{
    if( ActiveRenderState.blendEnabled != PendingRenderState.blendEnabled )
    {
        ActiveRenderState.blendEnabled = PendingRenderState.blendEnabled;
        if( ActiveRenderState.blendEnabled )
        {
            GLEnable( GL_BLEND );
        }
        else
        {
            GLDisable( GL_BLEND );
        }
    }

    if( ActiveRenderState.depthReadEnabled != PendingRenderState.depthReadEnabled )
    {
        ActiveRenderState.depthReadEnabled = PendingRenderState.depthReadEnabled;
        if( ActiveRenderState.depthReadEnabled )
        {
            GLEnable( GL_DEPTH_TEST );
        }
        else
        {
            GLDisable( GL_DEPTH_TEST );
        }
    }

    if( ActiveRenderState.depthWriteEnabled != PendingRenderState.depthWriteEnabled )
    {
        ActiveRenderState.depthWriteEnabled = PendingRenderState.depthWriteEnabled;
#ifdef DXRENDERER
		if( ActiveRenderState.depthWriteEnabled )
        {
            GLEnable( CC_DEPTH_WRITE );
        }
        else
        {
            GLDisable( CC_DEPTH_WRITE );
        }
#else
        glDepthMask( ActiveRenderState.depthWriteEnabled ? GL_TRUE : GL_FALSE );
#endif
    }

    if( ActiveRenderState.cullingEnabled != PendingRenderState.cullingEnabled )
    {
        ActiveRenderState.cullingEnabled = PendingRenderState.cullingEnabled;
        if( ActiveRenderState.cullingEnabled )
        {
            GLEnable( GL_CULL_FACE );
        }
        else
        {
            GLDisable( GL_CULL_FACE );
        }
    }

    if( ActiveRenderState.cullingType != PendingRenderState.cullingType )
    {
        ActiveRenderState.cullingType = PendingRenderState.cullingType;
        if( ActiveRenderState.cullingType == GL_FRONT )
        {
            GLCullFace( GL_FRONT );
        }
        else if( ActiveRenderState.cullingType == GL_BACK )
        {
            GLCullFace( GL_BACK );
        }
    }

    if( setModelViewProjectionMatrix )
    {
        //CCASSERT( gRenderer->openGL2() );
        //const GLint *uniforms = gRenderer->getShader()->uniforms;
        //const CCMatrix &modelMatrix = CCCameraBase::currentCamera->pushedMatrix[CCCameraBase::currentCamera->currentPush];
        //GLUniformMatrix4fv( uniforms[UNIFORM_MODELMATRIX], 1, GL_FALSE, modelMatrix.m );
		CCSetModelViewProjectionMatrix();
    }
}


void CCRenderer::CCSetBlend(const bool toggle)
{
    if( PendingRenderState.blendEnabled != toggle )
    {
        PendingRenderState.blendEnabled = toggle;
    }
}


bool CCRenderer::CCGetBlendState()
{
    return PendingRenderState.blendEnabled;
}


void CCRenderer::CCSetDepthRead(const bool toggle)
{
    if( PendingRenderState.depthReadEnabled != toggle )
    {
        PendingRenderState.depthReadEnabled = toggle;
    }
}


bool CCRenderer::CCGetDepthReadState()
{
    return PendingRenderState.depthReadEnabled;
}


void CCRenderer::CCSetDepthWrite(const bool toggle)
{
	if( PendingRenderState.depthWriteEnabled != toggle )
	{
		PendingRenderState.depthWriteEnabled = toggle;
	}
}


bool CCRenderer::CCGetDepthWriteState()
{
	return PendingRenderState.depthWriteEnabled;
}


void CCRenderer::CCSetCulling(const bool toggle)
{
    if( PendingRenderState.cullingEnabled != toggle )
    {
        PendingRenderState.cullingEnabled = toggle;
    }
}


GLint CCRenderer::CCGetCullingType()
{
	return PendingRenderState.cullingType;
}


void CCRenderer::CCSetFrontCulling()
{
    if( PendingRenderState.cullingType != GL_FRONT )
    {
        PendingRenderState.cullingType = GL_FRONT;
    }
}


void CCRenderer::CCSetBackCulling()
{
    if( PendingRenderState.cullingType != GL_BACK )
    {
        PendingRenderState.cullingType = GL_BACK;
    }
}



#ifndef DXRENDERER
void CCSetModelViewProjectionMatrix()
{
	const CCMatrix &viewMatrix = CCCameraBase::CurrentCamera->getViewMatrix();
    const CCMatrix &modelMatrix = CCCameraBase::CurrentCamera->pushedMatrix[CCCameraBase::CurrentCamera->currentPush];
    if( gRenderer->openGL2() )
    {
        const CCMatrix &projectionMatrix = CCCameraBase::CurrentCamera->getProjectionMatrix();

        const GLint *uniforms = gRenderer->getShader()->uniforms;
        GLUniformMatrix4fv( uniforms[UNIFORM_PROJECTIONMATRIX], 1, GL_FALSE, projectionMatrix.m );
        GLUniformMatrix4fv( uniforms[UNIFORM_VIEWMATRIX], 1, GL_FALSE, viewMatrix.m );
        GLUniformMatrix4fv( uniforms[UNIFORM_MODELMATRIX], 1, GL_FALSE, modelMatrix.m );

        if( uniforms[UNIFORM_MODELNORMALMATRIX] != -1 )
        {
            static CCMatrix modelViewMatrix;
            modelViewMatrix = viewMatrix;
            CCMatrixMultiply( modelViewMatrix, modelMatrix, modelViewMatrix );

            static CCMatrix inverseModelViewMatrix;
            static CCMatrix modelNormalMatrix;
            CCMatrixInverse( inverseModelViewMatrix, modelViewMatrix );
            CCMatrixTranspose( modelNormalMatrix, inverseModelViewMatrix );
            GLUniformMatrix4fv( uniforms[UNIFORM_MODELNORMALMATRIX], 1, GL_FALSE, modelNormalMatrix.m );
        }
    }
    else
    {
#ifdef IOS
        static CCMatrix modelViewMatrix;
		modelViewMatrix = viewMatrix;
		CCMatrixMultiply( modelViewMatrix, modelMatrix, modelViewMatrix );
        glLoadMatrixf( modelViewMatrix.data() );
#endif
    }
}
#endif



// Attempt to simulate OpenGL 1.1 interface to shaders
#ifndef DXRENDERER
void GLViewport(const GLint x, const GLint y, const GLsizei width, const GLsizei height)
{
	glViewport( x, y, width, height );
}


void GLScissor(const GLint x, const GLint y, const GLsizei width, const GLsizei height)
{
	glScissor( x, y, width, height );
}


void GLEnable(const GLenum cap)
{
	glEnable( cap );
}


void GLDisable(const GLenum cap)
{
	glDisable( cap );
}


void GLCullFace(const GLenum mode)
{
	glCullFace( mode );
}


void GLBindTexture(const GLenum mode, const CCTextureName *texture)
{
	glBindTexture( mode, texture->name() );
}


void GLDrawArrays(GLenum mode, GLint first, GLsizei count)
{
	glDrawArrays( mode, first, count );
}


void GLDrawElements(GLenum mode, GLsizei count, GLenum type, const void *indices)
{
	glDrawElements( mode, count, type, indices );
}
#endif


void GLVertexPointer(GLint size, GLenum type, GLsizei stride, const GLvoid *pointer, const GLsizei count)
{
    if( gRenderer->openGL2() )
    {
        CCSetVertexAttribute( ATTRIB_VERTEX, size, type, stride, pointer, false, count );
    }
    else
    {
#ifdef IOS
        glVertexPointer( size, GL_FLOAT, stride, pointer ) ;
#endif
    }
}


void GLTexCoordPointer(GLint size, GLenum type, GLsizei stride, const GLvoid *pointer)
{
    if( gRenderer->openGL2() )
    {
        CCSetVertexAttribute( ATTRIB_TEXCOORD, size, type, stride, pointer, false, 0 );
    }
    else
    {
#ifdef IOS
		glTexCoordPointer( size, GL_FLOAT, stride, pointer );
#endif
    }
}


void GLColor4f(GLfloat r, GLfloat g, GLfloat b, GLfloat a)
{
    if( gRenderer->openGL2() )
    {
        CCSetUniformVector4( UNIFORM_MODELCOLOUR, r, g, b, a );
    }
    else
    {
#ifdef IOS
        glColor4f( r, g, b, a );
#endif
    }

//    What if we wanted to modify the vertex colours?
//    const int verts = 1024;
//    static GLfloat colours[verts*4];
//    for( int i=0; i<verts; ++i )
//    {
//        colours[i*4+0] = r;
//        colours[i*4+1] = g;
//        colours[i*4+2] = b;
//        colours[i*4+3] = a;
//    }
//    GLVertexAttribPointer( ATTRIB_COLOUR, 4, GL_FLOAT, true, 0, colours );
}

void CCSetVertexAttribute(const uint attribute,
                          GLint size, GLenum type, GLsizei stride,
                          const GLvoid *pointer, const bool normalized, const GLsizei count)
{
    GLVertexAttribPointer( attribute, size, type, normalized, stride, pointer, count );
}

void CCSetUniformVector3(const uint uniform,
                         const float x, const float y, const float z)
{
    const GLint uniformLocation = gRenderer->getShader()->uniforms[uniform];
    if( uniformLocation != -1 )
    {
        static GLfloat floats[3];
        floats[0] = x;
        floats[1] = y;
        floats[2] = z;

        GLUniform3fv( uniformLocation, 1, floats );
    }
}


void CCSetUniformVector4(const uint uniform,
                         const float x, const float y, const float z, const float w)
{
    const GLint uniformLocation = gRenderer->getShader()->uniforms[uniform];
    if( uniformLocation != -1 )
    {
        static GLfloat floats[4];
        floats[0] = x;
        floats[1] = y;
        floats[2] = z;
        floats[3] = w;

        GLUniform4fv( uniformLocation, 1, floats );
    }
}


#ifndef DXRENDERER

void GLVertexAttribPointer(uint index, int size, GLenum type, bool normalized, int stride, const void *pointer, const GLsizei count)
{
#ifndef QT
    glVertexAttribPointer( index, size, type, normalized, stride, pointer );
#else
    gRenderer->getShader()->program->setAttributeArray( index, (const GLfloat*)pointer, size, stride );
#endif
}


void GLUniform3fv(int location, int count, const GLfloat *value)
{
#ifndef QT
    glUniform3fv( location, count, value );
#else
    gRenderer->getShader()->program->setUniformValue( location, value[0], value[1], value[2] );
#endif
}


void GLUniform4fv(int location, int count, const GLfloat *value)
{
#ifndef QT
    glUniform4fv( location, count, value );
#else
    gRenderer->getShader()->program->setUniformValue( location, value[0], value[1], value[2], value[3] );
#endif
}


void GLUniformMatrix4fv(int location, int count, bool transpose, const GLfloat value[4][4])
{
#ifndef QT
    glUniformMatrix4fv( location, count, transpose, &value[0][0] );
#else
    gRenderer->getShader()->program->setUniformValue( location, value );
#endif
}


#endif
