/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCDeviceControls.h
 * Description : Handles Android specific controls.
 *
 * Created     : 15/05/11
 * Author(s)   : Chris Bowers, Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

#ifndef __CCDEVICECONTROLS_H__
#define __CCDEVICECONTROLS_H__

struct UITouch
{
	CCPoint position;
};

#include "CCControls.h"

class CCDeviceControls : public CCControls
{
public:
	CCDeviceControls();

	// Handle JNI touch action call
	void touchAction(const float x, const float y, const int action, const int touchId);

	void touchBegin(UITouch *touch, const int touchIndex);
	void touchMove(UITouch *touch, const int touchIndex);
	void touchEnd(UITouch *touch);

protected:
	void touchHandle(UITouch *touch, const int touchIndex);

protected:
	UITouch deviceTouches[max_touches];
};


#endif // __CCDEVICECONTROLS_H__
