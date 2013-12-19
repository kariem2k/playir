/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCPrimitiveOBJ.js
 * Description : Loads and handles an obj model
 *
 * Created     : 15/10/12
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

function CCPrimitiveOBJ()
{
	this.construct();
}
ExtendPrototype( CCPrimitiveOBJ, CCPrimitive3D );


CCPrimitiveOBJ.prototype.loadData = function(fileData, callback)
{
	/* attempt to load the file */
	var objMesh = ObjMesh.LoadOBJ( fileData );
    if( objMesh )
    {
        this.fileSize = fileData.length;

        var mmX = this.mmX;
        var mmY = this.mmY;
        var mmZ = this.mmZ;

        var i, pf, j, index, texCoord, vertex;

        for( i=0; i<objMesh.m_iNumberOfFaces; ++i )
        {
            pf = objMesh.m_aFaces[i];
            if( pf.m_iVertexCount >= 3 )
            {
                var faceVertexCount = pf.m_iVertexCount;
                do
                {
                    this.vertexCount += 3;
                    faceVertexCount--;
                } while( faceVertexCount >= 3 );
            }
        }

        var modelUVs = this.modelUVs = new CCRenderer.Float32Array( this.vertexCount * 2 );
        var modelVertices = this.vertices = new CCRenderer.Float32Array( this.vertexCount * 3 );
        var modelNormals = this.normals = new CCRenderer.Float32Array( this.vertexCount * 3 );

        var uvIndex = 0;
        var vertexIndex = 0;
        for( i=0; i<objMesh.m_iNumberOfFaces; ++i )
        {
            pf = objMesh.m_aFaces[i];
            if( pf.m_iVertexCount < 3 )
            {
                continue;
            }

            var vertexStartIterator = 1;
            var vertexEndIterator = 2;
            do
            {
                // Convert GL_POLYGON to GL_TRIANGLES by reusing the first vert, with the others
                // First triangle point
                {
                    j=0;
                    // UVs
                    if( objMesh.m_aTexCoordArray )
                    {
                        index = pf.m_aTexCoordIndicies[j];
                        if( index >= 0 && index < objMesh.m_iNumberOfTexCoords )
                        {
                            texCoord = objMesh.m_aTexCoordArray[ index ];
                            modelUVs[uvIndex+0] = texCoord.u;
                            modelUVs[uvIndex+1] = 1.0 - texCoord.v;
                        }
                    }

                    // Vertices
                    {
                        index = pf.m_aVertexIndices[j];
                        vertex = objMesh.m_aVertexArray[ index ];
                        modelVertices[vertexIndex+0] = vertex.x;
                        modelVertices[vertexIndex+1] = vertex.y;
                        modelVertices[vertexIndex+2] = vertex.z;

                        mmX.consider( vertex.x );
                        mmY.consider( vertex.y );
                        mmZ.consider( vertex.z );
                    }

                    // Normals
                    if( objMesh.m_aNormalArray )
                    {
                        index = pf.m_aNormalIndices[j];
                        if( index >= 0 && index < objMesh.m_iNumberOfNormals )
                        {
                            var normal = objMesh.m_aNormalArray[ index ];
                            modelNormals[vertexIndex+0] = normal.x;
                            modelNormals[vertexIndex+1] = normal.y;
                            modelNormals[vertexIndex+2] = normal.z;
                        }
                    }

                    uvIndex += 2;
                    vertexIndex += 3;
                }

                // Next triangle points
                for( j=vertexStartIterator; j<=vertexEndIterator; ++j )
                {
                    // UVs
                    if( objMesh.m_aTexCoordArray )
                    {
                        index = pf.m_aTexCoordIndicies[j];
                        if( index >= 0 && index < objMesh.m_iNumberOfTexCoords )
                        {
                            texCoord = objMesh.m_aTexCoordArray[index];
							modelUVs[uvIndex+0] = texCoord.u;
							modelUVs[uvIndex+1] = 1.0 - texCoord.v;
                        }
                    }

                    // Vertices
                    {
                        index = pf.m_aVertexIndices[j];
                        vertex = objMesh.m_aVertexArray[index];
                        modelVertices[vertexIndex+0] = vertex.x;
                        modelVertices[vertexIndex+1] = vertex.y;
                        modelVertices[vertexIndex+2] = vertex.z;

                        mmX.consider( vertex.x );
                        mmY.consider( vertex.y );
                        mmZ.consider( vertex.z );
                    }

                    // Normals
                    // TODO: Fix, currently buggy
//                    if( objMesh.m_aNormalArray )
//                    {
//                        index = pf.m_aNormalIndices[j];
//                        var normal = objMesh.m_aNormalArray[index];
//                        modelNormals[vertexIndex+0] = normal[0];
//                        modelNormals[vertexIndex+1] = normal[1];
//                        modelNormals[vertexIndex+2] = normal[2];
//                    }

                    uvIndex += 2;
                    vertexIndex += 3;
                }

                vertexStartIterator++;
                vertexEndIterator++;

            } while( vertexEndIterator < pf.m_iVertexCount );
        }

        this.width = mmX.size();
        this.height = mmY.size();
        this.depth = mmZ.size();

        this.vertexPositionBuffer = gRenderer.CCCreateVertexBuffer( modelVertices );
        this.vertexTextureBuffer = gRenderer.CCCreateVertexBuffer( modelUVs, 2 );
    }

    callback( this.vertexCount > 0 );
};


