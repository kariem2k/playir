/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : SceneItemShop.js
 * Description : Purchase a premium item
 *
 * Created     : 08/07/13
 *-----------------------------------------------------------
 */

function SceneItemShop(title, itemCode, consumable, inAppPurhcaseValue, facebookValue, twitterValue, callback)
{
    if( SceneItemShop.scene )
    {
        return;
    }

    SceneItemShop.scene = this;

    this.construct();

    if( !title )
    {
        title = "Get more coins";
    }
    if( !itemCode )
    {
        itemCode = "topup_1";
    }
    if( inAppPurhcaseValue === undefined )
    {
        inAppPurhcaseValue = 1000;
    }
    if( facebookValue === undefined )
    {
        facebookValue = 10;
    }
    if( twitterValue === undefined )
    {
        twitterValue = 10;
    }

    // Must have a callback to buy things
    if( !callback )
    {
        inAppPurhcaseValue = 0;
    }

    this.title = title;
    SceneItemShop.itemCode = itemCode;
    SceneItemShop.consumable = consumable;
    SceneItemShop.inAppPurhcaseValue = inAppPurhcaseValue;
    SceneItemShop.facebookValue = facebookValue;
    SceneItemShop.twitterValue = twitterValue;
    SceneItemShop.onPurchasedCallback = callback;

    var camera = gEngine.newSceneCamera( this );
    camera.setupViewport( 0.0, 0.0, 1.0, 1.0 );

    this.open = true;

    gEngine.addScene( this );
    CCEngine.EnableBackButton( this );

    if( window.tizen )
    {
        this.close();
    }

    if( !inAppPurhcaseValue && !facebookValue && !twitterValue )
    {
        this.close();
    }
}
ExtendPrototype( SceneItemShop, CCSceneAppUI );


SceneItemShop.prototype.setup = function()
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

    // Title
    {
        tile = new CCTile3DButton( this );
        this.tileTitle = tile;
        tile.setupText( this.title, camera.targetHeight * 0.1 );
        tile.setTextColour( new CCColour() );
        this.addTile( tile );
    }

    // FB Login
    if( !!SceneItemShop.facebookValue )
    {
        tile = new CCTile3DButton( this );
        this.tileFacebookLogin = tile;
        tile.setupTexturedWidth( 25.0, "resources/social/icon_facebook.png", function()
        {
            self.requestResize();
        });

        tile.onRelease.push( function()
        {
            self.facebookLogin();
        });
        this.addTile( tile, 0 );

        // Text
        {
            tile = new CCTile3DButton();
            tile.setupText( "Like us +" + SceneItemShop.facebookValue, camera.targetHeight * 0.05 );
            tile.setTextColour( new CCColour() );
            this.tileFacebookLogin.addChild( tile );
            tile.translate( 0.0, -this.tileFacebookLogin.collisionBounds[1]-tile.collisionBounds[1] );
        }
    }

    // Twitter Login
    if( !!SceneItemShop.twitterValue )
    {
        tile = new CCTile3DButton( this );
        this.tileTwitterLogin = tile;
        tile.setupTexturedWidth( 25.0, "resources/social/icon_twitter.png", function()
        {
            self.requestResize();
        });

        tile.onRelease.push( function()
        {
            self.twitterLogin();
        });
        this.addTile( tile, 0 );

        // Text
        {
            tile = new CCTile3DButton();
            tile.setupText( "Tweet us +" + SceneItemShop.twitterValue, camera.targetHeight * 0.05 );
            tile.setTextColour( new CCColour() );
            this.tileTwitterLogin.addChild( tile );
            tile.translate( 0.0, -this.tileTwitterLogin.collisionBounds[1]-tile.collisionBounds[1] );
        }
    }

    // In-App Purchase
    if( CCEngine.DeviceType !== "Web" && !!SceneItemShop.inAppPurhcaseValue )
    {
        tile = new CCTile3DButton( this );
        this.tileInAppPurchase = tile;

        var iconURL = "resources/common/uimenu/icon_store";
        if( CCEngine.DeviceType === "Android" )
        {
            iconURL += "_googleplay";
        }
        else if( CCEngine.DeviceType.contains( "Windows" ) )
        {
            iconURL += "_windows";
        }
        iconURL += ".png";

        tile.setupTexturedWidth( 50.0, iconURL, function()
        {
            self.requestResize();
        });

        tile.onRelease.push( function()
        {
            self.inAppPurchase();
        });
        this.addTile( tile, 0 );

        // Text
        {
            tile = new CCTile3DButton();
            tile.setupText( "In-app purchase +" + SceneItemShop.inAppPurhcaseValue, camera.targetHeight * 0.05 );
            tile.setTextColour( new CCColour() );
            this.tileInAppPurchase.addChild( tile );
            tile.translate( 0.0, -this.tileInAppPurchase.collisionBounds[1]-tile.collisionBounds[1] );
        }
    }

    camera.setLookAtY( camera.targetHeight );
    this.refreshCameraView();
    camera.targetLookAt[1] = 0.0;

    this.requestResize();
};


SceneItemShop.prototype.handleBackButton = function()
{
    if( this.open )
    {
        this.close();
        return true;
    }
};


