/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : SceneMultiUIGamesList.js
 * Description : UI for our games selector
 *
 * Created     : 15/02/13
 *-----------------------------------------------------------
 */

function SceneMultiUIGamesList(parentScene)
{
    this.construct();

    this.cameraCentered = true;
    this.controlsSwipeMomentum = true;

    {
        // If our parent scene is removed, remove this scene as well
        parentScene.linkScene( this );

        // Inform our parent on delete
        this.setParent( parentScene );
    }

    {
        var camera = gEngine.newSceneCamera( this, 0 );
        camera.setupViewport( 0.0, 0.0, 1.0, 1.0 );
    }

    this.open = true;
    this.controlsEnabled = false;
    this.cameraCentered = true;

    SceneMultiManager.RefreshBackground();

    gEngine.addScene( this );
}
ExtendPrototype( SceneMultiUIGamesList, CCSceneAppUI );


SceneMultiUIGamesList.prototype.setup = function()
{
    var self = this;
    var camera = this.camera;
    camera.setCameraWidth( 200.0, false );

    var tile;
    {
        tile = new CCTile3DButton( self );
        tile.setColour( gColour.set( 1.0, 0.0 ) );

        tile.setDrawOrder( 98 );

        this.tileBackground = tile;
    }

    this.tileAlerts = [];
    for( var i=0; i<2; ++i )
    {
        tile = new CCTile3DButton( this, true );
        tile.setColour( gColour.set( 0.05, 0.0 ) );

        tile.setDrawOrder( 99 );

        this.tileAlerts.push( tile );
    }

    this.gamesList = [];
};


SceneMultiUIGamesList.prototype.updateCamera = function(delta)
{
    var updated = this.CCSceneAppUI_updateCamera( delta );
    if( updated )
    {
        var camera = this.camera;
        var tile = this.tileBackground;

        if( this.gamesList.length > 1 )
        {
            var unseenTileSize = camera.targetWidth - tile.collisionSize.width;
            tile.setPositionXY( camera.currentLookAt[0] -( camera.targetWidth * 0.5 ) + tile.collisionBounds[0], camera.currentLookAt[1] );

            var sceneDistance = this.sceneRight - this.sceneLeft;
            sceneDistance = sceneDistance === 0.0 ? 1.0 : sceneDistance;
            var scenePositionPercentage = ( camera.currentLookAt[0] - this.sceneLeft ) / sceneDistance;
            scenePositionPercentage = CC.FloatClamp( scenePositionPercentage, 0.0, 1.0 );
            tile.translate( unseenTileSize * scenePositionPercentage, 0.0, 0.0 );
        }
        else
        {
            tile.setPositionXY( camera.currentLookAt[0], camera.currentLookAt[1] );
        }

        for( var i=0; i<this.tileAlerts.length; ++i )
        {
            tile = this.tileAlerts[i];
            tile.setPositionX( camera.currentLookAt[0] );
        }
    }
};


SceneMultiUIGamesList.prototype.resize = function()
{
    if( this.open )
    {
        var self = this;

        this.CCSceneAppUI_resize();

        var camera = this.camera;
        var tile, i;

        this.tileBackground.setupTexturedFit( camera.targetWidth, camera.targetHeight, true, SceneMultiManager.GetBackground(), function(tile)
        {
            if( self.showing )
            {
                var tileBackground = tile;
                tileBackground.setColourAlpha( 0.5, true );
            }
            camera.flagUpdate();
        });

        var idealAspectRatio = 1.5;//1080.0f/720.0;
        var aspectRatioAdjutment = camera.getAspectRatio() < 1.25 ? camera.getAspectRatio() / idealAspectRatio : 1.0;

        var tileHeight = camera.targetHeight * 0.3 * aspectRatioAdjutment;

        var altRow = false;
        for( i=0; i<this.tileAlerts.length; ++i )
        {
            tile = this.tileAlerts[i];
            tile.setTileSize( camera.targetWidth, camera.targetHeight * 0.375 );
            tile.setPositionY( altRow ? -tileHeight * 0.66 : tileHeight * 0.66 );

            altRow = !altRow;
        }

        var gamesList = this.gamesList;
        for( i=0; i<gamesList.length; ++i )
        {
            var game = gamesList[i];
            var gameTiles = game.tiles;
            if( gameTiles.length > 0 )
            {
                gameTiles[0].setPositionY( altRow ? -tileHeight * 0.66 : tileHeight * 0.66 );
                gameTiles[0].setTileSize( tileHeight*1.5, tileHeight );

                for( var j=1; j<gameTiles.length; ++j )
                {
                    tile = gameTiles[j];
                    tile.setTextHeight( tileHeight * 0.125, true );
                    tile.positionTileBelow( gameTiles[j-1] );
                }
            }

            altRow = !altRow;
        }

        if( this.showing )
        {
            this.show();
        }
    }
};


