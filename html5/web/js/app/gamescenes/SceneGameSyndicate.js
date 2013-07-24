/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : SceneGameSyndicate.js
 * Description : A game setup inspired by the Syndicate game.
 *
 * Created     : 08/10/12
 *-----------------------------------------------------------
 */

function SceneGameSyndicate(mapID, mapType)
{
    this.construct( mapID, mapType );
}
ExtendPrototype( SceneGameSyndicate, SceneGameMap );


SceneGameSyndicate.prototype.construct = function(mapID, mapType)
{
    this.playerCharacter = null;
    this.playerDestinationPending = null;
    this.playerDestinationIndicator = null;

    this.SceneGameMap_construct( mapID, mapType );
};


SceneGameSyndicate.prototype.destruct = function()
{
    if( this.playerCharacter )
    {
        this.playerCharacter.deleteLater();
        this.playerCharacter = null;
    }

    this.SceneGameMap_destruct();
};


SceneGameSyndicate.prototype.deleteLater = function()
{
    if( this.isOnlineGame() && !this.exitedGame )
    {
        if( MultiplayerManager.LoggedIn )
        {
            BurgersClient.exitedGame();
            this.exitedGame = true;
        }
    }

    this.SceneGameMap_deleteLater();
};


SceneGameSyndicate.prototype.setup = function()
{
    this.SceneGameMap_setup();

    var camera = this.camera;
    camera.targetOffset[2] = 75.0;
    camera.setRotationX( -30.0 );

    this.setupPlayerDestinationIndicator( "resources/common/fx/fx_character_highlight_texture.png",
                                          gColour.setRGBA( 0.75, 0.75, 1.0, 1.0 ) );

    this.setupUI();

    if( this.isOnlineGame() )
    {
        this.setupOnlineGame();
    }
};


SceneGameSyndicate.prototype.setupUI = function()
{
    this.sceneUI = new SceneGameUI( this );
};


SceneGameSyndicate.prototype.setupOnlineGame = function()
{
    MultiplayerManager.SyncLoadedMap();
};


SceneGameSyndicate.prototype.updateScene = function(delta)
{
    // Move the player
    if( this.playerDestinationPending )
    {
        var touch = gEngine.controls.touches[0];
        if( touch.lastTimeReleased > CCControls.DOUBLE_TAP_THRESHOLD )
        {
            if( !this.controlsMoving )
            {
                this.onGotoLocation( this.playerDestinationPending );
                this.playerDestinationPending = null;
            }
        }
    }

    if( this.playerDestinationIndicator )
    {
        var alpha = this.playerDestinationIndicator.colour.a;
        if( alpha > 0.0 )
        {
            this.playerDestinationIndicator.rotateY( delta * 720.0 );
            alpha = CC.ToTarget( alpha, 0.0, delta * 0.5 );
            this.playerDestinationIndicator.setColourAlpha( alpha );
        }
    }

    return this.SceneGameMap_updateScene( delta );
};


SceneGameSyndicate.prototype.updateCameraLookAt = function(delta)
{
    var camera = this.camera;
    var playerCharacter = this.playerCharacter;
    if( this.playerCharacter &&
        ( camera.targetLookAt[0] !== playerCharacter.position[0] ||
          camera.targetLookAt[2] !== playerCharacter.position[2] ) )
    {
        camera.targetLookAt[0] = playerCharacter.position[0];
        camera.targetLookAt[2] = playerCharacter.position[2];
        camera.flagUpdate();
    }
};


SceneGameSyndicate.prototype.updateCamera = function(delta)
{
    this.updateCameraLookAt( delta );

    var updated = false;
    var camera = this.camera;

    var lookAtSpeed = 1.5;
    if( camera.interpolateCamera( delta, lookAtSpeed ) )
    {
        updated = true;
    }
    else
    {
        if( this.cameraScrolling )
        {
            this.cameraScrolling = false;
            this.lockCameraView();
            updated = true;
        }

        if( this.resizing )
        {
            this.resizing = false;
            this.refreshCameraView();
            this.lockCameraView();
            updated = true;
        }
    }
    return updated;
};


SceneGameSyndicate.prototype.handleBackButton = function()
{
    if( this.onBack )
    {
        this.onBack();
        return true;
    }
    return false;
};


SceneGameSyndicate.prototype.updateControls = function(controls)
{
    var usingControls = this.CCSceneAppUI_updateControls( controls );

    var cameraTouches = this.camera.cameraTouches;
    var touch = cameraTouches[0];
    if( touch.x > 0.0 && touch.x < 1.0 &&
        touch.y > 0.0 && touch.y < 1.0 &&
        touch.startX > 0.0 && touch.startX < 1.0 &&
        touch.startY > 0.0 && touch.startY < 1.0 )
    {
        // Monitor our wheel deltas
        if( controls.wheel && controls.wheel.delta !== 0.0 )
        {
            var delta = controls.wheel.delta;
            this.touchCameraRotating( delta * 0.1, 0.0 );
            return true;
        }
    }

    return usingControls;
};


