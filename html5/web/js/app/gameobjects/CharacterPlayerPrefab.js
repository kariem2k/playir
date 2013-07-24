/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CharacterPlayerPrefab.js
 * Description : Player class for custom models.
 *
 * Created     : 21/05/13
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

function CharacterPlayerPrefab()
{
    this.construct();
}
ExtendPrototype( CharacterPlayerPrefab, CharacterPlayer );


CharacterPlayerPrefab.Spawn = function(type, onLoadedCallback)
{
    var character = new CharacterPlayerPrefab();
    character.type = type;
    character.collisionBoxMultiple = 0.5;
    character.finalizeModel();

    var LoadedCharacterID = function(character)
    {
        return function (characterInfo)
        {
            var actions = characterInfo.actions;
            for( var i=0; i<actions.length; ++i )
            {
                character.actions.add( actions[i] );
            }
            character.loadAction( 0 );
        };
    };
    DBAssets.LoadCharacterID( type, new LoadedCharacterID( character ) );

    return character;
};


CharacterPlayerPrefab.prototype.loadAction = function(i)
{
    var actions = this.actions;
    if( i < actions.length )
    {
        var self = this;
        var action = actions[i];

        DBAssets.LoadModelID( action.modelID, function (modelInfo)
        {
            actions[i].modelInfo = modelInfo;

            // Initialize body size with first model
            if( i === 0 )
            {
                self.setupBody( modelInfo.obj, modelInfo.tex, function (model3d)
                {
                    self.finalizeModel();
                });
            }

            if( self.currentActionIndex === i )
            {
                self.setActionIndex( i );
            }
            self.loadAction( i+1 );
        });

        if( action.sfxID )
        {
            DBAssets.LoadAudioID( action.sfxID, function (sfxInfo)
            {
                if( sfxInfo )
                {
                    action.sfxInfo = sfxInfo;
                }
            });
        }
    }
};


CharacterPlayerPrefab.prototype.construct = function()
{
	this.CharacterPlayer_construct();

    this.actions = [];
    this.setActionIndex( 0 );

    this.animationSpeed = 1.0;
};


CharacterPlayerPrefab.prototype.destruct = function()
{
    this.CharacterPlayer_destruct();
};


CharacterPlayerPrefab.prototype.finalizeModel = function()
{
    var characterSize = this.characterSize;
    var modelWidth = characterSize;
    var modelDepth = characterSize;
    var bodyHeight = characterSize;

    var modelBody = this.modelBody;
    if( modelBody )
    {
        modelWidth = modelBody.getWidth();
        modelDepth = modelBody.getDepth();
        bodyHeight = modelBody.getHeight();
    }

    var modelHeight = bodyHeight;

    this.finalizeSize( modelWidth, modelDepth, modelHeight );
};


CharacterPlayerPrefab.prototype.update = function(delta)
{
    this.CharacterPlayer_update( delta );

    if( this.modelBody && !this.animationPaused )
    {
        this.modelBody.animate( delta * this.animationSpeed, this.currentActionPriority === 0 );
    }

    var sinceLastAttack;
    if( this.currentActionID === "hit" )
    {
        sinceLastAttack = gEngine.lifetime - this.lastTimeAttacked;
        if( sinceLastAttack > 0.5 )
        {
            this.setCurrentActionPriority( 0 );
            this.setIdleAnimation();
        }
    }
    else if( this.currentActionID === "ko" )
    {
        sinceLastAttack = gEngine.lifetime - this.lastTimeAttacked;
        if( sinceLastAttack > 2.0 )
        {
            this.setCurrentActionPriority( 0 );
            this.setIdleAnimation();
        }
    }
};


CharacterPlayerPrefab.prototype.setCurrentActionPriority = function(priority)
{
    this.currentActionPriority = priority;
};


CharacterPlayerPrefab.prototype.setActionID = function(actionID, priority)
{
    if( this.currentActionID !== actionID )
    {
        var actions = this.actions;
        for( var i=0; i<actions.length; ++i )
        {
            if( actions[i].actionID === actionID )
            {
                this.setActionIndex( i, priority );
                return true;
            }
        }
    }

    return false;
};


