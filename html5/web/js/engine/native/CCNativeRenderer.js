/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCNativeRenderer.js
 * Description : Native renderer
 *
 * Created     : 04/03/13
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

CCRenderer.prototype.create = function(width, height)
{
    this.nextVertexBufferID = 1;

    gRenderer = this;
    this.setSize( width, height );

    this.renderFlags = CCRenderer.render_all;

    this.setup();
};

CCRenderer.Float32Array = Array;
CCRenderer.Uint16Array = Array;
CCRenderer.gl_FRONT = 1;
CCRenderer.gl_BACK = 2;


CCRenderer.prototype.setSize = function(width, height)
{
    this.width = width;
    this.height = height;
    this.pendingRender = true;
};


CCRenderer.prototype.setup = function()
{
    this.initBuffers();
    CCEngine.NativeRenderCommands += 'gl.clearColor;0,0,0,0\n';

    this.CCSetColour( gColour.white() );

    this.CCSetDepthRead( true );
    this.CCSetDepthWrite( true );

    CCEngine.NativeRenderCommands += 'gl.depthFunc;LEQUAL\n';
    CCEngine.NativeRenderCommands += 'gl.blendFunc;SRC_ALPHA;ONE_MINUS_SRC_ALPHA\n';

    CCEngine.NativeRenderCommands += 'gl.lineWidth;2.0\n';

    this.CCSetCulling( true );
    this.CCSetBackCulling();
};


CCRenderer.prototype.initBuffers = function()
{
    {
        var textureCoords = [1.0, 0.0,
                             0.0, 0.0,
                             1.0, 1.0,
                             0.0, 1.0];
        this.defaultTextureCoords = textureCoords;
        this.CCDefaultTexCoords();
    }

    {
        this.vertexColorData = new CCRenderer.Float32Array( 4 );
    }

    {
        {
            var vertices = [0.5,  0.5,  0.0,        // Top right
                            -0.5,  0.5,  0.0,       // Top left
                            0.5, -0.5,  0.0,        // Bottom right
                            -0.5, -0.5,  0.0];      // Bottom left

            this.defaultSquareVertexBuffer = this.CCCreateVertexBuffer( vertices );
        }
        this.CCDefaultSquareVertexPointer();
    }
};


CCRenderer.prototype.clear = function(colour)
{
    if( colour )
    {
        CCEngine.NativeRenderCommands += 'gl.clear;gl.COLOR_BUFFER_BIT;gl.DEPTH_BUFFER_BIT\n';
    }
    else
    {
        CCEngine.NativeRenderCommands += 'gl.clear;gl.DEPTH_BUFFER_BIT\n';
    }
};


CCRenderer.prototype.beginRender = function()
{
    if( this.pendingRender )
    {
        this.pendingRender = false;

        this.unbindBuffers();

        this.clear( true );
        return true;
    }
    return false;
};


CCRenderer.prototype.unbindBuffers = function()
{
    this.textureCoords = -1;
    this.vertexTextureBuffer = -1;
    this.vertexPositionBuffer = -1;
    this.vertexIndexBuffer = -1;
    gEngine.textureManager.currentTextureIndex = 0;
};


CCRenderer.MatrixToString = function(matrix)
{
    return "" + matrix[0] + "," + matrix[1] + "," + matrix[2] + "," + matrix[3] + "," + matrix[4] + "," + matrix[5] + "," + matrix[6] + "," + matrix[7] + "," + matrix[8] + "," + matrix[9] + "," + matrix[10] + "," + matrix[11] + "," + matrix[12] + "," + matrix[13] + "," + matrix[14] + "," + matrix[15];
};


CCRenderer.ArrayToString = function(array)
{
    var string = "";
    string += array[0];

    var length = array.length;
    for( var i=1; i<length; ++i )
    {
        string += ",";
        string += array[i];
    }

    return string;
};


CCRenderer.prototype.CCSetViewMatrix = function(camera)
{
    // Set projection and view matrix once at the start of the camera setup?
    CCEngine.NativeRenderCommands += 'gl.uniformMatrix4fv;UNIFORM_PROJECTIONMATRIX;' + CCRenderer.MatrixToString( camera.projectionMatrix ) + '\n';
    CCEngine.NativeRenderCommands += 'gl.uniformMatrix4fv;UNIFORM_VIEWMATRIX;' + CCRenderer.MatrixToString( camera.viewMatrix ) + '\n';
};


CCRenderer.prototype.CCSetRenderStates = function()
{
    //CCEngine.NativeRenderCommands += '{ "id":"gl.uniformMatrix4fv", "mode":"UNIFORM_MODELMATRIX", "matrix":' + CCRenderer.MatrixToString( MODEL_MATRIX ) + ' },\n';
    CCEngine.NativeRenderCommands += 'CCRenderer.CCSetRenderStates\n';
};


