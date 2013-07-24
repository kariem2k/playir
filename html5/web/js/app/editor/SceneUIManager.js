/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : SceneUIManager.js
 * Description : Manager of our UI editor.
 *
 * Created     : 31/05/13
 *-----------------------------------------------------------
 */

function SceneUIManager(uiID, onSelect, onClose)
{
    this.construct();

    if( uiID )
    {
        this.loadingUI = uiID;
    }
    else
    {
        var managerSettings = CC.GetJSLocationBarData( 'SceneUIManager' );
        if( managerSettings && managerSettings !== "menu" )
        {
            this.loadingUI = managerSettings;
        }
    }

    if( onSelect )
    {
        this.onSelect = onSelect;
    }

    if( onClose )
    {
        this.onClose = onClose;
    }

    gEngine.addScene( this );
}
ExtendPrototype( SceneUIManager, SceneManagerPlay );


SceneUIManager.prototype.construct = function()
{
    this.SceneManagerPlay_construct();

    this.disconnected();
};


SceneUIManager.prototype.destruct = function()
{
    this.SceneManagerPlay_destruct();
};


SceneUIManager.prototype.deleteLater = function()
{
    if( window.socket )
    {
        if( !this.unregistered )
        {
            this.unregistered = false;
            socket.emit( 'EditorUIUnregisterUpdates' );
        }
    }

    CC.RemoveJSLocationBarData( 'SceneUIManager' );
    this.SceneManagerPlay_deleteLater();
};


SceneUIManager.prototype.setup = function()
{
    this.SceneManagerPlay_setup();
};


SceneUIManager.prototype.onPause = function()
{
    if( this.syncJSTime !== undefined )
    {
        this.syncJS();
    }
};


SceneUIManager.prototype.updateScene = function(delta)
{
    var updated = this.SceneManagerPlay_updateScene( delta );

    if( this.syncJSTime !== undefined )
    {
        this.syncJSTime -= delta;
        if( this.syncJSTime <= 0.0 )
        {
            this.syncJS();
        }
    }

    return updated;
};


SceneUIManager.prototype.disconnected = function()
{
    AlertsManager.ModalAlert( "connecting...", 2 );

    if( this.ui )
    {
        if( !this.loadingUI )
        {
            if( this.ui.info )
            {
                this.loadingUI = this.ui.info.id;
            }
        }
        // Reset state
        this.ui.deleteLater();
        this.ui = null;
    }
};


SceneUIManager.prototype.syncLoggedIn = function()
{
    this.SceneManagerPlay_syncLoggedIn();

    socket.emit( 'EditorUIRegisterUpdates' );
    AlertsManager.Hide( "connecting..." );

    if( this.webViewController )
    {
        CCEngine.WebViewClose( this.webViewController );
        delete this.webViewController;
    }

    if( this.loadingUI )
    {
        this.requestUI( this.loadingUI );
        delete this.loadingUI;
    }
    else
    {
        this.openList();
    }
};


SceneUIManager.prototype.syncUpdate = function(jsonData)
{
    this.SceneManagerPlay_syncUpdate( jsonData );

    var info, id;
    if( jsonData.EditorUIUpdated )
    {
        if( this.ui )
        {
            info = this.ui.info;
            var newInfo = jsonData.EditorUIUpdated;
            if( info.id === newInfo.id )
            {
                if( info.filename !== newInfo.filename )
                {
                    this.openUI( newInfo );
                }
            }
        }
    }
    else if( jsonData.EditorUICreated )
    {
        AlertsManager.Hide( "loading..." );

        info = jsonData.EditorUICreated;
        this.openUI( info );
    }
    else if( jsonData.EditorUICopied !== undefined )
    {
        AlertsManager.Hide( "copying..." );

        if( this.ui )
        {
            this.handleBackButton();
        }

        info = jsonData.EditorUICopied;
        if( info )
        {
            this.openUI( info );
            AlertsManager.TimeoutAlert( "UI Copied", 2.0 );
        }
        else
        {
            AlertsManager.TimeoutAlert( "failed to copy UI", 2.0 );
        }
    }
    else if( jsonData.EditorUIDeleted !== undefined )
    {
        AlertsManager.Hide( "deleting..." );

        id = jsonData.EditorUIDeleted;

        if( id === -1 )
        {
            AlertsManager.TimeoutAlert( "failed to delete UI", 2.0 );
        }
        this.handleBackButton();
    }
    else if( jsonData.uiInfo !== undefined )
    {
        AlertsManager.Hide( "loading..." );

        info = jsonData.uiInfo;
        if( info )
        {
            this.openUI( info );
        }
        else
        {
            AlertsManager.TimeoutAlert( "failed to load UI", 2.0 );
            this.openList();
        }
    }
};


