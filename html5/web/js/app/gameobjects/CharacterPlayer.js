/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CharacterPlayer.js
 * Description : Player class for our character
 *
 * Created     : 09/10/12
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

function CharacterPlayer(inMovementSpeed, inCharacterSize)
{
    this.construct( inMovementSpeed, inCharacterSize );
}
ExtendPrototype( CharacterPlayer, CCMoveable );


CharacterPlayer.Spawn = function(type, obj, tex, speed, size, onLoadedCallback)
{
    var character = new CharacterPlayer( speed, size );
    character.type = type;
    character.setupBody( obj, tex, function()
    {
        character.finalizeModel();
        {
            character.finalizeModel();
            character.setupWeapon( character.modelBody );

            if( onLoadedCallback )
            {
                onLoadedCallback( character );
            }
        }
    });

    return character;
};


CharacterPlayer.prototype.construct = function(inMovementSpeed, inCharacterSize)
{
    this.CCMoveable_construct();

    this.collisionBoxMultiple = 1.25;

    if( !inMovementSpeed )
    {
        inMovementSpeed = 50.0;
    }
    this.movementSpeed = inMovementSpeed;
    this.turningSpeed = 720.0;
    this.instantTurns = false;

    if( !inCharacterSize )
    {
        inCharacterSize = 15.0;
    }
    this.characterSize = inCharacterSize;

    this.collideableType = CC.AddFlag( this.collideableType, CC.collision_character );

    this.controller = null;
    this.gravity = false;
    this.sceneMap = null;

    this.playerID = "";
    this.userID = "";
    this.type = "";

    this.modelBody = this.modelHead = null;

    this.setModel( new CCModelBase() );
    this.model3DBase = new CCModelBase();
    this.model.addModel( this.model3DBase );
    this.modelWeaponBase = this.model3DBase;    // Used to orientate the weapon around the character model

    this.modelRotationTargetActive = false;
    this.modelRotationTarget = 0.0;

    this.modelHeadAnimationActive = false;
    this.modelHeadAnimationState = 0;

    this.characterIndicator = null;
    this.shootingIndicator = null;
    this.shootingScaleInterpolator = new CCInterpolatorV3( CCInterpolatorSin2Curve );

    this.lastTimeAttacked = 0.0;
    this.deathFadeOut = false;

    this.weapons = [];
    this.shootingBurstTimer = 0.0;

    this.setTransparent( true );
    this.setColourAlpha( 0.0, false );
    this.setColourAlpha( 0.5, true );
    this.setupWeapon( this.model3DBase );

    this.finalizeModel();
};


CharacterPlayer.prototype.setSize = function(size)
{
    this.characterSize = size;
    this.finalizeModel();
};


CharacterPlayer.prototype.deleteLater = function()
{
    if( this.sceneMap )
    {
        this.sceneMap.deletingCharacter( this );
    }

    this.CCMoveable_deleteLater();
};


// CCRenderable
CharacterPlayer.prototype.dirtyModelMatrix = function()
{
    this.CCMoveable_dirtyModelMatrix();

    var position = this.position;
    if( this.characterIndicator )
    {
        this.characterIndicator.setPositionXZ( position[0], position[2] );
    }

    if( this.shootingIndicator )
    {
        this.shootingIndicator.setPositionXZ( position[0], position[2] );
    }
};


CharacterPlayer.prototype.setupMap = function(sceneMap, playerID, userID)
{
    this.setScene( sceneMap );
    this.sceneMap = sceneMap;
    this.setPlayerIDs( playerID, userID );
};


CharacterPlayer.prototype.getMap = function()
{
    return this.sceneMap;
};


CharacterPlayer.prototype.getType = function()
{
    return this.type;
};


CharacterPlayer.prototype.setupAI = function(controller)
{
    if( this.controller )
    {
        this.removeUpdater( this.controller );
        this.controller.destruct();
    }
    this.controller = controller;
    this.controller.setPlayer( this );
    this.addUpdater( controller );
};


