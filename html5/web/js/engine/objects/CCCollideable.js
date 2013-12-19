/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCCollideable.js
 * Description : A scene managed collideable object
 *
 * Created     : 09/10/12
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

function CCCollideable(objectID)
{
	this.construct( objectID );
}
ExtendPrototype( CCCollideable, CCObject );


CCCollideable.prototype.construct = function(objectID)
{
	this.CCObject_construct();

    this.drawOrder = 100;

    this.collisionsEnabled = true;
    this.octreeRender = true;

    // Axis Aligned Bounding Box
    this.aabbMin = vec3.create();
    this.aabbMax = vec3.create();

    this.collideableType = CC.collision_none;
    this.collisionBounds = vec3.create();
    this.collisionSize = new CCSize();
    this.inverseCollisionSize = new CCSize();
    this.setCollisionBounds( 1.0, 1.0, 1.0 );

    this.octrees = [];

    this.visible = false;

    this.owner = null;
    this.owns = [];

    if( objectID )
    {
        this.objectID = objectID;
    }
};


CCCollideable.prototype.nativeConstruct = function()
{
    CCEngine.NativeSyncCommands += 'CCCollideable.construct;' + this.jsID + '\n';
};


CCCollideable.prototype.nativeDestruct = function()
{
	CCEngine.NativeUpdateCommands += 'CCCollideable.destruct;' + this.jsID + '\n';
};


CCCollideable.prototype.setPositionXYZ = function(x, y, z)
{
    this.CCObject_setPositionXYZ( x, y, z );
    if( this.collideableType !== CC.collision_none )
    {
        this.updateCollisions = true;
        CCOctree.RefreshObject( this );
    }
};


CCCollideable.prototype.translate = function(x, y, z)
{
    this.CCObject_translate( x, y, z );
    if( this.collideableType !== CC.collision_none )
    {
        this.updateCollisions = true;
        CCOctree.RefreshObject( this );
    }
};


CCCollideable.prototype.setScene = function(scene)
{
    this.CCObject_setScene( scene );
    this.collideableType = CC.AddFlag( this.collideableType, CC.collision_box );
    scene.addCollideable( this );
};


CCCollideable.prototype.removeFromScene = function()
{
    this.inScene.removeCollideable( this );
    this.CCObject_removeFromScene();
};


CCCollideable.prototype.deactivate = function()
{
    this.CCObject_deactivate();
    this.collideableType = CC.collision_none;
    CCOctree.RemoveObject( this );

    if( this.owner )
    {
        this.owner.unOwnObject( this );
        this.owner = null;
    }

    for( var i=0; i<this.owns.length; ++i )
    {
        this.owns[i].removeOwner( this );
    }
    this.owns.length = 0;
};


CCCollideable.prototype.shouldCollide = function(collideWith, initialCall)
{
    // Ask myself if we should collide
    if( !this.CCObject_shouldCollide( collideWith, initialCall ) )
    {
        return false;
    }

    // Ask my owner if I should collide with this object
    if( this.owner && this.owner !== this.parent )
    {
        if( !this.owner.shouldCollide( collideWith, initialCall ) )
        {
            return false;
        }
    }

    // Ask the other object if we should collide
    if( initialCall )
    {
        return collideWith.shouldCollide( this, false );
    }

    // Yeah let's collide baby
    return true;
};


CCCollideable.prototype.setDrawOrder = function(drawOrder)
{
    this.drawOrder = drawOrder;

    if( CCEngine.NativeUpdateCommands !== undefined )
    {
        CCEngine.NativeUpdateCommands += 'CCCollideable.setDrawOrder;' + this.jsID + ';' + drawOrder + '\n';
    }
};


CCCollideable.prototype.renderModel = function(alpha)
{
    this.CCObject_renderModel( alpha );

    var renderer = gRenderer;
    if( alpha === this.transparent &&
        renderer.renderFlags & CCRenderer.render_collisionBoxes &&
        CC.HasFlag( this.collideableType, CC.collision_box ) )
    {
        if( !this.transparent )
        {
            renderer.CCSetBlend( true );
        }

        this.renderCollisionBox();

        if( !this.transparent )
        {
            renderer.CCSetBlend( false );
        }
    }
};