SceneUIManager.prototype.openList = function()
{
    CC.SetJSLocationBarData( 'SceneUIManager', 'menu' );

    if( this.sceneList )
    {
        this.closeList();
    }

    this.sceneList = new SceneUIManagerList( this );
    gEngine.addScene( this.sceneList );
};


SceneUIManager.prototype.closeList = function()
{
    if( this.sceneList )
    {
        this.sceneList.deleteLater();
        this.sceneList = null;
    }
};


SceneUIManager.prototype.createUI = function(open)
{
    AlertsManager.ModalAlert( "loading..." );
    socket.emit( 'EditorUICreate', open );
};


SceneUIManager.prototype.requestUI = function(id)
{
    AlertsManager.ModalAlert( "loading..." );
    socket.emit( 'UIRequest', id );
};


SceneUIManager.prototype.openUI = function(info)
{
    if( this.onSelect )
    {
        if( this.onSelect( this, info ) )
        {
            return;
        }
    }

    if( this.ui )
    {
        this.handleBackButton( true );
    }

    CC.SetJSLocationBarData( 'SceneUIManager', info.id );

    this.ui = new SceneUIEditor( info, this );
    this.closeList();

    if( info.filename )
    {
        var filename = info.filename;
        var url = MultiplayerManager.GetAssetURL( info.filename );

        AlertsManager.ModalAlert( "loading..." );
        var self = this;
        gURLManager.requestURL( url,
            null,
            function (status, responseText)
            {
                AlertsManager.Hide( "loading..." );

                var loaded = false;
                if( status >= CCURLRequest.Succeeded )
                {
                    loaded = self.ui.loadJS( responseText );
                }

                if( !loaded )
                {
                    AlertsManager.TimeoutAlert( "failed to load js :(", 2.0 );
                }
            },
            1,
            filename );
    }
};


SceneUIManager.prototype.handleBackButton = function(resetting)
{
    if( this.ui )
    {
        if( this.syncJSTime !== undefined )
        {
            this.syncJS();
        }

        if( this.webViewController )
        {
            CCEngine.WebViewClose( this.webViewController );
            delete this.webViewController;
        }

        // Reset state
        this.ui.deleteLater();
        this.ui = null;

        if( !resetting )
        {
            this.openList();

            if( this.onClose )
            {
                this.close();
            }
        }
    }
    return true;
};


SceneUIManager.prototype.handleDelete = function()
{
    if( this.ui )
    {
        if( MultiplayerManager.LoggedIn )
        {
            var self = this;
            AlertsManager.ConfirmationAlert( "Delete UI?", function(result)
            {
                if( result )
                {
                    if( MultiplayerManager.LoggedIn )
                    {
                        AlertsManager.Hide( "deleting..." );
                        socket.emit( 'EditorUIDelete', self.ui.info.id );
                    }
                }
            });
        }
    }
};


