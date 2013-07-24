/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : SceneGameEditor.js
 * Description : Login to a Social Network
 *
 * Created     : 24/02/13
 *-----------------------------------------------------------
 */

function ColumnOfTiles()
{
    this.tiles = [];
}

function RowOfTiles()
{
    this.columns = [ new ColumnOfTiles() ];
    this.columnIndex = 0;
}


RowOfTiles.prototype.addTile = function(tile)
{
    this.columns[this.columnIndex].tiles.add( tile );
};


RowOfTiles.prototype.addColumn = function(tile)
{
    this.columns.add( new ColumnOfTiles() );
    this.columnIndex++;
    this.addTile( tile );
};


function SceneGameEditor(parentScene, gamesManager, gameInfo)
{
    this.construct();

    CC.SetJSLocationBarData( 'SceneGameEditor', gameInfo.id );

    this.controlsSwipeMomentum = true;

    this.gamesManager = gamesManager;
    this.gameInfo = gameInfo;

    this.gameInfoRows = [];

    {
        // Inform our parent on delete
        this.setParent( parentScene );
    }

    {
        var camera = gEngine.newSceneCamera( this );
        camera.setupViewport( 0.0, 0.0, 1.0, 1.0 );
    }

    this.open = true;

    gEngine.addScene( this );

    var self = this;
    this.sceneUIBack = new SceneUIBack( this, function()
    {
        self.close();
    }, true);

    this.onDragDropLoadFunction = function(file, event)
    {
        self.onDragDropLoad( file, event );
    };
    gEngine.controls.onDragDropLoad.add( this.onDragDropLoadFunction );
}
ExtendPrototype( SceneGameEditor, CCSceneAppUI );


SceneGameEditor.prototype.deleteLater = function()
{
    if( this.webViewControllers )
    {
        for( var i=0; i<this.webViewControllers.length; ++i )
        {
            var webViewController = this.webViewControllers[i];
            CCEngine.WebViewClose( webViewController );
        }
        delete this.webViewControllers;
    }

    if( this.onDragDropLoadFunction )
    {
        gEngine.controls.onDragDropLoad.remove( this.onDragDropLoadFunction );
        delete this.onDragDropLoadFunction;
    }

    this.CCSceneAppUI_deleteLater();
};


SceneGameEditor.prototype.setup = function()
{
    this.camera.setCameraWidth( 640.0, false );

    this.setupGameInfo( this.gameInfo );
};


