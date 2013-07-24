/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : SceneGameMap.js
 * Description : A scene which holds a map and players.
 *
 * Created     : 19/11/12
 *-----------------------------------------------------------
 */

function SceneGameMap(mapID, mapType)
{
    this.construct( mapID, mapType );
}
ExtendPrototype( SceneGameMap, CCSceneAppUI );


SceneGameMap.DefaultMapImage = "resources/common/levels/level_map_diffuse.jpg";


SceneGameMap.prototype.construct = function(mapID, mapType)
{
    MultiplayerManager.UpdateCallbacks.insert( this, 0 );

    this.CCSceneAppUI_construct();

    this.cameraCentered = true;
    this.oneTouchDoubleTapped = this.oneTouchDoubleTappedLastPress = false;
    this.controlsRotationVelocity = 0.0;

    this.setMapID( mapID );
    this.mapType = mapType;

    this.mapBounds = new CCSize();
    this.ground = null;
    this.walls = [];

    this.players = [];
    this.enemies = [];

    this.particles = [];
    this.staticObjects = [];
    this.pickups = [];

    this.createCamera();

    {
        // Initialize our path finder
        this.pathFinderNetwork = new CCPathFinderNetwork();

        this.ground = new CollideableFloor( this, "ground" );
        this.ground.setWriteDepth( false );
        this.ground.setDrawOrder( 50 );
        this.setMapSize( 500.0 );
    }

    if( MultiplayerManager.LoggedIn )
    {
        this.syncLoggedIn();
    }

    gEngine.addScene( this );
};


SceneGameMap.prototype.createCamera = function()
{
    var camera = gEngine.newSceneCamera( this, 0 );
    camera.setupViewport( 0.0, 0.0, 1.0, 1.0 );
    camera.useSceneCollideables( this );
};


SceneGameMap.prototype.setup = function()
{
    this.createEnvironment();

    this.lockCameraView();
    this.refreshCameraView();
};


SceneGameMap.prototype.setMapTexture = function(filename)
{
    if( this.ground )
    {
        this.ground.primitive.setTexture( filename );
    }
};


SceneGameMap.prototype.setMapSize = function(size)
{
    this.mapSize = size;

    var mapBounds = this.mapBounds;
    mapBounds.width = this.mapSize * 0.5 * 0.8;
    mapBounds.height = this.mapSize * 0.5 * 0.8;

    this.ground.setup( this.mapSize, this.mapSize );

    // Walls
    {
        var walls = this.walls;
        if( walls.length > 0 )
        {
            for( var i=0; i<walls.length; ++i )
            {
                walls[i].deleteLater();
            }
            walls.length = 0;
        }

        {
            var x = this.mapSize * 0.5;
            var z = this.mapSize * 0.5;
            var width = this.mapSize;
            var depth = this.mapSize;
            var height = 20.0;

            // Left
            var wall = new CollideableWall();
            wall.setup( this, -x, 0.0, depth, height );
            wall.translate( -wall.collisionBounds[0], 0.0, 0.0 );
            walls.add( wall );

            // Right
            wall = new CollideableWall();
            wall.setup( this, x, 0.0, depth, height );
            wall.translate( wall.collisionBounds[0], 0.0, 0.0 );
            walls.add( wall );

            // Back
            wall = new CollideableWall();
            wall.setup( this, 0.0, -z, width, height );
            wall.translate( 0.0, 0.0, -wall.collisionBounds[2] );
            walls.add( wall );

            // Front
            wall = new CollideableWall();
            wall.setup( this, 0.0, z, width, height );
            wall.translate( 0.0, 0.0, wall.collisionBounds[2] );
            walls.add( wall );
        }
    }

    this.refreshCameraView();
};


