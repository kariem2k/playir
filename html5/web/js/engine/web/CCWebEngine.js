/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCWebEngine.js
 * Description : Handles the web specific engine setup.
 *
 * Created     : 24/07/11
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

// shim layer with setTimeout fallback
window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame       ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            window.oRequestAnimationFrame      ||
            window.msRequestAnimationFrame     ||
            function(/* function */ callback, /* DOMElement */ element)
            {
				window.setTimeout(callback, 1000 / 60);
			};
})();


CCEngine.Update = function()
{
	if( CCEngine.paused )
	{
		var currentTime = Date.now();
		var delta = ( currentTime - gEngine.lastUpdate ) * 0.001;
		if( delta > 0.05 )
		{
			gEngine.updateWeb();
			gEngine.render();
		}
	}
	else
	{
		gEngine.updateWeb();
		gEngine.render();
	}
    requestAnimFrame( CCEngine.Update );
};


CCEngine.prototype.setup = function()
{
	gEngine = this;

    gURLManager = new CCURLManager().create();

	CC.SetGradient( document.body.style, '#000000', '#000000' );

	this.table = new TableComponent( document.body, false );
	this.table.table.width = 1;
	this.table.td.height = 1;
	this.controls = new CCControls().create( this.table );

	window.onresize = function() { gEngine.queueResize(); };
	if( !BrowserType['mobile'] )
	{
		window.onscroll = function() { gEngine.scroll(); };
	}
	else
	{
		document.addEventListener( 'orientationchange', function() { gEngine.queueResize(); }, true );
		document.addEventListener( 'scroll', function() { gEngine.scroll(); }, true );
	}

	if( this.setupRenderer() )
	{
		this.resize( function()
		{
			gEngine.start();
			setTimeout( CCEngine.Update, 10 );
		});
	}
	else
	{
		window.location = SERVER_ROOT + "nowebgl/";
	}

	window.onblur = function(e)
	{
		//console.log( "onblur", e );
		if( window.CCEngine )
		{
			CCEngine.Pause();
		}
	};

	window.onfocus = function(e)
	{
		//console.log( "onfocus", e );
		if( window.CCEngine )
		{
			CCEngine.Resume();
		}
	};

	// Pause if window doesn't have docus on launch
	if( window.document.hasFocus )
	{
		if( !window.document.hasFocus() )
		{
			if( window.CCEngine )
			{
				CCEngine.Pause();
			}
		}
	}
};


CCEngine.prototype.setupRenderer = function()
{
	this.fullScreen = true;
	new CCRenderer().create( this.table.td );
	if( gRenderer )
	{
		this.textureManager = new CCTextureManager();
		return true;
    }

    return false;
};


CCEngine.prototype.updateWeb = function()
{
	var delta = this.updateTime();

	// See if we need to save our cache
	if( CC.LocalStorageCacheDirty )
	{
		CC.SerializeLocalStorageCache();
	}

    if( this.resizeTimer > 0.0 )
    {
        this.resizeTimer -= delta;
        if( this.resizeTimer <= 0.0 )
        {
            this.resize();
        }
    }
    else
    {
		this.update( delta );
    }
};


CCEngine.prototype.render = function()
{
    var renderer = gRenderer;
	if( renderer.beginRender() )
	{
        var render_background = CCRenderer.render_background;
        var render_finished = CCRenderer.render_finished;

        var i, scene;
		var scenes = this.scenes;
		var scenesLength = scenes.length;

		var cameras = this.cameras;
		var camerasLength = cameras.length;
		for( var cameraIndex=0; cameraIndex<camerasLength; ++cameraIndex )
		{
			var camera = cameras[cameraIndex];
			if( !camera.enabled )
			{
				continue;
			}

			camera.setViewport();
			camera.update();

			for( var pass=render_background; pass<render_finished; ++pass )
			{
				renderer.CCSetBlend( false );
				renderer.CCSetDepthWrite( true );		// Depth sort opaque objects
				renderer.CCSetDepthRead( true );

				// Render all the opaque non-collideables
				if( camera.scene )
				{
					camera.scene.render( camera, pass, false );
				}
				else
				{
					for( i=0; i<scenesLength; ++i )
					{
						scene = scenes[i];
						scene.render( camera, pass, false );
					}
				}

				// Render all the visible opaque collideables
				CCOctree.RenderVisibleObjects( camera, pass, false );

				// Transparent
				renderer.CCSetBlend( true );
				renderer.CCSetDepthWrite( false );	// No depth sorting for transparent objects
				renderer.CCSetDepthRead( false );

				// Render all the transparent non-collideables
				if( camera.scene )
				{
					camera.scene.render( camera, pass, true );
				}
				else
				{
					for( i=0; i<scenesLength; ++i )
					{
						scene = scenes[i];
						scene.render( camera, pass, true );
					}
				}

				// Render all the visible transparent collideables
				CCOctree.RenderVisibleObjects( camera, pass, true );

				// Render all the transparent non-collideables
				if( camera.scene )
				{
					if( camera.scene.postRender )
					{
						camera.scene.postRender( camera, pass, true );
					}
				}
				else
				{
					for( i=0; i<scenesLength; ++i )
					{
						scene = scenes[i];
						if( scene.postRender )
						{
							scene.postRender( camera, pass, true );
						}
					}
				}
			}
		}
	}
};


