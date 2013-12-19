/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCWebGLRenderer.js
 * Description : WebGL renderer
 *
 * Created     : 24/07/11
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

var shaderVS = "                                                                                \n\
attribute vec3 vs_position;                                                                     \n\
attribute vec2 vs_texCoord;                                                                     \n\
                                                                                                \n\
uniform mat4 u_projectionMatrix;                                                                \n\
uniform mat4 u_viewMatrix;                                                                      \n\
uniform mat4 u_modelMatrix;                                                                     \n\
uniform vec4 u_modelColour;                                                                     \n\
                                                                                                \n\
varying vec4 vColor;                                                                            \n\
varying vec2 vTextureCoord;                                                                     \n\
                                                                                                \n\
void main(void)                                                                                 \n\
{                                                                                               \n\
    gl_Position = u_projectionMatrix * u_viewMatrix * u_modelMatrix * vec4( vs_position, 1.0 ); \n\
    vColor = u_modelColour;                                                                     \n\
    vTextureCoord = vs_texCoord;                                                                \n\
}";

var shaderFS = "                                                                            \n\
#ifdef GL_ES                                                                                \n\
    precision mediump float;                                                                  \n\
#endif                                                                                      \n\
varying vec4 vColor;                                                                        \n\
varying vec2 vTextureCoord;                                                                 \n\
uniform sampler2D uSampler;                                                                 \n\
void main(void)                                                                             \n\
{                                                                                           \n\
    vec4 texColor = texture2D( uSampler, vec2( vTextureCoord.s, vTextureCoord.t ) );        \n\
    gl_FragColor = texColor * vColor;                                                       \n\
}                                                                                           \n";


function initGL(canvas)
{
    var names = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
    var context = null;
    for( var i=0; i<names.length; ++i)
    {
        try
        {
            context = canvas.getContext( names[i], { antialias: true } );
        }
        catch( e ) {}

        if( context )
        {
            break;
        }
    }

    if( !context )
    {
        //alert( "Could not initialise WebGL, sorry :-(" );
    }
    return context;
}


function getShader(gl, source, shaderType)
{
    var shader = gl.createShader( shaderType );
    gl.shaderSource( shader, source );
    gl.compileShader( shader );

    if( !gl.getShaderParameter( shader, gl.COMPILE_STATUS ) )
    {
        alert( gl.getShaderInfoLog( shader ) );
        return null;
    }

    return shader;
}


CCRenderer.prototype.create = function(parent)
{
    this.parent = parent;
    this.canvas = document.createElement( 'canvas' );

    // Disallow dragging of our canvas
    this.canvas.ondragstart = function()
    {
        return false;
    };

    //this.setSize( 720, 480 );
    //this.setSize( 1080, 720 );
    //this.setSize( 1620, 1080 );

    this.renderFlags = CCRenderer.render_all;

    this.activeRenderState = {};
    this.pendingRenderState = {};

    if( this.setup() )
    {
        this.parent.appendChild( this.canvas );
        this.pendingRender = true;
        gRenderer = this;
    }

    return this;
};

CCRenderer.Float32Array = Float32Array;
CCRenderer.Uint16Array = Uint16Array;


CCRenderer.prototype.setSize = function(width, height, scale)
{
    this.width = width;
    this.height = height;

    if( scale === undefined )
    {
        scale = 1.0;
    }

    // Windows seems to not use antialaising, so lets double our res (slower performance, but readable text)
    if( navigator.platform === "Win32" )
    {
        scale = 2.0;
    }

    // if( BrowserType['mobile'] )
    // {
    //     scale *= 0.5;
    // }

    this.scale = scale;

    this.canvas.width = this.width * this.scale;
    this.canvas.height = this.height * this.scale;

    this.resize();
};


CCRenderer.prototype.zero = function()
{
    this.canvas.style.width = 1;
    this.canvas.style.height = 1;
};


CCRenderer.prototype.resize = function()
{
    this.canvas.style.width = this.width;
    this.canvas.style.height = this.height;

    this.pendingRender = true;
};


CCRenderer.prototype.setup = function()
{
    var gl = this.gl = initGL( this.canvas );
    if( gl )
    {
        this.initShaders();
        this.initBuffers();

        gl.clearColor( 0.0, 0.0, 0.0, 0.0 );
        this.CCSetColour( gColour.white() );

        this.CCSetDepthRead( true );
        this.CCSetDepthWrite( true );

        gl.depthFunc( gl.LEQUAL );
        gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );

        gl.enable( gl.SCISSOR_TEST );

        // As of 29/10/11 Windows XP Firefox/Chrome doesn't support lineWidth
        gl.lineWidth( 2.0 );

        this.CCSetCulling( true );
        this.CCSetBackCulling();
    }

    return gl;
};


