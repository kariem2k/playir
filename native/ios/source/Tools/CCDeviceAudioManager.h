/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCDeviceAudioManager.h
 * Description : iOS specific audio manager.
 *
 * Created     : 11/07/13
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

#ifdef __OBJC__
#import <AudioToolbox/AudioToolbox.h>
#import <AudioToolbox/ExtendedAudioFile.h>
#import <AVFoundation/AVFoundation.h>


struct AudioHandle
{
	AudioHandle(const char *id)
	{
        mp3Player = NULL;

        this->id = id;
        looping = false;
		paused = false;
        timeLastPlayed = 0.0f;
	}

    AVAudioPlayer *mp3Player;

    CCText id;
    CCText url;
    bool looping;
    bool paused;
    float timeLastPlayed;
};
#endif


class CCDeviceAudioManager
{
public:
    // Map API calls onto native thread (NT)
    static void Reset();
    static void ResetNT();

    static void Prepare(const char *id, const char *url);
    static struct AudioHandle* PrepareNT(const char *id, const char *url);

    static void Play(const char *id, const char *url, const bool restart, const bool loop);
    static void PlayNT(const char *id, const char *url, const bool restart, const bool loop);

    static void Stop(const char *id);
    static void StopNT(const char *id);

    static void Pause(const char *id);
    static void PauseNT(const char *id);

    static void Resume(const char *id);
    static void ResumeNT(const char *id);

    static void SetTime(const char *id, const float time);
    static void SetTimeNT(const char *id, const float time);

    static void SetVolume(const char *id, const float volume);
    static void SetVolumeNT(const char *id, const float volume);

protected:
    static struct AudioHandle* Get(const char *id);
    static void Trim();

    static void Prepare(struct AudioHandle &audioHandle, const char *filename);
    static void Play(struct AudioHandle &audioHandle, const char *filename, const bool restart, const bool loop);
    static void Stop(struct AudioHandle &audioHandle);

#ifdef __OBJC__
public:
    static void Ended(AVAudioPlayer *player, bool successfully);
#endif

protected:
	static CCList<struct AudioHandle> AudioHandles;
};
