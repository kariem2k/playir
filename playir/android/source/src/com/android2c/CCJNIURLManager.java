/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCJNIURLManager.java
 * Description : Loads URL requests then interfaces with ndk.
 *
 * Created     : 09/10/11
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

package com.android2c;

import java.io.DataOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

import android.util.Log;


public class CCJNIURLManager
{
	protected void processRequest(String url, final byte[] postData, final int postDataLength, final String postBoundary)
	{
		// Might as well encode the URL here with Java's better String methods
		url = url.replaceAll( " ", "%20" );
		
        DataOutputStream dos = null;

		try
		{
        	URL urlObject = new URL( url );
            HttpURLConnection connection = (HttpURLConnection)urlObject.openConnection();
            
            if( postData != null && postDataLength > 0 && postBoundary != null )
            {
            	connection.setDoInput( true );
            	connection.setDoOutput( true );
            	connection.setUseCaches( false );
            	connection.setRequestMethod( "POST" );
            	
            	connection.setRequestProperty( "Connection", "Keep-Alive" );
            	connection.setRequestProperty( "ENCTYPE", "multipart/form-data" );
            	connection.setRequestProperty( "Content-Type", "multipart/form-data;boundary=" + postBoundary );
            	
            	dos = new DataOutputStream( connection.getOutputStream() );
            	dos.write( postData, 0, postData.length );
            }

			// Get the response
			int status = connection.getResponseCode();
			if( status != 200 )
			{
				Log.e( CCJNI.library, "The connection to " + url + " was unsuccessful." );

				// See if we can get any useful error information (for 4xx and 5xx codes)
				if( status % 400 < 100 || status % 500 < 100 )
				{
					InputStream error = ( (HttpURLConnection)connection ).getErrorStream();
					if( error != null )
					{
						Log.e( CCJNI.library, error.toString() );
					}
				}

				CCJNI.URLManagerDownloadFinishedUIThread( url, false, null, 0, null, null, 0 );
			}
			else
			{
				// Extract headers
				int headersLength = connection.getHeaderFields().size();
				String[] headerNames = new String[headersLength];
				String[] headerValues = new String[headersLength];
				for( int i=0; i<headersLength; ++i )
				{
					String key = connection.getHeaderFieldKey( i );
					String value = connection.getHeaderField( i );
					headerNames[i] = key;
					headerValues[i] = value;
				}

				// Get the response
				InputStream response = connection.getInputStream();
                int dataSize = 1024 * 1024; // One megabyte muhahahahahaha
                byte[] data = new byte[dataSize];
                int offset = 0;
                {
                	int bytesRead = 0;
                    while( bytesRead >= 0 )
                    {
                    	offset += bytesRead;

                    	// If our data is getting too big for our buffer, increase it.
                    	if( offset > dataSize - 1024 )
                    	{
                    		int newDataSize = dataSize * 2;
                    		byte[] newData = new byte[newDataSize];
                    		for( int i=0; i<offset; ++i )
                    		{
                    			newData[i] = data[i];
                    		}
                    		data = newData;
                    		dataSize = newDataSize;
                    	}

                    	bytesRead = response.read( data, offset, dataSize - offset );
                    }
                }

                connection.disconnect();

                CCJNI.URLManagerDownloadFinishedUIThread( url, true, data, offset, headerNames, headerValues, headersLength );
			}
		}
		catch (Exception e)
		{
			Log.e( CCJNI.library, "There was an unknown I/O exception:" );
			e.printStackTrace();
			CCJNI.URLManagerDownloadFinishedUIThread( url, false, null, 0, null, null, 0 );
		}
		
		try 
		{
			if( dos != null )
			{
				dos.flush();
				dos.close();
			}
		}
		catch (IOException e)
		{
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
}
