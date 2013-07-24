/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCWebAudioManager.js
 * Description : Manager of our audio player.
 *
 * Created     : 11/07/13
 *-----------------------------------------------------------
 */

function CCMP3()
{
    this.stop = function()
    {
        if( this.audio )
        {
            if( this.onEndLoopFunction )
            {
                this.audio.removeEventListener( 'end', this.onEndLoopFunction );
                delete this.onEndLoopFunction;
            }
            this.audio.pause();
        }
    };

    this.pause = function()
    {
        if( this.audio && !this.audio.paused )
        {
            this.audio.pause();
        }
    };

    this.resume = function()
    {
        if( this.loaded && this.audio && !this.audio.ended )
        {
            this.audio.play();
        }
    };

    this.mute = function(toggle)
    {
        if( this.audio )
        {
            this.audio.muted = toggle;
        }
    };

    this.isPlaying = function()
    {
        if( this.audio )
        {
            return !this.audio.paused;
        }
    };
}


CCAudioManager.Play = function(id, url, restart, loop, callback)
{
    CCAudioManager.Prepare( id, url, function (mp3)
    {
        if( restart && mp3.audio.currentTime > 0 )
        {
            mp3.audio.currentTime = 0;
        }

        if( mp3.audio.paused )
        {
            mp3.audio.play();
        }

        if( loop )
        {
            if( !mp3.onEndLoopFunction )
            {
                mp3.onEndLoopFunction = function ()
                {
                    mp3.audio.currentTime = 0;
                    mp3.audio.play();
                };
                mp3.audio.addEventListener( 'ended', mp3.onEndLoopFunction );
            }
        }
        else
        {
            if( mp3.onEndLoopFunction )
            {
                mp3.audio.removeEventListener( 'ended', mp3.onEndLoopFunction );
                delete mp3.onEndLoopFunction;
            }
        }

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
            var downloadedURL;
            if( CCEngine.NativeUpdateCommands !== undefined )
            {
                downloadedURL = binary;
            }
            else
            {
                var windowURL = window.URL || window.webkitURL;
                if( windowURL && windowURL.createObjectURL )
                {
                    var blob = new Blob( [binary] );

                    // Obtain a blob URL reference to our worker 'file'.
                    var blobURL = windowURL.createObjectURL( blob );
                    downloadedURL = blobURL;
                }
            }

            //alert( downloadedURL );
            if( downloadedURL )
            {
                var audio = new Audio();
                audio.controls = true;
                audio.preload = "auto";

                //alert( 'audio.prepared' );

                audio.addEventListener( 'error', function (e)
                {
                    //alert( 'audio.error' );
                    mp3.error = true;
                    delete mp3.onLoadedCallbacks;
                }, false);

                audio.src = downloadedURL;

                mp3.audio = audio;

                mp3.loaded = false;
                mp3.onReadyingToPlayFunction = function ()
                {
                    mp3.loaded = true;
                    audio.pause();
                    audio.removeEventListener( 'playing', mp3.onReadyingToPlayFunction );
                    delete mp3.onReadyingToPlayFunction;
                    if( mp3.onLoadedCallbacks )
                    {
                        for( var i=0; i<mp3.onLoadedCallbacks.length; ++i )
                        {
                            mp3.onLoadedCallbacks[i]( mp3 );
                        }
                        delete mp3.onLoadedCallbacks;
                    }
                };
                audio.addEventListener( 'playing', mp3.onReadyingToPlayFunction );

                audio.play();
            }
        }
    }
};
