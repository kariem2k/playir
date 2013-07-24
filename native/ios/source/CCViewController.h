/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCViewController.h
 * Description : iOS view controller for handling orientation and views.
 *
 * Created     : 07/06/10
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

//#define USE_ADMOB

#ifdef USE_ADMOB
#import "GADBannerView.h"
#endif

@protocol CCRotateableView<NSObject>

-(void)setOrientation:(UIInterfaceOrientation)interfaceOrientation duration:(const float)duration;

@end


@interface CCViewController : UIViewController<UITextFieldDelegate>
{
#ifdef USE_ADMOB
    GADBannerView *adContainer;
    bool adEnabled;
#endif

@protected
    UIDeviceOrientation deviceOrientation;
    UIInterfaceOrientation interfaceOrientation;
    float orientationAngle;
	float orientationUpdateTimer;

    NSMutableArray *rotateableViews;

	UITextField *keyboardTextField;
}

-(void)toggleAdverts:(const bool)toggle;

-(void)detectOrientationUpdate:(const float)delta;

-(void)setOrientation:(const float)angle;
-(void)refreshOrientation:(const bool)instant;
-(UIInterfaceOrientation)getInterfaceOrientation;

-(void)registerRotateableView:(id<CCRotateableView>)view;
-(void)unregisterRotateableView:(id<CCRotateableView>)view;

-(void)keyboardToggle:(BOOL)show;

@end
