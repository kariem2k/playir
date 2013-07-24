/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCRenderer.js
 * Description : Base renderer
 *
 * Created     : 24/07/11
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

window.gRenderer = null;
function CCRenderer()
{
}

CCRenderer.render_all              = 0x000000001;
CCRenderer.render_collisionBoxes   = 0x000000002;
CCRenderer.render_collisionTrees   = 0x000000004;
CCRenderer.render_pathFinder       = 0x000000008;
CCRenderer.render_noPyramids       = 0x000000010;
CCRenderer.render_fontPage         = 0x000000012;

// Enums
CCRenderer.render_background = 0;
CCRenderer.render_main = 1;
CCRenderer.render_post = 2;
CCRenderer.render_finished = 3;


CCRenderer.NewArrayType = function(array, ArrayType)
{
    var newArray = new ArrayType( array.length );
    for( var i=0; i<array.length; ++i )
    {
        newArray[i] = array[i];
    }
    return newArray;
};


CCRenderer.prototype.CCDefaultSquareVertexPointer = function()
{
    this.CCBindVertexPositionBuffer( this.defaultSquareVertexBuffer );
};


CCRenderer.prototype.CCRenderLine = function(start, end)
{
    this.CCSetRenderStates();
    this.CCDefaultTexCoords();

    if( !this.linePositionBuffer )
    {
        this.linePositionBuffer = this.CCCreateVertexBuffer();
    }

    var vertices =
    [
        start[0], start[1], start[2],
        end[0], end[1], end[2]
    ];
    this.CCUpdateVertexBuffer( this.linePositionBuffer, CCRenderer.NewArrayType( vertices, CCRenderer.Float32Array ) );
    this.CCBindVertexPositionBuffer( this.linePositionBuffer );

    this.GLDrawArrays( "LINES", 0, 2 );
};


CCRenderer.prototype.CCRenderCube = function(outline)
{
    this.CCSetRenderStates();

    if( !this.cubeTextureBuffer )
    {
        var textureCoords = [1.0, 1.0,
                             0.0, 1.0,
                             1.0, 0.0,
                             0.0, 0.0,

                             1.0, 1.0,
                             0.0, 1.0,
                             1.0, 0.0,
                             0.0, 0.0];
        this.cubeTextureBuffer = this.CCCreateVertexBuffer( CCRenderer.NewArrayType( textureCoords, CCRenderer.Float32Array ), 2 );
    }
    this.CCBindVertexTextureBuffer( this.cubeTextureBuffer );

    if( !this.cubePositionBuffer )
    {
        var vertices =
        [
            // Front
            -0.5, -0.5, -0.5,   // Bottom left  0
            0.5, -0.5, -0.5,    // Bottom right 1
            -0.5, 0.5, -0.5,    // Top left     2
            0.5, 0.5, -0.5,     // Top right    3

            // Back
            -0.5, -0.5, 0.5,    // Bottom left  4
            0.5, -0.5, 0.5,     // Bottom right 5
            -0.5, 0.5, 0.5,     // Top left     6
            0.5, 0.5, 0.5       // Top right    7
        ];
        this.cubePositionBuffer = this.CCCreateVertexBuffer( CCRenderer.NewArrayType( vertices, CCRenderer.Float32Array ) );
    }
    this.CCBindVertexPositionBuffer( this.cubePositionBuffer );

    var faces;
    if( outline )
    {
        faces = [0, 1, 3, 2, 0, 4, 5, 1, 5, 7, 3, 7, 6, 2, 6, 4];
        if( !this.cubeOutlineIndexBuffer )
        {
            this.cubeOutlineIndexBuffer = this.CCCreateVertexIndexBuffer( CCRenderer.NewArrayType( faces, CCRenderer.Uint16Array ) );
        }
        this.CCBindVertexIndexBuffer( this.cubeOutlineIndexBuffer );
        this.GLDrawElements( "LINE_STRIP", faces.length, 0 );
    }
    else
    {
        faces = [0, 1, 2, 3, 7, 1, 5, 4, 7, 6, 2, 4, 0, 1];
        if( !this.cubeIndexBuffer )
        {
            this.cubeIndexBuffer = this.CCCreateVertexIndexBuffer( CCRenderer.NewArrayType( faces, CCRenderer.Uint16Array ) );
        }
        this.CCBindVertexIndexBuffer( this.cubeIndexBuffer );
        this.GLDrawElements( "TRIANGLE_STRIP", faces.length, 0 );
    }
};