SceneGameEditor.prototype.setupGameInfo = function(gameInfo)
{
    var self = this;
    var camera = this.camera;
    var i, js;

    this.gameInfo = gameInfo;
    var jsFiles = gameInfo.jsFiles;

    // Inform editing file of a resync
    if( this.webViewControllers )
    {
        for( i=0; i<this.webViewControllers.length; ++i )
        {
            var webViewController = this.webViewControllers[i];
            if( !CCEngine.IsWebViewOpen( webViewController ) )
            {
                this.webViewControllers.remove( webViewController );
                --i;
                continue;
            }
            if( jsFiles )
            {
                var webView = webViewController.webView;
                for( var iJS=0; iJS<jsFiles.length; ++iJS )
                {
                    js = jsFiles[iJS];
                    webView.UpdatedFilename( js.fileID, js.filename );
                }
            }
        }
    }

    // Reset
    var objects = this.objects;
    for( i=0; i<this.objects.length; ++i )
    {
        objects[i].deleteLater();
    }
    this.objects.length = 0;
    this.collideables.length = 0;
    this.tiles.length = 0;
    this.gameInfoRows.length = 0;

    var tile;

    // Background
    {
        tile = new CCTile3DButton( this );
        tile.setupTile( camera.targetWidth );
        tile.setColour( gColour.set( 0.25, 0.0 ) );
        tile.setColourAlpha( 0.975, true );
        tile.setDrawOrder( 99 );
        this.tileBackground = tile;

        this.cameraStickyTiles.add( tile );
    }

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
    var textureSrc;

    var gameInfoRows = this.gameInfoRows;
    var row;

    // Game ID
    {
        row = new RowOfTiles();
        gameInfoRows.add( row );

        {
            tile = new CCTile3DButton( self );
            tile.setupText( "ID:", 1.0, true, true );

            this.addTile( tile );
            row.addTile( tile );
        }

        {
            tile = new CCTile3DButton( self );
            tile.setupText( gameInfo.id, 1.0, true, true );
            tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );

            tile.onRelease.push( function()
            {
                var url = SERVER_ROOT + 'x/?id=' + gameInfo.id + '#online';
                CCEngine.WebViewOpen( url, null, null, {title:"game"} );
            });
            this.addTile( tile );

            row.addColumn( tile );
        }
    }

    // Game Name
    if( gameInfo.name )
    {
        row = new RowOfTiles();
        gameInfoRows.add( row );

        {
            tile = new CCTile3DButton( self );
            tile.setupText( "Name:", 1.0, true, true );

            this.addTile( tile );
            row.addTile( tile );
        }

        {
            tile = new CCTile3DButton( self );
            tile.setupText( gameInfo.name, 1.0, true, true );
            tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );

            tile.onRelease.push( function()
            {
                self.gamesManager.onGameEditName( gameInfo );
            });
            this.addTile( tile );

            row.addColumn( tile );
        }
    }

    // Title Image
    var titleImage = gameInfo.titleImage ? gameInfo.titleImage : SceneMultiManager.DefaultTitleImage;
    {
        row = new RowOfTiles();
        gameInfoRows.add( row );

        {
            tile = new CCTile3DButton( self );
            tile.setupText( "Title Image:", 1.0, true, true );

            this.addTile( tile );
            row.addTile( tile );
        }

        {
            tile = new CCTile3DButton( self );
            tile.setupTile( 1.0 );
            gEngine.textureManager.getTextureHandle( titleImage, new LoadImageFunction( tile, titleImage ) );

            tile.onRelease.push( function()
            {
                self.gamesManager.onGameEditTitleImage( gameInfo );
            });
            this.addTile( tile );

            row.addColumn( tile );
        }
    }

    // JavaScript Modules
    {
        row = new RowOfTiles();
        gameInfoRows.add( row );

        {
            tile = new CCTile3DButton( self );
            tile.setupText( ".js Start:", 1.0, true, true );

            this.addTile( tile );
            row.addTile( tile );
        }

        {
            tile = new CCTile3DButton( self );
            if( gameInfo.jsStart )
            {
                tile.setupText( gameInfo.jsStart, 1.0, true, true );
            }
            else
            {
                tile.setupText( "OverheadShooterTemplate", 1.0, true, true );
            }
            tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );

            tile.onRelease.push( function()
            {
                self.gamesManager.onGameEditJSStart( gameInfo );
            });
            this.addTile( tile );

            row.addColumn( tile );
        }

        // Delete
        {
            tile = new CCTile3DButton( self );
            tile.setupText( "Default", 1.0, true, true );
            tile.setColour( SceneMapsManagerList.ColourClosedTitle );
            tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );

            tile.onRelease.push( function()
            {
                self.gamesManager.onGameRemoveJSStart( gameInfo );
            });
            this.addTile( tile );

            row.addColumn( tile );
        }
    }

    {
        row = new RowOfTiles();
        gameInfoRows.add( row );
        {
            tile = new CCTile3DButton( self );
            tile.setupText( ".js Sync:", 1.0, true, true );

            this.addTile( tile );
            row.addTile( tile );
        }

        {
            var jsSyncName = "Manual";
            if( gameInfo.jsSync )
            {
                jsSyncName = "Runtime Patching";
            }

            tile = new CCTile3DButton( self );
            tile.setupText( jsSyncName, 1.0, true, true );
            tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );

            tile.onRelease.push( function()
            {
                self.gamesManager.onGameEditJSSync( gameInfo );
            });
            this.addTile( tile );

            row.addColumn( tile );
        }

        row = new RowOfTiles();
        gameInfoRows.add( row );
        {
            tile = new CCTile3DButton( self );
            tile.setupText( ".js Restart:", 1.0, true, true );

            this.addTile( tile );
            row.addTile( tile );
        }

        // Soft restart
        {
            tile = new CCTile3DButton( self );
            tile.setupText( "Soft", 1.0, true, true );
            tile.setColour( SceneMapsManagerList.ColourClosedTitle );
            tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );

            tile.onRelease.push( function()
            {
                self.gamesManager.onGameRestart( gameInfo, true );
            });
            this.addTile( tile );

            row.addColumn( tile );
        }

        // Hard restart
        {
            tile = new CCTile3DButton( self );
            tile.setupText( "Hard", 1.0, true, true );
            tile.setColour( SceneMapsManagerList.ColourClosedTitle );
            tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );

            tile.onRelease.push( function()
            {
                self.gamesManager.onGameRestart( gameInfo, false );
            });
            this.addTile( tile );

            row.addColumn( tile );
        }
    }

    var uiScenes = gameInfo.uiScenes;
    var uiInfo;

    var TextJSEditFunction = function(fileID)
    {
        return function()
        {
            var webViewController, i;

            if( self.webViewControllers )
            {
                for( i=0; i<self.webViewControllers.length; ++i )
                {
                    webViewController = self.webViewControllers[i];
                    if( !CCEngine.IsWebViewOpen( webViewController ) )
                    {
                        self.webViewControllers.remove( webViewController );
                        --i;
                        continue;
                    }
                }
            }

            var controlKeyPressed = gEngine.controls.keys[91] || gEngine.controls.keys[17];
            var webViewControllerTarget = controlKeyPressed ? 1 : 0;
            var title = "jseditor" + webViewControllerTarget;

            if( !self.webViewControllers )
            {
                self.webViewControllers = [];
            }

            webViewController = CCEngine.GetWebView( title );
            if( webViewController )
            {
                self.webViewControllers.addOnce( webViewController );
            }
            else
            {
                var url = SERVER_ROOT + 'edit/jscodeeditor_tabs.php';
                webViewController = CCEngine.WebViewOpen( url,
                    null,
                    function (webViewController, url, open)
                    {
                        if( open )
                        {
                            var splitURL = url.split( "#save" );
                            if( splitURL.length > 1 )
                            {
                                if( MultiplayerManager.LoggedIn )
                                {
                                    if( webViewController )
                                    {
                                        var webView = webViewController.webView;
                                        var fileID = webView.GetFileID();
                                        var data = webView.GetData();
                                        self.uploadJS( fileID, data );
                                        webView.SavedData( data );
                                    }
                                }
                            }
                        }
                    },
                    {title:title} );

                if( webViewController )
                {
                    self.webViewControllers.push( webViewController );
                }
            }

            var OnOpenFunction = function(webViewController, fileID, filename)
            {
                return function()
                {
                    if( self.webViewControllers.find( webViewController ) !== -1 )
                    {
                        if( CCEngine.IsWebViewOpen( webViewController ) )
                        {
                            var webView = webViewController.webView;
                            if( webView.editFile )
                            {
                                webView.editFile( fileID, filename, SERVER_ASSETS_URL );
                            }

                            // Not loaded yet, try again in a bit
                            else
                            {
                                setTimeout( new OnOpenFunction( webViewController, fileID, filename ), 500 );
                            }
                        }
                        else
                        {
                            // Web View Controller has been closed
                        }
                    }
                    else
                    {
                        // Web View Controller has been closed
                    }
                };
            };

            for( i=0; i<jsFiles.length; ++i )
            {
                var js = jsFiles[i];
                if( fileID === js.fileID )
                {
                    var filename = js.filename;
                    setTimeout( new OnOpenFunction( webViewController, fileID, filename ), 500 );
                    break;
                }
            }
        };
    };

    var VisualJSEditFunction = function(fileID)
    {
        return function()
        {
            for( var i=0; i<jsFiles.length; ++i )
            {
                var js = jsFiles[i];
                if( fileID === js.fileID )
                {
                    var filename = js.filename;
                    self.gamesManager.onVisualJSEditor( gameInfo, filename );
                    break;
                }
            }
        };
    };

    {
        row = new RowOfTiles();
        gameInfoRows.add( row );

        {
            tile = new CCTile3DButton( self );
            tile.setupText( ".js Files:", 1.0, true, true );

            this.addTile( tile );
            row.addTile( tile );
        }

        {
            tile = new CCTile3DButton( self );
            tile.setupText( "Upload", 1.0, true, true );
            tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );

            tile.onRelease.push( function()
            {
                self.uploadingJS = true;
                AlertsManager.Alert( "drop in .js file", function ()
                {
                    self.uploadingJS = false;
                });
            });
            this.addTile( tile );

            row.addColumn( tile );
        }

        {
            tile = new CCTile3DButton( self );
            tile.setupText( "New", 1.0, true, true );
            tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );

            tile.onRelease.push( function()
            {
                AlertsManager.InputAlert( "", function(result)
                {
                    if( result )
                    {
                        if( MultiplayerManager.LoggedIn )
                        {
                            self.uploadedJS( result, result, "" );
                        }
                    }
                },
                {
                    dot:true
                });
            });
            this.addTile( tile );

            row.addColumn( tile );
        }

        if( gameInfo.jsFiles )
        {
            var DeleteJSFunction = function(fileID)
            {
                return function()
                {
                    self.gamesManager.onGameDeleteJSFile( gameInfo, fileID );
                };
            };

            row = new RowOfTiles();
            gameInfoRows.add( row );
            {
                tile = new CCTile3DButton( self );
                tile.setupText( "", 1.0, true, true );

                this.addTile( tile );
                row.addTile( tile );
            }

            var isUI, iUI;
            var fileID;
            for( i=0; i<jsFiles.length; ++i )
            {
                fileID = jsFiles[i].fileID;

                isUI = false;
                if( uiScenes )
                {
                    for( iUI=0; iUI<uiScenes.length; ++iUI )
                    {
                        if( uiScenes[iUI].id === fileID )
                        {
                            isUI = true;
                            break;
                        }
                    }
                }
                if( isUI )
                {
                    continue;
                }

                // Filename
                {
                    tile = new CCTile3DButton( self );
                    tile.setupText( fileID, 1.0, true, true );
                    tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );

                    tile.onRelease.push( new TextJSEditFunction( fileID ) );
                    this.addTile( tile );

                    if( row.columnIndex < 1 )
                    {
                        row.addColumn( tile );
                    }
                    else
                    {
                        row.addTile( tile );
                    }
                }
            }

            for( i=0; i<jsFiles.length; ++i )
            {
                fileID = jsFiles[i].fileID;

                isUI = false;
                if( uiScenes )
                {
                    for( iUI=0; iUI<uiScenes.length; ++iUI )
                    {
                        if( uiScenes[iUI].id === fileID )
                        {
                            isUI = true;
                            break;
                        }
                    }
                }
                if( isUI )
                {
                    continue;
                }

                // Visual .js Editor
                {
                    tile = new CCTile3DButton( this );
                    tile.textIcon = true;
                    tile.setupTextured( "resources/editor/editor_icon_js.jpg", function()
                    {
                        self.requestResize();
                    });

                    tile.onRelease.push( new VisualJSEditFunction( fileID ) );
                    this.addTile( tile, 0 );

                    if( row.columnIndex < 2 )
                    {
                        row.addColumn( tile );
                    }
                    else
                    {
                        row.addTile( tile );
                    }
                }
            }

            for( i=0; i<jsFiles.length; ++i )
            {
                fileID = jsFiles[i].fileID;

                isUI = false;
                if( uiScenes )
                {
                    for( iUI=0; iUI<uiScenes.length; ++iUI )
                    {
                        if( uiScenes[iUI].id === fileID )
                        {
                            isUI = true;
                            break;
                        }
                    }
                }
                if( isUI )
                {
                    continue;
                }

                tile = new CCTile3DButton( self );
                tile.setColour( SceneMapsManagerList.ColourClosedTitle );
                tile.textIcon = true;
                tile.setupTextured( "resources/editor/editor_icon_delete.jpg", function()
                {
                    self.requestResize();
                });

                tile.onRelease.push( new DeleteJSFunction( fileID ) );
                this.addTile( tile );

                if( row.columnIndex < 3 )
                {
                    row.addColumn( tile );
                }
                else
                {
                    row.addTile( tile );
                }
            }
        }
    }

    {
        row = new RowOfTiles();
        gameInfoRows.add( row );

        {
            tile = new CCTile3DButton( self );
            tile.setupText( "UI Scenes:", 1.0, true, true );

            this.addTile( tile );
            row.addTile( tile );
        }

        {
            tile = new CCTile3DButton( self );
            tile.setupText( "Add", 1.0, true, true );
            tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );

            tile.onRelease.push( function()
            {
                var gamesManager;
                self.gamesManager.onEditUI( null, function (uiManager, info)
                {
                    uiManager.close();
                    gamesManager.sceneUI.sceneGameEditor.addUI( info.id );
                    return true;
                }, function ()
                {
                    gamesManager = new SceneGamesManager();
                    gamesManager.onEditGame( gameInfo );
                });

                // AlertsManager.InputAlert( "", function(result)
                // {
                //     if( result )
                //     {
                //         if( MultiplayerManager.LoggedIn )
                //         {
                //             self.addUI( result );
                //         }
                //     }
                // },
                // {
                //     dot:true
                // });
            });
            this.addTile( tile );

            row.addColumn( tile );
        }

        if( uiScenes )
        {
            var EditUIFunction = function(id)
            {
                return function()
                {
                    self.gamesManager.onEditUI( id, null, function()
                    {
                        var gamesManager = new SceneGamesManager();
                        gamesManager.onEditGameID( gameInfo.id );
                    });
                };
            };

            var DeleteUIFunction = function(id)
            {
                return function()
                {
                    self.gamesManager.onGameDeleteUIScene( gameInfo, id );
                };
            };

            row = new RowOfTiles();
            gameInfoRows.add( row );
            {
                tile = new CCTile3DButton( self );
                tile.setupText( "", 1.0, true, true );

                this.addTile( tile );
                row.addTile( tile );
            }

            for( i=0; i<uiScenes.length; ++i )
            {
                uiInfo = uiScenes[i];

                // UI Editor
                {
                    tile = new CCTile3DButton( this );
                    tile.textIcon = true;
                    tile.setupTextured( "resources/editor/editor_icon_hammer.jpg", function()
                    {
                        self.requestResize();
                    });

                    tile.onRelease.push( new EditUIFunction( uiInfo.id ) );
                    this.addTile( tile, 0 );

                    if( i === 0 )
                    {
                        row.addColumn( tile );
                    }
                    else
                    {
                        row.addTile( tile );
                    }
                }
            }

            for( i=0; i<uiScenes.length; ++i )
            {
                uiInfo = uiScenes[i];

                tile = new CCTile3DButton( self );
                tile.setupText( uiInfo.id + " - " + uiInfo.name, 1.0, true, true );
                tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );

                tile.onRelease.push( new TextJSEditFunction( uiInfo.id ) );
                this.addTile( tile );

                if( i === 0 )
                {
                    row.addColumn( tile );
                }
                else
                {
                    row.addTile( tile );
                }
            }

            for( i=0; i<uiScenes.length; ++i )
            {
                uiInfo = uiScenes[i];

                // Visual .js Editor
                {
                    tile = new CCTile3DButton( this );
                    tile.textIcon = true;
                    tile.setupTextured( "resources/editor/editor_icon_js.jpg", function()
                    {
                        self.requestResize();
                    });

                    tile.onRelease.push( new VisualJSEditFunction( uiInfo.id ) );
                    this.addTile( tile, 0 );

                    if( i === 0 )
                    {
                        row.addColumn( tile );
                    }
                    else
                    {
                        row.addTile( tile );
                    }
                }
            }

            for( i=0; i<uiScenes.length; ++i )
            {
                uiInfo = uiScenes[i];

                // Delete
                {
                    tile = new CCTile3DButton( self );
                    tile.setColour( SceneMapsManagerList.ColourClosedTitle );
                    tile.textIcon = true;
                    tile.setupTextured( "resources/editor/editor_icon_delete.jpg", function()
                    {
                        self.requestResize();
                    });

                    tile.onRelease.push( new DeleteUIFunction( uiInfo.id ) );
                    this.addTile( tile );

                    if( i === 0 )
                    {
                        row.addColumn( tile );
                    }
                    else
                    {
                        row.addTile( tile );
                    }
                }
            }
        }
    }

    // Default Shooter Module settings
    if( !gameInfo.jsStart )
    {
        // Background Image
        {
            row = new RowOfTiles();
            gameInfoRows.add( row );

            {
                tile = new CCTile3DButton( self );
                tile.setupText( "Background:", 1.0, true, true );

                this.addTile( tile );
                row.addTile( tile );
            }

            {
                tile = new CCTile3DButton( self );
                tile.setupTile( 1.0 );

                var backgroundImage = gameInfo.backgroundImage ? gameInfo.backgroundImage : SceneBackground.BackgroundImage;
                if( backgroundImage )
                {
                    gEngine.textureManager.getTextureHandle( backgroundImage, new LoadImageFunction( tile, backgroundImage ) );
                }

                tile.onRelease.push( function()
                {
                    self.gamesManager.onGameEditBackgroundImage( gameInfo );
                });
                this.addTile( tile );

                row.addColumn( tile );
            }
        }

        // Player Types
        {
            row = new RowOfTiles();
            gameInfoRows.add( row );

            {
                tile = new CCTile3DButton( self );
                tile.setupText( "Players:", 1.0, true, true );

                this.addTile( tile );
                row.addTile( tile );
            }

            var LoadModelFunction = function(tile, tex)
            {
                return function(model3d)
                {
                    if( model3d )
                    {
                        var modelObject = tile.modelObject;
                        modelObject.setModel( model3d );
                        modelObject.setColourAlpha( 0.0 );
                        modelObject.setColourAlpha( 1.0, true );
                        if( tex )
                        {
                            model3d.setTexture( tex );
                        }

                        tile.model3d = model3d;

                        self.requestResize();
                    }
                };
            };

            var EditPlayerModelFunction = function(playerType)
            {
                return function()
                {
                    self.gamesManager.onGameEditPlayerType( gameInfo, playerType );
                };
            };

            var EditPlayerIconFunction = function(playerType)
            {
                return function()
                {
                    self.gamesManager.onGameEditPlayerIcon( gameInfo, playerType );
                };
            };

            var NewPlayerFunction = function()
            {
                return function()
                {
                    self.gamesManager.onGameNewPlayer( gameInfo.id );
                };
            };

            var DeletePlayerFunction = function(playerTypeID)
            {
                return function()
                {
                    self.gamesManager.onDeleteGamePlayer( gameInfo.id, playerTypeID );
                };
            };

            var playerTypes = gameInfo.playerTypes ? gameInfo.playerTypes : SceneManagerGame.DefaultPlayerTypes;
            for( i=0; playerTypes && i<playerTypes.length; ++i )
            {
                var playerType = playerTypes[i];

                // Index
                {
                    tile = new CCTile3DButton( self );
                    tile.setupText( "Player: " + (i+1), 1.0, true, true );
                    tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );

                    row.addColumn( tile );
                }

                // Icon
                {
                    tile = new CCTile3DButton( self );
                    tile.setupTile( 1.0 );
                    tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );

                    if( playerType.icon )
                    {
                        gEngine.textureManager.getTextureHandle( playerType.icon, new LoadImageFunction( tile, playerType.icon ) );
                    }

                    tile.onRelease.push( new EditPlayerIconFunction( playerType ) );
                    this.addTile( tile );
                    row.addTile( tile );
                }

                // Model
                {
                    tile = new CCTile3DButton( self );
                    tile.setupTile( 1.0 );
                    {
                        var modelObject = new CCObject();
                        tile.addChild( modelObject );
                        modelObject.setTransparent();

                        tile.modelObject = modelObject;
                    }

                    tile.onRelease.push( new EditPlayerModelFunction( playerType ) );
                    this.addTile( tile );

                    row.addTile( tile );

                    var obj = playerType.obj;
                    var tex = playerType.tex;
                    if( obj )
                    {
                        CCModel3D.CacheModel( obj, true, new LoadModelFunction( tile, tex ) );
                    }
                }

                if( playerTypes.length > 2 )
                {
                    tile = new CCTile3DButton( self );
                    tile.setupText( "Delete", 1.0, true, true );
                    tile.setColour( SceneMapsManagerList.ColourClosedTitle );
                    tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );

                    tile.onRelease.push( new DeletePlayerFunction( playerType.type ) );
                    this.addTile( tile );
                    row.addTile( tile );
                }
            }

            // Add new players
            {
                {
                    tile = new CCTile3DButton( self );
                    tile.setupText( "Add Player", 1.0, true, true );
                    tile.setColour( SceneMapsManagerList.ColourOpenTitle );
                    tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );

                    tile.onRelease.push( new NewPlayerFunction() );
                    this.addTile( tile );
                    row.addColumn( tile );
                }
            }
        }
    }

    // Publish
    {
        row = new RowOfTiles();
        gameInfoRows.add( row );

        {
            tile = new CCTile3DButton( self );
            tile.setupText( "Publish:", 1.0, true, true );

            this.addTile( tile );
            row.addTile( tile );
        }

        {
            tile = new CCTile3DButton( self );
            if( gameInfo.open )
            {
                tile.setupText( "Published", 1.0, true, true );
                tile.setColour( SceneMapsManagerList.ColourOpenTitle );
            }
            else
            {
                tile.setupText( "Unpublished", 1.0, true, true );
                tile.setColour( SceneMapsManagerList.ColourClosedTitle );
            }
            tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );

            tile.onRelease.push( function()
            {
                self.gamesManager.onGamePublish( gameInfo.id, !gameInfo.open );
            });
            this.addTile( tile );

            row.addColumn( tile );
        }

        if( window.JSZip )
        {
            tile = new CCTile3DButton( self );
            tile.setupText( "Export", 1.0, true, true );
            tile.setColour( SceneMapsManagerList.ColourOpenTitle );
            tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );

            tile.onRelease.push( function()
            {
                self.gamesManager.onGameExport( gameInfo );
            });
            this.addTile( tile );

            row.addColumn( tile );
        }

        if( window.JSZip )
        {
            tile = new CCTile3DButton( self );
            tile.setupText( "Import", 1.0, true, true );
            tile.setColour( SceneMapsManagerList.ColourClosedTitle );
            tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );

            tile.onRelease.push( function()
            {
                self.uploadingImport = true;
                AlertsManager.Alert( "drop in gameInfo.json or .zip package\n\nwarning: this will overwrite your current settings", function ()
                {
                    self.uploadingImport = false;
                });
            });
            this.addTile( tile );

            row.addColumn( tile );
        }

        {
            tile = new CCTile3DButton( self );
            tile.setupText( "Add Owner", 1.0, true, true );
            tile.setColour( SceneMapsManagerList.ColourOpenTitle );
            tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );

            tile.onRelease.push( function()
            {
                AlertsManager.InputAlert( MultiplayerManager.UserID, function(result)
                {
                    if( result )
                    {
                        self.gamesManager.onGameAddOwner( gameInfo.id, result );
                    }
                },
                {
                    dot:true
                });
            });
            this.addTile( tile );

            row.addColumn( tile );
        }
    }

    // Delete?
    {
        row = new RowOfTiles();
        gameInfoRows.add( row );

        {
            tile = new CCTile3DButton( self );
            tile.setupText( "Delete:", 1.0, true, true );

            this.addTile( tile );
            row.addTile( tile );
        }

        {
            tile = new CCTile3DButton( self );
            tile.setColour( SceneMapsManagerList.ColourClosedTitle );
            tile.textIcon = true;
            tile.setupTextured( "resources/editor/editor_icon_delete.jpg", function()
            {
                self.requestResize();
            });

            tile.onRelease.push( function()
            {
                self.gamesManager.onGameDelete( self.gameInfo.id );
            });
            this.addTile( tile );

            row.addColumn( tile );
        }
    }

    for( var rowIndex=0; rowIndex<gameInfoRows.length; ++rowIndex )
    {
        row = gameInfoRows[rowIndex];
        for( var columnIndex=0; columnIndex<row.columns.length; ++columnIndex )
        {
            var column = row.columns[columnIndex];
            for( var tileIndex=0; tileIndex<column.tiles.length; ++tileIndex )
            {
                tile = column.tiles[tileIndex];
                tile.setColourAlpha( 0.0 );

                if( columnIndex > 0 )
                {
                    if( tile.modelObject )
                    {
                        //tile.setColourAlpha( 0.25, true );
                    }
                    else
                    {
                        tile.setColourAlpha( 1.0, true );
                    }
                }

                if( tile.textObject )
                {
                    if( columnIndex > 0 )
                    {
                        tile.setColourAlpha( 0.5, true );
                    }
                    tile.setTextColour( gColour.set( 1.0, 0.0 ) );
                    tile.setTextColourAlpha( 1.0, true );
                }
                tile.setDrawOrder( 205 );
            }
        }
    }

    this.requestResize();
    this.refreshCameraView();

    this.lockCameraView();
    camera.setLookAt( [ camera.targetLookAt[0], camera.targetHeight, 0.0 ], false );
    this.lockCameraView();
};


