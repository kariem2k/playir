/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCPrimitiveSquare.js
 * Description : Square drawable component.
 *
 * Created     : 20/10/11
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

function CCPrimitiveSquare()
{
	this.construct();
    this.scale = vec3.clone( [ 1, 1, 1 ] );

	if( CCEngine.NativeUpdateCommands !== undefined )
    {
		CCEngine.NativeUpdateCommands += 'CCPrimitiveSquare.construct;' + this.primitiveID + '\n';
	}
}
ExtendPrototype( CCPrimitiveSquare, CCPrimitiveBase );


CCPrimitiveSquare.prototype.destruct = function()
{
	if( this.vertexPositionBuffer )
    {
        gRenderer.CCDeleteVertexBuffer( this.vertexPositionBuffer );
    }

    if( CCEngine.NativeUpdateCommands !== undefined )
    {
		CCEngine.NativeUpdateCommands += 'CCPrimitiveSquare.destruct;' + this.primitiveID + '\n';
	}

	this.CCPrimitiveBase_destruct();
};


CCPrimitiveSquare.prototype.setScale = function(width, height, depth)
{
	if( !height )
	{
		height = width;
	}

	if( !depth )
	{
		depth = 1.0;
	}

	if( CCEngine.NativeUpdateCommands !== undefined )
    {
		CCEngine.NativeUpdateCommands += 'CCPrimitiveSquare.setScale;' + this.primitiveID + ';' + width + ';' + height + ';' + depth + '\n';
	}


	var scale = this.scale;
	scale[0] = width;
	scale[1] = height;
	scale[2] = depth;
    return this;
};


CCPrimitiveSquare.prototype.render = function()
{
    var renderer = gRenderer;

    if( this.textureIndex !== -1 )
    {
        gEngine.textureManager.setTextureIndex( this.textureIndex );
    }
    else
    {
        gEngine.textureManager.setTextureIndex( 0 );
    }

    if( this.adjustedUVs )
    {
        renderer.CCSetTexCoords( this.adjustedUVs );
    }
    else if( this.customUVs )
    {
        renderer.CCSetTexCoords( this.customUVs );
    }
    else
    {
        renderer.CCDefaultTexCoords();
    }

    this.renderVertices( renderer );
};


CCPrimitiveSquare.prototype.renderVertices = function(renderer)
{
	CCRenderer.GLPushMatrix();
	CCRenderer.GLScale( this.scale );

    if( this.vertexPositionBuffer )
    {
		renderer.CCBindVertexPositionBuffer( this.vertexPositionBuffer );
    }
    else
    {
		renderer.CCDefaultSquareVertexPointer();
    }

    renderer.CCSetRenderStates();
    renderer.GLDrawArrays( "TRIANGLE_STRIP", 0, 4 );

    CCRenderer.GLPopMatrix();
};


CCPrimitiveSquare.prototype.renderOutline = function()
{
	CCRenderer.GLPushMatrix();
	CCRenderer.GLScale( this.scale );

	gRenderer.CCSetRenderStates();

	// TODO: Need to set the vertexAttribPointer before drawing
    gRenderer.GLDrawElements( "LINE_STRIP", 4, 0 );

	CCRenderer.GLPopMatrix();
};


// Specifiy points
CCPrimitiveSquare.prototype.setupPoints = function(tL, tR, bL, bR, bY, tY, bZ, tZ)
{
    var vertices = new CCRenderer.Float32Array( 3 * 4 );

    var i = 0;

    vertices[i++] = tR;	// Top right
    vertices[i++] = tY;
    vertices[i++] = tZ;

    vertices[i++] = tL;	// Top left
    vertices[i++] = tY;
    vertices[i++] = tZ;

    vertices[i++] = bR;	// Bottom right
    vertices[i++] = bY;
    vertices[i++] = bZ;

    vertices[i++] = bL;	// Bottom left
    vertices[i++] = bY;
    vertices[i++] = bZ;
    this.vertexPositionBuffer = gRenderer.CCCreateVertexBuffer( vertices );

    if( CCEngine.NativeUpdateCommands !== undefined )
    {
		CCEngine.NativeUpdateCommands += 'CCPrimitiveSquare.setVertexBufferID;' + this.primitiveID + ';' + this.vertexPositionBuffer + '\n';
    }
};


// Specify z and y, to face pointing upwards
CCPrimitiveSquare.prototype.setupSideFacing = function(x, height, depth)
{
    var hHeight = height * 0.5;
    var hDepth = depth * 0.5;

    var vertices = new CCRenderer.Float32Array( 3 * 4 );

    var i = 0;

	vertices[i++] = x;
	vertices[i++] = hHeight;
	vertices[i++] = -hDepth;

	vertices[i++] = x;
	vertices[i++] = hHeight;
	vertices[i++] = hDepth;

	vertices[i++] = x;
	vertices[i++] = -hHeight;
	vertices[i++] = -hDepth;

	vertices[i++] = x;
	vertices[i++] = -hHeight;
	vertices[i++] = hDepth;

    this.vertexPositionBuffer = gRenderer.CCCreateVertexBuffer( vertices );

    if( CCEngine.NativeUpdateCommands !== undefined )
    {
		CCEngine.NativeUpdateCommands += 'CCPrimitiveSquare.setVertexBufferID;' + this.primitiveID + ';' + this.vertexPositionBuffer + '\n';
    }
};


