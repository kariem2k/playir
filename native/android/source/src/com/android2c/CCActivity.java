/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCActivity.java
 * Description : Android entry point.
 *
 * Created     : 15/06/11
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

package com.android2c;

import java.util.ArrayList;
import java.util.List;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.NotificationManager;
import android.app.ProgressDialog;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.os.Bundle;
import android.os.Handler;
import android.util.Log;
import android.view.KeyEvent;
import android.view.View;
import android.webkit.CookieSyncManager;
import android.widget.RelativeLayout;
import android.widget.TextView;

import com.android.billing.*;
import com.android.gcm.GCMIntentService;
//import com.google.ads.*;


public class CCActivity extends Activity
{
	static String app_name; 
	public static String AppName()
	{
		return app_name;
	}

	public static int AppIcon()
	{
		return CCJNI.Activity.getResources().getIdentifier( "icon", "drawable", CCJNI.PackageName );
	}

	public static boolean isActive = false;

	RelativeLayout layout;
    CCJNIGLView glView = null;
    CCJNIWebView webView = null;
    CCJNIWebJS webJS = null;
    CCJNIVideoView videoView = null;
    TextView textView = null;

    static Thread JobsThread = null;

    // Google Services
    //AdView adView = null;
    private IabHelper inAppBillingHelper = null;


