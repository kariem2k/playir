/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCNativePrimitive3D.js
 * Description : Handles the native specific 3D primitives.
 *
 * Created     : 04/03/13
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

CCPrimitive3D.Objects = [];

CCPrimitive3D.Loaded = function(primitiveID, json)
{
	var Objects = CCPrimitive3D.Objects;
	for( var i=0; i<Objects.length; ++i )
	{
		var primitive = Objects[i];
		if( primitive.primitiveID === primitiveID )
		{
			primitive.loaded( json );
			break;
		}
	}
};


CCPrimitive3D.LoadedAnimation = function(primitiveID, name)
{
	var Objects = CCPrimitive3D.Objects;
	for( var i=0; i<Objects.length; ++i )
	{
		var primitive = Objects[i];
		if( primitive.primitiveID === primitiveID )
		{
			primitive.loadedAnimation( name );
			break;
		}
	}
};


CCPrimitive3D.LoadedAnimationFrame = function(primitiveID, array)
{
	var Objects = CCPrimitive3D.Objects;
	for( var i=0; i<Objects.length; ++i )
	{
		var primitive = Objects[i];
		if( primitive.primitiveID === primitiveID )
		{
			primitive.loadedAnimationFrame( array );
			break;
		}
	}
};


CCPrimitive3D.prototype.adjustTextureUVs = function()
{
    if( CCEngine.NativeUpdateCommands !== undefined )
    {
        if( this.textureIndex >= 0 )
        {
            CCEngine.NativeUpdateCommands += 'CCPrimitiveBase.adjustTextureUVs;' + this.primitiveID + ';' + this.textureIndex + '\n';
        }
    }
};


CCPrimitive3D.prototype.moveVerticesToOrigin = function(callback)
{
    if( !this.movedToOrigin )
    {
		this.getOrigin();

		CCEngine.NativeUpdateCommands += 'CCPrimitive3D.moveVerticesToOrigin;' + this.primitiveID + '\n';

		if( callback )
		{
			this.moveVerticesToOriginCallback = callback;
		}
    }
    else
    {
		if( callback )
		{
			callback();
		}
    }
};


CCPrimitive3D.MovedVerticesToOrigin = function(primitiveID, json)
{
	var Objects = CCPrimitive3D.Objects;
	for( var i=0; i<Objects.length; ++i )
	{
		var primitive = Objects[i];
		if( primitive.primitiveID === primitiveID )
		{
			primitive.movedVerticesToOrigin( json );
			break;
		}
	}
};


CCPrimitive3D.prototype.movedVerticesToOrigin = function(json)
{
	var callback = this.moveVerticesToOriginCallback;
	if( this.moveVerticesToOriginCallback )
	{
		delete this.moveVerticesToOriginCallback;
	}

	if( json )
	{
		this.mmX.min = json.mmXmin;
		this.mmX.max = json.mmXmax;
		this.mmY.min = json.mmYmin;
		this.mmY.max = json.mmYmax;
		this.mmZ.min = json.mmZmin;
		this.mmZ.max = json.mmZmax;
	}

    this.movedToOrigin = true;

	if( callback )
	{
		callback();
	}
};


CCPrimitive3D.prototype.getYMinMaxAtZ = function(atZ, callback)
{
	if( callback )
	{
		this.getYMinMaxAtZCallback = callback;

		CCEngine.NativeUpdateCommands += 'CCPrimitive3D.getYMinMaxAtZ;' + this.primitiveID + ';';
		if( this.sourcePrimitiveID !== undefined )
		{
			CCEngine.NativeUpdateCommands += this.sourcePrimitiveID;
		}
		else
		{
			CCEngine.NativeUpdateCommands += this.primitiveID;
		}
		CCEngine.NativeUpdateCommands += ';' + atZ + '\n';
	}
};


CCPrimitive3D.ReturnYMinMaxAtZ = function(primitiveID, json)
{
	var Objects = CCPrimitive3D.Objects;
	for( var i=0; i<Objects.length; ++i )
	{
		var primitive = Objects[i];
		if( primitive.primitiveID === primitiveID )
		{
			primitive.returnYMinMaxAtZ( json );
			break;
		}
	}
};


CCPrimitive3D.prototype.returnYMinMaxAtZ = function(json)
{
	if( this.getYMinMaxAtZCallback )
	{
		var callback = this.getYMinMaxAtZCallback;
		delete this.getYMinMaxAtZCallback;

		var mmYAtZ = new CCMinMax();
		mmYAtZ.min = json.min;
		mmYAtZ.max = json.max;

		callback( mmYAtZ );
	}
};
