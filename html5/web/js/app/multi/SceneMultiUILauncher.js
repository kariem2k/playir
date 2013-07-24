/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : SceneMultiUILauncher.js
 * Description : UI for launcher
 *
 * Created     : 17/02/13
 *-----------------------------------------------------------
 */

function SceneMultiUILauncher(parentScene, handleBackButton)
{
    this.construct();

    this.cameraCentered = true;

    if( parentScene )
    {
        // If our parent scene is removed, remove this scene as well
        parentScene.linkScene( this );

        // Inform our parent on delete
        this.setParent( parentScene );
    }
    gEngine.addScene( this );

    if( handleBackButton !== false )
    {
        CCEngine.EnableBackButton( this );
    }
}
ExtendPrototype( SceneMultiUILauncher, CCSceneAppUI );


SceneMultiUILauncher.prototype.handleBackButton = function()
{
    this.launchMulti();
    return true;
};


SceneMultiUILauncher.prototype.setup = function()
{
    var self = this;

    var camera = gEngine.newSceneCamera( this );
    camera.setupViewport( 0.0, 0.0, 1.0, 1.0 );
    camera.setCameraWidth( 640.0, false );
    camera.useSceneCollideables( this );

    var tile;
    {
        tile = new CCTile3DButton( self );
        tile.setupTile( camera.targetWidth, camera.targetHeight );
        tile.setColour( gColour.set( 0.125, 0.0 ) );

        tile.setDrawOrder( 204 );

        this.cameraStickyTiles.add( tile );

        this.tileBackground = tile;
    }

    {
        tile = new CCTile3DButton( this );
        tile.setColour( gColour.set( 1.0, 0.0 ) );
        tile.setDrawOrder( 205 );
        tile.setCollideable( false );

        tile.tileRotationInterpolator = new CCInterpolatorListV3( CCInterpolatorX3Curve );
        tile.setCulling( false );

        this.tileIcon = tile;

        tile.onRelease.push( function()
        {
            self.launchMulti();
        });
        this.addTile( tile );

        this.iconSrc = "resources/multi/multi_icon.png";
        gEngine.textureManager.getTextureHandle( this.iconSrc );
    }
};


SceneMultiUILauncher.prototype.resize = function()
{
    this.CCSceneAppUI_resize();

    if( this.showing )
    {
        this.show();
    }
};


SceneMultiUILauncher.prototype.render = function(camera, pass, alpha)
{
    //this.CCSceneAppUI_render( camera, pass, alpha );
};


SceneMultiUILauncher.prototype.touchMoving = function(touch, touchDelta)
{
    return false;
};


SceneMultiUILauncher.prototype.show = function()
{
    this.showing = true;

    var self = this;

    var camera = this.camera;
    var tile = this.tileIcon;

    this.enabled = true;
    camera.enabled = true;

    gEngine.textureManager.getTextureHandle( self.iconSrc, function (textureHandle)
    {
        tile.setCollideable( true );

        var size = camera.targetHeight * 0.1;
        tile.setTileSize( size );
        var padding = size * 0.6;
        tile.setPositionXY( ( camera.targetWidth * 0.5 )-padding, ( -camera.targetHeight * 0.5 )+padding );

        tile.setTileTexture( self.iconSrc );

        tile.setTileScale( 0.0, false );
        tile.setTileScale( 2.0, true );

        tile.setColourAlpha( 0.0 );
        tile.setColourAlpha( 1.0, true, function()
        {
            tile.tileRotationInterpolator.pushV3( tile.rotation, vec3.clone( [0.0, 45.0, 0.0] ), true, function()
            {
                tile.setTileScale( 1.0, true );
                tile.tileRotationInterpolator.pushV3( tile.rotation, vec3.clone( [0.0, -720.0, 0.0] ), false, function()
                {
                    tile.rotation[1] = 0.0;
                });
            });
        });
    });
};


SceneMultiUILauncher.prototype.hide = function(close)
{
    this.showing = false;

    var self = this;

    var tile = this.tileIcon;
    tile.setColourAlpha( 0.0, true, function()
    {
        if( !self.showing )
        {
            self.enabled = false;
            self.camera.enabled = false;
            if( close )
            {
                self.deleteLater();
            }
        }
    });
    tile.tileRotationInterpolator.pushV3( tile.rotation, vec3.clone( [0.0, -720.0, 0.0] ), true );
    tile.setTileScale( 2.0, true );
    tile.setCollideable( false );
};



SceneMultiUILauncher.prototype.launchMulti = function()
{
    if( !this.launching )
    {
        this.launching = true;

        var self = this;

        // Tell our parent that this scene will be deleted
        if( this.parentScene )
        {
            this.unlinkScene( this.parentScene );
        }

        var camera = this.camera;
        this.enabled = true;
        camera.enabled = true;

        var tile;
        {
            tile = this.tileBackground;
            tile.setTileSize( camera.targetWidth, camera.targetHeight );
            tile.setColourAlpha( 1.0, true );
        }

        {
            tile = this.tileIcon;
            tile.setColourAlpha( 0.0, true );
            tile.setTileScale( 8.0, true );
            //tile.setTileMovementXY( 0.0, 0.0 );

            tile.tileRotationInterpolator.pushV3( tile.rotation, vec3.clone( [0.0, -720.0, 0.0] ), true, function()
            {
                //self.deleteLater();
                SceneMultiManager.LaunchMulti();
            });
        }
    }
};
