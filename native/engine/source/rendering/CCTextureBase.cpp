/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCTextureBase.cpp
 *-----------------------------------------------------------
 */

#include "CCDefines.h"
#include "CCTextureBase.h"

#ifdef WP8
#include <ppl.h>
#include <ppltasks.h>
#endif


CCTextureBase::CCTextureBase()
{
	allocatedBytes = 0;
}


CCTextureBase::~CCTextureBase()
{
	if( glName != 0 )
	{
#ifndef DXRENDERER
		glDeleteTextures( 1, &glName );
#endif
	}
}


void CCTextureBase::loadAndCreateAsync(const char *path, const CCResourceType resourceType, const bool generateMipMap, CCLambdaSafeCallback *callback)
{
    CCLAMBDA_4( CreateFunction, CCTextureBase, that, bool, loaded, bool, generateMipMap, CCLambdaSafeCallback*, callback, {

        if( loaded )
        {
            that->createGLTexture( generateMipMap );
        }

		if( callback != NULL )
		{
            callback->runParameters = (void*)loaded;
			callback->safeRun();
			delete callback;
		}

    });

    CCLAMBDA_FINISH_6( LoadFunction, CCTextureBase, that, CCText, path, CCResourceType, resourceType, bool, generateMipMap, CCLambdaSafeCallback*, callback, bool, loaded,

    // Run on a random thread
    {
        loaded = that->load( path.buffer, resourceType );
    },

    // Finish on the jobs thread
    {
    	if( gEngine != NULL )
    	{
            gEngine->jobsToEngineThread( new CreateFunction( that, loaded, generateMipMap, callback ) );
    	}
    });

    gEngine->engineToJobsThread( new LoadFunction( this, path, resourceType, generateMipMap, callback, false ) );
}


bool CCTextureBase::ExtensionSupported(const char *extension)
{
#ifdef DXRENDERER
#else
    const GLubyte *extensions = NULL;
    const GLubyte *start;
    GLubyte *where, *terminator;

    // Extension names should not have spaces
    where = (GLubyte*)strchr( extension, ' ' );
    if( where || *extension == '\0' ) return 0;

    // It takes a bit of care to be fool-proof about parsing the OpenGL extensions string. Don't be fooled by sub-strings, etc.
    extensions = glGetString( GL_EXTENSIONS );
    start = extensions;
    for(;;)
    {
        where = (GLubyte*)strstr( (const char*)start, extension );
        if( !where )
        {
            break;
        }
        terminator = where + strlen( extension );
        if( where == start || *( where - 1 ) == ' ' )
        {
            if( *terminator == ' ' || *terminator == '\0' )
            {
                return true;
            }
        }
        start = terminator;
    }
#endif
    return false;
}
