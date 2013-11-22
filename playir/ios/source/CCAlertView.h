/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCAlertView.h
 * Description : Oriented alert view.
 *
 * Created     : 21/12/11
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

#include "CCViewController.h"

@interface CCAlertView : UIAlertView<CCRotateableView>
{
@protected
    UIInterfaceOrientation interfaceOrientation;
    CGAffineTransform interfaceTransform;

@public
    bool shouldDismiss;
}

-(void)setOrientation:(UIInterfaceOrientation)inOrientation duration:(const float)duration;

@end