SceneGameMap.prototype.updateScene = function(delta)
{
    {
        var particles = this.particles;

        var positive = 1.0;
        for( var i=0; i<particles.length; ++i )
        {
            //positive *= -1.0;
            var particle = particles[i];
            particle.rotateY( delta * 2.5 * positive );
        }
    }

    if( this.controlsRotationVelocity )
    {
        this.controlsRotationVelocity = CC.ToTarget( this.controlsRotationVelocity, 0.0, delta * 0.1 );
        this.camera.incrementRotationY( -this.controlsRotationVelocity * 20.0 );
    }

    if( this.cameraRotationTarget )
    {
        var camera = this.camera;
        camera.setRotationX( CC.ToRotation( camera.rotation[0], this.cameraRotationTarget[0], delta * 45.0 ) );
        camera.setRotationY( CC.ToRotation( camera.rotation[1], this.cameraRotationTarget[1], delta * 45.0 ) );
        camera.setRotationZ( CC.ToRotation( camera.rotation[2], this.cameraRotationTarget[2], delta * 45.0 ) );

        if( vec3.equals( camera.rotation, this.cameraRotationTarget ) )
        {
            delete this.cameraRotationTarget;
        }
    }

    return this.CCSceneAppUI_updateScene( delta );
};


SceneGameMap.prototype.render = function(camera, pass, alpha)
{
    if( this.camera === camera )
    {
        this.CCSceneAppUI_render( camera, pass, alpha );
    }
};


SceneGameMap.prototype.postRender = function(camera, pass, alpha)
{
    if( this.camera === camera )
    {
        if( pass === CCRenderer.render_main && alpha )
        {
            if( CC.HasFlag( gRenderer.renderFlags, CCRenderer.render_pathFinder ) )
            {
                this.pathFinderNetwork.view();
            }
        }
    }
};


SceneGameMap.prototype.resize = function()
{
    var camera = this.camera;
    CC.ASSERT( camera );
    camera.recalcViewport();
    camera.flagUpdate();
};


SceneGameMap.prototype.handleOneTouch = function(touch1)
{
    var usingControls = false;

    // // Disable double tap checks
    // if( false && !oneTouchDoubleTappedLastPress )
    // {
    //     if( touch1.lastTimeReleased < CCControls.DOUBLE_TAP_THRESHOLD )
    //     {
    //         if( fabsf( touch1.lastTotalDelta.x ) < CCControls.TouchMovementThreashold.x &&
    //             fabsf( touch1.lastTotalDelta.y ) < CCControls.TouchMovementThreashold.y )
    //         {
    //             oneTouchDoubleTapped = true;
    //         }
    //         DELETE_POINTER( playerDestinationPending );
    //     }
    // }

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
        if( !this.controlsMoving && this.controlsFirstTouchedInThisScene )
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


SceneGameMap.prototype.touchPressed = function(touch)
{
};


SceneGameMap.prototype.touchMovementAllowed = function(touch, touchDelta)
{
    var absDeltaX = Math.abs( touch.totalDeltaX );
    var absDeltaY = Math.abs( touch.totalDeltaY );
    if( absDeltaX > CCControls.TouchMovementThreashold.x || absDeltaY > CCControls.TouchMovementThreashold.y )
    {
        this.controlsMoving = true;
        touchDelta.x += touch.totalDeltaX;
        touchDelta.y += touch.totalDeltaY;

        this.controlsMovingVertical = absDeltaY > absDeltaX;

        var camera = this.camera;
        var plane = vec3.create();
        camera.project3DY( plane, touch.x, touch.y );
        vec3.subtract( plane, plane, camera.currentLookAt );
        this.cameraPanningFrom = plane;
        return true;
    }
    return false;
};


SceneGameMap.prototype.touchMoving = function(touch, touchDelta)
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
        return this.touchCameraMoving( touchDelta.x, touchDelta.y );
    }
};


