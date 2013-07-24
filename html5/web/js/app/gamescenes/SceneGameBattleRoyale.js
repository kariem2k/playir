/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : SceneGameBattleRoyale.js
 * Description : Battle Royale implementation of the base game scene
 *
 * Created     : 09/10/12
 *-----------------------------------------------------------
 */

function SceneGameBattleRoyale(mapID)
{
    this.construct( mapID );
}
ExtendPrototype( SceneGameBattleRoyale, SceneGameSyndicate );


SceneGameBattleRoyale.prototype.construct = function(mapID)
{
    this.SceneGameSyndicate_construct( mapID, "BattleRoyale" );
};


SceneGameBattleRoyale.prototype.destruct = function()
{
    this.SceneGameSyndicate_destruct();
};


SceneGameBattleRoyale.prototype.deleteLater = function()
{
    this.SceneGameSyndicate_deleteLater();
};


SceneGameBattleRoyale.prototype.setup = function()
{
    this.SceneGameSyndicate_setup();
    this.camera.targetOffset[2] = 200.0;
};


SceneGameBattleRoyale.prototype.updateScene = function(delta)
{
    return this.SceneGameSyndicate_updateScene( delta );
};


SceneGameBattleRoyale.prototype.updateCameraLookAt = function(delta)
{
	var camera = this.camera;
	var playerCharacter = this.playerCharacter;
	if( playerCharacter &&
        ( camera.targetLookAt[0] !== playerCharacter.position[0] ||
          camera.targetLookAt[2] !== playerCharacter.position[2] ) )
    {
        camera.targetLookAt[0] = playerCharacter.position[0];
        camera.targetLookAt[2] = playerCharacter.position[2];
        camera.flagUpdate();
    }
};


SceneGameBattleRoyale.prototype.assignPlayerCharacter = function(character)
{
    if( this.sceneUI.setProfile )
    {
        this.sceneUI.setProfile( 0, character.getPlayerID(), character.getUserID() );
    }
    this.SceneGameSyndicate_assignPlayerCharacter( character );
};


SceneGameBattleRoyale.prototype.registerDamage = function(from, to, damage)
{
    var healthRatio;

    var playerCharacter = this.playerCharacter;
    if( to === playerCharacter )
    {
        healthRatio = playerCharacter.controller.getHealthRatio();

        this.updateHealthUI( to, healthRatio );

        // Sync with server
        var attackerCharacter = this.getEnemy( from );
        if( attackerCharacter )
        {
            if( this.sceneUI.setProfile )
            {
                this.sceneUI.setProfile( 1, attackerCharacter.getPlayerID(), attackerCharacter.getUserID() );
            }
            this.registerAmmoUpdate( attackerCharacter );

            if( !attackerCharacter.controller.isAI() )
            {
                MultiplayerManager.SyncRegisterDamage( playerCharacter.getPlayerID(), attackerCharacter.getPlayerID(), damage );
            }
        }
    }
    else if( from === playerCharacter )
    {
        // Attacking another character
        var attackedCharacter = this.getEnemy( to );
        if( attackedCharacter )
        {
            if( this.sceneUI.setProfile )
            {
                this.sceneUI.setProfile( 1, attackedCharacter.getPlayerID(), attackedCharacter.getUserID() );
            }
            this.registerAmmoUpdate( attackedCharacter );

            // Don't update health, just blink the indicator, server will update health when the attack is synced
            if( !attackedCharacter.controller.isAI() )
            {
                if( this.sceneUI.setHealth )
                {
                    this.sceneUI.setHealth( 1 );
                }
            }

            // Update health if it's an AI
            else
            {
                MultiplayerManager.SyncRegisterDamage( "ai", playerCharacter.getPlayerID(), damage );

                healthRatio = attackedCharacter.controller.getHealthRatio();
                this.updateHealthUI( attackedCharacter, healthRatio );

                if( healthRatio <= 0.0 )
                {
                    if( this.sceneUI.removeProfile )
                    {
                        this.sceneUI.removeProfile( 1 );
                    }

                    this.removeEnemy( attackedCharacter );
                }
            }
        }
    }
};
