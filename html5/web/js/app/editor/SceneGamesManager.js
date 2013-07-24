/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : SceneGamesManager.js
 * Description : Manager of our map editor.
 *
 * Created     : 23/02/13
 *-----------------------------------------------------------
 */

function SceneGamesManager()
{
    CCAudioManager.Enabled = true;

    var gameID = CC.GetJSLocationBarData( 'SceneGameEditor' );
    if( gameID )
    {
        this.loadingGameID = gameID;
    }

    this.construct();
}
ExtendPrototype( SceneGamesManager, SceneManagerPlay );


SceneGamesManager.prototype.construct = function()
{
    this.SceneManagerPlay_construct();

    this.sceneUI = new SceneGamesManagerUI( this );
    gEngine.addScene( this.sceneUI );

    var self = this;
    this.dbGames = new DBGames();
    this.dbGames.load(
        function (gameInfos)
        {
            self.reconnectedGamesList( gameInfos );
        },
        function (gameInfo, removed)
        {
            self.updatedGameInfo( gameInfo, removed );
        },
        true );

    this.disconnected();

    gEngine.addScene( this );
};


SceneGamesManager.prototype.deleteLater = function()
{
    if( this.dbGames )
    {
        this.dbGames.destruct();
        this.dbGames = null;
    }

    this.SceneManagerPlay_deleteLater();

    if( this.sceneUI )
    {
        this.sceneUI.close();
        this.sceneUI = null;
    }
};


SceneGamesManager.prototype.setup = function()
{
    this.SceneManagerPlay_setup();
    this.camera.enabled = false;
};


SceneGamesManager.prototype.disconnected = function()
{
    if( !MultiplayerManager.ForceDisconnected )
    {
        if( this.dbGames )
        {
            AlertsManager.ModalAlert( "connecting...", 2 );
        }
    }
};


SceneGamesManager.prototype.syncLoggedIn = function()
{
    this.SceneManagerPlay_syncLoggedIn();

    if( CC.GetJSLocationBarData( 'SceneMapsManager' ) )
    {
        this.onEditMaps();
    }
    else if( CC.GetJSLocationBarData( 'SceneUIManager' ) )
    {
        this.onEditUI();
    }
    else if( CC.GetJSLocationBarData( 'SceneCharactersManager' ) )
    {
        this.onEditCharacters();
    }
    else if( CC.GetJSLocationBarData( 'SceneImagesManager' ) )
    {
        this.onEditImages();
    }
    else if( CC.GetJSLocationBarData( 'SceneAudioManager' ) )
    {
        this.onEditAudio();
    }
    else if( this.loadingGameID )
    {
        this.onEditGameID( this.loadingGameID );
        delete this.loadingGameID;
    }

    if( this.dbGames )
    {
        this.dbGames.reconnectGamesList();
    }
};


SceneGamesManager.prototype.syncLoggedIntoSocialNetwork = function(network)
{
    this.sceneUI.hideLogin();
    this.sceneUI.showLogin();
};


SceneGamesManager.prototype.reconnectedGamesList = function(gameInfos)
{
    AlertsManager.Hide( "connecting..." );
    if( this.sceneUI.sceneGameEditor )
    {
        var currentGameInfo = this.sceneUI.sceneGameEditor.gameInfo;
        for( var i=0; i<gameInfos.length; ++i )
        {
            var gameInfo = gameInfos[i];
            if( gameInfo.id === currentGameInfo.id )
            {
                this.sceneUI.openGameEditor( gameInfo, true );
                return;
            }
        }
    }
    this.sceneUI.openGamesList( gameInfos );
};


SceneGamesManager.prototype.updatedGameInfo = function(gameInfo, removed)
{
    if( this.sceneUI.sceneGameEditor )
    {
        var currentGameInfo = this.sceneUI.sceneGameEditor.gameInfo;
        if( gameInfo.id === currentGameInfo.id )
        {
            if( removed )
            {
                this.sceneUI.closeGameEditor();
                this.sceneUI.openGamesList( this.dbGames.gameInfos );
            }
            else
            {
                var gameEditorCameraX = this.sceneUI.sceneGameEditor.camera.targetLookAt[0];
                var gameEditorCameraY = this.sceneUI.sceneGameEditor.camera.targetLookAt[1];

                if( this.sceneUI.openGameEditor( gameInfo, true ) )
                {
                    // Restore our camera position
                    this.sceneUI.sceneGameEditor.camera.targetLookAt[0] = gameEditorCameraX;
                    this.sceneUI.sceneGameEditor.camera.targetLookAt[1] = gameEditorCameraY;
                    this.sceneUI.sceneGameEditor.camera.setLookAt( this.sceneUI.sceneGameEditor.camera.targetLookAt );
                }
            }
            return;
        }
    }
    this.sceneUI.updateGamesList( gameInfo, removed );
};


