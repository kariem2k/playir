/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCDeviceRenderer.cpp
 *-----------------------------------------------------------
 */

#include "CCDefines.h"
#include "CCDeviceRenderer.h"
#include "CCGLView.h"
#include "CCFileManager.h"


CCDeviceRenderer::~CCDeviceRenderer()
{
    frameBufferManager.destoryAllFrameBuffers();
}


void CCDeviceRenderer::resolve()
{
//	jclass jniClass = jniEnv->FindClass( "com/android2c/CCJNI" );
//	ASSERT_MESSAGE( jniClass != 0, "Could not find Java class." );
//
//	// Get the method ID of our method "urlRequest", which takes one parameter of type string, and returns void
//	static jmethodID mid = jniEnv->GetStaticMethodID( jniClass, "CCDeviceRendererResolve", "()V" );
//	ASSERT( mid != 0 );
//
//	// Call the function
//	jniEnv->CallStaticVoidMethod( jniClass, mid );
}


static bool compileShader(GLuint *shader, GLenum type, const char *path)
{
	GLint status;

	CCText fileData;
	const int fileSize = CCFileManager::GetFile( path, fileData, Resource_Packaged );

	CCText shaderCode;
	if( type == GL_VERTEX_SHADER )
	{
		shaderCode = "#define VERTEX_SHADER\r\n";
	}
	else if( type == GL_FRAGMENT_SHADER )
	{
		shaderCode = "#define PIXEL_SHADER\r\n";
	}
	shaderCode += fileData.buffer;

	*shader = glCreateShader( type );
    DEBUG_OPENGL();

	const char* constSourceCode = shaderCode.buffer;

	glShaderSource( *shader, 1, &constSourceCode, NULL );
	DEBUG_OPENGL();

	glCompileShader( *shader );
	DEBUG_OPENGL();

#ifdef DEBUGON
	GLint logLength = 0;
	glGetShaderiv( *shader, GL_INFO_LOG_LENGTH, &logLength );
	if( logLength > 0 )
	{
		char *log = (char*)malloc( logLength );
		glGetShaderInfoLog( *shader, logLength, &logLength, log );
		DEBUGLOG( "Shader compile log:\n%s", log );
		free( log );
	}
#endif

	glGetShaderiv( *shader, GL_COMPILE_STATUS, &status );
	if( status == 0 )
	{
		glDeleteShader( *shader );
		return false;
	}

	return true;
}


bool CCDeviceRenderer::linkProgram(GLuint &program)
{
    glLinkProgram( program );
    GLint linkStatus = GL_FALSE;
    glGetProgramiv( program, GL_LINK_STATUS, &linkStatus );
    if( linkStatus != GL_TRUE )
    {
        GLint bufLength = 0;
        glGetProgramiv( program, GL_INFO_LOG_LENGTH, &bufLength );
        if( bufLength )
        {
            char *buf = (char*)malloc( bufLength );
            if( buf )
            {
                glGetProgramInfoLog( program, bufLength, NULL, buf );
                DEBUGLOG( "Could not link program:\n%s\n", buf );
                free( buf );
            }
        }
        glDeleteProgram( program );
        program = 0;
        return false;
    }
    return true;
}



int CCDeviceRenderer::getShaderUniformLocation(const char *name)
{
    return glGetUniformLocation( currentShader->program, name );
}


bool CCDeviceRenderer::loadShader(CCShader *shader)
{
	GLuint vertShader, fragShader;

	CCText shaderPath = shader->name;
	shaderPath += ".fx";

    // Create shader program
	shader->program = glCreateProgram();

	if( !compileShader( &vertShader, GL_VERTEX_SHADER, shaderPath.buffer ) )
	{
		DEBUGLOG( "Failed to compile vertex shader." );
		glDeleteProgram( shader->program );
		shader->program = 0;
		return false;
	}

	if( !compileShader( &fragShader, GL_FRAGMENT_SHADER, shaderPath.buffer ) )
	{
		DEBUGLOG( "Failed to compile fragment shader." );
		glDeleteProgram( shader->program );
		shader->program = 0;
		return false;
	}

	DEBUG_OPENGL();

	// Attach shaders to program
	glAttachShader( shader->program, vertShader );
    DEBUG_OPENGL();

	glAttachShader( shader->program, fragShader );
    DEBUG_OPENGL();

    // Bind attribute locations - this needs to be done prior to linking
	glBindAttribLocation( shader->program, ATTRIB_VERTEX, "vs_position" );
	glBindAttribLocation( shader->program, ATTRIB_TEXCOORD, "vs_texCoord" );
	glBindAttribLocation( shader->program, ATTRIB_COLOUR, "vs_colour" );
	glBindAttribLocation( shader->program, ATTRIB_NORMAL, "vs_normal" );
    DEBUG_OPENGL();

	if( !linkProgram( shader->program ) )
	{
		DEBUGLOG( "Failed to link program." );
		if( vertShader )
		{
			glDeleteShader( vertShader );
			vertShader = 0;
		}

		if( fragShader )
		{
			glDeleteShader( fragShader );
			fragShader = 0;
		}

		if( shader->program )
		{
			glDeleteProgram( shader->program );
			shader->program = 0;
		}

		return false;
	}

    // Release vertex and fragment shaders
    if( vertShader )
	{
		glDeleteShader( vertShader );
	}

	if( fragShader )
	{
		glDeleteShader( fragShader );
	}

    return true;
}


bool CCDeviceRenderer::createDefaultFrameBuffer(CCFrameBufferObject &fbo)
{
    fbo.setFrameBuffer( 0 );
    fbo.width = gView->getWidth();
    fbo.height = gView->getHeight();
    return true;
}


void CCDeviceRenderer::refreshScreenSize()
{
	screenSize.width = gView->getWidth();
	screenSize.height = gView->getHeight();
}
