/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCTextureFontPageFile.js
 * Description : Handles loading font description files.
 *
 * Created     : 23/10/11
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

function CCTextureFontPageFile(inName)
{
    function Letter()
    {
        this.start = new CCPoint();
        this.end = new CCPoint();
        this.size = new CCSize();
    }
    var letters = this.letters = [];

    var i;
    for( i=0; i<256; ++i )
    {
        letters.push( new Letter() );
    }

    this.name = inName;

    var MAX_TEXT_LINES = this.MAX_TEXT_LINES = 8;
    var MAX_TEXT_LENGTH = 512;

    // Cached set up for building text meshes
    var lineSize = this.lineSize = [];
    for( i=0; i<MAX_TEXT_LINES; ++i )
    {
        lineSize.push( new CCPoint() );
    }

    var charSize = this.charSize = [];
    var startPositions = this.startPositions = [];
    for( i=0; i<MAX_TEXT_LINES; ++i )
    {
        charSize[i] = [];
        startPositions[i] = new CCPoint();
        for( var j=0; j<MAX_TEXT_LENGTH; ++j )
        {
            charSize[i][j] = new CCPoint();
        }
    }

    this.currentStart = vec3.create();
    this.currentEnd = vec3.create();

    this.cachedMeshes = [];

    this.loaded = false;
}


CCTextureFontPageFile.prototype.load = function(path)
{
    var self = this;

	var textureURL = path + this.name + ".png";
    this.texturePageIndex = gEngine.textureManager.assignTextureIndex( textureURL, true );

    var csvFile = this.name + ".csv";
    var dataURL = MultiplayerManager.GetAssetURL( path + csvFile );
    gURLManager.requestURL( dataURL,
                            null,
                            function(status, responseText)
                            {
                                if( status >= CCURLRequest.Succeeded )
                                {
                                    var letters = self.letters;

                                    var lettersSplit = responseText.split( "\n" );
                                    for( var i=0; i<lettersSplit.length; ++i )
                                    {
                                        var rawLetterData = lettersSplit[i];

                                        var letterDataSplit = rawLetterData.split( "," );
                                        //ASSERT( letterDataSplit.length === 4 );

                                        var letter = letters[i];
                                        letter.start.x = parseFloat( letterDataSplit[0] );
                                        letter.start.y = parseFloat( letterDataSplit[1] );
                                        letter.end.x = parseFloat( letterDataSplit[2] );
                                        letter.end.y = parseFloat( letterDataSplit[3] );

                                        // 16.0f because there's 16 tiles per font page
                                        letter.size.width = ( letter.end.x - letter.start.x ) * 16.0;
                                        letter.size.height = ( letter.end.y - letter.start.y ) * 16.0;

                                        letter.start.y = letter.start.y;
                                        letter.end.y = letter.end.y;
                                    }

                                    self.loaded = true;

                                    gEngine.resize();
                                }
                            },
                            1,
                            csvFile );

	return true;
};


CCTextureFontPageFile.prototype.bindTexturePage = function()
{
    gEngine.textureManager.setTextureIndex( this.texturePageIndex );
};


CCTextureFontPageFile.prototype.getLetter = function(character)
{
    var asciiCharacter = character.charCodeAt( 0 );
	if( asciiCharacter >= 0 )
    {
        return this.letters[asciiCharacter];
	}
	else if( asciiCharacter === -62 )
    {
        return this.letters[128];
	}

	return false;
};


CCTextureFontPageFile.prototype.getCharacterWidth = function(character, size)
{
    if( character === '\n' )
    {
    }
    else
    {
        var letter = this.getLetter( character );
        if( letter )
        {
            return letter.size.width * size;
        }
    }

    return 0.0;
};


CCTextureFontPageFile.prototype.getWidth = function(text, length, size)
{
    var totalWidth = 0.0;
	for( var i=0; i<length; ++i )
	{
        var character = text[i];
        if( character === '\n' )
        {
            break;
        }
        else
        {
            var letter = this.getLetter( character );
            if( letter )
            {
                totalWidth += letter.size.width * size;
            }
        }
	}

	return totalWidth;
};