CharacterPlayerPrefab.prototype.setActionIndex = function(actionIndex, priority)
{
    if( this.currentActionIndex !== actionIndex || !this.currentActionLoaded )
    {
        if( priority === undefined )
        {
            priority = 0;
        }

        if( this.currentActionPriority === undefined )
        {
            this.currentActionPriority = 0;
        }

        if( priority >= this.currentActionPriority )
        {
            this.currentActionLoaded = false;
            this.currentActionPriority = priority;
            this.currentActionIndex = actionIndex;

            if( this.modelBody )
            {
                var action = this.actions[actionIndex];
                if( action )
                {
                    this.currentActionID = action.actionID;

                    if( actionIndex < this.actions.length )
                    {
                        var modelInfo = action.modelInfo;
                        if( modelInfo )
                        {
                            this.currentActionLoaded = true;

                            var obj = modelInfo.obj;
                            var tex = modelInfo.tex;
                            var self = this;
                            self.setupBody( obj, tex, function (model3d)
                            {
                                // Adjust model Y to fit in collision box
                                if( model3d )
                                {
                                    var modelHeight = model3d.getHeight() * self.model3DBase.scale[1];
                                    var modelShouldBeAtY = modelHeight * 0.5;
                                    var characterY = self.collisionBounds[1];
                                    model3d.setPositionY( -( characterY - modelShouldBeAtY ) * 0.5 );
                                }
                            });
                        }

                        // SFX
                        if( action.sfxInfo )
                        {
                            CCAudioManager.Play( "sfx", action.sfxInfo.mp3, true );
                        }
                    }
                }
            }
        }
    }
    return false;
};


CharacterPlayerPrefab.prototype.setupAI = function(controller)
{
    this.CharacterPlayer_setupAI( controller );
};


CharacterPlayerPrefab.prototype.setupWeapon = function(modelObj, index)
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
        weapon.setup( modelObj, false, false );
        weapon.setFireRate( 1.0 );
        weapon.setupBullet( 0.5, 10.0, false );
        weapons.insert( weapon, index );
    }
};


CharacterPlayerPrefab.prototype.readyWeapon = function(actionID)
{
    this.CharacterPlayer_readyWeapon( actionID );

    this.setActionID( actionID, 1 );
    if( this.modelBody )
    {
        this.modelBody.setAnimationFrame( 0 );
    }

    this.animationPaused = true;
};


CharacterPlayerPrefab.prototype.unReadyWeapon = function()
{
    if( this.animationPaused )
    {
        this.animationPaused = false;
    }

    this.CharacterPlayer_unReadyWeapon();
};


CharacterPlayerPrefab.prototype.shootWeapon = function(delta)
{
    if( this.animationPaused )
    {
       var weapons = this.weapons;
        for( var i=0; i<weapons.length; ++i )
        {
            var weapon = weapons[i];
            if( weapon.timeToReady < 0.25 )
            {
                this.shootingBurstTimer = 1.0;
                this.animationPaused = false;
                break;
            }
        }
    }
    return this.CharacterPlayer_shootWeapon( delta );
};


CharacterPlayerPrefab.prototype.reportAttack = function(attackedBy, attackType, force, damage, x, y, z)
{
    if( this.isActive() && this.controller )
    {
        var sinceLastAttack = gEngine.lifetime - this.lastTimeAttacked;
        this.lastTimeAttacked = gEngine.lifetime;

        this.setActionID( "hit", 2 );

        if( sinceLastAttack > 0.5 )
        {
            this.lastTimeAttacked = gEngine.lifetime;

            // Spawn hit particle
            {
                var particle = new CollideableParticle( 1.0, 2.0 );

                particle.setModel( new CCModelBase() );
                particle.setColour( new CCColour() );
                var primitive = new CCPrimitiveSquare();
                particle.model.addPrimitive( primitive );
                particle.model.setScale( 10.0 );

                primitive.setTexture( "resources/common/fx/fx_impact_texture.png", true, true );

                particle.setScene( this.inScene );
                this.ownObject( particle );

                // Position with the character
                particle.setPosition( this.position );
                particle.translate( 0.0, this.collisionBounds[1], 0.0 );

                // Rotate with the camera
                particle.setRotationY( this.sceneMap.camera.rotation[1] );
            }
        }

        this.controller.reportAttack( attackedBy, attackType, force, damage, x, y, z );
        return this.handleAttack( attackedBy, attackType, force, damage, x, y, z );
    }
    return false;
};


CharacterPlayerPrefab.prototype.handleAttack = function(attackedBy, attackType, force, damage, x, y, z)
{
    damge = damage * ( 1.0 - this.controller.damageResistance );
    return this.CharacterPlayer_handleAttack( attackedBy, attackType, force, damage, x, y, z );
};


CharacterPlayerPrefab.prototype.handleDeath = function(killer)
{
    this.lastTimeAttacked = gEngine.lifetime;
    this.setActionID( "ko", 2 );
    this.CharacterPlayer_handleDeath( killer );
};


CharacterPlayerPrefab.prototype.setIdleAnimation = function(actionID)
{
    if( actionID || !this.idleAnimationID )
    {
        if( !actionID )
        {
            actionID = "idle";
        }

        if( this.idleAnimationID !== actionID )
        {
            this.idleAnimationID = actionID;
        }
    }

    this.setActionID( this.idleAnimationID );
};


CharacterPlayerPrefab.prototype.setMovementAnimation = function(actionID)
{
    if( actionID || !this.moveAnimationID )
    {
        if( !actionID )
        {
            actionID = "move";
        }

        if( this.moveAnimationID !== actionID )
        {
            this.moveAnimationID = actionID;
        }
    }

    this.setActionID( this.moveAnimationID );
};
