/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCWebJS.cpp
 *-----------------------------------------------------------
 */

#include "CCDefines.h"
#include "CCWebJS.h"
#include "CCAppManager.h"


static CCWebJS *webJS = NULL;


CCWebJS::CCWebJS()
{
	webJS = this;
	loaded = false;
}


CCWebJS::~CCWebJS()
{
	webJS = NULL;

	csActionStack.add( new CSAction( "CCWebJS::close" ) );
}


void CCWebJS::openPage(const char *url, const char *htmlData)
{
	// htmlData currently not supported, use openFile instead
	ASSERT( htmlData == NULL );

	loaded = false;

	csActionStack.add( new CSAction( "CCWebJS::openPage, ", url ) );
}


void CCWebJS::openFile(const char *filePath)
{
	loaded = false;

	//CCText filename = filePath;
	//filename.stripDirectory( true );
	//CCText webPath = "ms-appdata:///local/";
	//webPath += filename.buffer;
	//csActionStack.add( new CSAction( "CCWebJS::openPage, ", webPath.buffer ) );
	
	CCText filename = filePath;
	filename.stripDirectory( true );
	csActionStack.add( new CSAction( "CCWebJS::openFile, ", filename.buffer ) );

	//csActionStack.add( new CSAction( "CCWebJS::openFile, ", filePath ) );
}


void CCWebJS::LoadedPage(const char *url, const bool loaded)
{
	// TODO:
	CCText data;

	if( webJS != NULL )
	{
		webJS->url = url;
		webJS->loaded = loaded;
		CCAppManager::WebJSLoadedNativeThread( url, data.buffer );
	}
}


void CCWebJS::runJavaScript(const char *script, const bool returnResult)
{
	CCLAMBDA_2( RunCallback, CCWebJS, webJS, bool, returnResult, {
        CCWebJS::JavaScriptResult( (const char*)runParameters, returnResult );
    });
	jsActionStack.add( new JSAction( "CCWebJS::runJavaScript, ", script, new RunCallback( this, returnResult ) ) );
}


void CCWebJS::JavaScriptResult(const char *data, const bool returnResult)
{
	CCAppManager::WebJSJavaScriptResultNativeThread( data, returnResult );
}