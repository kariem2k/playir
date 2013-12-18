using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Text.RegularExpressions;
using System.Windows.Controls;


namespace PhoneXamlDirect3DApp
{
    class AudioHandle
    {
        public String id = null;
        public String url = null;
        public String path = null;
        public bool looping = false;
        public bool playing = false;
        public bool ended = false;
        public DateTime timeLastPlayed = DateTime.Now;

        public bool loaded = false;
        public MediaElement mediaElement = null;

        public void mediaElement_MediaOpened(object sender, System.Windows.RoutedEventArgs e)
        {
            if (sender == mediaElement)
            {
                loaded = true;
            }
        }

        public void mediaElement_MediaFailed(object sender, System.Windows.RoutedEventArgs e)
        {
            if (sender == mediaElement)
            {
                loaded = false;
            }
        }

        public void mediaElement_MediaEnded(object sender, System.Windows.RoutedEventArgs e)
        {
            if (sender == mediaElement)
            {
                if (looping)
                {
                    mediaElement.Play();
                }
                else
                {
                    playing = false;
                    ended = true;
                }
            }
        }

        public void prepare()
        {
            if (path != null)
            {
                if (mediaElement == null)
                {
                    mediaElement = new MediaElement();
                    MainPage.m_mainPage.LayoutRoot.Children.Add(mediaElement);

                    mediaElement.MediaOpened += mediaElement_MediaOpened;
                    mediaElement.MediaFailed += mediaElement_MediaFailed;
                    mediaElement.MediaEnded += mediaElement_MediaEnded;

                    if (mediaElement.Source == null)
                    {
                        mediaElement.Source = new Uri(path, UriKind.RelativeOrAbsolute);
                        mediaElement.Play();
                        mediaElement.Pause();
                    }
                }
                timeLastPlayed = DateTime.Now;
            }
        }

        public void play(bool restart, bool loop)
        {
            if (restart)
            {
                if (playing)
                {
                    mediaElement.Stop();
                }
            }

            if (!playing)
            {
                mediaElement.Play();
                playing = true;
                ended = false;
            }
            timeLastPlayed = DateTime.Now;

            looping = loop;
        }

        public void stop()
        {
            if (playing && !ended)
            {
                mediaElement.Stop();
                playing = false;
            }
        }

        public void pause()
        {
            if (playing && !ended)
            {
                mediaElement.Pause();
                playing = false;
            }
        }

        public void resume(bool hardResumeAfterApplicationRestart)
        {
            if (mediaElement != null)
            {
                if (hardResumeAfterApplicationRestart)
                {
                    double volume = mediaElement.Volume;
                    double time = time = (mediaElement.Position.TotalMilliseconds / 1000.0);

                    this.destroy();

                    this.prepare();
                    if (!ended)
                    {
                        this.play(false, looping);
                        this.setTime(time);
                    }
                    this.setVolume(volume);
                }
                else
                {
                    if (!playing && !ended)
                    {
                        mediaElement.Play();
                        playing = true;
                    }
                }
            }
        }

        public void setTime(double time)
        {
        }

        public void setVolume(double volume)
        {
        }

        public void destroy()
        {
            if (mediaElement != null)
            {
                MainPage.m_mainPage.LayoutRoot.Children.Remove(mediaElement);
                mediaElement = null;
            }
        }
    }

    class CSAudioManager
    {
        static List<AudioHandle> AudioHandles = new List<AudioHandle>();

