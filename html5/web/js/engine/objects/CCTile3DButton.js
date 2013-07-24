/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCTile3DButton.js
 * Description : A dynamic button widget.
 *
 * Created     : 09/08/11
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

function CCTile3DButton(scene)
{
    this.construct( scene );
}
ExtendPrototype( CCTile3DButton, CCTile3D );


CCTile3DButton.prototype.construct = function(scene)
{
	this.CCTile3D_construct();

    this.collideableType = CC.AddFlag( this.collideableType, CC.collision_ui );

	if( scene )
	{
		this.setScene( scene );
	}

	this.setTransparent( true );
    this.setReadDepth( false );

    var model = this.setModel( new CCModelBase() );

    var tileModel = this.tileModel = new CCModelBase();
    model.addModel( tileModel );
    this.setColour( gColour.white(), false );
	this.tileSquares = [];

	this.allowTouchRotation( false );
	this.touchRotationMagnitude = 0.0;
	this.touchRotationSpeed = 1.0;

    this.tileScaleInterpolator = new CCInterpolatorV3( CCInterpolatorSin2Curve );

	this.allowTouchMovement( false );

    this.touchDepressPosition = vec3.create();
    this.touchDepressInterpolator = new CCInterpolatorListV3();
    this.touchDepressInterpolator.speed = 3.0;
	this.setTouchDepressRange( 1.0 );
    this.setTouchDepressDepth( 3.0 );

    CC.UpdateCollisions( this );

    this.createMovementInterpolator( true );
};


CCTile3DButton.prototype.destruct = function()
{
    this.CCTile3D_destruct();
};


CCTile3DButton.prototype.setupTile = function(width, height, text)
{
	this.setTileSize( width, height );

    if( text )
    {
        this.textObject.setText( text, height );
    }

	return this;
};


// Create tile with width and textures aspect ratio
CCTile3DButton.prototype.setupTextured = function(textureSrc, callback, mipmap)
{
    this.setTileSize();
    this.setTileTexture( textureSrc, function (self, textureHandle)
    {
        self.setTileTexturedSize();

        if( callback )
        {
            callback( self, textureHandle );
        }
    });
    return this;
};


CCTile3DButton.prototype.setupTexturedWidth = function(width, textureSrc, callback, mipmap)
{
    this.setTileSize( width );
    this.setTileTexture( textureSrc, function (self, textureHandle)
    {
        self.setTileTexturedWidth( width );

        if( callback )
        {
            callback( self, textureHandle );
        }
    });
};


CCTile3DButton.prototype.setupTexturedHeight = function(height, textureSrc, callback, mipmap)
{
    this.setTileSize();

    this.setTileTexture( textureSrc, function (self, textureHandle)
    {
        self.setTileTexturedHeight( height );

        if( callback )
        {
            callback( self, textureHandle );
        }
    });
};


CCTile3DButton.prototype.setupTexturedFit = function(width, height, crop, textureSrc, callback, mipmap)
{
    this.setTileSize( width, height );
    this.setTileTexture( textureSrc, function (self, textureHandle)
    {
        if( textureHandle )
        {
            self.setTileTexturedFit( width, height, crop, function()
            {
                if( callback )
                {
                    callback( self, textureHandle );
                }
            });
        }
    });
};


// Create tile with width and textures aspect ratio
CCTile3DButton.prototype.setupTexture = function(width, textureSrc, mipmap)
{
    this.setTileTexture( textureSrc, function (self, textureHandle)
    {
        if( textureHandle )
        {
            var aspectRatio = textureHandle.image.width / textureHandle.image.height;
            var height = width / aspectRatio;
            self.setTileSize( width, height );
        }
    });
	return this;
};


// Create tile with the text height
CCTile3DButton.prototype.setupText = function(text, height, centered, createBackgroundTile)
{
    if( centered === undefined )
    {
        centered = true;
    }

	this.setText( text );

    var textObject = this.textObject;
    textObject.setHeight( height );

    var width = textObject.getWidth();
    this.setCollisionBounds( width, height, CC_SMALLFLOAT );

    textObject.setCentered( centered );
    if( !centered )
    {
        this.translate( collisionBounds[0], 0.0, 0.0 );
    }

    if( createBackgroundTile )
    {
        this.setTileSize( width, height );
    }

	return this;
};


