/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCDeviceControls.mm
 *-----------------------------------------------------------
 */

#import "CCDefines.h"
#import "CCDeviceControls.h"
#include "CCAppManager.h"


CCDeviceControls::CCDeviceControls()
{
    //motionManager = [[CMMotionManager alloc] init];
    //[motionManager startGyroUpdates];
    //[motionManager startAccelerometerUpdates];
}


CCDeviceControls::~CCDeviceControls()
{
    //[motionManager release];
}


void CCDeviceControls::touchBegin(NSSet *touches, CCGLView *view)
{
	NSArray *touchesArray = [touches allObjects];
	for( uint i=0; i<[touchesArray count]; ++i )
	{
		UITouch *touch = [touchesArray objectAtIndex:i];
		int touchIndex = touchHandle( touch, view );
		if( touchIndex >= 0 )
		{
            CCScreenTouches &screenTouch = screenTouches[touchIndex];

            DEBUGLOG( "CCControls::touchBegin() %i\n", touchIndex );
            if( gEngine != NULL )
            {
                CCLAMBDA_4( ReRunCallback, CCAppEngine, gEngine, int, index, float, x, float, y, {
                    gEngine->touchBegin( index, x, y );
                });
                gEngine->nativeToEngineThread( new ReRunCallback( gEngine, touchIndex, screenTouch.position.x, screenTouch.position.y ) );
            }
		}
	}


    inUse = false;
    for( uint touchIndex=0; touchIndex<max_touches; ++touchIndex )
    {
        inUse |= screenTouches[touchIndex].usingTouch != NULL;
    }
}


void CCDeviceControls::touchMove(NSSet *touches, CCGLView *view)
{
	if( inUse )
	{
        NSArray *touchesArray = [touches allObjects];
        for( uint i=0; i<[touchesArray count]; ++i )
        {
            UITouch *touch = [touchesArray objectAtIndex:i];
            int touchIndex = touchHandle( touch, view );
            if( touchIndex >= 0 )
            {
                CCScreenTouches &screenTouch = screenTouches[touchIndex];

                DEBUGLOG( "CCControls::touchMove() %i\n", touchIndex );
                if( gEngine != NULL )
                {
                    CCLAMBDA_4( ReRunCallback, CCAppEngine, gEngine, int, index, float, x, float, y, {
                        gEngine->touchMove( index, x, y );
                    });
                    gEngine->nativeToEngineThread( new ReRunCallback( gEngine, touchIndex, screenTouch.position.x, screenTouch.position.y ) );
                }
            }
        }
	}
}


void CCDeviceControls::touchEnd(NSSet *touches, UIEvent *event, CCGLView *view)
{
    // For all the touches that have been released, call unTouch on them
	NSArray *touchesArray = [touches allObjects];
	for( uint i=0; i<[touchesArray count]; ++i )
	{
		UITouch *touch = [touchesArray objectAtIndex:i];
		unTouch( touch );
	}

    // Now compare the number of touches  being released with the touches present on the screen
    // If they're different, something weird has occured, hence touchesCancelled
	NSArray *touchesForViewArray = [[event touchesForView:view] allObjects];
    if( [touchesArray count] == [touchesForViewArray count] )
	{
		inUse = false;
		//DEBUGLOG( @"touchesEnded, all fingers up" );
    }
	else
	{
		DEBUGLOG( "touchesCancelled" );
	}
}



int CCDeviceControls::touchHandle(UITouch *touch, CCGLView *view)
{
	const CCSize &inverseScreenSize = gRenderer->getInverseScreenSize();

    CGPoint cgPosition = [touch locationInView:view];
    CCPoint position( cgPosition.x, cgPosition.y );
    position.x *= inverseScreenSize.width;
    position.y *= inverseScreenSize.height;

    // Fill in our screen touches
    for( int touchIndex=0; touchIndex<max_touches; ++touchIndex )
    {
        CCScreenTouches &screenTouch = screenTouches[touchIndex];
        if( screenTouch.usingTouch == NULL || screenTouch.usingTouch == touch )
        {
            CCPoint screenPosition = position;
            if( CCAppManager::GetOrientation().target == 270.0f )
            {
                CCFloatSwap( screenPosition.x, screenPosition.y );
                screenPosition.y = 1.0f - screenPosition.y;
            }
            else if( CCAppManager::GetOrientation().target == 90.0f )
            {
                CCFloatSwap( screenPosition.x, screenPosition.y );
                screenPosition.x = 1.0f - screenPosition.x;
            }
            else if( CCAppManager::GetOrientation().target == 180.0f )
            {
                screenPosition.x = 1.0f - screenPosition.x;
                screenPosition.y = 1.0f - screenPosition.y;
            }

            CCNativeThreadLock();
            if( screenTouch.usingTouch != NULL )
            {
                screenTouch.delta.x += screenPosition.x - screenTouch.position.x;
                screenTouch.delta.y += screenPosition.y - screenTouch.position.y;
                screenTouch.totalDelta.x += screenTouch.delta.x;
                screenTouch.totalDelta.y += screenTouch.delta.y;
            }
            else
            {
                // Restart our counters
                screenTouch.totalDelta.x = 0.0f;
                screenTouch.totalDelta.y = 0.0f;
                screenTouch.timeHeld = 0.0f;
                screenTouch.startPosition = screenPosition;

                for( uint i=0; i<CCScreenTouches::max_last_deltas; ++i )
                {
                    screenTouch.lastDeltas[i].clear();
                }
            }
            screenTouch.position = screenPosition;
            screenTouch.usingTouch = touch;
            CCNativeThreadUnlock();

            return touchIndex;
		}
	}

    return -1;
}
