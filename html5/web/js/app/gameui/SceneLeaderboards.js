/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : SceneLeaderboards.js
 * Description : Leaderboards. Mix of model and view (Lazy design LOL)
 *
 * Created     : 07/10/12
 *-----------------------------------------------------------
 */

function UserData()
{
    this.userID = undefined;
    this.countryCode = undefined;
    this.country = undefined;

    this.facebook = undefined;
    this.twitter = undefined;
    this.google = undefined;

    this.wins = 0;
    this.losses = 0;
    this.won = undefined;
    this.lost = undefined;
    this.textRank = undefined;
    this.imageFlag = undefined;
    this.tileProfile = undefined;
    this.textName = undefined;
    this.imagePlatform = undefined;
    this.textWinRatio = undefined;
}



function SceneLeaderboards()
{
    this.construct();
}
ExtendPrototype( SceneLeaderboards, CCSceneAppUI );

SceneLeaderboards.Leaderboard_Daily = 0;
SceneLeaderboards.Leaderboard_Weekly = 1;
SceneLeaderboards.Leaderboard_AllTime = 2;
SceneLeaderboards.Leaderboard_MaxTypes = 3;


SceneLeaderboards.prototype.construct = function()
{
    this.CCSceneAppUI_construct();

    this.cameraCentered = true;
    this.controlsSwipeMomentum = true;

    {
        var camera = gEngine.newSceneCamera( this );
        camera.setupViewport( 0.0, 0.075, 1.0, 0.85 );
    }

    this.currentLeaderboardType = SceneLeaderboards.Leaderboard_Daily;
    this.leaderboardsData = [];
    for( var i=0; i<SceneLeaderboards.Leaderboard_MaxTypes; ++i )
    {
        this.leaderboardsData.push( [] );
    }

    this.tileLeaderboardDaily = undefined;
    this.tileLeaderboardWeekly = undefined;
    this.tileLeaderboardAllTime = undefined;
    this.uiTiles = [];

    this.dirtyLeaderboards();
};


SceneLeaderboards.prototype.destruct = function()
{
    for( var i=0; i<SceneLeaderboards.Leaderboard_MaxTypes; ++i )
    {
        this.leaderboardsData[i].length = 0;
    }

    this.CCSceneAppUI_destruct();
};


SceneLeaderboards.prototype.setup = function()
{
    var self = this;

    var camera = this.camera;
    camera.setCameraWidth( 300.0 );
    camera.useSceneCollideables( this );

    var uiTiles = this.uiTiles;

    var tile;
    var tileWidth = camera.targetWidth * 0.3;
    {
        tile = new CCTile3DButton( this );
        tile.setupTexturedWidth( tileWidth, "resources/common/uimenu/ui_leaderboards_daily.png" );

        tile.onRelease.push( function()
        {
            self.switchLeaderboard( SceneLeaderboards.Leaderboard_Daily );
        });
        this.addTile( tile, 0 );

        this.tileLeaderboardDaily = tile;
        this.uiTiles.add( tile );
    }
    {
        tile = new CCTile3DButton( this );
        tile.setupTexturedWidth( tileWidth, "resources/common/uimenu/ui_leaderboards_weekly.png" );

        tile.onRelease.push( function()
        {
            self.switchLeaderboard( SceneLeaderboards.Leaderboard_Weekly );
        });
        this.addTile( tile, 0 );

        this.tileLeaderboardWeekly = tile;
        this.uiTiles.add( tile );
    }
    {
        tile = new CCTile3DButton( this );
        tile.setupTexturedWidth( tileWidth, "resources/common/uimenu/ui_leaderboards_alltime.png" );

        tile.onRelease.push( function()
        {
            self.switchLeaderboard( SceneLeaderboards.Leaderboard_AllTime );
        });
        this.addTile( tile, 0 );

        this.tileLeaderboardAllTime = tile;
        this.uiTiles.add( tile );
    }

    for( var i=0; i<uiTiles.length; ++i )
    {
        tile = uiTiles[i];
        tile.setDrawOrder( 205 );
        tile.setColourAlpha( 0.0 );
        tile.setCollideable( false );
    }

    this.lockCameraView();
    this.refreshCameraView();

    this.hide();
};