CCRenderer.prototype.initShaders = function()
{
    var gl = this.gl;
    var fragmentShader = getShader( gl, shaderFS, gl.FRAGMENT_SHADER );
    var vertexShader = getShader( gl, shaderVS, gl.VERTEX_SHADER );

    var shaderProgram = this.shaderProgram = gl.createProgram();
    gl.attachShader( shaderProgram, vertexShader );
    gl.attachShader( shaderProgram, fragmentShader );
    gl.linkProgram( shaderProgram );

    if( !gl.getProgramParameter( shaderProgram, gl.LINK_STATUS ) )
    {
        alert( "Could not initialise shaders" );
    }

    gl.useProgram( shaderProgram );

    shaderProgram.ATTRIB_VERTEX = gl.getAttribLocation( shaderProgram, "vs_position" );
    gl.enableVertexAttribArray( shaderProgram.ATTRIB_VERTEX );

    shaderProgram.ATTRIB_TEXCOORD = gl.getAttribLocation( shaderProgram, "vs_texCoord" );
    gl.enableVertexAttribArray( shaderProgram.ATTRIB_TEXCOORD );

    shaderProgram.UNIFORM_PROJECTIONMATRIX = gl.getUniformLocation( shaderProgram, "u_projectionMatrix" );
    shaderProgram.UNIFORM_VIEWMATRIX = gl.getUniformLocation( shaderProgram, "u_viewMatrix" );
    shaderProgram.UNIFORM_MODELMATRIX = gl.getUniformLocation( shaderProgram, "u_modelMatrix" );
    shaderProgram.UNIFORM_MODELCOLOUR = gl.getUniformLocation( shaderProgram, "u_modelColour" );

    shaderProgram.samplerUniform = gl.getUniformLocation( shaderProgram, "uSampler" );
};


CCRenderer.prototype.initBuffers = function()
{
    var gl = this.gl;

    {
        var squareTextureBuffer = this.squareTextureBuffer = gl.createBuffer();
        squareTextureBuffer.itemSize = 2;

        {
            var textureCoords = [1.0, 0.0,  // Bottom right
                                 0.0, 0.0,  // Bottom left
                                 1.0, 1.0,  // Top right
                                 0.0, 1.0]; // Top left
            this.defaultTextureCoords = new Float32Array( textureCoords );
        }
        this.CCDefaultTexCoords();
    }

    // Indices
    {
        this.vertexIndexBuffer = gl.createBuffer();
    }

    // Vertices
    {
        var vertexPositionBuffer = this.vertexPositionBuffer = gl.createBuffer();
        vertexPositionBuffer.itemSize = 3;
    }

    {
        this.vertexColorData = new Float32Array( 4 );
    }

    {
        {
            var vertices = [0.5,  0.5,  0.0,        // Top right
                            -0.5,  0.5,  0.0,       // Top left
                            0.5, -0.5,  0.0,        // Bottom right
                            -0.5, -0.5,  0.0];      // Bottom left

            this.defaultSquareVertexBuffer = this.CCCreateVertexBuffer( new Float32Array( vertices ) );
        }

        this.CCDefaultSquareVertexPointer();
    }
};


CCRenderer.prototype.clear = function(colour)
{
    var gl = this.gl;
    if( colour )
    {
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
    }
    else
    {
        var depthWriteEnabled = this.pendingRenderState.depthWriteEnabled;
        if( !depthWriteEnabled )
        {
            this.CCSetDepthWrite( true );
            this.CCSetRenderStates();
        }
        gl.clear( gl.DEPTH_BUFFER_BIT );
        if( !depthWriteEnabled )
        {
            this.CCSetDepthWrite( depthWriteEnabled );
            this.CCSetRenderStates();
        }
    }
};


CCRenderer.prototype.beginRender = function()
{
    if( this.pendingRender )
    {
        this.pendingRender = false;

        var gl = this.gl;
        this.CCSetDepthWrite( true );
        gl.depthMask( true );

        this.clear( true );
        return true;
    }
    return false;
};


CCRenderer.prototype.CCSetViewMatrix = function(camera)
{
    var gl = this.gl;
    var shaderProgram = this.shaderProgram;
    gl.uniformMatrix4fv( shaderProgram.UNIFORM_PROJECTIONMATRIX, false, camera.projectionMatrix );
    gl.uniformMatrix4fv( shaderProgram.UNIFORM_VIEWMATRIX, false, camera.viewMatrix );
};


