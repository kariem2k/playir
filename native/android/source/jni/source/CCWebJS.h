/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCWebJS.h
 * Description : Web JS handler.
 *
 * Created     : 04/08/12
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

#ifndef __CCWEBJS_H__
#define __CCWEBJS_H__


class CCWebJS
{
public:
    CCWebJS();
    ~CCWebJS();

    void openPage(const char *url, const char *htmlData=NULL);
    void openFile(const char *file);
    void urlLoadedGLThread(const char *url, const char *data, const bool loaded);

    const char* getURL() { return url.buffer; }
    const bool isLoaded() { return loaded; }

	void runJavaScript(const char *script, const bool returnResult);

protected:
	CCText url;
	bool loaded;
};


#endif // __CCWEBJS_H__
