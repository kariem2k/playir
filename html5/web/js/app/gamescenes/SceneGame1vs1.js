/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : SceneGame1vs1.js
 * Description : Deathmatch implementation of the base game scene
 *
 * Created     : 09/10/12
 *-----------------------------------------------------------
 */

function SceneGame1vs1(mapID)
{
    this.construct( mapID, "1vs1" );
}
ExtendPrototype( SceneGame1vs1, SceneGameSyndicate );

SceneGame1vs1.GameState_Loading = 0;
SceneGame1vs1.GameState_Intro = 1;
SceneGame1vs1.GameState_Playing = 2;
SceneGame1vs1.GameState_Win = 3;
SceneGame1vs1.GameState_Lose = 4;


SceneGame1vs1.prototype.construct = function(mapID, mapType)
{
    this.SceneGameSyndicate_construct( mapID, mapType );

	this.setGameState( SceneGame1vs1.GameState_Loading );
    this.playTime = 60.0;
};


SceneGame1vs1.prototype.destruct = function()
{
    this.SceneGameSyndicate_destruct();
};


SceneGame1vs1.prototype.deleteLater = function()
{
    this.SceneGameSyndicate_deleteLater();
};


// Called after our constructor is called
SceneGame1vs1.prototype.setup = function()
{
    this.SceneGameSyndicate_setup();
};


// // CCSceneBase
SceneGame1vs1.prototype.updateScene = function(delta)
{
    this.gameStateTime += delta;

    this.updateGameState( delta );

    return this.SceneGameSyndicate_updateScene( delta );
};


SceneGame1vs1.prototype.updateCameraLookAt = function(delta)
{
	var camera = this.camera;
	var enemies = this.enemies;
    var enemy = enemies.first();
    var playerCharacter = this.playerCharacter;

    var distance, offset;

    if( this.gameState === SceneGame1vs1.GameState_Intro )
    {
        if( this.gameStateTime < 1.0 )
        {
            vec3.copy( camera.targetLookAt, [ 0, 0, 0 ] );
            distance = CC.Vector3Distance2D( playerCharacter.position, enemy.position, false );
            offset = camera.calcCameraOffsetForWidth( distance * 2.0 );
            camera.targetOffset[2] = offset;
            camera.flagUpdate();
            camera.interpolateCamera( CC_MAXFLOAT, CC_MAXFLOAT );
        }
        else if( this.gameStateTime < 3.0 )
        {
            if( enemy )
            {
                if( sceneManagerGame )
                {
                    sceneManagerGame.showPlayer2( enemy );
                }

                vec3.copy( camera.targetLookAt, enemy.position );
            }
            camera.flagUpdate();
            camera.targetOffset[2] = 60.0;
            camera.interpolateCamera( CC_MAXFLOAT, CC_MAXFLOAT );

            camera.incrementRotationY( delta * 90.0 );
        }
        else if( this.gameStateTime < 5.0 )
        {
            if( sceneManagerGame )
            {
                sceneManagerGame.showPlayer1( playerCharacter );
            }

            vec3.copy( camera.targetLookAt, playerCharacter.position );
            camera.flagUpdate();
            camera.interpolateCamera( CC_MAXFLOAT, CC_MAXFLOAT );

            camera.incrementRotationY( delta * 90.0 );
        }
        else
        {
            if( sceneManagerGame )
            {
                sceneManagerGame.hideSplashScreen();
            }

            vec3.copy( camera.targetLookAt, [ 0, 0, 0 ] );
            distance = CC.Vector3Distance2D( playerCharacter.position, enemy.position, false );
            offset = camera.calcCameraOffsetForWidth( distance * 2.0 );
            camera.targetOffset[2] = offset;
            camera.flagUpdate();
            camera.interpolateCamera( CC_MAXFLOAT, CC_MAXFLOAT );

            camera.setRotationY( 0.0 );
        }
    }
    else if( this.gameState === SceneGame1vs1.GameState_Playing )
    {
        // Determine distance between players
        if( playerCharacter )
        {
            if( enemies.length > 0 )
            {
                distance = CC.Vector3Distance2D( playerCharacter.position, enemy.position, false );

                // Look inbetween players
                var hDistance = distance * 0.5;
                var direction = CC.Vector3Direction( playerCharacter.position, enemy.position );
                vec3.scale( direction, direction, hDistance );

                vec3.copy( camera.targetLookAt, playerCharacter.position );
                vec3.add( camera.targetLookAt, camera.targetLookAt, direction );
                camera.flagUpdate();

                // Set offset
                camera.targetOffset[2] = camera.calcCameraOffsetForWidth( distance * 1.75 );
                camera.targetOffset[2] = CC.FloatClamp( camera.targetOffset[2], 100.0, 300.0 );
            }
            else
            {
                if( camera.targetLookAt[0] !== playerCharacter.position[0] ||
                    camera.targetLookAt[2] !== playerCharacter.position[2] )
                {
                    camera.targetLookAt[0] = playerCharacter.position[0];
                    camera.targetLookAt[2] = playerCharacter.position[2];
                    camera.flagUpdate();
                }

                if( camera.targetOffset[2] !== 120.0 )
                {
                    camera.targetOffset[2] = 120.0;
                }
            }
        }
    }
};