CCRenderer.prototype.CCSetRenderStates = function()
{
    var gl = this.gl;

    var activeRenderState = this.activeRenderState;
    var pendingRenderState = this.pendingRenderState;
    if( activeRenderState.blendEnabled !== pendingRenderState.blendEnabled )
    {
        activeRenderState.blendEnabled = pendingRenderState.blendEnabled;
        if( activeRenderState.blendEnabled )
        {
            gl.enable( gl.BLEND );
        }
        else
        {
            gl.disable( gl.BLEND );
        }
    }

    if( activeRenderState.depthReadEnabled !== pendingRenderState.depthReadEnabled )
    {
        activeRenderState.depthReadEnabled = pendingRenderState.depthReadEnabled;
        if( activeRenderState.depthReadEnabled )
        {
            gl.enable( gl.DEPTH_TEST );
        }
        else
        {
            gl.disable( gl.DEPTH_TEST );
        }
    }

    if( activeRenderState.depthWriteEnabled !== pendingRenderState.depthWriteEnabled )
    {
        activeRenderState.depthWriteEnabled = pendingRenderState.depthWriteEnabled;
        gl.depthMask( activeRenderState.depthWriteEnabled );
    }

    if( activeRenderState.cullingEnabled !== pendingRenderState.cullingEnabled )
    {
        activeRenderState.cullingEnabled = pendingRenderState.cullingEnabled;
        if( activeRenderState.cullingEnabled )
        {
            gl.enable( gl.CULL_FACE );
        }
        else
        {
            gl.disable( gl.CULL_FACE );
        }
    }

    if( activeRenderState.cullingType !== pendingRenderState.cullingType )
    {
        activeRenderState.cullingType = pendingRenderState.cullingType;
        if( activeRenderState.cullingType === gl.FRONT )
        {
            gl.cullFace( gl.FRONT );
        }
        else if( activeRenderState.cullingType === gl.BACK )
        {
            gl.cullFace( gl.BACK );
        }
    }


    var shaderProgram = this.shaderProgram;
    gl.uniformMatrix4fv( shaderProgram.UNIFORM_MODELMATRIX, false, MODEL_MATRIX );
};


CCRenderer.prototype.CCSetColour = function(colour)
{
    var r = colour.r;
    var g = colour.g;
    var b = colour.b;
    var a = colour.a;

    var gl = this.gl;
    var data = this.vertexColorData;

    if( data[0] !== r ||
        data[1] !== g ||
        data[2] !== b ||
        data[3] !== a )
    {
        data[0] = r;
        data[1] = g;
        data[2] = b;
        data[3] = a;
        var shaderProgram = this.shaderProgram;
        gl.uniform4fv( shaderProgram.UNIFORM_MODELCOLOUR, data );
    }

	this.colour = colour;
};


CCRenderer.prototype.CCSetTexCoords = function(textureCoords)
{
    this.textureCoords = textureCoords;

    if( this.vertexTextureBuffer !== this.squareTextureBuffer )
    {
        this.vertexTextureBuffer = this.squareTextureBuffer;
    }

    var gl = this.gl;
    gl.bindBuffer( gl.ARRAY_BUFFER, this.vertexTextureBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, textureCoords, gl.STATIC_DRAW );
    gl.vertexAttribPointer( this.shaderProgram.ATTRIB_TEXCOORD, this.vertexTextureBuffer.itemSize, gl.FLOAT, false, 0, 0 );
};


CCRenderer.prototype.CCDefaultTexCoords = function()
{
    if( this.textureCoords !== this.defaultTextureCoords )
    {
        this.CCSetTexCoords( this.defaultTextureCoords );
    }
    else
    {
        // Ensure the square texture buffer is binded
        this.CCBindVertexTextureBuffer( this.squareTextureBuffer );
    }
};


CCRenderer.prototype.CCCreateVertexBuffer = function(vertices, itemSize)
{
    var gl = this.gl;

    var vertexBuffer = gl.createBuffer();
    if( vertexBuffer )
    {
        vertexBuffer.itemSize = itemSize ? itemSize : 3;

        if( vertices )
        {
            this.CCUpdateVertexBuffer( vertexBuffer, vertices );
        }
    }
    return vertexBuffer;
};


CCRenderer.prototype.CCCreateVertexIndexBuffer = function(indices)
{
    var gl = this.gl;

    var vertexBuffer = gl.createBuffer();
    vertexBuffer.numItems = indices.length;
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, vertexBuffer );
    gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW );

    return vertexBuffer;
};


CCRenderer.prototype.CCUpdateVertexBuffer = function(vertexBuffer, vertices)
{
    var gl = this.gl;

    gl.bindBuffer( gl.ARRAY_BUFFER, vertexBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW );
};