CCPrimitiveOBJ.prototype.render = function()
{
    if( this.textureIndex !== -1 )
    {
        gEngine.textureManager.setTextureIndex( this.textureIndex );
    }
    else
    {
        gEngine.textureManager.setTextureIndex( 1 );
    }

    this.renderVertices( gRenderer );
};


CCPrimitiveOBJ.prototype.renderVertices = function(renderer)
{
    if( this.vertexCount > 0 )
    {
        renderer.CCSetRenderStates();
        renderer.CCBindVertexTextureBuffer( this.vertexTextureBuffer );
        renderer.CCBindVertexPositionBuffer( this.vertexPositionBuffer );
        renderer.GLDrawArrays( "TRIANGLES", 0, this.vertexCount );
    }
};


CCPrimitiveOBJ.prototype.copy = function(sourcePrimitive)
{
    this.filename = sourcePrimitive.filename;
    this.fileSize = sourcePrimitive.fileSize;

    this.sourcePrimitiveID = sourcePrimitive.primitiveID;

    this.vertexPositionBuffer = sourcePrimitive.vertexPositionBuffer;
    this.vertexTextureBuffer = sourcePrimitive.vertexTextureBuffer;

	this.vertexCount = sourcePrimitive.vertexCount;

    this.modelUVs = sourcePrimitive.modelUVs;
    this.vertices = sourcePrimitive.vertices;
    this.normals = sourcePrimitive.normals;
    this.width = sourcePrimitive.width;
    this.height = sourcePrimitive.height;
    this.depth = sourcePrimitive.depth;
    this.mmX = sourcePrimitive.mmX;
    this.mmY = sourcePrimitive.mmY;
    this.mmZ = sourcePrimitive.mmZ;

    this.cached = true;
    this.movedToOrigin = sourcePrimitive.movedToOrigin;
    this.origin = sourcePrimitive.origin;

    if( CCEngine.NativeUpdateCommands !== undefined )
    {
        // Create new texture buffer in the native version to utilize adjust texture uvs
        this.vertexTextureBuffer = gRenderer.CCCreateVertexBuffer();
        CCEngine.NativeUpdateCommands += 'CCPrimitiveOBJ.copy;' + this.primitiveID + ';' + sourcePrimitive.primitiveID + ';' + this.vertexTextureBuffer + '\n';
    }
};