SceneLeaderboards.prototype.resize = function()
{
    this.CCSceneAppUI_resize();
    if( this.controlsEnabled )
    {
        this.hide();
        this.show();
    }
};


SceneLeaderboards.prototype.render = function(camera, pass, alpha)
{
    //this.CCSceneAppUI_render( camera, pass, alpha );
};


SceneLeaderboards.prototype.updateControls = function(controls)
{
    var usingControls = this.CCSceneAppUI_updateControls( controls );

    var cameraTouches = this.camera.cameraTouches;
    var touch = cameraTouches[0];
    if( touch.x > 0.0 && touch.x < 1.0 &&
        touch.y > 0.0 && touch.y < 1.0 &&
        touch.startX > 0.0 && touch.startX < 1.0 &&
        touch.startY > 0.0 && touch.startY < 1.0 )
    {
        // Monitor our wheel deltas
        if( controls.wheel && controls.wheel.delta !== 0.0 )
        {
            var delta = controls.wheel.delta;
            this.cameraScrolling = true;
            this.controlsMovingVertical = true;
            this.touchCameraMoving( 0.0, delta * 0.1 );
            return true;
        }
    }

    return usingControls;
};


SceneLeaderboards.prototype.touchPressed = function(touch)
{
    return this.CCSceneAppUI_touchPressed( touch );
};


SceneLeaderboards.prototype.touchMovementAllowed = function(touch, touchDelta)
{
    var absDeltaY = Math.abs( touch.totalDeltaY );
    if( absDeltaY > CCControls.TouchMovementThreashold.y )
    {
        this.controlsMoving = true;
        touchDelta.x += touch.totalDeltaX;
        touchDelta.y += touch.totalDeltaY;

        this.controlsMovingVertical = true;
        return true;
    }
    return false;
};


SceneLeaderboards.prototype.touchMoving = function(touch, touchDelta)
{
    return this.CCSceneAppUI_touchMoving( touch, touchDelta );
};


SceneLeaderboards.prototype.touchReleased = function(touch, touchAction)
{
    return this.CCSceneAppUI_touchReleased( touch, touchAction );
};


SceneLeaderboards.prototype.refreshCameraView = function()
{
    this.sceneLeft = 0.0;
    this.sceneRight = 0.0;
    this.sceneTop = 0.0;
    this.sceneBottom = 0.0;

    var leaderboard = this.leaderboardsData[this.currentLeaderboardType];
    if( leaderboard.length > 0 )
    {
        var bottomTile = null;
        for( var i=leaderboard.length-1; i>=0; --i )
        {
            if( leaderboard[i].tileProfile )
            {
                bottomTile = leaderboard[i].tileProfile;
                break;
            }
        }
        if( bottomTile )
        {
            this.sceneBottom = bottomTile.getTileMovementTarget()[1] - bottomTile.collisionBounds[1];

            if( this.sceneBottom > this.sceneTop )
            {
                this.sceneBottom = this.sceneTop;
            }
        }
    }
};


SceneLeaderboards.prototype.lockCameraView = function()
{
    if( this.cameraScrolling )
    {
        return;
    }

    var camera = this.camera;
    camera.flagUpdate();
    camera.targetLookAt[0] = 0.0;

    if( camera.targetLookAt[1] > this.sceneTop )
    {
        camera.targetLookAt[1] = this.sceneTop;
    }
    else if( camera.targetLookAt[1] < this.sceneBottom )
    {
        camera.targetLookAt[1] = this.sceneBottom;
    }
};


