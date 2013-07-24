/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCCollideableStaticMesh.js
 * Description : Player class for our character
 *
 * Created     : 09/10/12
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

function CCCollideableStaticMesh(objectID)
{
    this.construct( objectID );
}
ExtendPrototype( CCCollideableStaticMesh, CCCollideable );


CCCollideableStaticMesh.prototype.construct = function(objectID)
{
    this.CCCollideable_construct( objectID );

    this.createMovementInterpolator( false );
    this.getMovementInterpolator().setDuration( 2.0 );

    this.setModel( new CCModelBase() );
    this.collideableType = CC.AddFlag( this.collideableType, CC.collision_static );

    this.model3d = null;

    this.setColour( gColour.set( 1.0, 0.0 ) );
    this.setColourAlpha( 0.5, true );
};


CCCollideableStaticMesh.prototype.destruct = function()
{
    this.CCCollideable_destruct();
};


// Ask to report a collision to the collidedWith object
CCCollideableStaticMesh.prototype.requestCollisionWith = function(collidedWith)
{
    return this.CCCollideable_requestCollisionWith( collidedWith );
};


// Ask the collidedWith object if we've collided
CCCollideableStaticMesh.prototype.recieveCollisionFrom = function(collisionSource, x, y, z)
{
    return this.CCCollideable_recieveCollisionFrom( collisionSource, x, y, z );
};


CCCollideableStaticMesh.prototype.update = function(delta)
{
    this.CCCollideable_update( delta );

    if( this.model3d )
    {
        this.model3d.animate( delta );
    }
};


CCCollideableStaticMesh.prototype.renderModel = function(alpha)
{
    if( this.model3d )
    {
        this.CCCollideable_renderModel( alpha );
    }
    else if( alpha )
    {
        if( !this.disableCulling )
        {
            gRenderer.CCSetCulling( false );
        }

        if( !this.readDepth )
        {
            gRenderer.CCSetDepthRead( true );
        }

        CCRenderer.GLPushMatrix();
        gRenderer.CCSetColour( this.colour );
        gEngine.textureManager.setTextureIndex( 1 );
        var size = this.collisionSize.width;
        CCRenderer.GLScale( [ size, size, size ] );
        gRenderer.CCRenderCube( false );
        CCRenderer.GLPopMatrix();

        if( !this.readDepth )
        {
            gRenderer.CCSetDepthRead( false );
        }

        if( !this.disableCulling )
        {
            gRenderer.CCSetCulling( true );
        }
    }
};


CCCollideableStaticMesh.prototype.setupModel = function(obj, tex, width, callback)
{
    this.setCollisionBounds( width, width, width );
    this.setPositionY( this.collisionBounds[1] );

    this.obj = obj;
    this.tex = tex;

    this.loadModel( obj, tex, callback );
};


CCCollideableStaticMesh.prototype.loadModel = function(obj, tex, callback)
{
    // Buffer texture first
    if( tex )
    {
        gEngine.textureManager.getTextureHandle( tex );
    }

    var self = this;
    CCModel3D.CacheModel( obj, true, function(model3d)
    {
        if( model3d )
        {
            self.model3d = model3d;

            self.setColourAlpha( 1.0, true );
            self.model.addModel( model3d );

            // Adjust model size
            self.resize( self.collisionSize.width );
            self.setPositionY( 0.0 );
            self.getMovementInterpolator().setMovementY( self.collisionBounds[1] );

            if( tex )
            {
                self.setTexture( model3d, tex );
            }

            if( callback )
            {
                callback( self );
            }
        }
    },
    1 );
};


CCCollideableStaticMesh.prototype.resize = function(size)
{
    this.setCollisionBounds( size, size, size );
    this.setPositionY( this.collisionBounds[1] );
    CC.UpdateCollisions( this );

    if( this.model3d )
    {
        var model3d = this.model3d;

        // Adjust model size
        var modelWidth = model3d.getWidth() > model3d.getDepth() ? model3d.getWidth() : model3d.getDepth();
        var modelHeight = model3d.getHeight();

        var scaleFactor = size / modelWidth;
        this.model.setScale( scaleFactor );

        model3d.setPositionY( ( -size * 0.5 ) / scaleFactor );
        model3d.translate( 0.0, modelHeight * 0.5, 0.0 );
    }
};


CCCollideableStaticMesh.prototype.setTexture = function(model3d, tex)
{
    if( tex )
    {
        model3d.setTexture( tex );
    }
};