SceneGameEditor.prototype.resize = function()
{
    if( !this.enabled || this.deletingScene )
    {
        return;
    }

    this.CCSceneAppUI_resize();

    var camera = this.camera;

    {
        this.tileBackground.setTileSize( camera.targetWidth, camera.targetHeight );
    }

    var resize3DModel = function(tile)
    {
        var model3d = tile.model3d;
        {
            var size = tile.collisionSize.height < tile.collisionSize.width ? tile.collisionSize.height : tile.collisionSize.width;
            size *= 0.75;
            var scaleFactor;

            var modelWidth = model3d.getWidth() > model3d.getDepth() ? model3d.getWidth() : model3d.getDepth();
            var modelHeight = model3d.getHeight();

            if( modelWidth > modelHeight )
            {
                scaleFactor = size / modelWidth;
            }
            else
            {
                scaleFactor = size / modelHeight;
            }
            model3d.setScale( scaleFactor );
        }
    };

    var textHeight = camera.targetHeight * 0.05;
    var valueFieldSize = textHeight * 1.2;
    var imageHeight = camera.targetHeight * 0.3;
    var modelSize = imageHeight;
    var minTextWidth = camera.targetWidth * 0.1;

    var tile;
    var row, column, rowIndex, columnIndex, tileIndex;
    var gameInfoRows = this.gameInfoRows;
    var firstColumnWidth = 0;

    // Resize
    for( rowIndex=0; rowIndex<gameInfoRows.length; ++rowIndex )
    {
        row = gameInfoRows[rowIndex];
        for( columnIndex=0; columnIndex<row.columns.length; ++columnIndex )
        {
            column = row.columns[columnIndex];

            var columnMaxWidth = 80.0;
            for( tileIndex=0; tileIndex<column.tiles.length; ++tileIndex )
            {
                tile = column.tiles[tileIndex];
                if( tile.textObject )
                {
                    tile.setTextHeight( textHeight, true );
                    tile.setTileSize( tile.collisionSize.width * 1.1, valueFieldSize );

                    if( tile.collisionSize.width > columnMaxWidth )
                    {
                        columnMaxWidth = tile.collisionSize.width;
                    }
                }
                else if( tile.textIcon )
                {
                    tile.setTileSize( valueFieldSize );
                }
                else if( tile.modelObject )
                {
                    tile.setTileSize( modelSize );
                }
                else if( tile.getTileTextureImage() )
                {
                    tile.setTileTexturedHeight( imageHeight );
                }

                if( columnIndex === 0 )
                {
                    if( tile.collisionBounds[0] > firstColumnWidth )
                    {
                        firstColumnWidth = tile.collisionBounds[0];
                    }
                }
                else if( tile.textIcon )
                {

                }
                else
                {
                    if( tile.collisionSize.width < minTextWidth )
                    {
                        tile.setTileSize( minTextWidth, tile.collisionSize.height );
                    }

                    if( tile.model3d )
                    {
                        resize3DModel( tile );
                    }
                }
            }

            // Make all text fields in a row's column be the same size
            for( tileIndex=0; tileIndex<column.tiles.length; ++tileIndex )
            {
                tile = column.tiles[tileIndex];
                if( tile.textObject )
                {
                    tile.setTileSize( columnMaxWidth, valueFieldSize );
                }
            }
        }
    }


    // Position
    var y = 0.0;
    for( rowIndex=0; rowIndex<gameInfoRows.length; ++rowIndex )
    {
        var maxRowWidths = [0];
        var maxRowHeights = [0];
        row = gameInfoRows[rowIndex];

        // X
        for( columnIndex=0; columnIndex<row.columns.length; ++columnIndex )
        {
            column = row.columns[columnIndex];
            for( tileIndex=0; tileIndex<column.tiles.length; ++tileIndex )
            {
                tile = column.tiles[tileIndex];

                if( columnIndex >= maxRowWidths.length )
                {
                    maxRowWidths.add( 0 );
                }
                if( tile.collisionBounds[0] > maxRowWidths[columnIndex] )
                {
                    maxRowWidths[columnIndex] = tile.collisionBounds[0];
                }

                if( tileIndex >= maxRowHeights.length )
                {
                    maxRowHeights.add( 0 );
                }
                if( tile.collisionBounds[1] > maxRowHeights[tileIndex] )
                {
                    maxRowHeights[tileIndex] = tile.collisionBounds[1];
                }
            }
        }

        var x = firstColumnWidth;
        for( columnIndex=1; columnIndex<row.columns.length; ++columnIndex )
        {
            x += maxRowWidths[columnIndex];

            column = row.columns[columnIndex];
            for( tileIndex=0; tileIndex<column.tiles.length; ++tileIndex )
            {
                tile = column.tiles[tileIndex];
                tile.setPositionX( x );
            }
            x += maxRowWidths[columnIndex];
        }

        // Y
        for( var subRowIndex=0; subRowIndex<maxRowHeights.length; ++subRowIndex )
        {
            y -= maxRowHeights[subRowIndex];

            for( columnIndex=0; columnIndex<row.columns.length; ++columnIndex )
            {
                column = row.columns[columnIndex];
                tileIndex = subRowIndex;
                if( tileIndex < column.tiles.length )
                {
                    tile = column.tiles[tileIndex];
                    if( tileIndex === 0 )
                    {
                        tile.setPositionY( y );
                    }
                    else
                    {
                        tile.positionTileBelow( column.tiles[tileIndex-1] );
                    }
                }
            }
        }

        for( var i=0; i<maxRowHeights.length; ++i )
        {
            y -= maxRowHeights[i];
        }
    }
};