CCEngine.prototype.queueResize = function()
{
    this.zero();

    // Queue a resize in half a second
    // so we don't overkill the browser if we're dragging the window size
    this.resizeTimer = 0.25;
};


CCEngine.prototype.zero = function()
{
    this.table.table.width = 1;
    this.table.td.height = 1;
    this.table.style.border = "";
    if( gRenderer )
    {
		gRenderer.zero();
	}
};


CCEngine.prototype.resize = function(callback)
{
	if( BrowserType['iphone'] )
    {
        // Scroll the page down away from url bar automatically
        window.scrollTo( 0, 0 );
    }

    this.zero();

    var self = this;
	CCTools.GetScreenSize( function (screenWidth, screenHeight)
	{
		var aspect = 720 / 480;

		var tableWidth = screenWidth;
		var tableHeight = screenHeight;
		if( self.fullScreen )
		{
			if( gRenderer )
			{
				gRenderer.setSize( screenWidth, screenHeight );
			}
		}
		else
		{
			tableHeight = screenWidth/aspect;
			if( tableHeight > screenHeight )
			{
				var difference = screenHeight / tableHeight;
				tableWidth = screenWidth * difference;
				tableHeight = screenHeight;
			}

			if( gRenderer )
			{
				gRenderer.setSize( tableWidth, tableHeight );
			}
		}
		tableWidth = parseInt( tableWidth, 10 );
		tableHeight = parseInt( tableHeight, 10 );

		self.table.table.width = tableWidth + 'px';
		self.table.td.height = tableHeight + 'px';
		//self.table.style.border = "1px solid #333343";
		self.table.dimensions.refresh();

		var x = Math.floor( ( tableWidth - self.table.dimensions.totalWidth ) * 0.5 );
		var y = Math.floor( ( tableHeight - self.table.dimensions.totalHeight ) * 0.5 );
		self.table.dimensions.setPosition( x, y );

		{
			var scenes = self.scenes;
			var length = scenes.length;
			for( var i=0; i<length; ++i )
			{
				var scene = scenes[i];
				scene.resize();
				scene.resized();
			}
		}

		if( callback )
		{
			callback();
		}
	});
};


CCEngine.prototype.scroll = function()
{
    if( gRenderer )
    {
		gRenderer.resize();
	}
};


CCEngine.WebViews = [];
CCEngine.WebViewOpen = function(url, onOpenCallback, onUpdateCallback, params)
{
	if( window.tizen )
	{
		var appControl = new tizen.ApplicationControl( "http://tizen.org/appcontrol/operation/view", url );
		tizen.application.launchAppControl( appControl, null,
			function() {},
			function(e) {} );
		return;
	}

	var title = "Multi";
	var specs = "";
	if( params )
	{
		if( params.title )
		{
			title = params.title;
		}

		if( params.width )
		{
			var width = parseInt( params.width, 10 );
			specs += "width=" + width + ",";

			var screenWidth = CCTools.GetScreenWidth();
			var left = ( ( screenWidth - width ) / 2 );
			specs += "left=" + left + ",";
		}

		if( params.height )
		{
			var height = parseInt( params.height, 10 );
			specs += "height=" + height + ",";

			var screenHeight = CCTools.GetScreenHeight();
			var top = ( ( screenHeight - height ) / 2 );
			specs += "top=" + top + ",";
		}
	}

	var webViewController = CCEngine.GetWebView( title );
	if( !webViewController )
	{
		webViewController = {};
		webViewController.title = title;
		CCEngine.WebViews.add( webViewController );
	}

	webViewController.onUpdateCallback = onUpdateCallback;
	webViewController.webView = window.open( url, title, specs );

	var webView = webViewController.webView;
	CCEngine.WebViewLastOpened = webViewController;

	setTimeout( function()
	{
		if( !webView || webView.innerHeight === 0 )
		{
			alert( "A popup window is required to continue.\nPlease enable popups and try again." );

			if( onOpenCallback )
			{
				onOpenCallback( webViewController, false );
			}

			CCEngine.WebViewClose( webViewController );
		}
		else
		{
			if( onUpdateCallback )
			{
				setTimeout( function()
				{
					CCEngine.WebViewProcessURL( webViewController );
				}, 33 );
			}

			if( onOpenCallback )
			{
				onOpenCallback( webViewController, true );
			}
		}
	}, 500 );

	return webViewController;
};


