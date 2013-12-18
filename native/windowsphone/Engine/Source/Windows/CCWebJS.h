/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCWebJS.h
 * Description : Launches a javascript web view
 *
 * Created     : 05/01/12
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

#ifndef __CCWEBJS_H__
#define __CCWEBJS_H__


#include "CCJSON.h"

class CCWebJS : public virtual CCActiveAllocation
{
public:
    CCWebJS();
    ~CCWebJS();
	
	void openPage(const char *url, const char *htmlData);
	void openFile(const char *filePath);
	static void LoadedPage(const char *url, const bool loaded);

    const char* getURL() { return url.buffer; }
    const bool isLoaded() { return loaded; }

	void runJavaScript(const char *script, const bool returnResult);
	static void JavaScriptResult(const char *data, const bool returnResult);

protected:
	CCText url;
	bool loaded;
};


#endif  // __CCWEBJS_H__
