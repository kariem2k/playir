/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : SceneMultiManager.js
 * Description : Manager of our multi client
 *
 * Created     : 15/02/13
 *-----------------------------------------------------------
 */

function SceneMultiManager()
{
    this.construct();
}
ExtendPrototype( SceneMultiManager, SceneManagerPlay );

SceneMultiManager.Instance = null;
SceneMultiManager.DefaultTitleImage = "phonewars_title.jpg";


SceneMultiManager.RefreshBackground = function()
{
    var images = [
        "blackhole_background",
        "collide_background",
        "greenearth_background",
        //"littlelion_background",
        //"love_background",
        //"mario_background",
        //"metallic_background",
        //"rabbit_background",
        //"sf2_background",
        //"stars_background",
        //"warriors_background"
    ];
    var random = CC.Random( images.length-1 );
    this.backgroundImage = images[random] + ".jpg";

    // Cache our background image
    gEngine.textureManager.getTextureHandle( this.backgroundImage );
};


SceneMultiManager.GetBackground = function()
{
    if( !this.backgroundImage )
    {
        this.RefreshBackground();
    }
    return this.backgroundImage;
};


SceneMultiManager.prototype.construct = function()
{
    SceneMultiManager.Instance = this;

    this.SceneManagerPlay_construct();

    if( gEngine.restarting )
    {
        delete gEngine.restarting;
    }
    else
    {
        this.showIcon();
    }

    SceneMultiManager.LoadingGame = window.APP_ID === "multi" ? false : window.APP_ID;

    var self = this;
    this.dbApps = new DBApps();
    this.dbApps.load(
        function (appInfos)
        {
            if( !self.startingGame )
            {
                if( SceneMultiManager.LoadingGame )
                {
                    self.findGameToLoad();
                }
                else
                {
                    self.loadGamesList( appInfos );
                    self.dockIcon( function()
                    {
                        self.showGamesList();
                    });
                }
            }
        },
        function (appInfo, removed)
        {
            if( !self.startingGame )
            {
                if( SceneMultiManager.LoadingGame )
                {
                    self.findGameToLoad();
                }
                else
                {
                    self.updateGamesList( appInfo, removed );
                }
            }
        });

    this.syncDisconnected();

    gEngine.addScene( this );
};


SceneMultiManager.prototype.deleteLater = function()
{
    if( SceneMultiManager.Instance === this )
    {
        SceneMultiManager.Instance = null;
    }

    if( this.dbApps )
    {
        this.dbApps.destruct();
        this.dbApps = null;
    }

    this.SceneManagerPlay_deleteLater();
};


SceneMultiManager.prototype.updateControls = function(controls)
{
    return false;
};


SceneMultiManager.prototype.syncDisconnected = function()
{
    this.SceneManagerPlay_syncDisconnected();

    this.hideLogin();
};


SceneMultiManager.prototype.syncLoggedIn = function()
{
    this.SceneManagerPlay_syncLoggedIn();

    if( !this.startingGame )
    {
        this.showLogin();
    }
};


SceneMultiManager.prototype.syncLoggedIntoSocialNetwork = function(network)
{
    if( !this.startingGame )
    {
        this.hideLogin();
        this.showLogin();
    }
};


SceneMultiManager.prototype.findGameToLoad = function()
{
    var AppInfos = DBApps.AppInfos;
    for( var i=0; i<AppInfos.length; ++i )
    {
        var appInfo = AppInfos[i];
        if( window.APP_ID === appInfo.id )
        {
            this.loadGame( appInfo.id );
            return;
        }
    }

    this.dbApps.requestGameID( window.APP_ID );
};


SceneMultiManager.prototype.loadGame = function(appID)
{
    // Register for a final back button press to restore inital APP start screen
    if( appID !== LAUNCH_APP_ID )
    {
        CCEngine.EnableBackButton( gEngine );
    }

    this.startingGame = true;
    this.hideLogin();

    var appInfo = null;
    if( this.dbApps )
    {
        appInfo = this.dbApps.getAppInfo( appID );
    }

    // No game info? Reset
    if( !appInfo )
    {
        SceneMultiManager.Launch();
    }

    // No custom .js? Load
    else if( !appInfo.jsFiles || appInfo.jsFiles.length === 0 )
    {
        this.startGame( appInfo );
    }

    // Custom .js? Download then load
    else
    {
        //AlertsManager.Notification( "multi", "loading..." );
        this.showIcon();
        this.sceneIntro.showLoadingBar();

        //AlertsManager.ModalAlert( "loading..." );
        var self = this;
        var jsFiles = appInfo.jsFiles;
        JSManager.SyncJSFiles( jsFiles, function (updatedJS)
        {
            if( SceneMultiManager.Instance === self )
            {
                self.loadedJS( appInfo );
            }
        },
        function (progress)
        {
            if( SceneMultiManager.Instance === self && self.sceneIntro )
            {
                self.sceneIntro.updateLoadingBar( progress );
            }
        });
    }
};


