/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : SceneCharactersManager.js
 * Description : Manager of our characters editor.
 *
 * Created     : 01/06/13
 *-----------------------------------------------------------
 */

function SceneCharactersManager()
{
    this.construct();
}
ExtendPrototype( SceneCharactersManager, SceneManagerPlay );


SceneCharactersManager.prototype.construct = function()
{
    this.SceneManagerPlay_construct();

    this.openList();

    this.disconnected();

    CC.SetJSLocationBarData( 'SceneCharactersManager' );

    var camera = gEngine.newSceneCamera( this );
    camera.setupViewport( 0.0, 0.0, 1.0, 1.0 );

    var self = this;
    this.sceneUIBack = new SceneUIBack( this, function()
    {
        self.closeList();
        self.close();
    }, true );
};


SceneCharactersManager.prototype.deleteLater = function()
{
    if( this.sceneUIBack )
    {
        this.sceneUIBack.close();
        this.sceneUIBack = null;
    }

    CC.RemoveJSLocationBarData( 'SceneCharactersManager' );
    this.SceneManagerPlay_deleteLater();
};


SceneCharactersManager.prototype.disconnected = function()
{
    AlertsManager.ModalAlert( "connecting...", 2 );
};


SceneCharactersManager.prototype.syncLoggedIn = function()
{
    this.SceneManagerPlay_syncLoggedIn();
    AlertsManager.Hide( "connecting..." );
};


SceneCharactersManager.prototype.syncUpdate = function(jsonData)
{
    this.SceneManagerPlay_syncUpdate( jsonData );

    if( jsonData.EditorCharacterDeleted )
    {
        this.openList();
    }
};


SceneCharactersManager.prototype.close = function()
{
    this.deleteLater();
    new SceneGamesManager();
};


SceneCharactersManager.prototype.newCharacter = function()
{
    var self = this;

    this.closeList();
    this.sceneCharacterEditor = new SceneCharacterEditor( this.sceneUI );
    this.sceneCharacterEditor.selectModel();
    this.sceneCharacterEditor.onClose = function(characterInfo)
    {
        self.openList();
    };
};


SceneCharactersManager.prototype.editCharacter = function(characterInfo)
{
    var self = this;

    this.closeList();
    this.sceneCharacterEditor = new SceneCharacterEditor( this );
    this.sceneCharacterEditor.setCharacter( characterInfo );
    this.sceneCharacterEditor.onClose = function(characterInfo)
    {
        self.openList();
    };
};


SceneCharactersManager.prototype.openList = function()
{
    if( !this.sceneUIList )
    {
        var self = this;
        this.sceneUIList = new SceneUIListCharacters( this, function()
        {
            self.newCharacter();
        });
        this.sceneUIList.onSelected = function(characterInfo)
        {
            self.editCharacter( characterInfo );
        };
    }
};


SceneCharactersManager.prototype.closeList = function()
{
    if( this.sceneUIList )
    {
        this.sceneUIList.close();
        this.sceneUIList = null;
    }
};