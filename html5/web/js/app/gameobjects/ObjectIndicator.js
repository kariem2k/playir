/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : ObjectIndicator.js
 * Description : An indicator object
 *
 * Created     : 15/10/12
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

function ObjectIndicator(parentObject, textureFile)
{
    this.construct( parentObject, textureFile );
}
ExtendPrototype( ObjectIndicator, CCObject );


ObjectIndicator.prototype.construct = function(parentObject, textureFile)
{
    this.CCObject_construct();

    var model = this.setModel( new CCModelBase() );

    var primitive = this.primitive = new CCPrimitiveSquare();
    primitive.setupUpFacing( 1.0, 1.0, 0.0, true, 1.0 );

    model.addPrimitive( primitive );
    parentObject.addChild( this );

    this.setTransparent();
    this.setWriteDepth( false );
    this.setColourAlpha( 0.5 );

    if( textureFile )
    {
        primitive.setTexture( textureFile, true, false, false );
    }

    this.setWidth( parentObject.collisionSize.width );
};


ObjectIndicator.prototype.destruct = function()
{
    this.CCObject_destruct();
};


ObjectIndicator.prototype.renderModel = function(alpha)
{
    if( this.colour.a > 0.0 )
    {
        this.CCObject_renderModel( alpha );
    }
};


ObjectIndicator.prototype.setWidth = function(width)
{
    this.model.setScale( width );
};



function CollideableIndicator(parent, textureFile)
{
    if( parent.inScene )
    {
        this.construct( parent.inScene, textureFile );
        parent.ownObject( this );
        this.setWidth( parent.collisionSize.width );
    }
    else
    {
        this.construct( parent, textureFile );
    }
}
ExtendPrototype( CollideableIndicator, CCCollideable );


CollideableIndicator.prototype.construct = function(parentScene, textureFile)
{
    this.CCCollideable_construct();

    var model = this.setModel( new CCModelBase() );

    var primitive = this.primitive = new CCPrimitiveSquare();
    primitive.setupUpFacing( 1.0, 1.0, 0.0, true, 1.0 );

    model.addPrimitive( primitive );
    this.setScene( parentScene );
    this.collideableType = CC.collision_none;

    this.setReadDepth( false );
    this.setWriteDepth( false );
    this.setDrawOrder( 98 );
    this.setColourAlpha( 0.5 );

    if( textureFile )
    {
        primitive.setTexture( textureFile, true, false, false );
    }
};


CollideableIndicator.prototype.destruct = function()
{
    this.CCCollideable_destruct();
};


CollideableIndicator.prototype.setPositionXYZ = function(x, y, z)
{
    this.CCCollideable_setPositionXYZ( x, 1.0, z );
    this.updateCollisions = true;
    CC.UpdateCollisions( this, false );
};


CollideableIndicator.prototype.translate = function(x, y, z)
{
    this.CCCollideable_translate( x, y, z );
    this.updateCollisions = true;
    CC.UpdateCollisions( this, false );
};


CollideableIndicator.prototype.renderModel = function(alpha)
{
    if( !alpha && this.colour.a > 0.0 )
    {
        gRenderer.CCSetBlend( true );
        this.CCCollideable_renderModel( alpha );
        gRenderer.CCSetBlend( false );
    }
};


CollideableIndicator.prototype.removeOwner = function(currentOwner)
{
    this.CCCollideable_removeOwner( currentOwner );

    // Parent object is being deactivated, should remove indicator from scene also
    this.deleteLater();
};


CollideableIndicator.prototype.setWidth = function(width)
{
    this.setSquareCollisionBounds( width );
    CC.UpdateCollisions( this, false );
    this.model.setScale( width );
};