SceneGame1vs1.prototype.touchReleased = function(touch, touchAction)
{
    if( this.gameState !== SceneGame1vs1.GameState_Playing )
    {
        return false;
    }

    return this.SceneGameSyndicate_touchReleased( touch, touchAction );
};


SceneGame1vs1.prototype.syncAddPlayer = function(playerID, userID, playerType, location, health, jsonData)
{
    this.SceneGameMap_syncAddPlayer( playerID, userID, playerType, location, health );

    if( this.getNumberOfPlayers() >= 2 )
    {
        this.startIntro();

        var timer = jsonData.timer;
        this.setTimer( timer );
    }
};


SceneGame1vs1.prototype.assignPlayerCharacter = function(character)
{
    this.sceneUI.setProfile( 0, character.getPlayerID(), character.getUserID() );
    this.SceneGameSyndicate_assignPlayerCharacter( character );
};


SceneGame1vs1.prototype.addEnemy = function(character)
{
    this.sceneUI.setProfile( 1, character.getPlayerID(), character.getUserID() );
    this.SceneGameSyndicate_addEnemy( character );
};


SceneGame1vs1.prototype.registerDamage = function(from, to, damage)
{
    if( this.gameState === SceneGame1vs1.GameState_Playing )
    {
        var playerCharacter = this.playerCharacter;
        var enemy, healthRatio;

        if( this.isOnlineGame() )
        {
            if( to === playerCharacter )
            {
                healthRatio = playerCharacter.controller.getHealthRatio();
                this.sceneUI.setHealth( 0, healthRatio );

                // Sync with server
                var attackerCharacter = this.getEnemy( from );
                if( attackerCharacter )
                {
                    MultiplayerManager.SyncRegisterDamage( playerCharacter.getPlayerID(), attackerCharacter.getPlayerID(), damage );
                }
            }
            else
            {
                // Attacking another character
                enemy = this.getEnemy( to );
                if( enemy )
                {
                    // Don't update health, just blink the indicator, server will update health when the attack is synced
                    this.sceneUI.setHealth( 1 );
                }
            }
        }

        // Offline games
        else
        {
            // Sync with server
            enemy = this.getEnemy( to );
            if( enemy )
            {
                // Sync damage with server for points system
                MultiplayerManager.SyncRegisterDamage( "ai", playerCharacter.getPlayerID(), damage );

                healthRatio = enemy.controller.getHealthRatio();
                this.sceneUI.setHealth( 1, healthRatio );
                if( healthRatio <= 0.0 )
                {
                    if( sceneManagerGame )
                    {
                        sceneManagerGame.matchResult( true );
                    }
                }
            }
        }
    }
};


SceneGame1vs1.prototype.gameStarted = function()
{
    return this.gameState === SceneGame1vs1.GameState_Playing;
};


SceneGame1vs1.prototype.startIntro = function()
{
    if( this.gameState !== SceneGame1vs1.GameState_Intro )
    {
        this.setGameState( SceneGame1vs1.GameState_Intro );
    }
};


SceneGame1vs1.prototype.startPlaying = function()
{
    if( this.gameState !== SceneGame1vs1.GameState_Playing )
    {
        this.setGameState( SceneGame1vs1.GameState_Playing );
    }
};


SceneGame1vs1.prototype.startWinning = function()
{
    if( this.gameState !== SceneGame1vs1.GameState_Win )
    {
        this.setGameState( SceneGame1vs1.GameState_Win );
        this.sceneUI.win();
    }
};


SceneGame1vs1.prototype.startLosing = function()
{
    if( this.gameState !== SceneGame1vs1.GameState_Lose )
    {
        this.setGameState( SceneGame1vs1.GameState_Lose );
        this.sceneUI.lose();
    }
};


