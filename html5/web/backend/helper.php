<?php

ob_start( 'ob_gzhandler' );

require_once( 'tools.php' );

error_reporting( 0 );

if( get_magic_quotes_gpc() )
{
    function stripslashes_deep($value)
    {
        $value = is_array($value) ?
                    array_map('stripslashes_deep', $value) :
                    stripslashes($value);

        return $value;
    }

    $_POST = array_map( 'stripslashes_deep', $_POST );
    $_GET = array_map( 'stripslashes_deep', $_GET );
    $_COOKIE = array_map( 'stripslashes_deep', $_COOKIE );
    $_REQUEST = array_map( 'stripslashes_deep', $_REQUEST );
}


{
    if( isset( $_GET['url'] ) )
    {
        header( "Cache-Control: max-age=86400, public, proxy-revalidate" );
        $url = explode( '?url=', $_SERVER['REQUEST_URI'] );
        $result = OpenURL( $url[1], $httpCode, $contentType );
        http_response_code( $httpCode == 0 ? 400 : $httpCode );
        header( 'Content-Type: ' . $contentType );
        echo $result;
    }
    else if( isset( $_GET['upload'] ) )
    {
        if( isset( $_POST['url'] ) )
        {
            $url = $_POST['url'];

            $base64 = explode( '&base64', $_SERVER['REQUEST_URI'] );
            if( sizeof( $base64 ) > 1 )
            {
                $fields = array(
                    'filename' => $_POST['filename'],
                    'data' => $_POST['data'],
                    'base64' => true
                );
            }
            else
            {
                $fields = array(
                    'filename' => $_POST['filename'],
                    'data' => $_POST['data']
                );
            }

            if( PostURL( $url, $fields, $result ) )
            {
                echo $result;
            }
        }
    }
    else if( isset( $_GET['uploadfile'] ) )
    {;
        if( isset( $_POST['url'] ) )
        {
            $url = $_POST['url'];
        }
        else
        {
            $url = "http://playitor.com/assets/upload.php";
        }

        if( sizeof( $_FILES ) == 1 )
        {
            $fields = array(
                'file' => '@' . $_FILES['file']['tmp_name']
            );

            // Fill in the $fileds array with our post data
            foreach( $_POST as $key=>$value )
            {
                if( $key == "url" )
                {
                    continue;
                }

                $fields[$key] = $value;
            }

            if( PostURL( $url, $fields, $result ) )
            {
                echo $result;
            }
        }
    }
    else if( isset( $_GET['post'] ) )
    {
        if( isset( $_POST['url'] ) )
        {
            $url = $_POST['url'];

            $fields = array();

            // Fill in the $fileds array with our post data
            foreach( $_POST as $key=>$value )
            {
                if( $key == "url" )
                {
                    continue;
                }

                $fields[$key] = $value;
            }

            if( PostURL( $url, $fields, $result ) )
            {
                echo $result;
            }
        }
    }
}

?>