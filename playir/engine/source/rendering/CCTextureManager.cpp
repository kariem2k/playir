/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCTextureManager.cpp
 *-----------------------------------------------------------
 */

#include "CCDefines.h"
#include "CCTexture2D.h"
#include "CCTextureFontPageFile.h"
#include "CCTextureSprites.h"


CCTextureHandle::~CCTextureHandle()
{
    onLoad.deleteObjectsAndList();
    delete texture;
}



CCTextureManager::CCTextureManager()
{
    textureSprites = new CCTextureSprites();

    invalidateAllTextureHandles();
}


CCTextureManager::~CCTextureManager()
{
	textureHandles.deleteObjectsAndList();

    fontPages.deleteObjectsAndList();

    if( textureSprites != NULL )
    {
        delete textureSprites;
    }
}


void CCTextureManager::invalidateAllTextureHandles()
{
    currentGLTexture = NULL;
    totalTexturesLoaded = 0;
    totalUsedTextureSpace = 0;

    for( int i=0; i<textureHandles.length; ++i )
    {
        CCTextureHandle *handle = textureHandles.list[i];
        if( handle->texture != NULL )
        {
            totalUsedTextureSpace -= handle->texture->getBytes();
            delete handle->texture;
            handle->texture = NULL;
        }
    }

    // Load in a 1x1 white texture to use for untextured draws
    assignTextureIndex( "transparent.png", Resource_Packaged, false, true, true );
    assignTextureIndex( "white.png", Resource_Packaged, false, true, true );

    setTextureIndex( 0 );

    CCSetTexCoords( NULL );
	CCDefaultTexCoords();
}


void CCTextureManager::unloadAllTextures()
{
    for( int i=0; i<textureHandles.length; ++i )
    {
        CCTextureHandle *handle = textureHandles.list[i];
        if( handle->texture != NULL )
        {
            totalTexturesLoaded--;
            totalUsedTextureSpace -= handle->texture->getBytes();
            delete handle->texture;
            handle->texture = NULL;
        }
    }
}


void CCTextureManager::loadFont(const char *font)
{
    CCTextureFontPageFile *fontPage = NULL;
    for( int i=0; i<fontPages.length; ++i )
    {
        if( CCText::Equals( font, fontPages.list[i]->getName() ) )
        {
            fontPage = (CCTextureFontPageFile*)fontPages.list[i];
            break;
        }
    }

    if( fontPage == NULL )
    {
        fontPage = new CCTextureFontPageFile( font );
        if( fontPage->load() )
        {
            fontPages.add( fontPage );
        }
        else
        {
            delete fontPage;
        }
    }
}


uint CCTextureManager::assignTextureIndex(const char *filePath, const CCResourceType resourceType,
                                          const bool mipmap, const bool load, const bool alwaysResident)
{
    //DEBUGLOG( "CCTextureManager::assignTextureIndex %s\n", filePath );

    CCTextureHandle *handle = NULL;
    for( int i=0; i<textureHandles.length; ++i )
    {
        CCTextureHandle *textureHandleItr = textureHandles.list[i];
        if( strcmp( textureHandleItr->filePath.buffer, filePath ) == 0 )
        {
            handle = textureHandleItr;
            if( load && handle->texture == NULL )
            {
                break;
            }
            else
			{
				return i;
			}
		}
    }

    if( handle == NULL )
    {
        handle = new CCTextureHandle( filePath, resourceType );
        textureHandles.add( handle );
    }

    if( alwaysResident )
    {
        handle->alwaysResident = true;
    }

    if( mipmap )
    {
        handle->mipmap = true;
    }

    if( load )
    {
        loadTextureAsync( *handle );
    }

    uint index = (uint)( textureHandles.length-1 );
    return (uint)index;
}



CCTextureHandle* CCTextureManager::getTextureHandle(const char *filePath, const CCResourceType resourceType, const bool mipmap)
{
    for( int i=0; i<textureHandles.length; ++i )
    {
        CCTextureHandle *textureHandle = textureHandles.list[i];
        if( strcmp( textureHandle->filePath.buffer, filePath ) == 0 )
        {
            if( textureHandle->resourceType == resourceType )
            {
                if( textureHandle->mipmap == mipmap )
                {
                    return textureHandle;
                }
            }
		}
    }

    return NULL;
}


