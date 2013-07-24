/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : SceneMapsManager.js
 * Description : Manager of our map editor.
 *
 * Created     : 26/12/12
 *-----------------------------------------------------------
 */

function SceneMapsManager()
{
    this.construct();
}
ExtendPrototype( SceneMapsManager, SceneManagerPlay );


SceneMapsManager.prototype.construct = function()
{
    this.SceneManagerPlay_construct();

    this.disconnected();
};


SceneMapsManager.prototype.destruct = function()
{
    this.SceneManagerPlay_destruct();
};


SceneMapsManager.prototype.deleteLater = function()
{
    CC.RemoveJSLocationBarData( 'SceneMapsManager' );
    this.SceneManagerPlay_deleteLater();
};


SceneMapsManager.prototype.setup = function()
{
    this.SceneManagerPlay_setup();
};


SceneMapsManager.prototype.updateScene = function(delta)
{
    return this.SceneManagerPlay_updateScene( delta );
};


SceneMapsManager.prototype.disconnected = function()
{
    AlertsManager.ModalAlert( "connecting..." );
};


SceneMapsManager.prototype.syncLoggedIn = function()
{
    this.SceneManagerPlay_syncLoggedIn();

    AlertsManager.Hide( "connecting...", 2 );

    if( this.map )
    {
        // Reset state
        this.map.deleteLater();
        this.map = null;
    }

    var mapsManagerSettings = CC.GetJSLocationBarData( 'SceneMapsManager' );
    if( mapsManagerSettings && mapsManagerSettings !== "menu" )
    {
        this.enterMap( mapsManagerSettings );
    }
    else
    {
        this.openMapsList();
    }
};


SceneMapsManager.prototype.syncUpdate = function(jsonData)
{
    this.SceneManagerPlay_syncUpdate( jsonData );

    var map, mapID;
    if( jsonData.EditorEnteredMap)
    {
        map = jsonData.EditorEnteredMap;
        this.enteredMap( map );
    }
    else if( jsonData.EditorCopiedMap )
    {
        mapID = jsonData.EditorCopiedMap;

        AlertsManager.Hide( "creating copy..." );
        if( this.map )
        {
            this.map.deleteLater();
            this.map = null;
        }
        this.enterMap( mapID );
    }
    else if( jsonData.EditorDeletedMap )
    {
        mapID = jsonData.EditorDeletedMap;

        AlertsManager.Hide( "deleting..." );
        this.handleBackButton();
    }

    // Server tells us to select an object
    // Currently used after a create operation
    else if( jsonData.EditorSelectObject )
    {
        var objectID = jsonData.EditorSelectObject;
        if( this.map )
        {
            var object = this.map.getStaticObject( objectID );
            if( object )
            {
                this.map.selectedObjectsAdd( object );
            }
        }
    }
};


SceneMapsManager.prototype.openMapsList = function()
{
    CC.SetJSLocationBarData( 'SceneMapsManager', 'menu' );

    if( this.sceneMapsList )
    {
        this.closeMapsList();
    }

    this.sceneMapsList = new SceneMapsManagerList( this );
    gEngine.addScene( this.sceneMapsList );
};


SceneMapsManager.prototype.closeMapsList = function()
{
    if( this.sceneMapsList )
    {
        this.sceneMapsList.deleteLater();
        this.sceneMapsList = null;
    }
};


SceneMapsManager.prototype.newMap = function(open)
{
    AlertsManager.ModalAlert( "loading..." );
    socket.emit( 'EditorMapNew', open );

    // Will enter map after creating it and call SceneMapsManager.enteredMap();
};


SceneMapsManager.prototype.enterMap = function(mapID)
{
    AlertsManager.ModalAlert( "loading..." );
    socket.emit( 'EditorMapEnter', mapID );
};


SceneMapsManager.prototype.enteredMap = function(mapData)
{
    CC.SetJSLocationBarData( 'SceneMapsManager', mapData.loadGame );

    AlertsManager.Hide( "loading..." );
    if( this.map )
    {
        this.map.deleteLater();
        this.map = null;
    }

    this.map = new SceneMapEditor( mapData.loadGame, this, mapData );
    this.closeMapsList();
};