SceneLeaderboards.prototype.show = function()
{
    this.controlsEnabled = true;

    var self = this;
    var camera = this.camera;
    this.enabled = true;
    camera.enabled = true;

    var uiTiles = this.uiTiles;

    var green = gColour.setRGBA( 0.0, 0.75, 0.0, 1.0 );
    var red = gColour.setRGBA( 0.75, 0.0, 0.0, 1.0 );

    var leaderboard = this.leaderboardsData[this.currentLeaderboardType];
    if( leaderboard.length === 0 || leaderboard.dirty )
    {
        this.requestLeaderboard();
        return;
    }

    var tile, i, text, x;

    // Leaderboards Menu Tiles
    {
        var totalWidth = 0.0;
        for( i=0; i<uiTiles.length; ++i )
        {
            tile = uiTiles[i];
            tile.setColourAlpha( 0.5, true );
            tile.setCollideable( true );
            totalWidth += tile.collisionSize.width;
        }

        var difference = camera.targetWidth - totalWidth;
        x = ( difference * 0.5 ) - ( camera.targetWidth * 0.5 );
        for( i=0; i<uiTiles.length; ++i )
        {
            tile = uiTiles[i];
            x += tile.collisionBounds[0];
            tile.setPositionX( x );
            tile.setTileMovementY( tile.collisionSize.height );
            x += tile.collisionBounds[0];
        }

        if( this.currentLeaderboardType === SceneLeaderboards.Leaderboard_Daily )
        {
            this.tileLeaderboardDaily.setColourAlpha( 1.0, true );
        }
        else if( this.currentLeaderboardType === SceneLeaderboards.Leaderboard_Weekly )
        {
            this.tileLeaderboardWeekly.setColourAlpha( 1.0, true );
        }
        else if( this.currentLeaderboardType === SceneLeaderboards.Leaderboard_AllTime )
        {
            this.tileLeaderboardAllTime.setColourAlpha( 1.0, true );
        }
    }

    var userID = MultiplayerManager.UserID;

    var idealAspectRatio = 1.5;//1080.0f/720.0;
    var aspectRatioAdjutment = camera.getAspectRatio() < 1.25 ? camera.getAspectRatio() / idealAspectRatio : 1.0;
    var textHeight = camera.targetHeight * 0.06 * aspectRatioAdjutment;
    var flagHeight = camera.targetHeight * 0.075 * aspectRatioAdjutment;
    var platformHeight = camera.targetHeight * 0.1 * aspectRatioAdjutment;
    var profileHeight = camera.targetHeight * 0.075 * aspectRatioAdjutment;

    var OnLoadedImage = function(imageModel, url, height)
    {
        return function (textureHandle)
        {
            if( textureHandle )
            {
                var primitiveSquare = imageModel.primitives[0];
                primitiveSquare.setTexture( url );

                var aspectRatio = textureHandle.image.width / textureHandle.image.height;
                var width = height * aspectRatio;
                primitiveSquare.setScale( width, height, 1.0 );
            }
        };
    };

    x = -camera.cameraHWidth * 0.4;
    var y = -camera.cameraHeight;
    var z = 0.0;

    var previousEntryIndex = -1;
    var leaderboardLength = leaderboard.length;
    for( i=0; i<leaderboardLength; ++i )
    {
        var userData = leaderboard[i];

        if( !userData.tileProfile )
        {
            continue;
        }

        var textRank = userData.textRank;
        var imageFlag = userData.imageFlag;
        var tileProfile = userData.tileProfile;
        var textName = userData.textName;
        var imagePlatform = userData.imagePlatform;
        var textWinRatio = userData.textWinRatio;

        var url;

        // Reset
        {
            this.tiles.addOnce( tileProfile );
            tileProfile.shouldRender = true;
            tileProfile.setCollideable( true );

            textRank.setHeight( textHeight );
            textName.setHeight( textHeight );
            textWinRatio.setHeight( textHeight );

            tileProfile.setTileSize( profileHeight );

            if( userData.deviceType )
            {
                var allowed = true;
                if( CCEngine.DeviceType === "iOS" )
                {
                    if( userData.deviceType !== CCEngine.DeviceType )
                    {
                        allowed = false;
                    }
                }

                if( allowed )
                {
                    url = "resources/common/uimenu/icon_platform_";
                    if( userData.deviceType.contains( "Windows" ) )
                    {
                        url += "windows";
                    }
                    else
                    {
                        url += userData.deviceType;
                    }
                    url += ".png";
                    url = url.toLowerCase();

                    gEngine.textureManager.getTextureHandle( url, new OnLoadedImage( imagePlatform, url, platformHeight ) );
                }
            }

            tileProfile.setPositionXYZ( x, y, z );

            textRank.setPositionX( -camera.cameraHWidth * 0.8 + -x );
            imageFlag.setPositionX( -camera.cameraHWidth * 0.6 + -x  );
            textName.setPositionX( camera.cameraHWidth * 0.1 + -x  );
            imagePlatform.setPositionX( camera.cameraHWidth * 0.55 + -x  );
            textWinRatio.setPositionX( camera.cameraHWidth * 0.75 + -x  );
        }

        var isUser = userID === userData.userID;

        // Set
        {
            if( userData.won )
            {
                tileProfile.setTextColour( green, true );
            }
            else if( userData.lost )
            {
                tileProfile.setTextColour( red, true );
            }

            if( isUser )
            {
                tileProfile.setTextBlinking( true );
            }

            {
                var rank = i+1;
                text = "";
                text += rank;

                if( rank > 10 && rank < 20 )
                {
                    text += "th";
                }
                else
                {
                    rank = rank % 10;
                    if( rank === 1 )
                    {
                        text += "st";
                    }
                    else if( rank === 2 )
                    {
                        text += "nd";
                    }
                    else if( rank === 3 )
                    {
                        text += "rd";
                    }
                    else if( rank <= 20 )
                    {
                        text += "th";
                    }
                }

                if( rank > 25 )
                {
                    text = "";
                }

                textRank.setText( text );
            }

            if( userData.countryCode )
            {
                var geoLocationCountryCode = userData.countryCode;
                if( geoLocationCountryCode.length === 2 )
                {
                    geoLocationCountryCode = geoLocationCountryCode.toLowerCase();

                    url = "resources/common/flags/flag_";
                    url += geoLocationCountryCode;
                    url += ".png";

                    gEngine.textureManager.getTextureHandle( url, new OnLoadedImage( imageFlag, url, flagHeight ) );
                }
            }

            {
                text = "";
                if( userData.facebook && userData.facebook.name && userData.facebook.name.length > 0 )
                {
                    text = userData.facebook.name;
                }
                else
                {
                    text = "Guest ";
                    userID = userID.strip( "." );
                    text += userID;
                }
                if( text.length > 17 )
                {
                    text = text.substring( 0, 17 );
                }

                textName.setText( text );
            }

            {

                text = "";
                text += userData.wins;
                text += "/";
                text += userData.losses;

                textWinRatio.setText( text );
            }
        }

        // Position
        {
            if( previousEntryIndex === -1 )
            {
                tileProfile.setTileMovementYZ( 0.0, 0.0 );
            }
            else
            {
                var previousUserData = leaderboard[previousEntryIndex];
                var target = previousUserData.tileProfile.getTileMovementTarget();

                target[1] -= previousUserData.tileProfile.collisionBounds[1];
                target[1] -= tileProfile.collisionBounds[1] * 2.0;

                if( target[1] > -camera.cameraHHeight )
                {
                    tileProfile.setTileMovement( target );
                }
                else
                {
                    tileProfile.setPosition( target );
                }
            }
            previousEntryIndex = i;
        }
    }

    this.refreshCameraView();
};