CharacterPlayer.prototype.setupBody = function(modelFile, textureFile, callback)
{
    var self = this;

    // Only load the latest call to setupBody
    var LoadedModelFunction = function (modelFile, textureFile)
    {
        self.loadingBodyModel = modelFile;
        self.loadingBodyTexture = textureFile;
        return function(model3d)
        {
            if( self.loadingBodyModel === modelFile && self.loadingBodyTexture === textureFile )
            {
                delete self.loadingBodyModel;
                delete self.loadingBodyTexture;

                if( model3d )
                {
                    if( self.modelBody )
                    {
                        self.model3DBase.removeModel( self.modelBody );
                        self.modelBody.destruct();
                        self.modelBody = null;
                    }

                    self.setColourAlpha( 1.0, true, function()
                    {
                        if( !self.forceTransparent )
                        {
                            self.setTransparent( false );
                        }
                    });
                    self.modelBody = model3d;
                }
                callback( model3d );
            }
            else if( model3d )
            {
                self.model3DBase.removeModel( model3d );
            }
        };
    };

    this.setupModel( modelFile, textureFile, new LoadedModelFunction( modelFile, textureFile ) );
};


CharacterPlayer.prototype.setupHead = function(modelFile, textureFile, callback)
{
    var self = this;
    this.setupModel( modelFile, textureFile, function(model3d)
    {
        self.modelHead = model3d;
        callback();
    });
};


// Set the player size and orientation
CharacterPlayer.prototype.finalizeModel = function()
{
    var characterSize = this.characterSize;
    var modelWidth = characterSize;
    var modelDepth = characterSize;
    var bodyHeight = characterSize;

    var modelBody = this.modelBody;
    var modelHead = this.modelHead;
    if( modelBody )
    {
        modelWidth = modelBody.getWidth();
        modelDepth = modelBody.getDepth();
        bodyHeight = modelBody.getHeight();
    }

    var modelHeight = bodyHeight;

    this.finalizeSize( modelWidth, modelDepth, modelHeight );
};


CharacterPlayer.prototype.finalizeSize = function(modelWidth, modelDepth, modelHeight)
{
    var characterSize = this.characterSize;

    // Adjust model size
    var modelSize = modelHeight > modelWidth ? modelHeight : modelWidth;
    if( modelSize < modelDepth )
    {
        modelSize = modelDepth;
    }
    var scaleFactor = characterSize / modelSize;
    this.model3DBase.setScale( scaleFactor );

    modelWidth *= scaleFactor;
    modelDepth *= scaleFactor;
    modelHeight *= scaleFactor;

    this.setSquareCollisionBounds( characterSize * this.collisionBoxMultiple, modelHeight );
};


CharacterPlayer.prototype.setupWeapon = function(modelObj, index)
{
    if( modelObj )
    {
        if( index === undefined )
        {
            index = 0;
        }

        var weapon;

        var weapons = this.weapons;
        if( weapons.length > index )
        {
            weapon = weapons[index];
            weapons.remove( weapon );
            weapon.destruct();
        }

        weapon = new WeaponBase( this );
        weapon.setup( modelObj );
        weapons.insert( weapon, index );
    }
};


CharacterPlayer.prototype.useableWeapon = function(weaponName)
{
    // CCText path = "Resources/characters/";
    // path += type.buffer;
    // path += "/character_";
    // path += type.buffer;
    // CCText pathWeapon = path;
    // pathWeapon += "_weapon_";
    // pathWeapon += weaponName;

    // CCText modelFile = pathWeapon.buffer;
    // modelFile += ".obj";

    // return CCFileManager::DoesFileExist( modelFile.buffer, Resource_Packaged );
    return false;
};


CharacterPlayer.prototype.setWeaponSettings = function(timeToReady, bulletDamage, bulletTax, fireChargeRate)
{
    var weapons = this.weapons;

    for( var i=0; i<weapons.length; ++i )
    {
        var weapon = weapons[i];

        if( timeToReady )
        {
            weapon.setTimeToReady( timeToReady );
        }

        if( bulletDamage )
        {
            weapon.setBulletDamage( bulletDamage );
        }

        if( bulletTax )
        {
            weapon.setBulletTax( bulletTax );
        }

        if( fireChargeRate )
        {
            weapon.setChargeRate( fireChargeRate );
        }
    }
};


CharacterPlayer.prototype.rechargeWeapon = function()
{
    var weapons = this.weapons;

    for( var i=0; i<weapons.length; ++i )
    {
        weapons[i].addAmmo( 1.0 );
    }
};