SceneGamesManager.prototype.syncUpdate = function(jsonData)
{
    if( jsonData.EditorGameCreated )
    {
        AlertsManager.Hide( "creating..." );
        this.sceneUI.closeGamesList();
        this.sceneUI.openGameEditor( jsonData.EditorGameCreated );
    }
    else if( jsonData.EditorGameImported !== undefined )
    {
        AlertsManager.Hide( "importing..." );
        if( jsonData.EditorGameImported )
        {
            this.sceneUI.openGameEditor( jsonData.EditorGameImported );
        }
        else
        {
            AlertsManager.TimeoutAlert( "import failed :(", 5.0 );
        }
    }
    else if( jsonData.EditorGameDeleted !== undefined )
    {
        AlertsManager.Hide( "deleting..." );
        this.sceneUI.closeGameEditor();
        this.sceneUI.openGamesList( this.dbGames.gameInfos );
    }
    else if( jsonData.EditorGamePublished !== undefined )
    {
        AlertsManager.Hide( "updating..." );
    }
    else if( jsonData.EditorGameEdited !== undefined )
    {
        AlertsManager.Hide( "updating..." );

        if( jsonData.gameInfo )
        {
            this.sceneUI.openGameEditor( jsonData.gameInfo );

            // Restore our camera position
            if( this.gameEditorCameraX && this.gameEditorCameraY )
            {
                this.sceneUI.sceneGameEditor.camera.targetLookAt[0] = this.gameEditorCameraX;
                this.sceneUI.sceneGameEditor.camera.targetLookAt[1] = this.gameEditorCameraY;
                this.sceneUI.sceneGameEditor.camera.setLookAt( this.sceneUI.sceneGameEditor.camera.targetLookAt );

                delete this.gameEditorCameraX;
                delete this.gameEditorCameraY;
            }
        }
    }
    else if( jsonData.RequestGameInfo !== undefined )
    {
        this.onEditGame( jsonData.RequestGameInfo );
    }
};


SceneGamesManager.prototype.onNewGame = function()
{
    AlertsManager.ModalAlert( "creating..." );
    socket.emit( 'EditorGameCreate' );
};


SceneGamesManager.prototype.onEditMaps = function()
{
    this.deleteLater();
    gEngine.addScene( new SceneMapsManager() );
};


SceneGamesManager.prototype.onEditUI = function(uiID, onSelect, onClose)
{
    this.deleteLater();
    new SceneUIManager( uiID, onSelect, onClose );
};


SceneGamesManager.prototype.onEditCharacters = function()
{
    this.deleteLater();
    gEngine.addScene( new SceneCharactersManager() );
};


SceneGamesManager.prototype.onEditImages = function()
{
    this.deleteLater();
    gEngine.addScene( new SceneImagesManager() );
};


SceneGamesManager.prototype.onEditAudio = function()
{
    this.deleteLater();
    gEngine.addScene( new SceneAudioManager() );
};


SceneGamesManager.prototype.onEditGameID = function(gameID)
{
    if( MultiplayerManager.LoggedIn )
    {
        socket.emit( 'RequestGameInfo', gameID );
    }
    else
    {
        this.loadingGameID = gameID;
    }
};


SceneGamesManager.prototype.onEditGame = function(gameInfo)
{
    AlertsManager.Hide( "loading..." );

    if( gameInfo )
    {
        this.sceneUI.closeGamesList();
        this.sceneUI.openGameEditor( gameInfo );
    }
    else
    {
        AlertsManager.TimeoutAlert( "unable to load game info :(", 2.0 );
    }
};


SceneGamesManager.prototype.onGameEditorClose = function(openGamesList)
{
    if( MultiplayerManager.LoggedIn )
    {
        if( openGamesList )
        {
            this.sceneUI.openGamesList( this.dbGames.gameInfos );
        }
    }
};


SceneGamesManager.prototype.onGamePublish = function(clientID, publish)
{
    var self = this;
    AlertsManager.ConfirmationAlert( publish ? "Publish?" : "Unpublish?", function(result)
    {
        if( result )
        {
            if( MultiplayerManager.LoggedIn )
            {
                AlertsManager.ModalAlert( "updating..." );
                socket.emit( 'EditorGamePublish', clientID, publish );
            }
        }
    });
};


