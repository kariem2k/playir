var GetPackagedFiles = function(callback)
{
    var documentsDir;
    function onsuccess(files)
    {
        CCEngine.PackagedFiles = [];
        for( var i=0; i<files.length; ++i )
        {
            var filename = files[i].name;
            CCEngine.PackagedFiles.push( filename );

            //console.log( "File Name is " + files[i].path + filename );
            if( filename === "appinfo.json" )
            {
                var url = "packaged/" + files[i].name;
                var xhr = new XMLHttpRequest();
                xhr.open( 'GET', url, false );
                xhr.onreadystatechange = function()
                {
                    if( xhr.readyState === 4 )
                    {
                        //console.log( xhr.responseText );
                        var appinfo = JSON.parse( xhr.responseText );
                        window.APP_ID = appinfo.id;
                        CCEngine.LoadAppInfo( appinfo );
                    }
                };
                xhr.send();
            }
        }

        callback();
    }

    function onerror(error)
    {
        console.log( "The error " + error.message + " occurred when listing the files in the selected folder" );
        callback();
    }

    tizen.filesystem.resolve( 'wgt-package/packaged',
        function(dir)
        {
            documentsDir = dir;
            dir.listFiles( onsuccess, onerror );
        },
        function(e)
        {
            console.log( "Error " + e.message );
        },
        "r"
    );
};


var LoadScript = function(url, callback)
{
    var head = document.getElementsByTagName( 'head' )[0];
    var script = document.createElement( 'script' );
    script.type = 'text/javascript';
    script.src = url;

    script.onload = function()
    {
        callback( true );
    };

    script.onerror = function()
    {
        callback( false );
    };

    head.appendChild( script );
};

var LoadScripts = function(online)
{
    if( !online )
    {
        window.SERVER_ROOT = "";
    }

    LoadScript( SERVER_ROOT + "jsmin/external.js", function (result)
    {
        if( !result )
        {
            LoadScripts( false );
            return;
        }

        LoadScript( SERVER_ROOT + "jsmin/engine.js", function (result)
        {
            if( !result )
            {
                LoadScripts( false );
                return;
            }

            LoadScript( SERVER_ROOT + "jsmin/app.js", function (result)
            {
                if( !result )
                {
                    LoadScripts( false );
                    return;
                }

                if( window.CCEngine )
                {
                    CCTools.GetScreenSize( function(screenWidth, screenHeight, pixelDensity)
                    {
                        var scaling = 1.0 / pixelDensity;
                        var viewport = document.querySelector( 'meta[name=viewport]' );
                        viewport.setAttribute( 'content', 'width=device-width, initial-scale=' + scaling + ', maximum-scale=' + scaling +', user-scalable=0' );

                        GetPackagedFiles( function ()
                        {
                            new CCEngine();
                        });
                    });
                }
                else
                {
                    LoadScripts( false );
                }
            });
        });
    });
};