SceneMultiManager.prototype.loadedJS = function(appInfo)
{
    // Check to see if all .js files loaded successfully
    var jsFiles = appInfo.jsFiles;
    for( var i=0; i<jsFiles.length; ++i )
    {
        var js = jsFiles[i];
        if( js.filename )
        {
            var script = JSManager.GetScript( js.filename );
            if( !script )
            {
                this.loadGame( appInfo.id );
                return;
            }
        }
    }

    if( SceneMultiManager.LoadingAppInfoUpdated )
    {
        SceneMultiManager.LoadingAppInfoUpdated = false;
        this.loadGame( SceneMultiManager.LoadingGame );
    }

    //AlertsManager.Hide( "multi" );
    this.startGame( appInfo );
};


SceneMultiManager.prototype.startGame = function(appInfo)
{
    MultiplayerManager.Emit( 'SetApp', APP_ID );

    SceneMultiManager.LoadingGame = false;

    var self = this;
    this.hideIcon( function()
    {
        self.deleteLater();

        if( appInfo.jsStart && window[appInfo.jsStart] )
        {
            new window[appInfo.jsStart]();
        }
        else
        {
            gEngine.addScene( new SceneManagerGame() );
        }
    });
};


SceneMultiManager.prototype.hide = function()
{
    this.hideIcon();
};


SceneMultiManager.prototype.launchEditor = function()
{
    if( SceneMultiManager.EditorAllowed )
    {
        this.deleteLater();

        SceneMultiManager.EditorEnabled = !SceneMultiManager.EditorEnabled;
        if( SceneMultiManager.EditorEnabled )
        {
            new SceneProjectManager();
        }
    }
    else
    {
        CCEngine.WebViewOpen( "http://playir.com/" );
    }
};


SceneMultiManager.Launch = function()
{
    SceneMultiManager.LoadingGame = false;

    //if( window.tizen )
    {
        for( var i=0; i<gEngine.scenes.length; ++i )
        {
            gEngine.scenes[i].deleteLater();
        }
        CCEngine.DisableBackButton( gEngine );

        // Go to multi games launcher by default
        if( APP_ID !== "multi" )
        {
            APP_ID = "multi";
        }
        else
        {
            APP_ID = LAUNCH_APP_ID;
        }

        // Regiser for a final back button press to restore inital APP start screen
        if( APP_ID !== LAUNCH_APP_ID )
        {
            CCEngine.EnableBackButton( gEngine );
        }

        gEngine.restarting = true;
        gEngine.start();
        return;
    }

    if( sceneManagerPlay )
    {
        sceneManagerPlay.deleteLater();
    }

    MultiplayerManager.Disconnect();
    if( CCEngine.NativeUpdateCommands !== undefined )
    {
        CCEngine.NativeUpdateCommands += 'CCEngine.Restart\n';
    }
    else
    {
        var url = CC.GetURLWithoutLocationBarData();
        if( window.location !== url )
        {
            window.location = url;
        }
        else
        {
            window.location.reload();
        }
    }
};


SceneMultiManager.RestartClient = function()
{
    MultiplayerManager.Disconnect();
    if( CCEngine.NativeUpdateCommands !== undefined )
    {
        CCEngine.NativeUpdateCommands += 'CCEngine.RestartClient;' + APP_ID + '\n';
    }
    else
    {
        while( gEngine.scenes.length > 0 )
        {
            gEngine.removeScene( gEngine.scenes.last() );
        }
        CC.SetJSLocationBarData( "id", APP_ID );
        window.location.reload();
    }
};


SceneMultiManager.prototype.showIcon = function()
{
    if( !this.sceneIntro )
    {
        this.sceneIntro = new SceneMultiUIIntro( this );
    }
};


SceneMultiManager.prototype.hideIcon = function(callback)
{
    if( this.sceneIntro )
    {
        this.sceneIntro.hide( callback );
    }
    else if( callback )
    {
        callback();
    }
};


SceneMultiManager.prototype.dockIcon = function(callback)
{
    if( this.sceneIntro )
    {
        this.sceneIntro.dockIcon( callback );
    }
    else if( callback )
    {
        callback();
    }
};


SceneMultiManager.prototype.showLogin = function()
{
    if( !this.sceneLogin )
    {
        this.sceneLogin = new SceneMultiUILogin( this );
    }
};


SceneMultiManager.prototype.hideLogin = function()
{
    if( this.sceneLogin )
    {
        this.sceneLogin.close();
        this.sceneLogin = null;
    }
};


SceneMultiManager.prototype.preloadGamesList = function(callback)
{
    if( !this.sceneGamesList )
    {
        this.sceneGamesList.preloadGamesList( callback );
    }
};


SceneMultiManager.prototype.reconnect = function()
{
    if( this.sceneGamesList )
    {
        this.sceneGamesList.reconnect();
    }
};


SceneMultiManager.prototype.loadGamesList = function(appInfos)
{
    if( !this.sceneGamesList )
    {
        this.sceneGamesList = new SceneMultiUIGamesList( this );
    }
    this.sceneGamesList.loadAppInfos( appInfos );
};


SceneMultiManager.prototype.showGamesList = function()
{
    if( this.sceneGamesList )
    {
        this.sceneGamesList.show();
    }
};


SceneMultiManager.prototype.updateGamesList = function(appInfo, removed)
{
    if( this.sceneGamesList )
    {
        this.sceneGamesList.updatedAppInfo( appInfo, removed );
    }
};


SceneMultiManager.prototype.hideGamesList = function()
{
    if( this.sceneGamesList )
    {
        this.sceneGamesList.deleteLater();
        this.sceneGamesList = null;
    }
};