// CCRenderable
CCTile3DButton.prototype.refreshModelMatrix = function()
{
	if( this.updateModelMatrix )
    {
        this.updateModelMatrix = false;

        CCRenderer.ModelMatrixIdentity( this );

        CCRenderer.ModelMatrixTranslate( this, this.position );
        CCRenderer.ModelMatrixTranslate( this, this.touchDepressPosition );

        CCRenderer.ModelMatrixScale( this, this.scale );

        var rotation = this.rotation;
        CCRenderer.ModelMatrixRotate( this, rotation[0], [ 1.0, 0.0, 0.0 ] );
        CCRenderer.ModelMatrixRotate( this, rotation[1], [ 0.0, 1.0, 0.0 ] );
        CCRenderer.ModelMatrixRotate( this, rotation[2], [ 0.0, 0.0, 1.0 ] );
    }
};


CCTile3DButton.prototype.update = function(delta)
{
    var updated = this.CCTile3D_update( delta );

    if( this.scale )
    {
        if( this.tileScaleInterpolator.updating )
        {
            if( this.tileScaleInterpolator.update( delta ) )
            {
                this.tileScaleInterpolator.update( delta );
                this.dirtyModelMatrix();
                updated = true;
            }
        }
    }

    if( this.touchDepressRange > 0.0 )
    {
        if( this.touchDepressInterpolator.updating )
        {
            if( this.touchDepressInterpolator.update( delta ) )
            {
                this.dirtyModelMatrix();
            }
        }
    }

    if( this.tileRotationInterpolator )
    {
        if( this.tileRotationInterpolator.updating )
        {
            if( this.tileRotationInterpolator.interpolators.length > 0 )
            {
                if( this.tileRotationInterpolator.update( delta ) )
                {
                    this.dirtyModelMatrix();
                    updated = true;
                }
            }
        }
    }

    if( this.touching )
    {
        this.touchingTime += delta;
    }
    else if( this.touchReleased )
    {
        if( this.touchDepressInterpolator.finished() )
        {
            this.handleTouchRelease();
        }
    }

    if( this.model3dAnimationSpeed && this.model3dAnimationSpeed > 0 && this.model3dObject )
    {
        if( this.model3dObject.model )
        {
            this.model3dObject.model.animate( delta * this.model3dAnimationSpeed );
        }
    }

    return updated;
};


CCTile3DButton.prototype.setTileSize = function(width, height, depth)
{
    gRenderer.pendingRender = true;

    if( !width )
    {
        width = 1;
    }

    if( !height )
    {
        height = width;
    }

    if( this.tileSquares.length === 0 )
    {
        this.tileSquares.push( new CCPrimitiveSquare() );
        this.tileModel.addPrimitive( this.tileSquares[0] );
    }

    if( depth === undefined )
    {
        this.setCollisionBounds( width, height, CC_SMALLFLOAT );
    }
    else
    {
        this.setCollisionBounds( width, height, depth );
    }
    CC.UpdateCollisions( this );

    for( var i=0; i<this.tileSquares.length; ++i )
    {
        this.tileSquares[i].setScale( width, height, 1.0 );
    }

    if( this.textObject )
    {
        if( this.textScale !== undefined )
        {
            this.textObject.setHeight( this.collisionSize.height * this.textScale );
        }
    }

    this.resize3DModel();
};


CCTile3DButton.prototype.setTileTexture = function(src, callback, mipmap)
{
    if( this.tileSquares.length > 0 )
    {
        if( !src )
        {
            src = this.getTileTextureFilename();
        }

        if( src )
        {
            this.tileSquares[0].setTexture( src );

            var self = this;
            gEngine.textureManager.getTextureHandle( src, function (textureHandle)
            {
                if( callback )
                {
                    callback( self, textureHandle );
                }
            });
        }
    }
};


