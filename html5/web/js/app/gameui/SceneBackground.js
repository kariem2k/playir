/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : SceneBackground.js
 * Description : Our UI background.
 *
 * Created     : 02/10/12
 *-----------------------------------------------------------
 */

function SceneBackground()
{
    this.construct();
}
ExtendPrototype( SceneBackground, CCSceneAppUI );


SceneBackground.SceneWidth = 960.0;
SceneBackground.BackgroundImage = "resources/androids/phonewars_background.jpg";


SceneBackground.prototype.construct = function()
{
    this.CCSceneAppUI_construct();
};


SceneBackground.prototype.setup = function()
{
	this.CCSceneAppUI_setup();

    var camera = this.camera;
    camera.setCameraWidth( SceneBackground.SceneWidth );
    camera.useSceneCollideables( this );

    // Create background
    {
        var tile = new CCTile3DButton( this );
        tile.setTouchDepressDepth( 0.0 );
        tile.setColourAlpha( 0.0 );
        tile.setTileSize( camera.targetWidth, camera.targetHeight );

        tile.onRelease.push( function()
        {
            sceneManagerGame.backgroundTilePressed();
        });
        this.addTile( tile );

        this.tileBackground = tile;

        this.refreshBackgroundImage();
    }

    this.refreshCameraView();
    this.lockCameraView();
};


SceneBackground.prototype.render = function(camera, pass, alpha)
{
    //this.CCSceneAppUI_render( camera, pass, alpha );
};


SceneBackground.prototype.resize = function()
{
    this.CCSceneAppUI_resize();

    var camera = this.camera;

    if( this.tileBackground.getTileTextureImage() )
    {
        this.tileBackground.setTileTexturedFit( camera.targetWidth, camera.targetHeight, true );
    }
};


SceneBackground.prototype.touchPressed = function(touch)
{
    return this.CCSceneAppUI_touchPressed( touch );
};


SceneBackground.prototype.touchMoving = function(touch, touchDelta)
{
    return false;
};


SceneBackground.prototype.touchReleased = function(touch, touchAction)
{
    return this.CCSceneAppUI_touchReleased( touch, touchAction );
};


SceneBackground.prototype.show = function()
{
    this.enabled = true;
    this.camera.enabled = true;

    this.showing = true;
    var tile = this.tileBackground;
    if( tile.getTileTextureImage() )
    {
        tile.setColourAlpha( 1.0, true );
    }
    tile.setCollideable( true );
};


SceneBackground.prototype.hide = function()
{
    var self = this;

    this.showing = false;
    var tile = this.tileBackground;
    tile.setColourAlpha( 0.0, true, function()
    {
        self.enabled = false;
        self.camera.enabled = false;
    });
    tile.setCollideable( false );
};


SceneBackground.prototype.refreshBackgroundImage = function()
{
    if( this.tileBackground )
    {
        var self = this;

        var tile = this.tileBackground;
        tile.setColourAlpha( 0.0, true );

        tile.setupTextured( SceneBackground.BackgroundImage, function (tile, textureHandle)
        {
            if( self.showing )
            {
                tile.setColourAlpha( 1.0, true );
            }

            if( textureHandle )
            {
                self.requestResize();
            }
        });
    }
};
