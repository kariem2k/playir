/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : WeaponBase.js
 * Description : A weapon a character carries
 *
 * Created     : 14/10/12
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

function WeaponBase(character)
{
    this.construct( character );
}
ExtendPrototype( WeaponBase, CCObject );


WeaponBase.prototype.construct = function(character)
{
    this.CCObject_construct();

    this.spawnPoint = vec3.create();

    this.character = character;

    this.bulletLife = 5.0;
    this.bulletSpeed = 200.0;
    this.fireRate = 0.1;
    this.shootingTimer = 0.0;

    this.timeSinceLastShot = 0.0;
    this.timeToReady = 0.0;

    this.maxAmmo = 1.0;
    this.ammo = 1.0;
    this.bulletTax = 0.05;
    this.chargeRate = 0.1;
};


WeaponBase.prototype.destruct = function()
{
    this.CCObject_destruct();
};


WeaponBase.prototype.setup = function(weaponObj, recoil, muzzleFlash)
{
    if( weaponObj )
    {
        if( recoil === undefined )
        {
            recoil = true;
        }

        if( muzzleFlash === undefined )
        {
            muzzleFlash = true;
        }

        // Spawn point
        this.setupSpawnPoint( weaponObj );

        if( recoil )
        {
            this.setModel( new CCModelBase() );
            this.setColour( new CCColour() );

            this.modelWeaponHomePosition = vec3.create();
            vec3.copy( this.modelWeaponHomePosition, weaponObj.position );

            this.modelWeaponMovementInterpolator = new CCInterpolatorV3( CCInterpolatorSin2Curve );
            this.modelWeaponMovementInterpolator.setup( weaponObj.position, this.modelWeaponHomePosition );
            this.modelWeaponMovementInterpolator.setDuration( 0.05125 );
        }

        // Muzzle flash
        if( muzzleFlash )
        {
            var objFile = "resources/common/fx/fx_weapon_muzzleflash.obj";
            var texFile = "resources/common/fx/fx_weapon_muzzleflash_texture.png";

            var objectMuzzleFlash = this.objectMuzzleFlash = new CCObject();
            objectMuzzleFlash.setModel( new CCModelBase() );
            objectMuzzleFlash.setColour( new CCColour() );

            objectMuzzleFlash.setTransparent();
            objectMuzzleFlash.setWriteDepth( false );
            objectMuzzleFlash.setCulling( false );
            this.addChild( objectMuzzleFlash );

            var self = this;
            CCModel3D.CacheModel( objFile, true, function (model3d)
            {
                if( model3d )
                {
                    self.modelMuzzleFlash = model3d;
                    model3d.setTexture( texFile );
                    model3d.setPosition( self.spawnPoint );
                    model3d.translate( 0.0, 0.0, model3d.getDepth() * 0.5 );
                    objectMuzzleFlash.model.addModel( model3d );
                }
            });
        }
    }

    this.character.addChild( this );
};


WeaponBase.prototype.setupSpawnPoint = function(weaponObj)
{
    if( weaponObj && this.modelWeapon !== weaponObj )
    {
        this.modelWeapon = weaponObj;
        if( weaponObj.getDepth )
        {
            var x = weaponObj.position[0];
            var y = weaponObj.position[1];
            var z = weaponObj.position[2];
            var scale = this.character.model3DBase.scale;
            var weaponDepth = weaponObj.getDepth();

            // Realign spawn point based on end point
            var weaponDepthMinMax = weaponObj.getPrimitive().getZMinMax();

            var self = this;
            weaponObj.getPrimitive().getYMinMaxAtZ( weaponDepthMinMax.max * 0.9, function( weaponHeightMinMaxAtPoint )
            {
                var centerPointY = weaponHeightMinMaxAtPoint.min + weaponHeightMinMaxAtPoint.size() * 0.5;
                y += centerPointY;

                if( scale )
                {
                    x *= scale[0];
                    y *= scale[1];
                    z *= scale[2];
                    weaponDepth *= scale[2];
                }
                z += weaponDepth * 0.5;

                self.spawnPoint = vec3.copy( self.spawnPoint, [ x, y, z ] );

                if( self.modelMuzzleFlash )
                {
                    self.modelMuzzleFlash.setPosition( self.spawnPoint );
                }
            });
        }
    }
};


