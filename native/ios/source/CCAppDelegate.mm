/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCAppDelegate.mm
 *-----------------------------------------------------------
 */

#import "CCDefines.h"
#import "CCAppDelegate.h"
#import "CCAppManager.h"


@implementation CCAppDelegate


-(id)init
{
	self = [super init];
	if( self != NULL )
	{
	}

	return self;
}


-(void)applicationDidFinishLaunching:(UIApplication*)application
{
}


-(BOOL)application:(UIApplication*)application didFinishLaunchingWithOptions:(NSDictionary*)launchOptions
{
    CCAppManager::Startup();

    // Override point for customization after application launch.
    if( launchOptions != NULL )
    {
        NSURL *nsURL = [launchOptions objectForKey:@"UIApplicationLaunchOptionsURLKey"];
        if( nsURL != NULL )
        {
            NSString *nsString = [nsURL absoluteString];
            if( nsString != NULL )
            {
                CCText value = [nsString UTF8String];
                value.splitAfter( value, "multi://" );

                CURRENT_APP_ID = value.buffer;
                if( gEngine != NULL )
                {
                    gEngine->urlSchemeUpdate();
                }
            }
        }
    }

    return true;
}


-(BOOL)application:(UIApplication *)application openURL:(NSURL*)url sourceApplication:(NSString*)sourceApplication annotation:(id)annotation
{
    NSString *nsString = [url absoluteString];
    if( nsString != NULL )
    {
        CCText value = [nsString UTF8String];
        value.splitAfter( value, "multi://" );

        CURRENT_APP_ID = value.buffer;
        if( gEngine != NULL )
        {
            gEngine->urlSchemeUpdate();
        }
    }
    return true;
}


-(void)dealloc
{
	[super dealloc];
}


-(void)applicationWillTerminate:(UIApplication*)application
{
    CCAppManager::Shutdown();
}


-(void)applicationWillResignActive:(UIApplication*)application
{
    CCAppManager::Pause();
}


-(void)applicationDidBecomeActive:(UIApplication*)application
{
    CCAppManager::Resume();
}


-(void)applicationDidReceiveMemoryWarning:(UIApplication*)application
{
#ifdef DEBUGON
	NSLog( @"applicationDidReceiveMemoryWarning" );
#endif
    if( gEngine != NULL )
    {
        if( gEngine->paused == false )
        {
            CCLAMBDA_RUN_ENGINETHREAD({
                if( gEngine != NULL && gEngine->textureManager != NULL )
                {
                    gEngine->textureManager->trim();
                }
            });
        }
    }
}


@end

