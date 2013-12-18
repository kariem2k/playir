/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCJSScene.cpp
 *-----------------------------------------------------------
 */

#include "CCDefines.h"


CCJSScene::CCJSScene(const char *sceneID)
{
    this->sceneID = sceneID;
    camera = NULL;
}


bool CCJSScene::render(const CCCameraBase *inCamera, const CCRenderPass pass, const bool alpha)
{
    if( camera == inCamera )
    {
        renderObjects( inCamera, pass, alpha );
        return true;
    }
    return false;
}


void CCJSScene::renderVisibleObject(CCObject *object, const CCCameraBase *inCamera, const CCRenderPass pass, const bool alpha)
{
    if( camera == inCamera )
	{
        object->renderObject( inCamera, alpha );
	}
}
