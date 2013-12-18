/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCWebView.h
 * Description : Webview interface.
 *
 * Created     : 06/02/12
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

#include "CCViewController.h"
#include "CCBaseTypes.h"

@interface CCWebView : UIWebView<UIWebViewDelegate, CCRotateableView>
{
@protected
    UIView *viewContainer;
    UIToolbar *toolbar;

    UIInterfaceOrientation interfaceOrientation;

@public
    CCText currentUrl;
    bool loaded;
}

-(id)initWithView:(UIView*)parentView;
-(void)remove;

-(void)setOrientation:(UIInterfaceOrientation)inOrientation duration:(const float)duration;

-(void)openPage:(const char*)url;

-(const char*)getURL;
-(const char*)runJavaScript:(const char*)script;

+(void)ClearData;

@end