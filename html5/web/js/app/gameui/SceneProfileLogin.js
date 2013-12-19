/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : SceneProfileLogin.js
 * Description : Login to a Social Network
 *
 * Created     : 19/10/12
 *-----------------------------------------------------------
 */

function SceneProfileLogin(parentScene)
{
    this.construct();

    // Inform our parent on delete
    if( parentScene )
    {
        this.setParent( parentScene );

        // If our parent scene is removed, remove this scene as well
        parentScene.linkScene( this );
    }

    var camera = gEngine.newSceneCamera( this );
    camera.setupViewport( 0.0, 0.0, 1.0, 1.0 );

    this.open = true;

    gEngine.addScene( this );
    CCEngine.EnableBackButton( this );
}
ExtendPrototype( SceneProfileLogin, CCSceneAppUI );


SceneProfileLogin.prototype.setup = function()
{
    var self = this;
    var camera = this.camera;

    camera.setCameraWidth( 200.0, false );

    var tile;

    // Background
    {
        tile = new CCTile3DButton( this );
        tile.setupTile( camera.targetWidth, camera.targetHeight );
        tile.setColour( gColour.set( 0.0, 0.0 ) );
        tile.setColourAlpha( 0.75, true );
        tile.setDrawOrder( 99 );
        this.tileBackground = tile;

        tile.onRelease.push( function()
        {
            self.close();
        });
        this.addTile( tile );
    }

    // Create the user tile
    {
        tile = new TileSocialProfile( this );
        tile.setTileSize( camera.cameraWidth * 0.25 );
        this.tileProfile = tile;

        this.addTile( tile );
    }

    this.tileSocialLogins = [];

    // FB Login
    {
        tile = new CCTile3DButton( this );
        this.tileFacebookLogin = tile;
        tile.setupTexturedWidth( 50.0, "icon_facebook.png", function()
        {
            self.requestResize();
        });

        tile.onRelease.push( function()
        {
            self.facebookLogin();
        });
        this.addTile( tile, 0 );
        this.tileSocialLogins.push( tile );
    }

    // Twitter Login
    if( !window.tizen )
    {
        tile = new CCTile3DButton( this );
        this.tileTwitterLogin = tile;
        tile.setupTexturedWidth( 50.0, "icon_twitter.png", function()
        {
            self.requestResize();
        });

        tile.onRelease.push( function()
        {
            self.twitterLogin();
        });
        this.addTile( tile, 0 );
        this.tileSocialLogins.push( tile );
    }

    // Google+ Login
    if( !window.tizen )
    {
        tile = new CCTile3DButton( this );
        this.tileGoogleLogin = tile;
        tile.setupTexturedWidth( 50.0, "icon_googleplus.png", function()
        {
            self.requestResize();
        });

        tile.onRelease.push( function()
        {
            self.googleLogin();
        });
        this.addTile( tile, 0 );
        this.tileSocialLogins.push( tile );
    }

    camera.setLookAtY( camera.targetHeight );
    this.refreshCameraView();
    camera.targetLookAt[1] = 0.0;

    this.requestResize();
};


SceneProfileLogin.prototype.handleBackButton = function()
{
    if( this.open )
    {
        this.close();
        return true;
    }
};


SceneProfileLogin.prototype.resize = function()
{
    this.CCSceneAppUI_resize();

    var camera = this.camera;

    this.tileBackground.setTileSize( camera.targetWidth, camera.targetHeight );

    if( this.tileProfile )
    {
        this.tileProfile.setPositionY( this.tileProfile.collisionBounds[1] );
        var tileSocialLoginsWidth = 0.0;

        var i;
        for( i=0; i<this.tileSocialLogins.length; ++i)
        {
            tileSocialLoginsWidth += this.tileSocialLogins[i].collisionSize.width;
        }

        var x = -tileSocialLoginsWidth * 0.5;
        for( i=0; i<this.tileSocialLogins.length; ++i)
        {
            var tile = this.tileSocialLogins[i];
            x += tile.collisionBounds[0];
            tile.positionTileBelow( this.tileProfile );
            tile.translate( 0.0, -2.0, 0.0 );
            tile.setPositionX( x );
            x += tile.collisionBounds[0];
        }
    }
};