SceneGameEditor.prototype.updateControls = function(controls)
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


SceneGameEditor.prototype.touchPressed = function(touch)
{
    this.CCSceneAppUI_touchPressed( touch );

    // Hog the screen controls while open
    return this.open;
};


SceneGameEditor.prototype.refreshCameraView = function()
{
    var left = CC_MAXFLOAT;
    var right = -CC_MAXFLOAT;
    var top = -CC_MAXFLOAT;
    var bottom = CC_MAXFLOAT;

    var tiles = this.tiles;
    for( var i=0; i<tiles.length; ++i )
    {
        var tile = tiles[i];

        var leftX = tile.getTileMovementTarget()[0] - tile.collisionBounds[0];
        var rightX = tile.getTileMovementTarget()[0] + tile.collisionBounds[0];
        var topY = tile.getTileMovementTarget()[1] + tile.collisionBounds[1];
        var bottomY = tile.getTileMovementTarget()[1] - tile.collisionBounds[1];
        if( leftX < left )
        {
            left = leftX;
        }

        if( rightX > right )
        {
            right = rightX;
        }

        if( topY > top )
        {
            top = topY;
        }

        if( bottomY < bottom )
        {
            bottom = bottomY;
        }
    }

    var camera = this.camera;
    this.sceneLeft = left + camera.targetWidth * 0.4;
    this.sceneRight = right;
    this.sceneTop = top - camera.targetHeight * 0.4;
    this.sceneBottom = bottom;
    if( this.sceneBottom > this.sceneTop )
    {
        this.sceneBottom = this.sceneTop;
    }
};