SceneGameSyndicate.prototype.handleOneTouch = function(touch1)
{
    var usingControls = false;

    if( this.oneTouchDoubleTapped )
    {
        if( touch1.timeHeld >= CCControls.DOUBLE_TAP_THRESHOLD )
        {
            // Hold down shooting after a double tap
            //CCVector3 plane;
            //camera.project3DY( &plane, touch1.position.x, touch1.position.y );
            //touchPlayerShootMoving( plane );
        }
    }
    else
    {
        this.touchDelta.x = touch1.deltaX;
        this.touchDelta.y = touch1.deltaY;
        if( !this.controlsMoving )
        {
            if( this.touchMovementAllowed( touch1, this.touchDelta ) )
            {
            }
            else
            {
                usingControls = this.touchPressed( touch1 );
            }
        }

        if( this.controlsMoving )
        {
            usingControls = this.touchMoving( touch1, this.touchDelta );
        }
    }

    return usingControls;
};


SceneGameSyndicate.prototype.touchPressed = function(touch)
{
};


SceneGameSyndicate.prototype.touchMoving = function(touch, touchDelta)
{
    // Callback for when a touch is moving
    // Run through all the tiles
    var result = this.handleTilesTouch( touch, this.controlsMovingVertical ? CCControls.touch_movingVertical : CCControls.touch_movingHorizontal );
    if( result === CCSceneAppUI.tile_touchAction )
    {
        return true;
    }
    else
    {
        return this.touchCameraRotating( touchDelta.x, touchDelta.y );
    }
};


SceneGameSyndicate.ProjectionLocation = vec3.create();
SceneGameSyndicate.HitPosition = vec3.create();

SceneGameSyndicate.prototype.touchReleased = function(touch, touchAction)
{
    // Find pressed tile
    var result = this.handleTilesTouch( touch, touchAction );
    var usingControls = result === CCSceneAppUI.tile_touchAction;
    if( !usingControls && touchAction === CCControls.touch_released )
    {
        var camera = this.camera;

        // Shoot
        if( this.oneTouchDoubleTapped )
        {
        }

        // Panning
        else if( this.controlsMoving )
        {
            usingControls = this.touchReleaseSwipe( touch );
        }

        // Move player or shoot instead
        else if( this.playerCharacter )
        {
            var playerCharacter = this.playerCharacter;

            if( camera.project3D( touch.x, touch.y ) )
            {
                var projectionResults = camera.projectionResults;

                // Project touch to y = 0
                var projectionLocation = SceneGameSyndicate.ProjectionLocation;
                var offset = projectionResults.vNear[1] / Math.abs( projectionResults.vDirection[1] );
                vec3.scale( projectionLocation, projectionResults.vDirection, offset );
                vec3.add( projectionLocation, projectionLocation, projectionResults.vNear );

                // Test if we're aiming at another player
                var hitObject = null;
                var collideables = this.collideables;

                // Scan to see if we're blocked by a collision
                var hitPosition = SceneGameSyndicate.HitPosition;
                hitObject = CC.BasicLineCollisionCheck( collideables,
                                                        projectionResults.vNear,
                                                        projectionResults.vFar,
                                                        hitPosition,
                                                        true,
                                                        CC.collision_character,
                                                        playerCharacter,
                                                        false );

                // Fill in the hitPosition variable if nothing has been hit
                if( hitObject )
                {
                    if( hitObject === playerCharacter )
                    {
                        hitObject = null;
                    }
                }

                // See if there's a target character closeby
                else
                {
                    hitObject = playerCharacter.controller.scanForEnemy( projectionLocation );
                }

                // Shoot at that player
                if( hitObject )
                {
                    this.onSelectObject( hitObject, projectionLocation );
                }

                // Move our player if nothing's been targetted
                else
                {
                    this.onSelectLocation( projectionLocation );
                }
            }
        }
    }

    if( this.oneTouchDoubleTappedLastPress )
    {
        this.oneTouchDoubleTappedLastPress = false;
    }

    if( this.oneTouchDoubleTapped )
    {
        this.oneTouchDoubleTappedLastPress = true;
        this.oneTouchDoubleTapped = false;
    }

    return usingControls;
};


SceneGameSyndicate.prototype.setupPlayerDestinationIndicator = function(textureFile, colour)
{
    if( this.playerDestinationIndicator )
    {
        this.playerDestinationIndicator.deleteLater();
    }
    this.playerDestinationIndicator = new CollideableIndicator( this, textureFile );
    this.playerDestinationIndicator.setWidth( this.mapBounds.width * 0.1 );
    this.playerDestinationIndicator.setColour( colour );
};


SceneGameSyndicate.prototype.handlePickup = function(player, pickup)
{
    // Server will handle pickup health update
    if( this.isOnlineGame() )
    {
        if( player === this.playerCharacter )
        {
            MultiplayerManager.SyncServerRegisterPickup( player.getPlayerID(), pickup.getType(), pickup.getID() );
        }
    }
    else
    {
        player.controller.resetHealth();
        var healthRatio = player.controller.getHealthRatio();
        this.updateHealthUI( player, healthRatio );
    }

    return this.SceneGameMap_handlePickup( player, pickup );
};


