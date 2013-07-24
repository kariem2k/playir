/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCWebView.h
 * Description : Web view handler.
 *
 * Created     : 14/06/12
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

#ifndef __CCWEBVIEW_H__
#define __CCWEBVIEW_H__


class CCWebView
{
public:
    CCWebView();
    ~CCWebView();

    void openPage(const char *url);
    void urlLoadedGLThread(const char *url, const char *data, const bool loaded);

    const char* getURL() { return url.buffer; }
    const bool isLoaded() { return loaded; }

	static void ClearData();

protected:
	CCText url;
	bool loaded;
    bool hidden;
};


#endif // __CCWEBVIEW_H__
