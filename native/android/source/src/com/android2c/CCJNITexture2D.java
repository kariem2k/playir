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

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.util.ArrayList;

import javax.microedition.khronos.opengles.GL10;
import javax.microedition.khronos.opengles.GL11;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.opengl.GLUtils;
import android.util.Log;

public class CCJNITexture2D
{
	static class TextureBitmap
	{
		String filename;
		boolean packaged;
		Bitmap bitmap;

		// On Android we always scaled our images to be square sizes
		int imageWidth = 0;
		int imageHeight = 0;

		// The raw image sizes before being skewed to fit as square textures
		int rawWidth = 0;
		int rawHeight = 0;
		
		// The allocated height size
		int allocatedHeight = 0;
		
		public TextureBitmap(final String filename, final boolean packaged, Bitmap bitmap)
		{
			this.filename = filename;
			this.packaged = packaged;
			
        	// Re-scale the width to be a power of 2 to avoid any weird stretching issues.
        	imageWidth = rawWidth = bitmap.getWidth();
        	allocatedHeight = imageHeight = rawHeight = bitmap.getHeight();
        	int widthSquared = NextPowerOf2( imageWidth );
        	int heightSquared = NextPowerOf2( imageHeight );

    		float scale = (float)widthSquared/(float)rawWidth;
    		imageWidth = widthSquared;
    		imageHeight = (int)( rawHeight * scale );
    		allocatedHeight = NextPowerOf2( imageHeight );

			Bitmap scaledBitmap = Bitmap.createScaledBitmap( bitmap, widthSquared, heightSquared, true );
			if( scaledBitmap != bitmap )
			{
				bitmap.recycle();
				bitmap = scaledBitmap;
			}

			this.bitmap = bitmap;
		}
	}
    static ArrayList<TextureBitmap> LoadingTextures = new ArrayList<TextureBitmap>();
    

	static int NextPowerOf2(int x)
	{
		x = x - 1;
		x = x | ( x >> 1 );
		x = x | ( x >> 2 );
		x = x | ( x >> 4 );
		x = x | ( x >> 8 );
		x = x | ( x >> 16 );
		return x + 1;
	}

	
	public static boolean DoesTextureExist(final String filename, final boolean packaged)
	{
		boolean exists = false;
		if( packaged )
		{
			int dotIndex = filename.lastIndexOf( '.' );
			final String pureFilename = ( dotIndex > 0 ) ? filename.substring( 0, dotIndex ) : filename;
			int id = CCJNI.Activity.getResources().getIdentifier( pureFilename, "drawable", CCJNI.PackageName );
	        if( id > 0 )
	        {
	        	exists = true;
	        }
		}

		// Cached
		else
		{
			final String filePath = CCJNI.DataPath + "/" + filename;
			final File file = new File( filePath );
			if( file.exists() )
			{
				exists = true;
			}
		}

		return exists;
	}

	
	public static boolean Load(final String filename, final boolean packaged)
	{
		//if( CCJNI.DEBUG )
		{
			Log.d( "CCJNITexture2D::Load", filename );
		}
		Bitmap bitmap = null;

		if( packaged )
		{
			int dotIndex = filename.lastIndexOf( '.' );

			final String pureFilename = ( dotIndex > 0 ) ? filename.substring( 0, dotIndex ) : filename;
			int id = CCJNI.Activity.getResources().getIdentifier( pureFilename, "drawable", CCJNI.PackageName );

	        try
	        {
	        	InputStream is = CCJNI.Activity.getResources().openRawResource( id );
	            bitmap = BitmapFactory.decodeStream( is, null, null );
	    		is.close();
	        }
	        catch( Exception e )
	        {
	        	e.printStackTrace();
	        }
		}

		// Cached
		else
		{
			final String filePath = CCJNI.DataPath + "/" + filename;

			try
	        {
				FileInputStream is = new FileInputStream( filePath );
	            bitmap = BitmapFactory.decodeStream( is );
	    		is.close();
	        }
	        catch( Exception e )
	        {
	        	e.printStackTrace();
	        }
		}

        if( bitmap == null )
        {
        	return false;
        }
        else
        {
        	addTextureBitmap( filename, packaged, bitmap );
        	return true;
        }
	}
	
	
	private synchronized static void addTextureBitmap(final String filename, final boolean packaged, final Bitmap bitmap)
	{
    	TextureBitmap textureBitmap = new TextureBitmap( filename, packaged, bitmap );
    	LoadingTextures.add( textureBitmap );
	}
    