SceneGameSyndicate.prototype.assignPlayerCharacter = function(character)
{
    character.setupShootingIndicator( "resources/common/fx/fx_character_shooting_texture.png",
                                      gColour.setRGBA( 1.0, 0.5, 0.0, 0.9 ) );

    character.setupCharacterIndicator( "resources/common/fx/fx_character_highlight_texture.png",
                                       gColour.setRGBA( 0.5, 0.75, 1.0, 0.5 ) );

    this.playerCharacter = character;

    this.SceneGameMap_assignPlayerCharacter( character );
};


SceneGameSyndicate.prototype.registerAttacking = function(attacker)
{
    if( this.sceneUI.setFire )
    {
        if( attacker === this.playerCharacter )
        {
            this.sceneUI.setFire( 0 );
        }
        else
        {
            var enemy = this.getEnemy( attacker );
            if( enemy )
            {
                if( this.sceneUI.getProfilePlayerID )
                {
                    if( this.sceneUI.getProfilePlayerID( 1 ) === enemy.getPlayerID() )
                    {
                        this.sceneUI.setFire( 1 );
                    }
                }
            }
        }
    }
};


SceneGameSyndicate.prototype.registerAmmoUpdate = function(player)
{
    var ammo;

    if( this.sceneUI.setAmmo )
    {
        if( this.sceneUI.getProfilePlayerID( 0 ) === player.getPlayerID() )
        {
            ammo = player.getWeaponAmmo();
            this.sceneUI.setAmmo( 0, ammo );
        }
        else if( this.sceneUI.getProfilePlayerID( 1 ) === player.getPlayerID() )
        {
            ammo = player.getWeaponAmmo();
            this.sceneUI.setAmmo( 1, ammo );
        }
    }
};


SceneGameSyndicate.prototype.playerShootAt = function(object, sync)
{
    this.playerCharacter.controller.shootAt( object );
    if( sync )
    {
        if( this.isOnlineGame() )
        {
            var enemy = this.getEnemy( object );
            if( enemy )
            {
                MultiplayerManager.SyncServerPlayerShootAt( this, object.getPlayerID() );
            }
        }
    }
};


SceneGameSyndicate.prototype.playerAction = function(actionID, sync)
{
    this.playerCharacter.controller.shoot( null, null, actionID );

    if( sync === undefined )
    {
        sync = true;
    }
    if( sync )
    {
        if( this.isOnlineGame() )
        {
            MultiplayerManager.SyncPlayerAction( this, actionID );
        }
    }
};


// When a user selects an object
SceneGameSyndicate.prototype.onSelectObject = function(hitObject, hitPosition)
{
    this.playerShootAt( hitObject, true );
};


// When a user selects an unoccupied location
SceneGameSyndicate.PlayerDestinationPending = vec3.create();
SceneGameSyndicate.prototype.onSelectLocation = function(location)
{
    if( !this.playerDestinationPending )
    {
        this.playerDestinationPending = SceneGameSyndicate.PlayerDestinationPending;
    }
    var playerDestinationPending = this.playerDestinationPending;
    vec3.copy( playerDestinationPending, location );

    // Clamp to map area
    var mapBounds = this.mapBounds;
    playerDestinationPending[0] = CC.FloatClamp( playerDestinationPending[0], -mapBounds.width, mapBounds.width );
    playerDestinationPending[2] = CC.FloatClamp( playerDestinationPending[2], -mapBounds.height, mapBounds.height );

    // Show our movement indicator
    if( this.playerDestinationIndicator )
    {
        this.playerDestinationIndicator.setPositionXZ( playerDestinationPending[0], playerDestinationPending[2] );
        this.playerDestinationIndicator.setColourAlpha( 1.0 );
    }
};


// When a movement is about to be made
SceneGameSyndicate.prototype.onGotoLocation = function(location, sync)
{
    var locationTarget = this.playerCharacter.controller.goToScan( location );

    if( sync === undefined )
    {
        sync = true;
    }
    if( sync )
    {
        if( this.isOnlineGame() )
        {
            MultiplayerManager.SyncServerPlayerGotoLocation( this, locationTarget );
        }
    }

    //camera.targetLookAt = *playerDestinationPending;
    //camera.flagUpdate();
};


SceneGameSyndicate.prototype.updateHealthUI = function(player, health)
{
    if( player === this.playerCharacter )
    {
        if( this.sceneUI.setHealth )
        {
            this.sceneUI.setHealth( 0, health );
        }
    }
    else
    {
        if( this.sceneUI.setHealth )
        {
            if( this.sceneUI.getProfilePlayerID )
            {
                if( this.sceneUI.getProfilePlayerID( 1 ) === player.getPlayerID() )
                {
                    this.sceneUI.setHealth( 1, health );
                }
            }
        }
    }
};
