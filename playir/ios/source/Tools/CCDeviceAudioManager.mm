/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCDeviceAudioManager.mm
 *-----------------------------------------------------------
 */

#import "CCDefines.h"
#import "CCAppManager.h"
#import "CCFileManager.h"


CCList<AudioHandle> CCDeviceAudioManager::AudioHandles;


void CCDeviceAudioManager::Reset()
{
    CCLAMBDA_UNSAFE( ThreadCall, {
        CCDeviceAudioManager::ResetNT();
    });

    gEngine->engineToNativeThread( new ThreadCall() );
}


void CCDeviceAudioManager::ResetNT()
{
    for( int i=0; i<AudioHandles.length; ++i )
    {
        Stop( *AudioHandles.list[i] );
    }
    AudioHandles.deleteObjects();
}


void CCDeviceAudioManager::Prepare(const char *id, const char *url)
{
    CCLAMBDA_2_UNSAFE( ThreadCall, CCText, id, CCText, url, {
        CCDeviceAudioManager::PrepareNT( id.buffer, url.buffer );
    });

    gEngine->engineToNativeThread( new ThreadCall( id, url ) );
}


AudioHandle* CCDeviceAudioManager::PrepareNT(const char *id, const char *url)
{
    Trim();

    AudioHandle *audioHandle = Get( id );
    if( audioHandle == NULL )
    {
        audioHandle = new AudioHandle( id );
        AudioHandles.add( audioHandle );
    }
    Prepare( *audioHandle, url);

    return audioHandle;
}


void CCDeviceAudioManager::Play(const char *id, const char *url, const bool restart, const bool loop)
{
    CCLAMBDA_4_UNSAFE( ThreadCall, CCText, id, CCText, url, bool, restart, bool, loop, {
        CCDeviceAudioManager::PlayNT( id.buffer, url.buffer, restart, loop );
    });

    gEngine->engineToNativeThread( new ThreadCall( id, url, restart, loop ) );
}


void CCDeviceAudioManager::PlayNT(const char *id, const char *url, const bool restart, const bool loop)
{
    AudioHandle *audioHandle = PrepareNT( id, url );
    Play( *audioHandle, url, restart, loop );
}


void CCDeviceAudioManager::Stop(const char *id)
{
    CCLAMBDA_1_UNSAFE( ThreadCall, CCText, id, {
        CCDeviceAudioManager::StopNT( id.buffer );
    });

    gEngine->engineToNativeThread( new ThreadCall( id ) );
}


void CCDeviceAudioManager::StopNT(const char *id)
{
    AudioHandle *audioHandle = Get( id );
    if( audioHandle != NULL )
    {
        Stop( *audioHandle );
    }
}


void CCDeviceAudioManager::Pause(const char *id)
{
    CCLAMBDA_1_UNSAFE( ThreadCall, CCText, id, {
        CCDeviceAudioManager::PauseNT( id.buffer );
    });

    gEngine->engineToNativeThread( new ThreadCall( id ) );
}


void CCDeviceAudioManager::PauseNT(const char *id)
{
    AudioHandle *audioHandle = Get( id );
    if( audioHandle != NULL )
    {
        if( audioHandle->mp3Player != NULL )
        {
            if( [audioHandle->mp3Player isPlaying] )
            {
                [audioHandle->mp3Player pause];
            }
        }
    }
}


void CCDeviceAudioManager::Resume(const char *id)
{
    CCLAMBDA_1_UNSAFE( ThreadCall, CCText, id, {
        CCDeviceAudioManager::ResumeNT( id.buffer );
    });

    gEngine->engineToNativeThread( new ThreadCall( id ) );
}


void CCDeviceAudioManager::ResumeNT(const char *id)
{
    AudioHandle *audioHandle = Get( id );
    if( audioHandle != NULL )
    {
        if( audioHandle->mp3Player != NULL )
        {
            if( ![audioHandle->mp3Player isPlaying] )
            {
                [audioHandle->mp3Player play];
            }
        }
    }
}


void CCDeviceAudioManager::SetTime(const char *id, const float time)
{
    CCLAMBDA_2_UNSAFE( ThreadCall, CCText, id, float, time, {
        CCDeviceAudioManager::SetTimeNT( id.buffer, time );
    });

    gEngine->engineToNativeThread( new ThreadCall( id, time ) );
}


void CCDeviceAudioManager::SetTimeNT(const char *id, const float time)
{
    AudioHandle *audioHandle = Get( id );
    if( audioHandle != NULL )
    {
        if( audioHandle->mp3Player != NULL )
        {
            audioHandle->mp3Player.currentTime = time;
        }
    }
}


