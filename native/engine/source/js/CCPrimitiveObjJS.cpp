/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCPrimitiveObjJS.cpp
 *-----------------------------------------------------------
 */

#include "CCDefines.h"
#include "CCAppManager.h"


CCPrimitiveObjJS::CCPrimitiveObjJS(CCEngineJS *jsEngine, const char *primitiveID, const int vertexPositionBufferID, const int vertexTextureBufferID)
{
	this->jsEngine = jsEngine;
    this->primitiveID = primitiveID;
    this->vertexPositionBufferID = vertexPositionBufferID;
    this->vertexTextureBufferID = vertexTextureBufferID;
}


void CCPrimitiveObjJS::destruct()
{
    modelUVs = NULL;
    vertices = NULL;

    // Clear out our texture buffer pointer
    // The data is stored in modelUVs and adjustedUVs, this buffer is just used to bridge the data to JS
    // The modelUV/adjustedUVs buffers will be deleted in super::destruct
	jsEngine->updateVertexBufferPointer( vertexTextureBufferID, NULL, false );

    super::destruct();
}


static CCText script;

bool CCPrimitiveObjJS::loadData(const char *fileData)
{
    CCText textData = fileData;
    ObjMesh *objMesh = LoadOBJTextData( textData );

    if( objMesh != NULL )
    {
        fileSize = strlen( fileData );
        
        if( loadObjMesh( objMesh ) )
        {
            jsEngine->updateVertexBufferPointer( vertexPositionBufferID, vertices );
            jsEngine->updateVertexBufferPointer( vertexTextureBufferID, modelUVs );
            return true;
        }
    }
    return false;
}


void CCPrimitiveObjJS::loaded()
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


void CCPrimitiveObjJS::adjustTextureUVs()
{
    super::adjustTextureUVs();

    if( adjustedUVs != NULL )
    {
        jsEngine->updateVertexBufferPointer( vertexTextureBufferID, adjustedUVs );
    }
}


void CCPrimitiveObjJS::copy(const CCPrimitiveObj *primitive)
{
    super::copy( primitive );

    if( modelUVs != NULL )
    {
        jsEngine->updateVertexBufferPointer( vertexTextureBufferID, modelUVs );
    }
}


void CCPrimitiveObjJS::movedVerticesToOrigin()
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
