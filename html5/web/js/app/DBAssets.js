/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : DBAssets.js
 * Description : DB for our models
 *
 * Created     : 21/05/13
 *-----------------------------------------------------------
 */

function DBAssets()
{
    this.initialized = false;
}


DBAssets.Initialize = function()
{
    MultiplayerManager.UpdateCallbacks.addOnce( this );

    if( !this.dbInfos )
    {
        this.dbInfos = [];
    }
    this.requests = [];
    this.currentRequest = null;

    this.updateCallbacks = [];

    this.initialized = true;
};



DBAssets.AddUpdateCallback = function(id, callback, pointer)
{
    if( pointer )
    {
        var packet = {};
        packet.id = id;
        packet.callback = callback;
        packet.pointer = pointer;
        this.updateCallbacks.push( packet );

        if( window.DEBUG_IsLocalClient )
        {
            //console.log( "DBAssets.AddUpdateCallback", id );
        }
    }
};


DBAssets.RemoveUpdateCallbacks = function(pointer)
{
    for( var i=0; i<this.updateCallbacks.length; ++i )
    {
        var packet = this.updateCallbacks[i];
        if( packet.pointer === pointer )
        {
            this.updateCallbacks.remove( packet );
            --i;
        }
    }
};


DBAssets.RunUpdateCallbacks = function(id, info)
{
    for( var i=0; i<this.updateCallbacks.length; ++i )
    {
        var packet = this.updateCallbacks[i];
        if( packet.id === id )
        {
            packet.callback( info );
        }
    }
};


DBAssets.UpdateDBInfo = function(id, info)
{
    if( !this.initialized )
    {
        this.Initialize();
    }

    for( var i=0; i<this.dbInfos.length; ++i )
    {
        var dbInfo = this.dbInfos[i];
        var dbID = dbInfo.id;
        if( dbID === id )
        {
            this.dbInfos[i].info = info;
            DBAssets.RunUpdateCallbacks( id, info );
            return;
        }
    }

    var packet = { id:id, info:info };
    this.dbInfos.push( packet );
    DBAssets.RunUpdateCallbacks( id, info );
};


DBAssets.LoadDBInfos = function(dbInfos)
{
    if( !this.initialized )
    {
        this.Initialize();
    }

    for( var i=0; i<dbInfos.length; ++i )
    {
        var dbInfo = dbInfos[i];
        var id = DBAssets.GetID( dbInfo );
        dbInfo.localCachedVersion = true;
        DBAssets.UpdateDBInfo( id, dbInfo );
    }
};


DBAssets.RemoveDBID = function(id)
{
    var dbInfos = this.dbInfos;
    if( dbInfos )
    {
        for( var i=0; i<dbInfos.length; ++i )
        {
            var dbInfo = dbInfos[i];
            var dbID = dbInfo.id;
            if( dbID === id )
            {
                dbInfos.remove( dbInfo );
                break;
            }
        }
    }
};


DBAssets.LoadCharacters = function(characterInfos)
{
    for( var i=0; i<characterInfos.length; ++i )
    {
        var characterInfo = characterInfos[i];
        DBAssets.UpdateDBInfo( characterInfo.objectID, characterInfo );
    }
};


DBAssets.syncLoggedIn = function()
{
    {
        var SyncAssetIDs = [];
        for( var i=0; i<this.dbInfos.length; ++i )
        {
            var id = this.dbInfos[i].id;
            SyncAssetIDs.push( id );
        }
        MultiplayerManager.Emit( "SyncAssetIDs", SyncAssetIDs );
    }

    if( this.currentRequest )
    {
        this.Request();
    }
};


DBAssets.syncUpdate = function(jsonData)
{
    if( jsonData.mapInfo !== undefined )
    {
        this.Result( jsonData.id, jsonData.mapInfo );
    }
    if( jsonData.modelInfo !== undefined )
    {
        this.Result( jsonData.id, jsonData.modelInfo );
    }
    if( jsonData.characterInfo !== undefined )
    {
        this.Result( jsonData.id, jsonData.characterInfo );
    }
    if( jsonData.audioInfo !== undefined )
    {
        this.Result( jsonData.id, jsonData.audioInfo );
    }
};


DBAssets.LoadID = function(id, callback)
{
    if( id.startsWith( "audio" ) )
    {
        this.LoadAudioID( id, function (info)
        {
            if( callback )
            {
                callback( info );
            }
        });
    }
    else if( id.startsWith( "map" ) )
    {
        this.LoadMapID( id, function (info)
        {
            if( callback )
            {
                callback( info );
            }
        });
    }
    else if( id.startsWith( "model" ) )
    {
        this.LoadModelID( id, function (info)
        {
            if( callback )
            {
                callback( info );
            }
        });
    }
    else if( id.startsWith( "character" ) )
    {
        this.LoadCharacterID( id, function (info)
        {
            if( callback )
            {
                callback( info );
            }
        });
    }
};


DBAssets.LoadMapID = function(id, callback)
{
    if( !this.initialized )
    {
        this.Initialize();
    }

    var info = this.GetCachedID( id );
    if( info )
    {
        if( callback )
        {
            callback( info );
        }
        return;
    }

    var OnFinish = function(callback)
    {
        return function (info)
        {
            if( callback )
            {
                callback( info );
            }
        };
    };

    var request = {};
    request.type = "MapInfoRequest";
    request.id = id;
    request.callback = new OnFinish( callback );

    if( !this.currentRequest )
    {
        this.currentRequest = request;
        this.Request();
    }
    else
    {
        this.requests.push( request );
    }
};