    @Override
    protected void onCreate(Bundle icicle)
    {
        super.onCreate( icicle );
        this.setRequestedOrientation( ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE );

        app_name = this.getTitle().toString();
        CookieSyncManager.createInstance( this );

        CCJNI.SetActivity( this );

        {
	        glView = new CCJNIGLView( getApplication() );
	        layout = new RelativeLayout( this );
	        layout.addView( glView );
	    }

        {
        	textView = new CCTextView( this );
        	layout.addView( textView );
        }

        // Admob
//        if( false )
//        {
//	    	// Create ad view
//	    	adView = new AdView( this, AdSize.BANNER, "a14f6162fd27235" );
//
//	    	// Re-position to footer
//	    	WindowManager windowManager = (WindowManager)getSystemService( Context.WINDOW_SERVICE );
//	        Display display = windowManager.getDefaultDisplay();
//	        int screenWidth = display.getWidth();
//	        int screenHeight = display.getHeight();
//	        //int bannerWidth = AdSize.BANNER.getWidth();
//	        //int bannerHeight = AdSize.BANNER.getHeight();
//
//	        RelativeLayout.LayoutParams viewParams = new RelativeLayout.LayoutParams( screenWidth, screenHeight );
//	    	adView.setLayoutParams( viewParams );
//	    	adView.setGravity( Gravity.BOTTOM | Gravity.CENTER );
//
//	    	layout.addView( adView );
//
//	        // Initiate a generic request to load it with an ad
//	        adView.loadAd( new AdRequest() );
//
//	        toggleAdverts( false );
//        }

        setContentView( layout );

        // Engine thread
//        new Thread(new Runnable()
//		{
//			public void run()
//		    {
//				while( true )
//				{
//					glView.requestRender();
//					//CCJNI.OnDrawFrame();
//				}
//		 	}
//		}).start();

 		// Jobs thread
        if( JobsThread == null )
        {
	 		JobsThread = new Thread(new Runnable()
			{
				public void run()
			    {
					while( true )
					{
						try
						{
							CCJNI.OnJobsThread();
							Thread.sleep( 1 );
						}
						catch (InterruptedException e)
						{
							e.printStackTrace();
						}
					}
			 	}
			});
	 		JobsThread.start();
        }
    }


    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event)
    {
        if( keyCode == KeyEvent.KEYCODE_BACK )
        {
        	if( CCJNI.ControlsHandleBackButton() )
        	{
            	return true;
        	}
        	else
        	{
            	return super.onKeyDown( keyCode, event );
        	}
        }

        return super.onKeyDown( keyCode, event );
    }


    @Override
    protected void onResume()
    {
        CCJNI.AppResumedUIThread();

        super.onResume();
        glView.onResume();

        isActive = true;

        // Cancel any previous notifications on resume
        NotificationManager notificationManager = (NotificationManager)getSystemService( Context.NOTIFICATION_SERVICE );
        notificationManager.cancelAll();

        if( webJS != null )
    	{
    		webJS.forceRunJavaScript( "if( window.CCEngine ) { CCEngine.Resume(); }" );
    	}
    }


    @Override
    protected void onPause()
    {
    	if( webJS != null )
    	{
    		webJS.forceRunJavaScript( "if( window.CCEngine ) { CCEngine.Pause(); }" );
    	}

    	CCJNIAudioManager.PauseAll();
        CCJNI.AppPausedUIThread();

        super.onPause();
        glView.onPause();

        if( videoView != null )
        {
        	videoViewStop();
        }

        isActive = false;
    }


    @Override
    public void onDestroy()
    {
//    	if( adView != null )
//    	{
//    		adView.destroy();
//    	}

    	if( inAppBillingHelper != null )
    	{
    		inAppBillingHelper.dispose();
    		inAppBillingHelper = null;
    	}

    	super.onDestroy();
    }



    // WebView
    public void webViewOpen(final String url, final boolean hidden)
    {
    	runOnUiThread(new Runnable()
		{
		    public void run()
		    {
		    	if( webView == null )
		    	{
		            webView = new CCJNIWebView( CCActivity.this );
		            layout.addView( webView );
		    	}
		    	webView.loadUrl( url );
		    	webView.setVisibility( hidden ? View.INVISIBLE : View.VISIBLE );
		    }
		});
    }


    public void webViewClose()
    {
    	runOnUiThread(new Runnable()
		{
		    public void run()
		    {
		    	if( webView != null )
		    	{
		    		layout.removeView( webView );
		    		webView.destroy();
		    		webView = null;
		    	}
		    }
		});
    }


    public void webViewRunJavaScript(final String script)
    {
    }



    // WebJS
    public void webJSOpen(final String url, final String htmlData)
    {
    	runOnUiThread(new Runnable()
		{
		    public void run()
		    {
		    	webJSClose();
		    	if( webJS == null )
		    	{
		    		webJS = new CCJNIWebJS( CCActivity.this );
		        	webJS.setVisibility( View.INVISIBLE );
		            layout.addView( webJS );
		    	}

		    	webJS.open( url, htmlData );
		    }
		});
    }


    public void webJSClose()
    {
    	runOnUiThread(new Runnable()
		{
		    public void run()
		    {
		    	if( webJS != null )
		    	{
		    		layout.removeView( webJS );
		    		webJS.destroy();
		    		webJS = null;
		    	}
		    }
		});
    }


    public void webJSRunJavaScript(final String script, final boolean returnResult, final boolean calledFromJava)
    {
    	if( webJS != null )
    	{
    		webJS.runJavaScript( script, returnResult, calledFromJava );
    	}
    }



    // VideoView
    public void videoViewStart(final String file)
    {
    	runOnUiThread(new Runnable()
		{
    		public void run()
    		{
		    	// Introduced a 100ms timeout to allow for edge cases when a video
		    	// is requested as the OpenGL context is still starting up
		    	// Without this, the video player context can appear on top of the OpenGL context

		    	final Handler handler = new Handler();
				final Runnable r = new Runnable()
				{
				    public void run()
				    {
				    	if( videoView == null )
				    	{
		    	            videoView = new CCJNIVideoView( CCActivity.this, file );
		    	            layout.addView( videoView );
		    	    	}
				    }
				};

				handler.postDelayed( r, 100 );
    		}
		});
    }


    public void videoViewStop()
    {
    	runOnUiThread(new Runnable()
		{
    		public void run()
    		{
    			if( videoView != null )
		    	{
		    		layout.removeView( videoView );
		    		videoView.destroy();
		    		videoView = null;
		    	}
    		}
		});
    }



    // Google Services
	final boolean debug_InAppBilling = false;
    private ArrayList<Purchase> inAppBillingConsumables = new ArrayList<Purchase>();
    ProgressDialog inAppBillingDialog = null;

    public void googleServicesRegister(final String base64EncodedPublicKey)
    {
    	if( inAppBillingHelper == null )
    	{
	        // In-app billing
	        {
	        	inAppBillingHelper = new IabHelper( this, base64EncodedPublicKey );

	        	if( debug_InAppBilling )
	        	{
	        		inAppBillingHelper.enableDebugLogging( true );
	        	}

	        	inAppBillingHelper.startSetup( new IabHelper.OnIabSetupFinishedListener()
	        	{
	                public void onIabSetupFinished(IabResult result)
	                {
	                	if( debug_InAppBilling )
						{
	                		Log.d( CCJNI.library, "InAppBilling: Setup finished." );
						}

	                    if( !result.isSuccess() )
	                    {
	                        // Oh noes, there was a problem.
	                    	if( debug_InAppBilling )
							{
		                		Log.d( CCJNI.library, "InAppBilling: Problem setting up in-app billing: " + result );
							}

	                		inAppBillingHelper = null;
	                        return;
	                    }

	                    // Hooray, IAB is fully set up. Now, let's get an inventory of stuff we own.
	                    if( debug_InAppBilling )
	                    {
	                    	Log.d( CCJNI.library, "InAppBilling: Setup successful. Querying inventory." );
	                    }
	                    inAppBillingHelper.queryInventoryAsync( mGotInventoryListener );
	                }
	            });
	        }

	        // GCM
	        {
	        	GCMIntentService.registerContext( this );
	        }
    	}
    }


    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data)
    {
    	if( debug_InAppBilling )
		{
    		Log.d( CCJNI.library, "InAppBilling: onActivityResult(" + requestCode + "," + resultCode + "," + data );
		}

        // Pass on the activity result to the helper for handling
        if( !inAppBillingHelper.handleActivityResult(requestCode, resultCode, data) )
        {
            // not handled, so handle it ourselves (here's where you'd
            // perform any handling of activity results not related to in-app
            // billing...
            super.onActivityResult(requestCode, resultCode, data);
        }
        else
        {
        	if( debug_InAppBilling )
			{
        		Log.d( CCJNI.library, "InAppBilling: onActivityResult handled by IABUtil.");
			}
        }
    }


	boolean verifyDeveloperPayload(Purchase p)
	{
        //String payload = p.getDeveloperPayload();
        return true;
    }


    // Listener that's called when we finish querying the items and subscriptions we own
    IabHelper.QueryInventoryFinishedListener mGotInventoryListener = new IabHelper.QueryInventoryFinishedListener()
    {
        public void onQueryInventoryFinished(IabResult result, Inventory inventory)
        {
        	if( debug_InAppBilling )
			{
        		Log.d( CCJNI.library, "Query inventory finished." );
			}
            if (result.isFailure())
            {
            	if( debug_InAppBilling )
				{
            		Log.d( CCJNI.library, "InAppBilling: Failed to query inventory: " + result);
				}
                return;
            }

            if( debug_InAppBilling )
			{
        		Log.d( CCJNI.library, "InAppBilling: Query inventory was successful." );
			}

            List<String> allPurchases = inventory.getAllOwnedSkus();
            for( int i=0; i<allPurchases.size(); ++i )
            {
            	String sku = allPurchases.get( i );

            	Purchase purchase = inventory.getPurchase( sku );
            	if( purchase != null && verifyDeveloperPayload( purchase ) )
            	{
            		if( debug_InAppBilling )
            		{
            			Log.d( CCJNI.library, "We have " + sku + ". Saving it in our consumables list." );
            		}
            		inAppBillingConsumables.add( purchase );
            	}
            }

            if( debug_InAppBilling )
			{
        		Log.d( CCJNI.library, "InAppBilling: Initial inventory query finished." );
			}
        }
    };


    public void requestPurchase(final String productID, final boolean consumable)
    {
    	if( inAppBillingHelper != null )
    	{
    		if( consumable )
    		{
	    		for( int i=0; i<inAppBillingConsumables.size(); ++i )
	    		{
	    			Purchase purchase = inAppBillingConsumables.get( i );
	    			if( purchase != null )
	    			{
	    				String sku = purchase.getSku();
	    				if( sku.equals( productID ) )
	    				{
	    	            	inAppBillingDialog = ProgressDialog.show( CCActivity.this, "", "processing...", true );
	    					inAppBillingHelper.consumeAsync( purchase, mConsumeFinishedListener );
	    					return;
	    				}
	    			}
	    		}
    		}

	    	if( debug_InAppBilling )
			{
	     		Log.d( CCJNI.library, "InAppBilling: Launching purchase flow for " + productID + "." );
			}
	    	final int RC_REQUEST = 10001;
	    	String payload = consumable ? "consumable" : "nonconsumable";
	    	inAppBillingHelper.launchPurchaseFlow( this, productID, RC_REQUEST, mPurchaseFinishedListener, payload );
    	}
    	else
    	{
    		AlertDialog.Builder alert = new AlertDialog.Builder( this );

    		alert.setTitle( "In-App Billing" );
    		alert.setMessage( "Google Play Unavailable :(" );
    		alert.setNeutralButton( "OK", null );

    		alert.show();
    	}
    }


    // Callback for when a purchase is finished
    IabHelper.OnIabPurchaseFinishedListener mPurchaseFinishedListener = new IabHelper.OnIabPurchaseFinishedListener()
    {
        public void onIabPurchaseFinished(IabResult result, Purchase purchase)
        {
        	if( debug_InAppBilling )
			{
	     		Log.d( CCJNI.library, "InAppBilling: Purchase finished: " + result + ", purchase: " + purchase );
			}
            if (result.isFailure())
            {
            	if( debug_InAppBilling )
    			{
    	     		Log.d( CCJNI.library, "InAppBilling: Error purchasing: " + result );
    			}
                return;
            }
            if( !verifyDeveloperPayload( purchase ) )
            {
            	if( debug_InAppBilling )
    			{
    	     		Log.d( CCJNI.library, "InAppBilling: Error purchasing. Authenticity verification failed." );
    			}
                return;
            }

            if( debug_InAppBilling )
			{
	     		Log.d( CCJNI.library, "InAppBilling: Purchase successful.");
			}

            if( purchase.getDeveloperPayload().equals( "consumable" ) )
            {
            	if( debug_InAppBilling )
    			{
    	     		Log.d( CCJNI.library, "InAppBilling: Purchase is consumable. Starting consumption." );
    			}

            	inAppBillingDialog = ProgressDialog.show( CCActivity.this, "", "processing...", true );
            	inAppBillingHelper.consumeAsync( purchase, mConsumeFinishedListener );
            }
            else
            {
        		CCJNIGLView.runOnGLThread(new Runnable()
    			{
    				public void run()
    				{
    					CCJNI.BillingItemPurchasedGLThread();
    				}
    			});
            }
        }
    };

    // Called when consumption is complete
    IabHelper.OnConsumeFinishedListener mConsumeFinishedListener = new IabHelper.OnConsumeFinishedListener()
    {
        public void onConsumeFinished(Purchase purchase, IabResult result)
        {
        	if( inAppBillingDialog != null )
        	{
        		inAppBillingDialog.dismiss();
        		inAppBillingDialog = null;
        	}

        	if( debug_InAppBilling )
			{
        		Log.d( CCJNI.library, "InAppBilling: Consumption finished. Purchase: " + purchase + ", result: " + result );
			}

            // We know this is the "gas" sku because it's the only one we consume,
            // so we don't check which sku was consumed. If you have more than one
            // sku, you probably should check...
            if (result.isSuccess())
            {
                // successfully consumed, so we apply the effects of the item in our
                // game world's logic, which in our case means filling the gas tank a bit
            	if( debug_InAppBilling )
    			{
            		Log.d( CCJNI.library, "InAppBilling: Consumption successful. Provisioning." );
    			}

            	inAppBillingConsumables.remove( purchase );
        		CCJNIGLView.runOnGLThread(new Runnable()
    			{
    				public void run()
    				{
    					CCJNI.BillingItemPurchasedGLThread();
    				}
    			});
            }
            else
            {
            	if( debug_InAppBilling )
    			{
            		Log.d( CCJNI.library, "InAppBilling: Error while consuming: " + result);
    			}
            }

            if( debug_InAppBilling )
			{
        		Log.d( CCJNI.library, "InAppBilling: End consumption flow.");
			}
        }
    };


    public void toggleAdverts(final boolean toggle)
    {
    	runOnUiThread(new Runnable()
		{
		    public void run()
		    {
//		    	if( adView != null )
//		    	{
//		    		if( toggle )
//		    		{
//		    			adView.setVisibility( View.VISIBLE );
//
//		    			// Fade the ad in over half of a second.
//		    	        AlphaAnimation animation = new AlphaAnimation( 0.0f, 1.0f );
//		    	        animation.setDuration( 500 );
//		    	        animation.setFillAfter( true );
//		    	        animation.setInterpolator( new AccelerateInterpolator() );
//		    	        adView.startAnimation( animation );
//		    		}
//		    		else
//		    		{
//		    			adView.setVisibility( View.GONE );
//
//		    			// Disabled as it keeps the view active for touches
//		    			// Fade the ad out over half a second.
//		    	        AlphaAnimation animation = new AlphaAnimation( 1.0f, 0.0f );
//		    	        animation.setDuration( 500 );
//		    	        animation.setFillAfter( true );
//		    	        animation.setInterpolator( new AccelerateInterpolator() );
//		    	        adView.startAnimation( animation );
//		    		}
//		    	}
		    }
		}
    	);
    }



    class CCTextView extends TextView
    {
    	public CCTextView(Context context)
    	{
			super(context);

        	setFocusable( true );
        	setFocusableInTouchMode( true );
        	setVisibility( View.INVISIBLE );
		}

		public boolean onKeyDown(int keyCode, KeyEvent event)
    	{
	        if( keyCode == KeyEvent.KEYCODE_BACK )
	        {
	        	if( CCJNI.ControlsHandleBackButton() )
	        	{
	            	return true;
	        	}
	        	else
	        	{
	            	return super.onKeyDown( keyCode, event );
	        	}
	        }
	        	
			String key = null;
			if( keyCode >= KeyEvent.KEYCODE_0 && keyCode <= KeyEvent.KEYCODE_9 )
			{
				if( event.isShiftPressed() )
				{
					if( keyCode == KeyEvent.KEYCODE_9 )
					{
						key = "(";
					}
					else if( keyCode == KeyEvent.KEYCODE_0 )
					{
						key = ")";
					}
					else if( keyCode == KeyEvent.KEYCODE_1 )
					{
						key = "!";
					}
				}
				else
				{
					final int number = keyCode - KeyEvent.KEYCODE_0;
					key = Integer.toString( number );
				}
			}
			else if( keyCode >= KeyEvent.KEYCODE_A && keyCode <= KeyEvent.KEYCODE_Z )
			{
				final boolean shift = event.isShiftPressed();
				key = "" + event.getDisplayLabel();

				if( !shift )
				{
					key = key.toLowerCase();
				}
			}
			else if( keyCode == KeyEvent.KEYCODE_SPACE )
			{
				key = " ";
			}
			else if( keyCode == KeyEvent.KEYCODE_PERIOD )
			{
				key = ".";
			}
			else if( keyCode == KeyEvent.KEYCODE_COMMA )
			{
				key = ",";
			}
			else if( keyCode == KeyEvent.KEYCODE_SEMICOLON )
			{
				key = ":";
			}
			else if( keyCode == KeyEvent.KEYCODE_MINUS )
			{
				key = "-";
			}
			else if( keyCode == KeyEvent.KEYCODE_MINUS )
			{
				key = "-";
			}
			else if( keyCode == KeyEvent.KEYCODE_APOSTROPHE )
			{
				if( event.isShiftPressed() )
				{
					key = "\"";
				}
				else
				{
					key = "'";
				}
			}
			else if( keyCode == KeyEvent.KEYCODE_SEMICOLON )
			{
				key = ";";
			}
			else if( keyCode == KeyEvent.KEYCODE_DEL )
			{
				key = "backspace";
			}
			else if( keyCode == KeyEvent.KEYCODE_ENTER )
			{
				key = "return";
			}

			if( key != null )
			{
				final String glKey = key;
				CCJNIGLView.runOnGLThread(new Runnable()
				{
					public void run()
					{
						CCJNI.ControlsKeyboardUpdate( glKey );
					}
				});
			}
	        return true;
	    }
    }
}