SceneMapsManager.prototype.onDragDrop = function(files, event)
{
    if( event && event.target )
    {
        if( MultiplayerManager.LoggedIn )
        {
            if( this.map )
            {
                var self = this;

                // We have dropped something into our map
                var i, filename, fileExtension;

                // If it's a .js file then we need to upload it as javascript
                var isJS = true;
                for( i=0; i<files.length; ++i )
                {
                    filename = files[i].name;
                    fileExtension = filename.getExtension();
                    if( fileExtension !== "js" )
                    {
                        isJS = false;
                        break;
                    }
                }

                if( isJS )
                {
                    this.map.sceneUI.openJSMapEditor(function (result, js)
                    {
                        if( result )
                        {
                            socket.emit( 'EditorJS', js );
                        }
                        if( self.map )
                        {
                            self.map.sceneUI.showMenu();
                        }
                    });
                    return;
                }

                if( !this.map.sceneUI.sceneAssetEditor )
                {
                    // If we are selecting an object, or are building new object
                    // or it contains an "obj" file
                    // We open our models creator
                    var openModelCreator = false;
                    if( this.map.selectedObjects.length > 0 )
                    {
                        for( i=0; i<this.map.selectedObjects.length; ++i )
                        {
                            if( this.map.selectedObjects[i] !== this.map.ground )
                            {
                                openModelCreator = true;
                            }
                        }
                    }
                    else if( this.map.sceneUI.creatingObjects )
                    {
                        openModelCreator = true;
                    }
                    else
                    {
                        for( i=0; i<files.length; ++i )
                        {
                            filename = files[i].name;
                            fileExtension = filename.getExtension();
                            if( fileExtension === "obj" || fileExtension === "fbx" || fileExtension === "fbxi" )
                            {
                                openModelCreator = true;
                                break;
                            }
                        }
                    }

                    if( openModelCreator )
                    {
                        if( !this.map.sceneUI.creatingObjects )
                        {
                            this.map.sceneUI.handleCreateButton();
                        }

                        var OnCreatedFunction = function(modelInfo)
                        {
                            if( modelInfo )
                            {
                                self.modelCreated( modelInfo );
                            }
                        };

                        if( this.map.selectedObjects.length > 0 )
                        {
                            var object = this.map.selectedObjects[0];
                            var modelID = object.modelID;
                            this.map.sceneUI.findAndSelectModelID( modelID, function (result)
                            {
                                if( result )
                                {
                                    var modelInfo = self.map.sceneUI.getSelectedModel();
                                    self.map.sceneUI.openAssetEditor( "Edit Model", true, false, OnCreatedFunction );
                                    self.map.sceneUI.sceneAssetEditor.setModel( modelInfo );
                                }
                                else
                                {
                                    self.map.sceneUI.openAssetEditor( "Create Model", true, false, OnCreatedFunction );
                                    self.map.sceneUI.sceneAssetEditor.setAsset( object.obj );
                                    self.map.sceneUI.sceneAssetEditor.setAsset( object.tex );
                                }
                            });
                        }
                        else
                        {
                            this.map.sceneUI.openAssetEditor( "Create Model", true, false, OnCreatedFunction );
                        }
                    }

                    // We must be modifying the map texture
                    else
                    {
                        this.map.sceneUI.openAssetEditor( "Upload Map Texture", false, false, function (tex)
                        {
                            if( tex )
                            {
                                self.handleEditMapTexture( tex );
                            }
                        });
                    }
                }
            }
        }
    }
};


SceneMapsManager.prototype.handleBackButton = function()
{
    if( this.map )
    {
        // Reset state
        this.map.deleteLater();
        this.map = null;

        this.openMapsList();

        if( MultiplayerManager.LoggedIn )
        {
            socket.emit( 'EditorMapExit' );
        }
    }
    return true;
};


SceneMapsManager.prototype.handleDeleteMap = function()
{
    if( this.map )
    {
        if( MultiplayerManager.LoggedIn )
        {
            var self = this;
            AlertsManager.ConfirmationAlert( "Delete map?", function(result)
            {
                if( result )
                {
                    if( MultiplayerManager.LoggedIn )
                    {
                        AlertsManager.Hide( "deleting..." );
                        socket.emit( 'EditorMapDelete' );
                    }
                }
            });
        }
    }
};


