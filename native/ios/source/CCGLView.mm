/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCGLView.mm
 *-----------------------------------------------------------
 */

#import "CCDefines.h"
#include "CCAppManager.h"
#import "CCDeviceControls.h"

#include "CCAlertView.h"
#import "AppiRater.h"

#import <QuartzCore/QuartzCore.h>
#import <pthread.h>

static const float NATIVETHREAD_INTERVAL = 1.0f/60.0f;


@implementation CCGLView


// You must implement this method
+(Class)layerClass
{
    return [CAEAGLLayer class];
}


-(void)layoutSubviews
{
    [super layoutSubviews];
}


-(id)initWithFrame:(CGRect)frame
{
	self = [super initWithFrame:frame];
    if( self != NULL )
	{
		gView = self;

        self.multipleTouchEnabled = true;
		self.userInteractionEnabled = false;
		// Get the layer
		CAEAGLLayer *eaglLayer = (CAEAGLLayer*)self.layer;

        // Set contentScale Factor to 2, to use high resolution
        if( [[UIScreen mainScreen] respondsToSelector:@selector( scale )] && [[UIScreen mainScreen] scale] == 2.0 )
        {
            self.contentScaleFactor = 2.0f;
            eaglLayer.contentsScale = 2.0f;
        }

		eaglLayer.opaque = true;
		eaglLayer.drawableProperties = [NSDictionary dictionaryWithObjectsAndKeys:
										[NSNumber numberWithBool:false],
                                        kEAGLDrawablePropertyRetainedBacking,
                                        kEAGLColorFormatRGBA8,
                                        kEAGLDrawablePropertyColorFormat, NULL];

        //updateTime = 0.0;
        inAppPurchaseManager = [[InAppPurchaseManager alloc] init];

        // Activity Indicator
        {
            activityIndicator = [[UIActivityIndicatorView alloc] initWithActivityIndicatorStyle:UIActivityIndicatorViewStyleWhiteLarge];
            {
                const float size = 48.0f;
                const float hSize = size * 0.5f;
                activityIndicator.frame = CGRectMake( frame.size.width * 0.5f - hSize, frame.size.height * 0.5f - hSize, size, size );
            }
            //activityIndicator.hidden = true;
            [self addSubview:activityIndicator];
            toggleActivityState = activity_none;
        }
	}

    return self;
}


-(void)dealloc
{
    CCASSERT( gEngine == NULL );

    gView = NULL;

    [super dealloc];
}


-(void)shutdown
{
	self.userInteractionEnabled = false;
	delete gEngine;

	[self release];
}


static inline void refreshReleasePool(NSAutoreleasePool **pool, uint *count, const uint target)
{
	if( (*count)++ > target )
	{
		[*pool release];
		*pool = [[NSAutoreleasePool alloc] init];
		*count = 0;
	}
}


static bool setupEngineThread = false;

void* PosixEngineThread(void* data)
{
	NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    gEngine->createRenderer();
	setupEngineThread = gEngine->setupEngineThread();
	[pool release];

    if( setupEngineThread == false )
    {
        CCLAMBDA_UNSAFE( AlertCallback,
        {
            CCAlertView *alertView = [[[CCAlertView alloc] initWithTitle:@"Congratulations"
                                                                 message:@"You have been selected to use the web version of iGrapher."
                                                                delegate:gView
                                                       cancelButtonTitle:@"Ok"
                                                       otherButtonTitles:nil] autorelease];
            alertView->shouldDismiss = false;
            [alertView show];
            [alertView setOrientation:UIInterfaceOrientationLandscapeRight duration:0.25f];
        });
        gEngine->engineToNativeThread( new AlertCallback() );
        return NULL;
    }

	pool = [[NSAutoreleasePool alloc] init];
	usleep( 0 );

	uint poolRefreshCounter = 0;
	do
	{
		if( gEngine->paused )
		{
            // Sleep for 0.125 seconds
            usleep( 125000 );
		}
		else
		{
            [gView performSelectorOnMainThread:@selector(updateNativeThread) withObject:nil waitUntilDone:YES];
			gEngine->updateEngineThread();
		}

		refreshReleasePool( &pool, &poolRefreshCounter, 1000 );
	} while( gEngine->running );
	[pool release];

	gEngine->engineThreadRunning = false;
	return NULL;
}


#include <sys/sysctl.h>
unsigned int countCores()
{
    unsigned int ncpu;
    size_t len = sizeof( ncpu );
    sysctlbyname ( "hw.ncpu", &ncpu, &len, NULL, 0 );
    return ncpu;
}


