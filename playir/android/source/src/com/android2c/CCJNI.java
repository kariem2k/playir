/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCJNI.java
 * Description : Interfaces with ndk library.
 *
 * Created     : 09/10/11
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

package com.android2c;

import java.io.File;

import com.android.gcm.GCMRegistrar;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Environment;
import android.util.DisplayMetrics;
import android.util.Log;
import android.view.View;
import android.view.inputmethod.InputMethodManager;
import android.webkit.CookieManager;


// Wrapper for native library
public class CCJNI
{
	static final String library = "ccjni";
	public static final boolean DEBUG = false;
	public static final boolean DEBUGJS = false;

	static CCActivity Activity;
	static String DataPath;
	static String PackageName;



	// Load our library
	static
 	{
 		System.loadLibrary( CCJNI.library );
 		System.out.println();
 	}



    public static void SetActivity(CCActivity inActivity)
    {
    	CCJNI.Activity = inActivity;
    	PackageName = Activity.getPackageName();
    	DataPath = Activity.getFilesDir().getAbsolutePath();

    	// Check if a SD Card is available
    	final String state = Environment.getExternalStorageState();
        if( Environment.MEDIA_MOUNTED.equals( state ) )
        {
	    	final File externalStorage = Environment.getExternalStorageDirectory();
			final String appPath = externalStorage.getAbsolutePath() + "/Android/data/" + PackageName + "/cache";
			final File appDirectory = new File( appPath );
			if( !appDirectory.exists() )
			{
				appDirectory.mkdirs();
			}
        	DataPath = appPath;
        }

    	FileManagerSetPaths( Activity.getPackageResourcePath(), DataPath );

    	// Set the screen dpi
    	{
    		DisplayMetrics dm = new DisplayMetrics();
    		Activity.getWindowManager().getDefaultDisplay().getMetrics( dm );
    		float xDpi = dm.xdpi;
    		float yDpi = dm.ydpi;
    		ControlsSetDPI( xDpi, yDpi );
    	}
    }



 	// main
	public static native void OnSurfaceChanged(final boolean firstRun, final int width, final int height);
	public static native void OnDrawFrame();

	public static native void OnJobsThread();

	public static native void AppPausedUIThread();
	public static native void AppResumedUIThread();

	private static void Assert(final String file, final int line, final String message)
	{
		if( CCJNI.DEBUG )
    	{
			Log.e( CCJNI.library, String.format( "%s: Assert: %i %s", line, message ) );
    	}
	}



	// CCRenderer
 	private static void CCDeviceRendererResolve()
	{
 		//activity.glView.requestRender();
 	}



	// CCTexture2D
	private static boolean Texture2DDoesTextureExist(final String filename, final boolean packaged)
	{
		return CCJNITexture2D.DoesTextureExist( filename, packaged );
	}

	private static boolean Texture2DLoad(final String filename, final boolean packaged)
	{
		return CCJNITexture2D.Load( filename, packaged );
	}

	private static int Texture2DGetImageWidth(final String filename, final boolean packaged)
	{
		return CCJNITexture2D.GetImageWidth( filename, packaged );
	}

	private static int Texture2DGetImageHeight(final String filename, final boolean packaged)
	{
		return CCJNITexture2D.GetImageHeight( filename, packaged );
	}

	private static int Texture2DGetRawWidth(final String filename, final boolean packaged)
	{
		return CCJNITexture2D.GetRawWidth( filename, packaged );
	}

	private static int Texture2DGetRawHeight(final String filename, final boolean packaged)
	{
		return CCJNITexture2D.GetRawHeight( filename, packaged );
	}

	private static int Texture2DGetAllocatedHeight(final String filename, final boolean packaged)
	{
		return CCJNITexture2D.GetAllocatedHeight( filename, packaged );
	}

	private static int Texture2DCreateGL(final String filename, final boolean packaged, final boolean mipmap)
	{
		return CCJNITexture2D.CreateGL( filename, packaged, mipmap );
	}



