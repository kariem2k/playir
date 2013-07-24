/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : SceneUIBack.js
 * Description : UI for our back button.
 *
 * Created     : 20/12/12
 *-----------------------------------------------------------
 */

function SceneUIBack(parentScene, callback, editorButton)
{
    this.construct();

    this.callback = callback;
    this.editorButton = editorButton;

    {
        // Inform our parent on delete
        this.setParent( parentScene );
    }

    {
        var parentCameraIndex = gEngine.findCameraIndex( parentScene.camera );

        var camera = gEngine.newSceneCamera( this, parentCameraIndex+1 );
        this.camera.setupViewport( 0.0, 0.0, 1.0, 1.0 );
    }

    gEngine.addScene( this );

    CCEngine.EnableBackButton( this );
}
ExtendPrototype( SceneUIBack, CCSceneAppUI );


SceneUIBack.prototype.deleteLater = function()
{
    if( !this.disabledBackButton )
    {
        this.disabledBackButton = true;
    }
    this.CCSceneAppUI_deleteLater();
};


SceneUIBack.prototype.handleBackButton = function()
{
    if( !this.disabledBackButton )
    {
        this.close();
        this.callback();
        return true;
    }
    return false;
};


SceneUIBack.prototype.setup = function()
{
    var self = this;
    var camera = this.camera;
    camera.setCameraWidth( 640.0, false );
    camera.useSceneCollideables( this );

    var tile;
    {
        tile = new CCTile3DButton( this );
        this.tileBack = tile;

        if( this.editorButton )
        {
            tile.setupTexturedWidth( camera.cameraWidth * 0.1, "resources/editor/editor_tile_back.jpg", function()
            {
                tile.setPositionX( camera.cameraHWidth + tile.collisionBounds[0] );
                self.requestResize();
            });
        }
        else
        {
            tile.setupTexturedWidth( camera.cameraWidth * 0.085, "resources/common/uimenu/ui_back.png", function()
            {
                self.requestResize();
            });
        }

        tile.setColour( gColour.set( 1.0, 0.0 ) );
        tile.setColourAlpha( 1.0, true );
        tile.setDrawOrder( 204 );

        tile.onRelease.push( function()
        {
            self.close();
            self.callback();
        });
        this.addTile( tile, 0 );
    }
};


SceneUIBack.prototype.render = function(camera, pass, alpha)
{
    //this.CCSceneAppUI_render( camera, pass, alpha );
};


SceneUIBack.prototype.resize = function()
{
    this.CCSceneAppUI_resize();

    var camera = this.camera;
    if( this.tileBack )
    {
        var tile = this.tileBack;
        tile.setPositionY( camera.cameraHHeight - tile.collisionBounds[1] );
        if( this.editorButton )
        {
            tile.setTileMovementX( ( camera.targetWidth * 0.5 ) - tile.collisionBounds[0] );
        }
        else
        {
            tile.setPositionX( camera.cameraHWidth - tile.collisionBounds[0] );
        }
    }
};


SceneUIBack.prototype.touchPressed = function(touch)
{
    return this.CCSceneAppUI_touchPressed( touch );
};


SceneUIBack.prototype.touchMoving = function(touch, touchDelta)
{
    return false;
};


SceneUIBack.prototype.touchReleased = function(touch, touchAction)
{
    return this.CCSceneAppUI_touchReleased( touch, touchAction );
};


SceneUIBack.prototype.close = function()
{
    var self = this;

    var tile = this.tileBack;
    tile.setColourAlpha( 0.0, true, function()
    {
        self.deleteLater();
    });

    if( this.editorButton )
    {
        var camera = this.camera;
        tile.setTileMovementX( ( camera.targetWidth * 0.5 ) + tile.collisionBounds[0] );
    }
};