void* PosixJobsThread(void* data)
{
	NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
	uint poolRefreshCounter = 0;
	do
	{
		if( gEngine->paused )
		{
            // Sleep for 1 second
            usleep( 1000000 );
		}
		else
		{
			gEngine->updateJobsThread();

            // Sleep at 4 jobs per second max * cores
            static uint cores = countCores();
            static uint timeout = ( 1000000 / 4 ) / cores;
            usleep( timeout );
//            usleep( 500000 );
        }

		refreshReleasePool( &pool, &poolRefreshCounter, 1000 );
	} while( gEngine->running );
	[pool release];
	return NULL;
}


-(void)emptyThread
{
}


void CreateThread(void *(*start_routine)(void*), void *__restrict arg=NULL, int prioritySet=-1, int priorityAdj=-1)
{
	// Create the game thread using POSIX routines.
	pthread_attr_t attr;
	pthread_t posixThreadID;
	int returnVal;

	returnVal = pthread_attr_init( &attr );
	CCASSERT( !returnVal );

	returnVal = pthread_attr_setdetachstate( &attr, PTHREAD_CREATE_DETACHED );
	CCASSERT( !returnVal );

	returnVal = pthread_create( &posixThreadID, &attr, start_routine, arg );
	CCASSERT( !returnVal );

	struct sched_param param;
	int policy;
	pthread_getschedparam( posixThreadID, &policy, &param );
	CCASSERT( !returnVal );

	if( prioritySet != -1 )
	{
		param.sched_priority = prioritySet;
	}
	else if( priorityAdj != -1 )
	{
		param.sched_priority += priorityAdj;
	}
	CCASSERT( param.sched_priority >= 0 && param.sched_priority < 100 );

	returnVal = pthread_setschedparam( posixThreadID, policy, &param );
	CCASSERT( !returnVal );

	returnVal = pthread_attr_destroy( &attr );
	CCASSERT( !returnVal );
}


-(void)setup
{
	gEngine->setupNativeThread();

	// iOS SDK recommends launching an empty NSThread when using POSIX threads with Cocoa applications
	[NSThread detachNewThreadSelector:@selector( emptyThread ) toTarget:self withObject:NULL];

	// Create the engine thread using POSIX routines.
	CreateThread( &PosixEngineThread );
	CreateThread( &PosixJobsThread );
}


-(void)updateNativeThread
{
//    const double currentTime = CFAbsoluteTimeGetCurrent();
//    const double difference = currentTime - updateTime;
    //if( difference > NATIVETHREAD_INTERVAL )
    {
//        updateTime = currentTime;

        if( gEngine->engineThreadRunning )
        {
            static bool firstRun = true;
            if( firstRun )
            {
                firstRun = false;

                // Enable Multi Touch of the view
                self.userInteractionEnabled = true;

                CCAppManager::LaunchWindow();

                if( setupEngineThread )
                {
                    [Appirater appLaunched];
                }
            }

            [gViewController detectOrientationUpdate:NATIVETHREAD_INTERVAL];

            if( gEngine->updateNativeThread() == false )
            {
            }
        }

        if( toggleActivityState != activity_none )
        {
            if( toggleActivityState == activity_on )
            {
                [activityIndicator startAnimating];
                activityIndicator.hidden = false;
            }
            else if( toggleActivityState == activity_off )
            {
                [activityIndicator stopAnimating];
                activityIndicator.hidden = true;
            }
            toggleActivityState = activity_none;
        }
    }
}


// These are four methods touchesBegan, touchesMoved, touchesEnded, touchesCancelled and use to notify about touches and gestures
-(void)touchesBegan:(NSSet*)touches withEvent:(UIEvent*)event
{
    CCDeviceControls *controls = (CCDeviceControls*)gEngine->controls;
	controls->touchBegin( touches, self );
}


-(void)touchesMoved:(NSSet*)touches withEvent:(UIEvent*)event
{
    CCDeviceControls *controls = (CCDeviceControls*)gEngine->controls;
	controls->touchMove( touches, self );
}


-(void)touchesEnded:(NSSet*)touches withEvent:(UIEvent*)event
{
    CCDeviceControls *controls = (CCDeviceControls*)gEngine->controls;
	controls->touchEnd( touches, event, self );
}


-(void)touchesCancelled:(NSSet*)touches withEvent:(UIEvent*)event
{
    CCDeviceControls *controls = (CCDeviceControls*)gEngine->controls;
	controls->touchEnd( touches, event, self );
}



// Alert View delegate
-(void)alertView:(UIAlertView *)alertView clickedButtonAtIndex:(NSInteger)buttonIndex
{
    [[UIApplication sharedApplication] openURL:[NSURL URLWithString:@"http://igrapher.com"]];
}


-(void)setActivityState:(ActivityState)activityState
{
	toggleActivityState = activityState;
}


// AVAudioPlayerDelegate
-(void)audioPlayerDidFinishPlaying:(AVAudioPlayer*)player successfully:(BOOL)flag
{
    CCDeviceAudioManager::Ended( player, flag );
}


@end
