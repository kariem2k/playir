/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : ScenePlayerView.js
 * Description : 3d bot of the player
 *
 * Created     : 08/10/12
 *-----------------------------------------------------------
 */

function ScenePlayerView(parentScene, sceneWidth, playerType)
{
    this.construct();

    this.cameraCentered = true;

    {
        // If our parent scene is removed, remove this scene as well
        parentScene.linkScene( this );

        // Inform our parent on delete
        this.setParent( parentScene );
    }

    {
        // Insert the camera one below our parent's camera
        var cameraIndex = gEngine.findCameraIndex( parentScene.camera )-1;
        if( cameraIndex < 0 )
        {
            cameraIndex = 0;
        }


        var camera = gEngine.newSceneCamera( this, cameraIndex );
        camera.setupViewport( 0.0, 0.0, sceneWidth, 1.0 );
    }

    this.playerType = playerType;
}
ExtendPrototype( ScenePlayerView, CCSceneAppUI );


ScenePlayerView.prototype.construct = function()
{
    this.CCSceneAppUI_construct();

    this.cameraCentered = true;
};


ScenePlayerView.prototype.destruct = function()
{
    this.CCSceneAppUI_destruct();
};


ScenePlayerView.prototype.setup = function()
{
    var self = this;
    var camera = this.camera;
    camera.useSceneCollideables( this );

    camera.setRotationX( -15.0 );
    camera.setLookAt( [ 0.0, -30.0, 0.0 ] );
    camera.setOffset( [ 0.0, 0.0, 50.0 ] );
    camera.offsetInterpolator.setDuration( 1.0 );

    if( !sceneManagerGame.isUsablePlayer( false ) )
    {
        var tile = new CCTile3DButton( this, true );

        tile.setText( "LOCKED" );
        tile.setColour( gColour.set( 0.0, 0.5 ) );
        tile.setTextColour( gColour.setRGBA( 1.0, 1.0, 1.0, 1.0 ) );
        tile.setDrawOrder( 210 );
        tile.setRotationX( -10.0 );
        tile.setTouchDepressDepth( 1.0 );

        tile.onRelease.push( function()
        {
            sceneManagerGame.isUsablePlayer();
        });
        this.addTile( tile, 0 );

        this.text = tile;
    }

    this.player = SceneManagerPlay.SpawnCharacter( this.playerType, function(player)
    {
        vec3.copy( camera.targetLookAt, player.position );
        camera.flagUpdate();
        self.playerLoaded = true;
        self.requestResize();
    });

    this.player.setScene( this );

    this.refreshCameraView();
    this.lockCameraView();
};


ScenePlayerView.prototype.updateCamera = function(delta)
{
    if( !this.resizing && !this.cameraScrolling )
    {
        this.player.rotateY( delta * -15.0 );
    }
    return this.CCSceneAppUI_updateCamera( delta );
};


ScenePlayerView.prototype.resize = function()
{
    var camera = this.camera;
    CC.ASSERT( camera );
    camera.recalcViewport();
    camera.flagUpdate();

    var idealAspectRatio = 1.5;//1080.0f/720.0;
    var aspectRatioAdjutment = camera.getAspectRatio() < 1.25 ? camera.getAspectRatio() / idealAspectRatio : 1.0;
    if( this.playerLoaded )
    {
        camera.setCameraHeight( 30.0 / aspectRatioAdjutment, true );
    }

    if( this.text )
    {
        var tile = this.text;
        tile.setTextHeight( camera.targetHeight * 0.2 * aspectRatioAdjutment, true );
        tile.setTextScale( 0.75 );
        tile.setPositionY( -camera.targetHeight * 0.125 );
    }
};


ScenePlayerView.prototype.render = function(camera, pass, alpha)
{
    this.CCSceneAppUI_render( camera, pass, alpha );
};


ScenePlayerView.prototype.touchPressed = function(touch)
{
    return this.CCSceneAppUI_touchPressed( touch );
};


ScenePlayerView.prototype.touchMoving = function(touch, touchDelta)
{
    // Callback for when a touch is moving
    // Run through all the tiles
    var result = this.handleTilesTouch( touch, this.controlsMovingVertical ? CCControls.touch_movingVertical : CCControls.touch_movingHorizontal );
    if( result === CCSceneAppUI.tile_touchAction )
    {
        return true;
    }
    else
    {
        return this.touchCameraRotating( touchDelta.x, touchDelta.y );
    }
};


ScenePlayerView.prototype.touchReleased = function(touch, touchAction)
{
    return this.CCSceneAppUI_touchReleased( touch, touchAction );
};


ScenePlayerView.prototype.touchCameraRotating = function(x, y)
{
    // Callback for when two touches are panning the camera to rotate
    //var camera = this.camera;
    //var rotation = camera.rotation;

    //rotation[1] += -x * 180.0;
    //camera.setRotationY( rotation[1] );
    this.player.rotateY( x * 180.0 );

    //rotation[0] += -y * 180.0;
    //rotation[0] = CC.FloatClamp( rotation[0], -45.0, 45.0 );
    //camera.setRotationX( rotation[0] );
    this.player.rotateX( y * 180.0 );

    //camera.flagUpdate();
    return true;
};


ScenePlayerView.prototype.refreshCameraView = function()
{
    this.CCSceneAppUI_refreshCameraView();
};


ScenePlayerView.prototype.lockCameraView = function()
{
};
