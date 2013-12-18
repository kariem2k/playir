/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCJNITexture2D.java
 * Description : Interfaces with Bitmap class to load textures.
 *
 * Created     : 09/10/11
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

package com.android2c;

import java.util.ArrayList;

import android.media.MediaPlayer;

public class CCJNIAudioManager
{
	static class AudioHandle
	{
		String id;
		String url;
		String path;
		boolean looping;
		boolean starting = true;
		boolean prepared = false;
		boolean ended = false;
		long timeLastPlayed;
		
		MediaPlayer mediaPlayer = new MediaPlayer();
	}
	static ArrayList<AudioHandle> AudioHandles = new ArrayList<AudioHandle>();
	
	static void Reset()
	{
		for( int i=0; i<AudioHandles.size(); ++i )
		{
			AudioHandle audioHandle = AudioHandles.get( i );
			if( audioHandle.mediaPlayer != null )
			{
				Stop( audioHandle );
			}
		}
	}

	static AudioHandle Prepare(final String id, final String url, final String path)
	{
		Trim();
		
		AudioHandle audioHandle = Get( id );
		if( audioHandle == null )
		{
			audioHandle = new AudioHandle();
			audioHandle.id = id;
			audioHandle.url = url;
			audioHandle.path = path;
			
			try 
			{
				audioHandle.mediaPlayer.setDataSource( path );
				audioHandle.mediaPlayer.setOnPreparedListener( new MediaPlayer.OnPreparedListener() 
				{
					@Override
					public void onPrepared(MediaPlayer mp)
					{
						Prepared( mp );
					}
				});
				audioHandle.mediaPlayer.prepareAsync();
				audioHandle.mediaPlayer.setOnErrorListener( new MediaPlayer.OnErrorListener()
				{
					public boolean onError(MediaPlayer mp, int what, int extra)
					{
						Error( mp );
						return true;
					}
				});
				audioHandle.timeLastPlayed = System.currentTimeMillis();
				AudioHandles.add( audioHandle );
			}
			catch (Exception e) 
			{
				audioHandle.mediaPlayer.release();
				audioHandle = null;
			}
		}
		return audioHandle;
	}

	static void Play(final String id, final String url, final String path, final boolean restart, final boolean loop)
	{
		AudioHandle audioHandle = Prepare( id, url, path );
		if( audioHandle != null )
		{
			if( restart )
			{
				Stop( audioHandle );
			}
			if( loop )
			{
				audioHandle.looping = true;
			}
			
			if( Start( audioHandle ) )
			{	
				audioHandle.mediaPlayer.setLooping( loop );
				
				audioHandle.ended = false;
				audioHandle.timeLastPlayed = System.currentTimeMillis();
				
				audioHandle.mediaPlayer.setOnCompletionListener(new MediaPlayer.OnCompletionListener()
				{	
					@Override
					public void onCompletion(MediaPlayer mp)
					{
						Ended( mp );
					}
				});
			}
		}
	}

	static void Stop(final String id)
	{
		AudioHandle audioHandle = Get( id );
		if( audioHandle != null )
		{
			Stop( audioHandle );
		}
	}
	
	static void PauseAll()
	{
		for( int i=0; i<AudioHandles.size(); ++i )
		{
			AudioHandle audioHandle = AudioHandles.get( i );
			Pause( audioHandle );
		}
	}

	static void Pause(final String id)
	{
		AudioHandle audioHandle = Get( id );
		Pause( audioHandle );
	}

	static void Resume(final String id)
	{
		AudioHandle audioHandle = Get( id );
		if( audioHandle != null )
		{
			if( audioHandle.mediaPlayer != null )
			{
				if( !audioHandle.ended && !audioHandle.mediaPlayer.isPlaying() )
				{
					Start( audioHandle );
				}
			}
		}
	}

	static void SetTime(final String id, final float time)
	{
		AudioHandle audioHandle = Get( id );
		if( audioHandle != null )
		{
			if( audioHandle.mediaPlayer != null )
			{
				audioHandle.mediaPlayer.seekTo( (int)( time * 1000.0f ) );
			}
		}
	}

