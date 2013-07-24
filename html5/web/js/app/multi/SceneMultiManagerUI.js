/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : SceneMultiManagerUI.js
 * Description : UI for our in multi client
 *
 * Created     : 15/02/13
 *-----------------------------------------------------------
 */

function SceneMultiManagerUI(multiManager)
{
    this.construct();

    {
        this.multiManager = multiManager;

        // If our parent scene is removed, remove this scene as well
        multiManager.linkScene( this );

        // If this scene is removed, remove our parent scene as well
        this.linkScene( multiManager );
    }

    this.sceneIntro = null;
    this.sceneLogin = null;
    this.sceneGamesList = null;
}
ExtendPrototype( SceneMultiManagerUI, CCSceneBase );


SceneMultiManagerUI.prototype.setup = function()
{
};


SceneMultiManagerUI.prototype.showIcon = function()
{
    if( !this.sceneIntro )
    {
        this.sceneIntro = new SceneMultiUIIntro( this, this.multiManager );
    }
};


SceneMultiManagerUI.prototype.hideIcon = function(callback)
{
    if( this.sceneIntro )
    {
        this.sceneIntro.hide( callback );
    }
};


SceneMultiManagerUI.prototype.dockIcon = function(callback)
{
    if( this.sceneIntro )
    {
        this.sceneIntro.dockIcon( callback );
    }
};


SceneMultiManagerUI.prototype.showLogin = function()
{
    if( !this.sceneLogin )
    {
        this.sceneLogin = new SceneMultiUILogin( this, this.multiManager );
    }
};


SceneMultiManagerUI.prototype.hideLogin = function()
{
    if( this.sceneLogin )
    {
        this.sceneLogin.close();
        this.sceneLogin = null;
    }
};


SceneMultiManagerUI.prototype.preloadGamesList = function(callback)
{
    if( !this.sceneGamesList )
    {
        this.sceneGamesList.preloadGamesList( callback );
    }
};


SceneMultiManagerUI.prototype.reconnectGamesList = function()
{
    if( this.sceneGamesList )
    {
        this.sceneGamesList.reconnectGamesList();
    }
};


SceneMultiManagerUI.prototype.loadGamesList = function(gameInfos)
{
    if( !this.sceneGamesList )
    {
        this.sceneGamesList = new SceneMultiUIGamesList( this, this.multiManager );
    }
    this.sceneGamesList.loadGameInfos( gameInfos );
};


SceneMultiManagerUI.prototype.showGamesList = function()
{
    if( this.sceneGamesList )
    {
        this.sceneGamesList.show();
    }
};


SceneMultiManagerUI.prototype.updateGamesList = function(gameInfo, removed)
{
    if( this.sceneGamesList )
    {
        this.sceneGamesList.updatedGameInfo( gameInfo, removed );
    }
};


SceneMultiManagerUI.prototype.hideGamesList = function()
{
    if( this.sceneGamesList )
    {
        this.sceneGamesList.deleteLater();
        this.sceneGamesList = null;
    }
};