SceneMapsManager.prototype.handleEditName = function()
{
    if( this.map )
    {
        if( MultiplayerManager.LoggedIn )
        {
            var self = this;
            var map = this.map;
            AlertsManager.InputAlert( map.sceneUI.tileMapName.getText(), function(result)
            {
                if( result )
                {
                    if( self.map.name !== result )
                    {
                        if( MultiplayerManager.LoggedIn )
                        {
                            map.name = result;
                            map.sceneUI.setupMenu( self.map.mapID, self.map.name, open );

                            socket.emit( 'EditorMapEditName', result );
                        }
                    }
                }
            },
            {
                space:true
            });
        }
    }
};


SceneMapsManager.prototype.handleEditPrivacy = function()
{
    if( this.map )
    {
        if( MultiplayerManager.LoggedIn )
        {
            var self = this;
            var map = this.map;
            var open = map.open;
            AlertsManager.ConfirmationAlert( open ? "Make private?" : "Make public?", function(result)
            {
                if( result )
                {
                    if( MultiplayerManager.LoggedIn )
                    {
                        open = !open;
                        map.sceneUI.setupMenu( self.map.mapID, self.map.name, open );

                        socket.emit( 'EditorMapEditPrivacy', open );
                    }
                }
            });
        }
    }
};


SceneMapsManager.prototype.handleCopyButton = function()
{
    if( this.map )
    {
        if( MultiplayerManager.LoggedIn )
        {
            AlertsManager.ModalAlert( "creating copy..." );
            socket.emit( 'EditorMapCopy' );
        }
    }
    return true;
};


SceneMapsManager.prototype.handleEditMapTexture = function(filename)
{
    if( filename )
    {
        var fileExtension = filename.getExtension();
        if( fileExtension === "png" || fileExtension === "jpg" )
        {
            socket.emit( 'EditorMapTexture', filename );
        }
    }
};


SceneMapsManager.prototype.objectSelected = function(hitObject, location)
{
    var map = this.map;
    var selectedObjects = map.selectedObjects;

    var i;

    // Unselect our object if we re-select it
    var reselectedObject = false;
    for( i=0; i<selectedObjects.length; ++i )
    {
        if( hitObject === selectedObjects[i] )
        {
            reselectedObject = true;
            break;
        }
    }

    if( reselectedObject )
    {
        if( selectedObjects.length === 1 )
        {
            // Turn off create button
            if( map.sceneUI.creatingObjects )
            {
                map.sceneUI.handleCreateButton();
            }

            // Or unselect our object
            else
            {
                map.selectedObjectsClear();
            }
        }
        else
        {
            map.selectedObjectsClear();
            map.selectedObjectsAdd( hitObject );
        }
    }
    else
    {
        var containsPlayers = selectedObjects.length > 0;
        for( i=0; i<selectedObjects.length; ++i )
        {
            if( !selectedObjects[i].playerID )
            {
                containsPlayers = false;
                break;
            }
        }

        // If we're not a player, just swap objects
        if( !containsPlayers )
        {
            map.selectedObjectsClear();
            if( hitObject )
            {
                // Turn off create button if we select a player
                if( hitObject.playerID )
                {
                    if( map.sceneUI.creatingObjects )
                    {
                        map.sceneUI.handleCreateButton();
                    }
                }
                map.selectedObjectsAdd( hitObject );
            }
        }

        else
        {
            // We have players so do something with the other object
            var player;
            if( hitObject )
            {
                // Shoot at the other player
                if( hitObject.playerID )
                {
                    if( MultiplayerManager.LoggedIn )
                    {
                        for( i=0; i<selectedObjects.length; ++i )
                        {
                            player = selectedObjects[i];
                            if( player.playerID )
                            {
                                socket.emit( 'EditorShootAt', player.playerID, hitObject.playerID );
                            }
                        }
                    }
                }

                // Not a player, just swap out objects
                else
                {
                    map.selectedObjectsClear();
                    map.selectedObjectsAdd( hitObject );
                }
            }

            // Move our player to that location
            else
            {
                if( MultiplayerManager.LoggedIn )
                {
                    var mapBounds = map.getMapBounds();
                    location[0] /= mapBounds.width;
                    location[2] /= mapBounds.height;
                    var tLocation = vec3.toString( location );

                    for( i=0; i<selectedObjects.length; ++i )
                    {
                        player = selectedObjects[i];
                        if( player.playerID )
                        {
                            socket.emit( 'EditorGotoLocation', player.playerID, tLocation );
                        }
                    }
                }
            }
        }
    }
};


