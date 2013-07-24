/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCCameraJS.cpp
 *-----------------------------------------------------------
 */

#include "CCDefines.h"

#ifdef IOS
#include <OpenGLES/ES1/gl.h>
#endif


CCCameraJS::CCCameraJS(CCEngineJS *jsEngine, const char *cameraID)
{
	this->jsEngine = jsEngine;
    this->cameraID = cameraID;
}


void CCCameraJS::update()
{
    super::update();
}


void CCCameraJS::gluPerspective(const float right, const float top, const float zNear, const float zFar)
{
    frustumMin.x = -right;
    frustumMax.x = right;
    frustumMin.y = -top;
    frustumMax.y = top;

	const float zNearScale = 1.0f / zNear;
	frustumSize.width = ( frustumMax.x + -frustumMin.x ) * zNearScale;
	frustumSize.height = ( frustumMax.y + -frustumMin.y ) * zNearScale;

    if( gRenderer->openGL2() )
    {
        CCMatrixLoadIdentity( projectionMatrix );
        CCMatrixFrustum( projectionMatrix, frustumMin.x, frustumMax.x, frustumMin.y, frustumMax.y, zNear, zFar );
    }
    else
    {
#ifdef IOS

        glMatrixMode( GL_PROJECTION );
        glLoadIdentity();
        glFrustumf( frustumMin.x, frustumMax.x, frustumMin.y, frustumMax.y, zNear, zFar );
        glGetFloatv( GL_PROJECTION_MATRIX, projectionMatrix.data() );

#endif
    }
}


void CCCameraJS::set()
{
    CCCameraBase::CurrentCamera = this;
}


void CCCameraJS::update(const CCVector3 &rotatedPosition, const CCVector3 &lookAt)
{   
    this->rotatedPosition = rotatedPosition;
    this->lookAt = lookAt;
    super::update();
}


void CCCameraJS::updateVisibleCollideables()
{
    super::updateVisibleCollideables();

    if( jsEngine != NULL )
    {
        static CCText jsCommand;
        jsCommand = "{ \"id\":\"gEngine.updateCameraResults\", \"cameraID\":";
        jsCommand += cameraID.buffer;

        jsCommand += ", \"viewMatrix\":[";
        for( int i=0; i<16; ++i )
        {
            if( i > 0 )
            {
                jsCommand += ",";
            }
            jsCommand += (*(viewMatrix.m))[i];
        }
        jsCommand += "], \"visibles\":[";
        for( int i=0; i<visibleCollideables.length; ++i )
        {
            CCCollideable *collideable = visibleCollideables.list[sortedVisibleCollideables[i]];
            if( i > 0 )
            {
                jsCommand += ",";
            }
            jsCommand += collideable->getJSID();
        }
        jsCommand += "] }";

        jsEngine->addCppToJSCommand( jsCommand.buffer );
    }
}
