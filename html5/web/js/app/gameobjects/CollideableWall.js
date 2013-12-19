/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CollideableWall.js
 * Description : A wall object
 *
 * Created     : 09/10/12
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

function CollideableWall(scene)
{
    this.construct( scene );
    this.collideableType = CC.AddFlag( this.collideableType, CC.collision_static );
}
ExtendPrototype( CollideableWall, CCCollideable );


CollideableWall.prototype.setPositionXYZ = function(x, y, z)
{
    this.CCCollideable_setPositionXYZ( x, y, z );
    this.translate( this.offsetX, 0.0, this.offsetZ );
};


// ObjectBase
CollideableWall.prototype.update = function(delta)
{
    return false;
};


CollideableWall.prototype.renderObject = function(camera, alpha)
{
    this.CCCollideable_renderObject( camera, alpha );
};


CollideableWall.prototype.shouldCollide = function(collideWith, initialCall)
{
    return this.CCCollideable_shouldCollide( collideWith, initialCall );
};


// CollideableWall.prototype.recieveCollisionFrom = function(collisionSource, x, y, z)
// {
//     // HACK: For now floor always stabilises objects
//     if( collisionSource.getPosition().y !== collisionSource.collisionBounds.y )
//     {
//         collisionSource.setPositionY( collisionSource.collisionBounds.y );
//     }
//     return NULL;
// //  cvar collidedWithY = collisionSource.positionPtr.y - collisionSource.collisionBounds.y;
// //  if( collidedWithY > -CC_SMALLFLOAT )
// //  {
// //      collisionSource.translate( 0.0f, -collidedWithY, 0.0f );
// //      return NULL;
// //  }
// //
// //  return super::recieveCollisionFrom( collisionSource, x, y, z );
// }


CollideableWall.prototype.setup = function(scene, x, z, size, height)
{
    this.shouldRender = false;

    this.offsetX = x;
    this.offsetZ = z;

    var collisionSize = CC_SMALLFLOAT;
    if( x !== 0.0 )
    {
        this.setCollisionBounds( collisionSize, height, size );
    }
    else
    {
        this.setCollisionBounds( size, height, collisionSize );
    }

    this.translate( x, this.collisionBounds[1], z );

    if( scene )
    {
        this.setScene( scene );
    }
};
