/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCPrimitiveFBXJS.h
 * Description : Loads and handles an FBX model
 *
 * Created     : 06/05/13
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

#include "CCJSON.h"


class CCPrimitiveFBXJS : public CCPrimitive3D
{
    typedef CCPrimitive3D super;

    struct AnimationFrameSubmodel
    {
        AnimationFrameSubmodel()
        {
            vertices = NULL;
        }
        ~AnimationFrameSubmodel()
        {
            if( vertices != NULL )
            {
                free( vertices );
            }
        }

        CCText name;
        float *vertices;
    };

    struct AnimationFrame
    {
        ~AnimationFrame()
        {
            submodels.deleteObjects();
        }
        CCList<AnimationFrameSubmodel> submodels;
    };

    struct Animation
    {
        ~Animation()
        {
            frames.deleteObjects();
        }
        CCText name;
        CCList<AnimationFrame> frames;
    };
    CCList<Animation> *animations;
    float animationFPS;
    int animationFPSCompression;



    struct Submesh
    {
        int count;
        int offset;
    };

    struct Submodel
    {
        Submodel()
        {
            cached = false;

            vertexCount = 0;

            vertices = NULL;
            skinnedVertices = NULL;
            indices = NULL;
            modelUVs = NULL;
            adjustedUVs = NULL;
        }

        ~Submodel()
        {
            submeshes.deleteObjects();

            if( !cached )
            {
                if( vertices != NULL )
                {
                    free( vertices );
                }

                if( indices != NULL )
                {
                    free( indices );
                }

                if( modelUVs != NULL )
                {
                    free( modelUVs );
                }
            }

            if( skinnedVertices != NULL )
            {
				gRenderer->derefVertexPointer( ATTRIB_VERTEX, skinnedVertices );
                free( skinnedVertices );
            }

            if( adjustedUVs != NULL )
            {
                free( adjustedUVs );
            }
        }

        bool cached;
        CCText name;
        CCList<Submesh> submeshes;

        int vertexCount;

        float *vertices;
        float *skinnedVertices;
        ushort *indices;

        float *modelUVs;
        float *adjustedUVs;	// Adjuested UV coordinates for texture (non-square textures are blitted into a square buffer)
    };
    CCList<Submodel> submodels;



public:
    CCPrimitiveFBXJS(const char *primitiveID);
    virtual void destruct();

    virtual bool loadData(const char *fileData);
    virtual void loaded();

    int loadSubmodel(json_t *json);
    void addSubmesh(const int count, const int offset);

    virtual void setTextureHandleIndex(const int index);

    // Adjust the model's UVs to match the loaded texture,
    // as non-square textures load into a square texture which means the mapping requires adjustment
    virtual void adjustTextureUVs();

	virtual void render();
	virtual void renderVertices(const bool textured);

public:
    virtual void copy(const CCPrimitiveFBXJS *primitive);

protected:
    void calculateMinMax();

public:
    virtual void moveVerticesToOrigin();

protected:
    virtual void movedVerticesToOrigin();

public:
    void interpolateFrames(const int currentAnimationIndex, const int currentFrameIndex, const int nextAnimationIndex, const int nextFrameIndex, const float frameDelta);
protected:
    float* getSubmodelAnimationFrameVertices(const char *submodelName, const AnimationFrame &frame);
};

