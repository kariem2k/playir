/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : SceneMultiUIIntro.js
 * Description : UI for intro
 *
 * Created     : 16/02/13
 *-----------------------------------------------------------
 */

function SceneMultiUIIntro(parentScene, multiManager)
{
    this.construct();

    this.multiManager = multiManager;
    this.cameraCentered = true;

    if( parentScene )
    {
        // If our parent scene is removed, remove this scene as well
        parentScene.linkScene( this );

        // Inform our parent on delete
        this.setParent( parentScene );
    }
    gEngine.addScene( this );

    this.started = false;
}
ExtendPrototype( SceneMultiUIIntro, CCSceneAppUI );


SceneMultiUIIntro.prototype.setup = function()
{
    var self = this;

    var camera = gEngine.newSceneCamera( this );
    camera.setupViewport( 0.0, 0.0, 1.0, 1.0 );
    camera.setCameraWidth( 640.0, false );

    var tile;
    {
        tile = new CCTile3DButton( this );
        tile.setColour( gColour.set( 1.0, 0.0 ) );
        tile.setDrawOrder( 205 );

        tile.tileRotationInterpolator = new CCInterpolatorListV3( CCInterpolatorX3Curve );
        tile.disableCulling = true;

        tile.setColourAlpha( 0.0 );
        tile.setTileScale( 0.0, false );
        tile.setCollideable( false );
        tile.setTileSize( 1.0 );
        tile.setTileTexture( "resources/multi/multi_icon.png" );

        this.tileIcon = tile;

        tile.onRelease.push( function()
        {
            self.multiManager.launchEditor();
        });
        this.addTile( tile );
    }

    var timer = new CCTimer();
    timer.onTime.push( function()
    {
        self.started = true;
        self.start();
    });
    timer.start( 1.0 );
    this.timers.push( timer );
};


SceneMultiUIIntro.prototype.resize = function()
{
    this.CCSceneAppUI_resize();

    if( this.started )
    {
        this.start();
    }
};


SceneMultiUIIntro.prototype.touchMoving = function(touch, touchDelta)
{
    return false;
};


SceneMultiUIIntro.prototype.start = function()
{
    var self = this;

    var camera = this.camera;
    var tile;
    {
        tile = this.tileIcon;
        var size = camera.targetWidth * 0.5;
        tile.setTileSize( size );
        self.showIcon();
    }
};


SceneMultiUIIntro.prototype.showIcon = function()
{
    var self = this;

    var tile = this.tileIcon;

    if( !this.hidingIcon )
    {
        tile.setTileScale( 1.0, true );
        tile.setColourAlpha( 1.0, true, function()
        {
            tile.tileRotationInterpolator.pushV3( tile.rotation, vec3.clone( [ 0.0, 45.0, 0.0 ] ), false, function()
            {
                self.showingIcon = true;
                if( self.dockingIcon )
                {
                    self.dockIcon();
                }
            });
        });
    }
};


SceneMultiUIIntro.prototype.dockIcon = function(callback)
{
    if( !this.hidingIcon )
    {
        this.dockingIcon = true;

        var self = this;
        if( callback )
        {
            this.dockedCallback = callback;
        }

        if( this.showingIcon )
        {
            delete this.showingIcon;
            this.dockedIcon = true;

            var camera = this.camera;
            var newSize = camera.targetWidth * 0.125;

            var tile = this.tileIcon;
            var scale = newSize / tile.collisionSize.width;


            tile.setTileMovementXY( ( -camera.targetWidth * 0.5 )+newSize, ( -camera.targetHeight * 0.5 )+newSize );
            tile.movementInterpolator.setDuration( 0.5 );
            tile.tileRotationInterpolator.setDuration( 0.5 );
            tile.setTileScale( scale * 2.0, true );
            tile.tileRotationInterpolator.pushV3( tile.rotation, vec3.clone( [ 0.0, 0.0, 0.0 ] ), false, function()
            {
                tile.setTileScale( scale, true, function()
                {
                    tile.setTileSize( newSize );
                    tile.setTileScale( 1.0, false );
                });

                tile.rotation[1] = 0.0;
                tile.setCollideable( true );

                if( self.dockedIcon )
                {
                    if( self.dockedCallback )
                    {
                        self.dockedCallback();
                        delete self.dockedCallback;
                    }
                }
            });
        }
    }
};


SceneMultiUIIntro.prototype.hide = function(callback)
{
    this.hidingIcon = true;

    var tile = this.tileIcon;
    if( this.dockingIcon )
    {
        tile.setColourAlpha( 0.0, true );
        tile.setTileScale( 2.0, true );
        tile.tileRotationInterpolator.setDuration( 1.0 );
        tile.tileRotationInterpolator.pushV3( tile.rotation, vec3.clone( [ 0.0, -720.0, 0.0 ] ), false, function()
        {
            if( callback )
            {
                callback();
            }
        });
    }
    else
    {
        this.start();
        tile.setTileScale( 1.0, true );
        tile.setColourAlpha( 1.0, true, function()
        {
            tile.tileRotationInterpolator.pushV3( tile.rotation, vec3.clone( [ 0.0, 0.0, 0.0 ] ), true, function() {
                tile.setColourAlpha( 0.0, true, function()
                {
                    if( callback )
                    {
                        callback();
                    }
                });
            });
        });
    }
};

