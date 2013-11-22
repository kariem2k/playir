/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCJSPrimitiveObj.h
 * Description : Loads and handles an obj model
 *
 * Created     : 26/12/11
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

#include "CCPrimitiveOBJ.h"


class CCJSPrimitiveOBJ : public CCPrimitiveOBJ
{
    typedef CCPrimitiveOBJ super;

	CCJSEngine *jsEngine;

    int vertexPositionBufferID;
    int vertexTextureBufferID;


    
public:
    CCJSPrimitiveOBJ(CCJSEngine *jsEngine, const char *primitiveID, const int vertexPositionBufferID, const int vertexTextureBufferID);
    virtual void destruct();

    virtual bool loadData(const char *fileData);
    void referenceData(float *vertices, float *uvs, const uint vertexCount);
    virtual void loaded();

    // Adjust the model's UVs to match the loaded texture,
    // as non-square textures load into a square texture which means the mapping requires adjustment
    virtual void adjustTextureUVs();

public:
    virtual void copy(const CCPrimitiveOBJ *primitive);

protected:
    virtual void movedVerticesToOrigin();
};

