/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCObjectText.js
 * Description : Represents a 3d text primitive.
 *
 * Created     : 23/10/11
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

function CCObjectText(inParent)
{
    this.jsID = CCObjectText.NextID++;

	this.construct();

	this.height = 1.0;
	this.setColour( gColour.set( 0.0 ) );
	this.setTransparent( true );
	this.setReadDepth( false );

	this.shader = "alphacolour";
	this.centered = true;

	if( inParent )
	{
		inParent.addChild( this );
	}
}
ExtendPrototype( CCObjectText, CCObject );
CCObjectText.NextID = 0;


CCObjectText.prototype.renderObject = function(camera, alpha)
{
	if( this.shouldRender && alpha )
	{
		var renderer = gRenderer;

		CCRenderer.GLPushMatrix();
		{
			if( this.updateModelMatrix )
			{
				this.refreshModelMatrix();
			}
			CCRenderer.GLMultMatrix( this.modelMatrix );

			if( this.colour )
			{
				renderer.CCSetColour( this.colour );
			}

			if( !alpha || renderer.colour.a > 0 )
			{
				var text = this.text;
				var height = this.height;
				var fontPage = this.fontPage;
				fontPage.renderText( text, text.length, height, this.centered );

				if( this.endMarker )
				{
					gEngine.textureManager.setTextureIndex( 1 );
					var x = ( fontPage.getWidth( text, text.length, height ) + fontPage.getCharacterWidth( ' ', height ) ) * 0.5;
					var y = height * 0.45;
					var start = vec3.clone( [ x, -y, 0.0 ] );
					var end = vec3.clone( [ x, y, 0.0 ] );
					renderer.CCRenderLine( start, end );
				}
			}
		}
		CCRenderer.GLPopMatrix();
	}
};


CCObjectText.prototype.getText = function()
{
	return this.text;
};


CCObjectText.prototype.setText = function(text, height, font)
{
	if( !text )
	{
		text = "";
	}

	this.text = text;
	gRenderer.pendingRender = true;

	if( height )
	{
		this.setHeight( height );
	}

	if( font )
	{
		this.setFont( font );
	}
	else
	{
		this.setFont( "HelveticaNeueLight" );
	}
};


CCObjectText.prototype.getWidth = function()
{
	var text = this.text;
	return this.fontPage.getWidth( text, text.length, this.height );
};


CCObjectText.prototype.getHeight = function()
{
	var text = this.text;
	return this.fontPage.getHeight( text, text.length, this.height );
};


CCObjectText.prototype.setHeight = function(height)
{
	if( CCEngine.NativeUpdateCommands !== undefined )
	{
		CCEngine.NativeUpdateCommands += 'CCObjectText.setHeight;' + this.jsID + ';' + height + '\n';
	}

	this.height = height;
};


CCObjectText.prototype.setCentered = function(centered)
{
	if( CCEngine.NativeUpdateCommands !== undefined )
	{
		CCEngine.NativeUpdateCommands += 'CCObjectText.setCentered;' + this.jsID + ';' + centered + '\n';
	}

	if( centered )
	{
		this.setPositionX( 0.0 );
	}
	else if( this.parent )
	{
		this.setPositionX( -this.parent.collisionBounds[0] );
	}

	this.centered = centered;
};


CCObjectText.prototype.setFont = function(font)
{
	if( CCEngine.NativeUpdateCommands !== undefined )
	{
		CCEngine.NativeUpdateCommands += 'CCObjectText.setFont;' + this.jsID + ';' + font + '\n';
	}

	var fontPages = gEngine.textureManager.fontPages;
	var length = fontPages.length;
	for( var i=0; i<length; ++i )
	{
		var page = fontPages[i];
		if( font === page.name )
		{
			this.fontPage = page;
			return;
		}
	}
};


CCObjectText.prototype.setEndMarker = function(toggle)
{
	if( CCEngine.NativeUpdateCommands !== undefined )
	{
		CCEngine.NativeUpdateCommands += 'CCObjectText.setEndMarker;' + this.jsID + ';' + toggle + '\n';
	}

	this.endMarker = toggle;
};


CCObjectText.prototype.getEndMarker = function()
{
	return !!this.endMarker;
};
