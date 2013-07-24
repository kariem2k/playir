/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : SceneVisualJSEditor.js
 * Description : Visual editor for .js
 *
 * Created     : 24/04/13
 *-----------------------------------------------------------
 */

function SceneVisualJSEditor(parentScene)
{
    this.construct();

    {
        // Inform our parent on delete
        this.setParent( parentScene );
    }

    gEngine.addScene( this );

    var self = this;
    this.sceneUIBack = new SceneUIBack( this, function()
    {
        self.close();
    }, true);
}
ExtendPrototype( SceneVisualJSEditor, CCSceneAppUI );


SceneVisualJSEditor.prototype.setup = function()
{
    var self = this;

    var camera = gEngine.newSceneCamera( this );
    camera.setupViewport( 0.0, 0.0, 1.0, 1.0 );
    camera.setCameraWidth( 640.0, false );

    {
        var tile = new CCTile3DButton( self );
        tile.setupTile();
        tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
        tile.setColour( gColour.set( 0.5, 0.0 ) );
        tile.setColourAlpha( 0.95, true );

        tile.setDrawOrder( 200 );

        this.cameraStickyTiles.add( tile );

        this.tileBackground = tile;
    }

    this.jsClasses = [];

    self.requestResize();
};

SceneVisualJSEditor.prototype.updateScene = function(delta)
{
    var updated = this.CCSceneAppUI_updateScene( delta );
    return updated;
};



SceneVisualJSEditor.prototype.render = function(camera, pass, alpha)
{
    this.CCSceneAppUI_render( camera, pass, alpha );
};


SceneVisualJSEditor.prototype.resize = function()
{
    this.CCSceneAppUI_resize();

    var camera = this.camera;

    var tile;
    {
        tile = this.tileBackground;
        tile.setTileSize( camera.targetWidth, camera.targetHeight );
    }

    var y = 0.0;
    var jsClasses = this.jsClasses;
    for( var classIndex=0; classIndex<jsClasses.length; ++classIndex )
    {
        var jsClass = jsClasses[classIndex];
        tile = jsClass.tile;
        if( classIndex > 0 )
        {
            y -= tile.collisionBounds[1];
        }
        tile.setPositionY( y );
        y -= tile.collisionBounds[1];

        y -= 5.0;

        var prototypes = jsClass.prototypes;
        for( var prototypeIndex=0; prototypeIndex<prototypes.length; ++prototypeIndex )
        {
            var jsPrototype = prototypes[prototypeIndex];
            tile = jsPrototype.tile;
            y -= tile.collisionBounds[1];
            tile.setPositionY( y );

            var x = tile.collisionBounds[0];

            var parameters = jsPrototype.parameters;
            for( var parameterIndex=0; parameterIndex<parameters.length; ++parameterIndex )
            {
                x += 5.0;

                var jsParameter = parameters[parameterIndex];
                tile = jsParameter.tile;
                x += tile.collisionBounds[0];
                tile.setPositionXY( x, y );
                x += tile.collisionBounds[0];
            }

            y -= tile.collisionBounds[1];

            var lines = jsPrototype.lines;
            for( var lineIndex=0; lineIndex<lines.length; ++lineIndex )
            {
                var jsLine = lines[lineIndex];
                x = 0.0;
                y -= 15.0;

                var tokens = jsLine.tokens;
                for( var tokenIndex=0; tokenIndex<tokens.length; ++tokenIndex )
                {
                    var jsToken = tokens[tokenIndex];
                    tile = jsToken.tile;
                    x += tile.collisionBounds[0];
                    tile.setPositionXY( x, y );
                    x += tile.collisionBounds[0];

                    x += 5.0;
                }
            }

            y -= 15.0;
        }

        y -= 30.0;
    }
};


SceneVisualJSEditor.prototype.touchPressed = function(touch)
{
    if( this.CCSceneAppUI_touchPressed( touch ) )
    {
        return true;
    }

    // Always take over the controls
    return true;
};


SceneVisualJSEditor.prototype.touchMoving = function(touch, touchDelta)
{
    return this.CCSceneAppUI_touchMoving( touch, touchDelta );
};


SceneVisualJSEditor.prototype.touchReleased = function(touch, touchAction)
{
    return this.CCSceneAppUI_touchReleased( touch, touchAction );
};


SceneVisualJSEditor.prototype.refreshCameraView = function()
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


SceneVisualJSEditor.prototype.lockCameraView = function()
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


