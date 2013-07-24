/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : SceneUIListUIObjects.js
 * Description : UI for our UI selector.
 *
 * Created     : 03/06/13
 *-----------------------------------------------------------
 */

function SceneUIListUIObjects(parentScene, editor)
{
    this.construct( parentScene );

    this.editor = editor;
}
ExtendPrototype( SceneUIListUIObjects, SceneUIList );


SceneUIListUIObjects.prototype.setup = function()
{
    var parentCameraIndex = gEngine.findCameraIndex( this.parentScene.camera );
    var camera = gEngine.newSceneCamera( this, parentCameraIndex+1 );
    camera.setupViewport( 0.0, 0.0, 0.25, 1.0 );
    camera.setCameraWidth( 640.0 * 0.25, false );

    this.SceneUIList_setup();
};

SceneUIListUIObjects.prototype.updateScene = function(delta)
{
    var updated = this.CCSceneAppUI_updateScene( delta );

    var objects = this.objectsList;
    for( var i=0; i<objects.length; ++i )
    {
        var object = objects[i];
        if( object.modelObject )
        {
            object.modelObject.rotateY( delta * 30.0 );
            object.modelObject.model.animate( delta );
        }
    }

    return updated;
};


SceneUIListUIObjects.prototype.render = function(camera, pass, alpha)
{
    this.CCSceneAppUI_render( camera, pass, alpha );
};


SceneUIListUIObjects.prototype.resizeLists = function( y )
{
    this.resizeList( this.objectsList, y );
};


