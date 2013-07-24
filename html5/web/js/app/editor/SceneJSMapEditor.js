/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : SceneJSMapEditor.js
 * Description : UI for map .js editor.
 *
 * Created     : 03/03/13
 *-----------------------------------------------------------
 */

function SceneJSMapEditor(parentScene)
{
    this.construct();

    // Inform our parent on delete
    this.setParent( parentScene );

    this.cameraCentered = true;
    gEngine.addScene( this );

    var self = this;
    this.onDragDropLoadFunction = function(file, event)
    {
        self.onDragDropLoad( file, event );
    };
    gEngine.controls.onDragDropLoad.add( this.onDragDropLoadFunction );

    this.jsData = "";
    this.jsClassPrototypes = [];

    this.map = new SceneGameBattleRoyale( null );
}
ExtendPrototype( SceneJSMapEditor, CCSceneAppUI );


SceneJSMapEditor.prototype.deleteLater = function()
{
    if( this.onDragDropLoadFunction )
    {
        gEngine.controls.onDragDropLoad.remove( this.onDragDropLoadFunction );
        this.onDragDropLoadFunction = null;
    }

    this.CCSceneAppUI_deleteLater();
};


SceneJSMapEditor.prototype.setup = function()
{
    var self = this;

    var camera = gEngine.newSceneCamera( this );
    camera.setupViewport( 0.0, 0.0, 1.0, 1.0 );
    camera.setCameraWidth( 640.0, false );

    var tile;
    {
        tile = new CCTile3DButton( self );
        tile.setupTile( camera.targetWidth, camera.targetHeight );
        tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
        tile.setColour( gColour.set( 0.25, 0.0 ) );
        tile.setColourAlpha( 0.5, true );

        tile.setDrawOrder( 204 );

        this.cameraStickyTiles.add( tile );

        this.tileBackground = tile;
    }

    {
        tile = new CCTile3DButton( this );
        tile.setupText( " ", 1.0, true, true );
        tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
        tile.setColour( gColour.setRGBA( 0.5, 0.65, 1.0, 0.0 ) );
        tile.setTextColour( gColour.setRGBA( 1.0, 1.0, 1.0, 0.0 ) );

        tile.setDrawOrder( 210 );

        this.tileAlert = tile;
    }

    {
        tile = new CCTile3DButton( this );
        tile.setupTile( 1.0 );
        tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
        tile.setColourAlpha( 0.0, false );

        tile.setDrawOrder( 210 );

        this.tileModel = tile;
    }

    this.menuTiles = [];

    this.requestResize();
};


SceneJSMapEditor.prototype.updateScene = function(delta)
{
    var updated = this.CCSceneAppUI_updateScene( delta );
    return updated;
};


SceneJSMapEditor.prototype.render = function(camera, pass, alpha)
{
    this.CCSceneAppUI_render( camera, pass, alpha );
};


SceneJSMapEditor.prototype.resize = function()
{
    this.CCSceneAppUI_resize();

    var camera = this.camera;
    var tile;

    {
        tile = this.tileModel;
        tile.setTileSize( camera.targetHeight * 0.65, camera.targetHeight * 0.65 );

        if( !this.supportObj )
        {
            if( tile.getTileTextureImage() )
            {
                tile.setTileTexturedHeight( tile.collisionSize.height );
            }
        }
    }

    {
        tile = this.tileAlert;
        tile.setTileSize( camera.targetWidth, camera.targetHeight * 0.15 );
        tile.setTextHeight( tile.collisionBounds[1] );
        tile.positionTileAbove( this.tileModel );
    }

    {
        this.tileBackground.setTileSize( camera.targetWidth, camera.targetHeight );
    }

    var menuTiles = this.menuTiles;
    for( var i=0; i<menuTiles.length; ++i )
    {
        tile = menuTiles[i];
        if( i === 0 )
        {
            tile.setPositionXYZ( camera.cameraHWidth - tile.collisionBounds[0],
                                 camera.cameraHHeight - tile.collisionBounds[1],
                                 0.0 );
        }
        else
        {
            tile.positionTileBelow( menuTiles[i-1] );
        }
    }
};


