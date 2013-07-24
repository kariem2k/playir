/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : SceneGamesManagerList.js
 * Description : UI for our games selector
 *
 * Created     : 23/02/13
 *-----------------------------------------------------------
 */

function SceneGamesManagerList(parentScene, gamesManager)
{
    this.construct();

    this.controlsSwipeMomentum = true;

    this.gamesManager = gamesManager;
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

    gEngine.addScene( this );
}
ExtendPrototype( SceneGamesManagerList, CCSceneAppUI );


SceneGamesManagerList.prototype.setup = function()
{
    var self = this;
    var camera = this.camera;
    camera.setCameraWidth( 400.0, false );

    var tile;
    {
        tile = new CCTile3DButton( self );
        tile.setColour( gColour.set( 1.0, 0.0 ) );

        tile.setDrawOrder( 201 );

        this.tileBackground = tile;
    }

    var buttons = this.buttons = [];
    // New Game Tile
    {
        tile = new CCTile3DButton( self );
        tile.setupText( "New Game", 1.0, true, true );
        tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );

        tile.setColour( SceneMapsManagerList.ColourOpenTitle );
        tile.setColourAlpha( 0.0 );
        tile.setTextColour( gColour.set( 1.0, 0.0 ) );
        tile.setCollideable( false );

        tile.setDrawOrder( 205 );

        tile.onRelease.push( function()
        {
            self.gamesManager.onNewGame();
        });
        this.addTile( tile );

        buttons.push( tile );
    }

    // Edit Maps Tile
    {
        tile = new CCTile3DButton( self );
        tile.setupText( "Maps", 1.0, true, true );
        tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );

        tile.setColour( gColour.set( 0.5, 0.0 ) );
        tile.setColourAlpha( 0.0 );
        tile.setTextColour( gColour.set( 1.0, 0.0 ) );
        tile.setCollideable( false );

        tile.setDrawOrder( 205 );

        tile.onRelease.push( function()
        {
            self.gamesManager.onEditMaps();
        });
        this.addTile( tile );

        buttons.push( tile );
    }

    // Edit UI Tile
    {
        tile = new CCTile3DButton( self );
        tile.setupText( "UI", 1.0, true, true );
        tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );

        tile.setColour( gColour.set( 0.5, 0.0 ) );
        tile.setColourAlpha( 0.0 );
        tile.setTextColour( gColour.set( 1.0, 0.0 ) );
        tile.setCollideable( false );

        tile.setDrawOrder( 205 );

        tile.onRelease.push( function()
        {
            self.gamesManager.onEditUI();
        });
        this.addTile( tile );

        buttons.push( tile );
    }

    // Edit Characters Tile
    {
        tile = new CCTile3DButton( self );
        tile.setupText( "Characters", 1.0, true, true );
        tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );

        tile.setColour( gColour.set( 0.5, 0.0 ) );
        tile.setColourAlpha( 0.0 );
        tile.setTextColour( gColour.set( 1.0, 0.0 ) );
        tile.setCollideable( false );

        tile.setDrawOrder( 205 );

        tile.onRelease.push( function()
        {
            self.gamesManager.onEditCharacters();
        });
        this.addTile( tile );

        buttons.push( tile );
    }

    // Edit Images Tile
    {
        tile = new CCTile3DButton( self );
        tile.setupText( "Images", 1.0, true, true );
        tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );

        tile.setColour( gColour.set( 0.5, 0.0 ) );
        tile.setColourAlpha( 0.0 );
        tile.setTextColour( gColour.set( 1.0, 0.0 ) );
        tile.setCollideable( false );

        tile.setDrawOrder( 205 );

        tile.onRelease.push( function()
        {
            self.gamesManager.onEditImages();
        });
        this.addTile( tile );

        buttons.push( tile );
    }

    // Edit Audio Tile
    {
        tile = new CCTile3DButton( self );
        tile.setupText( "Audio", 1.0, true, true );
        tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );

        tile.setColour( gColour.set( 0.5, 0.0 ) );
        tile.setColourAlpha( 0.0 );
        tile.setTextColour( gColour.set( 1.0, 0.0 ) );
        tile.setCollideable( false );

        tile.setDrawOrder( 205 );

        tile.onRelease.push( function()
        {
            self.gamesManager.onEditAudio();
        });
        this.addTile( tile );

        buttons.push( tile );
    }

    this.gamesList = [];

    this.refreshCameraView();
    this.lockCameraView();
};