SceneProfileLogin.prototype.updateScene = function(delta)
{
    var updated = this.CCSceneAppUI_updateScene( delta );
    return updated;
};


SceneProfileLogin.prototype.updateCamera = function(delta)
{
    var camera = this.camera;

    var updated = false;

    var lookAtSpeed = 1.5;
    if( camera.interpolateCamera( delta, lookAtSpeed ) )
    {
        // Tell the scroll bar where to go
        if( this.scrollBar )
        {
            this.scrollBar.reposition( camera.currentLookAt[1], camera.cameraWidth, camera.cameraHeight );
        }

        updated = true;
    }
    else
    {
        if( this.cameraScrolling )
        {
            this.cameraScrolling = false;
            this.lockCameraView();
            updated = true;
        }

        if( this.resizing )
        {
            this.resizing = false;
            this.refreshCameraView();
            this.lockCameraView();
            updated = true;
        }
    }

    return updated;
};


SceneProfileLogin.prototype.renderVisibleObject = function(object, inCamera, pass, alpha)
{
    if( this.camera === inCamera )
    {
        object.renderObject( inCamera, alpha );
    }
};


// Take over controls
SceneProfileLogin.prototype.updateControls = function(controls)
{
    this.CCSceneAppUI_updateControls( controls );
    return this.open;
};


SceneProfileLogin.prototype.touchMovementAllowed = function(touch, touchDelta)
{
    return false;
};


SceneProfileLogin.prototype.lockCameraView = function()
{
};


// Try to login
SceneProfileLogin.prototype.facebookLogin = function()
{
    var self = this;

    CCAPIFacebook.ClearCache();
    CCAPIFacebook.StartLogin( function()
    {
        self.facebookLoggedIn();
    });
};


SceneProfileLogin.prototype.facebookLoggedIn = function()
{
    if( CCAPIFacebook.GetUserAccessToken() )
    {
        MultiplayerManager.RegisterFacebook();

        this.tileProfile.setFacebookID( "me" );
        this.tileProfile.bufferFBInfo( 2, true );

        this.close();
    }
};


SceneProfileLogin.prototype.twitterLogin = function()
{
    var self = this;

    CCAPITwitter.ClearCache();
    CCAPITwitter.StartLogin( true, function()
    {
        self.twitterLoggedIn();
    });
};


SceneProfileLogin.prototype.twitterLoggedIn = function()
{
    if( CCAPITwitter.m_user )
    {
        var self = this;
        if( this.tileProfile.bufferTwitterInfo( 2 ) )
        {
            MultiplayerManager.RegisterTwitter();

            self.close();
        }
    }
};


SceneProfileLogin.prototype.googleLogin = function()
{
    var self = this;

    CCAPIGoogle.ClearCache();
    CCAPIGoogle.StartLogin( function()
    {
        self.googleLoggedIn();
    });
};


SceneProfileLogin.prototype.googleLoggedIn = function()
{
    if( CCAPIGoogle.User )
    {
        var self = this;
        if( this.tileProfile.bufferGoogleInfo( 2 ) )
        {
            MultiplayerManager.RegisterGoogle();

            self.close();
        }
    }
};


SceneProfileLogin.prototype.close = function()
{
    if( this.open )
    {
        if( this.parentScene )
        {
            this.parentScene.deletingChild( this );
        }

        this.open = false;

        var self = this;
        this.tileBackground.setColourAlpha( 0.0, true );
        this.tileProfile.setColourAlpha( 0.0, true );

        if( this.tileFacebookLogin )
        {
            this.tileFacebookLogin.setColourAlpha( 0.0, true );
        }

        if( this.tileTwitterLogin )
        {
            this.tileTwitterLogin.setColourAlpha( 0.0, true );
        }

        if( this.tileGoogleLogin )
        {
            this.tileGoogleLogin.setColourAlpha( 0.0, true );
        }

        this.tileProfile.setTileScale( 1.0 );
        this.tileProfile.setTileScale( 0.0, true, function()
        {
            self.deleteLater();
        });

        var camera = this.camera;
        camera.flagUpdate();
        camera.targetLookAt[1] = camera.targetHeight;
    }
};
