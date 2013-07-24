/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCARView.h
 * Description : Camera view for Augmented Reality.
 *
 * Created     : 03/09/11
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

#import <AVFoundation/AVFoundation.h>

@interface CCARView : UIView<AVCaptureVideoDataOutputSampleBufferDelegate>
{
@public
    AVCaptureSession *session;
}

-(void)remove;

@end