CCRenderer.prototype.CCDeleteVertexBuffer = function(vertexBuffer)
{
};


CCRenderer.prototype.CCBindVertexTextureBuffer = function(vertexTextureBuffer)
{
    if( this.vertexTextureBuffer !== vertexTextureBuffer )
    {
        this.vertexIndexBuffer = -1;
        this.vertexTextureBuffer = vertexTextureBuffer;

        var gl = this.gl;
        gl.bindBuffer( gl.ARRAY_BUFFER, vertexTextureBuffer );
        gl.vertexAttribPointer( this.shaderProgram.ATTRIB_TEXCOORD, vertexTextureBuffer.itemSize, gl.FLOAT, false, 0, 0 );
    }
};


CCRenderer.prototype.CCBindVertexPositionBuffer = function(vertexPositionBuffer)
{
    if( this.vertexPositionBuffer !== vertexPositionBuffer )
    {
        this.vertexIndexBuffer = -1;
        this.vertexPositionBuffer = vertexPositionBuffer;

        var gl = this.gl;
        gl.bindBuffer( gl.ARRAY_BUFFER, vertexPositionBuffer );
        gl.vertexAttribPointer( this.shaderProgram.ATTRIB_VERTEX, vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0 );
    }
};


CCRenderer.prototype.CCBindVertexIndexBuffer = function(vertexIndexBuffer)
{
    if( this.vertexIndexBuffer !== vertexIndexBuffer )
    {
        this.vertexIndexBuffer = vertexIndexBuffer;

        var gl = this.gl;
        gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, vertexIndexBuffer );
    }
};


CCRenderer.prototype.GLDrawArrays = function(mode, first, count)
{
    var gl = this.gl;

    if( mode === "TRIANGLE_STRIP" )
    {
        gl.drawArrays( gl.TRIANGLE_STRIP, first, count );
    }
    else if( mode === "TRIANGLES" )
    {
        gl.drawArrays( gl.TRIANGLES, first, count );
    }
    else if( mode === "LINES" )
    {
        gl.drawArrays( gl.LINES, first, count );
    }
    else
    {
        CC.ASSERT( false );
    }
};


CCRenderer.prototype.GLDrawElements = function(mode, count, offsetInBytes)
{
    var gl = this.gl;

    if( mode === "LINE_STRIP" )
    {
        gl.drawElements( gl.LINE_STRIP, count, gl.UNSIGNED_SHORT, offsetInBytes );
    }
    else if( mode === "TRIANGLE_STRIP" )
    {
        gl.drawElements( gl.TRIANGLE_STRIP, count, gl.UNSIGNED_SHORT, offsetInBytes );
    }
    else if( mode === "TRIANGLES" )
    {
        gl.drawElements( gl.TRIANGLES, count, gl.UNSIGNED_SHORT, offsetInBytes );
    }
    else
    {
        CC.ASSERT( false );
    }
};


CCRenderer.prototype.GLVertexPointer = function(vertices)
{
    var gl = this.gl;

    gl.bindBuffer( gl.ARRAY_BUFFER, this.vertexPositionBuffer );
    if( this.vertices !== vertices )
    {
        this.vertices = vertices;
        gl.bufferData( gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW );
    }
    gl.vertexAttribPointer( this.shaderProgram.ATTRIB_VERTEX, this.vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0 );
};


// Squares are rendered flat on the Y axis (not standing up)
CCRenderer.prototype.CCRenderSquare = function(start, end)
{
    if( !this.renderSquareVertices )
    {
        this.renderSquareVertices = new Float32Array( 3 * 4 );
    }

    var vertices =
	[
        start[0],   end[1],     end[2],     // Bottom left
        end[0],     end[1],     end[2],     // Bottom right
        start[0],   start[1],   start[2],   // Top left
        end[0],     start[1],   start[2]    // Top right
    ];

    var renderSquareVertices = this.renderSquareVertices;
    var length = renderSquareVertices.length;
    for( var i=0; i<length; ++i )
    {
        renderSquareVertices[i] = vertices[i];
    }
    this.GLVertexPointer( renderSquareVertices );

    var gl = this.gl;
    gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
};


CCRenderer.prototype.CCSetBlend = function(toggle)
{
    if( this.pendingRenderState.blendEnabled !== toggle )
    {
        this.pendingRenderState.blendEnabled = toggle;
    }
};


CCRenderer.prototype.CCSetDepthRead = function(toggle)
{
    if( this.pendingRenderState.depthReadEnabled !== toggle )
    {
        this.pendingRenderState.depthReadEnabled = toggle;
    }
};


