/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCDeviceControls.cpp
 *-----------------------------------------------------------
 */

#include "CCDefines.h"
#include "CCDeviceControls.h"
#include "CCAppManager.h"


CCDeviceControls::CCDeviceControls()
{
}


void CCDeviceControls::touchBegin(PointerPoint^ point)
{
    DEBUGLOG( "CCDeviceControls::mouseBegin %f \n", gEngine->time.lifetime );
    DEBUGFLUSH;

	int touchIndex = getUITouchIndex( point );
	if( touchIndex >= 0 )
	{
		touchHandle( touchIndex );

		CCScreenTouches &screenTouch = screenTouches[touchIndex];
		gEngine->touchBegin( touchIndex, screenTouch.position.x, screenTouch.position.y );
	}

    inUse = false;
    for( uint i=0; i<max_touches; ++i )
    {
        inUse |= screenTouches[i].usingTouch != NULL;
    }
}


void CCDeviceControls::touchMove(PointerPoint^ point)
{
    if( inUse )
    {
        //DEBUGLOG( "CCDeviceControls::mouseMove %f \n", gEngine->time.lifetime );
        //DEBUGFLUSH;

        int touchIndex = getUITouchIndex( point );
		if( touchIndex >= 0 )
		{
			touchHandle( touchIndex );
			
			CCScreenTouches &screenTouch = screenTouches[touchIndex];
			gEngine->touchMove( touchIndex, screenTouch.position.x, screenTouch.position.y );
		}
    }
}


void CCDeviceControls::touchEnd(PointerPoint^ point)
{
    DEBUGLOG( "CCDeviceControls::mouseEnd %f \n", gEngine->time.lifetime );
    DEBUGFLUSH;

	int touchIndex = getUITouchIndex( point );
	if( touchIndex >= 0 )
	{
		UITouch &touch = uiTouches[touchIndex];
		unTouch( &touch );
		touch.touchID = -1;
	}
	inUse = false;
}


int CCDeviceControls::getUITouchIndex(PointerPoint^ point)
{
	int touchIndex = -1;

	for( int i=0; i<max_touches; ++i )
	{
		UITouch *touchItr = &uiTouches[i];
		if( touchItr->touchID == point->PointerId )
		{
			touchIndex = i;
			break;
		}
	}

	if( touchIndex == -1 )
	{
		for( int i=0; i<max_touches; ++i )
		{
			UITouch *touchItr = &uiTouches[i];
			if( touchItr->touchID == -1 )
			{
				touchIndex = i;
				break;
			}
		}
	}

	if( touchIndex >= 0 )
	{
		UITouch &touch = uiTouches[touchIndex];
		touch.touchID = point->PointerId;

		// Scale with Device Independant Pixels (WVGA 800x480)
		touch.position.x = point->Position.X / 800.0f;
		touch.position.y = point->Position.Y / 480.0f;
	}
	
	return touchIndex;
}


void CCDeviceControls::touchHandle(const int touchIndex)
{
	UITouch &touch = uiTouches[touchIndex];
    CCScreenTouches &screenTouch = screenTouches[touchIndex];

    CCPoint position = touch.position;

    if( CCAppManager::GetOrientation().target == 270.0f )
    {
        CCFloatSwap( position.x, position.y );
        position.y = 1.0f - position.y;
    }
    else if( CCAppManager::GetOrientation().target == 90.0f )
    {
        CCFloatSwap( position.x, position.y );
        position.x = 1.0f - position.x;
    }
    else if( CCAppManager::GetOrientation().target == 180.0f )
    {
        position.x = 1.0f - position.x;
        position.y = 1.0f - position.y;
    }

    if( screenTouch.usingTouch != NULL )
    {
        screenTouch.delta.x += position.x - screenTouch.position.x;
        screenTouch.delta.y += position.y - screenTouch.position.y;
        screenTouch.totalDelta.x += screenTouch.delta.x;
        screenTouch.totalDelta.y += screenTouch.delta.y;
    }
    else
    {
        // Restart our counters
        screenTouch.totalDelta.x = 0.0f;
        screenTouch.totalDelta.y = 0.0f;
        screenTouch.timeHeld = 0.0f;
        screenTouch.startPosition = position;

        for( uint i=0; i<CCScreenTouches::max_last_deltas; ++i )
        {
            screenTouch.lastDeltas[i].clear();
        }
        screenTouch.usingTouch = &touch;
    }
    screenTouch.position = position;
}
