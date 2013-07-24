/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCTile3D.js
 * Description : A dynamic button widget.
 *
 * Created     : 21/10/11
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

function CCTile3D()
{
	this.construct();
}
ExtendPrototype( CCTile3D, CCCollideable );


CCTile3D.prototype.construct = function()
{
	this.CCCollideable_construct();

    this.touching = false;
	this.touchReleased = false;

    this.onPress = [];          // When a touch is first pressed
    this.onRelease = [];        // When a touch is released and the button has finished animating
    this.onMove = [];
    this.onLoss = [];           // When a touch is first released or lost
};


CCTile3D.prototype.destruct = function()
{
	this.CCCollideable_destruct();
};


CCTile3D.prototype.setPositionXYZ = function(x, y, z)
{
    this.CCCollideable_setPositionXYZ( x, y, z );
    if( this.movementInterpolator )
    {
        this.movementInterpolator.clear();
    }
};


CCTile3D.prototype.onTouchPress = function(touch)
{
    if( this.onPress )
    {
        var onPress = this.onPress;
        var length = onPress.length;
        for( var i=0; i<length; ++i )
        {
            onPress[i]( this, touch );
        }
    }
};


CCTile3D.prototype.onTouchMove = function(touchPosition)
{
    if( this.onMove )
    {
        var onMove = this.onMove;
        var length = onMove.length;
        for( var i=0; i<length; ++i )
        {
            onMove[i]( this, touchPosition );
        }
    }
};


CCTile3D.prototype.onTouchRelease = function()
{
    if( this.onRelease )
    {
        var onRelease = this.onRelease;
        var length = onRelease.length;
        for( var i=0; i<length; ++i )
        {
            onRelease[i]( this );
        }
    }
};


CCTile3D.prototype.onTouchLoss = function(touchLost)
{
    if( this.onLoss )
    {
        var onLoss = this.onLoss;
        var length = onLoss.length;
        for( var i=0; i<length; ++i )
        {
            onLoss[i]( this, touchLost );
        }
    }
};


CCTile3D.prototype.positionTileBelow = function(fromTile)
{
    this.setPosition( fromTile.position );
    this.translate( 0.0, -( fromTile.collisionBounds[1] + this.collisionBounds[1] ), 0.0 );
};


CCTile3D.prototype.positionTileBelowY = function(fromTile)
{
    this.setPositionY( fromTile.position[1] );
    this.translate( 0.0, -( fromTile.collisionBounds[1] + this.collisionBounds[1] ), 0.0 );
};


CCTile3D.prototype.positionTileAbove = function(fromTile)
{
    this.setPosition( fromTile.position );
    this.translate( 0.0, fromTile.collisionBounds[1] + this.collisionBounds[1], 0.0 );
};


CCTile3D.prototype.positionTileRight = function(fromTile)
{
    this.setPosition( fromTile.position );
    this.translate( fromTile.collisionBounds[0] + this.collisionBounds[0], 0.0, 0.0 );
};


CCTile3D.prototype.positionTileLeft = function(fromTile)
{
    this.setPosition( fromTile.position );
    this.translate( -( fromTile.collisionBounds[0] + this.collisionBounds[0] ), 0.0, 0.0 );
};


CCTile3D.prototype.positionTileLeftX = function(fromTile)
{
    this.setPositionX( fromTile.position[0] );
    this.translate( -( fromTile.collisionBounds[0] + this.collisionBounds[0] ), 0.0, 0.0 );
};


CCTile3D.prototype.setTileMovement = function(target)
{
    this.movementInterpolator.setMovement( target );
};


CCTile3D.prototype.setTileMovementX = function(x)
{
    this.movementInterpolator.setMovementX( x );
};


CCTile3D.prototype.setTileMovementY = function(y)
{
    this.movementInterpolator.setMovementY( y );
};


CCTile3D.prototype.setTileMovementXY = function(x, y)
{
    this.movementInterpolator.setMovementXY( x, y );
};


CCTile3D.prototype.setTileMovementYZ = function(y, z)
{
    this.movementInterpolator.setMovementYZ( y, z );
};


CCTile3D.prototype.translateTileMovementX = function(x)
{
    this.movementInterpolator.translateMovementX( x );
};


CCTile3D.prototype.translateTileMovementY = function(y)
{
    this.movementInterpolator.translateMovementY( y );
};


CCTile3D.prototype.getTileMovementTarget = function()
{
    return this.movementInterpolator.getMovementTarget();
};