CCTile3DButton.prototype.setTileTextureIndex = function(src, index)
{
    while( this.tileSquares.length < index+1 )
    {
        var newIndex = this.tileSquares.length;
        this.tileSquares.push( new CCPrimitiveSquare() );
        this.tileModel.addPrimitive( this.tileSquares[newIndex] );
    }

    this.tileSquares[index].setTexture( src );

    this.setTileSize( this.collisionSize.width, this.collisionSize.height );
};


CCTile3DButton.prototype.getTileTextureImage = function()
{
    if( this.tileSquares.length > 0 )
    {
        return this.tileSquares[0].getTextureImage();
    }
    return null;
};


CCTile3DButton.prototype.getTileTextureHandle = function()
{
    if( this.tileSquares.length > 0 )
    {
        return this.tileSquares[0].getTextureHandle();
    }
    return null;
};


CCTile3DButton.prototype.getTileTextureFilename = function()
{
    var textureHandle = this.getTileTextureHandle();
    if( textureHandle )
    {
        return textureHandle.filename;
    }
    return null;
};


CCTile3DButton.prototype.removeTileTexture = function()
{
    if( this.tileSquares.length > 0 )
    {
        this.tileSquares[0].removeTexture();
        return true;
    }
};


CCTile3DButton.prototype.setTileTexturedSize = function()
{
    if( this.tileSquares.length > 0 )
    {
        var texture = this.tileSquares[0].getTextureImage();
        if( texture )
        {
            this.setTileSize( texture.width, texture.height );
            return true;
        }
    }
};


CCTile3DButton.prototype.setTileTexturedWidth = function(width)
{
    if( this.tileSquares.length > 0 )
    {
        var texture = this.tileSquares[0].getTextureImage();
        if( texture )
        {
            var aspectRatio = texture.width / texture.height;
            var height = width / aspectRatio;
            this.setTileSize( width, height );
            return true;
        }
    }
    return false;
};


CCTile3DButton.prototype.setTileTexturedHeight = function(height)
{
    if( this.tileSquares.length > 0 )
    {
        var texture = this.tileSquares[0].getTextureImage();
        if( texture )
        {
            var aspectRatio = texture.width / texture.height;
            var width = height * aspectRatio;
            this.setTileSize( width, height );
            return true;
        }
    }
    return false;
};


CCTile3DButton.prototype.setTileTexturedFit = function(width, height, crop, callback)
{
    if( crop === undefined )
    {
        crop = false;
    }

    if( this.tileSquares.length > 0 )
    {
        var texture = this.tileSquares[0].getTextureImage();
        if( texture )
        {
            var targetAspectRatio = width / height;
            var textureAspectRatio = texture.width / texture.height;

            if( crop )
            {
                if( textureAspectRatio < targetAspectRatio )
                {
                    this.setTileTexturedWidth( width );
                }
                else
                {
                    this.setTileTexturedHeight( height );
                }
            }
            else
            {
                if( textureAspectRatio > targetAspectRatio )
                {
                    this.setTileTexturedWidth( width );
                }
                else
                {
                    this.setTileTexturedHeight( height );
                }
            }

            if( callback )
            {
                callback();
            }
        }
    }
};


CCTile3DButton.prototype.set3DModelAnimationSpeed = function(speed)
{
    this.model3dAnimationSpeed = speed;
};


CCTile3DButton.prototype.set3DModel = function(obj, tex, priority, onLoad)
{
    var self = this;

    if( !this.model3dObject )
    {
        this.model3dObject = new CCObject();
        this.addChild( this.model3dObject );

        this.model3dObject.setColour( gColour.set( 1.0, 1.0 ) );
        this.model3dObject.setTransparent();
    }
    this.model3dObject.obj = obj;
    this.model3dObject.tex = tex;

    // Buffer texture first
    if( tex )
    {
        gEngine.textureManager.getTextureHandle( tex );
    }

    if( priority === undefined )
    {
        priority = 0;
    }

    var LoadedFunction = function(obj, tex)
    {
        return function (model3d)
        {
            if( model3d )
            {
                if( obj === self.model3dObject.obj && tex === self.model3dObject.tex )
                {
                    self.model3dObject.setModel( model3d );

                    if( self.model3dObject.tex )
                    {
                        model3d.setTexture( self.model3dObject.tex );
                    }

                    self.resize3DModel();

                    if( onLoad )
                    {
                        onLoad();
                    }
                }
            }
        };
    };

    CCModel3D.CacheModel( obj, true,
        new LoadedFunction( obj, tex ),
        priority );
};


