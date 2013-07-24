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


SceneMultiManager.DefaultTitleImage = "phonewars_title.jpg";


SceneMultiManager.prototype.construct = function()
{
    this.SceneManagerPlay_construct();

    this.sceneUI = new SceneMultiManagerUI( this );
    gEngine.addScene( this.sceneUI );

    this.sceneUI.showIcon();

    SceneMultiManager.LoadingGame = window.CLIENT_ID === "multi" ? false : window.CLIENT_ID;

    var self = this;
    this.dbGames = new DBGames();
    this.dbGames.load(
        function (gameInfos)
        {
            if( !self.startingGame )
            {
                if( SceneMultiManager.LoadingGame )
                {
                    self.findGameToLoad();
                }
                else
                {
                    self.sceneUI.loadGamesList( gameInfos );
                    self.sceneUI.dockIcon( function()
                    {
                        self.sceneUI.showGamesList();
                    });
                }
            }
        },
        function (gameInfo, removed)
        {
            if( !self.startingGame )
            {
                if( SceneMultiManager.LoadingGame )
                {
                    self.findGameToLoad();
                }
                else
                {
                    self.sceneUI.updateGamesList( gameInfo, removed );
                }
            }
        });

    this.disconnected();

    gEngine.addScene( this );
};


SceneMultiManager.prototype.deleteLater = function()
{
    if( this.dbGames )
    {
        this.dbGames.destruct();
        this.dbGames = null;
    }

    this.SceneManagerPlay_deleteLater();
};


SceneMultiManager.prototype.updateControls = function(controls)
{
    return false;
};


SceneMultiManager.prototype.disconnected = function()
{
    this.SceneManagerPlay_disconnected();

    this.sceneUI.hideLogin();
};


SceneMultiManager.prototype.syncLoggedIn = function()
{
    this.SceneManagerPlay_syncLoggedIn();

    if( this.dbGames )
    {
        this.dbGames.reconnectGamesList();
    }

    if( !this.startingGame )
    {
        this.sceneUI.showLogin();
    }
};


SceneMultiManager.prototype.syncLoggedIntoSocialNetwork = function(network)
{
    if( !this.startingGame )
    {
        this.sceneUI.hideLogin();
        this.sceneUI.showLogin();
    }
};


SceneMultiManager.prototype.findGameToLoad = function()
{
    var gameInfos = this.dbGames.gameInfos;
    for( var i=0; i<gameInfos.length; ++i )
    {
        var gameInfo = gameInfos[i];
        if( window.CLIENT_ID === gameInfo.id )
        {
            this.loadGame( gameInfo.id );
            return;
        }
    }

    this.dbGames.requestGameID( window.CLIENT_ID );
};


SceneMultiManager.prototype.loadGame = function(clientID)
{
    if( CLIENT_ID !== clientID )
    {
        // Regiser for a final back button press to restore the multi menu
        if( CLIENT_ID === "multi" )
        {
            CCEngine.EnableBackButton( gEngine );
        }

        CLIENT_ID = clientID;
        if( MultiplayerManager.LoggedIn )
        {
            socket.emit( 'MultiSetClient', CLIENT_ID );
        }
    }

    this.startingGame = true;
    this.sceneUI.hideLogin();

    var gameInfo = null;
    if( this.dbGames )
    {
        gameInfo = this.dbGames.getGameInfo( clientID );
    }

    // No game info? Reset
    if( !gameInfo )
    {
        SceneMultiManager.LaunchMulti();
    }

    // No custom .js? Load
    else if( !gameInfo.jsFiles || gameInfo.jsFiles.length === 0 )
    {
        this.startGame( gameInfo );
    }

    // Custom .js? Download then load
    else
    {
        //AlertsManager.ModalAlert( "loading..." );
        var self = this;
        var jsFiles = gameInfo.jsFiles;
        JSManager.SyncJSFiles( jsFiles, function (updatedJS)
        {
            self.loadedJS( gameInfo );
        });
    }
};


SceneMultiManager.prototype.loadedJS = function(gameInfo)
{
    var jsFiles = gameInfo.jsFiles;
    for( var i=0; i<jsFiles.length; ++i )
    {
        var js = jsFiles[i];
        if( js.filename )
        {

            var script = JSManager.GetScript( js.filename );
            if( !script )
            {
                return false;
            }
        }
    }

    if( SceneMultiManager.LoadingGameInfoUpdated )
    {
        SceneMultiManager.LoadingGameInfoUpdated = false;
        this.loadGame( SceneMultiManager.LoadingGame );
    }

    this.startGame( gameInfo );
};


SceneMultiManager.prototype.startGame = function(gameInfo)
{
    SceneMultiManager.LoadingGame = false;
    //AlertsManager.Hide( "loading..." );

    var self = this;
    this.sceneUI.hideIcon( function()
    {
        self.deleteLater();

        if( gameInfo.jsStart && window[gameInfo.jsStart] )
        {
            new window[gameInfo.jsStart]();
        }
        else
        {
            gEngine.addScene( new SceneManagerGame() );
        }
    });
};


SceneMultiManager.prototype.hide = function()
{
    this.sceneUI.hideIcon();
};


SceneMultiManager.prototype.launchEditor = function()
{
    if( SceneMultiManager.EditorAllowed )
    {
        this.deleteLater();

        SceneMultiManager.EditorEnabled = !SceneMultiManager.EditorEnabled;
        if( SceneMultiManager.EditorEnabled )
        {
            new SceneGamesManager();
        }
    }
    else
    {
        CCEngine.WebViewOpen( "http://multiplay.io/" );
    }
};


SceneMultiManager.LaunchMulti = function()
{
    SceneMultiManager.LoadingGame = false;

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
        window.location = CC.GetURLWithoutLocationBarData();
    }
};


SceneMultiManager.RestartClient = function()
{
    MultiplayerManager.Disconnect();
    if( CCEngine.NativeUpdateCommands !== undefined )
    {
        CCEngine.NativeUpdateCommands += 'CCEngine.RestartClient;' + CLIENT_ID + '\n';
    }
    else
    {
        while( gEngine.scenes.length > 0 )
        {
            gEngine.removeScene( gEngine.scenes.last() );
        }
        CC.SetPHPLocationBarData( "client", CLIENT_ID );
    }
};
