/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : TileProfileBase.js
 * Description : Base tile type for photos and profiles.
 *
 * Created     : 18/10/11
 *-----------------------------------------------------------
 */

function TileProfileBase(scene)
{
    this.construct( scene );
}
ExtendPrototype( TileProfileBase, CCTile3DButton );



TileProfileBase.prototype.construct = function(scene)
{
    this.CCTile3DButton_construct( scene );
};


TileProfileBase.prototype.setupTile = function(width, height, text)
{
    // Set a default profile photo
    if( !this.backgroundSquare )
    {
        this.setDrawOrder( 200 );

        this.photoWidth = 0.9;
        this.backgroundSquare = new CCPrimitiveSquare();
        this.backgroundSquare.setTexture( "resources/common/uimenu/ui_border.png" );

        var model = this.model;
        model.addPrimitive( this.backgroundSquare );
        this.setColour( gColour.set( 1.0 ) );

        var tileRotationInterpolator = this.tileRotationInterpolator = new CCInterpolatorListV3( CCInterpolatorX2Curve );
        tileRotationInterpolator.setDuration( 0.5 );
    }

    return this.CCTile3DButton_setupTile( width, height, text );
};


TileProfileBase.prototype.setTileSize = function(width, height)
{
    if( !height )
    {
        height = width;
    }

    if( this.tileSquares.length === 0 )
    {
        this.tileSquares.push( new CCPrimitiveSquare() );
        var tileSquare = this.tileSquares[0];
        this.tileModel.addPrimitive( tileSquare );
    }

    var hWidth = width * 0.5;
    var hHeight = height * 0.5;
    this.setHCollisionBounds( hWidth, hHeight, CC_SMALLFLOAT );
    this.backgroundSquare.setScale( width, height, 1.0 );
	this.tileSquares[0].setScale( width * this.photoWidth, height * this.photoWidth, 1.0 );

    CC.UpdateCollisions( this );
};


TileProfileBase.prototype.rotationFadeOut = function()
{
	this.setCollideable( false );

    if( this.tileRotationInterpolator )
	{
        var self = this;
        this.setColourAlpha( 0.0, true );
        this.tileRotationInterpolator.pushV3( this.rotation, vec3.clone( [ 0.0, CC.RandomDualInt() * 90.0, 0.0 ] ), true, function()
        {
            self.shouldRender = false;
        });
	}
};


TileProfileBase.prototype.rotationFadeIn = function()
{
    this.setCollideable( true );

    if( this.tileRotationInterpolator )
    {
        this.setColourAlpha( 1.0, true );
        this.tileRotationInterpolator.pushV3( this.rotation, vec3.create(), true );
        this.shouldRender = true;
    }
};