SceneItemShop.prototype.resize = function()
{
    this.CCSceneAppUI_resize();

    var camera = this.camera;

    this.tileBackground.setTileSize( camera.targetWidth, camera.targetHeight );

    if( this.tileTitle )
    {
        this.tileTitle.setPositionY( camera.targetHeight * 0.25 );
        if( this.tileInAppPurchase )
        {
            this.tileInAppPurchase.positionTileBelow( this.tileTitle );
            this.tileInAppPurchase.translate( 0.0, -5.0, 0.0 );

            if( this.tileFacebookLogin )
            {
                this.tileFacebookLogin.positionTileLeft( this.tileInAppPurchase );
                this.tileFacebookLogin.translate( -this.tileFacebookLogin.collisionBounds[0] );
            }
            if( this.tileTwitterLogin )
            {
                this.tileTwitterLogin.positionTileRight( this.tileInAppPurchase );
                this.tileTwitterLogin.translate( this.tileTwitterLogin.collisionBounds[0] );
            }
        }
        else
        {
            if( this.tileFacebookLogin && this.tileTwitterLogin )
            {
                this.tileFacebookLogin.setPositionX( -this.tileFacebookLogin.collisionSize.width );
                this.tileTwitterLogin.setPositionX( this.tileTwitterLogin.collisionSize.width );
            }
        }
    }
};


SceneItemShop.prototype.updateScene = function(delta)
{
    var updated = this.CCSceneAppUI_updateScene( delta );
    return updated;
};


SceneItemShop.prototype.updateCamera = function(delta)
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


SceneItemShop.prototype.renderOctreeObject = function(object, inCamera, pass, alpha)
{
    if( this.camera === inCamera )
    {
        object.renderObject( inCamera, alpha );
    }
};


// Take over controls
SceneItemShop.prototype.updateControls = function(controls)
{
    this.CCSceneAppUI_updateControls( controls );
    return this.open;
};


SceneItemShop.prototype.touchMovementAllowed = function(touch, touchDelta)
{
    return false;
};


SceneItemShop.prototype.lockCameraView = function()
{
};


// Try to login
SceneItemShop.prototype.facebookLogin = function()
{
    var self = this;

    CCAPIFacebook.ClearCache();
    CCAPIFacebook.StartLogin( function()
    {
        self.facebookLoggedIn();
    });
};


SceneItemShop.prototype.facebookLoggedIn = function()
{
    if( CCAPIFacebook.GetUserAccessToken() )
    {
        MultiplayerManager.RegisterFacebook();

        var url = SERVER_ROOT + "backend/helper.php?url=http://softpoetry.com/backend/facebook.php?post&client=";
        url += CLIENT_ID;
        url += "&token=" + CCAPIFacebook.GetUserAccessToken();
        gURLManager.requestURL( url );

        if( SceneItemShop.onPurchasedCallback )
        {
            if( !SceneItemShop.consumable )
            {
                CC.SaveData( "shop." + SceneItemShop.itemCode + ".item", true );
            }
            SceneItemShop.onPurchasedCallback( "facebook", SceneItemShop.itemCode, SceneItemShop.facebookValue );
            SceneItemShop.onPurchasedCallback = undefined;
        }
        this.close();
    }
};


SceneItemShop.prototype.twitterLogin = function()
{
    var self = this;

    CCAPITwitter.ClearCache();
    CCAPITwitter.StartLogin( false, function()
    {
        self.twitterLoggedIn();
    });
};


SceneItemShop.prototype.twitterLoggedIn = function()
{
    if( CCAPITwitter.m_user )
    {
        MultiplayerManager.RegisterTwitter();

        if( SceneItemShop.onPurchasedCallback )
        {
            if( !SceneItemShop.consumable )
            {
                CC.SaveData( "shop." + SceneItemShop.itemCode + ".item", true );
            }
            SceneItemShop.onPurchasedCallback( "twitter", SceneItemShop.itemCode, SceneItemShop.twitterValue );
            SceneItemShop.onPurchasedCallback = undefined;
        }
        this.close();
    }
};


SceneItemShop.prototype.inAppPurchase = function()
{
    if( SceneItemShop.onPurchasedCallback )
    {
        if( CCEngine.NativeUpdateCommands !== undefined )
        {
            //this.close();
            CCEngine.NativeUpdateCommands += 'CCEngine.InAppPurchase;' + SceneItemShop.itemCode + ";" + ( SceneItemShop.consumable ? "true" : "false" ) + '\n';
        }
    }
};


SceneItemShop.InAppPurchased = function()
{
    //AlertsManager.HideAlert( "in-app purchase in progress..." );
    if( SceneItemShop.onPurchasedCallback )
    {
        if( !SceneItemShop.consumable )
        {
            CC.SaveData( "shop." + SceneItemShop.itemCode + ".item", true );
        }
        SceneItemShop.onPurchasedCallback( "in-app", SceneItemShop.itemCode, SceneItemShop.inAppPurhcaseValue );
        SceneItemShop.onPurchasedCallback = undefined;

        if( SceneItemShop.scene )
        {
            SceneItemShop.scene.close();
        }
    }
};


SceneItemShop.HasPurchasedNonConsumable = function(itemCode, callback)
{
    if( window.tizen )
    {
        return true;
    }

    // TEMP for compatibility with old clients
    if( CC.LoadData( itemCode ) )
    {
        CC.DeleteData( itemCode );
        CC.SaveData( "shop." + itemCode + ".item", true );
    }

    if( !CC.LoadData( "shop." + itemCode + ".item" ) )
    {
        return false;
    }

    return true;
};


SceneItemShop.prototype.close = function()
{
    SceneItemShop.scene = undefined;
    this.open = false;

    for( var i=0; i<this.tiles.length; ++i )
    {
        this.tiles[i].setColourAlpha( 0.0, true );
    }

    var self = this;
    this.tileBackground.setColourAlpha( 0.0, true, function()
    {
        self.deleteLater();
    });

    var camera = this.camera;
    camera.flagUpdate();
    camera.targetLookAt[1] = camera.targetHeight;
};