SceneGameEditor.prototype.lockCameraView = function()
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
    if( camera.targetLookAt[0] > this.sceneRight )
    {
        camera.targetLookAt[0] = this.sceneRight;
        camera.flagUpdate();
    }

    if( camera.targetLookAt[1] > this.sceneTop )
    {
        camera.targetLookAt[1] = this.sceneTop;
        camera.flagUpdate();
    }
    if( camera.targetLookAt[1] < this.sceneBottom )
    {
        camera.targetLookAt[1] = this.sceneBottom;
        camera.flagUpdate();
    }
};


SceneGameEditor.prototype.close = function(openGamesList)
{
    CC.RemoveJSLocationBarData( 'SceneGameEditor' );

    if( openGamesList === undefined )
    {
        openGamesList = true;
    }

    this.open = false;

    var tiles = this.tiles;
    for( var i=0; i<tiles.length; ++i )
    {
        var tile = tiles[i];
        tile.setColourAlpha( 0.0, true );
        tile.setTextColourAlpha( 0.0, true );
    }

    var camera = this.camera;
    camera.flagUpdate();
    camera.targetLookAt[1] = camera.targetHeight;

    // Inform our parent we're getting deleted
    if( this.parentScene )
    {
        this.parentScene.deletingChild( this );
    }

    var self = this;
    this.tileBackground.setColourAlpha( 0.0, true, function()
    {
        self.deleteLater();
    });

    self.sceneUIBack.close();

    this.gamesManager.onGameEditorClose( openGamesList );
};