SceneJSMapEditor.prototype.touchPressed = function(touch)
{
    var result = this.CCSceneAppUI_touchPressed( touch );
    return true;
};


SceneJSMapEditor.prototype.touchMoving = function(touch, touchDelta)
{
    var result = this.handleTilesTouch( touch, this.controlsMovingVertical ? CCControls.touch_movingVertical : CCControls.touch_movingHorizontal );
    if( result === CCSceneAppUI.tile_touchAction )
    {
        return true;
    }

    // Stop other views moving
    return true;
};


SceneJSMapEditor.prototype.touchReleased = function(touch, touchAction)
{
    var result = this.CCSceneAppUI_touchReleased( touch, touchAction );
    return true;
};


SceneJSMapEditor.prototype.open = function()
{
    this.message = ".js Map Editor";

    var self = this;
    var camera = this.camera;

    var i;
    var menuTiles = this.menuTiles;
    for( i=0; i<menuTiles.length; ++i )
    {
        menuTiles[i].deleteLater();
    }
    menuTiles.length = 0;

    {
        {
            tile = new CCTile3DButton( this );
            tile.setupTexturedWidth( camera.cameraWidth * 0.1, "resources/editor/editor_tile_cross.jpg", function()
            {
                self.showMenu();
            });
            tile.setColour( gColour.setRGBA( 1.0, 1.0, 1.0, 0.0 ) );
            tile.setDrawOrder( 220 );

            tile.onRelease.push( function()
            {
                if( self.closeCallback )
                {
                    self.closeCallback( false );
                }

                self.close();
            });
            this.addTile( tile, 0 );

            menuTiles.add( tile );
        }

        {
            tile = new CCTile3DButton( this );
            tile.setupTexturedWidth( camera.cameraWidth * 0.1, "resources/editor/editor_tile_tick.jpg", function()
            {
                self.showMenu();
            });
            tile.setColour( gColour.setRGBA( 1.0, 1.0, 1.0, 0.0 ) );
            tile.setDrawOrder( 220 );

            tile.onRelease.push( function()
            {
                if( self.closeCallback )
                {
                    self.closeCallback( true, self.jsData );
                }
                self.close();
            });
            this.addTile( tile, 0 );

            menuTiles.add( tile );
        }
    }

    this.showMenu();
};


SceneJSMapEditor.prototype.showMenu = function()
{
    if( this.enabled )
    {
        var camera = this.camera;
        var menuTiles = this.menuTiles;

        this.requestResize();

        var tile;
        {
            tile = this.tileModel;
            tile.setColourAlpha( 0.0, true );

            tile.setPositionX( ( camera.targetWidth * 0.5 ) + tile.collisionSize.width );
            tile.setTileMovementX( 0.0 );
        }

        {
            tile = this.tileAlert;
            tile.setTextColourAlpha( 1.0, true );
            tile.setColourAlpha( 0.85, true );
            tile.setText( this.message );

            tile.setPositionX( ( camera.targetWidth * 0.5 ) + tile.collisionSize.width );
            tile.setTileMovementX( 0.0 );
        }

        for( var i=0; i<menuTiles.length; ++i )
        {
            tile = menuTiles[i];
            tile.setPositionX( ( camera.targetWidth * 0.5 ) + tile.collisionSize.width );
            tile.translateTileMovementX( -tile.collisionSize.width * 1.5 );
            tile.setColourAlpha( 1.0, true );
            tile.enabled = true;
        }
    }
};


