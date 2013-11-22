/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCGLView.h
 * Description : OpenGL view.
 *
 * Created     : 01/03/10
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

#ifndef __CCGLVIEW_H__
#define __CCGLVIEW_H__


#import "CCDefines.h"
#import "CCViewController.h"
#import "CCInAppPurchaseManager.h"
#import "CCDeviceAudioManager.h"


@class CCGLView;
extern CCGLView *gView;
extern CCViewController *gViewController;

@interface CCGLView : UIView<UIAlertViewDelegate, AVAudioPlayerDelegate>
{
@public
    InAppPurchaseManager *inAppPurchaseManager;

    enum ActivityState
	{
		activity_none,
		activity_on,
		activity_off,
	};
@protected
	UIActivityIndicatorView *activityIndicator;
	ActivityState toggleActivityState;

//    double updateTime;
}

-(void)shutdown;

-(void)setup;

-(void)updateNativeThread;

-(void)setActivityState:(ActivityState)activityState;

@end


#endif // __CCGLVIEW_H__
