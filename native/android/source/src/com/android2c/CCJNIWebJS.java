/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCJNIWebJS.java
 * Description : Interfaces with ndk on web page load.
 * 				 JavaScript evaluation based on this tutorial
 * 				 http://www.gutterbling.com/blog/synchronous-javascript-evaluation-in-android-webview/
 *
 * Created     : 09/10/11
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

package com.android2c;

import java.util.ArrayList;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.util.Log;
import android.webkit.ConsoleMessage;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.graphics.Bitmap;
import android.webkit.JsResult;


@SuppressLint("SetJavaScriptEnabled")
class CCJNIWebJS extends WebView
{
    static CCJNIWebJS webView = null;

	// Provides an interface for running JavaScript calls
	public class JavaScriptInterface
	{
		// The JavaScript interface name for adding to web view.
		private final String interfaceName = "CCJS";

		private class JavaScriptCall
		{
			String script;
			boolean returnResult;
			boolean calledFromJava;

			public JavaScriptCall(final String script, final boolean returnResult, final boolean calledFromJava)
			{
				this.script = script;
				this.returnResult = returnResult;
				this.calledFromJava = calledFromJava;
			}
		}
		JavaScriptCall runningScript = null;
        private ArrayList<JavaScriptCall> pendingScripts = new ArrayList<JavaScriptCall>();

        // Evaluates the expression for Java (usually on pause/resume)
 		public synchronized void forceRunJavaScript(final String script)
 		{
 			if( webView != null && webView.loaded )
 			{
				if( CCJNI.DEBUGJS )
				{
					String trimmed = script;
//     				trimmed = trimmed.replace( "\n", "" );
//     				trimmed = trimmed.replace( "\r", "" );
//     				if( trimmed.length() > 20 )
//     				{
//     					trimmed = trimmed.substring( 0, 20 );
//     				}
					Log.d( "WebJS: Run", trimmed );
				}

				String code = "javascript: " + script;
				webView.loadUrl( code );
 			}
 		}


	 	// Evaluates the expression and returns the value.
		public synchronized void runJavaScript(final String script, final boolean returnResult, final boolean calledFromJava)
		{
			if( webView != null && webView.loaded )
			{
				if( runningScript == null )
				{
					if( CCJNI.DEBUGJS )
					{
						String trimmed = script;
//						trimmed = trimmed.replace( "\n", "" );
//						trimmed = trimmed.replace( "\r", "" );
//						if( trimmed.length() > 20 )
//						{
//							trimmed = trimmed.substring( 0, 20 );
//						}
						Log.d( "WebJS: Run", trimmed );
					}

					runningScript = new JavaScriptCall( script, returnResult, calledFromJava );
					if( returnResult )
					{
						String code = "javascript:var result=" + script + "\nwindow." + interfaceName + ".javaScriptResult( result );";
						webView.loadUrl( code );
					}
					else
					{
						String code = "javascript: " + script;
						webView.loadUrl( code );
						javaScriptResult( "true" );
					}
				}
				else
				{
					pendingScripts.add( new JavaScriptCall( script, returnResult, calledFromJava ) );
				}
			}
		}

		// Receives the value from the JavaScript.
		public synchronized void javaScriptResult(final String result)
		{
			if( CCJNI.DEBUGJS )
			{
				String trimmed = result;
				trimmed = trimmed.replace( "\n", "" );
				trimmed = trimmed.replace( "\r", "" );
				if( trimmed.length() > 20 )
				{
					trimmed = trimmed.substring( 0, 20 );
				}
				else if( trimmed.length() == 0 )
				{
					trimmed = " ";
				}
				Log.d( "WebJS: Result", trimmed );
			}

			if( !runningScript.calledFromJava )
			{
				final boolean returnResult = runningScript.returnResult;
				CCJNIGLView.runOnGLThread(new Runnable()
				{
					public void run()
					{
						CCJNI.WebJSJavaScriptResultGLThread( result, returnResult );
					}
				});
			}
			runningScript = null;

			if( pendingScripts.size() > 0 )
			{
		    	final JavaScriptCall script = pendingScripts.remove( 0 );
		    	CCJNI.Activity.runOnUiThread(new Runnable()
				{
					public void run()
					{
						runJavaScript( script.script, script.returnResult, script.calledFromJava );
					}
			    });
			}
		}

