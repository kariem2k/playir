/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : SceneUINotification.js
 * Description : UI for alert notifications.
 *
 * Created     : 17/06/13
 *-----------------------------------------------------------
 */

function SceneUINotification(title, message, height, userID)
{
    this.construct();

    this.cameraCentered = true;

    this.title = title;
    this.message = message;

    if( !height )
    {
        height = 32.0;
    }
    this.height = height;

    this.userID = userID;
    this.isNotification = true;

    gEngine.addScene( this );

    CCEngine.EnableBackButton( this );
}
ExtendPrototype( SceneUINotification, SceneUIAlert );


SceneUINotification.prototype.setup = function()
{
    var self = this;

    var camera = gEngine.newSceneCamera( this, null, null, true );
    camera.setupViewport( 0.0, 0.0, 1.0, 1.0 );
    camera.setCameraHeight( 480.0, false );
    camera.useSceneCollideables( this );

    var tile;

    if( this.userID )
    {
        tile = new TileSocialProfile( this, true );
        tile.setTileSize( camera.targetHeight * 0.25 );
        tile.setColourAlpha( 0.0 );
        tile.setDrawOrder( 205 );

        var userInfo = MultiplayerManager.GetUserInfo( this.userID );
        if( userInfo )
        {
            if( userInfo.twitter && userInfo.twitter.username )
            {
                tile.setTwitterID( userInfo.twitter.username );
                tile.bufferTwitterProfilePhoto( 2 );
                this.nickname = "@" + userInfo.twitter.username.split( " " )[0];
            }
            else if( userInfo.facebook && userInfo.facebook.facebookID.length > 0 )
            {
                tile.setFacebookID( userInfo.facebook.facebookID );
                tile.bufferFBProfilePhoto( 2 );
                this.nickname = userInfo.facebook.name.split( " " )[0];
            }
            else if( userInfo.google && userInfo.google.id )
            {
                tile.setGoogleID( userInfo.google.id );
                tile.bufferGoogleProfilePhoto( 2 );
                this.nickname = userInfo.google.name.split( " " )[0];
            }
        }
        else if( this.userID === "iBot" )
        {
            tile.setTwitterID( "iBot" );
            tile.nickname = "@iBot";
            tile.APIDownloadedPhoto( "profile_ibot.jpg", "iBot" );
        }
        this.tileProfile = tile;
    }

    {
        tile = new CCTile3DButton( this );
        tile.setupText( " ", 1.0, true, true );
        tile.setTileTexture( "editor_tile_background.jpg", function()
        {
            self.requestResize();
        });
        tile.setColour( gColour.setRGBA( 0.25, 0.25, 0.25, 0.0 ) );
        tile.setTextColour( gColour.set( 1.0, 0.0 ) );

        tile.setDrawOrder( 205 );

        tile.onRelease.push( function()
        {
            self.close();
            if( self.closeCallback )
            {
                self.closeCallback();
            }
        });
        this.addTile( tile, 0 );

        this.tileAlert = tile;
    }

    this.menuTiles = [];

    this.requestResize();
};


SceneUINotification.prototype.setY = function(y)
{
    this.yPosition = y;
    this.requestResize();
};


SceneUINotification.prototype.setColour = function(colour)
{
    this.colour = colour;
    this.tileAlert.setColour( colour );
    this.tileAlert.setColourAlpha( 0.0 );
};


// Take over controls
SceneUINotification.prototype.updateControls = function(controls)
{
    return this.CCSceneAppUI_updateControls( controls );
};



SceneUINotification.prototype.resize = function()
{
    this.CCSceneAppUI_resize();

    if( this.tileAlert )
    {
        var camera = this.camera;
        var tile = this.tileAlert;
        if( this.nickname )
        {
            tile.setText( this.nickname + ": " + this.message );
        }
        else
        {
            tile.setText( this.message );
        }
        tile.setTextHeight( this.height, true );
        tile.setTileSize( tile.collisionSize.width * 1.1, tile.collisionSize.height * 1.5 );

        if( this.opened )
        {
            this.open();
        }
    }
};


SceneUINotification.prototype.open = function()
{
    this.opened = true;

    var tile;
    if( this.tileAlert.getTileTextureImage() )
    {
        var camera = this.camera;

        var y = camera.targetHeight * 0.5;
        if( this.yPosition )
        {
            y = this.yPosition;
        }

        if( this.tileProfile )
        {
            tile = this.tileProfile;
            tile.setColourAlpha( 1.0, true );
            tile.setPositionY( y - tile.collisionBounds[1] );
            tile.setPositionX( -( camera.targetWidth * 0.5 ) - tile.collisionSize.width );
            tile.setTileMovementX( ( -camera.targetWidth * 0.5 ) + tile.collisionBounds[0] );

            tile = this.tileAlert;
            tile.positionTileBelowY( this.tileProfile );
        }
        else
        {
            tile = this.tileAlert;
            tile.setPositionY( y );
        }

        tile.setTextColourAlpha( 1.0, true );

        if( this.colour )
        {
            tile.setColour( this.colour, true );
        }
        else
        {
            tile.setColourAlpha( 0.85, true );
        }

        tile.setTextBlinking( true );

        tile.setPositionX( -( camera.targetWidth * 0.5 ) - tile.collisionSize.width );
        tile.setTileMovementX( ( -camera.targetWidth * 0.5 ) + tile.collisionBounds[0] );
    }
};


SceneUINotification.prototype.close = function()
{
    this.opened = false;

    var self = this;

    var tile = this.tileAlert;
    tile.setTextColourAlpha( 0.0, true );
    tile.setColourAlpha( 0.0, true, function()
    {
        self.deleteLater();
    });

    var camera = this.camera;
    if( camera )
    {
        tile.translateTileMovementX( -( camera.targetWidth * 0.5 ) - tile.collisionSize.width );
        if( this.tileProfile )
        {
            tile = this.tileProfile;
            tile.setTextColourAlpha( 0.0, true );
            tile.translateTileMovementX( -( camera.targetWidth * 0.5 ) - tile.collisionSize.width );
        }
    }
};