CharacterPlayer.prototype.setupModel = function(modelFile, tex, callback)
{
    var self = this;

    // Buffer texture first
    if( tex )
    {
        gEngine.textureManager.getTextureHandle( tex );
    }

    // Create the model
    CCModel3D.CacheModel( modelFile, true, function(model3d)
    {
        if( model3d )
        {
            if( tex )
            {
                model3d.setTexture( tex );
            }
            //model3d.shader = "phong";
            self.model3DBase.addModel( model3d );

            callback( model3d );
        }
        else
        {
            callback( model3d );
        }
    },
    2 );
};


CharacterPlayer.prototype.setupCharacterIndicator = function(textureFile, colour)
{
    this.characterIndicator = new CollideableIndicator( this, textureFile );
    this.characterIndicator.setDrawOrder( 97 );

    this.characterIndicator.setScale( 2.0 );
    this.characterIndicator.setColour( colour );
};


CharacterPlayer.prototype.setupShootingIndicator = function(textureFile, colour)
{
    this.shootingIndicator = new CollideableIndicator( this, textureFile );
    this.shootingIndicator.setScale( 0.0 );
    this.shootingIndicator.setColour( colour );
};


CharacterPlayer.prototype.scaleShootingIndicator = function(target)
{
    if( this.shootingIndicator )
    {
        if( this.shootingIndicator.scale )
        {
            if( target > 0.0 )
            {
                this.shootingScaleInterpolator.setDuration( 0.5 );
            }
            else
            {
                this.shootingScaleInterpolator.setDuration( 2.0 );
            }
            this.shootingScaleInterpolator.setup( this.shootingIndicator.scale, target );
        }
    }
};


// ObjectBase
CharacterPlayer.prototype.update = function(delta)
{
    if( this.deathFadeOut )
    {
        this.deleteLater();
    }

    if( this.modelHeadAnimationActive && this.modelHead )
    {
        var modelHead = this.modelHead;

        var angle = 5.0;
        var speed = delta * 30.0;
        if( this.modelHeadAnimationState === 0 )
        {
            if( modelHead.rotation[2] !== angle )
            {
                modelHead.rotation[2] = CC.ToRotation( modelHead.rotation[2], angle, speed );
                modelHead.rotationUpdated();
            }
            else
            {
                modelHeadAnimationState = 1;
            }
        }
        else if( modelHeadAnimationState === 1 )
        {
            if( modelHead.rotation[2] !== ( 360 - angle ) )
            {
                modelHead.rotation[2] = CC.ToRotation( modelHead.rotation[2], ( 360 - angle ), speed );
                modelHead.rotationUpdated();
            }
            else
            {
                this.modelHeadAnimationState = 0;
            }
        }
    }

    if( this.updateModelMatrix )
    {
        var position = this.position;
        if( this.characterIndicator )
        {
            this.characterIndicator.setPositionXZ( position[0], position[2] );
        }

        if( this.shootingIndicator )
        {
            this.shootingIndicator.setPositionXZ( position[0], position[2] );
        }
    }

    if( this.characterIndicator )
    {
        this.characterIndicator.rotateY( delta * -180.0 );
    }

    if( this.shootingIndicator )
    {
        this.shootingScaleInterpolator.update( delta );
        if( this.shootingIndicator.scale[0] > 0.0 )
        {
            this.shootingIndicator.rotateY( delta * 720.0 );
        }
    }

    {
        var weapons = this.weapons;

        var updatedAmmo = false;
        for( var i=0; i<weapons.length; ++i )
        {
            var weapon = weapons[i];
            if( weapon.updateCharge( delta ) )
            {
                updatedAmmo = true;
            }
        }
        if( updatedAmmo )
        {
            if( this.sceneMap )
            {
                this.sceneMap.registerAmmoUpdate( this );
            }
        }
    }

    var updated = this.CCMoveable_update( delta );

    this.updateWeaponAim( delta );

    return updated;
};