SceneMultiUIGamesList.prototype.updateControls = function(controls)
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
            this.cameraScrolling = true;
            var delta = controls.wheel.delta;
            this.touchCameraMoving( delta * 0.1, 0.0 );
            return true;
        }
    }

    return usingControls;
};


SceneMultiUIGamesList.prototype.touchMovementAllowed = function(touch, touchDelta)
{
    var absDeltaX = Math.abs( touch.totalDeltaX );
    var absDeltaY = Math.abs( touch.totalDeltaY );
    if( absDeltaX > CCControls.TouchMovementThreashold.x || absDeltaY > CCControls.TouchMovementThreashold.y )
    {
        this.controlsMoving = true;
        touchDelta.x += touch.totalDeltaX;
        touchDelta.y += touch.totalDeltaY;

        this.controlsMovingVertical = false;
        return true;
    }

    return false;
};


SceneMultiUIGamesList.prototype.refreshCameraView = function()
{
    this.sceneLeft = 0.0;
    this.sceneRight = 0.0;
    this.sceneTop = 0.0;
    this.sceneBottom = 0.0;

    var camera = this.camera;
    var gamesList = this.gamesList;

    var game, tile;
    if( gamesList.length > 1 )
    {
        game = gamesList.last();
        tile = game.tiles[0];
        this.sceneRight = tile.getTileMovementTarget()[0] + tile.collisionBounds[0];
        this.sceneRight -= tile.collisionBounds[0];
    }
};


SceneMultiUIGamesList.prototype.lockCameraView = function()
{
    if( this.cameraScrolling )
    {
        return;
    }

    var camera = this.camera;

    if( camera.targetLookAt[0] < this.sceneLeft )
    {
        camera.targetLookAt[0] = this.sceneLeft;
        camera.flagUpdate();
    }
    else if( camera.targetLookAt[0] > this.sceneRight )
    {
        camera.targetLookAt[0] = this.sceneRight;
        camera.flagUpdate();
    }

    if( this.showing )
    {
        var closestTile;
        var closestDistance = CC_MAXFLOAT;
        var gamesList = this.gamesList;
        for( var i=0; i<gamesList.length; ++i )
        {
            var game = gamesList[i];
            var tile = game.tiles[0];

            var tilePosition = tile.getTileMovementTarget();
            var distance = CC.Vector3Distance2D( tilePosition, camera.targetLookAt, false );
            if( distance < closestDistance )
            {
                closestDistance = distance;
                closestTile = tile;
            }
        }

        if( closestTile )
        {
            var closestTileVector = closestTile.getTileMovementTarget();
            camera.targetLookAt[0] = closestTileVector[0];
            camera.flagUpdate();
        }
    }
};


