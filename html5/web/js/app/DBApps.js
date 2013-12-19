/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : DBApps.js
 * Description : DB for our projects list
 *
 * Created     : 15/02/13
 *-----------------------------------------------------------
 */

function DBApps()
{
    MultiplayerManager.UpdateCallbacks.addOnce( DBApps );

    DBApps.Instances.add( this );

    if( MultiplayerManager.LoggedIn )
    {
        DBApps.syncLoggedIn();
    }
}

DBApps.Instances = [];
DBApps.SyncingUpdates = false;
DBApps.AppInfos = [];


DBApps.prototype.load = function(loadedCallback, updatedCallback)
{
    this.loadedCallback = loadedCallback;
    this.updatedCallback = updatedCallback;

    if( !window.FORCE_ONLINE )
    {
        if( DBApps.AppInfos.length === 0 )
        {
            var appInfosString = CC.LoadData( "appInfos" );
            var appInfos = appInfosString ? JSON.parse( appInfosString ) : null;
            if( appInfos )
            {
                DBApps.LoadAppInfos( appInfos );
            }
            else
            {
                // Use Phone Wars game info if no appInfo is cached
                appInfos = [{
                                "id":"androids",
                                "name":"Phone Wars",
                                "open":true,
                                "titleImage":"phonewars_title.jpg",
                                "jsStart":"SceneManagerAndroids"
                            }];
                DBApps.LoadAppInfos( appInfos );
            }
        }
        else
        {
            this.loadedCallback( DBApps.AppInfos );
        }
    }
};


DBApps.prototype.destruct = function()
{
    MultiplayerManager.UpdateCallbacks.remove( this );

    if( DBApps.Instances.remove( this ) )
    {
        if( DBApps.Instances.length === 0 )
        {
            if( DBApps.SyncingUpdates )
            {
                DBApps.SyncingUpdates = false;
                MultiplayerManager.Emit( 'AppsUnregisterListUpdates' );
            }
        }
    }
};


DBApps.syncDisconnected = function()
{
    if( DBApps.SyncingUpdates )
    {
        DBApps.SyncingUpdates = false;
    }
};


DBApps.syncLoggedIn = function()
{
    if( !DBApps.SyncingUpdates )
    {
        if( MultiplayerManager.Emit( 'AppsRequestList' ) )
        {
            DBApps.SyncingUpdates = true;
        }
    }
};


DBApps.syncUpdate = function(jsonData)
{
    if( jsonData.multiGamesList )
    {
        this.AppInfos.length = 0;
        this.LoadAppInfos( jsonData.multiGamesList );
    }
    else if( jsonData.multiGamesListUpdated )
    {
        this.UpdatedAppInfo( jsonData.multiGamesListUpdated );
    }
    else if( jsonData.AppsRequestInfo )
    {
        this.UpdatedAppInfo( jsonData.AppsRequestInfo );
    }
    else if( jsonData.multiGamesListRemoved )
    {
        this.RemovedAppInfo( jsonData.multiGamesListRemoved );
    }
};


DBApps.prototype.requestGameID = function(gameID)
{
    MultiplayerManager.Emit( 'AppsRequestInfo', gameID );
};


DBApps.LoadAppInfos = function(appInfos)
{
    var i;
    for( i=0; i<appInfos.length; ++i )
    {
        DBApps.AddAppInfo( appInfos[i] );
    }
    CC.SaveData( "appInfos", JSON.stringify( this.AppInfos ) );

    for( i=0; i<DBApps.Instances.length; ++i )
    {
        if( DBApps.Instances[i].loadedCallback )
        {
            DBApps.Instances[i].loadedCallback( appInfos );
        }
    }
};


DBApps.AddAppInfo = function(appInfo)
{
    var AppInfos = this.AppInfos;
    for( var i=0; i<AppInfos.length; ++i )
    {
        if( AppInfos[i].id === appInfo.id )
        {
            AppInfos[i] = appInfo;
            return;
        }
    }

    AppInfos.add( appInfo );
};


DBApps.UpdatedAppInfo = function(appInfo)
{
    var i, j;
    var AppInfos = this.AppInfos;
    for( i=0; i<AppInfos.length; ++i )
    {
        if( AppInfos[i].id === appInfo.id )
        {
            AppInfos[i] = appInfo;

            for( j=0; j<DBApps.Instances.length; ++j )
            {
                if( DBApps.Instances[j].updatedCallback )
                {
                    DBApps.Instances[j].updatedCallback( appInfo );
                }
            }
            return;
        }
    }

    AppInfos.push( appInfo );
    CC.SaveData( "appInfos", JSON.stringify( AppInfos ) );

    for( j=0; j<DBApps.Instances.length; ++j )
    {
        if( DBApps.Instances[j].updatedCallback )
        {
            DBApps.Instances[j].updatedCallback( appInfo );
        }
    }
};


DBApps.RemovedAppInfo = function(appInfo)
{
    var i, j;
    var AppInfos = this.AppInfos;
    for( i=0; i<AppInfos.length; ++i )
    {
        if( AppInfos[i].id === appInfo.id )
        {
            AppInfos.remove( AppInfos[i] );
            CC.SaveData( "appInfos", JSON.stringify( AppInfos ) );

            for( j=0; j<DBApps.Instances.length; ++j )
            {
                if( DBApps.Instances[j].updatedCallback )
                {
                    DBApps.Instances[j].updatedCallback( appInfo, true );
                }
            }
            return;
        }
    }
};


DBApps.prototype.getAppInfo = function(appID)
{
    var appInfos = DBApps.AppInfos;
    for( var i=0; i<appInfos.length; ++i )
    {
        var appInfo = appInfos[i];
        if( appInfo.id === appID )
        {
            return appInfo;
        }
    }

    return null;
};


DBApps.GetOwnedApps = function()
{
    var ownedApps = [];
    for( var i=0; i<DBApps.AppInfos.length; ++i )
    {
        var appInfo = DBApps.AppInfos[i];
        if( MultiplayerManager.IsOwner( appInfo.owners ) )
        {
            ownedApps.push( appInfo );
        }
    }
    return ownedApps;
};

