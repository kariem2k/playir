/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCAudioManager.js
 * Description : Manager of our audio player.
 *
 * Created     : 08/06/13
 *-----------------------------------------------------------
 */

function CCAudioManager()
{
}
CCAudioManager.Enabled = CC.LoadData( "AudioDisabled" ) ? false : true;
CCAudioManager.Paused = false;
CCAudioManager.MP3s = [];


CCAudioManager.ToggleAudio = function()
{
    CCAudioManager.Enabled = !CCAudioManager.Enabled;

    if( !CCAudioManager.Enabled )
    {
        CC.SaveData( "AudioDisabled", true );
    }
    else
    {
        CC.DeleteData( "AudioDisabled" );
    }

    var MP3s = CCAudioManager.MP3s;
    for( var i=0; i<MP3s.length; ++i )
    {
        var mp3 = MP3s[i];
        mp3.mute( CCAudioManager.Enabled ? false : true );
    }
};


CCAudioManager.IsPlaying = function(id)
{
    var MP3s = CCAudioManager.MP3s;
    for( var i=0; i<MP3s.length; ++i )
    {
        var mp3 = MP3s[i];
        if( mp3.id === id )
        {
            return mp3.isPlaying();
        }
    }
    return false;
};


CCAudioManager.Prepare = function(id, url, callback)
{
    var MP3s = CCAudioManager.MP3s;

    var mp3 = CCAudioManager.Get( id );
    if( mp3 )
    {
        if( mp3.url !== url )
        {
            CCAudioManager.Stop( id );
            mp3 = null;
        }
    }

    // MP3 already playing
    if( mp3 )
    {
        if( callback )
        {
            if( mp3.onLoadedCallbacks )
            {
                mp3.onLoadedCallbacks.push( callback );
            }
            else if( !mp3.error )
            {
                callback ( mp3 );
            }
        }
        return;
    }

    mp3 = new CCMP3( id, url );
    mp3.id = id;
    mp3.url = url;

    mp3.onLoadedCallbacks = [];
    if( callback )
    {
        mp3.onLoadedCallbacks.push( callback );
    }

    CCAudioManager.MP3s.push( mp3 );

    var OnCached = function(mp3)
    {
        return function (binary)
        {
            CCAudioManager.Prepared( mp3.id, mp3.url, binary );
        };
    };
    CCAudioManager.Cache( url, new OnCached( mp3 ) );
};


CCAudioManager.Cache = function(url, callback)
{
    var filename = url.getFilename();
    var downloadURL = MultiplayerManager.GetAssetURL( url );
    gURLManager.requestURL(
        downloadURL,
        null,
        function (status, responseBinary)
        {
            if( status >= CCURLRequest.Succeeded )
            {
                if( responseBinary )
                {
                    if( callback )
                    {
                        callback( responseBinary );
                    }
                }
            }
        },
        0, filename, null, null, true );
};


CCAudioManager.Get = function(id)
{
    var MP3s = CCAudioManager.MP3s;
    for( var i=0; i<MP3s.length; ++i )
    {
        var mp3 = MP3s[i];
        if( mp3.id === id )
        {
            return mp3;
        }
    }
    return null;
};


CCAudioManager.Stop = function(id)
{
    var mp3 = CCAudioManager.Get( id );
    if( mp3 )
    {
        CCAudioManager.MP3s.remove( mp3 );
        mp3.stop();
        return true;
    }
    return false;
};


CCAudioManager.Pause = function()
{
    CCAudioManager.Paused = true;

    var MP3s = CCAudioManager.MP3s;
    for( var i=0; i<MP3s.length; ++i )
    {
        var mp3 = MP3s[i];
        mp3.pause();
    }
};


CCAudioManager.Resume = function()
{
    CCAudioManager.Paused = false;

    var MP3s = CCAudioManager.MP3s;
    for( var i=0; i<MP3s.length; ++i )
    {
        var mp3 = MP3s[i];
        mp3.resume();
    }
};


CCAudioManager.IsDetectingSpeechState = function()
{

};


CCAudioManager.StartSpeechDetection = function()
{

};


CCAudioManager.StopSpeechDetection = function()
{

};