<?php

$functionCount = 0;
class DebugFunction
{
	function __construct($string)
	{
		global $functionCount;
		Debug( '<p><b>' );
		for( $i=0; $i<$functionCount; ++$i )
		{
			Debug( '&nbsp;&nbsp;' );
		}
		Debug( "-$string</b><br/>" );
		$functionCount++;
	}

	function __destruct()
	{
		global $functionCount;
		$functionCount--;
		Debug( '</p>' );
	}
}

class ArrayList
{
	public $list = array();
	public $length = 0;

	function __construct()
	{
	}

	function __destruct()
	{
	}

	function add($object)
	{
		$this->list[$this->length] = $object;
		$this->length++;
	}

	function find($object)
	{
		for( $i=0; $i<$this->length; ++$i )
		{
			if( $object == $this->list[$i] )
			{
				return true;
			}
		}
		return false;
	}
}

function GetFileDate($path)
{
	$lastModified = filemtime( $path );
	$lastModifiedDate = date( "y/m/d/G/i/s", $lastModified );
	return $lastModifiedDate;
}


function GetFileExtension($filename)
{
	$parts = explode( ".", $filename );
	return $parts[count($parts)-1];
}


function RemoveExtension($filename)
{
	$parts = explode( ".", $filename );
	$length = sizeof( $parts );
	$filename = "";
	for( $i=0; $i<$length-1; ++$i )
	{
		$filename .= $parts[$i];
	}
	return $filename;
}


function DirList($directory)
{
	$results = new ArrayList();
    $handler = opendir( $directory );

    // keep going until all files in directory have been read
    while( $file = readdir( $handler ) )
	{
        // if $file isn't this directory or its parent,
        // add it to the results array
        if( $file != '.' && $file != '..' )
		{
            $results->add( $file );
		}
    }
    closedir( $handler );

    return $results;
}


function OpenFile($path, &$data)
{
	$data = '';
    $handle = fopen( $path, 'r' );
    if( $handle )
    {
        $size = filesize( $path );
		if( $size > 0 )
		{
			$data = fread( $handle, $size );
			fclose( $handle );
			return true;
		}
    }
    return false;
}


function SaveFile($filename, $data)
{
    $handle = fopen( $filename, 'w' );
    if( $handle )
    {
        fwrite( $handle, $data );
        fclose( $handle );
    }
}


// For 4.3.0 <= PHP <= 5.4.0
if (!function_exists('http_response_code'))
{
    function http_response_code($newcode = NULL)
    {
        static $code = 200;
        if($newcode !== NULL)
        {
            header('X-PHP-Response-Code: '.$newcode, true, $newcode);
            if(!headers_sent())
                $code = $newcode;
        }
        return $code;
    }
}


function OpenURL($url, &$httpCode=0, &$contentType=0, $redirectCount=0)
{
	if( $redirectCount > 5 )
	{
		return 404;
	}

	$ch = curl_init();
	$timeout = 10;

	// Disable caching on server side requests, to stop auto-minification of js files and other artifcats.
	$headers = array(
        "Cache-Control: no-cache",
        "Pragma: no-cache",
    );
	curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

	curl_setopt( $ch, CURLOPT_URL, $url );
	curl_setopt( $ch, CURLOPT_RETURNTRANSFER, 1 );
	curl_setopt( $ch, CURLOPT_CONNECTTIMEOUT, $timeout );
	curl_setopt( $ch, CURLOPT_USERAGENT, 'localhost' );
	curl_setopt( $ch, CURLOPT_HEADER, 1 );
	curl_setopt( $ch, CURLOPT_FOLLOWLOCATION, 0 );
	$result = curl_exec( $ch );

    $info = curl_getinfo( $ch );
	curl_close( $ch );

	$httpCode = $info['http_code'];
	if( $httpCode == 302 )
	{
		$headerPacket = substr( $result, 0, $info['header_size'] );
		$headers = explode( "\n", $headerPacket );
		$numberOfHeaders = sizeof( $headers );
		for( $i=0; $i<$numberOfHeaders; ++$i )
		{
			$header = $headers[$i];
			if( strlen( $header ) > 1 )
			{
				$headerTokens = explode( ":", $header );
				if( sizeof( $headerTokens ) == 2 )
				{
					$id = strtolower( $headerTokens[0] );
					if( $id == "location" )
					{
						$base = StringSplitBefore( $url, '?' );
						$path = trim( $headerTokens[1] );
						$url = $base . $path;

						return OpenURL( $url, $httpCode, $contentType, $redirectCount+1 );
					}
				}
			}
		}
	}

	$contentType = $info['content_type'];

	$result = substr( $result, $info['header_size'] );
	return $result;
}


function OpenURLArray($url, &$result)
{
	$totalSize = 0;
	$result = array();
	$length = 0;
	$fileHandle = fopen( $url, "r" );
    if( $fileHandle )
	{
		while( !feof( $fileHandle ) )
		{
			$output = fgets( $fileHandle );
			$totalSize += strlen( $output );
			$result[$length++] = $output;
        }
		fclose( $fileHandle );
    }
	return $length;
}


function PostURL($url, $fields, &$result)
{
	//open connection
	$ch = curl_init();

	//set the url, number of POST vars, POST data
	curl_setopt( $ch, CURLOPT_URL, $url );
	curl_setopt( $ch, CURLOPT_POST, 1 );
	curl_setopt( $ch, CURLOPT_POSTFIELDS, $fields );

	//execute post
	$result = curl_exec( $ch );

	//close connection
	curl_close( $ch );
}


function StringSplitBefore($string, $before)
{
    $preSplit = explode( $before, $string );

    if( sizeof( $preSplit ) > 0 )
    {
        return $preSplit[0];
    }

    return false;
}


function StringSplitBetween($string, $start, $end)
{
    $preSplit = explode( $start, $string );

    if( sizeof( $preSplit ) > 1 )
    {
        $postSplit = explode( $end, $preSplit[1] );

        if( sizeof( $postSplit ) > 0 )
        {
            return $postSplit[0];
        }
    }

    return false;
}


function StringTrimLength($string, $length)
{
	if( strlen( $string ) > $length )
	{
		return substr( $string, 0, $length );
	}
	return $string;
}


function ImageToJPG($url, $outputFile)
{
    $imageData = OpenURL( $url );
    {
		$ext = GetFileExtension( $url );
		if( $ext == "jpg" || $ext == "jpeg" )
	    {
	        SaveFile( $outputFile, $imageData );
	    }
	    else
	    {
	    	$tempImage = "temp.png";
	        SaveFile( $tempImage, $imageData );

	        $srcImage = null;
	        if( $ext == "png" )
	        {
	        	$srcImage = imagecreatefrompng( $tempImage );
	        }
	        else if( $ext == "gif" )
	        {
	        	$srcImage = imagecreatefromgif( $tempImage );
	        }
	        else if( $ext == "bmp" )
	        {
	        	$srcImage = imagecreatefrombmp( $tempImage );
	        }

	        if( $srcImage != null )
	        {
		        $width = imagesx( $srcImage );
		        $height = imagesy( $srcImage );

		        $newImage = imagecreatetruecolor( $width, $height );

		        // copy and resize old image into new image
		        imagecopy( $newImage, $srcImage, 0, 0, 0, 0, $width, $height );

		        // Save out new image
		        imagejpeg( $newImage, $outputFile );

		        imagedestroy( $srcImage );
		        imagedestroy( $newImage );

		        // Delete old image
		        unlink( $tempImage );
		    }
	    }
    }
}

?>