        public static bool csWork(String action, String actionData)
        {
            if (action == "CCDeviceAudioManager::Reset")
            {
                MainPage.m_d3dInterop.csActionResult("CCDeviceAudioManager::Reseted", "");

                for (int i = 0; i < AudioHandles.Count; ++i)
                {
                    AudioHandle audioHandle = AudioHandles[i];
                    if (audioHandle.mediaElement != null)
                    {
                        audioHandle.stop();
                    }
                }

                return true;
            }
            else if (action == "CCDeviceAudioManager::Prepare")
            {
                MainPage.m_d3dInterop.csActionResult("CCDeviceAudioManager::Prepare", "");

                String[] split = Regex.Split(actionData, ", ");
                if (split.Length == 3)
                {
                    String id = split[0];
                    String url = split[1];
                    String path = split[2];

                    Prepare(id, url, path);
                }

                return true;
            }
            else if (action == "CCDeviceAudioManager::Play")
            {
                MainPage.m_d3dInterop.csActionResult("CCDeviceAudioManager::Play", "");

                String[] split = Regex.Split(actionData, ", ");
                if (split.Length == 5)
                {
                    String id = split[0];
                    String url = split[1];
                    String path = split[2];
                    bool restart = split[3].Equals("true");
                    bool loop = split[4].Equals("true");

                    AudioHandle audioHandle = Prepare(id, url, path);
                    if (audioHandle != null)
                    {
                        audioHandle.play(restart, loop);
                    }
                }

                return true;
            }
            else if (action == "CCDeviceAudioManager::Stop")
            {
                MainPage.m_d3dInterop.csActionResult("CCDeviceAudioManager::Stop", "");

                AudioHandle audioHandle = Get(actionData);
                if (audioHandle != null)
                {
                    audioHandle.stop();
                }

                return true;
            }
            else if (action == "CCDeviceAudioManager::Pause")
            {
                MainPage.m_d3dInterop.csActionResult("CCDeviceAudioManager::Pause", "");

                AudioHandle audioHandle = Get(actionData);
                if (audioHandle != null)
                {
                    audioHandle.pause();
                }

                return true;
            }
            else if (action == "CCDeviceAudioManager::Resume")
            {
                MainPage.m_d3dInterop.csActionResult("CCDeviceAudioManager::Resume", "");

                AudioHandle audioHandle = Get(actionData);
                if (audioHandle != null)
                {
                    audioHandle.resume( false );
                }

                return true;
            }
            else if (action == "CCDeviceAudioManager::SetTime")
            {
                MainPage.m_d3dInterop.csActionResult("CCDeviceAudioManager::SetTime", "");

                return true;
            }
            else if (action == "CCDeviceAudioManager::SetVolume")
            {
                MainPage.m_d3dInterop.csActionResult("CCDeviceAudioManager::SetVolume", "");

                return true;
            }

            return false;
        }


        static AudioHandle Prepare(String id, String url, String path)
        {
            Trim();

            if (AudioHandles.Count > 0)
            {
                return null;
            }

            AudioHandle audioHandle = Get(id);
            if (audioHandle == null)
            {
                audioHandle = new AudioHandle();
                audioHandle.id = id;
                audioHandle.url = url;
                audioHandle.path = path;

                audioHandle.prepare();
                AudioHandles.Add(audioHandle);
            }
            return audioHandle;
        }


        static void Trim()
	    {
            // WP8 only supports one channel :(
		    while( AudioHandles.Count > 0 )
	        {
	            AudioHandle oldestHandle = null;
	            DateTime oldestTime = DateTime.Now;

	            for( int i=0; i<AudioHandles.Count; ++i )
	            {
	                AudioHandle audioHandle = AudioHandles[i];
	                if( audioHandle.mediaElement == null )
	                {
	                    oldestHandle = audioHandle;
	                    break;
	                }
	                else if( !audioHandle.playing )
	                {
	                    oldestHandle = audioHandle;
	                    break;
	                }
	                else if( !audioHandle.looping )
	                {
	                    if( audioHandle.timeLastPlayed < oldestTime )
	                    {
	                        oldestHandle = audioHandle;
	                        oldestTime = audioHandle.timeLastPlayed;
	                    }
	                }
	            }

	            if( oldestHandle != null )
	            {
                    oldestHandle.stop();
                    oldestHandle.destroy();
	                AudioHandles.Remove( oldestHandle );
	            }
	            else
	            {
	                break;
	            }
	        }
	    }
	

	    static AudioHandle Get(String id)
	    {
		    for( int i=0; i<AudioHandles.Count; ++i )
		    {
			    AudioHandle audioHandle = AudioHandles[i];
			    if( audioHandle.id.Equals( id ) )
			    {
				    return audioHandle;
			    }
		    }
		    return null;
	    }


        public static void Application_Activated()
        {
            // Restart audio tracks
            for (int i = 0; i < AudioHandles.Count; ++i)
            {
                AudioHandle audioHandle = AudioHandles[i];
                audioHandle.resume( true );
            }
        }
    }
}