SceneGameMap.prototype.touchReleased = function(touch, touchAction)
{
    // Find pressed tile
    var result = this.handleTilesTouch( touch, touchAction );
    var usingControls = ( result === CCSceneAppUI.tile_touchAction );
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


SceneGameMap.prototype.touchCameraMoving = function(x, y)
{
    var camera = this.camera;

    var updated = false;
    var delta;
    if( y !== 0.0 )
    {
        delta = y * camera.cameraHeight;
        if( camera.targetLookAt[1] > this.sceneTop || camera.targetLookAt[1] < this.sceneBottom )
        {
            delta *= 0.5;
        }
        camera.targetLookAt[2] -= delta;
        camera.flagUpdate();
        updated = true;
    }

    if( x !== 0.0 )
    {
        delta = x * camera.cameraWidth;
        if( camera.targetLookAt[0] < this.sceneLeft || camera.targetLookAt[0] > this.sceneRight )
        {
            delta *= 0.5;
        }
        camera.targetLookAt[0] -= delta;
        camera.flagUpdate();
        updated = true;
    }
    return updated;
};


SceneGameMap.prototype.touchCameraRotating = function(x, y)
{
    // Callback for when panning the camera to rotate
    var camera = this.camera;
    camera.incrementRotationY( -x * 90.0 );
    return true;
};


SceneGameMap.prototype.touchReleaseSwipe = function(touch)
{
    var camera = this.camera;
    var timeHeldMultiplyer = ( ( touch.timeHeld - 0.5 ) * -1.0 ) * 2.0 * 2.0;
    if( timeHeldMultiplyer < 1 )
    {
        timeHeldMultiplyer = 1;
    }

    {
        var averageDeltas = touch.averageLastDeltas();
        if( touch.totalDeltaX < 0.0 )
        {
            if( this.controlsRotationVelocity > 0.0 )
            {
                this.controlsRotationVelocity = 0.0;
            }
            this.controlsRotationVelocity += averageDeltas.x * timeHeldMultiplyer;
            if( this.controlsRotationVelocity < -0.1 )
            {
                this.controlsRotationVelocity = -0.1;
            }
            return true;
        }
        else if( touch.totalDeltaX > 0.0 )
        {
            if( this.controlsRotationVelocity < 0.0 )
            {
                this.controlsRotationVelocity = 0.0;
            }
            this.controlsRotationVelocity += averageDeltas.x * timeHeldMultiplyer;
            if( this.controlsRotationVelocity > 0.1 )
            {
                this.controlsRotationVelocity = 0.1;
            }
            return true;
        }
    }
    return false;
};


SceneGameMap.prototype.refreshCameraView = function()
{
    var mapBounds = this.mapBounds;
    this.sceneLeft = -mapBounds.width;
    this.sceneRight = mapBounds.width;
    this.sceneTop = mapBounds.height;
    this.sceneBottom = -mapBounds.height;
};


SceneGameMap.prototype.lockCameraView = function()
{
    if( this.cameraScrolling )
    {
        return;
    }

    var camera = this.camera;
    if( camera.targetLookAt[0] > this.sceneRight )
    {
        camera.targetLookAt[0] = this.sceneRight;
        camera.flagUpdate();
    }
    else if( camera.targetLookAt[0] < this.sceneLeft )
    {
        camera.targetLookAt[0] = this.sceneLeft;
        camera.flagUpdate();
    }

    if( camera.targetLookAt[2] > this.sceneTop )
    {
        camera.targetLookAt[2] = this.sceneTop;
        camera.flagUpdate();
    }
    else if( camera.targetLookAt[2] < this.sceneBottom )
    {
        camera.targetLookAt[2] = this.sceneBottom;
        camera.flagUpdate();
    }
};


SceneGameMap.prototype.setMapID = function(mapID)
{
    this.mapID = mapID;
};


SceneGameMap.prototype.getMapID = function()
{
    return this.mapID;
};


SceneGameMap.prototype.setOffline = function()
{
    this.setMapID( "" );
};


SceneGameMap.prototype.isOnlineGame = function()
{
    if( this.mapID && this.mapID.length > 0 )
    {
        return true;
    }
    return false;
};


SceneGameMap.prototype.getMapType = function()
{
    return this.mapType;
};


SceneGameMap.prototype.createEnvironment = function()
{
    var self = this;

    this.setMapTexture( SceneGameMap.DefaultMapImage );

    // Particles
    {
        var commonLevelsPath = "resources/common/levels/level_";
        var objFile = commonLevelsPath;
        objFile += "particles.obj";

        var texFile = commonLevelsPath;
        texFile += "particles_diffuse.png";

        var object;

        {
            object = new CCObject();
            object.setScene( this );
            object.setColour( gColour.set( 1.0 ) );
            CCModel3D.CacheModel( objFile, false, function(model3d)
            {
                model3d.setTexture( texFile );

                var model = new CCModelBase();
                model.addModel( model3d );
                object.setModel( model );

                object.setTransparent();
                object.setReadDepth( false );

                // Adjust model size
                var modelWidth = model3d.getWidth();
                var scaleFactor = self.ground.collisionSize.width / modelWidth;
                model.setScale( scaleFactor );
                self.particles.add( object );
            });
        }
        {
            object = new CCObject();
            object.setScene( this );
            object.setColour( gColour.set( 1.0 ) );
            object.rotateY( 90.0 );

            CCModel3D.CacheModel( objFile, false, function(model3d)
            {
                model3d.setTexture( texFile );

                var model = new CCModelBase();
                model.addModel( model3d );
                object.setModel( model );

                object.setTransparent();
                object.setReadDepth( false );

                // Adjust model size
                var modelWidth = model3d.getWidth();
                var scaleFactor = self.ground.collisionSize.width / modelWidth;
                model.setScale( scaleFactor );
                self.particles.add( object );
            });
        }
    }
};


SceneGameMap.prototype.updatePathFinder = function()
{
    // Recalculate our connections
    this.pathFinderNetwork.connect();

    var i;
    var players = this.players;

    // Ensure our dynamic objects arent colliding with our newly spawned mesh
    for( i=0; i<players.length; ++i )
    {
        this.adjustCollisionPlacement( players[i] );
    }

    // All moving players must re-path
    for( i=0; i<players.length; ++i )
    {
        var player = players[i];
        var controller = player.controller;
        if( controller )
        {
            controller.resetPathNodes();
        }
    }
};


SceneGameMap.prototype.adjustCollisionPlacement = function(source)
{
    if( source.position[1] < source.collisionBounds[1] )
    {
        source.setPositionY( source.collisionBounds[1] );
    }

    var collisionFlags = CC.collision_static | CC.collision_character;
    var collision = null;
    do
    {
        CC.UpdateCollisions( source, false );
        collision = CC.CollideableScan( source.aabbMin, source.aabbMax, source, collisionFlags );
        if( collision )
        {
            source.translate( 0.0, 0.0, 10.0 );
        }
    } while( collision );
};


SceneGameMap.prototype.spawnStaticObject = function(objectID, obj, tex, options, width, rotation, location)
{
    var object = new CCCollideableStaticMesh( objectID );
    object.setScene( this );

    object.setTransparent();
    object.setDrawOrder( 99 );
    object.setPositionXZ( location[0], location[2] );

    object.setupModel( obj, tex, width );

    if( options )
    {
        if( options.modelID )
        {
            object.modelID = options.modelID;
        }
        if( options.noCulling !== undefined )
        {
            object.setCulling( !options.noCulling );
        }
    }

    // Rotate as models initially face towards the camera +z
    object.model.rotateY( rotation );

    this.staticObjects.add( object );

    this.pathFinderNetwork.addCollideable( object, this.ground.collisionBounds );
    this.updatePathFinder();

    return object;
};


SceneGameMap.prototype.getStaticObject = function(objectID)
{
    var staticObjects = this.staticObjects;
    for( var i=0; i<staticObjects.length; ++i )
    {
        var object = staticObjects[i];
        if( object.getID() === objectID )
        {
            return object;
        }
    }

    return null;
};


SceneGameMap.prototype.spawnPickup = function(name, type, pickupID)
{
    var pickup = new PickupBase( name, type, pickupID );

    var path = "resources/common/pickups/";
    path += name;

    var objPath = path;
    objPath += ".obj";
    var texPath = path;
    texPath += "_diffuse.jpg";

    pickup.setup( objPath, texPath );
    pickup.setScene( this );

    this.adjustCollisionPlacement( pickup );

    this.pickups.add( pickup );

    return pickup;
};


SceneGameMap.prototype.handlePickup = function(player, pickup)
{
    pickup.deleteLater();
    this.pickups.remove( pickup );

    return true;
};


SceneGameMap.prototype.spawnCharacter = function(type, playerID, userID)
{
    if( playerID === undefined )
    {
        playerID = "0";
    }
    if( userID === undefined )
    {
        userID = playerID;
    }

    var character = SceneManagerPlay.SpawnCharacter( type );
    character.setupMap( this, playerID, userID );

    this.adjustCollisionPlacement( character );

    character.setupAI( new CharacterControllerPlayer( this.pathFinderNetwork ) );

    this.players.add( character );

    return character;
};


SceneGameMap.prototype.spawnedCharacter = function(character)
{
};


SceneGameMap.prototype.deletingCharacter = function(character)
{
    this.players.remove( character );
    this.enemies.remove( character );
};


SceneGameMap.prototype.assignPlayerCharacter = function(character)
{
    this.registerAmmoUpdate( character );

    this.spawnedCharacter( character );
};


SceneGameMap.prototype.addEnemy = function(character)
{
    character.setupShootingIndicator( "resources/common/fx/fx_character_shooting_texture.png",
                                      gColour.setRGBA( 1.0, 0.5, 0.0, 0.9 ) );

    character.setupCharacterIndicator( "resources/common/fx/fx_character_highlight_texture.png",
                                       gColour.setRGBA( 1.0, 0.25, 0.25, 0.5 ) );

    this.enemies.add( character );

    this.registerAmmoUpdate( character );

    this.spawnedCharacter( character );
};


SceneGameMap.prototype.removeEnemy = function(enemy)
{
    this.removeEnemyID( enemy.getPlayerID() );
};


SceneGameMap.prototype.removeEnemyID = function(playerID)
{
    var enemies = this.enemies;
    for( var i=0; i<enemies.length; ++i )
    {
        var enemy = enemies[i];
        if( playerID === enemy.getPlayerID() )
        {
            enemy.deleteLater();
            enemies.remove( enemy );
            break;
        }
    }
};


SceneGameMap.prototype.getPlayer = function(object)
{
    var players = this.players;
    var length = players.length;
    for( var i=0; i<length; ++i )
    {
        var player = players[i];
        if( player === object )
        {
            return player;
        }
    }

    return null;
};


SceneGameMap.prototype.getPlayerFromID = function(playerID)
{
    var players = this.players;
    var length = players.length;
    for( var i=0; i<length; ++i )
    {
        var player = players[i];
        if( player.getPlayerID() === playerID )
        {
            return player;
        }
    }

    return null;
};


SceneGameMap.prototype.getEnemy = function(object)
{
    var enemies = this.enemies;
    var length = enemies.length;
    for( var i=0; i<length; ++i )
    {
        var enemy = enemies[i];
        if( enemy === object )
        {
            return enemy;
        }
    }

    return null;
};


SceneGameMap.prototype.getEnemyFromID = function(playerID)
{
    var enemies = this.enemies;
    var length = enemies.length;
    for( var i=0; i<length; ++i )
    {
        var character = enemies[i];
        if( character.getPlayerID() === playerID )
        {
            return character;
        }
    }

    return null;
};


// When an attack is made
SceneGameMap.prototype.registerAttacking = function(attacker)
{
};


// When the payer's ammo value has changed
SceneGameMap.prototype.registerAmmoUpdate = function(player)
{
};


// When a player is attacked
SceneGameMap.prototype.handleAttack = function(attackedBy, attackType, force, damage, x, y, z)
{
    // Don't stop the character controller from handling the attack
    return false;
};


// When a player has taken damage
SceneGameMap.prototype.registerDamage = function(from, to, damage)
{
};


// When a player dies
SceneGameMap.prototype.registerDeath = function(playerID, killerID, synced)
{
};


SceneGameMap.prototype.syncLoggedIn = function()
{
};


SceneGameMap.prototype.syncUpdate = function(jsonData)
{
    if( jsonData.mapTexture )
    {
        var filename = jsonData.mapTexture;
        this.setMapTexture( filename );
    }

    if( jsonData.mapSize )
    {
        var size = jsonData.mapSize;
        this.setMapSize( size );
    }

    if( jsonData.staticObjects )
    {
        var staticObjects = jsonData.staticObjects;
        for( i=0; i<staticObjects.length; ++i )
        {
            this.syncUpdate( staticObjects[i] );
        }
    }

    var playerID, mapBounds, players, locationString, location, health, objectID;
    if( jsonData.addPlayer )
    {
        playerID = jsonData.addPlayer;

        locationString = jsonData.location;
        location = vec3.fromString( locationString );

        mapBounds = this.getMapBounds();
        location[0] *= mapBounds.width;
        location[2] *= mapBounds.height;

        this.syncAddPlayer( playerID, jsonData.userID, jsonData.playerType, location, jsonData.health, jsonData );

        var bulletDamage = jsonData.bulletDamage;
        var bulletTax = jsonData.bulletTax;
        var fireChargeRate = jsonData.fireChargeRate;
        var timeToReady = jsonData.timeToReady;
        if( bulletDamage !== undefined || bulletTax !== undefined || fireChargeRate !== undefined || timeToReady !== undefined )
        {
            this.syncWeaponSettings( playerID, timeToReady, bulletDamage, bulletTax, fireChargeRate );
        }
    }
    else if( jsonData.removePlayer )
    {
        playerID = jsonData.removePlayer;
        var removedPlayer = this.getPlayerFromID( playerID );
        if( removedPlayer )
        {
            this.removeEnemyID( playerID );
        }
    }
    else if( jsonData.gotoLocation )
    {
        playerID = jsonData.gotoLocation;

        locationString = jsonData.location;
        location = vec3.fromString( locationString );

        mapBounds = this.getMapBounds();
        location[0] *= mapBounds.width;
        location[2] *= mapBounds.height;

        this.syncPlayerGotoLocation( playerID, location );
    }
    else if( jsonData.shootAt )
    {
        playerID = jsonData.shootAt;
        var targetID = jsonData.target;

        this.syncPlayerShootAt( playerID, targetID );
    }
    else if( jsonData.syncPlayerAction )
    {
        playerID = jsonData.syncPlayerAction;
        var actionID = jsonData.actionID;

        this.syncPlayerAction( playerID, actionID );
    }
    else if( jsonData.setHealth )
    {
        playerID = jsonData.setHealth;
        health = jsonData.health;

        this.syncPlayerHealth( playerID, health, false );
    }
    else if( jsonData.registerDeath !== undefined )
    {
        playerID = jsonData.registerDeath;
        this.registerDeath( playerID, jsonData.killerID, true );
    }
    else if( jsonData.spawnStaticObject )
    {
        objectID = jsonData.spawnStaticObject;

        var obj = jsonData.obj;
        var tex = jsonData.tex;
        var options = jsonData.options;

        var width = jsonData.width;

        // Location comes in a percentage between -1, 1 to reduce potential out of sync of map size
        locationString = jsonData.location;
        location = vec3.fromString( locationString );

        var rotation = jsonData.rotation ? jsonData.rotation : 0.0;

        mapBounds = this.getMapBounds();
        location[0] *= mapBounds.width;
        location[2] *= mapBounds.height;

        this.spawnStaticObject( objectID, obj, tex, options, width, rotation, location );
    }
    else if( jsonData.removeStaticObject )
    {
        objectID = jsonData.removeStaticObject;

        this.syncRemoveStaticObject( objectID );
    }

    if( jsonData.spawnPickup )
    {
        objectID = jsonData.spawnPickup;

        var type = jsonData.type;

        // Location comes in a percentage between -1, 1 to reduce potential out of sync of map size
        locationString = jsonData.location;
        location = vec3.fromString( locationString );

        var pickup = this.spawnPickup( "healthpack", type, objectID );
        if( pickup )
        {
            mapBounds = this.getMapBounds();
            location[0] *= mapBounds.width;
            location[2] *= mapBounds.height;
            pickup.setPositionXZ( location[0], location[2] );

            this.adjustCollisionPlacement( pickup );
        }
    }

    if( jsonData.removePickup )
    {
        objectID = jsonData.removePickup;

        this.syncRemovePickup( objectID );
    }
};


SceneGameMap.prototype.syncAddPlayer = function(playerID, userID, playerType, location, health, jsonData)
{
    var player = this.getPlayerFromID( playerID );
    if( !player )
    {
        player = this.spawnCharacter( playerType, playerID, userID );
        if( MultiplayerManager.SessionID === playerID )
        {
            this.assignPlayerCharacter( player );
        }
        else
        {
            this.addEnemy( player );
        }
    }

    {
        this.syncPlayerSetLocation( playerID, location );
    }

    {
        this.syncPlayerHealth( playerID, health, true );
    }
};


SceneGameMap.prototype.syncPlayerHealth = function(playerID, health, initialize)
{
    var character = this.getPlayerFromID( playerID );
    if( character )
    {
        character.controller.setHealth( health, initialize );

        if( this.updateHealthUI )
        {
            var healthRatio = character.controller.getHealthRatio();
            this.updateHealthUI( character, healthRatio );
        }
    }
};


SceneGameMap.prototype.syncWeaponSettings = function(playerID, timeToReady, bulletDamage, bulletTax, fireChargeRate)
{
    var character = this.getPlayerFromID( playerID );
    if( character )
    {
        character.setWeaponSettings( timeToReady, bulletDamage, bulletTax, fireChargeRate );
    }
};


SceneGameMap.prototype.syncPlayerSetLocation = function(playerID, location)
{
    var character = this.getPlayerFromID( playerID );
    if( character )
    {
        character.setPosition( location );
        this.adjustCollisionPlacement( character );
        character.controller.stopAction();
    }
};


SceneGameMap.prototype.syncPlayerGotoLocation = function(playerID, location)
{
    var character = this.getPlayerFromID( playerID );
    if( character )
    {
        character.controller.goToScan( location );
    }
};


SceneGameMap.prototype.syncPlayerShootAt = function(playerID, targetID)
{
    var player = this.getPlayerFromID( playerID );
    var target = this.getPlayerFromID( targetID );

    if( player && target && ( player !== target ) )
    {
        player.controller.shootAt( target );
    }
};


SceneGameMap.prototype.syncPlayerAction = function(playerID, actionID)
{
    var player = this.getPlayerFromID( playerID );
    player.controller.shoot( null, null, actionID );
};


SceneGameMap.prototype.syncRemoveStaticObject = function(objectID)
{
    var staticObjects = this.staticObjects;
    for( var i=0; i<staticObjects.length; ++i )
    {
        var object = staticObjects[i];
        if( object.getID() === objectID )
        {
            object.deleteLater();
            staticObjects.remove( object );

            this.pathFinderNetwork.removeCollideable( object );
            // Don't stop here, as there might be more than one of the same type
        }
    }

    this.updatePathFinder();
};


SceneGameMap.prototype.syncRemovePickup = function(pickupID)
{
    var pickups = this.pickups;
    for( var i=0; i<pickups.length; ++i )
    {
        var pickup = pickups[i];
        if( pickup.getID() === pickupID )
        {
            pickup.deleteLater();
            pickups.remove( pickup );
            break;
        }
    }
};


// void SceneGameMap::pause()
// {
//     enabled = false;
// }


// void SceneGameMap::unPause()
// {
//     enabled = true;
// }


SceneGameMap.prototype.getNumberOfPlayers = function()
{
    return this.players.length;
};


SceneGameMap.prototype.getNumberOfHumanPlayers = function()
{
    var count = 0;
    var players = this.players;
    for( var i=0; i<players.length; ++i )
    {
        var player = players[i];
        if( !player.controller.isAI() )
        {
            count++;
        }
    }
    return count;
};


SceneGameMap.prototype.getPathFinderNetwork = function()
{
    return this.pathFinderNetwork;
};


SceneGameMap.prototype.getMapBounds = function()
{
    return this.mapBounds;
};