	public synchronized static int GetImageWidth(final String filename, final boolean packaged)
	{
		for( int i=0; i<LoadingTextures.size(); ++i )
		{
			TextureBitmap texture = LoadingTextures.get( i );
			if( texture.packaged == packaged )
			{
				if( texture.filename.equals( filename ) )
				{
					return texture.imageWidth;
				}	
			}
		}
		return 0;
	}
	

	public synchronized static int GetImageHeight(final String filename, final boolean packaged)
	{
		for( int i=0; i<LoadingTextures.size(); ++i )
		{
			TextureBitmap texture = LoadingTextures.get( i );
			if( texture.packaged == packaged )
			{
				if( texture.filename.equals( filename ) )
				{
					return texture.imageHeight;
				}
			}
		}
		return 0;
	}

	
	public synchronized static int GetRawWidth(final String filename, final boolean packaged)
	{
		for( int i=0; i<LoadingTextures.size(); ++i )
		{
			TextureBitmap texture = LoadingTextures.get( i );
			if( texture.packaged == packaged )
			{
				if( texture.filename.equals( filename ) )
				{
					return texture.rawWidth;
				}
			}
		}
		return 0;
	}

	
	public synchronized static int GetRawHeight(final String filename, final boolean packaged)
	{
		for( int i=0; i<LoadingTextures.size(); ++i )
		{
			TextureBitmap texture = LoadingTextures.get( i );
			if( texture.packaged == packaged )
			{
				if( texture.filename.equals( filename ) )
				{
					return texture.rawHeight;
				}	
			}
		}
		return 0;
	}

	
	public synchronized static int GetAllocatedHeight(final String filename, final boolean packaged)
	{
		for( int i=0; i<LoadingTextures.size(); ++i )
		{
			TextureBitmap texture = LoadingTextures.get( i );
			if( texture.packaged == packaged )
			{
				if( texture.filename.equals( filename ) )
				{
					return texture.allocatedHeight;
				}	
			}
		}
		return 0;
	}
	

	public synchronized static int CreateGL(final String filename, final boolean packaged, final boolean mipmap)
	{
		for( int i=0; i<LoadingTextures.size(); ++i )
		{
			TextureBitmap texture = LoadingTextures.get( i );
			if( texture.packaged == packaged )
			{
				if( texture.filename.equals( filename ) )
				{
					LoadingTextures.remove( i );

					int[] glName = new int[1];

					GL11 gl = CCJNIGLView.GLContext;
        			gl.glGenTextures( 1, glName, 0 );

        			gl.glBindTexture( GL10.GL_TEXTURE_2D, glName[0] );

       				gl.glTexParameterf( GL10.GL_TEXTURE_2D, GL10.GL_TEXTURE_MAG_FILTER, GL10.GL_LINEAR );
			        // if( false && mipmap )
			        // {
			        // 	gl.glTexParameteri( GL10.GL_TEXTURE_2D, GL11.GL_TEXTURE_MIN_FILTER, GL11.GL_LINEAR_MIPMAP_LINEAR );
				       //  gl.glTexParameteri( GL10.GL_TEXTURE_2D, GL11.GL_GENERATE_MIPMAP, GL11.GL_TRUE );
			        // }
			        // else
			        {
			        	gl.glTexParameterf( GL10.GL_TEXTURE_2D, GL10.GL_TEXTURE_MIN_FILTER, GL10.GL_LINEAR );
			        }

			        GLUtils.texImage2D( GL11.GL_TEXTURE_2D, 0, texture.bitmap, 0 );

			    	texture.bitmap.recycle();

			        gl.glBindTexture( GL10.GL_TEXTURE_2D, 0 );

			        //CCJNIGLView.CheckGLError( "Load Texture", gl );
			        return glName[0];
				}
			}
		}

		return 0;
    }
}