SceneGamesManager.prototype.onGameAddOwner = function(clientID, newOwnerID)
{
    if( MultiplayerManager.LoggedIn )
    {
        AlertsManager.ModalAlert( "updating..." );
        socket.emit( 'EditorGameAddOwner', clientID, newOwnerID );
    }
};


SceneGamesManager.prototype.onGameExport = function(gameInfo)
{
    AlertsManager.ModalAlert( "exporting..." );

    var numberOfFileRequests = 0;
    var files = [];

    var self = this;
    var finishedRequests = false;
    var DownloadedFunction = function(filename)
    {
        return function (status, data)
        {
            if( status >= CCURLRequest.Succeeded && data && data.length > 0 )
            {
                var file = {};
                file.name = filename;
                file.data = data;
                files.push( file );

                if( finishedRequests && files.length === numberOfFileRequests )
                {
                    self.BuildDB( gameInfo, files );
                }
            }
            else
            {
                AlertsManager.Hide( "exporting..." );
                AlertsManager.TimeoutAlert( "error exporting " + filename, 5.0 );
            }
        };
    };

    if( gameInfo.titleImage )
    {
        if( !gameInfo.jsFiles || gameInfo.jsFiles.length === 0 )
        {
            finishedRequests = true;
        }

        numberOfFileRequests++;
        gURLManager.requestURL( MultiplayerManager.GetAssetURL( gameInfo.titleImage ),
                null,
                new DownloadedFunction( gameInfo.titleImage ),
                0,
                null,   // Don't cache
                -1,
                0.0,
                true ); // Return binary
    }

    if( gameInfo.jsFiles )
    {
        var jsFiles = gameInfo.jsFiles;
        for( var i=0; i<jsFiles.length; ++i )
        {
            if( i === jsFiles.length-1 )
            {
                finishedRequests = true;
            }

            var js = jsFiles[i];
            if( js.filename )
            {
                numberOfFileRequests++;

                gURLManager.requestURL( MultiplayerManager.GetAssetURL( js.filename ),
                    null,
                    new DownloadedFunction( js.filename ),
                    0,
                    js.filename,
                    -1,
                    0.0 );
            }
        }
    }
};


SceneGamesManager.prototype.BuildDB = function(gameInfo, files)
{
    var i;
    var db = [];
    for( i=0; i<files.length; ++i )
    {
        var file = files[i];
        var extension = file.name.getExtension();
        if( extension === "js" )
        {
            JSManager.ParseJSForAssets( file.data, db );
        }
    }

    if( db.length > 0 )
    {
        var self = this;
        var numberOfDownloads = 0;
        var DownloadedFunction = function(filename)
        {
            return function (status, data)
            {
                numberOfDownloads++;
                if( status >= CCURLRequest.Succeeded && data && data.length > 0 )
                {
                    AlertsManager.Notification( "editor"+numberOfDownloads, "exporting " + filename, null, 1.0, null, 0.25 );

                    var file = {};
                    file.name = filename;
                    file.data = data;
                    files.push( file );
                }
                else
                {
                    AlertsManager.Notification( "error"+numberOfDownloads, "error exporting " + filename, null, 10.0 );
                }

                if( db.length === numberOfDownloads )
                {
                    self.Export( gameInfo, files );
                }
            };
        };

        for( i=0; i<db.length; ++i )
        {
            var filename = db[i];
            gURLManager.requestURL( MultiplayerManager.GetAssetURL( filename ),
                    null,
                    new DownloadedFunction( filename ),
                    0,
                    null,   // Don't cache
                    -1,
                    0.0,
                    true ); // Return binary
        }
    }
    else
    {
        this.Export( gameInfo, files );
    }
};


SceneGamesManager.prototype.Export = function(gameInfo, files)
{
    var filename = "GameData." + gameInfo.id + ".zip";
    var zip = new JSZip();
    zip.file( "gameinfo.json", JSON.stringify( gameInfo ) );

    for( var i=0; i<files.length; ++i )
    {
        var file = files[i];
        zip.file( file.name, file.data );
    }

    var a = document.createElement( "a" );
    a.href = window.URL.createObjectURL( zip.generate( {type:"blob"} ) );
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild( a );
    a.click();
    document.body.removeChild( a );

    AlertsManager.Hide( "exporting..." );
    AlertsManager.Notification( "editor", "exported " + filename, null, 5.0 );
};