SceneVisualJSEditor.prototype.open = function(filename, onClose)
{
    this.onClose = onClose;

    var self = this;
    var camera = this.camera;

    AlertsManager.ModalAlert( "loading..." );
    var url = MultiplayerManager.GetAssetURL( filename );
    gURLManager.requestURL( url,
        null,
        function (status, responseText)
        {
            if( status >= CCURLRequest.Succeeded && responseText && responseText.length > 0 )
            {
                self.parseJS( responseText );
            }
            else
            {
                AlertsManager.Hide( "loading..." );
                AlertsManager.TimeoutAlert( "failed to load :(", 2.0 );
                self.close();
            }
        },
        0,
        filename,
        -1,
        0.0 );
};


SceneVisualJSEditor.prototype.parseJS = function(jsData)
{
    var jsClasses = this.jsClasses;

    var startIndex, j, character;

    var jsPrototypes = jsData.split( '.prototype.' );
    for( var prototypeIndex=1; prototypeIndex<jsPrototypes.length; ++prototypeIndex )
    {
        var jsClassName = jsPrototypes[prototypeIndex-1];
        {
            startIndex = 0;
            for( j=jsClassName.length-1; j>=0; --j )
            {
                character = jsClassName[j];
                if( /[^a-zA-Z0-9]/.test( character ) )
                {
                    startIndex = j+1;
                    break;
                }
            }
            jsClassName = jsClassName.substr( startIndex, jsClassName.length );
        }

        var jsClass = this.findJSClass( jsClassName );
        if( !jsClass )
        {
            jsClass = {};
            jsClass.name = jsClassName;
            jsClass.prototypes = [];
            jsClasses.push( jsClass );
        }

        var jsPrototypeName = jsPrototypes[prototypeIndex];
        jsPrototypeName = String.SplitBefore( jsPrototypeName, " " );
        jsPrototypeName = String.SplitBefore( jsPrototypeName, "=" );
        jsPrototypeName = String.SplitBefore( jsPrototypeName, "\n" );

        jsPrototype = {};
        jsPrototype.name = jsPrototypeName;
        jsClass.prototypes.add( jsPrototype );

        // Find parameters
        jsPrototype.parameters = [];

        var jsParameters = jsPrototypes[prototypeIndex];
        jsParameters = String.SplitAfter( jsParameters, "(" );
        jsParameters = String.SplitBefore( jsParameters, ")" );

        if( jsParameters.length > 0 )
        {
            var parametersSplit = jsParameters.split( "," );

            for( parameterIndex=0; parameterIndex<parametersSplit.length; ++parameterIndex )
            {
                var jsParmaterName = parametersSplit[parameterIndex];
                jsParmaterName.replace( " ", "" );
                if( jsParmaterName.length === 0 )
                {
                    jsParmaterName = " ";
                }

                jsParameter = {};
                jsParameter.name = jsParmaterName;
                jsPrototype.parameters.push( jsParameter );
            }
        }

        // Find lines of code
        jsPrototype.lines = [];

        var code = jsPrototypes[prototypeIndex];
        code = String.SplitAfter( code, "{" );
        code = String.SplitBefore( code, "}" );

        var lines = code.split( ";" );
        for( var lineIndex=0; lineIndex<lines.length; ++lineIndex )
        {
            var line = lines[lineIndex];
            startIndex = -1;
            for( j=0; j<line.length; ++j )
            {
                character = line[j];
                if( /^[a-zA-Z0-9]/.test( character ) )
                {
                    startIndex = j;
                    break;
                }
            }

            if( startIndex >= 0 )
            {
                line = line.substr( startIndex );

                var jsLine = {};
                jsLine.line = line;
                jsLine.tokens = [];
                jsPrototype.lines.push( jsLine );

                var parsingToken = false;
                var tokenType = null;

                for( j=0; j<line.length; ++j )
                {
                    character = line[j];
                    if( /^[a-zA-Z0-9]/.test( character ) )
                    {
                        if( !parsingToken )
                        {
                            parsingToken = true;
                            startIndex = j;
                        }
                    }
                    else
                    {
                        if( !parsingToken )
                        {
                            if( character === "*" || character === "/" || character === "%" || character === "=" )
                            {
                                parsingToken = true;
                                startIndex = j;
                            }
                        }
                        else
                        {
                            if( character === "[" )
                            {
                                tokenType = "array";
                            }

                            if( character === "." || character === "_" )
                            {

                            }
                            else
                            {
                                parsingToken = false;
                                this.packageToken( jsLine.tokens, line, startIndex, j, tokenType );
                            }
                        }
                    }
                }

                if( parsingToken )
                {
                    parsingToken = false;
                    this.packageToken( jsLine.tokens, line, startIndex, line.length, tokenType );
                }
            }
        }
    }

    this.createJSTiles();
    this.requestResize();

    AlertsManager.Hide( "loading..." );
};


