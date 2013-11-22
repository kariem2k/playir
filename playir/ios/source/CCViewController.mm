/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCViewController.mm
 *-----------------------------------------------------------
 */

#import "CCViewController.h"
#import "CCGLView.h"
#include "CCAppManager.h"

#ifdef USE_ADMOB
NSString *gAdMobPublisherID = NULL;
#endif


@implementation CCViewController


-(id)initWithNibName:(NSString*)nibNameOrNil bundle:(NSBundle*)nibBundleOrNil
{
    self = [super initWithNibName:nibNameOrNil bundle:nibBundleOrNil];
    if( self != NULL )
    {
        deviceOrientation = UIDeviceOrientationPortrait;
        interfaceOrientation = UIInterfaceOrientationPortrait;
        orientationAngle = 0.0f;
        orientationUpdateTimer = 0.0f;

        rotateableViews = [[NSMutableArray alloc] init];

        [[UIDevice currentDevice] beginGeneratingDeviceOrientationNotifications];
        {
            NSDictionary *info = [NSDictionary
                                  dictionaryWithContentsOfFile:[NSString stringWithFormat:@"%@/%@", [[NSBundle mainBundle] bundlePath], @"Info.plist"]];
            id launchOrientation = [info objectForKey:@"UIInterfaceOrientation"];
            NSString *interfaceOrientationString = (NSString*)launchOrientation;

            if( [interfaceOrientationString compare:@"UIInterfaceOrientationPortraitUpsideDown"] == NSOrderedSame )
            {
                deviceOrientation = UIDeviceOrientationPortraitUpsideDown;
            }
            else if( [interfaceOrientationString compare:@"UIInterfaceOrientationLandscapeLeft"] == NSOrderedSame )
            {
                deviceOrientation = UIDeviceOrientationLandscapeRight;
            }
            else if( [interfaceOrientationString compare:@"UIInterfaceOrientationLandscapeRight"] == NSOrderedSame )
            {
                deviceOrientation = UIDeviceOrientationLandscapeLeft;
            }

            interfaceOrientation = GetInterfaceOrientation( deviceOrientation );
        }

        // Keyboard
        {
            keyboardTextField = [[UITextField alloc] initWithFrame:self.view.frame];

            keyboardTextField.autocapitalizationType = UITextAutocapitalizationTypeNone;
            keyboardTextField.autocorrectionType = UITextAutocorrectionTypeNo;
            keyboardTextField.keyboardType = UIKeyboardTypeNamePhonePad;
            keyboardTextField.returnKeyType = UIReturnKeyDone;
            keyboardTextField.delegate = self;
            keyboardTextField.hidden = true;
            [self.view addSubview:keyboardTextField];

            [[NSNotificationCenter defaultCenter] addObserver:self
                                                     selector:@selector(textFieldDidChange:)
                                                         name:UITextFieldTextDidChangeNotification
                                                       object:keyboardTextField];

            [[NSNotificationCenter defaultCenter] addObserver:self
                                                     selector:@selector(keyboardDidShow:)
                                                         name:UIKeyboardDidShowNotification
                                                       object:nil];
        }
    }
    return self;
}


-(void)dealloc
{
    [rotateableViews release];

    // Keyboard
    [[NSNotificationCenter defaultCenter] removeObserver:self
                                                    name:UITextFieldTextDidChangeNotification
                                                  object:keyboardTextField];

    [[NSNotificationCenter defaultCenter] removeObserver:self
                                                 name:UIKeyboardDidShowNotification
                                                  object:nil];

    [super dealloc];
}


// Implement loadView to create a view hierarchy programmatically, without using a nib.
-(void)loadView
{
    self.view = gView;
}


-(void)viewDidLoad
{
    [super viewDidLoad];
}


-(void)viewDidUnload
{
	// Release any retained subviews of the main view.
	// e.g. self.myOutlet = NULL;
#ifdef USE_ADMOB
    if( adContainer != NULL )
    {
        [adContainer release];
        adContainer = NULL;
    }
#endif
}


-(BOOL)shouldAutorotate
{
    return false;
}


-(NSUInteger)supportedInterfaceOrientations
{
    return UIInterfaceOrientationMaskAll;
}

-(UIInterfaceOrientation)preferredInterfaceOrientationForPresentation
{
    return UIInterfaceOrientationLandscapeRight;
}


-(void)toggleAdverts:(const bool)toggle
{
#ifdef USE_ADMOB
    if( toggle )
    {
        if( adContainer == NULL )
        {
            if( gAdMobPublisherID != NULL )
            {
                adEnabled = true;

                const float screenWidth = self.view.frame.size.width;
                const float adWidth = GAD_SIZE_320x50.width;
                const float startX = ( screenWidth - adWidth ) * 0.5f;
                const float startY = self.view.frame.size.height - GAD_SIZE_320x50.height;

                // Create a view of the standard size at the bottom of the screen.
                adContainer = [[GADBannerView alloc]
                               initWithFrame:CGRectMake( startX,
                                                         startY,
                                                         GAD_SIZE_320x50.width,
                                                         GAD_SIZE_320x50.height )];

                // Specify the ad's "unit identifier." This is your AdMob Publisher ID.
                adContainer.adUnitID = gAdMobPublisherID;

                // Let the runtime know which UIViewController to restore after taking
                // the user wherever the ad goes and add it to the view hierarchy.
                adContainer.rootViewController = self;
                [self.view addSubview:adContainer];

                // Initiate a generic request to load it with an ad.
                [adContainer loadRequest:[GADRequest request]];

                [self refreshOrientation:false];
            }
        }
        else if( adEnabled == false )
        {
            adEnabled = true;
            [self refreshOrientation:true];
        }
    }
    else
    {
        if( adContainer != NULL )
        {
            if( adEnabled )
            {
                adEnabled = false;
                [self refreshOrientation:true];
            }
        }
    }
#endif
}