		public String getInterfaceName()
		{
			return this.interfaceName;
		}
	}



	JavaScriptInterface jsInterface;
	boolean loading = false;
	int errorCode = 0;
    boolean loaded = false;

    public CCJNIWebJS(Activity activity)
    {
        super( activity );

    	webView = this;

    	// Allow keyboard input
    	//requestFocus( View.FOCUS_DOWN );

    	{
	    	WebSettings settings = getSettings();
	    	settings.setJavaScriptEnabled( true );

	    	// enable to use "window.localStorage['my']='hello1'", in webview js on >= android 2.0
	    	settings.setDomStorageEnabled( true );

	    	// if no set or wrong path, variables disappear on killed
	    	settings.setDatabasePath( "/data/data/" + activity.getPackageName() + "/databases/" );

	    	// No caching
	    	//settings.setAppCacheEnabled( false );
	    	settings.setCacheMode( WebSettings.LOAD_NO_CACHE );
    	}

    	jsInterface = new JavaScriptInterface();
    	addJavascriptInterface( jsInterface, jsInterface.getInterfaceName() );

    	if( CCJNI.DEBUGJS )
    	{
	    	setWebChromeClient(new WebChromeClient()
	    	{
	    		  public void onConsoleMessage(String message, int lineNumber, String sourceID)
	    		  {
	  				  Log.d( "WebJS", message + " -- line " + lineNumber + " " + sourceID );
	    		  }

	    		  public boolean onConsoleMessage(ConsoleMessage cm)
	    		  {
    				  String message = cm.message();
    				  Log.d( "WebJS", message + " -- line " + cm.lineNumber() + " " + cm.sourceId() );
	    			  return true;
	    		  }

	    		  public boolean onJsAlert(WebView view, String url, String message, JsResult result)
	    		  {
	    			  return false;
	    		  }

	    		  public boolean onJsTimeout()
	    		  {
	    			  return false;
	    		  }
	    	});
    	}

    	setWebViewClient(new WebViewClient()
    	{
			public boolean shouldOverrideUrlLoading(WebView view, final String url)
    	    {
    	        // do your handling codes here, which url is the requested url
    	        // probably you need to open that url rather than redirect:
    	        view.loadUrl( url );
    	        CCJNIGLView.runOnGLThread(new Runnable()
				{
					public void run()
					{
						CCJNI.WebJSURLLoadedGLThread( url, "", false );
					}
				});
    	        return false; // then it is not handled by default action
    	    }

			public void onLoadResource(WebView view, String url)
			{
				super.onLoadResource( view, url );
			}

			public void onPageStarted(WebView view, String url, Bitmap favicon)
			{
				super.onPageStarted( view, url, favicon );
			}

    	    public void onPageFinished(WebView view, final String url)
    	    {
    	    	if( loading )
    	    	{
    	    		loading = false;
		    		final boolean success = errorCode == 0 ? true : false;
		    		CCJNIGLView.runOnGLThread(new Runnable()
					{
						public void run()
						{
							if( success )
							{
								loaded = true;
							}
							CCJNI.WebJSURLLoadedGLThread( url, "", success );
						}
					});
    	    	}
    	    }

    	    public void onReceivedError(WebView view, int inErrorCode, String description, String failingUrl)
    	    {
    	    	errorCode = inErrorCode;
    	    	onPageFinished( view, failingUrl );
    	    }
    	});
    }

    public void open(final String url, final String htmlData)
    {
    	loading = true;
    	if( htmlData != null )
    	{
    		loadDataWithBaseURL( url, htmlData, "text/html", "UTF-8", null );
    	}
    	else
    	{
    		loadUrl( url );
    	}
    }

    @Override
    public void destroy()
    {
    	webView = null;
    	super.destroy();
    }

    public void runJavaScript(final String script, final boolean returnResult, final boolean calledFromJava)
    {
    	CCJNI.Activity.runOnUiThread(new Runnable()
    	{
    		public void run()
    		{
    			jsInterface.runJavaScript( script, returnResult, calledFromJava );
    		}
    	});
    }

    public void forceRunJavaScript(final String script)
    {
    	CCJNI.Activity.runOnUiThread(new Runnable()
    	{
    		public void run()
    		{
    			jsInterface.forceRunJavaScript( script );
    		}
    	});
    }
}
