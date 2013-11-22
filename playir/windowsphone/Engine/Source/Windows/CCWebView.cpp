/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCWebView.cpp
 *-----------------------------------------------------------
 */

#include "CCDefines.h"
#include "CCWebView.h"
#include "CCAppManager.h"


static CCWebView *webView = NULL;


CCWebView::CCWebView()
{
	webView = this;
	loaded = false;
}


CCWebView::~CCWebView()
{
	webView = NULL;

	csActionStack.add( new CSAction( "CCWebView::close" ) );
}


void CCWebView::openPage(const char *url)
{
	loaded = false;

	csActionStack.add( new CSAction( "CCWebView::openPage, ", url ) );
}


void CCWebView::LoadedPage(const char *url, const bool loaded)
{
	// TODO:
	CCText data;

	if( webView != NULL )
	{
		webView->url = url;
		webView->loaded = loaded;
		CCAppManager::WebViewLoadedNativeThread( url, data.buffer );
	}
}


void CCWebView::ClearData()
{
	class ThreadCallback : public CCLambdaCallback
    {
    public:
		ThreadCallback() {}
        void run()
        {
			csActionStack.add( new CSAction( "CCWebView::clearData" ) );
        }
    };
    gEngine->engineToNativeThread( new ThreadCallback() );

}