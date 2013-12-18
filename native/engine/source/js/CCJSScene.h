/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCJSScene.h
 * Description : JS scene proxy.
 *
 * Created     : 10/03/13
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

class CCJSScene : public CCSceneBase
{
public:
    typedef CCSceneBase super;

protected:
    CCText sceneID;
    CCJSCamera *camera;



public:
	CCJSScene(const char *sceneID);

    const char* getSceneID()
    {
        return sceneID.buffer;
    }

    virtual bool render(const CCCameraBase *inCamera, const CCRenderPass pass, const bool alpha);
	virtual void renderVisibleObject(CCObject *object, const CCCameraBase *inCamera, const CCRenderPass pass, const bool alpha);

    void setCamera(CCJSCamera *camera)
    {
        this->camera = camera;
    }

    CCJSCamera* getCameraJS()
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