CCRenderer.prototype.CCSetDepthWrite = function(toggle)
{
    if( this.pendingRenderState.depthWriteEnabled !== toggle )
    {
        this.pendingRenderState.depthWriteEnabled = toggle;
    }
};


CCRenderer.prototype.CCSetCulling = function(toggle)
{
    if( this.pendingRenderState.cullingEnabled !== toggle )
    {
        this.pendingRenderState.cullingEnabled = toggle;
    }
};


CCRenderer.prototype.CCSetFrontCulling = function()
{
    if( this.pendingRenderState.cullingType !== this.gl.FRONT )
    {
        this.pendingRenderState.cullingType = this.gl.FRONT;
    }
};


CCRenderer.prototype.CCSetBackCulling = function()
{
    if( this.pendingRenderState.cullingType !== this.gl.BACK )
    {
        this.pendingRenderState.cullingType = this.gl.BACK;
    }
};


CCRenderer.prototype.GLViewport = function(x, y, width, height)
{
    var gl = this.gl;
    x *= this.scale;
    y *= this.scale;
    width *= this.scale;
    height *= this.scale;
    if( this.viewportX !== x || this.viewportY !== y || this.viewportWidth !== width || this.viewportHeight !== height )
    {
        this.viewportX = x;
        this.viewportY = y;
        this.viewportWidth = width;
        this.viewportHeight = height;
        gl.viewport( x, y, width, height );
    }
};


CCRenderer.prototype.GLScissor = function(x, y, width, height)
{
    var gl = this.gl;
    x *= this.scale;
    y *= this.scale;
    width *= this.scale;
    height *= this.scale;
    if( this.scissorX !== x || this.scissorY !== y || this.scissorWidth !== width || this.scissorHeight !== height )
    {
        this.scissorX = x;
        this.scissorY = y;
        this.scissorWidth = width;
        this.scissorHeight = height;
        gl.scissor( x, y, width, height );
    }
};



var MAX_PUSHES = 15;
var CURRENT_PUSH = 0;
var MODEL_MATRIX_STACK = new Array( MAX_PUSHES );
for( var i=0; i<MODEL_MATRIX_STACK.length; ++i )
{
    MODEL_MATRIX_STACK[i] = mat4.create();
}
var MODEL_MATRIX = MODEL_MATRIX_STACK[0];


CCRenderer.GLPushMatrix = function()
{
    CURRENT_PUSH++;
    CC.ASSERT( CURRENT_PUSH < MAX_PUSHES );
    mat4.copy( MODEL_MATRIX_STACK[CURRENT_PUSH], MODEL_MATRIX );
    MODEL_MATRIX = MODEL_MATRIX_STACK[CURRENT_PUSH];
};


CCRenderer.GLPopMatrix = function()
{
    CURRENT_PUSH--;
    CC.ASSERT( CURRENT_PUSH >= 0 );
    MODEL_MATRIX = MODEL_MATRIX_STACK[CURRENT_PUSH];
};


CCRenderer.GLLoadIdentity = function()
{
    mat4.identity( MODEL_MATRIX );
};


CCRenderer.GLMultMatrix = function(inMatrix)
{
    mat4.multiply( MODEL_MATRIX, MODEL_MATRIX, inMatrix );
};


CCRenderer.GLTranslate = function(vector)
{
    mat4.translate( MODEL_MATRIX, MODEL_MATRIX, vector );
};


CCRenderer.GLScale = function(vector)
{
    mat4.scale( MODEL_MATRIX, MODEL_MATRIX, vector );
};


CCRenderer.GLRotate = function(angle, vector)
{
    CC.MatrixRotateDegrees( MODEL_MATRIX, angle, vector[0], vector[1], vector[2] );
};


CCRenderer.ModelMatrixMultiply = function(object)
{
    CCRenderer.GLMultMatrix( object.modelMatrix );
};


CCRenderer.ModelMatrixIdentity = function(object)
{
    mat4.identity( object.modelMatrix );
};


CCRenderer.ModelMatrixTranslate = function(object, vector)
{
    var modelMatrix = object.modelMatrix;
    mat4.translate( modelMatrix, modelMatrix, vector );
};


CCRenderer.ModelMatrixScale = function(object, vector)
{
    var modelMatrix = object.modelMatrix;
    mat4.scale( modelMatrix, modelMatrix, vector );
};


CCRenderer.ModelMatrixRotate = function(object, angle, axis)
{
    var modelMatrix = object.modelMatrix;
    mat4.rotate( modelMatrix, modelMatrix, angle * CC_PI / 180.0, axis );
};