SceneVisualJSEditor.prototype.packageToken = function(tokensArray, codeLine, startIndex, endIndex, tokenType)
{
    var tokenName = codeLine.substr( startIndex, endIndex-startIndex );

    var jsToken = {};
    jsToken.name = tokenName;
    tokensArray.push( jsToken );

    if( tokenType )
    {
        jsToken.type = tokenType;
    }
};


SceneVisualJSEditor.prototype.createJSTiles = function()
{
    var jsClasses = this.jsClasses;

    var tile;
    for( var classIndex=0; classIndex<jsClasses.length; ++classIndex )
    {
        var jsClass = jsClasses[classIndex];

        tile = new CCTile3DButton( this );
        tile.setupText( jsClass.name, 20.0, true, true );
        tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
        tile.setColour( gColour.setRGBA( 0.5, 0.65, 1.0, 1.0 ) );
        tile.setTextColour( gColour.setRGBA( 1.0, 1.0, 1.0, 1.0 ) );
        tile.setDrawOrder( 210 );
        this.addTile( tile );

        jsClass.tile = tile;

        var prototypes = jsClass.prototypes;
        for( var prototypeIndex=0; prototypeIndex<prototypes.length; ++prototypeIndex )
        {
            var jsPrototype = prototypes[prototypeIndex];

            tile = new CCTile3DButton( this );
            tile.setupText( jsPrototype.name, 15.0, true, true );
            tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
            tile.setColour( SceneMapsManagerList.ColourOpenTitle );
            tile.setTextColour( gColour.setRGBA( 1.0, 1.0, 1.0, 1.0 ) );
            tile.setDrawOrder( 210 );
            this.addTile( tile );

            jsPrototype.tile = tile;

            var parameters = jsPrototype.parameters;
            for( var parameterIndex=0; parameterIndex<parameters.length; ++parameterIndex )
            {
                var jsParameter = parameters[parameterIndex];

                tile = new CCTile3DButton( this );
                tile.setupText( jsParameter.name, 15.0, true, true );
                tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
                tile.setColour( gColour.setRGBA( 0.75, 0.75, 0.15, 1.0 ) );
                tile.setTextColour( gColour.setRGBA( 1.0, 1.0, 1.0, 1.0 ) );
                tile.setDrawOrder( 210 );
                this.addTile( tile );

                jsParameter.tile = tile;
            }

            var lines = jsPrototype.lines;
            for( var lineIndex=0; lineIndex<lines.length; ++lineIndex )
            {
                var jsLine = lines[lineIndex];

                var tokens = jsLine.tokens;
                for( var tokenIndex=0; tokenIndex<tokens.length; ++tokenIndex )
                {
                    var jsToken = tokens[tokenIndex];

                    tile = new CCTile3DButton( this );
                    tile.setupText( jsToken.name, 15.0, true, true );
                    tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
                    tile.setColour( gColour.setRGBA( 0.65, 0.75, 1.0, 1.0 ) );
                    tile.setTextColour( gColour.setRGBA( 1.0, 1.0, 1.0, 1.0 ) );
                    tile.setDrawOrder( 210 );
                    this.addTile( tile );

                    jsToken.tile = tile;
                }
            }
        }
    }

    this.requestResize();
};


SceneVisualJSEditor.prototype.findJSClass = function(className)
{
    var jsClasses = this.jsClasses;
    for( var i=0; i<jsClasses.length; ++i )
    {
        var jsClass = jsClasses[i];
        if( jsClass.name === className )
        {
            return jsClass;
        }
    }
    return null;
};


SceneVisualJSEditor.prototype.close = function()
{
    var self = this;

    this.tileBackground.setColourAlpha( 0.0, true );

    var camera = this.camera;
    var tile = this.tileBackground;
    tile.setColourAlpha( 0.0, true, function()
    {
        self.deleteLater();
    });

    self.sceneUIBack.close();

    if( this.onClose )
    {
        this.onClose();
    }
};