SceneMultiUIGamesList.prototype.show = function()
{
    if( this.open )
    {
        this.showing = true;
        this.controlsEnabled = true;

        if( this.tileBackground.getTileTextureImage() )
        {
            this.tileBackground.setColourAlpha( 0.5, true );
        }

        var i;

        for( i=0; i<this.tileAlerts.length; ++i )
        {
            this.tileAlerts[i].setColourAlpha( 0.25, true );
        }

        var camera = this.camera;
        var gamesList = this.gamesList;

        var x = 0.0;
        var altRow = false;
        for( i=0; i<gamesList.length; ++i )
        {
            var game = gamesList[i];
            var gameTiles = game.tiles;
            if( gameTiles.length > 0 )
            {
                var mainTile = gameTiles[0];
                if( i > 0 )
                {
                    x += mainTile.collisionBounds[0];
                }
                if( mainTile.getTileTextureImage() )
                {
                    mainTile.setColourAlpha( 1.0, true );
                }
                else
                {
                    mainTile.setColourAlpha( 0.125, true );
                }
                mainTile.setCollideable( true );

                for( var j=0; j<gameTiles.length; ++j )
                {
                    tile = gameTiles[j];
                    if( x < camera.targetWidth )
                    {
                        tile.setTileMovementX( x );
                    }
                    else
                    {
                        tile.setPositionX( x );
                    }
                }

                if( altRow )
                {
                    x += camera.targetWidth * 0.0125;
                }

                altRow = !altRow;
            }
        }

        this.refreshCameraView();
        this.lockCameraView();
    }
};


SceneMultiUIGamesList.prototype.selectGame = function(game)
{
    this.open = false;
    this.showing = false;
    this.controlsEnabled = false;

    var i, tile;
    var gamesList = this.gamesList;
    for( i=0; i<gamesList.length; ++i )
    {
        var gameItr = gamesList[i];
        for( var j=0; j<gameItr.tiles.length; ++j )
        {
            tile = gameItr.tiles[j];
            tile.setColourAlpha( 0.0, true );
            tile.setTextColourAlpha( 0.0, true );
            tile.setCollideable( false );
        }
    }

    var camera = this.camera;
    tile = game.tiles[0];
    tile.setDrawOrder( 300 );
    vec3.copy( camera.targetLookAt, tile.getTileMovementTarget() );

    camera.targetOffset[2] = camera.calcCameraOffsetForWidth( tile.collisionSize.width );
    camera.flagUpdate();

    this.parentScene.hide();

    for( i=0; i<this.tileAlerts.length; ++i )
    {
        this.tileAlerts[i].setColourAlpha( 0.5, true );
    }

    var self = this;
    this.tileBackground.setColourAlpha( 0.0, true, function()
    {
        self.parentScene.loadGame( game.appInfo.id );
    });
};


SceneMultiUIGamesList.prototype.addAppInfo = function(appInfo)
{
    var self = this;
    var camera = this.camera;
    var tiles = this.tiles;
    var gamesList = this.gamesList;

    var tile;

    var SelectGameFunction = function(game)
    {
        return function()
        {
            self.selectGame( game );
        };
    };

    var x = camera.currentLookAt[0] + camera.targetWidth;

    var game = {};
    game.appInfo = appInfo;
    game.tiles = [];
    gamesList.add( game );

    {
        tile = new CCTile3DButton( this );
        game.tiles.add( tile );

        tile.setupTile( 1.0 );
        var titleImage = appInfo.titleImage ? appInfo.titleImage : SceneMultiManager.DefaultTitleImage;
        tile.setTileTexture( appInfo.titleImage, function (tile, textureHandle)
        {
            if( textureHandle )
            {
                if( self.showing )
                {
                    tile.setColourAlpha( 1.0, true );
                }
            }
        });

        tile.setColour( gColour.set( 1.0, 0.0 ) );
        tile.setCollideable( false );

        tile.setPositionX( x );

        tile.onRelease.push( new SelectGameFunction( game ) );
        this.addTile( tile );
    }

    {
        tile = new CCTile3DButton( this );
        game.tiles.add( tile );

        var name = appInfo.name;
        if( !appInfo.open )
        {
            name += " (Unpublished)";
        }

        tile.setupText( name, 1.0, true, false );
        tile.setColour( gColour.set( 0.05, 0.5 ) );
        tile.setTextColour( gColour.set( 1.0, 1.0 ) );
        tile.setCollideable( false );

        // Position offscreen
        tile.setPositionX( x );

        this.addTile( tile );
    }

    // Add some noise to the animations of the menu show/hide sequences
    var drawOrder = 300;
    var duration = 1.0;
    for( var i=0; i<gamesList.length; ++i )
    {
        var gameTiles = gamesList[i].tiles;
        for( var j=0; j<gameTiles.length; ++j )
        {
            tile = gameTiles[j];
            tile.movementInterpolator.setDuration( duration );
            duration += 0.125;

            tile.setDrawOrder( drawOrder );
            if( drawOrder > 205 )
            {
                drawOrder--;
            }
        }
    }

    this.requestResize();

    return game;
};


