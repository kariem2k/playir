/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : SceneEditorUI.js
 * Description : UI for our in editor UI overlay
 *
 * Created     : 01/06/13
 *-----------------------------------------------------------
 */

function SceneEditorUI(mapEditor, mapsManager)
{
    this.construct();

    var camera = gEngine.newSceneCamera( this );
    camera.setupViewport( 0.0, 0.0, 1.0, 1.0 );
}
ExtendPrototype( SceneEditorUI, CCSceneAppUI );


SceneEditorUI.prototype.deleteLater = function()
{
    this.hideMenu();

    this.CCSceneAppUI_deleteLater();
};


SceneEditorUI.prototype.setup = function()
{
    this.camera.setCameraWidth( 640.0, false );

    var tile;

    var bottomMenuTiles = this.bottomMenuTiles = [];
    var sideMenuTiles = this.sideMenuTiles = [];

    if( this.setupUI )
    {
        this.setupUI();
    }

    // Add some noise to the animations of the menu show/hide sequences
    var i;
    for( i=0; i<bottomMenuTiles.length; ++i )
    {
        tile = bottomMenuTiles[i];
        tile.setCollideable( false );
    }

    var duration = 1.0;
    for( i=0; i<sideMenuTiles.length; ++i )
    {
        tile = sideMenuTiles[i];
        tile.setCollideable( false );
        tile.movementInterpolator.setDuration( duration );
        duration += 0.5;
    }

    this.requestResize();
};

SceneEditorUI.prototype.updateScene = function(delta)
{
    this.CCSceneAppUI_updateScene( delta );
};


SceneEditorUI.prototype.render = function(camera, pass, alpha)
{
    this.CCSceneAppUI_render( camera, pass, alpha );
};


SceneEditorUI.prototype.resize = function()
{
    this.CCSceneAppUI_resize();

    var camera = this.camera;
    var tile, i;

    var bottomMenuTiles = this.bottomMenuTiles;
    var tileHeight = camera.targetHeight * 0.075;
    for( i=0; i<bottomMenuTiles.length; ++i )
    {
        tile = bottomMenuTiles[i];

        if( tile.textObject )
        {
            tile.setTextHeight( tileHeight * 0.9, true );
            tile.setTileSize( tile.collisionSize.width * 1.2,
                              tileHeight );
        }
        else
        {
            tile.setTileSize( tileHeight );
        }

        if( i === 0 )
        {
            tile.setPositionXY( camera.cameraHWidth - tile.collisionBounds[0],
                                -camera.cameraHHeight + tile.collisionBounds[1] );
        }
        else
        {
            tile.positionTileLeft( bottomMenuTiles[i-1] );
        }
    }

    var sideMenuTiles = this.sideMenuTiles;
    for( i=0; i<sideMenuTiles.length; ++i )
    {
        tile = sideMenuTiles[i];
        if( i === 0 )
        {
            tile.setPositionXYZ( camera.cameraHWidth - tile.collisionBounds[0],
                                 camera.cameraHHeight - tile.collisionBounds[1],
                                 0.0 );
        }
        else
        {
            tile.positionTileBelow( sideMenuTiles[i-1] );
        }
    }
};


SceneEditorUI.prototype.touchPressed = function(touch)
{
    return this.CCSceneAppUI_touchPressed( touch );
};


SceneEditorUI.prototype.touchMoving = function(touch, touchDelta)
{
    return false;
};


SceneEditorUI.prototype.touchReleased = function(touch, touchAction)
{
    return this.CCSceneAppUI_touchReleased( touch, touchAction );
};


SceneEditorUI.prototype.showMenu = function()
{
    var camera = this.camera;
    var bottomMenuTiles = this.bottomMenuTiles;
    var sideMenuTiles = this.sideMenuTiles;
    var tile, i;

    for( i=0; i<bottomMenuTiles.length; ++i )
    {
        tile = bottomMenuTiles[i];
        tile.setPositionY( ( -camera.targetHeight * 0.5 ) - tile.collisionBounds[1] );
        tile.translateTileMovementY( tile.collisionSize.height );
    }

    for( i=0; i<sideMenuTiles.length; ++i )
    {
        tile = sideMenuTiles[i];
        tile.setCollideable( true );

        tile.setPositionX( ( camera.targetWidth * 0.5 ) + tile.collisionSize.width );
        tile.translateTileMovementX( -tile.collisionSize.width * 1.5 );
        tile.setColourAlpha( 1.0, true );
    }
};


SceneEditorUI.prototype.hideMenu = function(shouldDelete)
{
    var camera = this.camera;
    var bottomMenuTiles = this.bottomMenuTiles;
    var sideMenuTiles = this.sideMenuTiles;
    var tile, i;

    for( i=0; i<bottomMenuTiles.length; ++i )
    {
        tile = bottomMenuTiles[i];
        tile.setCollideable( false );

        tile.setColourAlpha( 0.0, true );

        if( tile.textObject )
        {
            tile.setTextColourAlpha( 0.0, true );
        }

        tile.translateTileMovementY( -tile.collisionSize.height );
    }

    for( i=0; i<sideMenuTiles.length; ++i )
    {
        tile = sideMenuTiles[i];
        tile.setCollideable( false );

        tile.setColour( gColour.setRGBA( 1.0, 1.0, 1.0, 0.0 ), true );

        tile.translateTileMovementX( tile.collisionSize.width * 2.0 );
    }

    if( shouldDelete )
    {
        var self = this;
        if( sideMenuTiles.length > 0 )
        {
            sideMenuTiles[0].setColourAlpha( 0.0, true, function()
            {
                self.deleteLater();
            });
        }
        else if( bottomMenuTiles.length > 0 )
        {
            bottomMenuTiles[0].setColourAlpha( 0.0, true, function()
            {
                self.deleteLater();
            });
        }
        else
        {
            this.deletLater();
        }
    }
};
