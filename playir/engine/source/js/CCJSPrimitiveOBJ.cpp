/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCJSPrimitiveOBJ.cpp
 *-----------------------------------------------------------
 */

#include "CCDefines.h"
#include "CCAppManager.h"


CCJSPrimitiveOBJ::CCJSPrimitiveOBJ(CCJSEngine *jsEngine, const char *primitiveID, const int vertexPositionBufferID, const int vertexTextureBufferID)
{
	this->jsEngine = jsEngine;
    this->primitiveID = primitiveID;
    this->vertexPositionBufferID = vertexPositionBufferID;
    this->vertexTextureBufferID = vertexTextureBufferID;
}


void CCJSPrimitiveOBJ::destruct()
{
    // These buffers are just used to bridge the data to JS
    jsEngine->updateVertexBufferPointer( vertexPositionBufferID, NULL, false );
	jsEngine->updateVertexBufferPointer( vertexTextureBufferID, NULL, false );

    // The actual buffers will be deleted in super::destruct
    super::destruct();
}


static CCText script;

bool CCJSPrimitiveOBJ::loadData(const char *fileData)
{
    CCText textData = fileData;
    ObjMesh *objMesh = LoadOBJTextData( textData );

    if( objMesh != NULL )
    {
        fileSize = strlen( fileData );
        
        if( loadOBJMesh( objMesh ) )
        {
            jsEngine->updateVertexBufferPointer( vertexPositionBufferID, vertices );
            jsEngine->updateVertexBufferPointer( vertexTextureBufferID, modelUVs );
            return true;
        }
    }
    return false;
}


void CCJSPrimitiveOBJ::referenceData(float *vertices, float *uvs, const uint vertexCount)
{
    cached = true;
    this->vertices = vertices;
    this->modelUVs = uvs;
    this->vertexCount = vertexCount;

    for( uint i=0; i<vertexCount; ++i )
    {
        const uint index = vertexCount*3;
        mmX.consider( vertices[index+0] );
        mmY.consider( vertices[index+1] );
        mmZ.consider( vertices[index+2] );
    }

    width = mmX.size();
    height = mmY.size();
    depth = mmZ.size();
}


void CCJSPrimitiveOBJ::loaded()
{
    script = "CCPrimitive3D.Loaded( ";
    script += primitiveID.buffer;
    script += ", {\n";


    script += "\"fileSize\":";
    script += (int)fileSize;

    script += ",\"vertexCount\":";
    script += (int)vertexCount;

    {
        script += ",\n\"mmXmin\":";
        script += mmX.min;
        script += ",\n\"mmXmax\":";
        script += mmX.max;
    }
    {
        script += ",\n\"mmYmin\":";
        script += mmY.min;
        script += ",\n\"mmYmax\":";
        script += mmY.max;
    }
    {
        script += ",\n\"mmZmin\":";
        script += mmZ.min;
        script += ",\n\"mmZmax\":";
        script += mmZ.max;
    }

    script += "\n} );";
    CCAppManager::WebJSRunJavaScript( script.buffer, false, false );
}


void CCJSPrimitiveOBJ::adjustTextureUVs()
{
    super::adjustTextureUVs();

    if( adjustedUVs != NULL )
    {
        jsEngine->updateVertexBufferPointer( vertexTextureBufferID, adjustedUVs );
    }
}


void CCJSPrimitiveOBJ::copy(const CCPrimitiveOBJ *primitive)
{
    super::copy( primitive );

    if( modelUVs != NULL )
    {
        jsEngine->updateVertexBufferPointer( vertexTextureBufferID, modelUVs );
    }
}


void CCJSPrimitiveOBJ::movedVerticesToOrigin()
{
    script = "CCPrimitive3D.MovedVerticesToOrigin( ";
    script += primitiveID.buffer;
    script += ", {\n";

    {
        script += "\"mmXmin\":";
        script += mmX.min;
        script += ",\n\"mmXmax\":";
        script += mmX.max;
    }
    {
        script += ",\n\"mmYmin\":";
        script += mmY.min;
        script += ",\n\"mmYmax\":";
        script += mmY.max;
    }
    {
        script += ",\n\"mmZmin\":";
        script += mmZ.min;
        script += ",\n\"mmZmax\":";
        script += mmZ.max;
    }

    script += "\n} );";
    CCAppManager::WebJSRunJavaScript( script.buffer, false, false );
}