void CCDeviceAudioManager::SetVolume(const char *id, const float volume)
{
    CCLAMBDA_2_UNSAFE( ThreadCall, CCText, id, float, volume, {
        CCDeviceAudioManager::SetVolumeNT( id.buffer, volume );
    });

    gEngine->engineToNativeThread( new ThreadCall( id, volume ) );
}


void CCDeviceAudioManager::SetVolumeNT(const char *id, const float volume)
{
    AudioHandle *audioHandle = Get( id );
    if( audioHandle != NULL )
    {
        if( audioHandle->mp3Player != NULL )
        {
            [audioHandle->mp3Player setVolume:volume];
        }
    }
}


AudioHandle* CCDeviceAudioManager::Get(const char *id)
{
    for( int i=0; i<AudioHandles.length; ++i )
    {
        AudioHandle *audioHandle = AudioHandles.list[i];
        if( CCText::Equals( audioHandle->id, id ) )
        {
            return audioHandle;
        }
    }
    return NULL;
}


void CCDeviceAudioManager::Trim()
{
    while( AudioHandles.length > 3 )
    {
        AudioHandle *oldestHandle = NULL;
        float oldestTime = gEngine->time.lifetime;

        for( int i=0; i<AudioHandles.length; ++i )
        {
            AudioHandle *audioHandle = AudioHandles.list[i];
            if( audioHandle->mp3Player == NULL )
            {
                oldestHandle = audioHandle;
                break;
            }
            else if( ![audioHandle->mp3Player isPlaying] )
            {
                oldestHandle = audioHandle;
                break;
            }
            else if( !audioHandle->looping )
            {
                if( audioHandle->timeLastPlayed < oldestTime )
                {
                    oldestHandle = audioHandle;
                    oldestTime = audioHandle->timeLastPlayed;
                }
            }
        }

        if( oldestHandle != NULL )
        {
            Stop( *oldestHandle );
            AudioHandles.remove( oldestHandle );
            delete oldestHandle;
        }
        else
        {
            break;
        }
    }
}


void CCDeviceAudioManager::Prepare(AudioHandle &audioHandle, const char *url)
{
    if( CCText::Equals( audioHandle.url, url ) == false )
    {
        Stop( audioHandle );
    }

    if( audioHandle.mp3Player == NULL )
    {
        CCResourceType resourceType = CCFileManager::FindFile( url );
        CCText filePath;
        CCFileManager::GetFilePath( filePath, url, resourceType );
        NSString *path = [NSString stringWithFormat:@"%s", filePath.buffer];

        NSData *audioData = [NSData dataWithContentsOfFile:path];

        AVAudioPlayer *mp3Player = [AVAudioPlayer alloc];

        NSError *error = NULL;
        if( [mp3Player initWithData:audioData error:&error] )
        {
            if( [mp3Player prepareToPlay] )
            {
#ifdef DEBUGON
                int count = [mp3Player retainCount];
                CCASSERT( count == 1 );
#endif
                [mp3Player setDelegate:gView];

                audioHandle.mp3Player = mp3Player;
                audioHandle.url = url;
                audioHandle.timeLastPlayed = gEngine->time.lifetime;
            }
            else
            {
                [mp3Player release];
#ifdef DEBUGON
                NSLog( @"Failed to prepareToPlay: %s", url );
#endif
            }
        }
        else
        {
            [mp3Player release];
#ifdef DEBUGON
            NSLog( @"Error: %@", [error description] );
#endif
        }
    }
}


void CCDeviceAudioManager::Play(AudioHandle &audioHandle, const char *url, const bool restart, const bool loop)
{
    Prepare( audioHandle, url );
    if( audioHandle.mp3Player != NULL )
    {
        if( restart )
        {
            if( [audioHandle.mp3Player isPlaying] )
            {
                [audioHandle.mp3Player stop];
            }
        }
        
        if( [audioHandle.mp3Player play] )
        {
            if( loop )
            {
                audioHandle.mp3Player.numberOfLoops = -1;
            }

            audioHandle.looping = loop;
            audioHandle.paused = false;

            audioHandle.timeLastPlayed = gEngine->time.lifetime;
        }
        else
        {
            Stop( audioHandle );

#ifdef DEBUGON
            NSLog( @"Failed to play: %s", url );
#endif
        }
    }
}


void CCDeviceAudioManager::Stop(AudioHandle &audioHandle)
{
    if( audioHandle.mp3Player != NULL )
    {
        [audioHandle.mp3Player release];
        audioHandle.mp3Player = NULL;
    }

}


void CCDeviceAudioManager::Ended(AVAudioPlayer *player, bool successfully)
{
    for( int i=0; i<AudioHandles.length; ++i )
    {
        AudioHandle *audioHandle = AudioHandles.list[i];
        if( audioHandle->mp3Player == player )
        {
            Stop( *audioHandle );

            CCAudioManager::Ended( audioHandle->id.buffer, audioHandle->url.buffer );
            break;
        }
    }
}