CCTextureHandle* CCTextureManager::getTextureHandle(const int handleIndex)
{
    if( handleIndex >= 0 )
    {
        return textureHandles.list[handleIndex];
    }
    return NULL;
}


void CCTextureManager::deleteTextureHandle(const char *filePath)
{
    CCTextureHandle *handle = NULL;
    for( int i=0; i<textureHandles.length; ++i )
    {
        CCTextureHandle *textureHandleItr = textureHandles.list[i];
        if( strcmp( textureHandleItr->filePath.buffer, filePath ) == 0 )
        {
            handle = textureHandleItr;
            textureHandles.remove( handle );
            delete handle;
            break;
		}
    }
}


void CCTextureManager::loadTextureAsync(CCTextureHandle &textureHandle, CCLambdaSafeCallback *callback)
{
    if( callback != NULL )
    {
        textureHandle.onLoad.add( callback );
    }

    if( textureHandle.loading )
    {
        return;
    }
    textureHandle.loading = true;

#if defined PROFILEON
    CCProfiler profile( "CCTextureManager::loadTexture()" );
#endif

#ifdef DEBUGON
    CCText debug = "CCTextureManager::loadTexture ";
    debug += textureHandle.filePath.buffer;
    debug += " ";
    debug += gEngine->time.lifetime;
    debug += "\n";
    DEBUGLOG( "%s", debug.buffer );
#endif

    CCLAMBDA_5( OnLoadedFunction, CCTextureManager, that, CCTextureBase*, texture, CCText, filePath, CCResourceType, resourceType, bool, mipmap, {
        const bool loaded = (bool)runParameters;

        CCTextureHandle *textureHandle = that->getTextureHandle( filePath.buffer, resourceType, mipmap );
        if( textureHandle == NULL )
        {
            delete texture;
            texture = NULL;
        }
        else
        {
            textureHandle->loading = false;
            if( !loaded )
            {
                that->loadTextureAsyncFailed( *textureHandle, &texture );
            }
            else
            {
                that->loadedTexture( *textureHandle, texture );
            }

            CCLAMBDA_SIGNAL pendingCallbacks;
            for( int i=0; i<textureHandle->onLoad.length; ++i )
            {
                textureHandle->onLoad.list[i]->runParameters = (void*)texture;
                pendingCallbacks.add( textureHandle->onLoad.list[i] );
            }
            textureHandle->onLoad.length = 0;
            CCLAMBDA_EMIT_ONCE( pendingCallbacks );

            gEngine->textureLoaded( *textureHandle );
        }
    });

	CCTextureBase *texture = new CCTexture2D();
    texture->loadAndCreateAsync( textureHandle.filePath.buffer, textureHandle.resourceType, textureHandle.mipmap,
                                 new OnLoadedFunction( this, texture, textureHandle.filePath, textureHandle.resourceType, textureHandle.mipmap ) );
}


void CCTextureManager::loadTextureAsyncFailed(CCTextureHandle &textureHandle, CCTextureBase **texture)
{
//#ifdef DEBUGON
//    CCText debug = "CCTextureManager::loadTexture::loadAndCreate::Failed ";
//    debug += filePath.buffer;
//    debug += "\n";
//    DEBUGLOG( "%s", debug.buffer );
//#endif
    delete *texture;
    *texture = NULL;
    textureHandle.loadable = false;
}


void CCTextureManager::loadedTexture(CCTextureHandle &textureHandle, CCTextureBase *texture)
{
#ifdef DEBUGON
    CCText debug;
    debug += "CCTextureManager::loadedTexture ";
    debug += textureHandle.filePath.buffer;
    debug += " ";
    debug += gEngine->time.lifetime;
    debug += "\n";
    DEBUGLOG( "%s", debug.buffer );
#endif

    totalTexturesLoaded++;
    totalUsedTextureSpace += texture->getBytes();

#ifdef DEBUGON
	debug = "CCTextureManager::loadedTexture()::loaded ";
	debug += (int)totalTexturesLoaded;
	debug += " ";
	debug += (int)totalUsedTextureSpace;
	debug += "\n";
	DEBUGLOG( "%s", debug.buffer );
#endif

    // Estimated texture usage, need to cater for bit depth and mip maps for more accuracy
#ifdef WP8
    const uint maxSpace = 32 * 1024 * 1024;
#else
    const uint maxSpace = 64 * 1024 * 1024;
#endif
    if( totalUsedTextureSpace > maxSpace )
    {
        trim();
    }

    textureHandle.texture = texture;
}


