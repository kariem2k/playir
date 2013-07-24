/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCDeviceControls.h
 * Description : Windows specific controls interfaces.
 *
 * Created     : 05/01/12
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

#ifndef __CCDEVICECONTROLS_H__
#define __CCDEVICECONTROLS_H__


using namespace Windows::UI::Input;


struct UITouch
{
    UITouch()
    {
        touchID = -1;
    }

    CCPoint position;
    int touchID;
};

#include "CCControls.h"

class CCDeviceControls : public CCControls
{
public:
    CCDeviceControls();

    void touchBegin(PointerPoint^ point);
    void touchMove(PointerPoint^ point);
    void touchEnd(PointerPoint^ point);

protected:
	int getUITouchIndex(PointerPoint^ point);
    void touchHandle(const int touchIndex);

protected:
    UITouch uiTouches[max_touches];
};


#endif // __CCDEVICECONTROLS_H__
