/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCGLView.h
 * Description : Windows specific view manager.
 *
 * Created     : 05/01/12
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

#ifndef __CCGLVIEW_H__
#define __CCGLVIEW_H__


extern class CCGLView *gView;


class CCGLView
{
public:
    CCGLView()
    {
        gView = this;

    	width = height = 0.0f;
    }

    ~CCGLView()
    {
        gView = NULL;
    }

	void resizeView(const float inWidth, const float inHeight)
	{
    	width = inWidth;
    	height = inHeight;
	}

    float getWidth() { return width; }
    float getHeight() { return height; }

protected:
    float width, height;
};


#endif // __CCGLVIEW_H__