// Specify x and z, to face pointing upwards
CCPrimitiveSquare.prototype.setupUpFacing = function(width, depth, yPosition, useNormals, direction)
{
    var hWidth = width * 0.5;
    var hDepth = depth * 0.5;

    var vertices = new CCRenderer.Float32Array( 3 * 4 );
    vertices[0] = hWidth;
    vertices[1] = yPosition;
    vertices[2] = -hDepth;

    vertices[3] = -hWidth;
    vertices[4] = yPosition;
    vertices[5] = -hDepth;

    vertices[6] = hWidth;
    vertices[7] = yPosition;
    vertices[8] = hDepth;

    vertices[9] = -hWidth;
    vertices[10] = yPosition;
    vertices[11] = hDepth;
    this.vertexPositionBuffer = gRenderer.CCCreateVertexBuffer( vertices );

    if( CCEngine.NativeUpdateCommands !== undefined )
    {
		CCEngine.NativeUpdateCommands += 'CCPrimitiveSquare.setVertexBufferID;' + this.primitiveID + ';' + this.vertexPositionBuffer + '\n';
    }

	if( useNormals )
	{
		// normals = (float*)malloc( sizeof( float ) * 4 * 3 );

		// normals[0] = 0.0f;
		// normals[1] = 1.0f * direction;
		// normals[2] = 0.0f;
		// normals[3] = 0.0f;
		// normals[4] = 1.0f * direction;
		// normals[5] = 0.0f;
		// normals[6] = 0.0f;
		// normals[7] = 1.0f * direction;
		// normals[8] = 0.0f;
		// normals[9] = 0.0f;
		// normals[10] = 1.0f * direction;
		// normals[11] = 0.0f;
	}
};


CCPrimitiveSquare.prototype.adjustTextureUVs = function()
{
	if( this.textureIndex >= 0 )
	{
		var textureHandle = gEngine.textureManager.getTextureHandleIndex( this.textureIndex );
		var textureImage = textureHandle.image;
		if( textureImage )
		{
			if( textureImage.allocatedWidth && textureImage.allocatedHeight )
			{
				var width = textureImage.width;
				var height = textureImage.height;
				var allocatedWidth = textureImage.allocatedWidth;
				var allocatedHeight = textureImage.allocatedHeight;

				if( width === allocatedWidth && height === allocatedHeight )
				{
					if( this.adjustedUVs )
					{
						delete this.adjustedUVs;
					}
				}
				else
				{
					if( this.customUVs )
					{
						var uvs = this.customUVs;
						var x2 = uvs[0];
						var y1 = uvs[1];
						var x1 = uvs[2];
						var y2 = uvs[5];

						var widthScale = width / allocatedWidth;
						var heightScale = height / allocatedHeight;
						this.setAdjustedUVs( x1 * widthScale, y1 * heightScale, x2 * widthScale, y2 * heightScale );
					}
					else
					{
						this.setAdjustedUVs( 0.0, 0.0, width / allocatedWidth, height / allocatedHeight );
					}
				}
			}
			else
			{
				if( this.adjustedUVs )
				{
					delete this.adjustedUVs;
				}
			}
		}
	}
};


CCPrimitiveSquare.prototype.setAdjustedUVs = function(x1, y1, x2, y2)
{
	if( !this.adjustedUVs )
	{
		this.adjustedUVs = new CCRenderer.Float32Array( 8 );
	}
	var uvs = this.adjustedUVs;
	uvs[0] = x2;	// Bottom right
	uvs[1] = y1;
	uvs[2] = x1;	// Bottom left
	uvs[3] = y1;
	uvs[4] = x2;	// Top right
	uvs[5] = y2;
	uvs[6] = x1;	// Top left
	uvs[7] = y2;
};


CCPrimitiveSquare.prototype.setTextureUVs = function(x1, y1, x2, y2)
{
	if( !this.customUVs )
	{
		this.customUVs = new CCRenderer.Float32Array( 8 );
	}
	var uvs = this.customUVs;
	uvs[0] = x2;	// Bottom right
	uvs[1] = y1;
	uvs[2] = x1;	// Bottom left
	uvs[3] = y1;
	uvs[4] = x2;	// Top right
	uvs[5] = y2;
	uvs[6] = x1;	// Top left
	uvs[7] = y2;

	this.adjustTextureUVs();
};


CCPrimitiveSquare.prototype.flipX = function()
{
	if( !this.customUVs )
	{
		this.setTextureUVs( 0.0, 0.0, 1.0, 1.0 );
	}

	var uvs = this.customUVs;
	var y1 = uvs[1];
    var y2 = uvs[5];
    uvs[1] = y2;
	uvs[3] = y2;
	uvs[5] = y1;
	uvs[7] = y1;

	this.adjustTextureUVs();
};


CCPrimitiveSquare.prototype.flipY = function()
{
	if( !this.customUVs )
	{
		this.setTextureUVs( 0.0, 0.0, 1.0, 1.0 );
	}

	var uvs = this.customUVs;
	var x1 = uvs[0];
    var x2 = uvs[2];
    uvs[0] = x2;
	uvs[4] = x2;
	uvs[2] = x1;
	uvs[6] = x1;

	this.adjustTextureUVs();
};
