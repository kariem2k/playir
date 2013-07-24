/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCPrimitiveBase.cpp
 *-----------------------------------------------------------
 */

#include "CCDefines.h"
#include "CCPrimitives.h"
#include "CCFileManager.h"


CCPrimitiveBase::CCPrimitiveBase(const char *primitiveID)
{
    if( primitiveID != NULL )
    {
        this->primitiveID = primitiveID;
    }

	vertices = NULL;
	normals = NULL;
	textureInfo = NULL;
    frameBufferID = -1;
}


void CCPrimitiveBase::destruct()
{
	if( vertices != NULL )
	{
		gRenderer->derefVertexPointer( ATTRIB_VERTEX, vertices );
		free( vertices );
	}

	if( normals != NULL )
	{
        free( normals );
	}

    removeTexture();
}


void CCPrimitiveBase::setTexture(const char *file, CCResourceType resourceType, CCLambdaCallback *onDownloadCallback,
                                 const bool mipmap, const bool load, const bool alwaysResident)
{
    if( resourceType == Resource_Unknown )
    {
        resourceType = CCFileManager::FindFile( file );
    }

    if( resourceType != Resource_Unknown )
    {
        if( textureInfo == NULL )
        {
            textureInfo = new TextureInfo();
        }
        setTextureHandleIndex( gEngine->textureManager->assignTextureIndex( file, resourceType, mipmap, load, alwaysResident ) );

        if( onDownloadCallback != NULL )
        {
            onDownloadCallback->safeRun();
            delete onDownloadCallback;
        }
    }
    else
    {
        CCLAMBDA_6( DownloadedCallback, CCPrimitiveBase, primitive, CCText, file, CCLambdaCallback*, nextCallback, bool, mipmap, bool, load, bool, alwaysResident,
        {
            primitive->setTexture( file.buffer, Resource_Cached, nextCallback, mipmap, load, alwaysResident );
        });
        CCEngineJS::GetAsset( file, NULL, new DownloadedCallback( this, file, onDownloadCallback, mipmap, load, alwaysResident ) );
    }
}


void CCPrimitiveBase::setTextureHandleIndex(const int index)
{
    if( textureInfo == NULL )
    {
        textureInfo = new TextureInfo();
    }

    textureInfo->primaryIndex = index;

    const int textureHandleIndex = textureInfo->primaryIndex;
    CCTextureHandle *textureHandle = gEngine->textureManager->getTextureHandle( textureHandleIndex );
    if( textureHandle->texture != NULL )
    {
        adjustTextureUVs();
    }
    else
    {
        CCLAMBDA_CONNECT_THIS( textureHandle->onLoad, CCPrimitiveBase, adjustTextureUVs() );
    }
}


void CCPrimitiveBase::removeTexture()
{
	if( textureInfo != NULL )
	{
        DELETE_POINTER( textureInfo );
	}
}


void CCPrimitiveBase::render()
{
#if defined PROFILEON
    CCProfiler profile( "CCPrimitiveBase::render()" );
#endif

	bool usingTexture = false;
	if( textureInfo != NULL && textureInfo->primaryIndex > 0 )
	{
        //DEBUGLOG( "CCPrimitiveBase::render usingTexture %i", textureInfo->primaryIndex );
        
		if( gEngine->textureManager->setTextureIndex( textureInfo->primaryIndex ) )
		{
			usingTexture = true;

            if( textureInfo->secondaryIndex > 0 )
            {
                // Why would you want to use the same texture twice? you wouldn't.. bad!
                ASSERT( textureInfo->primaryIndex != textureInfo->secondaryIndex );

#ifndef DXRENDERER
#ifndef QT
                glActiveTexture( GL_TEXTURE1 );
                gEngine->textureManager->setTextureIndex( textureInfo->secondaryIndex );
                glActiveTexture( GL_TEXTURE0 );
#endif
#endif
            }
		}
	}
	else if( frameBufferID >= 0 )
    {
        gRenderer->frameBufferManager.bindFrameBufferTexture( frameBufferID );
    }
    else
	{
        //DEBUGLOG( "CCPrimitiveBase::render !usingTexture" );
		gEngine->textureManager->setTextureIndex( 1 );
	}

	renderVertices( usingTexture );
}