SceneGameEditor.prototype.onDragDropLoad = function(file, event)
{
    if( event && event.target && event.target.result )
    {
        if( MultiplayerManager.LoggedIn )
        {
            var data = event.target.result;
            this.prepareUpload( file, data );
        }
    }
};


SceneGameEditor.prototype.prepareUpload = function(file, data)
{
    var filename = file.name;
    filename = filename.toLowerCase();
    var fileExtension = filename.getExtension();

    if( this.gamesManager.sceneUI.sceneAssetEditor )
    {

    }
    else if( this.uploadingImport )
    {
        this.uploadingImport = false;
        AlertsManager.Hide( "drop in gameInfo.json or .zip package\n\nwarning: this will overwrite your current settings" );
        if( fileExtension === "zip" )
        {
            this.importZip( data );
        }
        else if( filename === "gameinfo.json" )
        {
            this.importGameInfoJSON( data );
        }
        else
        {
            AlertsManager.TimeoutAlert( "only .json or .zip files supported", 2.0 );
        }
    }
    else if( fileExtension === "js" || this.uploadingJS )
    {
        if( this.uploadingJS )
        {
            this.uploadingJS = false;
            AlertsManager.Hide( "drop in .js file" );

            if( fileExtension !== "js" )
            {
                AlertsManager.TimeoutAlert( "only .js supported", 2.0 );
                return;
            }
        }

        if( file.size > 1024 * 1024 )
        {
            AlertsManager.TimeoutAlert( "file size too large", 2.0 );
        }
        else
        {
            this.uploadJS( filename, data );
        }
    }
    else if( fileExtension === "bmp" ||
             fileExtension === "jpeg" ||
             fileExtension === "jpg" ||
             fileExtension === "png" )
    {
        this.gamesManager.onGameEditTitleImage( this.gameInfo );
    }
};


