/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCCameraJS.h
 * Description : JS Scene camera proxy.
 *
 * Created     : 10/03/13
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

class CCCameraJS : public CCCameraBase
{
    typedef CCCameraBase super;

	CCEngineJS *jsEngine;

    CCText cameraID;



public:
	CCCameraJS(CCEngineJS *jsEngine, const char *cameraID);

    const char* getCameraID()
    {
        return cameraID.buffer;
    }

    virtual void update();

    virtual void setPerspective(const float perspective) {}
    void gluPerspective(const float right, const float top, const float zNear, const float zFar);

    void set();
    
    void update(const CCVector3 &rotatedPosition, const CCVector3 &lookAt);

protected:
	virtual void updateVisibleCollideables();
};