CCRenderer.prototype.CCSetColour = function(colour)
{
    var r = colour.r;
    var g = colour.g;
    var b = colour.b;
    var a = colour.a;

    var data = this.vertexColorData;

    if( data[0] !== r ||
        data[1] !== g ||
        data[2] !== b ||
        data[3] !== a )
    {
        CCEngine.NativeRenderCommands += 'CCRenderer.CCSetColour;' + r + ',' + g + ',' + b + ',' + a + '\n';
        data[0] = r;
        data[1] = g;
        data[2] = b;
        data[3] = a;
    }

	this.colour = colour;
};


CCRenderer.prototype.CCSetTexCoords = function(textureCoords)
{
    this.vertexTextureBuffer = textureCoords;
    this.textureCoords = textureCoords;

    CCEngine.NativeRenderCommands += 'CCRenderer.CCSetTexCoords;' + textureCoords + '\n';
};


CCRenderer.prototype.CCDefaultTexCoords = function()
{
    if( this.textureCoords !== this.defaultTextureCoords )
    {
        this.CCSetTexCoords( this.defaultTextureCoords );
    }
};


CCRenderer.prototype.CCCreateVertexBuffer = function(vertices)
{
    var vertexBufferID = this.nextVertexBufferID++;
    CCEngine.NativeUpdateCommands += 'CCRenderer.CCCreateVertexBuffer;' + vertexBufferID + '\n';
    if( vertices )
    {
        this.CCUpdateVertexBuffer( vertexBufferID, vertices );
    }
    return vertexBufferID;
};


CCRenderer.prototype.CCCreateVertexIndexBuffer = function(indices)
{
    var vertexBufferID = this.nextVertexBufferID++;
    CCEngine.NativeUpdateCommands += 'CCRenderer.CCCreateVertexIndexBuffer;' + vertexBufferID + '\n';
    if( indices )
    {
        this.CCUpdateVertexBuffer( vertexBufferID, indices );
    }
    return vertexBufferID;
};


CCRenderer.prototype.CCUpdateVertexBuffer = function(vertexBufferID, vertices)
{
    CCEngine.NativeUpdateCommands += 'CCRenderer.CCUpdateVertexBuffer;' + vertexBufferID + ';' + vertices + '\n';
};


CCRenderer.prototype.CCDeleteVertexBuffer = function(vertexBufferID)
{
    CCEngine.NativeUpdateCommands += 'CCRenderer.CCDeleteVertexBuffer;' + vertexBufferID + '\n';
};


CCRenderer.prototype.CCBindVertexTextureBuffer = function(vertexBufferID)
{
    if( this.vertexTextureBuffer !== vertexBufferID )
    {
        this.vertexTextureBuffer = vertexBufferID;
        this.textureCoords = vertexBufferID;

        CCEngine.NativeRenderCommands += 'CCRenderer.CCBindVertexTextureBuffer;' + vertexBufferID + '\n';
    }
};


CCRenderer.prototype.CCBindVertexPositionBuffer = function(vertexBufferID)
{
    if( this.vertexPositionBuffer !== vertexBufferID )
    {
        this.vertexPositionBuffer = vertexBufferID;
        CCEngine.NativeRenderCommands += 'CCRenderer.CCBindVertexPositionBuffer;' + vertexBufferID + '\n';
    }
};


CCRenderer.prototype.CCBindVertexIndexBuffer = function(vertexBufferID)
{
    if( this.vertexIndexBuffer !== vertexBufferID )
    {
        this.vertexIndexBuffer = vertexBufferID;
        CCEngine.NativeRenderCommands += 'CCRenderer.CCBindVertexIndexBuffer;' + vertexBufferID + '\n';
    }
};


CCRenderer.prototype.GLDrawArrays = function(mode, count, offset)
{
    CCEngine.NativeRenderCommands += 'gl.drawArrays;' + mode + ';' + count + ';' + offset + '\n';
};


CCRenderer.prototype.GLDrawElements = function(mode, count, offsetInBytes)
{
    CCEngine.NativeRenderCommands += 'gl.drawElements;' + mode + ';' + count + ';' + 'offsetInBytes' + '\n';
};


CCRenderer.prototype.GLVertexPointer = function(vertices)
{
    if( this.vertexPositionBuffer !== vertices )
    {
        this.vertexPositionBuffer = vertices;
        CCEngine.NativeRenderCommands += 'CCRenderer.GLVertexPointer;' + vertices + '\n';
    }
};

// Squares are rendered flat on the Y axis (not standing up)
CCRenderer.prototype.CCRenderSquare = function(start, end)
{
    var vertices =
    [
        start[0],   end[1],      end[2],    // Bottom left
        end[0],     end[1],      end[2],    // Bottom right
        start[0],   start[1],    start[2],  // Top left
        end[0],     start[1],    start[2]   // Top right
    ];
    this.GLVertexPointer( vertices );

    var gl = this.gl;
    gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
};


CCRenderer.prototype.CCSetBlend = function(toggle)
{
    if( this.blendEnabled !== toggle )
    {
        this.blendEnabled = toggle ;
        CCEngine.NativeRenderCommands += 'CCRenderer.CCSetBlend;' + toggle + '\n';
    }
};