CCCollideable.prototype.renderCollisionBox = function()
{
    var renderer = gRenderer;

    CCRenderer.GLPushMatrix();
    {
        var scale = this.scale;
        var collisionBounds = this.collisionBounds;
        CCRenderer.GLScale( [ 1.0 / scale[0], 1.0 / scale[1], 1.0 / scale[2] ] );
        CCRenderer.GLScale( [ collisionBounds[0] * 2.0, collisionBounds[1] * 2.0, collisionBounds[2] * 2.0 ] );

        gEngine.textureManager.setTextureIndex( 1 );
        var red = gColour.setRGBA( 1.0, 0.0, 0.0, 0.5 );
        //renderer.CCSetColour( red );

        //renderer.CCRenderCube( true );

        CCRenderer.GLRotate( -this.rotation[1], [ 0.0, 1.0, 0.0 ] );
        renderer.CCSetColour( red );
        renderer.CCRenderCube( true );
    }
    CCRenderer.GLPopMatrix();
};


CCCollideable.prototype.getType = function()
{
    return null;
};


CCCollideable.prototype.getID = function()
{
    return this.objectID;
};


CCCollideable.prototype.setSquareCollisionBounds = function(width, height)
{
    if( !height )
    {
        height = width;
    }

    this.setCollisionBounds( width, height, width );
};


CCCollideable.prototype.setCollisionBounds = function(width, height, depth)
{
    this.setHCollisionBounds( width * 0.5, height * 0.5, depth * 0.5 );
};


CCCollideable.prototype.setHCollisionBounds = function(hWidth, hHeight, hDepth)
{
    vec3.copy( this.collisionBounds, [hWidth, hHeight, hDepth] );

    var collisionSize = this.collisionSize;
    collisionSize.width = hWidth > hDepth ? hWidth : hDepth;
    collisionSize.width *= 2.0;
    collisionSize.height = hHeight * 2.0;

    this.inverseCollisionSize.width = 1.0 / ( hWidth > hDepth ? hWidth : hDepth );
    this.inverseCollisionSize.width = 1.0 / this.collisionBounds[1];

    this.updateCollisions = true;
};


// Ask to report a collision to the collidedWith object
CCCollideable.prototype.requestCollisionWith = function(collidedWith)
{
    return collidedWith.recieveCollisionFrom( this, 0.0, 0.0, 0.0 );
};


// Ask the collidedWith object if we've collided
CCCollideable.prototype.recieveCollisionFrom = function(collisionSource, x, y, z)
{
    return this;
};


// An attack is being made on this object
CCCollideable.prototype.reportAttack = function(attackedBy, attackType, force, damage, x, y, z)
{
    return false;
};


CCCollideable.prototype.isCollideable = function()
{
    return this.collisionsEnabled;
};


CCCollideable.prototype.setCollideable = function(toggle)
{
    this.collisionsEnabled = toggle;
};


CCCollideable.prototype.isMoveable = function()
{
    return false;
};


CCCollideable.prototype.ownObject = function(object)
{
    this.owns.add( object );
    object.setOwner( this );
};


CCCollideable.prototype.unOwnObject = function(object)
{
    var owns = this.owns;
    if( owns.remove( object ) )
    {
    }
};


CCCollideable.prototype.setOwner = function(newOwner)
{
    this.owner = newOwner;
};


// Called when parent object is removed from scene or deactivated
CCCollideable.prototype.removeOwner = function(currentOwner)
{
    if( currentOwner === this.owner )
    {
        this.owner = null;
    }
};


CCCollideable.prototype.createMovementInterpolator = function(updateCollisions)
{
    if( !this.movementInterpolator )
    {
        this.movementInterpolator = new CCMovementInterpolator( this, updateCollisions );
    }
};


CCCollideable.prototype.getMovementInterpolator = function()
{
    return this.movementInterpolator;
};