void CCTextureManager::trim()
{
    DEBUGLOG( "CCTextureManager::trimming %i %i \n", totalTexturesLoaded, totalUsedTextureSpace );

#ifdef WP8
    const uint targetSpace = 24 * 1024 * 1024;
#else
    const uint targetSpace = 42 * 1024 * 1024;
#endif
    while( totalUsedTextureSpace > targetSpace )
    {
        float oldestTime = -1.0f;
        CCTextureHandle *oldestHandle = NULL;
        for( int i=1; i<textureHandles.length; ++i )
        {
            CCTextureHandle *handle = textureHandles.list[i];
            //DEBUGLOG( "handle: %s \n", handle->filePath.buffer );
            if( handle != NULL )
            {
                if( handle->alwaysResident == false )
                {
                    if( handle->texture != NULL )
                    {
                        const float distance = gEngine->time.lifetime - handle->lastTimeUsed;
                        if( distance > oldestTime )
                        {
                            oldestTime = distance;
                            oldestHandle = handle;
                        }
                    }
                }
            }
        }

        if( oldestHandle == NULL )
        {
#ifdef DEBUGON
            // Try again for debugging
            for( int i=1; i<textureHandles.length; ++i )
            {
                CCTextureHandle *handle = textureHandles.list[i];
                //DEBUGLOG( "handle: %s \n", handle->filePath.buffer );
                if( handle != NULL )
                {
                    if( handle->alwaysResident == false )
                    {
                        if( handle->texture != NULL )
                        {
                            const float distance = gEngine->time.lifetime - handle->lastTimeUsed;
                            if( distance > oldestTime )
                            {
                                oldestTime = distance;
                                oldestHandle = handle;
                            }
                        }
                    }
                }
            }
#endif
            CCASSERT( oldestHandle != NULL );
        }

        if( oldestHandle != NULL )
        {
            totalTexturesLoaded--;
            totalUsedTextureSpace -= oldestHandle->texture->getBytes();
            delete oldestHandle->texture;
            oldestHandle->texture = NULL;
            DEBUGLOG( "CCTextureManager::trimmed %i %i \n", totalTexturesLoaded, totalUsedTextureSpace );
        }
    }
}


void CCTextureManager::bindTexture(const CCTextureName *texture)
{
	if( currentGLTexture != texture )
	{
        if( texture != NULL )
        {
            gRenderer->GLBindTexture( GL_TEXTURE_2D, texture );
        }
		currentGLTexture = texture;
	}
}


bool CCTextureManager::setTextureIndex(const int handleIndex)
{
    CCTextureHandle *handle = textureHandles.list[handleIndex];
    if( handle != NULL && handle->loadable )
    {
        if( handle->texture == NULL )
        {
            if( handle->loading == false )
            {
                loadTextureAsync( *handle );
            }
            if( handleIndex != 0 )
            {
                setTextureIndex( 0 );
            }
            return false;
        }

        handle->lastTimeUsed = gEngine->time.lifetime;
		bindTexture( handle->texture );
        return true;
	}
	else
	{
		if( handleIndex != 0 )
		{
            setTextureIndex( 0 );
		}
		return false;
	}
}


void CCTextureManager::getTextureAsync(const int handleIndex, CCLambdaSafeCallback *callback)
{
//    CCLAMBDA_1( Loaded, )

    CCTextureHandle *handle = textureHandles.list[handleIndex];
    if( handle != NULL )
    {
        if( handle->texture == NULL )
        {
            // Load texture (will fill the runParameters with texture as the result)
            loadTextureAsync( *handle, callback );
            return;
        }
        else
        {
            // Texture already loaded
            callback->runParameters = (void*)handle->texture;
            callback->safeRun();
            delete callback;
        }
    }
    else
    {
        // Nothing to load
        if( callback != NULL )
        {
            callback->safeRun();
            delete callback;
        }
    }
}