	// CCDeviceControls
	public static native void ControlsSetDPI(float xDpi, float yDpi);

	public static void ControlsHandleTouch(final float x, final float y, final int actionType, final int finger)
	{
		CCJNIGLView.runOnGLThread(new Runnable()
 		{
 			public void run()
 			{
 				ControlsHandleTouchGLThread( x, y, actionType, finger );
 			}
 		});
	}
	public static native void ControlsHandleTouchGLThread(float x, float y, int actionType, int finger);

	public static native boolean ControlsHandleBackButton();

	private static void ControlsKeyboardToggle(final boolean show)
	{
		Activity.runOnUiThread(new Runnable()
		{
		    public void run()
		    {
		        InputMethodManager imm = (InputMethodManager)Activity.getSystemService( Context.INPUT_METHOD_SERVICE );

		    	View view = Activity.textView;
		        if( show )
		        {
		        	view.setVisibility( View.VISIBLE );
		        	if( view.requestFocus() )
		        	{
		        		imm.showSoftInput( view, InputMethodManager.SHOW_FORCED );
		        	}
		        }
		        else
		        {
	            	view.setVisibility( View.INVISIBLE );
		        	imm.hideSoftInputFromWindow( view.getWindowToken(), 0 );
		        }
		    }
		});
	}

	public static native void ControlsKeyboardUpdate(String key);



	// CCDeviceAudioManager
	private static void AudioManagerReset()
	{
		CCJNIAudioManager.Reset();
	}

	private static void AudioManagerPrepare(final String id, final String url, String path)
	{
		CCJNIAudioManager.Prepare( id, url, path );
	}

	private static void AudioManagerPlay(final String id, final String url, String path, final boolean restart, final boolean loop)
	{
		CCJNIAudioManager.Play( id, url, path, restart, loop );
	}

	private static void AudioManagerStop(final String id)
	{
		CCJNIAudioManager.Stop( id );
	}

	private static void AudioManagerPause(final String id)
	{
		CCJNIAudioManager.Pause( id );
	}

	private static void AudioManagerResume(final String id)
	{
		CCJNIAudioManager.Resume( id );
	}

	private static void AudioManagerSetTime(final String id, final float time)
	{
		CCJNIAudioManager.SetTime( id, time );
	}

	private static void AudioManagerSetVolume(final String id, final float volume)
	{
		CCJNIAudioManager.SetVolume( id, volume );
	}

	public static native void AudioManagerEnded(String id, String url);



	// CCDeviceFileManager
	public static native void FileManagerSetPaths(String apkPath, String dataPath);



	// CCDeviceURLManager
	static CCJNIURLManager URLManager = null;

	private static void URLManagerProcessRequest(final String url, final byte[] postData, final int postDataLength, final String postBoundary)
	{	
		new Thread(new Runnable()
		{
			public void run()
		    {
			 	if( URLManager == null )
			 	{
			 		URLManager = new CCJNIURLManager();
			 	}
			 	URLManager.processRequest( url, postData, postDataLength, postBoundary );
		 	}
		}).start();
	}

 	public static void URLManagerDownloadFinishedUIThread(final String url, final boolean success, final byte[] data, final int dataLength,
 														  final String[] headerNames, final String[] headerValues, final int headerLength)
 	{
 		CCJNIGLView.runOnGLThread(new Runnable()
 		{
 			public void run()
 			{
 				URLManagerDownloadFinished( url, success, data, dataLength, headerNames, headerValues, headerLength );
 			}
 		});
 	}

 	public static native void URLManagerDownloadFinished(String url, boolean success, byte[] data, int dataLength,
 														 String[] headerNames, String[] headerValues, int headerLength);


 	// CCJNI
 	private static void WebBrowserOpen(final String url)
 	{
 		Activity.runOnUiThread(new Runnable()
		{
		    public void run()
		    {
		 		Intent intent = new Intent( Intent.ACTION_VIEW, Uri.parse( url ) );
		 		Activity.startActivity( intent );
		    }
		});
 	}