WeaponBase.prototype.setTimeToReady = function(time)
{
    this.timeToReady = time;
};


WeaponBase.prototype.isReady = function()
{
    if( this.timeToReady <= 0.0 )
    {
        if( this.timeSinceLastShot > this.fireRate )
        {
            return true;
        }
    }
    return false;
};


WeaponBase.BulletsCache = [];
WeaponBase.NewBullet = function(life, speed, damage, visible)
{
    var BulletsCache = WeaponBase.BulletsCache;

    if( visible === undefined )
    {
        visible = true;
    }

    var bullet;
    if( BulletsCache.length > 0 )
    {
        bullet = BulletsCache.safePop();
        bullet.life = life;
        if( speed )
        {
            bullet.movementSpeed = speed;
        }
        if( damage )
        {
            bullet.damage = damage;
        }

        bullet.shouldRender = visible;
    }
    else
    {
        bullet = new MoveableBullet( life, speed, damage );
        bullet.setSquareCollisionBounds( 5.0 );
        bullet.setTransparent();

        var path = "resources/common/fx/fx_weapon_bullet";
        var texPath;
        {
            var objPath = path;
            objPath += ".obj";

            texPath = path;
            texPath += "_diffuse.jpg";

            CCModel3D.CacheModel( objPath, true, function(model3d)
            {
                model3d.setTexture( texPath );
                bullet.setModel( model3d );
            });
            bullet.movementDirection[2] = 1.0;
        }

        {
            texPath = path;
            texPath += "_glow_texture.png";

            var objectIndicator = new ObjectIndicator( bullet, texPath );
            objectIndicator.setScale( [ 5.0, 1.0, 5.0 ] );
            objectIndicator.translate( 0.0, 1.0, 0.0 );
        }

        bullet.onEndLife = function()
        {
            BulletsCache.add( bullet );
            bullet.removeFromScene();
        };

        bullet.shouldRender = visible;
    }

    return bullet;
};


WeaponBase.prototype.shootWeapon = function(characterRotation)
{
    if( !this.hasEnoughAmmo() )
    {
        return false;
    }

    if( !this.isReady() )
    {
        return false;
    }

    this.ammo -= this.bulletTax;

    // Recoil
    var modelWeaponMovementInterpolator = this.modelWeaponMovementInterpolator;
    if( modelWeaponMovementInterpolator )
    {
        if( !modelWeaponMovementInterpolator.updating )
        {
            var modelWeaponHomePosition = this.modelWeaponHomePosition;
            var modelWeapon = this.modelWeapon;
            modelWeaponMovementInterpolator.setup( modelWeapon.position,
                                                   vec3.clone( [ modelWeaponHomePosition[0], modelWeaponHomePosition[1], modelWeaponHomePosition[2]+1.0 ] ),
                                                   function()
                                                   {
                                                        modelWeaponMovementInterpolator.setup( modelWeapon.position, modelWeaponHomePosition );
                                                   });
        }
    }

    var bullet = WeaponBase.NewBullet( this.bulletLife, this.bulletSpeed, this.bulletDamage, this.bulletVisible );

    bullet.setScene( this.character.inScene );
    this.character.ownObject( bullet );

    this.setBulletSpawnPoint( bullet, characterRotation );
    this.shoot();
    this.timeSinceLastShot = 0.0;

    return true;
};