SceneGame1vs1.prototype.updateGameState = function(timeDelta)
{
    //gameManager.update( delta );

    if( this.gameState < SceneGame1vs1.GameState_Win )
    {
        if( this.playTime > 0.0 )
        {
            this.playTime -= timeDelta;
            this.sceneUI.setTime( this.playTime );
        }
    }

    var camera = this.camera;
    var enemies = this.enemies;
    var enemy = enemies.first();
    var playerCharacter = this.playerCharacter;

    var location;

    if( this.gameState === SceneGame1vs1.GameState_Intro )
    {
        if( this.gameStateTime > 5.0 )
        {
            if( this.gameStateTime < 7.0 )
            {
                if( this.gameStateFlag === 0 )
                {
                    this.gameStateFlag = 1;
                    {
                        location = vec3.clone( playerCharacter.position );
                        if( location[0] < 0.0 )
                        {
                            location[0] += CC_SMALLFLOAT;
                        }
                        else
                        {
                            location[0] -= CC_SMALLFLOAT;
                        }
                        location[2] += CC_SMALLFLOAT;
                        location[1] = 0.0;
                        playerCharacter.controller.goToScan( location );
                    }

                    if( enemy )
                    {
                        location = vec3.clone( enemy.position );
                        if( location[0] < 0.0 )
                        {
                            location[0] += CC_SMALLFLOAT;
                        }
                        else
                        {
                            location[0] -= CC_SMALLFLOAT;
                        }
                        location[2] += CC_SMALLFLOAT;
                        location[1] = 0.0;
                        enemy.controller.goToScan( location );
                    }
                }
                else
                {
                    {
                        location = vec3.clone( playerCharacter.position );
                        location[2] += CC_SMALLFLOAT;
                        location[1] = 0.0;
                        playerCharacter.controller.shoot( location );
                        playerCharacter.rechargeWeapon();
                    }

                    if( enemy )
                    {
                        location = vec3.clone( enemy.position );
                        location[1] = 0.0;
                        location[2] += CC_SMALLFLOAT;
                        enemy.controller.shoot( location );
                        enemy.rechargeWeapon();
                    }
                }
            }
            else
            {
                this.sceneUI.fight();
                this.startPlaying();

                // Enable players
                var players = this.players;
                for( var i=0; i<players.length; ++i )
                {
                    var player = players[i];
                    player.controller.enable( true );
                    player.rechargeWeapon();
                }
            }
        }
    }
    else if( this.gameState === SceneGame1vs1.GameState_Playing )
    {
    }
    else if( this.gameState === SceneGame1vs1.GameState_Win )
    {
        camera.incrementRotationY( timeDelta * 90.0 );
        camera.flagUpdate();
        camera.targetOffset[2] = 60.0;

        this.playerShootAt( enemy, false );

        if( this.gameStateTime < 2.0 )
        {
            if( playerCharacter )
            {
                vec3.copy( camera.targetLookAt, playerCharacter.position );
            }
        }
        else if( this.gameStateTime < 3.5 )
        {
            if( enemy )
            {
                vec3.copy( camera.targetLookAt, enemy.position );
            }
        }
        else if( this.gameStateTime < 5.0 )
        {
            if( playerCharacter )
            {
                vec3.copy( camera.targetLookAt, playerCharacter.position );
            }
        }
        else
        {
            if( sceneManagerGame )
            {
                sceneManagerGame.matchEnd();
            }
        }
    }
    else if( this.gameState === SceneGame1vs1.GameState_Lose )
    {
        camera.incrementRotationY( timeDelta * 90.0 );
        camera.flagUpdate();
        camera.targetOffset[2] = 60.0;

        if( enemy )
        {
            enemy.controller.shootAt( playerCharacter );
        }

        if( this.gameStateTime < 2.0 )
        {
            if( playerCharacter )
            {
                vec3.copy( camera.targetLookAt, playerCharacter.position );
            }
        }
        else if( this.gameStateTime < 3.5 )
        {
            if( enemy )
            {
                vec3.copy( camera.targetLookAt, enemy.position );
            }
        }
        else if( this.gameStateTime < 5.0 )
        {
            if( playerCharacter )
            {
                vec3.copy( camera.targetLookAt, playerCharacter.position );
            }
        }
        else
        {
            if( sceneManagerGame )
            {
                sceneManagerGame.matchEnd();
            }
        }
    }
};


SceneGame1vs1.prototype.setTimer = function(time)
{
    this.playTime = time;
    this.sceneUI.setTime( this.playTime );
};


SceneGame1vs1.prototype.setGameState = function(state)
{
    this.gameState = state;
    this.gameStateTime = 0.0;
    this.gameStateFlag = 0;
};