SceneGameEditor.prototype.uploadJS = function(fileID, data)
{
    var self = this;
    EditorManager.EditorUploadJS( fileID, data, function (fileID, filename)
    {
        var uploaded = false;
        if( filename )
        {
            if( MultiplayerManager.LoggedIn )
            {
                uploaded = self.uploadedJS( fileID, filename, data );
            }
        }

        if( !uploaded )
        {
            AlertsManager.TimeoutAlert( "failed to upload " + fileID + " :(", 2.0 );
        }
    });
};


SceneGameEditor.prototype.uploadedJS = function(fileID, filename, data)
{
    var fileExtension = filename.getExtension();
    if( fileExtension === "js" )
    {
        var i;
        var jsFiles = this.gameInfo.jsFiles;
        if( jsFiles )
        {
            for( i=0; i<jsFiles.length; ++i )
            {
                var js = jsFiles[i];
                if( js.fileID === fileID )
                {
                    if( js.filename === filename )
                    {
                        return true;
                    }
                }
            }
        }

        // File has changed at this point

        // Inform the code editor of the new filename
        if( this.webViewControllers )
        {
            for( i=0; i<this.webViewControllers.length; ++i )
            {
                var webViewController = this.webViewControllers[i];
                if( !CCEngine.IsWebViewOpen( webViewController ) )
                {
                    this.webViewControllers.remove( webViewController );
                    --i;
                    continue;
                }
                var webView = webViewController.webView;
                webView.UpdatedFilenameForData( fileID, filename, data );
            }
        }

        // Check if we've modified a UI scene
        var uiScenes = this.gameInfo.uiScenes;
        if( uiScenes )
        {
            for( i=0; i<uiScenes.length; ++i )
            {
                var uiInfo = uiScenes[i];
                if( uiInfo.id === fileID )
                {
                    this.gamesManager.onGameEditUIFile( this.gameInfo, fileID, filename );
                    return true;
                }
            }
        }

        this.gamesManager.onGameAddJSFile( this.gameInfo, fileID, filename );
        return true;
    }
    else
    {
        AlertsManager.TimeoutAlert( "failed to upload " + fileID + " :(", 2.0 );
    }
    return false;
};