WeaponBase.prototype.setBulletSpawnPoint = function(projectile, characterRotation)
{
    var spawnPointXZ = new CCPoint( this.spawnPoint[0], this.spawnPoint[2] );
    CC.RotatePoint( spawnPointXZ, characterRotation );

    var spawnPoint = vec3.create();
    vec3.copy( spawnPoint, this.parent.position );
    spawnPoint[0] += spawnPointXZ.x;
    spawnPoint[1] += this.spawnPoint[1];
    spawnPoint[2] += spawnPointXZ.y;

    // Make sure we don't spawn on the floor
    if( spawnPoint[1] < projectile.collisionBounds[1] )
    {
        spawnPoint[1] = projectile.collisionBounds[1] + 0.1;
    }

    projectile.setPosition( spawnPoint );
    projectile.rotation[1] = characterRotation;
};


WeaponBase.prototype.updateParentRotation = function(rotation)
{
    if( this.model )
    {
        this.model.setRotationY( rotation );

        if( this.objectMuzzleFlash )
        {
            this.objectMuzzleFlash.setRotationY( rotation );
        }
    }
};


WeaponBase.prototype.update = function(delta)
{
    var updated = this.CCObject_update( delta );

    // Recoil
    var modelWeaponMovementInterpolator = this.modelWeaponMovementInterpolator;
    if( modelWeaponMovementInterpolator )
    {
        if( modelWeaponMovementInterpolator.updating )
        {
            if( modelWeaponMovementInterpolator.update( delta ) )
            {
                this.modelWeapon.dirtyModelMatrix();
                updated = true;
            }
        }
    }

    var objectMuzzleFlash = this.objectMuzzleFlash;
    if( objectMuzzleFlash )
    {
        if( objectMuzzleFlash.shouldRender )
        {
            if( this.shootingTimer !== 0.0 )
            {
                this.shootingTimer = CC.ToTarget( this.shootingTimer, 0.0, delta );
                if( objectMuzzleFlash )
                {
                    if( this.modelMuzzleFlash )
                    {
                        this.modelMuzzleFlash.rotateZ( delta * 360.0 );
                    }
                }
            }
            else
            {
                objectMuzzleFlash.shouldRender = false;
            }
        }
    }

    this.timeSinceLastShot += delta;

    if( this.timeToReady > 0.0 )
    {
        this.timeToReady -= delta;
    }

    return updated;
};


WeaponBase.prototype.updateCharge = function(delta)
{
    if( this.ammo < this.maxAmmo )
    {
        this.addAmmo( delta * this.chargeRate );
        return true;
    }
    return false;
};


WeaponBase.prototype.renderObject = function(camera, alpha)
{
    this.CCObject_renderObject( camera, alpha );
};


WeaponBase.prototype.renderModel = function(alpha)
{
    this.CCObject_renderModel( alpha );
};


WeaponBase.prototype.shoot = function()
{
    this.shootingTimer = 0.025;
    if( this.objectMuzzleFlash )
    {
        this.objectMuzzleFlash.shouldRender = true;
    }
};


WeaponBase.prototype.getTimeSinceLastShot = function()
{
    return this.timeSinceLastShot;
};


WeaponBase.prototype.setFireRate = function(rate)
{
    this.fireRate = rate;
};


WeaponBase.prototype.setupBullet = function(life, speed, visible)
{
    this.bulletLife = life;
    this.bulletSpeed = speed;

    if( visible !== undefined )
    {
        this.bulletVisible = visible;
    }
};


WeaponBase.prototype.setMaxAmmo = function(amount)
{
    this.maxAmmo = amount;
    this.ammo = amount;
};


WeaponBase.prototype.addAmmo = function(amount)
{
    this.ammo += amount;
    this.ammo = CC.FloatClamp( this.ammo, 0.0, this.maxAmmo );
};


WeaponBase.prototype.hasEnoughAmmo = function()
{
    return this.ammo > this.bulletTax;
};


WeaponBase.prototype.getAmmo = function()
{
    return this.ammo;
};


WeaponBase.prototype.getMaxAmmo = function()
{
    return this.maxAmmo;
};


WeaponBase.prototype.setBulletTax = function(tax)
{
    this.bulletTax = tax;
};


WeaponBase.prototype.setBulletDamage = function(damage)
{
    this.bulletDamage = damage;
};


WeaponBase.prototype.setChargeRate = function(rate)
{
    this.chargeRate = rate;
};
