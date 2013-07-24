/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCTextureManager.h
 * Description : Manages the loading and setting of textures.
 *
 * Created     : 01/03/10
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

#ifndef __CCTEXTUREMANAGER_H__
#define __CCTEXTUREMANAGER_H__


#include "CCTextureBase.h"
class CCTextureFontPage;
struct CCTextureSprites;

struct CCTextureHandle
{
    CCText filePath;
    CCResourceType resourceType;
	CCTextureBase *texture;

    bool loading;
    bool loadable;

	bool alwaysResident;
    bool mipmap;
    float lastTimeUsed;
    CCLAMBDA_SIGNAL onLoad;

    CCTextureHandle(const char *inFilePath, const CCResourceType inResourceType)
    {
        filePath = inFilePath;
        resourceType = inResourceType;
		texture = NULL;
        loading = false;
        loadable = true;
		alwaysResident = false;
        mipmap = false;
        lastTimeUsed = 0.0f;
	}

	~CCTextureHandle();
};


class CCTextureManager : public virtual CCActiveAllocation
{
public:
	CCTextureManager();
	~CCTextureManager();

    void invalidateAllTextureHandles();		// Deletes OpenGL handles (usually done after a context reset)
    void unloadAllTextures();				// Deletes all textures

    void loadFont(const char *font);

    uint assignTextureIndex(const char *filePath, const CCResourceType resourceType,
                            const bool mipmap, const bool load, const bool alwaysResident);

    CCTextureHandle* getTextureHandle(const char *filePath, const CCResourceType resourceType, const bool mipmap);
    CCTextureHandle* getTextureHandle(const int handleIndex);
    void deleteTextureHandle(const char *filePath);
    
    void loadTextureAsync(CCTextureHandle &textureHandle, CCLambdaSafeCallback *callback=NULL);
    void loadedTexture(CCTextureHandle &textureHandle, CCTextureBase *texture);

    void trim();

    // Used for direct OpenGL access binding
	void bindTexture(const CCTextureName *texture);
    const CCTextureName* getCurrentGLTexture() { return currentGLTexture; }

    // Used for assignging textures
    bool setTextureIndex(const int textureIndex);

    void getTextureAsync(const int handleIndex, CCLambdaSafeCallback *callback);

	CCList<CCTextureFontPage> fontPages;
    CCTextureSprites *textureSprites;

protected:
	const CCTextureName *currentGLTexture;
    uint totalTexturesLoaded;
    uint totalUsedTextureSpace;

	CCList<CCTextureHandle> textureHandles;
};


#endif // __CCTEXTUREMANAGER_H__