SceneGamesManager.prototype.onGameImport = function(gameInfoID, newGameInfo)
{
    if( MultiplayerManager.LoggedIn )
    {
        AlertsManager.ModalAlert( "importing...", false );
        socket.emit( 'EditorGameImport', gameInfoID, newGameInfo );
    }
};


SceneGamesManager.prototype.onGameDelete = function(clientID)
{
    var self = this;
    AlertsManager.ConfirmationAlert( "Delete?", function(result)
    {
        if( result )
        {
            if( MultiplayerManager.LoggedIn )
            {
                AlertsManager.ModalAlert( "deleting..." );
                socket.emit( 'EditorGameDelete', clientID );
            }
        }
    });
};


SceneGamesManager.prototype.onGameEditName = function(gameInfo)
{
    var self = this;
    AlertsManager.InputAlert( gameInfo.name, function(result)
    {
        if( result )
        {
            if( gameInfo.name !== result )
            {
                if( MultiplayerManager.LoggedIn )
                {
                    gameInfo.name = result;
                    AlertsManager.ModalAlert( "updating..." );
                    socket.emit( 'EditorGameEditName', gameInfo.id, gameInfo.name );

                    self.sceneUI.openGameEditor( gameInfo );
                }
            }
        }
    },
    {
        space: true
    });
};


SceneGamesManager.prototype.onGameEditTitleImage = function(gameInfo)
{
    var self = this;
    this.sceneUI.openAssetEditor( "Edit Title Image", false, function (tex)
    {
        if( tex )
        {
            if( gameInfo.titleImage !== tex )
            {
                if( MultiplayerManager.LoggedIn )
                {
                    gameInfo.titleImage = tex;
                    AlertsManager.ModalAlert( "updating..." );
                    socket.emit( 'EditorGameEditTitleImage', gameInfo.id, gameInfo.titleImage );

                    self.sceneUI.openGameEditor( gameInfo );
                }
            }
        }
    });
    this.sceneUI.editAsset( gameInfo.titleImage );
};


SceneGamesManager.prototype.onGameEditJSStart = function(gameInfo)
{
    var self = this;
    AlertsManager.InputAlert( gameInfo.jsStart ? gameInfo.jsStart : "", function(result)
    {
        if( result )
        {
            if( gameInfo.jsStart !== result )
            {
                if( MultiplayerManager.LoggedIn )
                {
                    gameInfo.jsStart = result;
                    AlertsManager.ModalAlert( "updating..." );
                    socket.emit( 'EditorGameEditJSStart', gameInfo.id, gameInfo.jsStart );

                    self.sceneUI.openGameEditor( gameInfo );
                }
            }
        }
    });
};


SceneGamesManager.prototype.onGameRemoveJSStart = function(gameInfo)
{
    if( MultiplayerManager.LoggedIn )
    {
        if( gameInfo.jsStart )
        {
            delete gameInfo.jsStart;
        }
        AlertsManager.ModalAlert( "updating..." );
        socket.emit( 'EditorGameEditJSStart', gameInfo.id, false );

        this.sceneUI.openGameEditor( gameInfo );
    }
};


SceneGamesManager.prototype.onGameAddJSFile = function(gameInfo, fileID, filename)
{
    if( MultiplayerManager.LoggedIn )
    {
        if( !gameInfo.jsFiles )
        {
            gameInfo.jsFiles = [];
        }

        var found = false;

        var jsFiles = gameInfo.jsFiles;
        for( var i=0; i<jsFiles.length; ++i )
        {
            var itr = jsFiles[i];
            if( itr.fileID === fileID )
            {
                if( itr.filename === filename )
                {
                    found = true;
                }
                else
                {
                    itr.filename = filename;
                }
                break;
            }
        }

        if( !found )
        {
            if( this.sceneUI )
            {
                AlertsManager.ModalAlert( "updating..." );
            }
            socket.emit( 'EditorGameAddJSFile', gameInfo.id, fileID, filename );
        }
    }
};


SceneGamesManager.prototype.onGameDeleteJSFile = function(gameInfo, fileID)
{
    if( MultiplayerManager.LoggedIn )
    {
        if( gameInfo.jsFiles )
        {
            var jsFiles = gameInfo.jsFiles;
            for( var i=0; i<jsFiles.length; ++i )
            {
                var js = jsFiles[i];
                if( js.fileID === fileID )
                {
                    jsFiles.remove( js );
                    if( jsFiles.length === 0 )
                    {
                        delete gameInfo.jsFiles;
                    }

                    AlertsManager.ModalAlert( "updating..." );
                    socket.emit( 'EditorGameRemoveJSFile', gameInfo.id, fileID );
                    break;
                }
            }
        }
        this.sceneUI.openGameEditor( gameInfo );
    }
};


