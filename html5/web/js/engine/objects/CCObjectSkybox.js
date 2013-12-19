/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCObjectSkybox.js
 * Description : A square textured box around the camera.
 *
 * Created     : 24/06/13
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

function CCObjectSkybox(scene)
{
	this.construct();

	this.interpolating = false;
    this.renderPass = CCRenderer.render_background;

    this.setScene( scene );
}
ExtendPrototype( CCObjectSkybox, CCObject );


CCObjectSkybox.prototype.setup = function(size, north, east, south, west, top, bottom)
{
	this.setModel( new CCModelBase() );
	this.setColour( gColour.white() );

	var hSize = size * 0.5;
	this.size = size;

	var squarePrimitive;

	if( north )
	{
		squarePrimitive = new CCPrimitiveSquare();
		squarePrimitive.setupPoints( -hSize, hSize, -hSize, hSize, -hSize, hSize, -hSize, -hSize );
		this.model.addPrimitive( squarePrimitive );
		squarePrimitive.setTexture( north, true, true );
	}

	if( east )
	{
		squarePrimitive = new CCPrimitiveSquare();
		squarePrimitive.setupSideFacing( hSize, size, size );
		this.model.addPrimitive( squarePrimitive );
		squarePrimitive.setTexture( east, true, true );

		squarePrimitive.flipY();
	}

	if( south )
	{
		squarePrimitive = new CCPrimitiveSquare();
		squarePrimitive.setupPoints( -hSize, hSize, -hSize, hSize, -hSize, hSize, hSize, hSize );
		this.model.addPrimitive( squarePrimitive );
		squarePrimitive.setTexture( south, true, true );
	}

	if( west )
	{
		squarePrimitive = new CCPrimitiveSquare();
		squarePrimitive.setupSideFacing( -hSize, size, size );
		this.model.addPrimitive( squarePrimitive );
		squarePrimitive.setTexture( west, true, true );

		squarePrimitive.flipY();
	}

	if( top )
	{
		squarePrimitive = new CCPrimitiveSquare();
		squarePrimitive.setupUpFacing( size, size, hSize, true, -1.0 );
		this.model.addPrimitive( squarePrimitive );
		squarePrimitive.setTexture( top, true, true );
	}

	if( bottom )
	{
		squarePrimitive = new CCPrimitiveSquare();
		squarePrimitive.setupUpFacing( size, size, -hSize, true, 1.0 );
		this.model.addPrimitive( squarePrimitive );
		squarePrimitive.setTexture( bottom, true, true );
	}
};


CCObjectSkybox.prototype.update = function(delta)
{
    var updated = false;
	if( this.scaleInterpolator )
	{
		var speed = delta * 0.5;
        if( this.scaleInterpolator.update( speed ) )
        {
            this.dirtyModelMatrix();
            updated = true;
        }

		if( !updated )
		{
			delete this.scaleInterpolator;
		}
	}

    return this.CCObject_update( delta ) || updated;
};


CCObjectSkybox.prototype.renderModel = function(alpha)
{
	if( alpha === this.transparent )
	{
		var renderer = gRenderer;
		renderer.CCSetCulling( false );
        renderer.CCSetDepthRead( false );
		this.CCObject_renderModel( alpha );
        renderer.CCSetDepthRead( true );
        renderer.CCSetCulling( true );
	}
};



CCObjectSkybox.prototype.animateToScale = function(startScale)
{
	this.interpolating = true;
	this.setScale( startScale );

	if( !this.scaleInterpolator )
	{
		this.scaleInterpolator = new CCInterpolatorV3( CCInterpolatorSin2Curve );
	}
	this.scaleInterpolator.setup( this.scale, 1.0 );
};