static const UIInterfaceOrientation GetInterfaceOrientation(UIDeviceOrientation orientation)
{
	if( orientation == UIDeviceOrientationPortraitUpsideDown )
	{
		return UIInterfaceOrientationPortraitUpsideDown;
	}
	else if( orientation == UIDeviceOrientationLandscapeRight )
	{
		return UIInterfaceOrientationLandscapeLeft;
	}
	else if( orientation == UIDeviceOrientationLandscapeLeft )
	{
		return UIInterfaceOrientationLandscapeRight;
	}
    return UIInterfaceOrientationPortrait;
}


static const float GetOrientationAngle(UIDeviceOrientation orientation)
{
    if( orientation == UIDeviceOrientationPortraitUpsideDown )
    {
        return 180.0f;
    }
    else if( orientation == UIDeviceOrientationLandscapeRight )
	{
        return 90.0f;
	}
	else if( orientation == UIDeviceOrientationLandscapeLeft )
	{
        return 270.0;
	}
    return 0.0f;
}


-(void)detectOrientationUpdate:(const float)delta
{
    orientationUpdateTimer -= delta;
    if( orientationUpdateTimer <= 0.0f )
    {
        UIDeviceOrientation detectedDeviceOrientation = [[UIDevice currentDevice] orientation];
        if( detectedDeviceOrientation >= UIDeviceOrientationPortrait && detectedDeviceOrientation <= UIDeviceOrientationLandscapeRight )
        {
            if( detectedDeviceOrientation != deviceOrientation )
            {
                const float angle = GetOrientationAngle( detectedDeviceOrientation );
                if( gEngine->isOrientationSupported( angle ) )
                {
                    deviceOrientation = detectedDeviceOrientation;
                    [self refreshOrientation:true];
                }
            }
        }
        orientationUpdateTimer += 0.5f;
    }
}



-(void)setOrientation:(const float)angle interpolate:(const bool)interpolate
{
    UIDeviceOrientation orientation = UIDeviceOrientationPortrait;
    if( angle == 90.0f )
    {
        orientation = UIDeviceOrientationLandscapeRight;
    }
    else if( angle == 180.0f )
    {
        orientation = UIDeviceOrientationPortraitUpsideDown;
    }
    else if( angle == 270.0f )
    {
        orientation = UIDeviceOrientationLandscapeLeft;
    }

    if( orientation != deviceOrientation )
    {
        self->deviceOrientation = orientation;
        [self refreshOrientation:interpolate];
    }
}


-(void)refreshOrientation:(const bool)interpolate
{
	interfaceOrientation = GetInterfaceOrientation( deviceOrientation );
    orientationAngle = GetOrientationAngle( deviceOrientation );

	[[UIApplication sharedApplication] setStatusBarOrientation:interfaceOrientation animated:interpolate];

    CCAppManager::SetOrientation( orientationAngle, interpolate );

    {
        const uint length = [rotateableViews count];
        for( uint i=0; i<length; ++i )
        {
            id<CCRotateableView> view = [rotateableViews objectAtIndex:i];
            [view setOrientation:interfaceOrientation duration:0.5f];
        }
    }

#ifdef USE_ADMOB
    if( adContainer != NULL )
    {
        if( interpolate )
        {
            [UIView beginAnimations:@"View Flip" context:nil];
            [UIView setAnimationDuration:0.5f];
            [UIView setAnimationCurve:UIViewAnimationCurveEaseInOut];
        }

        CGRect screenRect = self.view.frame;
        CGRect adRect = [adContainer bounds];

        CGSize screenSize = screenRect.size;
        CGSize adSize = adRect.size;

        const CGSize adHSize = CGSizeMake( adSize.width * 0.5f, adSize.height * 0.5f );
        if( interfaceOrientation == UIInterfaceOrientationLandscapeLeft )
        {
            CGAffineTransform transform = CGAffineTransformMakeRotation( CC_DEGREES_TO_RADIANS( 270.0f ) );
            if( adEnabled )
            {
                transform = CGAffineTransformTranslate( transform,
                                                        ( screenSize.height * 0.5f ) - adHSize.height,
                                                        ( screenSize.width * 0.5f ) - adHSize.height );
            }
            else
            {
                transform = CGAffineTransformTranslate( transform,
                                                        ( screenSize.height * 0.5f ) - adHSize.height,
                                                        ( screenSize.width * 0.5f ) + adHSize.height );
            }
            adContainer.transform = transform;
        }
        else if( interfaceOrientation == UIInterfaceOrientationLandscapeRight )
        {
            CGAffineTransform transform = CGAffineTransformMakeRotation( CC_DEGREES_TO_RADIANS( 90.0f ) );
            if( adEnabled )
            {
                transform = CGAffineTransformTranslate( transform,
                                                        -( screenSize.height * 0.5f ) + adHSize.height,
                                                        ( screenSize.width * 0.5f ) - adHSize.height );
            }
            else
            {
                transform = CGAffineTransformTranslate( transform,
                                                        -( screenSize.height * 0.5f ) + adHSize.height,
                                                        ( screenSize.width * 0.5f ) + adHSize.height );
            }
            adContainer.transform = transform;
        }
        else if( interfaceOrientation == UIInterfaceOrientationPortraitUpsideDown )
        {
            CGAffineTransform transform = CGAffineTransformMakeRotation( CC_DEGREES_TO_RADIANS( 180.0f ) );
            if( adEnabled )
            {
                transform = CGAffineTransformTranslate( transform, 0.0f, screenSize.height - ( adHSize.height * 2.0f ) );
            }
            else
            {
                transform = CGAffineTransformTranslate( transform, 0.0f, screenSize.height );
            }
            adContainer.transform = transform;
        }
        else
        {
            CGAffineTransform transform = CGAffineTransformMakeRotation( CC_DEGREES_TO_RADIANS( 0.0f ) );
            if( adEnabled )
            {
            }
            else
            {
                transform = CGAffineTransformMakeTranslation( 0.0f, GAD_SIZE_320x50.height );
            }
            adContainer.transform = transform;
        }

        adContainer.alpha = adEnabled ? 1.0f : 0.0f;

        if( interpolate )
        {
            [UIView commitAnimations];
        }
    }
#endif
}


