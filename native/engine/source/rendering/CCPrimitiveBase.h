/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCPrimitiveBase.h
 * Description : Base drawable component.
 *
 * Created     : 01/03/10
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

#ifndef __CCPRIMITIVEBASE_H__
#define __CCPRIMITIVEBASE_H__


class CCPrimitiveBase : public CCBaseType, public virtual CCActiveAllocation
{
    typedef CCBaseType super;

protected:
    CCText primitiveID;

	float *vertices;
	float *normals;

    struct TextureInfo
    {
        TextureInfo()
        {
            primaryIndex = secondaryIndex = 0;
        }
        int primaryIndex;
        int secondaryIndex;

    };
	TextureInfo *textureInfo;
    int frameBufferID;


    
public:
	CCPrimitiveBase(const char *primitiveID=NULL);

    // CCBaseType
	virtual void destruct();

    const char* getPrimitiveID()
    {
        return primitiveID.buffer;
    }

    // name specifies local path to the texture
    // resourceType specifies is the data is generated during runtime or part of the install package
    // alpha specifies if the image should function through the transparency pipe
    void setTexture(const char *file, CCResourceType resourceType, CCLambdaCallback *onDownloadCallback,
                    const bool mipmap=false, const bool load=false, const bool alwaysResident=false);
    virtual void setTextureHandleIndex(const int index);
    inline int getTextureHandleIndex()
    {
        if( textureInfo != NULL )
        {
            return textureInfo->primaryIndex;
        }
        return -1;
    }
    void removeTexture();

    void setFrameBufferID(const int frameBufferID) { this->frameBufferID = frameBufferID; }

    // Adjust the model's UVs to match the loaded texture,
    // as non-square textures load into a square texture which means the mapping requires adjustment
    virtual void adjustTextureUVs() {};

	virtual void render();
	virtual void renderVertices(const bool textured) = 0;
	virtual void renderOutline() {};
};


#endif // __CCPRIMITIVEBASE_H__
