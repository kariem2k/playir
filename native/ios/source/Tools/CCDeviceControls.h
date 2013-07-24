/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCDeviceControls.h
 * Description : iOS specific controls interfaces.
 *
 * Created     : 01/03/10
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

#ifndef __CCDEVICECONTROLS_H__
#define __CCDEVICECONTROLS_H__


#include "CCControls.h"
#include "CCGLView.h"
#import <CoreMotion/CoreMotion.h>


class CCDeviceControls : public CCControls
{
public:
	CCDeviceControls();
    ~CCDeviceControls();

	void touchBegin(NSSet *touches, CCGLView *view);
	void touchMove(NSSet *touches, CCGLView *view);
	void touchEnd(NSSet *touches, UIEvent* event, CCGLView *view);

protected:
	int touchHandle(UITouch *touch, CCGLView *view);

public:
    CMMotionManager *motionManager;
};


#endif // __CCDEVICECONTROLS_H__