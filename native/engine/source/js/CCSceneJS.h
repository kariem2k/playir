/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCSceneJS.h
 * Description : JS scene proxy.
 *
 * Created     : 10/03/13
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

class CCSceneJS : public CCSceneBase
{
public:
    typedef CCSceneBase super;

protected:
    CCText sceneID;
    CCCameraJS *camera;



public:
	CCSceneJS(const char *sceneID);

    const char* getSceneID()
    {
        return sceneID.buffer;
    }

    virtual bool render(const CCCameraBase *inCamera, const CCRenderPass pass, const bool alpha);
	virtual void renderOctreeObject(CCObject *object, const CCCameraBase *inCamera, const CCRenderPass pass, const bool alpha);

    void setCamera(CCCameraJS *camera)
    {
        this->camera = camera;
    }

    CCCameraJS* getCameraJS()
    {
        return camera;
    }

    const CCList<CCCollideable>& getCollideables()
    {
        return collideables;
    }

    void clearCollideables()
    {
        collideables.length = 0;
    }
};