SceneGamesManagerList.prototype.updateCamera = function(delta)
{
    var updated = this.CCSceneAppUI_updateCamera( delta );
    if( updated )
    {
        var camera = this.camera;
        var tile, i;

        {
            tile = this.tileBackground;
            if( this.gamesList.length > 1 )
            {
                var unseenTileSize = camera.targetWidth - tile.collisionSize.width;
                tile.setPositionX( camera.currentLookAt[0] -( camera.targetWidth * 0.5 ) + tile.collisionBounds[0] );

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

        var buttons = this.buttons;
        var totalWidth = 0.0;
        for( i=0; i<buttons.length; ++i )
        {
            tile = buttons[i];
            totalWidth += tile.collisionSize.width;
        }

        var x = camera.currentLookAt[0] - ( totalWidth * 0.5 );
        for( i=0; i<buttons.length; ++i )
        {
            tile = buttons[i];
            x += tile.collisionBounds[0];
            tile.setPositionXY( x, camera.currentLookAt[1] - ( camera.targetHeight * 0.35 ) );
            x += tile.collisionBounds[0];
        }
    }
};


SceneGamesManagerList.prototype.resize = function()
{
    if( this.open )
    {
        this.CCSceneAppUI_resize();

        var camera = this.camera;
        var tile, i;

        this.tileBackground.setupTexturedFit( camera.targetWidth, camera.targetHeight, true, "resources/multi/multi_background.jpg", function(tile)
        {
            tile.setColourAlpha( 1.0, true );
            camera.flagUpdate();
        });

        var idealAspectRatio = 1.5;//1080.0f/720.0;
        var aspectRatioAdjutment = camera.getAspectRatio() < 1.25 ? camera.getAspectRatio() / idealAspectRatio : 1.0;

        var tileHeight;

        tileHeight = camera.targetHeight * 0.25 * aspectRatioAdjutment;
        var gamesList = this.gamesList;

        for( i=0; i<gamesList.length; ++i )
        {
            var game = gamesList[i];
            var gameTiles = game.tiles;
            if( gameTiles.length > 0 )
            {
                tile = gameTiles[0];
                if( tile.getTileTextureImage() )
                {
                    tile.setTileTexturedHeight( tileHeight );
                }
                else
                {
                    tile.setTileSize( tileHeight * 1.5, tileHeight );
                }

                for( var j=1; j<gameTiles.length; ++j )
                {
                    tile = gameTiles[j];
                    tile.setTextHeight( tileHeight * 0.125, true );
                    tile.positionTileBelow( gameTiles[j-1] );
                }
            }
        }

        tileHeight = camera.targetHeight * 0.05 * aspectRatioAdjutment;
        var buttons = this.buttons;
        for( i=0; i<buttons.length; ++i )
        {
            tile = buttons[i];
            tile.setTextHeight( tileHeight, true );

            var width = tile.collisionSize.width * 1.5;
            if( width < 25.0 )
            {
                width = 25.0;
            }
            tile.setTileSize( width, tile.collisionSize.height * 1.2 );
        }

        this.show();
    }
};


SceneGamesManagerList.prototype.updateControls = function(controls)
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


SceneGamesManagerList.prototype.touchMovementAllowed = function(touch, touchDelta)
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


SceneGamesManagerList.prototype.refreshCameraView = function()
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


SceneGamesManagerList.prototype.lockCameraView = function()
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

    var closestTile;
    var closestDistance = CC_MAXFLOAT;
    var gamesList = this.gamesList;
    for( var i=0; i<gamesList.length; ++i )
    {
        var game = gamesList[i];
        var tile = game.tiles[0];

        var distance = CC.Vector3Distance2D( tile.position, camera.targetLookAt, false );
        if( distance < closestDistance )
        {
            closestDistance = distance;
            closestTile = tile;
        }
    }

    if( closestTile )
    {
        vec3.copy( camera.targetLookAt, closestTile.getTileMovementTarget() );
        camera.flagUpdate();
    }
};


SceneGamesManagerList.prototype.show = function()
{
    if( this.open )
    {
        this.controlsEnabled = true;

        if( this.tileBackground.getTileTextureImage() )
        {
            this.tileBackground.setColourAlpha( 1.0, true );
        }

        var camera = this.camera;
        var tile, i;

        var buttons = this.buttons;
        for( i=0; i<buttons.length; ++i )
        {
            tile = buttons[i];
            tile.setColourAlpha( 1.0, true );
            tile.setTextColourAlpha( 1.0, true );
            tile.setCollideable( true );
        }

        var gamesList = this.gamesList;

        var x = 0.0;
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
                mainTile.setColourAlpha( 1.0, true );
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


SceneGamesManagerList.prototype.close = function()
{
    this.open = false;

    for( var i=0; i<this.tiles.length; ++i )
    {
        var tile = this.tiles[i];
        tile.setColourAlpha( 0.0, true );
        tile.setTextColourAlpha( 0.0, true );
        tile.setCollideable( false );
    }

    var self = this;
    this.tileBackground.setColourAlpha( 0.0, true, function()
    {
        self.deleteLater();
    });
};



SceneGamesManagerList.prototype.selectGame = function(game)
{
    this.open = false;

    var tile;
    for( var i=0; i<this.tiles.length; ++i )
    {
        tile = this.tiles[i];
        tile.setColourAlpha( 0.0, true );
        tile.setTextColourAlpha( 0.0, true );
        tile.setCollideable( false );
    }

    var camera = this.camera;
    {
        tile = game.tiles[0];
        tile.setDrawOrder( 300 );
        vec3.copy( camera.targetLookAt, tile.getTileMovementTarget());
        camera.flagUpdate();
    }

    var self = this;
    this.tileBackground.setColourAlpha( 0.0, true, function()
    {
        self.gamesManager.onEditGame( game.gameInfo );
    });
};


SceneGamesManagerList.prototype.addGameInfo = function(gameInfo)
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

    var LoadImageFunction = function(tile, textureSrc)
    {
        return function (textureHandle)
        {
            if( textureHandle )
            {
                tile.setTileTexture( textureSrc );
                self.requestResize();
            }
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
                if( self.open )
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
            tile.setupText( "Published", 1.0, true, false );
        }
        else
        {
            tile.setupText( "Unpublished", 1.0, true, false );
        }
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
            if( duration < 2.0 )
            {
                duration += 0.125;
            }

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


SceneGamesManagerList.prototype.loadGameInfos = function(gameInfos)
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
                tile.setTileTexture( gameInfo.titleImage );
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
};


SceneGamesManagerList.prototype.updatedGameInfo = function(gameInfo, removed)
{
    var self = this;
    var camera = this.camera;
    var gamesList = this.gamesList;
    var i, game, tile;

    var LoadImageFunction = function(tile, textureSrc)
    {
        return function (textureHandle)
        {
            if( textureHandle )
            {
                tile.setTileTexture( textureSrc );
                self.requestResize();
            }
        };
    };

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
                    gEngine.textureManager.getTextureHandle( gameInfo.titleImage, new LoadImageFunction( tile, gameInfo.titleImage ) );
                }

                game.tiles[1].setText( gameInfo.name );
                if( gameInfo.open )
                {
                    game.tiles[2].setText( "Published" );
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
