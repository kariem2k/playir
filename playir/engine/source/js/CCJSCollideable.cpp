/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCJSCollideable.cpp
 *-----------------------------------------------------------
 */

#include "CCDefines.h"


CCJSCollideable::CCJSCollideable(const long jsID)
{
	this->jsID = jsID;
}


void CCJSCollideable::setPositionAndSize(const CCVector3 &position, const CCVector3 &collisionBounds)
{
    this->position = position;
    this->collisionBounds = collisionBounds;
    this->updateCollisions = true;
    CCOctreeRefreshObject( this );
}