SceneMultiUIGamesList.prototype.loadAppInfos = function(appInfos)
{
    var self = this;
    var camera = this.camera;
    var tiles = this.tiles;
    var gamesList = this.gamesList;

    var GameCompare = function(appInfo)
    {
        if( appInfo.id === "androids" )
        {
            return 101;
        }
        else if( appInfo.id === "tanks" )
        {
            return 102;
        }
        else if( appInfo.id === "burgers" )
        {
            return 103;
        }
        else if( appInfo.id === "space" )
        {
            return 104;
        }
        else if( MultiplayerManager.IsOwner( appInfo.owners ) )
        {
            if( appInfo.jsFiles )
            {
                return 100 - appInfo.jsFiles.length;
            }
            return 100;
        }
        else if( appInfo.jsFiles )
        {
            return 105;
        }
        return 1000;
    };

    // Push our games to the front
    appInfos.sort( function(a, b)
    {
        var scoreA = GameCompare( a );
        var scoreB = GameCompare( b );
        if( scoreA === scoreB )
        {
            return a.id - b.id;
        }
        return scoreA - scoreB;
    });

    var game, tile;
    var i, j;

    for( i=0; i<appInfos.length; ++i )
    {
        var appInfo = appInfos[i];

        game = null;
        if( gamesList.length > i )
        {
            game = gamesList[i];
        }

        if( game )
        {
            if( game.appInfo.id === appInfo.id )
            {
                tile = game.tiles[0];
                if( appInfo.titleImage )
                {
                    tile.setTileTexture( appInfo.titleImage );
                }
                continue;
            }
            else
            {
                for( j=0; j<game.tiles.length; ++j )
                {
                    tile = game.tiles[j];
                    tiles.remove( tile );
                    tile.deleteLater();
                }
                gamesList.remove( game );
            }
        }

        game = this.addAppInfo( appInfo );
        gamesList.insert( game, i );
    }

    while( gamesList.length > appInfos.length )
    {
        game = gamesList[appInfos.length];
        for( j=0; j<game.tiles.length; ++j )
        {
            tile = game.tiles[j];
            tiles.remove( tile );
            tile.deleteLater();
        }
        gamesList.remove( game );
    }

    this.requestResize();

    //console.log( "SceneMultiUIGamesList", appInfos );
};


SceneMultiUIGamesList.prototype.updatedAppInfo = function(appInfo, removed)
{
    var self = this;
    var camera = this.camera;
    var gamesList = this.gamesList;
    var i, game, tile;

    // Find and update info
    for( i=0; i<gamesList.length; ++i )
    {
        game = gamesList[i];
        if( game.appInfo.id === appInfo.id )
        {
            if( removed )
            {
                for( var j=0; j<game.tiles.length; ++j )
                {
                    tile = game.tiles[j];
                    this.tiles.remove( tile );
                    tile.deleteLater();
                }
                gamesList.remove( game );
                this.requestResize();
            }
            else
            {
                tile = game.tiles[0];
                if( appInfo.titleImage )
                {
                    tile.setTileTexture( appInfo.titleImage );
                }

                var name = appInfo.name;
                if( !appInfo.open )
                {
                    name += " (Unpublished)";
                }
                game.tiles[1].setText( name );
            }
            return;
        }
    }

    // No info found, add to back of list
    this.addAppInfo( appInfo );
};
