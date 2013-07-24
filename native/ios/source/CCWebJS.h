/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCWebJS.h
 * Description : WebJS interface.
 *
 * Created     : 04/08/12
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

#include "CCBaseTypes.h"

@interface CCWebJS : UIWebView<UIWebViewDelegate>
{
@public
    CCText currentUrl;
    bool loaded;
}

-(void)openPage:(const char*)url;
-(void)openFile:(const char*)file;
-(void)openData:(const char*)url data:(const char*)data;
-(void)remove;

-(const char*)getURL;
-(const char*)runJavaScript:(const char*)script;

@end