SceneUIListUIObjects.prototype.showObjects = function(objects)
{
    var self = this;

    var i, j, tile, tiles, object, newObject;

    var objectsList = this.objectsList;
    for( i=0; i<objectsList.length; ++i )
    {
        object = objectsList[i];

        if( objects.length > i )
        {
            newObject = objects[i];
        }
        else
        {
            newObject = null;
        }

        if( object.object !== newObject )
        {
            objectsList.remove( object );
            for( j=0; j<object.tiles.length; ++j )
            {
                tile = object.tiles[j];
                this.tiles.remove( tile );
                tile.deleteLater();
            }
            --i;
        }
    }

    var FindObjectFunction = function(uiObject)
    {
        return function()
        {
            self.editor.findObject( uiObject );
        };
    };

    var DeleteObjectFunction = function(uiObject)
    {
        return function()
        {
            self.editor.deleteObject( uiObject );
        };
    };

    var EditTypeFunction = function(uiObject)
    {
        return function()
        {
            var current = uiObject.constructor.name;
            AlertsManager.InputAlert( current, function(result)
            {
                if( result )
                {
                    if( current !== result )
                    {
                        var position = uiObject.position;
                        self.editor.deleteObject( uiObject );
                        self.editor.createObject( position, result );
                    }
                }
            });
        };
    };

    var EditNameFunction = function(uiObject)
    {
        return function()
        {
            var current = uiObject.name ? uiObject.name : "";
            AlertsManager.InputAlert( current, function(result)
            {
                if( result !== false )
                {
                    if( current !== result )
                    {
                        uiObject.name = result;
                        self.editor.updatedObject( uiObject );
                    }
                }
            });
        };
    };

    var EditColourFunction = function(uiObject)
    {
        return function()
        {
            var colouringObject = uiObject;
            if( colouringObject )
            {
                var current = colouringObject.colour.toString();
                if( uiObject.isBlinking() )
                {
                    var textColourSplit = current.split( "," );
                    current = textColourSplit[0] + "," + textColourSplit[1] + "," + textColourSplit[2] + ",1";
                }

                AlertsManager.InputAlert( current, function(result)
                {
                    if( result )
                    {
                        if( current !== result )
                        {
                            gColour.set( colouringObject.colour );
                            colouringObject.setColour( gColour.fromString( result ) );
                            self.editor.updatedObject( uiObject );
                        }
                    }
                },
                {
                    dot:true,
                    comma:true,
                    minus:true
                });
            }
        };
    };

    var EditBlinkingFunction = function(uiObject)
    {
        return function()
        {
            var blinking = uiObject.isBlinking();
            uiObject.setBlinking( !blinking );
            self.editor.updatedObject( uiObject );
        };
    };

    var EditImageFunction = function(uiObject)
    {
        return function()
        {
            var sceneAssetEditor = new SceneAssetEditor( self, false, true );
            sceneAssetEditor.open( "Select Image" );

            var currentTexture = uiObject.getTileTextureFilename();
            if( currentTexture )
            {
                sceneAssetEditor.sceneUIListImages.findAndSelect( currentTexture );
            }
            sceneAssetEditor.onClose = function (tex)
            {
                if( tex )
                {
                    if( !uiObject.getTileTextureHandle() )
                    {
                        uiObject.aspectRatioLocked = true;
                    }

                    uiObject.setTileTexture( tex, function (tile)
                    {
                        if( tile.aspectRatioLocked )
                        {
                            tile.setTileTexturedWidth( tile.collisionSize.width );
                        }
                    });
                    self.editor.updatedObject( uiObject );
                }
            };
        };
    };

    var EditImageAspectRatioFunction = function(uiObject)
    {
        return function()
        {
            uiObject.aspectRatioLocked = !uiObject.aspectRatioLocked;
            self.editor.updatedObject( uiObject );
        };
    };


    var EditFullScreenFunction = function(uiObject)
    {
        return function()
        {
            uiObject.fullScreen = !uiObject.fullScreen;
            self.editor.updatedObject( uiObject );
        };
    };


    var EditFlipFunction = function(uiObject)
    {
        return function()
        {
            uiObject.flipTileY();
            self.editor.updatedObject( uiObject );
        };
    };


    var EditWidthFunction = function(uiObject)
    {
        return function()
        {
            var current = "" + CC.FloatLimitPrecision( self.editor.getReletiveWidth( uiObject ) * 100 );
            AlertsManager.InputAlert( current, function(result)
            {
                if( result )
                {
                    if( current !== result )
                    {
                        var newFloat = parseFloat( result ) / 100;
                        self.editor.setReletiveWidth( uiObject, newFloat );
                        self.editor.updatedObject( uiObject );
                    }
                }
            },
            {
                dot:true,
                minus:true
            });
        };
    };

    var EditHeightFunction = function(uiObject)
    {
        return function()
        {
            var current = "" + CC.FloatLimitPrecision( self.editor.getReletiveHeight( uiObject ) * 100 );
            AlertsManager.InputAlert( current, function(result)
            {
                if( result )
                {
                    if( current !== result )
                    {
                        var newFloat = parseFloat( result ) / 100;
                        self.editor.setReletiveHeight( uiObject, newFloat );
                        self.editor.updatedObject( uiObject );
                    }
                }
            },
            {
                dot:true,
                minus:true
            });
        };
    };

    var EditXFunction = function(uiObject)
    {
        return function()
        {
            var current = "" + CC.FloatLimitPrecision( self.editor.getReletiveX( uiObject ) * 100 );
            AlertsManager.InputAlert( current, function(result)
            {
                if( result )
                {
                    if( current !== result )
                    {
                        var newFloat = parseFloat( result ) / 100;
                        self.editor.setReletiveX( uiObject, newFloat );
                        self.editor.updatedObject( uiObject );
                    }
                }
            },
            {
                dot:true,
                minus:true
            });
        };
    };

    var EditYFunction = function(uiObject)
    {
        return function()
        {
            var current = "" + CC.FloatLimitPrecision( self.editor.getReletiveY( uiObject ) * 100 );
            AlertsManager.InputAlert( current, function(result)
            {
                if( result )
                {
                    if( current !== result )
                    {
                        var newFloat = parseFloat( result ) / 100;
                        self.editor.setReletiveY( uiObject, newFloat );
                        self.editor.updatedObject( uiObject );
                    }
                }
            },
            {
                dot:true,
                minus:true
            });
        };
    };

    var EditDrawOrderFunction = function(uiObject)
    {
        return function()
        {
            var current = "" + uiObject.drawOrder;
            AlertsManager.InputAlert( current, function(result)
            {
                if( result )
                {
                    if( current !== result )
                    {
                        result = parseInt( result, 10 );
                        uiObject.setDrawOrder( result );
                        self.editor.updatedObject( uiObject );
                    }
                }
            },
            {
                letter:false
            });
        };
    };

    var EditTextFunction = function(uiObject)
    {
        return function()
        {
            var currentText = uiObject.getText();
            if( !currentText )
            {
                currentText = "";
            }
            AlertsManager.InputAlert( currentText, function(result)
            {
                if( result !== false )
                {
                    if( currentText !== result )
                    {
                        if( !uiObject.getText() )
                        {
                            uiObject.setTextScale( uiObject.textScale ? uiObject.textScale : 0.75 );
                        }
                        uiObject.setText( result );
                        self.editor.updatedObject( uiObject );
                    }
                }
            },
            {
                space:true,
                dot:true,
                comma:true,
                minus:true,
                length:32
            });
        };
    };

    var EditTextColourFunction = function(uiObject)
    {
        return function()
        {
            var colouringObject = uiObject.textObject;
            if( colouringObject )
            {
                var current = colouringObject.colour.toString();
                if( uiObject.isTextBlinking() )
                {
                    var textColourSplit = current.split( "," );
                    current = textColourSplit[0] + "," + textColourSplit[1] + "," + textColourSplit[2] + ",1";
                }

                AlertsManager.InputAlert( current, function(result)
                {
                    if( result )
                    {
                        if( current !== result )
                        {
                            gColour.set( colouringObject.colour );
                            colouringObject.setColour( gColour.fromString( result ) );
                            self.editor.updatedObject( uiObject );
                        }
                    }
                },
                {
                    dot:true,
                    comma:true,
                    minus:true
                });
            }
        };
    };

    var EditTextScaleFunction = function(uiObject)
    {
        return function()
        {
            var current = "" + ( uiObject.textScale ? CC.FloatLimitPrecision( uiObject.textScale ) : 0.75 );
            AlertsManager.InputAlert( current, function(result)
            {
                if( result )
                {
                    if( current !== result )
                    {
                        var newFloat = parseFloat( result );
                        uiObject.setTextScale( newFloat );
                        self.editor.updatedObject( uiObject );
                    }
                }
            },
            {
                dot:true,
                minus:true
            });
        };
    };


    var EditTextBlinkingFunction = function(uiObject)
    {
        return function()
        {
            var blinking = uiObject.isTextBlinking();
            uiObject.setTextBlinking( !blinking );
            self.editor.updatedObject( uiObject );
        };
    };


    var Edit3DModelFunction = function(uiObject)
    {
        return function()
        {
            var sceneAssetEditor = new SceneAssetEditor( self, true, true );
            sceneAssetEditor.open( "Select Model" );

            var currentTexture = uiObject.getTileTextureFilename();
            sceneAssetEditor.onClose = function (modelInfo)
            {
                if( modelInfo )
                {
                    uiObject.set3DModel( modelInfo.obj, modelInfo.tex, 1 );
                    self.editor.updatedObject( uiObject );
                }
            };
        };
    };

    var Edit3DModelColourFunction = function(uiObject)
    {
        return function()
        {
            var colouringObject = uiObject.model3dObject;
            if( colouringObject )
            {
                var current = colouringObject.colour.toString();
                AlertsManager.InputAlert( current, function(result)
                {
                    if( result )
                    {
                        if( current !== result )
                        {
                            gColour.set( colouringObject.colour );
                            colouringObject.setColour( gColour.fromString( result ) );
                            self.editor.updatedObject( uiObject );
                        }
                    }
                },
                {
                    dot:true,
                    comma:true,
                    minus:true
                });
            }
        };
    };

    var Edit3DModelAnimationSpeedFunction = function(uiObject)
    {
        return function()
        {
            var current = "" + ( uiObject.model3dAnimationSpeed ? CC.FloatLimitPrecision( uiObject.model3dAnimationSpeed ) : 0.0 );
            AlertsManager.InputAlert( current, function(result)
            {
                if( result )
                {
                    if( current !== result )
                    {
                        var newFloat = parseFloat( result );
                        uiObject.set3DModelAnimationSpeed( newFloat );
                        self.editor.updatedObject( uiObject );
                    }
                }
            },
            {
                dot:true
            });
        };
    };

    var EditOnTouchFunction = function(uiObject, onTouch)
    {
        return function()
        {
            var current = "";
            if( onTouch.length > 0 )
            {
                current = onTouch[0];
            }
            AlertsManager.InputAlert( current, function(result)
            {
                if( result !== false )
                {
                    if( current !== result )
                    {
                        result = result.formatSpacesAndTabs();
                        result = self.editor.validateJS( result );
                        if( result )
                        {
                            if( onTouch.length > 0 )
                            {
                                onTouch[0] = result;
                            }
                            else
                            {
                                onTouch.push( result );
                            }
                        }
                        else
                        {
                            if( onTouch.length > 0 )
                            {
                                onTouch.pop();
                            }
                        }
                        self.editor.updatedObject( uiObject );
                    }
                }
            },
            {
                space:true,
                dot:true,
                minus:true,
                functional:true,
                height:0.35,
                length:64
            });
        };
    };

    var camera = this.camera;
    var tileWidth = camera.targetWidth;
    var tileHeight = camera.targetWidth * 0.125;

    var newObjects = [];
    for( i=0; i<objects.length; ++i )
    {
        newObject = objects[i];

        // Do we already have this object loaded?
        if( objectsList.length > i )
        {
            object = objectsList[i];
            if( object.object === newObject )
            {
                this.updateObject( object, newObject );
                continue;
            }
        }

        object = {};
        object.object = newObject;
        object.tiles = [];
        objectsList.add( object );
        newObjects.add( object );

        // Type
        {
            tile = new CCTile3DButton( this );
            tile.setupText( "", tileHeight * 0.75, true, true );
            tile.setTileSize( tileWidth, tileHeight );
            tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
            tile.setColourAlpha( 0.0, false );
            tile.setColour( gColour.set( 0.25, 0.9 ) );
            tile.setTextColour( gColour.setRGBA( 1.0, 1.0, 1.0, 1.0 ) );

            tile.setDrawOrder( 205 );

            tile.onRelease.push( new EditTypeFunction( newObject ) );
            this.addTile( tile );

            object.tiles.add( tile );

            object.tileType = tile;
        }

        // Name
        {
            tile = new CCTile3DButton( this );
            tile.setupText( "", tileHeight * 0.75, true, true );
            tile.setTileSize( tileWidth, tileHeight );
            tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
            tile.setColourAlpha( 0.0, false );
            tile.setColour( gColour.set( 0.25, 0.9 ) );
            tile.setTextColour( gColour.setRGBA( 1.0, 1.0, 1.0, 1.0 ) );

            tile.setDrawOrder( 205 );

            tile.onRelease.push( new EditNameFunction( newObject ) );
            this.addTile( tile );

            object.tiles.add( tile );

            object.tileName = tile;
        }

        // Image
        {
            tile = new CCTile3DButton( this );
            tile.setupText( "", tileHeight * 0.75, true, true );
            tile.setTileSize( tileWidth, tileHeight );
            tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
            tile.setColourAlpha( 0.0, false );
            tile.setColour( gColour.set( 1.0, 0.9 ) );

            tile.setDrawOrder( 205 );

            tile.onRelease.push( new EditImageFunction( newObject ) );
            this.addTile( tile );

            object.tiles.add( tile );

            object.tileImage = tile;
        }

        // Colour
        {
            tile = new CCTile3DButton( this );
            tile.setupText( "", tileHeight * 0.75, true, true );
            tile.setTileSize( tileWidth, tileHeight );
            tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
            tile.setColourAlpha( 0.0, false );
            tile.setColour( gColour.set( 0.25, 0.9 ) );
            tile.setTextColour( gColour.setRGBA( 1.0, 1.0, 1.0, 1.0 ) );

            tile.setDrawOrder( 205 );

            tile.onRelease.push( new EditColourFunction( newObject ) );
            this.addTile( tile );

            object.tiles.add( tile );

            object.tileColour = tile;
        }

        // Blinking
        {
            tile = new CCTile3DButton( this );
            tile.setupText( "", tileHeight * 0.75, true, true );
            tile.setTileSize( tileWidth, tileHeight );
            tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
            tile.setColourAlpha( 0.0, false );
            tile.setColour( gColour.set( 0.25, 0.9 ) );
            tile.setTextColour( gColour.setRGBA( 1.0, 1.0, 1.0, 1.0 ) );

            tile.setDrawOrder( 205 );

            tile.onRelease.push( new EditBlinkingFunction( newObject, true ) );
            this.addTile( tile );

            object.tiles.add( tile );

            object.tileBlinking = tile;
        }

        // Image Aspect Ratio
        {
            tile = new CCTile3DButton( this );
            tile.setupText( "", tileHeight * 0.75, true, true );
            tile.setTileSize( tileWidth, tileHeight );
            tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
            tile.setColourAlpha( 0.0, false );
            tile.setColour( gColour.set( 0.25, 0.9 ) );
            tile.setTextColour( gColour.setRGBA( 1.0, 1.0, 1.0, 1.0 ) );

            tile.setDrawOrder( 205 );

            tile.onRelease.push( new EditImageAspectRatioFunction( newObject ) );
            this.addTile( tile );

            object.tiles.add( tile );

            object.tileImageAspectRatio = tile;
        }

        // FullScreen
        {
            tile = new CCTile3DButton( this );
            tile.setupText( "", tileHeight * 0.75, true, true );
            tile.setTileSize( tileWidth, tileHeight );
            tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
            tile.setColourAlpha( 0.0, false );
            tile.setColour( gColour.set( 0.25, 0.9 ) );
            tile.setTextColour( gColour.setRGBA( 1.0, 1.0, 1.0, 1.0 ) );

            tile.setDrawOrder( 205 );

            tile.onRelease.push( new EditFullScreenFunction( newObject ) );
            this.addTile( tile );

            object.tiles.add( tile );

            object.tileFullScreen = tile;
        }

        // Flip
        {
            tile = new CCTile3DButton( this );
            tile.setupText( "", tileHeight * 0.75, true, true );
            tile.setTileSize( tileWidth, tileHeight );
            tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
            tile.setColourAlpha( 0.0, false );
            tile.setColour( gColour.set( 0.25, 0.9 ) );
            tile.setTextColour( gColour.setRGBA( 1.0, 1.0, 1.0, 1.0 ) );

            tile.setDrawOrder( 205 );

            tile.onRelease.push( new EditFlipFunction( newObject ) );
            this.addTile( tile );

            object.tiles.add( tile );

            object.tileFlipped = tile;
        }

        // Draw Order
        {
            tile = new CCTile3DButton( this );
            tile.setupText( "", tileHeight * 0.75, true, true );
            tile.setTileSize( tileWidth, tileHeight );
            tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
            tile.setColourAlpha( 0.0, false );
            tile.setColour( gColour.set( 0.25, 0.9 ) );
            tile.setTextColour( gColour.setRGBA( 1.0, 1.0, 1.0, 1.0 ) );

            tile.setDrawOrder( 205 );

            tile.onRelease.push( new EditDrawOrderFunction( newObject ) );
            this.addTile( tile );

            object.tiles.add( tile );

            object.tileDrawOrder = tile;
        }

        // Width
        {
            tile = new CCTile3DButton( this );
            tile.setupText( "", tileHeight * 0.75, true, true );
            tile.setTileSize( tileWidth, tileHeight );
            tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
            tile.setColourAlpha( 0.0, false );
            tile.setColour( gColour.set( 0.25, 0.9 ) );
            tile.setTextColour( gColour.setRGBA( 1.0, 1.0, 1.0, 1.0 ) );

            tile.setDrawOrder( 205 );

            tile.onRelease.push( new EditWidthFunction( newObject ) );
            this.addTile( tile );

            object.tiles.add( tile );

            object.tileWidth = tile;
        }

        // Height
        {
            tile = new CCTile3DButton( this );
            tile.setupText( "", tileHeight * 0.75, true, true );
            tile.setTileSize( tileWidth, tileHeight );
            tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
            tile.setColourAlpha( 0.0, false );
            tile.setColour( gColour.set( 0.25, 0.9 ) );
            tile.setTextColour( gColour.setRGBA( 1.0, 1.0, 1.0, 1.0 ) );

            tile.setDrawOrder( 205 );

            tile.onRelease.push( new EditHeightFunction( newObject ) );
            this.addTile( tile );

            object.tiles.add( tile );

            object.tileHeight = tile;
        }

        // X
        {
            tile = new CCTile3DButton( this );
            tile.setupText( "", tileHeight * 0.75, true, true );
            tile.setTileSize( tileWidth, tileHeight );
            tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
            tile.setColourAlpha( 0.0, false );
            tile.setColour( gColour.set( 0.25, 0.9 ) );
            tile.setTextColour( gColour.setRGBA( 1.0, 1.0, 1.0, 1.0 ) );

            tile.setDrawOrder( 205 );

            tile.onRelease.push( new EditXFunction( newObject ) );
            this.addTile( tile );

            object.tiles.add( tile );

            object.tileX = tile;
        }

        // Y
        {
            tile = new CCTile3DButton( this );
            tile.setupText( "", tileHeight * 0.75, true, true );
            tile.setTileSize( tileWidth, tileHeight );
            tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
            tile.setColourAlpha( 0.0, false );
            tile.setColour( gColour.set( 0.25, 0.9 ) );
            tile.setTextColour( gColour.setRGBA( 1.0, 1.0, 1.0, 1.0 ) );

            tile.setDrawOrder( 205 );

            tile.onRelease.push( new EditYFunction( newObject ) );
            this.addTile( tile );

            object.tiles.add( tile );

            object.tileY = tile;
        }

        // Text
        {
            tile = new CCTile3DButton( this );
            tile.setupText( "", tileHeight * 0.75, true, true );
            tile.setTileSize( tileWidth, tileHeight );
            tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
            tile.setColourAlpha( 0.0, false );
            tile.setColour( gColour.set( 0.25, 0.9 ) );
            tile.setTextColour( gColour.setRGBA( 1.0, 1.0, 1.0, 1.0 ) );

            tile.setDrawOrder( 205 );

            tile.onRelease.push( new EditTextFunction( newObject ) );
            this.addTile( tile );

            object.tiles.add( tile );

            object.tileText = tile;
        }

        // Text Scale
        {
            tile = new CCTile3DButton( this );
            tile.setupText( "", tileHeight * 0.75, true, true );
            tile.setTileSize( tileWidth, tileHeight );
            tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
            tile.setColourAlpha( 0.0, false );
            tile.setColour( gColour.set( 0.25, 0.9 ) );
            tile.setTextColour( gColour.setRGBA( 1.0, 1.0, 1.0, 1.0 ) );

            tile.setDrawOrder( 205 );

            tile.onRelease.push( new EditTextScaleFunction( newObject ) );
            this.addTile( tile );

            object.tiles.add( tile );

            object.tileTextScale = tile;
        }

        // Text Colour
        {
            tile = new CCTile3DButton( this );
            tile.setupText( "", tileHeight * 0.75, true, true );
            tile.setTileSize( tileWidth, tileHeight );
            tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
            tile.setColourAlpha( 0.0, false );
            tile.setColour( gColour.set( 0.25, 0.9 ) );
            tile.setTextColour( gColour.setRGBA( 1.0, 1.0, 1.0, 1.0 ) );

            tile.setDrawOrder( 205 );

            tile.onRelease.push( new EditTextColourFunction( newObject, true ) );
            this.addTile( tile );

            object.tiles.add( tile );

            object.tileTextColour = tile;
        }

        // Text Blinking
        {
            tile = new CCTile3DButton( this );
            tile.setupText( "", tileHeight * 0.75, true, true );
            tile.setTileSize( tileWidth, tileHeight );
            tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
            tile.setColourAlpha( 0.0, false );
            tile.setColour( gColour.set( 0.25, 0.9 ) );
            tile.setTextColour( gColour.setRGBA( 1.0, 1.0, 1.0, 1.0 ) );

            tile.setDrawOrder( 205 );

            tile.onRelease.push( new EditTextBlinkingFunction( newObject, true ) );
            this.addTile( tile );

            object.tiles.add( tile );

            object.tileTextBlinking = tile;
        }

        // 3D Model
        {
            tile = new CCTile3DButton( this );
            tile.setupText( "", tileHeight * 0.75, true, true );
            tile.setTileSize( tileWidth, tileHeight );
            tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
            tile.setColourAlpha( 0.0, false );
            tile.setColour( gColour.set( 1.0, 0.9 ) );

            tile.setDrawOrder( 205 );

            tile.onRelease.push( new Edit3DModelFunction( newObject, true ) );
            this.addTile( tile );

            object.tiles.add( tile );

            object.tile3DModel = tile;
        }

        // 3D Model Colour
        {
            tile = new CCTile3DButton( this );
            tile.setupText( "", tileHeight * 0.75, true, true );
            tile.setTileSize( tileWidth, tileHeight );
            tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
            tile.setColourAlpha( 0.0, false );
            tile.setColour( gColour.set( 0.25, 0.9 ) );
            tile.setTextColour( gColour.setRGBA( 1.0, 1.0, 1.0, 1.0 ) );

            tile.setDrawOrder( 205 );

            tile.onRelease.push( new Edit3DModelColourFunction( newObject, true ) );
            this.addTile( tile );

            object.tiles.add( tile );

            object.tile3DModelColour = tile;
        }

        // 3D Model Animation Speed
        {
            tile = new CCTile3DButton( this );
            tile.setupText( "", tileHeight * 0.75, true, true );
            tile.setTileSize( tileWidth, tileHeight );
            tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
            tile.setColourAlpha( 0.0, false );
            tile.setColour( gColour.set( 1.0, 0.9 ) );

            tile.setDrawOrder( 205 );

            tile.onRelease.push( new Edit3DModelAnimationSpeedFunction( newObject, true ) );
            this.addTile( tile );

            object.tiles.add( tile );

            object.tile3DModelAnimationSpeed = tile;
        }

        // On Press
        {
            tile = new CCTile3DButton( this );
            tile.setupText( "", tileHeight * 0.75, true, true );
            tile.setTileSize( tileWidth, tileHeight );
            tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
            tile.setColour( EditorManager.LightBlue );
            tile.setColourAlpha( 0.0, false );
            tile.setTextColour( gColour.setRGBA( 1.0, 1.0, 1.0, 1.0 ) );

            tile.setDrawOrder( 205 );

            tile.onRelease.push( new EditOnTouchFunction( newObject, newObject.onPress ) );
            this.addTile( tile );

            object.tiles.add( tile );

            object.tileOnPress = tile;
        }

        // On Release
        {
            tile = new CCTile3DButton( this );
            tile.setupText( "", tileHeight * 0.75, true, true );
            tile.setTileSize( tileWidth, tileHeight );
            tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
            tile.setColour( EditorManager.LightBlue );
            tile.setColourAlpha( 0.0, false );
            tile.setTextColour( gColour.setRGBA( 1.0, 1.0, 1.0, 1.0 ) );

            tile.setDrawOrder( 205 );

            tile.onRelease.push( new EditOnTouchFunction( newObject, newObject.onLoss ) );
            this.addTile( tile );

            object.tiles.add( tile );

            object.tileOnLoss = tile;
        }

        // On Release
        {
            tile = new CCTile3DButton( this );
            tile.setupText( "", tileHeight * 0.75, true, true );
            tile.setTileSize( tileWidth, tileHeight );
            tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
            tile.setColour( EditorManager.LightBlue );
            tile.setColourAlpha( 0.0, false );
            tile.setTextColour( gColour.setRGBA( 1.0, 1.0, 1.0, 1.0 ) );

            tile.setDrawOrder( 205 );

            tile.onRelease.push( new EditOnTouchFunction( newObject, newObject.onRelease ) );
            this.addTile( tile );

            object.tiles.add( tile );

            object.tileOnRelease = tile;
        }

        // Delete
        {
            tile = new CCTile3DButton( this );
            tile.setupText( "delete", tileHeight * 0.75, true, true );
            tile.setTileSize( tileWidth, tileHeight );
            tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
            tile.setColourAlpha( 0.0, false );
            tile.setColour( gColour.setRGBA( 0.75, 0.25, 0.25, 0.9 ) );
            tile.setTextColour( gColour.setRGBA( 1.0, 1.0, 1.0, 1.0 ) );

            tile.setDrawOrder( 205 );

            tile.onRelease.push( new DeleteObjectFunction( newObject ) );
            this.addTile( tile );

            object.tiles.add( tile );
        }

        this.updateObject( object, newObject );
    }

    // Add some noise to the animations of the menu show/hide sequences
    var duration = 1.0;
    for( i=0; i<objectsList.length; ++i )
    {
        tiles = objectsList[i].tiles;
        for( j=0; j>tiles.length; ++j )
        {
            tile = tiles[j];
            tile.movementInterpolator.setDuration( duration );
            duration += 0.125;
        }
    }

    this.requestResize();

    for( i=0; i<newObjects.length; ++i )
    {
        tiles = newObjects[i].tiles;
        for( j=0; j<tiles.length; ++j )
        {
            tile = tiles[j];
            tile.setPositionX( ( -camera.targetWidth * 0.5 ) - tile.collisionSize.width );
            tile.setTileMovementX( 0.0 );
            tile.setColourAlpha( 1.0, true );
            tile.setCollideable( true );
        }
    }
};


