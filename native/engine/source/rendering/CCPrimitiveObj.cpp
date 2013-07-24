/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCPrimitiveObj.cpp
 *-----------------------------------------------------------
 */

#include "CCDefines.h"
#include "CCPrimitives.h"
#include "CCPrimitiveObj.h"
#include "CCFileManager.h"
#include "CCTextureBase.h"


// CCPrimitiveObj
CCPrimitiveObj::CCPrimitiveObj()
{
}


void CCPrimitiveObj::destruct()
{
    super::destruct();
}


void CCPrimitiveObj::LoadObj(const char *file, const CCResourceType resourceType, CCLambdaCallback *callback)
{
    CCPrimitiveObj *primitive = NULL;
    
    CCText fileData;
    int fileSize = CCFileManager::GetFile( file, fileData, resourceType );
    if( fileSize > 0 )
    {
        CCPrimitiveObj *primitive = new CCPrimitiveObj();
        bool success = primitive->loadData( fileData.buffer );
        if( success == false )
        {
            DELETE_OBJECT( primitive );
        }
    }

	callback->runParameters = primitive;
	callback->safeRun();
}


bool CCPrimitiveObj::loadData(const char *fileData)
{
    CCText textData = fileData;
    ObjMesh *objMesh = LoadOBJTextData( textData );
    if( objMesh != NULL )
    {
        if( loadObjMesh( objMesh ) )
        {
            return true;
        }
    }
    return false;
}


bool CCPrimitiveObj::loadObjMesh(ObjMesh *objMesh)
{
    if( objMesh != NULL )
    {
        for( uint i=0; i<objMesh->m_iNumberOfFaces; ++i )
        {
            ObjFace *pf = &objMesh->m_aFaces[i];
            if( pf->m_iVertexCount >= 3 )
            {
                uint faceVertexCount = pf->m_iVertexCount;
                do
                {
                    vertexCount += 3;
                    faceVertexCount--;
                } while( faceVertexCount >= 3 );
            }
        }

        modelUVs = (float*)malloc( sizeof( float ) * vertexCount * 2 );
		if( modelUVs == NULL )
		{
			return false;
			//ASSERT( false );
		}
        vertices = (float*)malloc( sizeof( float ) * vertexCount * 3 );
        normals = (float*)calloc( vertexCount * 3, sizeof( float ) );

        int uvIndex = 0;
        int vertexIndex = 0;
        for( uint i=0; i<objMesh->m_iNumberOfFaces; ++i )
        {
            ObjFace *pf = &objMesh->m_aFaces[i];
            if( pf->m_iVertexCount < 3 )
            {
                continue;
            }

            uint vertexStartIterator = 1;
            uint vertexEndIterator = 2;
            do
            {
                // Convert GL_POLYGON to GL_TRIANGLES by reusing the first vert, with the others
                // First triangle point
                {
                    uint j=0;
                    // UVs
                    if( objMesh->m_aTexCoordArray != NULL )
                    {
                		const unsigned int index = pf->m_aTexCoordIndicies[j];
                        if( index < objMesh->m_iNumberOfTexCoords )
                        {
                            ObjTexCoord &texCoord = objMesh->m_aTexCoordArray[ index ];
                            modelUVs[uvIndex+0] = texCoord.u;
                            modelUVs[uvIndex+1] = 1.0f - texCoord.v;
                        }
                    }

                    // Vertices
                    {
                		const unsigned int index = pf->m_aVertexIndices[j];
                        ObjVertex &vertex = objMesh->m_aVertexArray[index];
                        vertices[vertexIndex+0] = vertex.x;
                        vertices[vertexIndex+1] = vertex.y;
                        vertices[vertexIndex+2] = vertex.z;

                        mmX.consider( vertex.x );
                        mmY.consider( vertex.y );
                        mmZ.consider( vertex.z );
                    }

                    // Normals
                    if( objMesh->m_aNormalArray != NULL )
                    {
                        unsigned int index = pf->m_aNormalIndices[j];
                        if( index < objMesh->m_iNumberOfNormals )
                        {
                            ObjNormal &normal = objMesh->m_aNormalArray[ index ];
                            normals[vertexIndex+0] = normal.x;
                            normals[vertexIndex+1] = normal.y;
                            normals[vertexIndex+2] = normal.z;
                        }
                    }

                    uvIndex += 2;
                    vertexIndex += 3;
                }

                // Next triangle points
                for( uint j=vertexStartIterator; j<=vertexEndIterator; ++j )
                {
                    // UVs
                	if( objMesh->m_aTexCoordArray != NULL )
                    {
                		const unsigned int index = pf->m_aTexCoordIndicies[j];
                		if( index < objMesh->m_iNumberOfTexCoords )
                		{
							ObjTexCoord &texCoord = objMesh->m_aTexCoordArray[index];
							modelUVs[uvIndex+0] = texCoord.u;
							modelUVs[uvIndex+1] = 1.0f - texCoord.v;
                		}
                        else
                        {
                            //ASSERT( false );
                        }
                    }

                    // Vertices
                    {
                		const unsigned int index = pf->m_aVertexIndices[j];
                        ObjVertex &vertex = objMesh->m_aVertexArray[index];
                        vertices[vertexIndex+0] = vertex.x;
                        vertices[vertexIndex+1] = vertex.y;
                        vertices[vertexIndex+2] = vertex.z;

                        mmX.consider( vertex.x );
                        mmY.consider( vertex.y );
                        mmZ.consider( vertex.z );
                    }

                    // Normals
                    // TODO: Fix, currently buggy
//                    if( objMesh->m_aNormalArray != NULL )
//                    {
//                        unsigned int index = pf->m_aNormalIndices[j];
//                        ObjNormal &normal = objMesh->m_aNormalArray[index];
//                        normals[vertexIndex+0] = normal.x;
//                        normals[vertexIndex+1] = normal.y;
//                        normals[vertexIndex+2] = normal.z;
//                    }

                    uvIndex += 2;
                    vertexIndex += 3;
                }

                vertexStartIterator++;
                vertexEndIterator++;

            } while( vertexEndIterator < pf->m_iVertexCount );
        }

        DeleteOBJ( objMesh->m_iMeshID );

        width = mmX.size();
        height = mmY.size();
        depth = mmZ.size();
    }

	return vertexCount > 0;
}


void CCPrimitiveObj::renderVertices(const bool textured)
{
    CCRenderer::CCSetRenderStates( true );

	GLVertexPointer( 3, GL_FLOAT, 0, vertices, vertexCount );
    CCSetVertexAttribute( ATTRIB_NORMAL, 3, GL_FLOAT, 0, normals, true, vertexCount );
    CCSetTexCoords( adjustedUVs != NULL ? adjustedUVs : modelUVs );

	GLDrawArrays( GL_TRIANGLES, 0, vertexCount );
}


void CCPrimitiveObj::copy(const CCPrimitiveObj *primitive)
{
    vertexCount = primitive->vertexCount;

    modelUVs = primitive->modelUVs;
    vertices = primitive->vertices;
    normals = primitive->normals;
    width = primitive->width;
    height = primitive->height;
    depth = primitive->depth;
    mmX = primitive->mmX;
    mmY = primitive->mmY;
    mmZ = primitive->mmZ;

    cached = true;
    movedToOrigin = primitive->movedToOrigin;
    origin = primitive->origin;
}
