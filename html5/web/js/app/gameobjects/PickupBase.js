/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : PickupBase.js
 * Description : An object that gets picked up
 *
 * Created     : 19/10/12
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

function PickupBase(name, type, pickupID)
{
    this.construct( name, type, pickupID );
}
ExtendPrototype( PickupBase, CCCollideable );


PickupBase.prototype.construct = function(name, type, pickupID)
{
    this.CCCollideable_construct( pickupID );

    this.collideableType = CC.AddFlag( this.collideableType, CC.collision_static );

    this.name = name;
    this.type = type;
    this.model3d = null;

    this.setColour( gColour.white() );
};


// ObjectBase
PickupBase.prototype.update = function(delta)
{
    if( this.model )
    {
        this.model.rotateY( delta * -90.0 );
    }
    return false;
};


PickupBase.prototype.renderModel = function(alpha)
{
    this.CCCollideable_renderModel( alpha );
};


// CollideableBase
PickupBase.prototype.shouldCollide = function(collideWith, initialCall)
{
    return this.CCCollideable_shouldCollide( collideWith, initialCall );
};


// Ask the collidedWith object if we've collided
PickupBase.prototype.recieveCollisionFrom = function(collisionSource, x, y, z)
{
    return this.CCCollideable_recieveCollisionFrom( collisionSource, x, y, z );
};


PickupBase.prototype.setup = function(modelFile, textureFile)
{
    var self = this;
    CCModel3D.CacheModel( modelFile, true, function(model3d)
    {
        if( model3d )
        {
            var model = self.setModel( new CCModelBase() );
            self.model3d = model3d;

            model3d.setTexture( textureFile );
            model.addModel( model3d );

            var modelWidth = Math.max( model3d.getWidth(), model3d.getDepth() );
            var modelHeight = model3d.getHeight();
            {
                // Adjust model size
                var modelSize = modelHeight > modelWidth ? modelHeight : modelWidth;
                var scaleFactor = 10.0 / modelSize;
                model.setScale( scaleFactor );

                modelWidth *= scaleFactor;
                modelHeight *= scaleFactor;
            }
            self.setSquareCollisionBounds( modelWidth, modelHeight );

            self.setPositionY( self.collisionBounds[1] );
            self.setRotationY( 180.0 );
        }
    });
};


PickupBase.prototype.getName = function()
{
    return this.name;
};


PickupBase.prototype.getType = function()
{
    return this.type;
};
