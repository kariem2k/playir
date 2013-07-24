/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCModelBase.js
 * Description : Represents the attributes of a renderable object.
 *
 * Created     : 21/10/11
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

function CCModelBase()
{
	this.construct();
}
ExtendPrototype( CCModelBase, CCRenderable );


CCModelBase.prototype.construct = function()
{
	this.CCRenderable_construct();

    this.primitives = [];
    this.models = [];

    if( CCEngine.NativeUpdateCommands !== undefined )
    {
		CCEngine.NativeUpdateCommands += 'CCModelBase.construct;' + this.jsID + '\n';
	}
};


CCModelBase.prototype.destruct = function()
{
	var i;
	{
		var models = this.models;
		for( i=0; i<models.length; ++i )
		{
			models[i].destruct();
		}
		models.length = 0;
    }

    {
		var primitives = this.primitives;
		for( i=0; i<primitives.length; ++i )
		{
			primitives[i].destruct();
		}
		primitives.length = 0;
    }

    this.CCRenderable_destruct();

    if( CCEngine.NativeUpdateCommands !== undefined )
    {
		CCEngine.NativeUpdateCommands += 'CCModelBase.destruct;' + this.jsID + '\n';
	}
};


CCModelBase.prototype.render = function(alpha)
{
	if( this.shouldRender )
	{
		var renderer = gRenderer;

		if( CCEngine.NativeRenderCommands !== undefined )
		{
			renderer.unbindBuffers();
			CCEngine.NativeRenderCommands += 'CCModelBase.render;' + this.jsID + ';' + alpha + '\n';
			return;
		}

		CCRenderer.GLPushMatrix();
		{
			if( this.updateModelMatrix )
			{
				this.refreshModelMatrix();
			}
			CCRenderer.GLMultMatrix( this.modelMatrix );

			var primitives = this.primitives;
			var primitivesLength = primitives.length;

			if( this.colour )
			{
				renderer.CCSetColour( this.colour );
			}

			if( !alpha || renderer.colour.a > 0 )
			{
				for( var primitiveIndex=0; primitiveIndex<primitivesLength; ++primitiveIndex )
				{
					primitives[primitiveIndex].render();
				}
			}

			var models = this.models;
			var length = models.length;
			for( var modelIndex=0; modelIndex<length; ++modelIndex )
			{
				models[modelIndex].render( alpha );
				if( this.colour )
				{
					renderer.CCSetColour( this.colour );
				}
			}
		}
		CCRenderer.GLPopMatrix();
	}
};


CCModelBase.prototype.addModel = function(model)
{
	this.models.push( model );

	if( CCEngine.NativeUpdateCommands !== undefined )
	{
		CCEngine.NativeUpdateCommands += 'CCModelBase.addModel;' + this.jsID + ';' + model.jsID + '\n';
	}
};


CCModelBase.prototype.removeModel = function(model)
{
	this.models.remove( model );

	if( CCEngine.NativeUpdateCommands !== undefined )
	{
		CCEngine.NativeUpdateCommands += 'CCModelBase.removeModel;' + this.jsID + ';' + model.jsID + '\n';
	}
};


CCModelBase.prototype.addPrimitive = function(primitive)
{
	this.primitives.push( primitive );

	if( CCEngine.NativeUpdateCommands !== undefined )
	{
		CCEngine.NativeUpdateCommands += 'CCModelBase.addPrimitive;' + this.jsID + ';' + primitive.primitiveID + '\n';
	}
};
