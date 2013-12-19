/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : SceneUIImage.js
 * Description : UI to display full screen image.
 *
 * Created     : 13/03/13
 *-----------------------------------------------------------
 */

function SceneUIImage(parentScene)
{
    this.construct();

    {
        // If our parent scene is removed, remove this scene as well
        parentScene.linkScene( this );
    }

    {
        var camera = gEngine.newSceneCamera( this );
        this.camera.setupViewport( 0.0, 0.0, 1.0, 1.0 );
    }

    gEngine.addScene( this );

    this.open = true;
}
ExtendPrototype( SceneUIImage, CCSceneAppUI );


SceneUIImage.prototype.setup = function()
{
    var self = this;
    var camera = this.camera;
    camera.setCameraWidth( 640.0, false );
    camera.useSceneCollideables( this );

    var tile;
    {
        tile = new CCTile3DButton( self );
        tile.setupTile( camera.targetWidth, camera.targetHeight );
        tile.setColour( gColour.set( 0.25, 0.0 ) );
        tile.setColourAlpha( 0.95, true );

        tile.setDrawOrder( 203 );

        this.cameraStickyTiles.add( tile );

        this.tileBackground = tile;
    }

    {
        tile = new CCTile3DButton( this );
        this.tileHelp = tile;
        tile.setupTexturedFit( camera.targetWidth, camera.targetHeight, false, SceneManagerGame.HelpImage );

        tile.setTileScale( 0.0 );
        tile.setTileScale( 1.0, true );
        tile.setColour( gColour.set( 1.0, 0.0 ) );
        tile.setColourAlpha( 1.0, true );
        tile.setDrawOrder( 206 );

        tile.onRelease.push( function()
        {
            self.close();
        });
        this.addTile( tile, 0 );
    }
};


SceneUIImage.prototype.handleBackButton = function()
{
    if( this.open )
    {
        this.close();
        return true;
    }

    return false;
};


SceneUIImage.prototype.render = function(camera, pass, alpha)
{
    this.CCSceneAppUI_render( camera, pass, alpha );
};


SceneUIImage.prototype.resize = function()
{
    this.CCSceneAppUI_resize();

    var camera = this.camera;

    this.tileBackground.setTileSize( camera.targetWidth, camera.targetHeight );
    this.tileHelp.setTileTextureFit( camera.targetWidth, camera.targetHeight );
};


// Take over controls
SceneUIImage.prototype.updateControls = function(controls)
{
    this.CCSceneAppUI_updateControls( controls );
    return true;
};


SceneUIImage.prototype.touchMovementAllowed = function(touch, touchDelta)
{
    return false;
};


SceneUIImage.prototype.close = function()
{
    if( this.open )
    {
        this.open = false;

        var self = this;

        var tile = this.tileHelp;
        tile.setColourAlpha( 0.0, true, function()
        {
            self.deleteLater();
        });
        tile.setTileScale( 4.0, true );

        this.tileBackground.setColourAlpha( 0.0, true );
    }
};
