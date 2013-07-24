/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : SceneImagesManager.js
 * Description : Manager of our images editor.
 *
 * Created     : 11/07/13
 *-----------------------------------------------------------
 */

function SceneImagesManager()
{
    this.construct();
}
ExtendPrototype( SceneImagesManager, SceneManagerPlay );


SceneImagesManager.prototype.construct = function()
{
    this.SceneManagerPlay_construct();

    this.openList();

    this.disconnected();

    CC.SetJSLocationBarData( 'SceneImagesManager' );

    var camera = gEngine.newSceneCamera( this );
    camera.setupViewport( 0.0, 0.0, 1.0, 1.0 );
};


SceneImagesManager.prototype.deleteLater = function()
{
    CC.RemoveJSLocationBarData( 'SceneImagesManager' );
    this.SceneManagerPlay_deleteLater();
};


SceneImagesManager.prototype.disconnected = function()
{
    AlertsManager.ModalAlert( "connecting...", 2 );
};


SceneImagesManager.prototype.syncLoggedIn = function()
{
    this.SceneManagerPlay_syncLoggedIn();
    AlertsManager.Hide( "connecting..." );
};


SceneImagesManager.prototype.syncUpdate = function(jsonData)
{
    this.SceneManagerPlay_syncUpdate( jsonData );

    if( jsonData.EditorCharacterDeleted )
    {
        this.openList();
    }
};


SceneImagesManager.prototype.close = function()
{
    this.deleteLater();
    new SceneGamesManager();
};


SceneImagesManager.prototype.openList = function()
{
    if( !this.sceneAssetEditor )
    {
        var self = this;
        this.sceneAssetEditor = new SceneAssetEditor( this, false, true, true );
        this.sceneAssetEditor.open( "Edit Images" );
        this.sceneAssetEditor.onClose = function(tex)
        {
            if( tex )
            {
                self.sceneAssetEditor = null;
                self.openList();
                self.sceneAssetEditor.sceneUIListImages.findAndSelect( tex );
            }
            else
            {
                self.close();
            }
        };

        var currentImageInfo;
        this.sceneAssetEditor.onSelected = function (imageInfo)
        {
            if( imageInfo !== currentImageInfo )
            {
                currentImageInfo = imageInfo;
                //self.sceneAssetEditor.open( imageInfo.objectID );
                self.sceneAssetEditor.setImage( imageInfo );
            }
        };
    }
};


SceneImagesManager.prototype.closeList = function()
{
    if( this.sceneAssetEditor )
    {
        this.sceneAssetEditor.close();
    }
};