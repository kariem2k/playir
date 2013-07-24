/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : SceneAudioManager.js
 * Description : Manager of our audio editor.
 *
 * Created     : 08/06/13
 *-----------------------------------------------------------
 */

function SceneAudioManager()
{
    this.construct();
}
ExtendPrototype( SceneAudioManager, SceneManagerPlay );


SceneAudioManager.prototype.construct = function()
{
    this.SceneManagerPlay_construct();

    this.openList();

    this.disconnected();

    CC.SetJSLocationBarData( 'SceneAudioManager' );

    var camera = gEngine.newSceneCamera( this );
    camera.setupViewport( 0.0, 0.0, 1.0, 1.0 );
};


SceneAudioManager.prototype.deleteLater = function()
{
    if( this.sceneUIBack )
    {
        this.sceneUIBack.close();
        this.sceneUIBack = null;
    }

    CC.RemoveJSLocationBarData( 'SceneAudioManager' );
    this.SceneManagerPlay_deleteLater();
};


SceneAudioManager.prototype.disconnected = function()
{
    AlertsManager.ModalAlert( "connecting...", 2 );
};


SceneAudioManager.prototype.syncLoggedIn = function()
{
    this.SceneManagerPlay_syncLoggedIn();
    AlertsManager.Hide( "connecting..." );
};


SceneAudioManager.prototype.syncUpdate = function(jsonData)
{
    this.SceneManagerPlay_syncUpdate( jsonData );

    if( jsonData.EditorCharacterDeleted )
    {
        this.openList();
    }
};


SceneAudioManager.prototype.close = function()
{
    this.deleteLater();
    new SceneGamesManager();
};


SceneAudioManager.prototype.edit = function(info)
{
    var self = this;

    this.closeList();
    this.sceneEditor = new SceneAudioEditor( this.sceneUI );
    this.sceneEditor.setInfo( info );
    this.sceneEditor.open( "Play " + info.id );
    this.sceneEditor.onClose = function(info)
    {
        self.openList();
    };
};


SceneAudioManager.prototype.openList = function()
{
    var self = this;
    if( !this.sceneUIList )
    {
        this.sceneUIList = new SceneUIListAudio( this, function()
        {
            AlertsManager.TimeoutAlert( "Drop in .mp3", 3.0 );
        });
        this.sceneUIList.onSelected = function(info)
        {
            self.edit( info );
        };
    }

    if( !this.sceneUIBack )
    {
        this.sceneUIBack = new SceneUIBack( this.sceneUIList, function()
        {
            self.closeList();
            self.close();
        }, true );
    }
};


SceneAudioManager.prototype.closeList = function()
{
    if( this.sceneUIList )
    {
        this.sceneUIList.close();
        this.sceneUIList = null;
    }

    if( this.sceneUIBack )
    {
        this.sceneUIBack.close();
        this.sceneUIBack = null;
    }
};