SceneGameEditor.prototype.addUI = function(id)
{
    var uiScenes = this.gameInfo.uiScenes;
    if( uiScenes )
    {
        for( var i=0; i<uiScenes.length; ++i )
        {
            var ui = uiScenes[i];
            if( ui === id )
            {
                return true;
            }
        }
    }
    this.gamesManager.onGameAddUIScene( this.gameInfo, id );
};


SceneGameEditor.prototype.importGameInfoJSON = function(jsonString)
{
    if( jsonString )
    {
        var json = JSON.parse( jsonString );
        if( json )
        {
            this.gamesManager.onGameImport( this.gameInfo.id, json );
        }
    }
};


SceneGameEditor.prototype.importZip = function(zipBuffer)
{
    if( window.JSZip )
    {
        AlertsManager.ModalAlert( "importing..." );

        var gameInfoString;
        var file, i;

        var assetFiles =[];
        var jsFiles = [];

        try
        {
            var zip = new JSZip( new Uint8Array( zipBuffer ) );
            if( zip && zip.files )
            {
                var fileNames = Object.keys( zip.files );
                for( i=0; i<fileNames.length; ++i )
                {
                    var zipFile = zip.files[fileNames[i]];

                    if( zipFile.name === "gameinfo.json" )
                    {
                        gameInfoString = zipFile.asText();
                        continue;
                    }

                    file = {};
                    file.name = zipFile.name;
                    var extension = zipFile.name.getExtension();
                    if( extension === "js" )
                    {
                        file.data = zipFile.asText();
                        jsFiles.push( file );
                    }
                    else
                    {
                        file.data = zipFile.asArrayBuffer();
                        assetFiles.push( file );
                    }
                }
            }
        }
        catch (e)
        {
        }

        if( !gameInfoString )
        {
            AlertsManager.Hide( "importing..." );
            AlertsManager.TimeoutAlert( "error importing gameinfo.json", 5.0 );
            return;
        }

        if( assetFiles.length > 0 )
        {
            var self = this;

            var filesUploaded = [];
            var UploadedFunction = function(uploadFilename, newFilename)
            {
                if( newFilename )
                {
                    filesUploaded.push( newFilename );

                    if( uploadFilename !== newFilename )
                    {
                        gameInfoString = self.patchGameInfoFile( gameInfoString, uploadFilename, newFilename );
                        self.patchJSFiles( jsFiles, uploadFilename, newFilename );
                    }

                    if( filesUploaded.length === assetFiles.length )
                    {
                        self.importJSFiles( gameInfoString, jsFiles );
                    }
                }
                else
                {
                    AlertsManager.Hide( "importing..." );
                    AlertsManager.TimeoutAlert( "error importing " + filename, 5.0 );
                }
            };

            for( i=0; i<assetFiles.length; ++i )
            {
                file = assetFiles[i];
                EditorManager.EditorUploadFile( file.name, file.data, UploadedFunction );
            }
        }
        else
        {
            this.importJSFiles( gameInfoString, jsFiles );
        }
    }
};


SceneGameEditor.prototype.importJSFiles = function(gameInfoString, jsFiles )
{
    if( jsFiles.length > 0 )
    {
        var self = this;

        var filesUploaded = [];
        var UploadedFunction = function(uploadFilename, newFilename)
        {
            if( newFilename )
            {
                filesUploaded.push( newFilename );

                if( uploadFilename !== newFilename )
                {
                    gameInfoString = self.patchGameInfoFile( gameInfoString, uploadFilename, newFilename );
                }

                if( filesUploaded.length === jsFiles.length )
                {
                    AlertsManager.Hide( "importing..." );
                    self.importGameInfoJSON( gameInfoString );
                }
            }
            else
            {
                AlertsManager.Hide( "importing..." );
                AlertsManager.TimeoutAlert( "error importing " + filename, 5.0 );
            }
        };

        for( i=0; i<jsFiles.length; ++i )
        {
            file = jsFiles[i];
            EditorManager.EditorUploadFile( file.name, file.data, UploadedFunction );
        }
    }
    else
    {
        AlertsManager.Hide( "importing..." );
        this.importGameInfoJSON( gameInfoString );
    }
};


SceneGameEditor.prototype.patchGameInfoFile = function(gameInfoString, oldFilename, newFilename)
{
    return String.ReplaceChar( gameInfoString, oldFilename, newFilename );
};


SceneGameEditor.prototype.patchJSFiles = function(jsFiles, oldFilename, newFilename)
{
    for( var i=0; i<jsFiles.length; ++i )
    {
        var file = jsFiles[i];
        file.data = String.ReplaceChar( file.data, oldFilename, newFilename );
    }
};