SceneJSMapEditor.prototype.close = function()
{
    var self = this;
    var i;

    // Fix up classes
    {
        var head = document.getElementsByTagName( 'head' )[0];
        var script = document.getElementById( 'customjs' );
        if( script )
        {
            head.removeChild( script );
        }

        var jsClassPrototypes = this.jsClassPrototypes;
        for( i=0; i<jsClassPrototypes.length; ++i )
        {
            var classPrototype = jsClassPrototypes[i];
            var targetClass = window[classPrototype.name];
            for( var m in classPrototype.prototypes )
            {
                targetClass.prototype[m] = classPrototype.prototypes[m];
            }
        }
    }

    this.tileBackground.setColourAlpha( 0.0, true );

    var tile;
    {
        tile = this.tileModel;
        tile.setColourAlpha( 0.0, true );
    }

    {
        tile = this.tileAlert;
        tile.setTextColourAlpha( 0.0, true );
        tile.setColourAlpha( 0.0, true, function()
        {
            self.deleteLater();
        });
    }

    var camera = this.camera;
    tile.translateTileMovementX( -( camera.targetWidth * 0.5 ) - tile.collisionSize.width );

    var menuTiles = this.menuTiles;
    for( i=0; i<menuTiles.length; ++i )
    {
        tile = menuTiles[i];
        tile.translateTileMovementX( ( camera.targetWidth * 0.5 ) + tile.collisionSize.width );
        tile.setColour( gColour.setRGBA( 1.0, 1.0, 1.0, 0.0 ), true );
        tile.enabled = false;
    }

    if( this.map )
    {
        this.map.deleteLater();
    }
};


SceneJSMapEditor.prototype.setCallback = function(callback)
{
    this.closeCallback = callback;
};


SceneJSMapEditor.prototype.onDragDropLoad = function(file, event)
{
    if( event && event.target && event.target.result )
    {
        if( MultiplayerManager.LoggedIn )
        {
            if( file.size > 1024 * 1024 )
            {
                AlertsManager.TimeoutAlert( "file size too large", 2.0 );
            }
            else
            {
                var filename = file.name;
                var data = event.target.result;
                this.prepareUpload( filename, data );
            }
        }
    }
};


SceneJSMapEditor.prototype.prepareUpload = function(filename, data)
{
    var self = this;

    var fileExtension = filename.getExtension();
    if( fileExtension === "js" )
    {
        this.jsData += data + '\n';
        //eval( data );

        var jsClassPrototypes = this.jsClassPrototypes;

        var prototypes = data.split( '.prototype.' );
        for( var i=1; i<prototypes.length; ++i )
        {
            var className = prototypes[i-1];
            var classNameStartIndex = 0;
            for( var j=className.length-1; j>=0; --j )
            {
                var character = className[j];
                if( /[^a-zA-Z0-9]/.test( character ) )
                {
                    classNameStartIndex = j+1;
                    break;
                }
            }
            className = className.substr( classNameStartIndex, className.length );

            var found = false;
            var classPrototype;
            for( var classIndex=0; i<jsClassPrototypes.length; ++i )
            {
                classPrototype = jsClassPrototypes[classIndex];
                if( className === classPrototype.name )
                {
                    found = true;
                    break;
                }
            }

            if( !found )
            {
                classPrototype = {};
                classPrototype.name = className;
                classPrototype.prototypes = [];
                var sourceClass = window[className];
                for( var m in sourceClass.prototype )
                {
                    classPrototype.prototypes[m] = sourceClass.prototype[m];
                }

                jsClassPrototypes.push( classPrototype );
            }
        }

        var script = document.getElementById( 'customjs' );
        if( !script )
        {
            var head = document.getElementsByTagName( 'head' )[0];
            script = document.createElement( 'script' );
            script.id = 'customjs';
            head.appendChild( script );
        }
        script.type = 'text/javascript';
        script.text = data;
    }
    else
    {
        AlertsManager.TimeoutAlert( "only .js supported", 2.0 );
    }
};


SceneJSMapEditor.prototype.upload = function(filename, data)
{
    var self = this;
    EditorManager.EditorUploadJS( filename, data, function (fileID, filename)
    {
        var uploaded = false;
        if( filename )
        {
            if( MultiplayerManager.LoggedIn )
            {
                //uploaded = self.uploadedJS( fileID, filename );
            }
        }

        if( !uploaded )
        {
            AlertsManager.TimeoutAlert( "failed to upload " + fileID + " :(", 2.0 );
        }
    });
};