SceneUIListUIObjects.prototype.updateObject = function(listObject, uiObject)
{
    var self = this;

    listObject.tileType.setText( uiObject.constructor.name );

    if( uiObject.name )
    {
        listObject.tileName.setText( "Name: " + uiObject.name );
    }
    else
    {
        listObject.tileName.setText( "Name..." );
    }

    var currentTexture = uiObject.getTileTextureFilename();
    if( currentTexture )
    {
        listObject.tileImage.setTileTexture( currentTexture, function (tile, textureHandle)
        {
            tile.setupTexturedFit( self.camera.targetWidth, self.camera.targetHeight * 0.1 );
            self.requestResize();
        });
        listObject.tileImage.setText( "" );
    }
    else
    {
        listObject.tileImage.setText( "Select Image..." );
    }

    var colour = ( uiObject.colour ? uiObject.colour.toString() : "1,1,1,1" );
    if( uiObject.isBlinking() )
    {
        var colourSplit = colour.split( "," );
        colour = colourSplit[0] + "," + colourSplit[1] + "," + colourSplit[2] + ",1";
    }
    listObject.tileColour.setText( "Tile Colour: " + colour );
    if( uiObject.colour )
    {
        listObject.tileColour.setColour( gColour.setRGBA( uiObject.colour.r * 0.5, uiObject.colour.g * 0.5, uiObject.colour.b * 0.5, 1.0 ) );
    }

    listObject.tileBlinking.setText( "Blinking: " + ( uiObject.isBlinking() ? "true" : "false" ) );

    listObject.tileImageAspectRatio.setText( uiObject.aspectRatioLocked ? "Aspect Ratio Locked" : "Aspect Ratio Unlocked" );

    listObject.tileFullScreen.setText( "Fullscreen: " + ( uiObject.fullScreen ? "true" : "false" ) );

    listObject.tileFlipped.setText( "Flip Y" );

    listObject.tileDrawOrder.setText( "Draw Order: " + uiObject.drawOrder );

    listObject.tileWidth.setText( "Width: " + CC.FloatLimitPrecision( this.editor.getReletiveWidth( uiObject ) * 100 ) + "%" );
    listObject.tileHeight.setText( "Height: " + CC.FloatLimitPrecision( this.editor.getReletiveHeight( uiObject ) * 100 ) + "%" );
    listObject.tileX.setText( "X: " + CC.FloatLimitPrecision( this.editor.getReletiveX( uiObject ) * 100 ) + "%" );
    listObject.tileY.setText( "Y: " + CC.FloatLimitPrecision( this.editor.getReletiveY( uiObject ) * 100 ) + "%" );

    var currentText = uiObject.getText();
    listObject.tileText.setText( "Text: " + currentText );

    var textColour = ( currentText ? uiObject.textObject.colour.toString() : "0,0,0,1" );
    if( uiObject.isTextBlinking() )
    {
        var textColourSplit = textColour.split( "," );
        textColour = textColourSplit[0] + "," + textColourSplit[1] + "," + textColourSplit[2] + ",1";
    }
    listObject.tileTextColour.setText( "Text Colour: " + textColour );
    if( currentText )
    {
        listObject.tileTextColour.setColour( gColour.setRGBA( uiObject.textObject.colour.r * 0.5, uiObject.textObject.colour.g * 0.5, uiObject.textObject.colour.b * 0.5, 1.0 ) );
    }

    listObject.tileTextBlinking.setText( "Text Blinking: " + ( uiObject.isTextBlinking() ? "true" : "false" ) );

    listObject.tileTextScale.setText( "Text Scale: " + CC.FloatLimitPrecision( uiObject.textScale ? uiObject.textScale : 0.75 ) );

    if( uiObject.get3DModelFilename() )
    {
        listObject.tile3DModel.set3DModel( uiObject.get3DModelFilename(), uiObject.get3DModelTextureFilename(), 1 );
        listObject.tile3DModel.setTileSize( listObject.tile3DModel.collisionSize.width );
        listObject.tile3DModel.setTextColourAlpha( 0.0, true );
        listObject.tile3DModelAnimationSpeed.setText( "Animation Speed: " + ( uiObject.model3dAnimationSpeed !== undefined ? uiObject.model3dAnimationSpeed : 0.0 ) );
        listObject.tile3DModelColour.setText( "Model Colour: " + ( uiObject.model3dObject.colour ? uiObject.model3dObject.colour.toString() : "1,1,1,1" ) );
        if( uiObject.model3dObject )
        {
            listObject.tile3DModelColour.setColour( gColour.setRGBA( uiObject.model3dObject.colour.r * 0.5, uiObject.model3dObject.colour.g * 0.5, uiObject.model3dObject.colour.b * 0.5, 1.0 ) );
        }
    }
    else
    {
        listObject.tile3DModel.setText( "Select 3D Model..." );
        listObject.tile3DModel.setTextColourAlpha( 1.0, true );
        listObject.tile3DModelAnimationSpeed.setText( "" );
        listObject.tile3DModelColour.setText( "" );
        listObject.tile3DModelColour.setColour( gColour.setRGBA( 1.0, 1.0, 1.0, 1.0 ) );
    }

    if( uiObject.onPress.length > 0 )
    {
        var onPress = uiObject.onPress[0];
        if( onPress.length > 16 )
        {
            onPress = "..." + onPress.substring( onPress.length-17 );
        }
        listObject.tileOnPress.setText( "On Press: " + onPress );
    }
    else
    {
        listObject.tileOnPress.setText( "On Press..." );
    }

    if( uiObject.onRelease.length > 0 )
    {
        var onRelease = uiObject.onRelease[0];
        if( onRelease.length > 16 )
        {
            onRelease = "..." + onRelease.substring( onRelease.length-17 );
        }
        listObject.tileOnRelease.setText( "On Release: " + onRelease );
    }
    else
    {
        listObject.tileOnRelease.setText( "On Release..." );
    }

    if( uiObject.onLoss.length > 0 )
    {
        var onLoss = uiObject.onLoss[0];
        if( onLoss.length > 16 )
        {
            onLoss = "..." + onLoss.substring( onLoss.length-17 );
        }
        listObject.tileOnLoss.setText( "On Loss: " + onLoss );
    }
    else
    {
        listObject.tileOnLoss.setText( "On Loss..." );
    }
};