SceneGamesManager.prototype.onGameEditJSSync = function(gameInfo)
{
    if( MultiplayerManager.LoggedIn )
    {
        gameInfo.jsSync = !gameInfo.jsSync;

        AlertsManager.ModalAlert( "updating..." );
        socket.emit( 'EditorGameEditJSSync', gameInfo.id, gameInfo.jsSync );

        this.sceneUI.openGameEditor( gameInfo );
    }
};


SceneGamesManager.prototype.onVisualJSEditor = function(gameInfo, filename)
{
    if( MultiplayerManager.LoggedIn )
    {
        var self = this;

        // Save our camera position before closing the game editor
        var gameEditorCameraX = this.sceneUI.sceneGameEditor.camera.targetLookAt[0];
        var gameEditorCameraY = this.sceneUI.sceneGameEditor.camera.targetLookAt[1];
        this.sceneUI.closeGameEditor();

        this.sceneUI.openVisualJSEditor( filename, function()
        {
            self.sceneUI.openGameEditor( gameInfo );
        });
    }
};


SceneGamesManager.prototype.onGameAddUIScene = function(gameInfo, id)
{
    if( MultiplayerManager.LoggedIn )
    {
        if( !gameInfo.uiScenes )
        {
            gameInfo.uiScenes = [];
        }

        var found = false;

        var uiScenes = gameInfo.uiScenes;
        for( var i=0; i<uiScenes.length; ++i )
        {
            var itr = uiScenes[i];
            if( itr.id === id )
            {
                found = true;
                break;
            }
        }

        if( !found )
        {
            AlertsManager.ModalAlert( "updating..." );
            socket.emit( 'EditorGameAddUIScene', gameInfo.id, id );
        }
    }
};


SceneGamesManager.prototype.onGameEditUIFile = function(gameInfo, id, filename)
{
    if( MultiplayerManager.LoggedIn )
    {
        if( !gameInfo.uiScenes )
        {
            gameInfo.uiScenes = [];
        }

        var found = false;

        var uiScenes = gameInfo.uiScenes;
        for( var i=0; i<uiScenes.length; ++i )
        {
            var itr = uiScenes[i];
            if( itr.id === id )
            {
                found = true;
                break;
            }
        }

        if( found )
        {
            socket.emit( 'EditorUIUpdateJS', id, filename );
        }
    }
};


SceneGamesManager.prototype.onGameDeleteUIScene = function(gameInfo, id)
{
    if( MultiplayerManager.LoggedIn )
    {
        if( gameInfo.uiScenes )
        {
            var uiScenes = gameInfo.uiScenes;
            for( var i=0; i<uiScenes.length; ++i )
            {
                var itr = uiScenes[i];
                if( itr.id === id )
                {
                    uiScenes.remove( itr );
                    if( uiScenes.length === 0 )
                    {
                        delete gameInfo.uiScenes;
                    }

                    AlertsManager.ModalAlert( "updating..." );
                    socket.emit( 'EditorGameRemoveUIScene', gameInfo.id, id );
                    break;
                }
            }
        }
        this.sceneUI.openGameEditor( gameInfo );
    }
};


SceneGamesManager.prototype.onGameRestart = function(gameInfo, softRestart)
{
    if( MultiplayerManager.LoggedIn )
    {
        softRestart = !!softRestart;
        socket.emit( 'EditorGameRestart', gameInfo.id, softRestart );
    }
};


SceneGamesManager.prototype.onGameEditBackgroundImage = function(gameInfo)
{
    var self = this;
    this.sceneUI.openAssetEditor( "Edit Background Image", false, function (tex)
    {
        if( tex )
        {
            if( gameInfo.backgroundImage !== tex )
            {
                if( MultiplayerManager.LoggedIn )
                {
                    gameInfo.backgroundImage = tex;
                    AlertsManager.ModalAlert( "updating..." );
                    socket.emit( 'EditorGameEditBackgroundImage', gameInfo.id, gameInfo.backgroundImage );

                    self.sceneUI.openGameEditor( gameInfo );
                }
            }
        }
    });
    this.sceneUI.editAsset( gameInfo.backgroundImage );
};