-(UIInterfaceOrientation)getInterfaceOrientation
{
    return interfaceOrientation;
}


-(void)registerRotateableView:(id<CCRotateableView>)view
{
    [rotateableViews addObject:view];
}


-(void)unregisterRotateableView:(id<CCRotateableView>)view
{
    [rotateableViews removeObject:view];
}


// Keyboard
-(void)keyboardDidShow:(NSNotification*)notification
{
//    NSDictionary* keyboardInfo = [notification userInfo];
//    NSValue* keyboardFrameBegin = [keyboardInfo valueForKey:UIKeyboardFrameBeginUserInfoKey];
//    CGRect keyboardFrameBeginRect = [keyboardFrameBegin CGRectValue];
//    keyboardFrameBeginRect = keyboardFrameBeginRect;
}


-(void)textFieldDidChange:(NSNotification*)notification
{
    const char *text = [keyboardTextField.text UTF8String];
    keyboardTextField.text = [NSString stringWithFormat:@" "];

    const int characters = strlen( text );
    
    for( int i=0; i<CCAppManager::KeyboardUpdateCallbacks.length; ++i )
    {
        CCTextCallback *callback = CCAppManager::KeyboardUpdateCallbacks.list[i];
        if( characters == 0 )
        {
            callback->add( "backspace", 0 );
        }
        else
        {
            callback->add( &text[1], 0 );
        }
        CCLAMBDA_1_UNSAFE( ReRunCallback, CCTextCallback*, callback, {
            // Make sure our callback is still valid - Improve by using LazyCallbacks
            for( int i=0; i<CCAppManager::KeyboardUpdateCallbacks.length; ++i )
            {
                if( callback == CCAppManager::KeyboardUpdateCallbacks.list[i] )
                {
                    callback->safeRun();
                    break;
                }
            }
        });
        gEngine->nativeToEngineThread( new ReRunCallback( callback ) );
    }
}


-(BOOL)textFieldShouldReturn:(UITextField*)inTextField
{
    if( inTextField == keyboardTextField )
	{
        [self keyboardToggle:false];
        for( int i=0; i<CCAppManager::KeyboardUpdateCallbacks.length; ++i )
        {
            CCTextCallback *callback = CCAppManager::KeyboardUpdateCallbacks.list[i];
            callback->add( "return", 0 );
            CCLAMBDA_1_UNSAFE( ReRunCallback, CCTextCallback*, callback,
            {
                // Make sure our callback is still valid - Improve by using LazyCallbacks
                for( int i=0; i<CCAppManager::KeyboardUpdateCallbacks.length; ++i )
                {
                    if( callback == CCAppManager::KeyboardUpdateCallbacks.list[i] )
                    {
                        callback->safeRun();
                        break;
                    }
                }
            });
            gEngine->nativeToEngineThread( new ReRunCallback( callback ) );
        }
	}
	return true;
}


-(void)keyboardToggle:(BOOL)show
{
    if( show )
    {
        if( [keyboardTextField isFirstResponder] == false )
        {
            keyboardTextField.text = [NSString stringWithFormat:@" "];
            [keyboardTextField becomeFirstResponder];
        }
    }
    else if( [keyboardTextField isFirstResponder] )
    {
		[keyboardTextField resignFirstResponder];
    }
}


@end
