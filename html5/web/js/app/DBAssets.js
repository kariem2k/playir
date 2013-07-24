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
    MultiplayerManager.UpdateCallbacks.add( this );

    this.dbInfos = [];
    this.requests = [];
    this.currentRequest = null;

    this.initialized = true;
};


DBAssets.syncLoggedIn = function()
{
    if( this.currentRequest )
    {
        this.Request();
    }
};


DBAssets.syncUpdate = function(jsonData)
{
    if( jsonData.mapInfo !== undefined )
    {
        this.Result( jsonData.mapInfo );
    }
    if( jsonData.modelInfo !== undefined )
    {
        this.Result( jsonData.modelInfo );
    }
    if( jsonData.characterInfo !== undefined )
    {
        this.Result( jsonData.characterInfo );
    }
    if( jsonData.audioInfo !== undefined )
    {
        this.Result( jsonData.audioInfo );
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


DBAssets.LoadModelID = function(id, callback)
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
    }
};


DBAssets.LoadCharacterID = function(id, callback)
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


DBAssets.GetResultID = function(info)
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
        var info = dbInfos[i];
        var resultID = DBAssets.GetResultID( info );

        if( resultID === id )
        {
            return info;
        }
    }
    return null;
};


DBAssets.Request = function()
{
    if( MultiplayerManager.LoggedIn )
    {
        var requestID = this.currentRequest.id;
        var info = DBAssets.GetCachedID( requestID );
        if( info )
        {
            this.Result( info );
            return;
        }

        var requestType = this.currentRequest.type;
        socket.emit( requestType, requestID );
    }
};


DBAssets.Result = function(info)
{
    var resultID;
    var requestID;
    var callback;

    if( info )
    {
        var dbInfos = this.dbInfos;
        dbInfos.push( info );

        if( this.currentRequest )
        {
            resultID = DBAssets.GetResultID( info );
            requestID = this.currentRequest.id;
            if( resultID === requestID )
            {
                callback = this.currentRequest.callback;
                this.currentRequest = null;
                callback( info );
            }
        }
    }
    else
    {
        if( this.currentRequest )
        {
            this.currentRequest = null;
        }
    }

    if( !this.currentRequest && this.requests.length > 0 )
    {
        this.currentRequest = this.requests.safePop();
        this.Request();
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
