/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCJNIWebView.java
 * Description : Interfaces with ndk on web page load.
 * 				 JavaScript evaluation based on this tutorial
 * 				 http://www.gutterbling.com/blog/synchronous-javascript-evaluation-in-android-webview/
 *
 * Created     : 09/10/11
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

package com.android2c;

import android.annotation.SuppressLint;
import android.content.Context;
import android.view.Display;
import android.view.View;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.RelativeLayout;
import android.view.WindowManager;


@SuppressLint("SetJavaScriptEnabled")
class CCJNIWebView extends WebView
{
	public CCJNIWebView(Context context)
    {
        super( context );

        WindowManager windowManager = (WindowManager)context.getSystemService( Context.WINDOW_SERVICE );
        Display display = windowManager.getDefaultDisplay();
        final int screenWidth = display.getWidth();
        final int screenHeight = display.getHeight();

        final float width = screenWidth * 0.95f;
        final float height = screenHeight * 0.975f;
        final float x = ( screenWidth - width ) * 0.5f;
        final float y = ( screenHeight - height ) * 0.5f;

        RelativeLayout.LayoutParams viewParams = new RelativeLayout.LayoutParams( (int)width, (int)height );
        viewParams.leftMargin = (int)x;
        viewParams.topMargin = (int)y;
    	setLayoutParams( viewParams );

    	// Allow keyboard input
    	requestFocus( View.FOCUS_DOWN );

    	{
	    	WebSettings settings = getSettings();
	    	settings.setJavaScriptEnabled( true );

	    	// enable to use "window.localStorage['my']='hello1'", in webview js on >= android 2.0
	    	settings.setDomStorageEnabled( true );

	    	// if no set or wrong path, variables disappear on killed
	    	settings.setDatabasePath( "/data/data/" + context.getPackageName() + "/databases/" );

	    	// Specific setting for 2Play
	    	settings.setCacheMode( WebSettings.LOAD_NO_CACHE );
    	}

    	setWebViewClient(new WebViewClient()
    	{
    		public void onPageFinished(WebView view, final String url)
    		{
    			CCJNIGLView.runOnGLThread(new Runnable()
				{
					public void run()
					{
						CCJNI.WebViewURLLoadedGLThread( url, "", true );
					}
				});
    		}

    		public void onReceivedError(WebView view, int errorCode, String description, final String failingUrl)
    		{
    			CCJNIGLView.runOnGLThread(new Runnable()
				{
					public void run()
					{
						CCJNI.WebViewURLLoadedGLThread( failingUrl, "", false );
					}
				});
    		}

			public boolean shouldOverrideUrlLoading(WebView view, String url)
    	    {
    	        // Open the url rather than launch in a web browser window
    	        view.loadUrl( url );
    	        return false;
    	    }
    	});
    }
}
