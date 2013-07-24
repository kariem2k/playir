/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCModelObj.h
 * Description : Base for loading and handling of 3d models
 *
 * Created     : 26/12/11
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

#ifndef __CCMODEL3D_H__
#define __CCMODEL3D_H__


class CCPrimitive3D : public CCPrimitiveBase
{
    typedef CCPrimitiveBase super;

protected:
    CCText filename;

	uint vertexCount;
	uint fileSize;
    float *modelUVs;	// Original model UV coordinates
    float *adjustedUVs;	// Adjuested UV coordinates for texture (non-square textures are blitted into a square buffer)

    float width, height, depth;
    CCMinMax mmX, mmY, mmZ;

    bool cached;
    bool movedToOrigin;
    CCVector3 origin;


    
public:
    CCPrimitive3D();
    virtual void destruct();

    void setFilename(const char *filename)
    {
        this->filename = filename;
    }

    void loadDataAsync(const char *fileData);
    virtual bool loadData(const char *fileData) { return false; }
    virtual void loaded() {}

    // Adjust the model's UVs to match the loaded texture,
    // as non-square textures load into a square texture which means the mapping requires adjustment
    virtual void adjustTextureUVs();

    float getWidth() { return width; }
    float getHeight() { return height; }
    float getDepth() { return depth; }

    const CCMinMax getYMinMax() const { return mmY; }
    const CCMinMax getYMinMaxAtZ(const float atZ) const;
    const CCMinMax getZMinMax() const { return mmZ; }

    const CCVector3 getOrigin();
    virtual void moveVerticesToOriginAsync(CCLambdaSafeCallback *callback=NULL);
protected:
    virtual void moveVerticesToOrigin();
	virtual void movedVerticesToOrigin() {}

public:
    bool hasMovedToOrigin() { return movedToOrigin; }
};


class CCModel3D : public CCModelBase, public virtual CCActiveAllocation
{
public:
    typedef CCModelBase super;


    
public:
    CCModel3D();

	CCModel3D(const char *file, const CCResourceType resourceType=Resource_Unknown,
               const bool moveVerticesToOrigin=false);

    const CCPrimitive3D* getPrimitive() const { return primitive; }

    float getWidth() { return primitive->getWidth(); }
    float getHeight() { return primitive->getHeight(); }
    float getDepth() { return primitive->getDepth(); }

    const CCVector3 getOrigin()
    {
        return primitive->getOrigin();
    }

    void moveVerticesToOriginAsync(CCLambdaSafeCallback *callback=NULL)
    {
        primitive->moveVerticesToOriginAsync( callback );
    }

    void setTexture(const char *file, CCResourceType resourceType=Resource_Unknown,
                    const bool mipmap=true, const bool load=false);

public:
	CCPrimitive3D *primitive;
};


#endif // __CCMODEL3D_H__