CCTextureFontPageFile.prototype.getHeight = function(text, length, size)
{
    var maxHeight = 0.0;
	for( var i=0; i<length; ++i )
	{
        var letter = this.getLetter( text[i] );
		if( letter )
		{
            maxHeight = Math.max( maxHeight, letter.size.height * size );
		}
	}

	return maxHeight;
};


CCTextureFontPageFile.prototype.renderText = function(text, length, height, centeredX)
{
    if( !this.loaded )
    {
        return;
    }

    if( length < 1 )
    {
        return;
    }

    //ASSERT( length < MAX_TEXT_LENGTH );

    var mesh = this.getTextMesh( text, length, height, centeredX );

    var renderer = gRenderer;
    CCRenderer.GLPushMatrix();
    {
        CCRenderer.GLTranslate( [ 0.0, mesh.totalLineHeight*0.5, 0.0 ] );
        this.bindTexturePage();
        renderer.CCBindVertexTextureBuffer( mesh.vertexTextureBuffer );
        renderer.CCBindVertexPositionBuffer( mesh.vertexPositionBuffer );
        renderer.CCSetRenderStates();
        renderer.GLDrawArrays( "TRIANGLES", 0, mesh.vertexCount );
    }
    CCRenderer.GLPopMatrix();
};


CCTextureFontPageFile.prototype.getTextMesh = function(text, length, height, centeredX)
{
    var cachedMeshes = this.cachedMeshes;

    var i, mesh;

    for( i=0; i<cachedMeshes.length; ++i )
    {
        mesh = cachedMeshes[i];
        if( mesh.textHeight === height )
        {
            if( mesh.centeredX === centeredX )
            {
                if( mesh.text.length === length )
                {
                    if( mesh.text === text )
                    {
                        mesh.lastDrawTime = gEngine.lifetime;
                        return mesh;
                    }
                }
            }
        }
    }

    if( cachedMeshes.length > 100 )
    {
        // Delete the oldest one
        var oldestRenderTime = CC_MAXFLOAT;
        var oldestRender = null;
        for( i=0; i<cachedMeshes.length; ++i )
        {
            mesh = cachedMeshes[i];
            if( mesh.lastDrawTime < oldestRenderTime )
            {
                oldestRenderTime = mesh.lastDrawTime;
                oldestRender = mesh;
            }
        }

        if( oldestRender )
        {
            cachedMeshes.remove( oldestRender );

            gRenderer.CCDeleteVertexBuffer( oldestRender.vertexPositionBuffer );
            gRenderer.CCDeleteVertexBuffer( oldestRender.vertexTextureBuffer );
        }
    }

    mesh = this.buildTextMesh( text, length, height, centeredX );
    cachedMeshes.add( mesh );
    mesh.lastDrawTime = gEngine.lifetime;
    return mesh;
};