CCTile3DButton.prototype.resize3DModel = function()
{
    if( this.model3dObject )
    {
        if( this.model3dObject.model )
        {
            var model3d = this.model3dObject.model;
            var primitive = model3d.getPrimitive();
            if( primitive )
            {
                // Adjust model size
                {
                    var size = this.collisionSize.width * 0.75;
                    var scaleFactor;

                    var modelWidth = model3d.getWidth() > model3d.getDepth() ? model3d.getWidth() : model3d.getDepth();
                    var modelHeight = model3d.getHeight();

                    if( modelWidth > modelHeight )
                    {
                        scaleFactor = size / modelWidth;
                    }
                    else
                    {
                        scaleFactor = size / modelHeight;
                    }
                    model3d.setScale( scaleFactor );
                }
            }
        }
    }
};


CCTile3DButton.prototype.get3DModelFilename = function()
{
    if( this.model3dObject )
    {
        return this.model3dObject.obj;
    }
    return false;
};


CCTile3DButton.prototype.get3DModelTextureFilename = function()
{
    if( this.model3dObject )
    {
        return this.model3dObject.tex;
    }
    return false;
};


CCTile3DButton.prototype.getTileColour = function()
{
    var colour = this.tileModel.getColour();
    if( colour )
    {
        return colour;
    }
    return gColour.set( 1.0, 1.0 );
};


CCTile3DButton.prototype.setTileScale = function(inScale, interpolate, onInterpolated)
{
    if( typeof( inScale ) === "number" )
    {
        inScale = vec3.clone( [inScale, inScale, inScale] );
    }

    if( this.scale && interpolate )
    {
        this.tileScaleInterpolator.setup( this.scale, inScale, onInterpolated );
    }
    else
    {
        this.setScale( inScale );
        this.tileScaleInterpolator.setup( this.scale );
        this.dirtyModelMatrix();
    }
};


CCTile3DButton.prototype.getTileSquare = function()
{
    if( this.tileSquares.length > 0 )
    {
        return this.tileSquares[0];
    }
    return null;
};


CCTile3DButton.prototype.setText = function(text, resizeTile, fontHeight)
{
    text = "" + text;

    if( !this.textObject )
    {
        // Use an object to ensure the model is rendered in the transparent pass
        this.textObject = new CCObjectText( this );
    }

    if( !fontHeight )
    {
        if( this.textScale !== undefined )
        {
            fontHeight = this.collisionSize.height * this.textScale;
        }
    }

    var textObject = this.textObject;
    textObject.setText( text, fontHeight );
    if( resizeTile )
    {
        var width = textObject.getWidth();
        var height = textObject.getHeight();
        this.setCollisionBounds( width, height, CC_SMALLFLOAT );
        CC.UpdateCollisions( this );
        for( var i=0; i<this.tileSquares.length; ++i )
        {
            this.tileSquares[i].setScale( width, height, 1.0 );
        }
    }
};


CCTile3DButton.prototype.removeText = function()
{
    if( this.textObject )
    {
        // Use an object to ensure the model is rendered in the transparent pass
        this.removeChild( this.textObject );
        this.textObject.destruct();
        delete this.textObject;
    }
};


CCTile3DButton.prototype.getText = function()
{
    if( this.textObject )
    {
        return this.textObject.getText();
    }
    else
    {
        return null;
    }
};


CCTile3DButton.prototype.setTextPosition = function(x, y, z)
{
    if( x !== undefined )
    {
        this.textObject.setPositionX( x );
    }

    if( y !== undefined )
    {
        this.textObject.setPositionY( y );
    }

    if( z !== undefined )
    {
        this.textObject.setPositionZ( z );
    }
};


CCTile3DButton.prototype.setTextScale = function(scale)
{
    this.textScale = scale;
    if( this.textObject )
    {
        this.textObject.setHeight( this.collisionSize.height * scale );
    }
};