SceneMapsManager.prototype.objectsMoved = function(objects)
{
    var map = this.map;
    if( map )
    {
        if( MultiplayerManager.LoggedIn )
        {
            var selectedObjects = map.selectedObjects;
            if( selectedObjects.length > 0 )
            {
                var mapBounds = map.getMapBounds();
                var i;
                for( i=0; i<selectedObjects.length; ++i )
                {
                    var object = selectedObjects[i];
                    if( !object.playerID && object !== map.ground )
                    {
                        var objectID = object.getID();

                        var location = vec3.clone( object.position );
                        location[0] /= mapBounds.width;
                        location[2] /= mapBounds.height;
                        var tLocation = vec3.toString( location );

                        socket.emit( 'EditorObjectMove', objectID, tLocation );
                    }
                }
                map.updatePathFinder();
            }
        }

        map.selectedObjectsUpdated();
    }
};


SceneMapsManager.prototype.objectsResized = function()
{
    var map = this.map;
    if( map )
    {
        if( MultiplayerManager.LoggedIn )
        {
            var selectedObjects = map.selectedObjects;
            if( selectedObjects.length > 0 )
            {
                for( i=0; i<selectedObjects.length; ++i )
                {
                    var object = selectedObjects[i];
                    if( !object.playerID )
                    {
                        var size = object.collisionSize.width;
                        if( object === map.ground )
                        {
                            socket.emit( 'EditorMapSize', size );
                        }
                        else
                        {
                            var objectID = object.getID();
                            socket.emit( 'EditorObjectSize', objectID, size );
                        }
                    }
                }

                map.updatePathFinder();
            }
        }

        map.selectedObjectsUpdated();
    }
};


SceneMapsManager.prototype.createObject = function(location)
{
    if( MultiplayerManager.LoggedIn )
    {
        var map = this.map;
        if( map )
        {
            var mapBounds = map.getMapBounds();
            location[0] /= mapBounds.width;
            location[2] /= mapBounds.height;
            var tLocation = vec3.toString( location );

            var obj, tex;
            var modelInfo = map.sceneUI.getSelectedModel();
            if( modelInfo )
            {
                socket.emit( 'EditorObjectCreate', tLocation, modelInfo.objectID );
            }
            else
            {
                socket.emit( 'EditorObjectCreate', tLocation );
            }
        }
    }
};


SceneMapsManager.prototype.deleteObject = function(object)
{
    var map = this.map;
    if( map )
    {
        if( MultiplayerManager.LoggedIn )
        {
            socket.emit( 'EditorObjectDelete', object.getID() );
        }
    }
};


// Models
SceneMapsManager.prototype.modelCreated = function(modelInfo)
{
    if( MultiplayerManager.LoggedIn )
    {
        var map = this.map;
        if( map )
        {
            var objects = map.selectedObjects;
            var i, object;

            if( modelInfo )
            {
                for( i=0; i<objects.length; ++i )
                {
                    object = objects[i];
                    socket.emit( 'EditorObjectModel', object.getID(), modelInfo.objectID );
                }
            }

            map.sceneUI.flagPendingModelUpdate();
            map.sceneUI.findAndSelectModelID( modelInfo.objectID );
        }
    }
};


SceneMapsManager.prototype.modelSelected = function(modelID)
{
    if( MultiplayerManager.LoggedIn )
    {
        var map = this.map;
        if( map )
        {
            var objects = map.selectedObjects;
            var i, object;

            if( modelID )
            {
                for( i=0; i<objects.length; ++i )
                {
                    object = objects[i];
                    socket.emit( 'EditorObjectModel', object.getID(), modelID );
                }
            }
        }
    }
};


SceneMapsManager.prototype.close = function()
{
    this.deleteLater();
    new SceneGamesManager();
};
