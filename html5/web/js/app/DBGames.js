/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : DBGames.js
 * Description : DB for our games list
 *
 * Created     : 15/02/13
 *-----------------------------------------------------------
 */

function DBGames()
{
    MultiplayerManager.UpdateCallbacks.add( this );

    this.gameInfos = [];
}


DBGames.prototype.load = function(loadedCallback, updatedCallback, editableGamesOnly)
{
    this.loadedCallback = loadedCallback;
    this.updatedCallback = updatedCallback;
    this.editableGamesOnly = editableGamesOnly;

    if( !window.FORCE_ONLINE && !editableGamesOnly )
    {
        var gameInfosString = CC.LoadData( "gameInfos" );
        var gameInfos = gameInfosString ? JSON.parse( gameInfosString ) : null;
        if( gameInfos )
        {
            this.loadGameInfos( gameInfos );
        }
        else
        {
            // Use Phone Wars game info if no gameInfo is cached
            gameInfos = [{
                            "id":"androids",
                            "name":"Phone Wars",
                            "open":true,
                            "titleImage":"phonewars_title.jpg",
                            "jsStart":"SceneManagerAndroids"
                        }];
            this.loadGameInfos( gameInfos );
        }
    }
};


DBGames.prototype.destruct = function()
{
    MultiplayerManager.UpdateCallbacks.remove( this );

    if( window.socket )
    {
        if( this.syncingUpdates )
        {
            this.syncingUpdates = false;
            socket.emit( 'MultiUnregisterGamesListUpdates' );
        }
    }
};


DBGames.prototype.reconnectGamesList = function()
{
    if( MultiplayerManager.LoggedIn )
    {
        socket.emit( 'MultiRequestGamesList', this.editableGamesOnly );
        this.syncingUpdates = true;
    }
};


DBGames.prototype.requestGameID = function(gameID)
{
    if( MultiplayerManager.LoggedIn )
    {
        socket.emit( 'RequestGameInfo', gameID );
    }
};


DBGames.prototype.syncUpdate = function(jsonData)
{
    if( jsonData.multiGamesList )
    {
        //console.log( "DBGames", jsonData.multiGamesList );
        CC.SaveData( "gameInfos", JSON.stringify( jsonData.multiGamesList ) );
        this.loadGameInfos( jsonData.multiGamesList );
    }
    else if( jsonData.multiGamesListUpdated )
    {
        this.updatedGameInfo( jsonData.multiGamesListUpdated );
    }
    else if( jsonData.RequestGameInfo )
    {
        this.updatedGameInfo( jsonData.RequestGameInfo );
    }
    else if( jsonData.multiGamesListRemoved )
    {
        this.removedGameInfo( jsonData.multiGamesListRemoved );
    }
};


DBGames.prototype.loadGameInfos = function(gameInfos)
{
    this.gameInfos.length = 0;
    for( var i=0; i<gameInfos.length; ++i )
    {
        this.gameInfos.add( gameInfos[i] );
    }

    if( this.loadedCallback )
    {
        this.loadedCallback( gameInfos );
    }
};


DBGames.prototype.updatedGameInfo = function(gameInfo)
{
    for( var i=0; i<this.gameInfos.length; ++i )
    {
        if( this.gameInfos[i].id === gameInfo.id )
        {
            this.gameInfos[i] = gameInfo;

            if( this.updatedCallback )
            {
                this.updatedCallback( gameInfo );
            }
            return;
        }
    }

    this.gameInfos.push( gameInfo );

    if( this.updatedCallback )
    {
        this.updatedCallback( gameInfo );
    }
};


DBGames.prototype.removedGameInfo = function(gameInfo)
{
    for( var i=0; i<this.gameInfos.length; ++i )
    {
        if( this.gameInfos[i].id === gameInfo.id )
        {
            this.gameInfos.remove( this.gameInfos[i] );

            if( this.updatedCallback )
            {
                this.updatedCallback( gameInfo, true );
            }
            return;
        }
    }
};


DBGames.prototype.getGameInfo = function(clientID)
{
    var gameInfos = this.gameInfos;
    for( var i=0; i<gameInfos.length; ++i )
    {
        var gameInfo = gameInfos[i];
        if( gameInfo.id === clientID )
        {
            return gameInfo;
        }
    }

    return null;
};