SceneLeaderboards.prototype.hide = function()
{
    var self = this;

    this.controlsEnabled = false;

    var i;

    var uiTiles = this.uiTiles;
    for( i=0; i<uiTiles.length; ++i )
    {
        var tile = uiTiles[i];
        tile.setColourAlpha( 0.0, true );
        tile.setCollideable( false );
    }

    var camera = this.camera;
    camera.targetLookAt[1] = this.sceneTop;

    uiTiles[0].setColourAlpha( 0.0, true, function()
    {
        self.enabled = false;
        camera.enabled = false;
    });

    var leaderboard = this.leaderboardsData[this.currentLeaderboardType];
    var leaderboardLength = leaderboard.length;
    for( i=0; i<leaderboardLength; ++i )
    {
        var userData = leaderboard[i];
        if( userData.tileProfile.shouldRender )
        {
            this.tiles.remove( userData.tileProfile );
            userData.tileProfile.shouldRender = false;
            userData.tileProfile.setCollideable( false );
        }
    }

    this.refreshCameraView();
    this.lockCameraView();
};


SceneLeaderboards.prototype.switchLeaderboard = function(leaderboardType)
{
    if( leaderboardType !== this.currentLeaderboardType )
    {
        this.hide();
        this.currentLeaderboardType = leaderboardType;
        this.show();
    }
};


