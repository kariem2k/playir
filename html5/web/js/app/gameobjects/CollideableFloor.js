/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CollideableFloor.js
 * Description : A floor object.
 *
 * Created     : 09/10/12
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

function CollideableFloor(scene, objectID)
{
    this.construct( scene, objectID );
}
ExtendPrototype( CollideableFloor, CCCollideable );


CollideableFloor.prototype.construct = function(scene, objectID)
{
    this.CCCollideable_construct( objectID );

    this.primitive = new CCPrimitiveSquare();

    this.setModel( new CCModelBase() );
    this.model.addPrimitive( this.primitive );

    this.setColour( new CCColour() );

    if( scene )
    {
        this.setScene( scene );
    }
};


// ObjectBase
CollideableFloor.prototype.update = function(delta)
{
    return false;
};


CollideableFloor.prototype.renderObject = function(camera, alpha)
{
    this.CCCollideable_renderObject( camera, alpha );
};


CollideableFloor.prototype.renderModel = function(alpha)
{
    this.CCCollideable_renderModel( alpha );
};


CollideableFloor.prototype.shouldCollide = function(collideWith, initialCall)
{
    return this.CCCollideable_shouldCollide( collideWith, initialCall );
};


CollideableFloor.prototype.recieveCollisionFrom = function(collisionSource, x, y, z)
{
    // HACK: For now floor always stabilises objects
    if( collisionSource.position[1] !== collisionSource.collisionBounds[1] )
    {
        collisionSource.setPositionY( collisionSource.collisionBounds[1] );
    }
    return null;
//  cvar collidedWithY = collisionSource.positionPtr.y - collisionSource.collisionBounds.y;
//  if( collidedWithY > -CC_SMALLFLOAT )
//  {
//      collisionSource.translate( 0.0, -collidedWithY, 0.0 );
//      return NULL;
//  }
//
//  return super::recieveCollisionFrom( collisionSource, x, y, z );
};


CollideableFloor.prototype.setup = function(width, length, y)
{
    if( !y )
    {
        y = 0.0;
    }

    this.setCollisionBounds( width, CC_SMALLFLOAT, length );
    var collisionBounds = this.collisionBounds;
    this.setPositionY( y-collisionBounds[1] );

    this.primitive.setupUpFacing( width, length,-CC_SMALLFLOAT, true, 1.0 );

    CC.UpdateCollisions( this, false );
};