	static void SetVolume(final String id, final float volume)
	{
		AudioHandle audioHandle = Get( id );
		if( audioHandle != null )
		{
			if( audioHandle.mediaPlayer != null )
			{
				audioHandle.mediaPlayer.setVolume( volume * 100, volume * 100 );
			}
		}
	}
	
	
	static void Trim()
	{
		while( AudioHandles.size() > 4 )
	    {
	        AudioHandle oldestHandle = null;
	        long oldestTime = System.currentTimeMillis();

	        for( int i=0; i<AudioHandles.size(); ++i )
	        {
	            AudioHandle audioHandle = AudioHandles.get( i );
	            if( audioHandle.mediaPlayer == null )
	            {
	                oldestHandle = audioHandle;
	                break;
	            }
	            else if( !audioHandle.mediaPlayer.isPlaying() )
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
	        	if( oldestHandle.mediaPlayer != null )
				{
					if( oldestHandle.mediaPlayer.isPlaying() )
					{
						oldestHandle.mediaPlayer.stop();
					}
					oldestHandle.mediaPlayer.release();
				}
	            AudioHandles.remove( oldestHandle );
	        }
	        else
	        {
	            break;
	        }
	    }
	}
	

	static AudioHandle Get(final String id)
	{
		for( int i=0; i<AudioHandles.size(); ++i )
		{
			AudioHandle audioHandle = AudioHandles.get( i );
			if( audioHandle.id.equals( id ) )
			{
				return audioHandle;
			}
		}
		return null;
	}
	
	static void Prepared(MediaPlayer mp)
	{
		for( int i=0; i<AudioHandles.size(); ++i )
		{
			AudioHandle audioHandle = AudioHandles.get( i );
			if( audioHandle.mediaPlayer == mp )
			{
				audioHandle.prepared = true;
				
				if( audioHandle.starting )
				{
					audioHandle.starting = false;
					Play( audioHandle.id, audioHandle.url, audioHandle.path, false, audioHandle.looping );
				}
				break;
			}
		}
	}
	
	static boolean Start(AudioHandle audioHandle)
	{
		if( audioHandle != null )
		{
			if( audioHandle.prepared )
			{
				audioHandle.mediaPlayer.start();
				return true;
			}
			else
			{
				audioHandle.starting = true;
			}
		}
		return false;
	}
	
	
	static void Stop(AudioHandle audioHandle)
	{
		if( audioHandle != null )
		{	
			if( audioHandle.mediaPlayer != null )
			{
				if( audioHandle.starting )
				{
					audioHandle.starting = false;
				}
				if( audioHandle.mediaPlayer.isPlaying() )
				{
					audioHandle.mediaPlayer.stop();
				}
			}
		}
	}
	
	
	static void Pause(AudioHandle audioHandle)
	{
		if( audioHandle != null )
		{
			if( audioHandle.mediaPlayer != null )
			{
				if( audioHandle.starting )
				{
					audioHandle.starting = false;
				}
				if( audioHandle.mediaPlayer.isPlaying() )
				{
					audioHandle.mediaPlayer.pause();
				}
			}
		}
	}
	
	static void Ended(MediaPlayer mp)
	{
		for( int i=0; i<AudioHandles.size(); ++i )
		{
			AudioHandle audioHandle = AudioHandles.get( i );
			if( audioHandle.mediaPlayer == mp )
			{
				audioHandle.ended = true;
				CCJNI.AudioManagerEnded( audioHandle.id, audioHandle.url );
				break;
			}
		}
	}
	
	
	static void Error(MediaPlayer mp)
	{
		for( int i=0; i<AudioHandles.size(); ++i )
		{
			AudioHandle audioHandle = AudioHandles.get( i );
			if( audioHandle.mediaPlayer == mp )
			{
				AudioHandles.remove( audioHandle );
				break;
			}
		}
	}
}