// Flag leaderboards for updating
SceneLeaderboards.prototype.dirtyLeaderboards = function()
{
    for( var i=0; i<SceneLeaderboards.Leaderboard_MaxTypes; ++i )
    {
        this.leaderboardsData[i].dirty = true;
    }
};


SceneLeaderboards.prototype.requestLeaderboard = function()
{
    if( MultiplayerManager.LoggedIn )
    {
        var leaderboard = this.leaderboardsData[this.currentLeaderboardType];
        leaderboard.dirty = false;

        var type = "all";
        if( this.currentLeaderboardType === SceneLeaderboards.Leaderboard_Daily )
        {
            type = "daily";
        }
        else if( this.currentLeaderboardType === SceneLeaderboards.Leaderboard_Weekly )
        {
            type = "weekly";
        }

        if( BurgersClient )
        {
            BurgersClient.getLeaderboards( type );
        }
    }
};


SceneLeaderboards.prototype.parseLeaderboardType = function(jsonData)
{
    var text = jsonData.type;
    if( text === "daily" )
    {
        return SceneLeaderboards.Leaderboard_Daily;
    }
    else if( text === "weekly" )
    {
        return SceneLeaderboards.Leaderboard_Weekly;
    }
    return SceneLeaderboards.Leaderboard_AllTime;
};


SceneLeaderboards.prototype.getUserIDData = function(leaderboardType, userID)
{
    var leaderboard = this.leaderboardsData[leaderboardType];
    for( var i=0; i<leaderboard.length; ++i )
    {
        if( leaderboard[i].userID === userID )
        {
            return leaderboard[i];
        }
    }
    return null;
};


SceneLeaderboards.prototype.getConstUserIDData = function(leaderboardType, userID)
{
    return this.getUserIDData( leaderboardType, userID );
};


SceneLeaderboards.prototype.getPlayerCountryCode = function(userID)
{
    var countryCode;
    var userData = this.getConstUserIDData( SceneLeaderboards.Leaderboard_AllTime, userID );
    if( userData )
    {
        countryCode = userData.countryCode;
    }
    return countryCode;
};


SceneLeaderboards.prototype.updateLeaderboardData = function(leaderboardType, jsonData)
{
    var userID = jsonData.userID;

    var wins = jsonData.wins;
    var losses = jsonData.losses;

    var deviceType = jsonData.deviceType;
    var countryCode = jsonData.countryCode;
    var country = jsonData.country;

    var facebook = jsonData.facebook;
    var twitter = jsonData.twitter;
    var google = jsonData.google;

    this.updateLeaderboard( leaderboardType,
                            userID,
                            countryCode, country,
                            facebook, twitter, google,
                            wins, losses, deviceType );
};