 	private static void WebViewOpen(final String url, final boolean hidden)
	{
 		Activity.webViewOpen( url, hidden );
 	}

 	private static void WebViewClose()
	{
 		Activity.webViewClose();
 	}

 	private static void WebViewClearData()
	{
 		Activity.runOnUiThread(new Runnable()
		{
		    public void run()
		    {
		 		try
		 		{
		 			CookieManager cookieManager = CookieManager.getInstance();
		 			cookieManager.removeAllCookie();
		 		}
		        catch( Exception e )
		        {
		        	e.printStackTrace();
		        }
		    }
		});
 	}

 	public static native void WebViewURLLoadedGLThread(String url, String data, boolean loaded);



 	private static void WebJSOpen(final String url, final String htmlData)
	{
 		Activity.webJSOpen( url, htmlData );
 	}

 	private static void WebJSRunJavaScript(final String script, final boolean returnResult)
	{
 		Activity.webJSRunJavaScript( script, returnResult, false );
 	}

 	public static native void WebJSJavaScriptResultGLThread(String data, final boolean returnResult);

 	private static void WebJSClose()
	{
 		Activity.webJSClose();
 	}

 	public static native void WebJSURLLoadedGLThread(String url, String data, boolean loaded);



  	private static void VideoViewStart(final String file)
 	{
  		Activity.videoViewStart( file );
  	}

  	private static void VideoViewStop()
 	{
  		Activity.videoViewStop();
  	}



  	// Google Services
  	private static void GoogleServicesRegister(final String ANDROID_ID)
  	{
  		Activity.runOnUiThread(new Runnable()
		{
		    public void run()
		    {
		    	Activity.googleServicesRegister( ANDROID_ID );

		    	// Also register our app rater which points to Google Play
		    	CCAppRater.app_launched( Activity );
		    }
		});
  	}

 	private static void AdvertsToggle(final boolean toggle)
 	{
 		Activity.toggleAdverts( toggle );
 	}

  	private static void BillingRequestPurchase(final String productID, final boolean consumable)
  	{
  		Activity.runOnUiThread(new Runnable()
		{
		    public void run()
		    {
		 		Activity.requestPurchase( productID, consumable );
		    }
		});
  	}

	public static native void BillingItemPurchasedGLThread();

  	private static void GCMRegister()
	{
  		Activity.runOnUiThread(new Runnable()
		{
		    public void run()
		    {
		 		final String registrationID = GCMRegistrar.getRegistrationId( Activity );
		  		if( registrationID.length() > 0 )
		  		{
			  		String javascriptFunctionCall = "GCMRegister( \"";
			  		javascriptFunctionCall += registrationID;
			  		javascriptFunctionCall += "\" );";
			  		Activity.webJSRunJavaScript( javascriptFunctionCall, false, false );
		  		}
		    }
		});
	}

  	private static void GCMUnregister()
	{
  		Activity.runOnUiThread(new Runnable()
		{
		    public void run()
		    {
		  		final String registrationID = GCMRegistrar.getRegistrationId( Activity );
		  		if( registrationID.length() > 0 )
		  		{
			  		String javascriptFunctionCall = "GCMUnregister( \"";
			  		javascriptFunctionCall += registrationID;
			  		javascriptFunctionCall += "\" );";
			  		Activity.webJSRunJavaScript( javascriptFunctionCall, false, false );
		  		}
		    }
		});
	}



  	private static void MessageJava(final String key, final String value)
	{
  		Activity.runOnUiThread(new Runnable()
		{
		    public void run()
		    {
		    }
		});
	}

  	public static void MessageNDK(final String key, final String value)
	{
  		CCJNIGLView.runOnGLThread(new Runnable()
		{
		    public void run()
		    {
		    	MessageNDKGLThread( key, value );
		    }
		});
	}

  	private static native void MessageNDKGLThread(String key, String value);
}
