/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : SceneMapsManager.js
 * Description : Editor singleton for common operations
 *
 * Created     : 01/03/13
 *-----------------------------------------------------------
 */

function EditorManager()
{
}


EditorManager.Red = new CCColour().setRGBA( 0.5, 0.0, 0.0, 1.0 );
EditorManager.LightRed = new CCColour().setRGBA( 0.75, 0.25, 0.25, 1.0 );
EditorManager.LightGreen = new CCColour().setRGBA( 0.25, 0.75, 0.25, 1.0 );
EditorManager.LightBlue = new CCColour().setRGBA( 0.25, 0.5, 0.75, 1.0 );
EditorManager.LightYellow = new CCColour().setRGBA( 0.75, 0.75, 0.25, 1.0 );


EditorManager.syncUpdate = function(jsonData)
{
    if( jsonData.EditorAudioDeleted )
    {
        AlertsManager.Hide( "deleting..." );
    }
    else if( jsonData.EditorModelDeleted )
    {
        AlertsManager.Hide( "deleting..." );
    }
    else if( jsonData.EditorImageDeleted )
    {
        AlertsManager.Hide( "deleting..." );
    }
    else if( jsonData.EditorCharacterDeleted )
    {
        AlertsManager.Hide( "deleting..." );
    }
};


EditorManager.EditorDeleteAudio = function(info)
{
    if( MultiplayerManager.LoggedIn )
    {
        MultiplayerManager.UpdateCallbacks.addOnce( this );

        AlertsManager.ModalAlert( "deleting..." );
        socket.emit( 'EditorAudioDelete', info.id );
    }
};


EditorManager.EditorDeleteModel = function(info)
{
    if( MultiplayerManager.LoggedIn )
    {
        MultiplayerManager.UpdateCallbacks.addOnce( this );

        AlertsManager.ModalAlert( "deleting..." );
        socket.emit( 'EditorModelDelete', info.objectID );
    }
};


EditorManager.EditorDeleteImage = function(info)
{
    if( MultiplayerManager.LoggedIn )
    {
        MultiplayerManager.UpdateCallbacks.addOnce( this );

        AlertsManager.ModalAlert( "deleting..." );
        socket.emit( 'EditorImageDelete', info.objectID );
    }
};


EditorManager.EditorDeleteCharacter = function(info)
{
    if( MultiplayerManager.LoggedIn )
    {
        MultiplayerManager.UpdateCallbacks.addOnce( this );

        AlertsManager.ModalAlert( "deleting..." );
        socket.emit( 'EditorCharacterDelete', info.objectID );
    }
};


EditorManager.EditorUploadJS = function(filename, data, callback, showAlert)
{
    if( showAlert === undefined )
    {
        showAlert = true;
    }

    if( showAlert )
    {
        AlertsManager.ModalAlert( "uploading..." );
    }
    var url = SERVER_ASSETS_URL + 'assets/upload.php';

    var postData = { "filename": filename };
    postData.file = new Blob( [data], { "type" : "text\/plain" } );

    // If we want to access our production server from a local session
    if( url.getDomain() !== windowDomain )
    {
        postData.url = url;
        url = SERVER_ROOT + "backend/helper.php?uploadfile";
    }

    var fileID = filename;
    gURLManager.requestURL(
        url,
        postData,
        function(status, responseText)
        {
            if( showAlert )
            {
                AlertsManager.Hide( "uploading..." );
            }

            if( status >= CCURLRequest.Succeeded )
            {
                if( responseText )
                {
                    var filename = responseText;
                    if( callback )
                    {
                        callback( fileID, filename );
                    }
                }
            }
        },
        1 );
};


EditorManager.EditorUploadFile = function(filename, data, callback, showAlert)
{
    if( showAlert === undefined )
    {
        showAlert = true;
    }

    if( showAlert )
    {
        AlertsManager.ModalAlert( "uploading..." );
    }
    var url = SERVER_ASSETS_URL + 'assets/upload.php';

    var postData = { "filename": filename };
    postData.file = new Blob( [data] );

    // If we want to access our production server from a local session
    if( url.getDomain() !== windowDomain )
    {
        postData.url = url;
        url = SERVER_ROOT + "backend/helper.php?uploadfile";
    }

    var uploadFilename = filename;
    gURLManager.requestURL(
        url,
        postData,
        function(status, newFilename)
        {
            if( showAlert )
            {
                AlertsManager.Hide( "uploading..." );
            }

            if( status >= CCURLRequest.Succeeded )
            {
                if( newFilename && newFilename.length > 0 )
                {
                    callback( uploadFilename, newFilename );
                    return;
                }
            }
            callback( uploadFilename, false );
        },
        1 );
};
