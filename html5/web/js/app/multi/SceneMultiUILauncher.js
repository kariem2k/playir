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

    if( handleBackButton === true )
    {
        this.shouldHandleBackButton = true;
        CCEngine.EnableBackButton( this );
    }

    SceneMultiUILauncher.Instance = this;
}
ExtendPrototype( SceneMultiUILauncher, CCSceneAppUI );

SceneMultiUILauncher.Instance = null;


SceneMultiUILauncher.prototype.handleBackButton = function()
{
    if( this.shouldHandleBackButton )
    {
        this.shouldHandleBackButton = false;
        this.launch();
        return true;
    }
    return false;
};


SceneMultiUILauncher.prototype.deleteLater = function()
{
    if( SceneMultiUILauncher.Instance === this )
    {
        SceneMultiUILauncher.Instance = null;
    }
    this.CCSceneAppUI_deleteLater();
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
        tile = new CCTile3DButton( this );
        tile.setupTile( camera.targetWidth, camera.targetHeight );
        tile.setColour( gColour.set( 0.0, 0.0 ) );
        tile.getColourInterpolator().setDuration( 1.0 );

        tile.setDrawOrder( 204 );

        this.cameraStickyTiles.add( tile );

        this.tileBackground = tile;
    }

    {
        tile = new CCTile3DButton( this );
        tile.setColour( gColour.set( 1.0, 0.0 ) );
        tile.getColourInterpolator().setDuration( 0.5 );
        tile.setDrawOrder( 205 );
        tile.setCollideable( false );

        tile.tileRotationInterpolator = new CCInterpolatorListV3( CCInterpolatorX3Curve );
        tile.setCulling( false );

        this.tileIcon = tile;

        tile.onRelease.push( function()
        {
            self.launch();
        });
        this.addTile( tile );

        this.iconSrc = "playir_icon.png";
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

        var size = camera.targetHeight * 0.2;
        tile.setTileSize( size );
        var padding = size * 0.6;
        tile.setPositionXY( ( camera.targetWidth * 0.5 )-padding, ( -camera.targetHeight * 0.5 )+padding );

        tile.setTileTexture( self.iconSrc );

        tile.setTileScale( 0.0, false );
        tile.setTileScale( 1.5, true );

        tile.setColourAlpha( 1.0, true, function()
        {
            tile.tileRotationInterpolator.pushV3( tile.rotation, vec3.clone( [0.0, -5.0, 0.0] ), true, function()
            {
                tile.setTileScale( 1.0, true );
                tile.tileRotationInterpolator.setDuration( 0.5 );
                tile.tileRotationInterpolator.pushV3( tile.rotation, vec3.clone( [0.0, 0.0, 0.0] ), false, function()
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
    tile.tileRotationInterpolator.pushV3( tile.rotation, vec3.clone( [0.0, -5.0, 0.0] ), true );
    tile.setTileScale( 1.5, true );
    tile.setCollideable( false );
};



SceneMultiUILauncher.prototype.launch = function(fast, callback)
{
    if( !this.launching )
    {
        this.launching = true;

        if( fast )
        {
            this.tileBackground.getColourInterpolator().setDuration( 0.25 );
            this.tileIcon.getColourInterpolator().setDuration( 0.2 );
            this.tileIcon.tileRotationInterpolator.setDuration( 0.25 );
        }

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
            tile.setColourAlpha( 1.0, true, function()
            {
                tile.setColourAlpha( 0.0, true );
                tile.setTileScale( 4.0, true );
                //tile.setTileMovementXY( 0.0, 0.0 );

                tile.tileRotationInterpolator.pushV3( tile.rotation, vec3.clone( [0.0, -5.0, 0.0] ), true, function()
                {
                    if( callback )
                    {
                        callback();
                    }
                    self.deleteLater();
                    SceneMultiManager.Launch();
                });
            });
        }
    }
};