SceneGamesManager.prototype.onGameEditPlayerType = function(gameInfo, playerTypeInfo)
{
    var self = this;

    // Save our camera position before closing the game editor
    var gameEditorCameraX = this.sceneUI.sceneGameEditor.camera.targetLookAt[0];
    var gameEditorCameraY = this.sceneUI.sceneGameEditor.camera.targetLookAt[1];
    this.sceneUI.closeGameEditor();

    function OnResultFunction(modelInfo)
    {
        if( MultiplayerManager.LoggedIn )
        {
            if( modelInfo )
            {
                if( modelInfo.obj && modelInfo.tex )
                {
                    if( !playerTypeInfo || ( playerTypeInfo.obj !== modelInfo.obj || playerTypeInfo.tex !== modelInfo.tex ) )
                    {
                        if( playerTypeInfo )
                        {
                            playerTypeInfo.obj = modelInfo.obj;
                            playerTypeInfo.tex = modelInfo.tex;
                        }
                        AlertsManager.ModalAlert( "updating..." );
                        socket.emit( 'EditorGameEditPlayerType', gameInfo.id, playerTypeInfo ? playerTypeInfo.type : null, modelInfo.obj, modelInfo.tex );
                    }
                }
                else
                {
                    AlertsManager.TimeoutAlert( "a 3d model and texture is required", 2.0 );
                    self.onGameEditPlayerType( gameInfo, null );
                    return;
                }
            }

            self.sceneUI.openGameEditor( gameInfo );

            // Restore our camera position
            self.sceneUI.sceneGameEditor.camera.targetLookAt[0] = gameEditorCameraX;
            self.sceneUI.sceneGameEditor.camera.targetLookAt[1] = gameEditorCameraY;
        }
    }

    this.sceneUI.openAssetEditor( playerTypeInfo ? "Edit Player Model" : "New Player Model", true, function (modelInfo)
    {
        OnResultFunction( modelInfo );
    });
    this.sceneUI.editAsset( playerTypeInfo.obj );
    this.sceneUI.editAsset( playerTypeInfo.tex );
};


SceneGamesManager.prototype.onGameEditPlayerIcon = function(gameInfo, playerTypeInfo)
{
    var self = this;

    if( playerTypeInfo )
    {
        // Save our camera position before closing the game editor
        var gameEditorCameraX = this.sceneUI.sceneGameEditor.camera.targetLookAt[0];
        var gameEditorCameraY = this.sceneUI.sceneGameEditor.camera.targetLookAt[1];
        this.sceneUI.closeGameEditor();

        this.sceneUI.openAssetEditor( "Edit Player Icon", false, function (tex)
        {
            if( MultiplayerManager.LoggedIn )
            {
                if( tex )
                {
                    if( playerTypeInfo.icon !== tex )
                    {
                        playerTypeInfo.icon = tex;
                        AlertsManager.ModalAlert( "updating..." );
                        socket.emit( 'EditorGameEditPlayerIcon', gameInfo.id, playerTypeInfo.type, tex );
                    }
                }

                self.sceneUI.openGameEditor( gameInfo );

                // Restore our camera position
                self.sceneUI.sceneGameEditor.camera.targetLookAt[0] = gameEditorCameraX;
                self.sceneUI.sceneGameEditor.camera.targetLookAt[1] = gameEditorCameraY;
            }
        });
        this.sceneUI.editAsset( playerTypeInfo.icon );
    }
};


SceneGamesManager.prototype.onGameNewPlayer = function(clientID)
{
    if( MultiplayerManager.LoggedIn )
    {
        // Save our camera position before closing the game editor
        this.gameEditorCameraX = this.sceneUI.sceneGameEditor.camera.targetLookAt[0];
        this.gameEditorCameraY = this.sceneUI.sceneGameEditor.camera.targetLookAt[1];
        this.sceneUI.closeGameEditor();

        AlertsManager.ModalAlert( "updating..." );
        socket.emit( 'EditorGameNewPlayer', clientID );
    }
};


SceneGamesManager.prototype.onGameDeletePlayer = function(clientID, playerTypeID)
{
    if( MultiplayerManager.LoggedIn )
    {
        // Save our camera position before closing the game editor
        this.gameEditorCameraX = this.sceneUI.sceneGameEditor.camera.targetLookAt[0];
        this.gameEditorCameraY = this.sceneUI.sceneGameEditor.camera.targetLookAt[1];
        this.sceneUI.closeGameEditor();

        AlertsManager.ModalAlert( "updating..." );
        socket.emit( 'EditorGameDeletePlayer', clientID, playerTypeID );
    }
};