CCTile3DButton.prototype.setTextHeight = function(height, resizeTile)
{
    this.textObject.setHeight( height );
    if( resizeTile )
    {
        var width = this.textObject.getWidth();
        this.setCollisionBounds( width, height, CC_SMALLFLOAT );
        CC.UpdateCollisions( this );
        for( var i=0; i<this.tileSquares.length; ++i )
        {
            this.tileSquares[i].setScale( width, height, 1.0 );
        }
    }
};


CCTile3DButton.prototype.setBlinking = function(toggle)
{
    if( toggle )
    {
        var self = this;
        var AnimationFunction = function ()
        {
            var currentAlpha = self.getColourInterpolator().getTarget().a;
            self.setColourAlpha( currentAlpha === 1.0 ? 0.5 : 1.0, true, AnimationFunction );
        };
        this.setColourAlpha( 1.0, true, AnimationFunction );
    }
    else
    {
        this.setColourAlpha( 1.0, true );
    }
};


CCTile3DButton.prototype.isBlinking = function()
{
    if( this )
    {
        if( this.colourInterpolator )
        {
            if( this.colourInterpolator.onInterpolated.length > 0 )
            {
                return true;
            }
        }
    }
    return false;
};


CCTile3DButton.prototype.setTextBlinking = function(toggle)
{
    if( toggle )
    {
        var self = this;
        var AnimationFunction = function ()
        {
            var currentAlpha = self.textObject.getColourInterpolator().getTarget().a;
            self.setTextColourAlpha( currentAlpha === 1.0 ? 0.5 : 1.0, true, AnimationFunction );
        };
        this.setTextColourAlpha( 1.0, true, AnimationFunction );
    }
    else
    {
        this.setTextColourAlpha( 1.0, true );
    }
};


CCTile3DButton.prototype.isTextBlinking = function()
{
    if( this.textObject )
    {
        if( this.textObject.colourInterpolator )
        {
            if( this.textObject.colourInterpolator.onInterpolated.length > 0 )
            {
                return true;
            }
        }
    }
    return false;
};


CCTile3DButton.prototype.setTextColour = function(colour, interpolate)
{
    if( this.textObject )
    {
        if( interpolate )
        {
            this.textObject.getColourInterpolator().setDuration( 0.5 );
        }
        this.textObject.setColour( colour, interpolate );
    }
};


CCTile3DButton.prototype.setTextColourAlpha = function(inAlpha, interpolate, inCallback)
{
    if( this.textObject )
    {
        if( interpolate )
        {
            this.textObject.getColourInterpolator().setDuration( 0.5 );
        }
        this.textObject.setColourAlpha( inAlpha, interpolate, inCallback );
    }
};


CCTile3DButton.prototype.resetTileUVs = function()
{
    for( var i=0; i<this.tileSquares.length; ++i )
    {
        var tileSquare = this.tileSquares[i];
        if( tileSquare.customUVs )
        {
            delete tileSquare.customUVs;
            tileSquare.adjustTextureUVs();
        }
    }
};


CCTile3DButton.prototype.flipTileY = function()
{
    for( var i=0; i<this.tileSquares.length; ++i )
    {
        var tileSquare = this.tileSquares[i];
        tileSquare.flipY();
    }
};


