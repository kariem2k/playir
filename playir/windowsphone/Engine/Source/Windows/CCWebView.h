/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCWebView.h
 * Description : Launches a web view.
 *
 * Created     : 05/01/12
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

#ifndef __CCWEBVIEW_H__
#define __CCWEBVIEW_H__


#include "CCJSON.h"

class CCWebView
{
public:
    CCWebView();
    ~CCWebView();

	void openPage(const char *url);
	static void LoadedPage(const char *url, const bool loaded);

    const char* getURL() { return url.buffer; }
    const bool isLoaded() { return loaded; }

	static void ClearData();

private:
	CCText url;
	bool loaded;
};


#endif  // __CCWEBVIEW_H__