CharacterPlayer.prototype.renderModel = function(alpha)
{
    if( this.modelBody )
    {
        this.CCMoveable_renderModel( alpha );
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


// CollideableBase
// Ask to report a collision to the collidedWith object
CharacterPlayer.prototype.requestCollisionWith = function(collisionTarget)
{
    var collidedWith = this.CCMoveable_requestCollisionWith( collisionTarget );
    if( collidedWith )
    {
        if( collidedWith.getType() === "health" )
        {
            var pickup = collidedWith;
            if( pickup )
            {
                if( this.sceneMap )
                {
                    if( this.sceneMap.handlePickup( this, pickup ) )
                    {
                        collidedWith = null;
                    }
                }
            }
        }

        if( collidedWith )
        {
            if( this.controller )
            {
                this.controller.recieveCollisionFrom( collisionTarget );
            }
        }

        return collidedWith;
    }
    return null;
};


// Ask the collidedWith object if we've collided
CharacterPlayer.prototype.recieveCollisionFrom = function(collisionSource, x, y, z)
{
    if( this.controller )
    {
        this.controller.recieveCollisionFrom( collisionSource );
    }
    return this.CCMoveable_recieveCollisionFrom( collisionSource, x, y, z );
};


CharacterPlayer.prototype.reportAttack = function(attackedBy, attackType, force, damage, x, y, z)
{
    if( this.isActive() && this.controller )
    {
        var sinceLastAttack = gEngine.lifetime - this.lastTimeAttacked;
        if( sinceLastAttack > 0.25 )
        {
            this.lastTimeAttacked = gEngine.lifetime;

            // Spawn hit particle
            {
                var particle = new CollideableParticle( 3.0 );

                particle.setModel( new CCModelBase() );
                particle.setColour( new CCColour() );
                var primitive = new CCPrimitiveSquare();
                particle.model.addPrimitive( primitive );
                particle.model.setScale( 30.0 );

                primitive.setTexture( "resources/common/fx/fx_impact_texture.png", true, true );

                particle.setScene( this.inScene );
                this.ownObject( particle );

                // Position with the character
                particle.setPosition( this.position );

                // Rotate with the camera
                particle.setRotationY( this.sceneMap.camera.rotation[1] );
            }
        }

        this.controller.reportAttack( attackedBy, attackType, force, damage, x, y, z );
        return this.handleAttack( attackedBy, attackType, force, damage, x, y, z );
    }
    return false;
};


CharacterPlayer.prototype.handleAttack = function(attackedBy, attackType, force, damage, x, y, z)
{
    var killed = false;

    var map = this.sceneMap;
    var health = this.controller.getHealth();
    if( health > 0.0 )
    {
        health -= damage;
        this.controller.setHealth( health );

        if( health <= 0.0 )
        {
            this.handleDeath( attackedBy );
            killed = true;
        }
    }

    var attackVelocity = vec3.clone( [ x, y, z ] );
    vec3.unitize( attackVelocity );
    vec3.scale( attackVelocity, attackVelocity, force * 0.1 );
    this.incrementAdditionalVelocity( attackVelocity[0], attackVelocity[1], attackVelocity[2] );

    map.registerDamage( attackedBy, this, damage );

    return killed;
};


CharacterPlayer.prototype.handleDeath = function(killer)
{
    this.sceneMap.registerDeath( this, killer, false );
};


CharacterPlayer.prototype.setPlayerIDs = function(playerID, userID)
{
    this.playerID = playerID;
    this.userID = userID;
};


CharacterPlayer.prototype.getPlayerID = function()
{
    return this.playerID;
};


CharacterPlayer.prototype.getUserID = function()
{
    return this.userID;
};


CharacterPlayer.prototype.activateHeadAnimation = function()
{
    this.modelHeadAnimationActive = true;
};


CharacterPlayer.prototype.readyWeapon = function(actionID)
{
    this.shootingBurstTimer = 1.0;
};


CharacterPlayer.prototype.unReadyWeapon = function()
{
    this.unAimWeapon();
};


CharacterPlayer.prototype.shotFired = function(weapon)
{
    if( this.sceneMap )
    {
        this.sceneMap.registerAttacking( this );
    }
};


CharacterPlayer.prototype.shootWeapon = function(delta)
{
    var showShootingIndicator = false;

    var weapons = this.weapons;
    for( var i=0; i<weapons.length; ++i )
    {
        var previousWeapon = i > 0 ? weapons[i-1] : null;
        if( previousWeapon )
        {
            if( previousWeapon.getTimeSinceLastShot() < 0.05 )
            {
                showShootingIndicator = true;
                break;
            }
        }

        var weapon = weapons[i];
        if( weapon.hasEnoughAmmo() )
        {
            showShootingIndicator = true;
            if( weapon.isReady() )
            {
                weapon.shootWeapon( this.modelRotationTarget );
                this.shotFired( weapon );
            }
        }
    }

    if( showShootingIndicator )
    {
        this.scaleShootingIndicator( 2.0 );
    }
    else
    {
        this.scaleShootingIndicator( 0.0 );
    }

    this.shootingBurstTimer -= delta;
    if( this.shootingBurstTimer <= 0.0 )
    {
        this.shootingBurstTimer = 0.0;
        return false;
    }
    return true;
};


CharacterPlayer.prototype.getWeaponAimAngleToTarget = function(target)
{
    // Is target in view?
    var baseRotation = 0.0 - this.rotation[1];
    var combinedRotation = baseRotation + this.modelRotationTarget;
    var targetRotation = combinedRotation;
    targetRotation = CC.ClampRotation( targetRotation );
    var distance = CC.DistanceBetweenAngles( this.modelWeaponBase.rotation[1], targetRotation );
    return distance;
};


CharacterPlayer.prototype.getModelRotation = function()
{
    return this.rotation[1] + this.modelWeaponBase.rotation[1];
};


CharacterPlayer.prototype.aimWeapon = function(target)
{
    this.modelRotationTargetActive = true;
    this.modelRotationTarget = CC.AngleTowardsVector( target, this.position );
};


CharacterPlayer.prototype.unAimWeapon = function()
{
    this.scaleShootingIndicator( 0.0 );

    this.modelRotationTargetActive = false;
    this.modelRotationTarget = 0.0;
};


CharacterPlayer.prototype.updateWeaponAim = function(timeDelta)
{
    var i;
    var weapons = this.weapons;

    var modelWeaponBase = this.modelWeaponBase;
    if( this.modelRotationTargetActive )
    {
        var baseRotation = 0.0 - this.rotation[1];
        var combinedRotation = baseRotation + this.modelRotationTarget;
        var targetRotation = combinedRotation;
        targetRotation = CC.ClampRotation( targetRotation );
        if( modelWeaponBase.rotation[1] !== targetRotation )
        {
            if( this.instantTurns )
            {
                modelWeaponBase.setRotationY( targetRotation );
            }
            else
            {
                modelWeaponBase.setRotationY( CC.ToRotation( modelWeaponBase.rotation[1], targetRotation, timeDelta * this.turningSpeed ) );
            }
            for( i=0; i<weapons.length; ++i )
            {
                weapons[i].updateParentRotation( modelWeaponBase.rotation[1] );
            }
        }
    }
    else
    {
        if( modelWeaponBase.rotation[1] !== 0.0 )
        {
            if( this.instantTurns )
            {
                modelWeaponBase.setRotationY( 0.0 );
            }
            else
            {
                modelWeaponBase.setRotationY( CC.ToRotation( modelWeaponBase.rotation[1], 0.0, timeDelta * this.turningSpeed * 0.5 ) );
            }
            for( i=0; i<weapons.length; ++i )
            {
                weapons[i].updateParentRotation( modelWeaponBase.rotation[1] );
            }
        }
    }
};


CharacterPlayer.prototype.getWeaponAmmo = function()
{
    var weapons = this.weapons;
    if( weapons.length === 0 )
    {
        return 1.0;
    }

    var ammo = 0.0;
    for( var i=0; i<weapons.length; ++i )
    {
        ammo += weapons[i].getAmmo();
    }
    return ammo;
};


CharacterPlayer.prototype.triggerDeath = function(attackedBy, force, x, y, z)
{
    this.collideableType = CC.collision_none;
    vec3.scale( this.movementDirection, this.movementDirection, 0.0 );

    this.removeUpdater( this.controller );
    this.controller.destruct();

    this.deleteLater();
};


CharacterPlayer.prototype.animatedDeath = function()
{
    this.deathFadeOut = true;

    if( this.owner )
    {
        this.owner.unOwnObject( this );
        this.owner = null;
    }
};


CharacterPlayer.prototype.turnPlayer = function(target, delta)
{
    var angleTowardsTarget = CC.AngleTowardsVector( target, this.position );
    if( this.instantTurns )
    {
        this.setRotationY( angleTowardsTarget );
        return 0.0;
    }
    this.setRotationY( CC.ToRotation( this.rotation[1], angleTowardsTarget, delta * this.turningSpeed ) );
    return angleTowardsTarget;
};