CCTextureFontPageFile.prototype.buildTextMesh = function(text, length, height, centeredX)
{
    var i, character, letter, size, start;

    // Find out our width so we can center the text
    var totalLineHeight = 0.0;
    var lineSize = this.lineSize;
    lineSize[0].x = lineSize[0].y = 0.0;
    var charSize = this.charSize;

    var lineIndex = 0;
    var characterIndex = 0;
    for( i=0; i<length; ++i )
    {
        character = text[i];
        {
            letter = this.getLetter( character );
            if( letter )
            {
                size = charSize[lineIndex][characterIndex];
                size.x = letter.size.width * height;
                size.y = letter.size.height * height;

                lineSize[lineIndex].x += size.x;
                lineSize[lineIndex].y = Math.max( lineSize[lineIndex].y, size.y );
                characterIndex++;
            }
        }
        if( character === '\n' )
        {
            totalLineHeight += lineSize[lineIndex].y;
            lineIndex++;
            lineSize[lineIndex].x = lineSize[lineIndex].y = 0.0;
            characterIndex = 0;
            //ASSERT( lineIndex < MAX_TEXT_LINES );
        }
    }
    totalLineHeight += lineSize[lineIndex].y;

    var startPositions = this.startPositions;
    for( i=0; i<lineIndex+1; ++i )
    {
        start = startPositions[i];
        start.x = 0.0;
        start.y = 0.0;
        if( centeredX )
        {
            start.x -= lineSize[i].x * 0.5;
        }

        for( var j=0; j<i; ++j )
        {
            start.y -= lineSize[j].y;
        }
    }

    var currentStart = this.currentStart;
    var currentEnd = this.currentEnd;
    currentStart[0] = startPositions[0].x;
    currentStart[1] = startPositions[0].y;

    // We will dynamically create meshes from the lines to save draw calls
    var vertices = new CCRenderer.Float32Array( 3 * 6 * length );
    var uvs = new CCRenderer.Float32Array( 2 * 6 * length );
    var vertexIndex = 0;
    var texCoordIndex = 0;

    lineIndex = 0;
    characterIndex = 0;
    for( i=0; i<length; ++i )
    {
        character = text[i];
        {
            letter = this.getLetter( character );
            if( letter )
            {
                size = charSize[lineIndex][characterIndex];

                // Calculate end point
                currentEnd[0] = currentStart[0] + size.x;
                currentEnd[1] = currentStart[1] - size.y;

                // Triangle 1
                {
                    vertices[vertexIndex++] = currentStart[0];           // Bottom left
                    vertices[vertexIndex++] = currentEnd[1];
                    vertices[vertexIndex++] = 0.0;
                    uvs[texCoordIndex++] = letter.start.x;
                    uvs[texCoordIndex++] = letter.end.y;

                    vertices[vertexIndex++] = currentEnd[0];             // Bottom right
                    vertices[vertexIndex++] = currentEnd[1];
                    vertices[vertexIndex++] = 0.0;
                    uvs[texCoordIndex++] = letter.end.x;
                    uvs[texCoordIndex++] = letter.end.y;

                    vertices[vertexIndex++] = currentStart[0];           // Top left
                    vertices[vertexIndex++] = currentStart[1];
                    vertices[vertexIndex++] = 0.0;
                    uvs[texCoordIndex++] = letter.start.x;
                    uvs[texCoordIndex++] = letter.start.y;
                }

                // Triangle 2
                {
                    vertices[vertexIndex++] = currentEnd[0];             // Bottom right
                    vertices[vertexIndex++] = currentEnd[1];
                    vertices[vertexIndex++] = 0.0;
                    uvs[texCoordIndex++] = letter.end.x;
                    uvs[texCoordIndex++] = letter.end.y;

                    vertices[vertexIndex++] = currentEnd[0];             // Top right
                    vertices[vertexIndex++] = currentStart[1];
                    vertices[vertexIndex++] = 0.0;
                    uvs[texCoordIndex++] = letter.end.x;
                    uvs[texCoordIndex++] = letter.start.y;

                    vertices[vertexIndex++] = currentStart[0];           // Top left
                    vertices[vertexIndex++] = currentStart[1];
                    vertices[vertexIndex++] = 0.0;
                    uvs[texCoordIndex++] = letter.start.x;
                    uvs[texCoordIndex++] = letter.start.y;
                }

                currentStart[0] += size.x;
                characterIndex++;
            }
        }
        if( character === '\n' )
        {
            lineIndex++;
            start = startPositions[lineIndex];
            currentStart[0] = start.x;
            currentStart[1] = start.y;
            characterIndex = 0;
        }
    }

    // Now create our vertex buffer
    var vertexPositionBuffer = gRenderer.CCCreateVertexBuffer( vertices );
    var vertexTextureBuffer = gRenderer.CCCreateVertexBuffer( uvs, 2 );

    var mesh = {};
    mesh.text = text;
    mesh.textHeight = height;
    mesh.centeredX = centeredX;
    mesh.totalLineHeight = totalLineHeight;
    mesh.vertexPositionBuffer = vertexPositionBuffer;
    mesh.vertexTextureBuffer = vertexTextureBuffer;
    mesh.vertexCount = vertexIndex/3;

    return mesh;
};