SceneUIManager.prototype.handleEditName = function()
{
    if( this.ui )
    {
        if( MultiplayerManager.LoggedIn )
        {
            var self = this;
            var ui = this.ui;
            var name = ui.info.name;
            AlertsManager.InputAlert( name, function(result)
            {
                if( result )
                {
                    if( name !== result )
                    {
                        if( MultiplayerManager.LoggedIn )
                        {
                            ui.info.name = result;
                            ui.sceneUI.setupMenu( ui.info );

                            socket.emit( 'EditorUIEditName', ui.info.id, ui.info.name );
                            self.syncJS();
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


SceneUIManager.prototype.handleEditPrivacy = function()
{
    if( this.ui )
    {
        if( MultiplayerManager.LoggedIn )
        {
            var self = this;
            var ui = this.ui;
            var open = ui.info.open;
            AlertsManager.ConfirmationAlert( open ? "Make private?" : "Make public?", function(result)
            {
                if( result )
                {
                    if( MultiplayerManager.LoggedIn )
                    {
                        ui.info.open = !open;
                        ui.sceneUI.setupMenu( ui.info );

                        socket.emit( 'EditorUIEditPrivacy', ui.info.id, ui.info.open );
                    }
                }
            });
        }
    }
};


SceneUIManager.prototype.handleEditJS = function()
{
    if( MultiplayerManager.LoggedIn )
    {
        if( this.ui )
        {
            if( MultiplayerManager.LoggedIn )
            {
                var self = this;
                var ui = this.ui;
                var info = ui.info;
                var fileID = info.id;

                var OpenCodeEditor = function(filename)
                {
                    var url = SERVER_ROOT + 'edit/jscodeeditor.php#file=' + filename;
                    if( SERVER_ASSETS_URL.getDomain() !== windowDomain )
                    {
                        url += "&proxy=" + SERVER_ASSETS_URL;
                    }
                    CCEngine.WebViewOpen( url,
                        function (webViewController, opened)
                        {
                            if( webViewController && opened )
                            {
                                self.webViewController = webViewController;
                                webViewController.webView.fileID = fileID;
                            }
                        },
                        function(webViewController, url, open)
                        {
                            if( open )
                            {
                                var splitURL = url.split( "#save" );
                                if( splitURL.length > 1 )
                                {
                                    if( MultiplayerManager.LoggedIn )
                                    {
                                        if( self.webViewController )
                                        {
                                            var webView = self.webViewController.webView;
                                            var data = webView.GetData();
                                            webView.SavedData( data );
                                            self.uploadJS( fileID, data, true );

                                            // Reload UI
                                            self.ui.deleteLater();
                                            self.ui = new SceneUIEditor( info, self );
                                            self.ui.loadJS( data );
                                        }
                                    }
                                }
                            }
                        }, "jseditor", "_newtab" );
                };

                if( this.syncJSTime !== undefined )
                {
                    this.syncJS( OpenCodeEditor );
                }
                else
                {
                    OpenCodeEditor( info.filename );
                }
            }
        }
    }
};


SceneUIManager.prototype.close = function()
{
    this.deleteLater();

    if( this.onClose )
    {
        this.onClose();
    }
    else
    {
        new SceneGamesManager();
    }
};


SceneUIManager.prototype.objectSelected = function(hitObject, location)
{
    var ui = this.ui;
    var selectedObjects = ui.selectedObjects;

    var i;

    // Turn off create button
    if( ui.sceneUI.creatingObjects )
    {
        ui.sceneUI.handleCreateButton();
    }

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
        if( !gEngine.controls.keys[91] && !gEngine.controls.keys[17] )
        {
            ui.selectedObjectsClear();
        }
        else
        {
            ui.selectedObjectsRemove( hitObject );
        }
    }
    else
    {
        if( !gEngine.controls.keys[91] && !gEngine.controls.keys[17] )
        {
            ui.selectedObjectsClear();
        }
        if( hitObject )
        {
            ui.selectedObjectsAdd( hitObject );
        }
    }
};


SceneUIManager.prototype.objectCreated = function()
{
    this.requestSyncJS();
};


SceneUIManager.prototype.objectsMoved = function()
{
    this.requestSyncJS();
};


SceneUIManager.prototype.objectsResized = function()
{
    this.requestSyncJS();
};


SceneUIManager.prototype.objectUpdated = function()
{
    this.requestSyncJS();
};


SceneUIManager.prototype.objectDeleted = function()
{
    this.requestSyncJS();
};


SceneUIManager.prototype.requestSyncJS = function()
{
    this.syncJSTime = 1.0;

    if( this.webViewController )
    {
        CCEngine.WebViewClose( this.webViewController );
        delete this.webViewController;
    }
};


SceneUIManager.prototype.syncJS = function(callback)
{
    if( MultiplayerManager.LoggedIn )
    {
        delete this.syncJSTime;
        if( this.ui )
        {
            var id = this.ui.info.id;
            if( MultiplayerManager.IsOwner( this.ui.info.owners ) )
            {
                var fileID = id;
                var data = this.ui.exportJS();
                this.uploadJS( fileID, data, false, callback );
            }
            else
            {
                AlertsManager.ConfirmationAlert( "In order to make changes to this UI,\nyou must first create a copy", function(result)
                {
                    if( result )
                    {
                        if( MultiplayerManager.LoggedIn )
                        {
                            AlertsManager.ModalAlert( "copying..." );
                            socket.emit( 'EditorUICopy', id );
                        }
                    }
                });
            }
        }
    }
};


SceneUIManager.prototype.uploadJS = function(fileID, data, alert, callback)
{
    var self = this;
    EditorManager.EditorUploadJS( fileID, data, function (fileID, filename)
    {
        var uploaded = false;
        if( filename )
        {
            if( MultiplayerManager.LoggedIn )
            {
                uploaded = true;
                self.uploadedJS( filename );
                if( callback )
                {
                    callback( filename );
                }
            }
        }

        if( !uploaded )
        {
            AlertsManager.TimeoutAlert( "failed to upload " + fileID + " :(", 2.0 );
        }
    },
    alert );
};


SceneUIManager.prototype.uploadedJS = function(filename)
{
    if( this.ui )
    {
        var info = this.ui.info;
        info.filename = filename;
        socket.emit( 'EditorUIUpdateJS', info.id, filename );
    }
};


SceneUIManager.prototype.onDragDrop = function(files, event)
{
    if( event && event.target )
    {
        if( MultiplayerManager.LoggedIn )
        {
            if( this.ui )
            {
                var self = this;

                if( !this.ui.sceneUI.sceneAssetEditor )
                {
                    //this.ui.sceneUI.openAssetEditor( "Upload Texture", false );
                }
            }
        }
    }
};