CCEngine.WebViewProcessURL = function(webViewController)
{
	var webView = webViewController.webView;
	if( webView )
	{
		if( webView.closed || !webViewController.onUpdateCallback )
		{
			if( webViewController.onUpdateCallback )
			{
				webViewController.onUpdateCallback( webViewController, false, false );
			}
			CCEngine.WebViewClose( webViewController );
		}
		else
		{
			var url = false;
			try
			{
				url = webView.location.href;
			}
			catch( e )
			{
				url = false;
			}

			if( url )
			{
				webViewController.onUpdateCallback( webViewController, url, true );
			}
			setTimeout( function()
			{
				CCEngine.WebViewProcessURL( webViewController );
			}, 33 );
		}
	}
};


CCEngine.WebViewClose = function(webViewController)
{
	if( !webViewController )
	{
		webViewController = CCEngine.WebViewLastOpened;
	}
	CCEngine.WebViews.remove( webViewController );

	if( webViewController )
	{
		var webView = webViewController.webView;
		if( !webView.closed )
		{
			webView.close();
		}

		if( webViewController === CCEngine.WebViewLastOpened )
		{
			delete CCEngine.WebViewLastOpened;
		}
	}
};


CCEngine.IsWebViewOpen = function(webViewController)
{
	if( CCEngine.WebViews.find( webViewController ) !== -1 )
	{
		var webView = webViewController.webView;
		return !webView.closed;
	}
	return false;
};


CCEngine.GetWebView = function(title)
{
	var WebViews = CCEngine.WebViews;
	for( var i=0; i<WebViews.length; ++i )
	{
		var webViewItr = WebViews[i];
		if( webViewItr.title === title )
		{
			return webViewItr;
		}
	}
	return null;
};



// Data saved here can be cleared when we run low on storage space
CC.LocalStorageCache = null;    // Keep cache in memory for faster access
CC.LocalStorageCacheDirty = false;

CC.LoadLocalStorageCache = function(key)
{
    if( window.localStorage )
    {
        if( !CC.LocalStorageCache )
        {
            var cacheString = window.localStorage.getItem( "cache" );
            if( cacheString )
            {
                CC.LocalStorageCache = JSON.parse( cacheString );
            }

            if( !CC.LocalStorageCache )
            {
                CC.LocalStorageCache = {};
            }
        }

        var cache = CC.LocalStorageCache;
        if( cache )
        {
            var item = cache[key];
            if( item )
            {
                // Update our item's time
                item.time = Date.now();
                CC.LocalStorageCacheDirty = true;

                // Return item data
                return item.data;
            }
        }
    }
    return undefined;
};


CC.SaveLocalStorageCache = function(key, data)
{
    if( window.localStorage )
    {
        CC.ASSERT( key );
        if( !CC.LocalStorageCache )
        {
            var cacheString = window.localStorage.getItem( "cache" );
            if( cacheString )
            {
                CC.LocalStorageCache = JSON.parse( cacheString );
            }
            if( !CC.LocalStorageCache )
            {
                CC.LocalStorageCache = {};
            }
        }

        var cache = CC.LocalStorageCache;
        var item = {};
        item.time = Date.now();
        item.data = data;
        cache[key] = item;

        CC.LocalStorageCacheDirty = true;
    }
};


CC.SerializeLocalStorageCache = function()
{
    CC.LocalStorageCacheDirty = false;

    var saveString;
    try
    {
        saveString = JSON.stringify( CC.LocalStorageCache );
    }
    catch( error )
    {
        CC.ASSERT( false, error );
        // Something seriously bad has occured, kill our cache
        window.localStorage.removeItem( "cache" );
        CC.LocalStorageCache = null;
    }

    if( saveString )
    {
        try
        {
            window.localStorage.setItem( "cache", saveString );
        }
        catch (error)
        {
            // Trim our cache
            if( CC.TrimLocalStorageCache() )
            {
                CC.SerializeLocalStorageCache();
            }
            else
            {
                // Something seriously bad has occured, kill our cache
                window.localStorage.removeItem( "cache" );
                CC.LocalStorageCache = null;
            }
        }
    }
};


CC.TrimLocalStorageCache = function()
{
    var cache = CC.LocalStorageCache;

    var oldestKey = null;
    var oldestTime = Date.now();
    for( var key in cache )
    {
        var item = cache[key];
        if( item.time < oldestTime )
        {
            oldestKey = key;
            oldestTime = item.time;
        }
    }

    if( oldestKey )
    {
        delete cache[oldestKey];
        return true;
    }
    return false;
};
