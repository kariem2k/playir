/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCSceneJS.cpp
 *-----------------------------------------------------------
 */

#include "CCDefines.h"


CCSceneJS::CCSceneJS(const char *sceneID)
{
    this->sceneID = sceneID;
    camera = NULL;
}


bool CCSceneJS::render(const CCCameraBase *inCamera, const CCRenderPass pass, const bool alpha)
{
    if( camera == inCamera )
    {
        renderObjects( inCamera, pass, alpha );
        return true;
    }
    return false;
}


void CCSceneJS::renderOctreeObject(CCObject *object, const CCCameraBase *inCamera, const CCRenderPass pass, const bool alpha)
{
    if( camera == inCamera )
	{
        object->renderObject( inCamera, alpha );
	}
}
