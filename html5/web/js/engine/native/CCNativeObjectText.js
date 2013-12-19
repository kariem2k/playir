/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCNativeObjectText.js
 * Description : Represents a 3d text primitive.
 *
 * Created     : 22/03/13
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

CCObjectText.prototype.nativeConstruct = function()
{
	CCEngine.NativeUpdateCommands += 'CCObjectText.construct;' + this.jsID + '\n';
};



CCObjectText.prototype.nativeDestruct = function()
{
	CCEngine.NativeUpdateCommands += 'CCObjectText.destruct;' + this.jsID + '\n';
};


CCObjectText.prototype.renderObject = function(camera, alpha)
{
	if( alpha )
	{
		var renderer = gRenderer;

		if( this.colour )
		{
			renderer.CCSetColour( this.colour );
		}

		renderer.unbindBuffers();
		CCEngine.NativeRenderCommands += 'CCObjectText.renderObject;' + this.jsID + '\n';
	}
};


CCObjectText.prototype.setText = function(text, height, font)
{
	if( !text )
	{
		text = "";
	}

	if( CCEngine.NativeUpdateCommands !== undefined )
	{
        var encodedText = String.ReplaceChar( text, '\n', '\\n' );
		CCEngine.NativeUpdateCommands += 'CCObjectText.setText;' + this.jsID + ';' + encodedText + '\n';
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