CCTile3DButton.prototype.handleProjectedTouch = function(cameraProjectionResults, hitObject, hitPosition, touch, touchAction)
{
    if( !this.collisionsEnabled )
    {
        return false;
    }

    if( hitObject === this )
    {
        if( !this.touching )
        {
            if( touchAction === CCControls.touch_pressed )// || ( this.touchMovementAllowed && CCControls.TouchActionMoving( touchAction ) ) ) )
            {
                this.touching = true;
                if( this.touchMovementAllowed )
                {
                    this.touchPosition = vec3.clone( this.position );
                }
                this.touchingTime = 0.0;
                this.onTouchPress( touch );
            }
        }
    }

    if( this.touching )
    {
        var maxTimeHeld = 0.125;

        if( touchAction === CCControls.touch_pressed )
        {
            this.touchActionPressed( touchAction, hitPosition );
        }
        else if( this.touchMovementAllowed &&  CCControls.TouchActionMoving( touchAction ) )
        {
            this.touchMoved = true;
            // if( hitObject !== this )
            // {
            //     return this.handleProjectedTouch( cameraProjectionResults, hitObject, hitPosition, touch, CCControls.touch_lost );
            // }
            // else
            {
                this.touchActionPressed( touchAction, hitPosition );
            }
            return true;
        }
        else
        {
            // Ensure we have a good touch release
            if( touchAction === CCControls.touch_released )
            {
				if( !this.touchMovementAllowed )
                {
					var absDeltaX = Math.abs( touch.totalDeltaX );
					var absDeltaY = Math.abs( touch.totalDeltaY );
					if( hitObject !== this || absDeltaX > CCControls.TouchMovementThreashold.x || absDeltaY > CCControls.TouchMovementThreashold.y )
					{
						return this.handleProjectedTouch( cameraProjectionResults, hitObject, hitPosition, touch, CCControls.touch_lost );
					}
				}

                // If we have a good first touch, register it.
                this.touchActionPressed( CCControls.touch_released, hitPosition );
            }

            this.touchActionRelease( touchAction );
            this.touching = false;
            if( this.touchMoved )
            {
                this.touchMoved = false;
            }

            if( touchAction === CCControls.touch_released )
            {
                return true;
            }
        }
    }

    return false;
};


CCTile3DButton.RelativeHitPositionVector = vec3.create();
CCTile3DButton.prototype.touchActionPressed = function(touchAction, hitPosition)
{
    var position = this.position;
    var collisionBounds = this.collisionBounds;
    // var relativeHitPosition = CCTile3DButton.RelativeHitPositionVector;
    // relativeHitPosition[0] = hitPosition[0] - position[0];
    // relativeHitPosition[1] = hitPosition[1] - position[1];
    // var x = relativeHitPosition[0] / collisionBounds[0];
    // var y = relativeHitPosition[1] / collisionBounds[1];

    // If we can press down on the tile
    if( this.touchDepressRange > 0.0 )
    {
        this.touchDepressInterpolator.pushV3( this.touchDepressPosition, vec3.clone( [0.0, 0.0, -this.touchDepressDepth] ), true );
    }

    if( touchAction > CCControls.touch_pressed && touchAction < CCControls.touch_released )
    {
        this.onTouchMove( hitPosition );
    }
};


CCTile3DButton.prototype.touchActionRelease = function(touchAction)
{
    if( touchAction === CCControls.touch_released )
    {
        this.onTouchLoss( false );

        if( !this.touchMoved )
        {
            this.touchReleased = true;
        }
        else
        {
            this.handleTouchRelease();
        }
    }
    else
    {
        this.onTouchLoss( true );
        this.handleTouchRelease();
    }
};


CCTile3DButton.prototype.handleTouchRelease = function()
{
    // If the touch has been released successfully we fire our callback
    if( this.touchReleased )
    {
        this.touchReleased = false;
        this.onTouchRelease();
    }

	// Touch depress: On releasse
    if( this.touchDepressRange > 0.0 )
    {
        this.touchDepressInterpolator.pushV3( this.touchDepressPosition, vec3.create(), true );
    }
};


CCTile3DButton.prototype.allowTouchRotation = function(allow)
{
	this.touchRotationAllowed = allow;
};


CCTile3DButton.prototype.allowTouchMovement = function(allow)
{
	this.touchMovementAllowed = allow;
};


CCTile3DButton.prototype.setTouchRotationSpeed = function(speed)
{
	this.touchRotationSpeed = speed;
};


CCTile3DButton.prototype.setTouchDepressRange = function(range)
{
	this.touchDepressRange = range;
};


CCTile3DButton.prototype.setTouchDepressDepth = function(depth)
{
    this.touchDepressDepth = depth;
};


CCTile3DButton.prototype.getTileScaleInterpolator = function()
{
    return this.tileScaleInterpolator;
};


CCTile3DButton.prototype.getColourInterpolator = function()
{
    if( !this.colourInterpolator )
    {
        this.colourInterpolator = new CCInterpolatorColour();
        this.colourInterpolator.setDuration( 0.5 );
        if( this.colour )
        {
            this.colourInterpolator.setup( this.colour, this.colour );
        }
    }
    return this.colourInterpolator;
};