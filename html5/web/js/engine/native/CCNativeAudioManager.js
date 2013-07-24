/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCNativeAudioManager.js
 * Description : Manager of our audio player.
 *
 * Created     : 11/07/13
 *-----------------------------------------------------------
 */

function CCMP3()
{
    this.stop = function()
    {
        this.paused = true;
        CCEngine.NativeUpdateCommands += 'CCAudioManager.Stop;' + this.id + '\n';
    };

    this.pause = function()
    {
        this.paused = true;
        CCEngine.NativeUpdateCommands += 'CCAudioManager.Pause;' + this.id + '\n';
    };

    this.resume = function()
    {
        this.paused = false;
        CCEngine.NativeUpdateCommands += 'CCAudioManager.Resume;' + this.id + '\n';
    };

    this.mute = function(toggle)
    {
        this.muted = toggle;
        CCEngine.NativeUpdateCommands += 'CCAudioManager.SetVolume;' + this.id + ';' + ( toggle ? 0.0 : 1.0 ) + '\n';
    };

    this.isPlaying = function()
    {
        return !this.paused && !this.ended;
    };
}


CCAudioManager.Ended = function(id, url)
{
    var mp3 = CCAudioManager.Get( id );
    if( mp3 )
    {
        if( mp3.url === url )
        {
            mp3.ended = true;
        }
    }
};


CCAudioManager.Play = function(id, url, restart, loop, callback)
{
    CCAudioManager.Prepare( id, url, function (mp3)
    {
        CCEngine.NativeUpdateCommands += 'CCAudioManager.Play;' + id + ';' + url + ';' + restart + ';' + loop + '\n';

        mp3.mute( CCAudioManager.Enabled ? false : true );

        if( CCAudioManager.Paused )
        {
            CCAudioManager.Pause();
        }

        if( callback )
        {
            callback();
        }
    });
};


CCAudioManager.Prepared = function(id, url, binary)
{
    var mp3 = CCAudioManager.Get( id );
    if( mp3 )
    {
        if( mp3.url === url )
        {
            mp3.loaded = true;
            if( mp3.onLoadedCallbacks )
            {
                for( var i=0; i<mp3.onLoadedCallbacks.length; ++i )
                {
                    mp3.onLoadedCallbacks[i]( mp3 );
                }
                delete mp3.onLoadedCallbacks;
            }
        }
    }
};