DBAssets.LoadAudioID = function(id, callback)
{
    if( !this.initialized )
    {
        this.Initialize();
    }

    var info = this.GetCachedID( id );
    if( info )
    {
        if( callback )
        {
            callback( info );
        }
        return;
    }

    var OnFinish = function(callback)
    {
        return function (info)
        {
            if( info && info.mp3 )
            {
                CCAudioManager.Cache( info.mp3 );
            }

            if( callback )
            {
                callback( info );
            }
        };
    };

    var request = {};
    request.type = "AudioInfoRequest";
    request.id = id;
    request.callback = new OnFinish( callback );

    if( !this.currentRequest )
    {
        this.currentRequest = request;
        this.Request();
    }
    else
    {
        this.requests.push( request );
    }
};


DBAssets.LoadModelID = function(id, callback, priority, updatePointer)
{
    if( !this.initialized )
    {
        this.Initialize();
    }

    this.AddUpdateCallback( id, callback, updatePointer );

    var info = this.GetCachedID( id );
    if( info )
    {
        if( callback )
        {
            callback( info );
        }
        return;
    }

    if( updatePointer )
    {
        callback = null;
    }

    var OnFinish = function(callback)
    {
        return function (modelInfo)
        {
            if( callback )
            {
                callback( modelInfo );
            }

            // Cache model info in the background
            if( modelInfo )
            {
                // Buffer texture first
                if( modelInfo.tex )
                {
                    gEngine.textureManager.getTextureHandle( modelInfo.tex );
                }

                if( modelInfo.obj )
                {
                    CCModel3D.CacheModel( modelInfo.obj, true );
                }
            }
        };
    };

    var request = {};
    request.type = "ModelInfoRequest";
    request.id = id;
    request.callback = new OnFinish( callback );

    if( !this.currentRequest )
    {
        this.currentRequest = request;
        this.Request();
    }
    else
    {
        this.requests.push( request );
        if( priority > 0 )
        {
            request.priority = priority;
            for( var i=0; i<this.requests.length; ++i )
            {
                var currentRequest = this.requests[i];
                if( !currentRequest.priority || currentRequest.priority < priority )
                {
                    this.requests.insert( request, i );
                    break;
                }
            }
        }
    }
};


DBAssets.LoadCharacterID = function(id, callback, updatePointer)
{
    if( !this.initialized )
    {
        this.Initialize();
    }

    this.AddUpdateCallback( id, callback, updatePointer );

    var info = this.GetCachedID( id );
    if( info )
    {
        if( callback )
        {
            callback( info );
        }
        return;
    }

    if( updatePointer )
    {
        callback = null;
    }

    var OnFinish = function(callback)
    {
        return function (characterInfo)
        {
            if( callback )
            {
                callback( characterInfo );
            }

            // Cache model and sfx info in the background
            if( characterInfo )
            {
                var actions = characterInfo.actions;
                for( var i=0; i<actions.length; ++i )
                {
                    var action = actions[i];
                    if( action.modelID )
                    {
                        DBAssets.LoadModelID( action.modelID );
                    }

                    if( action.sfxID )
                    {
                        DBAssets.LoadAudioID( action.sfxID );
                    }
                }
            }
            if( callback )
            {
                callback( characterInfo );
            }

        };
    };

    var request = {};
    request.type = "CharacterInfoRequest";
    request.id = id;
    request.callback = callback;

    if( !this.currentRequest )
    {
        this.currentRequest = request;
        this.Request();
    }
    else
    {
        this.requests.push( request );
    }
};


DBAssets.GetID = function(info)
{
    if( info.objectID )
    {
        return info.objectID;
    }
    else if( info.mapID )
    {
        return info.mapID;
    }
    return info.id;
};


DBAssets.GetCachedID = function(id)
{
    var dbInfos = this.dbInfos;
    for( var i=0; i<dbInfos.length; ++i )
    {
        var dbInfo = dbInfos[i];
        var dbID = dbInfo.id;
        if( dbID === id )
        {
            return dbInfo.info;
        }
    }
    return null;
};


DBAssets.Request = function()
{
    var requestID = this.currentRequest.id;
    var info = DBAssets.GetCachedID( requestID );
    if( info )
    {
        this.Result( requestID, info );
        return;
    }

    var requestType = this.currentRequest.type;
    if( window.DEBUG_IsLocalClient )
    {
        console.log( requestType, requestID );
    }
    MultiplayerManager.Emit( requestType, requestID );
};


DBAssets.Result = function(resultID, info)
{
    if( window.DEBUG_IsLocalClient )
    {
        //console.log( info );
    }

    if( this.currentRequest )
    {
        var requestID = this.currentRequest.id;
        if( requestID === resultID )
        {
            var callback = this.currentRequest.callback;

            this.UpdateDBInfo( resultID, info );
            this.currentRequest = null;
            if( callback )
            {
                callback( info );
            }
        }
    }

    if( !this.currentRequest )
    {
        if( this.requests.length > 0 )
        {
            this.currentRequest = this.requests.safePop();
            this.Request();
        }
    }
};


DBAssets.PrepareAudioID = function(channel, audioID)
{
    DBAssets.LoadAudioID( audioID, function (info)
    {
        if( info && info.mp3 )
        {
            CCAudioManager.Prepare( channel, info.mp3 );
        }
    });
};


DBAssets.PlayAudioID = function(channel, audioID, restart, loop)
{
    DBAssets.LoadAudioID( audioID, function (info)
    {
        if( info && info.mp3 )
        {
            CCAudioManager.Play( channel, info.mp3, restart, loop );
        }
    });
};
