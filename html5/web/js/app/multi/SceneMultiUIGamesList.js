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

function SceneMultiUIGamesList(parentScene, multiManager)
{
    this.construct();

    this.controlsSwipeMomentum = true;

    this.multiManager = multiManager;

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

    // Cache our background image
    gEngine.textureManager.getTextureHandle( "resources/multi/multi_background.jpg" );

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

        tile.setDrawOrder( 201 );

        this.tileBackground = tile;
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
    }
};


SceneMultiUIGamesList.prototype.resize = function()
{
    if( this.open )
    {
        var self = this;

        this.CCSceneAppUI_resize();

        var camera = this.camera;

        this.tileBackground.setupTexturedFit( camera.targetWidth, camera.targetHeight, true, "resources/multi/multi_background.jpg", function(tile)
        {
            if( self.showing )
            {
                tile.setColourAlpha( 1.0, true );
            }
            camera.flagUpdate();
        });

        var idealAspectRatio = 1.5;//1080.0f/720.0;
        var aspectRatioAdjutment = camera.getAspectRatio() < 1.25 ? camera.getAspectRatio() / idealAspectRatio : 1.0;

        var tileHeight = camera.targetHeight * 0.5 * aspectRatioAdjutment;

        var gamesList = this.gamesList;
        for( var i=0; i<gamesList.length; ++i )
        {
            var game = gamesList[i];
            var gameTiles = game.tiles;
            if( gameTiles.length > 0 )
            {
                if( gameTiles[0].getTileTextureImage() )
                {
                    gameTiles[0].setTileTexturedHeight( tileHeight );
                }
                else
                {
                    gameTiles[0].setTileSize( tileHeight*1.5, tileHeight );
                }

                for( var j=1; j<gameTiles.length; ++j )
                {
                    gameTiles[j].setTextHeight( tileHeight * 0.125, true );
                    gameTiles[j].positionTileBelow( gameTiles[j-1] );
                }
            }
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
            vec3.copy( camera.targetLookAt, closestTileVector );
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
            this.tileBackground.setColourAlpha( 1.0, true );
        }

        var camera = this.camera;
        var gamesList = this.gamesList;

        var x = 0.0;
        for( var i=0; i<gamesList.length; ++i )
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
                x += mainTile.collisionBounds[0];
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

    var tile;
    var gamesList = this.gamesList;
    for( var i=0; i<gamesList.length; ++i )
    {
        var gameItr = gamesList[i];
        if( gameItr.tiles.length > 0 )
        {
            tile = gameItr.tiles[0];
            tile.setColourAlpha( 0.0, true );
            tile.setCollideable( false );
        }
    }

    var camera = this.camera;
    tile = game.tiles[0];
    tile.setDrawOrder( 300 );
    vec3.copy( camera.targetLookAt, tile.getTileMovementTarget() );

    camera.targetOffset[2] = camera.calcCameraOffsetForWidth( tile.collisionSize.width );
    camera.flagUpdate();

    this.multiManager.hide();

    var self = this;
    this.tileBackground.setColourAlpha( 0.0, true, function()
    {
        self.multiManager.loadGame( game.gameInfo.id );
    });
};


SceneMultiUIGamesList.prototype.addGameInfo = function(gameInfo)
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
    game.gameInfo = gameInfo;
    game.tiles = [];
    gamesList.add( game );

    {
        tile = new CCTile3DButton( this );
        game.tiles.add( tile );

        tile.setupTile( 1.0 );
        var titleImage = gameInfo.titleImage ? gameInfo.titleImage : SceneMultiManager.DefaultTitleImage;
        tile.setTileTexture( gameInfo.titleImage, function (tile, textureHandle)
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

        tile.setupText( gameInfo.name, 1.0, true, false );
        tile.setTextColour( gColour.set( 1.0, 1.0 ) );
        tile.setCollideable( false );

        // Position offscreen
        tile.setPositionX( x );

        this.addTile( tile );
    }

    {
        tile = new CCTile3DButton( this );
        game.tiles.add( tile );

        if( gameInfo.open )
        {
            tile.setupText( "", 1.0, true, false );
        }
        else
        {
            tile.setupText( "Unpublished", 1.0, true, false );
        }
        tile.setTextColour( gColour.set( 0.5, 1.0 ) );
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


SceneMultiUIGamesList.prototype.loadGameInfos = function(gameInfos)
{
    var self = this;
    var camera = this.camera;
    var tiles = this.tiles;
    var gamesList = this.gamesList;

    var GameCompare = function(gameInfo)
    {
        if( gameInfo.id === "androids" )
        {
            return 101;
        }
        else if( gameInfo.id === "tanks" )
        {
            return 102;
        }
        else if( gameInfo.id === "burgers" )
        {
            return 103;
        }
        else if( gameInfo.id === "space" )
        {
            return 104;
        }
        else if( MultiplayerManager.IsOwner( gameInfo.owners ) )
        {
            if( gameInfo.jsFiles )
            {
                return 100 - gameInfo.jsFiles.length;
            }
            return 100;
        }
        else if( gameInfo.jsFiles )
        {
            return 105;
        }
        return 1000;
    };

    // Push our games to the front
    gameInfos.sort( function(a, b)
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

    for( i=0; i<gameInfos.length; ++i )
    {
        var gameInfo = gameInfos[i];

        game = null;
        if( gamesList.length > i )
        {
            game = gamesList[i];
        }

        if( game )
        {
            if( game.gameInfo.id === gameInfo.id )
            {
                tile = game.tiles[0];
                if( gameInfo.titleImage )
                {
                    tile.setTileTexture( gameInfo.titleImage );
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

        game = this.addGameInfo( gameInfo );
        gamesList.insert( game, i );
    }

    while( gamesList.length > gameInfos.length )
    {
        game = gamesList[gameInfos.length];
        for( j=0; j<game.tiles.length; ++j )
        {
            tile = game.tiles[j];
            tiles.remove( tile );
            tile.deleteLater();
        }
        gamesList.remove( game );
    }

    this.requestResize();

    //console.log( "SceneMultiUIGamesList", gameInfos );
};


SceneMultiUIGamesList.prototype.updatedGameInfo = function(gameInfo, removed)
{
    var self = this;
    var camera = this.camera;
    var gamesList = this.gamesList;
    var i, game, tile;

    // Find and update info
    for( i=0; i<gamesList.length; ++i )
    {
        game = gamesList[i];
        if( game.gameInfo.id === gameInfo.id )
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
                if( gameInfo.titleImage )
                {
                    tile.setTileTexture( gameInfo.titleImage );
                }

                game.tiles[1].setText( gameInfo.name );
                if( gameInfo.open )
                {
                    game.tiles[2].setText( "" );
                }
                else
                {
                    game.tiles[2].setText( "Unpublished" );
                }
            }
            return;
        }
    }

    // No info found, add to back of list
    this.addGameInfo( gameInfo );
};