CCRenderer.prototype.CCSetDepthRead = function(toggle)
{
    if( this.depthReadEnabled !== toggle )
    {
        this.depthReadEnabled = toggle;
        CCEngine.NativeRenderCommands += 'CCRenderer.CCSetDepthRead;' + toggle + '\n';
    }
};


CCRenderer.prototype.CCSetDepthWrite = function(toggle)
{
    if( this.depthWriteEnabled !== toggle )
    {
        this.depthWriteEnabled = toggle;
        CCEngine.NativeRenderCommands += 'CCRenderer.CCSetDepthWrite;' + toggle + '\n';
    }
};


CCRenderer.prototype.CCSetCulling = function(toggle)
{
    if( this.cullingEnabled !== toggle )
    {
        this.cullingEnabled = toggle;
        CCEngine.NativeRenderCommands += 'CCRenderer.CCSetCulling;' + toggle + '\n';
    }
};


CCRenderer.prototype.CCSetFrontCulling = function()
{
    if( this.cullingType !== CCRenderer.gl_FRONT )
    {
        this.cullingType = CCRenderer.gl_FRONT;
        CCEngine.NativeRenderCommands += 'CCRenderer.CCSetFrontCulling\n';
    }
};


CCRenderer.prototype.CCSetBackCulling = function()
{
    if( this.cullingType !== CCRenderer.gl_BACK )
    {
        this.cullingType = CCRenderer.gl_BACK;
        CCEngine.NativeRenderCommands += 'CCRenderer.CCSetBackCulling\n';
    }
};


CCRenderer.prototype.GLViewport = function(x, y, width, height)
{
    CCEngine.NativeRenderCommands += 'gl.viewport;' + x + ',' + y + ',' + width + ',' + height + '\n';
};


CCRenderer.prototype.GLScissor = function(x, y, width, height)
{
    CCEngine.NativeRenderCommands += 'gl.scissor;' + x + ',' + y + ',' + width + ',' + height + '\n';
};



CCRenderer.GLPushMatrix = function()
{
    CCEngine.NativeRenderCommands += 'Matrix.GLPushMatrix\n';
};


CCRenderer.GLPopMatrix = function()
{
    CCEngine.NativeRenderCommands += 'Matrix.GLPopMatrix\n';
};


CCRenderer.GLLoadIdentity = function()
{
    CCEngine.NativeRenderCommands += 'Matrix.GLLoadIdentity\n';
};


CCRenderer.GLMultMatrix = function(matrix)
{
    // Optimization: Inlined MatrixToString function call
    CCEngine.NativeRenderCommands += 'Matrix.GLMultMatrix;' +  matrix[0] + ";" + matrix[1] + ";" + matrix[2] + ";" + matrix[3] + ";" + matrix[4] + ";" + matrix[5] + ";" + matrix[6] + ";" + matrix[7] + ";" + matrix[8] + ";" + matrix[9] + ";" + matrix[10] + ";" + matrix[11] + ";" + matrix[12] + ";" + matrix[13] + ";" + matrix[14] + ";" + matrix[15] + '\n';
};


CCRenderer.GLTranslate = function(vector)
{
    CCEngine.NativeRenderCommands += 'Matrix.GLTranslate;' + vector[0] + ';' + vector[1] + ';' + vector[2] + '\n';
};


CCRenderer.GLScale = function(vector)
{
    CCEngine.NativeRenderCommands += 'Matrix.GLScale;' + vector[0] + ';' + vector[1] + ';' + vector[2] + '\n';
};


CCRenderer.GLRotate = function(angle, vector)
{
    CCEngine.NativeRenderCommands += 'Matrix.GLRotate;' + angle + ';' + vector[0] + ';' + vector[1] + ';' + vector[2] + '\n';
};


CCRenderer.ModelMatrixMultiply = function(object)
{
    CCEngine.NativeRenderCommands += 'Matrix.ModelMatrixMultiply;' + object.jsID + '\n';
};


CCRenderer.ModelMatrixIdentity = function(object)
{
    CCEngine.NativeRenderCommands += 'Matrix.ModelMatrixIdentity;' + object.jsID + '\n';
};


CCRenderer.ModelMatrixTranslate = function(object, vector)
{
    CCEngine.NativeRenderCommands += 'Matrix.ModelMatrixTranslate;' + object.jsID + ';' + vector[0] + ';' + vector[1] + ';' + vector[2] + '\n';
};


CCRenderer.ModelMatrixScale = function(object, vector)
{
    CCEngine.NativeRenderCommands += 'Matrix.ModelMatrixScale;' + object.jsID + ';' + vector[0] + ';' + vector[1] + ';' + vector[2] + '\n';
};


CCRenderer.ModelMatrixRotate = function(object, angle, axis)
{
    CCEngine.NativeRenderCommands += 'Matrix.ModelMatrixRotate;' + object.jsID + ';' + angle + ';' + axis[0] + ';' + axis[1] + ';' + axis[2] + '\n';
};