SceneLeaderboards.prototype.updateLeaderboard = function(leaderboardType,
                                                         userID,
                                                         countryCode, country,
                                                         facebook, twitter, google,
                                                         wins, losses, deviceType)
{
    var userData = this.getUserIDData( leaderboardType, userID );

    if( !userData )
    {
        userData = new UserData();
        userData.userID = userID;
        userData.deviceType = deviceType;
        var leaderboard = this.leaderboardsData[leaderboardType];
        leaderboard.add( userData );
    }
    else
    {
        userData.won = false;
        userData.lost = false;
        if( wins > userData.wins )
        {
            userData.won = true;
        }
        else if( losses > userData.losses )
        {
            userData.lost = true;
        }
    }

    if( countryCode )
    {
        userData.countryCode = countryCode;
    }

    if( country )
    {
        userData.country = country;
    }

    userData.facebook = facebook;
    userData.twitter = twitter;
    userData.google = google;

    userData.wins = wins;
    userData.losses = losses;

    if( !userData.tileProfile )
    {
        var tile, tileProfile, imageModel;
        {
            tile = new TileSocialProfile( this, true );
            tile.setDrawOrder( 205 );
            if( facebook && facebook.facebookID.length >  0 )
            {
                tile.setFacebookID( facebook.facebookID );
                tile.bufferFBProfilePhoto( 2 );
            }
            if( twitter && twitter.username )
            {
                tile.setTwitterID( twitter.username );
                tile.bufferTwitterProfilePhoto( 2 );
            }
            if( google && google.id )
            {
                tile.setGoogleID( google.id );
                tile.bufferGoogleProfilePhoto( 2 );
            }

            var self = this;
            tile.onRelease.push( function(tile)
            {
                self.profileSelected( tile );
            });
            userData.tileProfile = tile;

            tile.shouldRender = false;
            tile.setCollideable( false );

            tileProfile = tile;
        }

        {
            userData.textRank = new CCObjectText( tileProfile );
            userData.textRank.setColour( gColour.set( 1.0 ) );
        }

        {
            imageModel = new CCModelBase();
            imageModel.addPrimitive( new CCPrimitiveSquare() );
            tileProfile.tileModel.addModel( imageModel );
            userData.imageFlag = imageModel;
        }

        {
            userData.textName = new CCObjectText( tileProfile );
            userData.textName.setColour( gColour.set( 1.0 ) );
        }

        {
            imageModel = new CCModelBase();
            imageModel.addPrimitive( new CCPrimitiveSquare() );
            tileProfile.tileModel.addModel( imageModel );
            userData.imagePlatform = imageModel;
        }

        {
            userData.textWinRatio = new CCObjectText( tileProfile );
            userData.textWinRatio.setColour( gColour.set( 1.0 ) );
        }
    }

    this.sortLeaderboard( leaderboardType );
};


SceneLeaderboards.prototype.sortLeaderboard = function(leaderboardType)
{
    var leaderboard = this.leaderboardsData[leaderboardType];
    leaderboard.sort( function(a, b)
    {
        var playerA = a;
        var playerB = b;
        var result;
        if( playerB.wins === playerA.wins )
        {
            result = playerA.losses - playerB.losses;
            return result;
        }
        result = playerB.wins - playerA.wins;
        return result;
    });
};


SceneLeaderboards.prototype.profileSelected = function(profile)
{
    var url;
    var facebookID = profile.getFacebookID();
    if( facebookID )
    {
        url = "http://facebook.com/";
        url += facebookID;
        CCEngine.WebViewOpen( url );
    }

    var twitterID = profile.getTwitterID();
    if( twitterID )
    {
        url = "http://twitter.com/";
        url += twitterID;
        CCEngine.WebViewOpen( url );
    }

    var googleID = profile.getGoogleID();
    if( googleID )
    {
        url = "http://plus.google.com/";
        url += googleID;
        CCEngine.WebViewOpen( url );
    }
};
