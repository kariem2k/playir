/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : SceneGamesManagerUI.js
 * Description : UI for our in game editor
 *
 * Created     : 23/02/13
 *-----------------------------------------------------------
 */

function SceneGamesManagerUI(gamesManager)
{
    this.construct();

    {
        this.gamesManager = gamesManager;

        // If our parent scene is removed, remove this scene as well
        gamesManager.linkScene( this );

        // If this scene is removed, remove our parent scene as well
        this.linkScene( gamesManager );
    }

    {
        var parentCameraIndex = gEngine.findCameraIndex( gamesManager.camera );

        var camera = gEngine.newSceneCamera( this, parentCameraIndex+1 );
        camera.setupViewport( 0.0, 0.0, 1.0, 1.0 );
    }

    this.sceneMultiLauncher = new SceneMultiUILauncher( this, false );
    this.sceneLogin = null;
    this.sceneGamesList = null;
}
ExtendPrototype( SceneGamesManagerUI, CCSceneAppUI );


SceneGamesManagerUI.prototype.deleteLater = function()
{
    this.close();
    this.CCSceneAppUI_deleteLater();

    if( this.sceneMultiLauncher )
    {
        this.sceneMultiLauncher.hide( true );
        this.sceneMultiLauncher = null;
    }
};


SceneGamesManagerUI.prototype.setup = function()
{
    var self = this;
    var camera = this.camera;
    camera.setCameraWidth( 400.0, false );

    this.requestResize();
};


SceneGamesManagerUI.prototype.deletingChild = function(inScene)
{
    if( inScene === this.sceneMultiLauncher )
    {
        this.hideLogin();
    }

    this.CCSceneAppUI_deletingChild( inScene );
};


SceneGamesManagerUI.prototype.touchMoving = function(touch, touchDelta)
{
    return false;
};


SceneGamesManagerUI.prototype.close = function()
{
    this.closeGamesList();
    this.closeGameEditor();
    this.closeAssetEditor();
};


SceneGamesManagerUI.prototype.showLogin = function()
{
    if( !this.sceneLogin )
    {
        this.sceneLogin = new SceneMultiUILogin( this, this.multiManager );
    }
};


SceneGamesManagerUI.prototype.hideLogin = function()
{
    if( this.sceneLogin )
    {
        this.sceneLogin.close();
        this.sceneLogin = null;
    }
};


SceneGamesManagerUI.prototype.openGamesList = function(gameInfos)
{
    if( this.sceneGameEditor )
    {
        this.closeGameEditor();
    }
    if( this.sceneGamesList )
    {
        this.closeGamesList();
    }

    this.sceneGamesList = new SceneGamesManagerList( this, this.gamesManager );
    this.sceneGamesList.loadGameInfos( gameInfos );

    this.sceneMultiLauncher.show();
    this.showLogin();
};


SceneGamesManagerUI.prototype.updateGamesList = function(gameInfo, removed)
{
    if( this.sceneGamesList )
    {
        this.sceneGamesList.updatedGameInfo( gameInfo, removed );
    }
};


SceneGamesManagerUI.prototype.closeGamesList = function()
{
    this.hideLogin();
    if( this.sceneGamesList )
    {
        this.sceneGamesList.close();
        this.sceneGamesList = null;
    }

    if( this.sceneMultiLauncher )
    {
        this.sceneMultiLauncher.hide();
    }
};


SceneGamesManagerUI.prototype.openGameEditor = function(gameInfo, checkForChangesBeforeReOpen)
{
    if( this.sceneGameEditor )
    {
        if( checkForChangesBeforeReOpen )
        {
            var currentGameInfo = this.sceneGameEditor.gameInfo;
            if( gameInfo.id === currentGameInfo.id )
            {
                if( CC.DeepEquals( currentGameInfo, gameInfo ) )
                {
                    return false;
                }
            }
        }

        this.sceneGameEditor.setupGameInfo( gameInfo );
        return true;
    }

    this.sceneGameEditor = new SceneGameEditor( this, this.gamesManager, gameInfo );
    return true;
};


SceneGamesManagerUI.prototype.closeGameEditor = function()
{
    if( this.sceneGameEditor )
    {
        this.sceneGameEditor.close( false );
        this.sceneGameEditor = null;
    }
};


SceneGamesManagerUI.prototype.openAssetEditor = function(title, supportObj, callback)
{
    if( this.sceneAssetEditor )
    {
        this.closeAssetEditor();
    }

    this.sceneAssetEditor = new SceneAssetEditor( this, supportObj, true );
    this.sceneAssetEditor.open( title );

    if( callback )
    {
        this.sceneAssetEditor.onClose = callback;
    }
};


SceneGamesManagerUI.prototype.closeAssetEditor = function()
{
    if( this.sceneAssetEditor )
    {
        this.sceneAssetEditor.close();
        this.sceneAssetEditor = null;
    }
};


SceneGamesManagerUI.prototype.editAsset = function(src)
{
    if( src )
    {
        this.sceneAssetEditor.setAsset( src );
    }
};


SceneGamesManagerUI.prototype.openVisualJSEditor = function(filename, onClose)
{
    this.closeVisualJSEditor();
    this.sceneVisualJSEditor = new SceneVisualJSEditor( this );
    this.sceneVisualJSEditor.open( filename, onClose );
    return true;
};


SceneGamesManagerUI.prototype.closeVisualJSEditor = function()
{
    if( this.sceneVisualJSEditor )
    {
        this.sceneVisualJSEditor.close( false );
        this.sceneVisualJSEditor = null;
    }
};