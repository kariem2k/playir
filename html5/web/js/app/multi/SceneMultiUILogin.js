/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : SceneMultiUILogin.js
 * Description : UI for intro
 *
 * Created     : 16/02/13
 *-----------------------------------------------------------
 */

function SceneMultiUILogin(parentScene)
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
}
ExtendPrototype( SceneMultiUILogin, CCSceneAppUI );


SceneMultiUILogin.prototype.setup = function()
{
    var self = this;

    var camera = gEngine.newSceneCamera( this );
    camera.setupViewport( 0.0, 0.0, 1.0, 1.0 );
    camera.setCameraWidth( 640.0, false );

    // Create the user tile
    {
        tile = new TileSocialProfile( this );
        tile.setTileSize( camera.targetHeight * 0.1 );
        tile.setPositionX( camera.targetWidth * 0.5 - tile.collisionBounds[0] * 1.5 );
        tile.setPositionY( camera.targetHeight * 0.5 + tile.collisionBounds[1] );

        this.tileProfile = tile;

        tile.onRelease.push( function()
        {
            self.showProfileLogin();
        });
        this.addTile( tile, 0 );
    }

    var timer = new CCTimer();
    timer.onTime.push( function()
    {
        self.open = true;
        self.requestResize();
    });
    timer.start( 1.0 );
    this.timers.push( timer );
};


SceneMultiUILogin.prototype.resize = function()
{
    this.CCSceneAppUI_resize();

    var camera = this.camera;

    var tile = this.tileProfile;
    tile.setTileSize( camera.targetHeight * 0.1 );
    if( this.open )
    {
        tile.setTileMovementY( camera.targetHeight * 0.5 - tile.collisionBounds[1] * 1.5 );
    }
};


SceneMultiUILogin.prototype.touchMoving = function(touch, touchDelta)
{
    return false;
};


SceneMultiUILogin.prototype.close = function()
{
    this.open = false;

    if( this.sceneProfileLogin )
    {
        this.sceneProfileLogin.close();
    }

    var camera = this.camera;
    var tile = this.tileProfile;
    tile.setTileMovementY( camera.targetHeight );

    var self = this;
    tile.setColourAlpha( 0.0, true, function()
    {
        self.deleteLater();
    });
};


SceneMultiUILogin.prototype.showProfileLogin = function()
{
    if( MultiplayerManager.LoggedIn )
    {
        if( !this.sceneProfileLogin )
        {
            this.sceneProfileLogin = new SceneProfileLogin( this );
        }
    }
};
