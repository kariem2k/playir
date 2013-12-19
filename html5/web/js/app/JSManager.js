/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : JSManager.js
 * Description : Manager of our js scripts
 *
 * Created     : 02/07/13
 *-----------------------------------------------------------
 */

function JSManager() {}


JSManager.DownloadJS = function(js, callback)
{
    var DownloadedJSFunction = function(js)
    {
        return function (status, responseText)
        {
            if( status >= CCURLRequest.Succeeded && responseText && responseText.length > 0 )
            {
                head = document.getElementsByTagName( 'head' )[0];
                var scriptID = 'customjs.' + js.fileID;
                var LoadScript = function(url, callback)
                {
                    // load via src on web platforms only for debugging support
                    if( window.DEBUG_IsLocalClient && CCEngine.DeviceType === "Web" )
                    {
                        script = document.getElementById( scriptID );

                        var newScript = false;
                        if( !script )
                        {
                            // adding the script tag to the head as suggested before
                            script = document.createElement( 'script' );
                            script.type = 'text/javascript';
                            newScript = true;
                        }

                        if( !newScript )
                        {
                            console.log( "JSManager.DownloadJS", url );
                        }

                        script.onload = function()
                        {
                            console.log( "JSManager.Downloaded::onload", url );
                            callback( this, true );
                        };

                        script.onerror = function()
                        {
                            console.log( "JSManager.DownloadJS::onerror", url );
                            callback( null, false );
                        };

                        script.src = url;
                        if( newScript )
                        {
                            head.appendChild( script );
                        }
                    }

                    // native platforms fallback to using .text for faster cache based loading
                    else
                    {
                        callback( null, false );
                    }
                };

                LoadScript( url, function (script, loaded)
                {
                    if( !script )
                    {
                        script = document.createElement( 'script' );
                        script.type = 'text/javascript';
                        head.appendChild( script );
                    }
                    script.id = scriptID;
                    script.fileID = js.fileID;
                    script.filename = js.filename;
                    script.jsData = responseText;
                    if( loaded )
                    {
                        if( callback )
                        {
                            callback( true );
                        }
                    }

                    // If we're offline, use .text
                    else
                    {
                        try
                        {
                            script.text = responseText;
                        }
                        catch (error)
                        {
                            if( window.console && console.log )
                            {
                                console.log( error );
                            }
                        }

                        if( callback )
                        {
                            callback( true );
                        }
                    }
                });
            }
            else
            {
                if( callback )
                {
                    callback( false );
                }
            }
        };
    };

    if( js.filename )
    {
        // Do we already have this script loaded?
        if( JSManager.GetScript( js.filename ) )
        {
            callback( true );
            return;
        }

        // If not, download it
        var url = MultiplayerManager.GetAssetURL( js.filename );
        gURLManager.requestURL( url,
            null,
            new DownloadedJSFunction( js ),
            0,
            js.filename,
            -1,
            0.0 );
    }
    else
    {
        callback( true );
    }
};


JSManager.GetClassNames = function(jsData)
{
    var classNames = [];

    jsData = jsData.formatSpacesAndTabs();

    var functionSearch = jsData;
    var functionIndex;
    while( ( functionIndex = functionSearch.search( "function" ) ) !== -1 )
    {
        var foundFunction = true;
        if( functionIndex > 2 )
        {
            if( functionSearch[functionIndex-2] === "=" )
            {
                foundFunction = false;
            }
            else if( functionSearch[functionIndex-2] === "/" )
            {
                foundFunction = false;
            }
            else if( functionSearch[functionIndex-2] === "(" )
            {
                foundFunction = false;
            }
            else
            {
                functionSearch = functionSearch.substring( functionIndex+8 );
            }
        }

        // Potential function here
        if( foundFunction )
        {
            var functionName = String.SplitBefore( functionSearch, "(" );
            functionName = functionName.formatSpacesAndTabs();
            var spaces = functionName.split( " " );
            if( functionName && spaces.length === 1 )
            {
                if( classNames.find( functionName ) === -1 )
                {
                    classNames.addOnce( functionName );
                }
            }
        }
        functionSearch = functionSearch.substring( functionIndex+1 );
    }

    var prototypes = jsData.split( '.prototype.' );
    for( var iPrototype=1; iPrototype<prototypes.length; ++iPrototype )
    {
        var className = prototypes[iPrototype-1];
        var classNameStartIndex = 0;
        for( var j=className.length-1; j>=0; --j )
        {
            var character = className[j];
            if( /[^a-zA-Z0-9]/.test( character ) )
            {
                classNameStartIndex = j+1;
                break;
            }
        }
        className = className.substr( classNameStartIndex, className.length );
        if( className )
        {
            if( classNames.find( className ) === -1 )
            {
                classNames.addOnce( className );
            }
        }
    }
    return classNames;
};


JSManager.GetScript = function(filename)
{
    var head = document.getElementsByTagName( 'head' )[0];
    var scripts = head.getElementsByTagName( 'script' );
    var js, scriptID, script;

    for( var i=0; i<scripts.length; ++i )
    {
        script = scripts[i];
        if( script.id )
        {
            if( script.id.contains( 'customjs.' ) )
            {
                if( script.filename === filename )
                {
                    return script;
                }
            }
        }
    }
    return null;
};


JSManager.RemoveJSScript = function(script)
{
    var jsData = script.jsData;

    // Restore prototypes?
    var prototypes = jsData.split( '.prototype.' );
    for( var iPrototype=1; iPrototype<prototypes.length; ++iPrototype )
    {
        var className = prototypes[iPrototype-1];
        var classNameStartIndex = 0;
        for( var j=className.length-1; j>=0; --j )
        {
            var character = className[j];
            if( /[^a-zA-Z0-9]/.test( character ) )
            {
                classNameStartIndex = j+1;
                break;
            }
        }
        className = className.substr( classNameStartIndex, className.length );

        var prototypeName = prototypes[iPrototype];
        prototypeName = String.SplitBefore( prototypeName, " " );
        prototypeName = String.SplitBefore( prototypeName, "=" );
        prototypeName = String.SplitBefore( prototypeName, "\n" );

        var sourceClass = window[className];
        if( sourceClass )
        {
            if( sourceClass.super )
            {
                var parentClass = sourceClass.super;
                if( sourceClass.prototype[prototypeName] )
                {
                    if( parentClass.prototype[prototypeName] )
                    {
                        sourceClass.prototype[prototypeName] = parentClass.prototype[prototypeName];
                    }
                }
            }
        }
    }

    script.parentNode.removeChild( script );
};


JSManager.RemoveJSFiles = function()
{
    var head = document.head;
    var scripts = head.children;
    var js, scriptID, script;

    for( var i=0; i<scripts.length; ++i )
    {
        script = scripts[i];
        if( script.id )
        {
            if( script.id.contains( 'customjs.' ) )
            {
                this.RemoveJSScript( script );
                --i;
            }
        }
    }
};


JSManager.SyncJSFiles = function(jsFiles, onSynced, onUpdate)
{
    var head = document.getElementsByTagName( 'head' )[0];
    var scripts = head.getElementsByTagName( 'script' );
    var js, scriptID, script;

    for( var i=0; i<scripts.length; ++i )
    {
        script = scripts[i];
        if( script.id )
        {
            if( script.id.contains( 'customjs.' ) )
            {
                found = false;
                if( jsFiles )
                {
                    for( var jsIndex=0; jsIndex<jsFiles.length; ++jsIndex )
                    {
                        js = jsFiles[jsIndex];
                        if( script.filename === js.filename )
                        {
                            found = true;
                            break;
                        }
                    }
                }

                if( !found )
                {
                    this.RemoveJSScript( script );
                }
            }
        }
    }

    var updatedJS = [];
    function DownloadJS(jsFiles, index)
    {
        if( onUpdate )
        {
            onUpdate( index / jsFiles.length );
        }

        if( jsFiles && index < jsFiles.length )
        {
            var js = jsFiles[index];
            var script = JSManager.GetScript( js.filename );
            if( !script )
            {
                JSManager.DownloadJS( js, function (result)
                {
                    if( result )
                    {
                        updatedJS.add( js.filename );
                    }
                    else if( window.console && console.log )
                    {
                        console.log( "JSManager.DownloadJS Failed " + js.filename );
                    }
                    DownloadJS( jsFiles, index+1 );
                });
            }
            else
            {
                DownloadJS( jsFiles, index+1 );
            }
        }
        else
        {
            onSynced( updatedJS );
        }
    }

    DownloadJS( jsFiles, 0 );
};


JSManager.ReplaceClassInternalPointers = function(classPointer, oldPointer, newPointer)
{
    // Try to replace pointers automatically :)
    var keys = Object.keys( classPointer );
    for( var i=0; i<keys.length; ++i )
    {
        var key = keys[i];
        if( classPointer[key] === oldPointer )
        {
            classPointer[key] = newPointer;
        }
    }
};



JSManager.RuntimePatch = function(jsFiles)
{
    JSManager.SyncJSFiles( jsFiles, function (updatedJS)
    {
        for( var i=0; i<updatedJS.length; ++i )
        {
            var script = JSManager.GetScript( updatedJS[i] );
            if( script )
            {
                var classNames = JSManager.GetClassNames( script.jsData );
                if( classNames.length > 0 )
                {
                    for( var iClassName=0; iClassName<classNames.length; ++iClassName )
                    {
                        var className = classNames[iClassName];
                        for( var iScene=0; iScene<gEngine.scenes.length; ++iScene )
                        {
                            var scene = gEngine.scenes[iScene];
                            var sceneName = String.SplitBetween( scene.constructor.toString(), " ", "(" );
                            if( window[sceneName] )
                            {
                                var Class = window[sceneName];
                                for( var m in Class.prototype )
                                {
                                    scene[m] = Class.prototype[m];
                                }

                                if( window[sceneName].jsSyncRestartFunction )
                                {
                                    window[sceneName].jsSyncRestartFunction( scene );
                                }
                                else if( scene.jsSyncReCreate )
                                {
                                    if( sceneName === className )
                                    {
                                        var parent = scene.parentScene;
                                        var newScene = new window[sceneName]( parent );
                                        if( parent )
                                        {
                                            JSManager.ReplaceClassInternalPointers( parent, scene, newScene );
                                        }
                                        gEngine.removeScene( scene );
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    });
};


JSManager.SoftRestart = function(jsonData)
{
    while( gEngine.scenes.length > 0 )
    {
        gEngine.removeScene( gEngine.scenes.last() );
    }

    JSManager.SyncJSFiles( jsonData.jsFiles, function()
    {
        if( jsonData.jsStart && window[jsonData.jsStart] )
        {
            new window[jsonData.jsStart]();
        }
        else
        {
            gEngine.addScene( new SceneManagerGame() );
        }
    });
};


JSManager.ParseJSForFileType = function(jsData, db, format)
{
    var FindOpeningQuote = function(string)
    {
        for( var i=string.length-2; i>=0; --i )
        {
            if( string[i] === "\"" || string[i] === "'" )
            {
                return string.substring( i+1 );
            }
        }
        return string;
    };

    var files, file, i;

    files = jsData.split( format + "\"" );
    if( files.length > 1 )
    {
        for( i=0; i<files.length-1; ++i )
        {
            file = files[i];
            file = FindOpeningQuote( file );
            if( file )
            {
                if( !file.isHTTP() )
                {
                    file += format;
                    if( DBAssets.ResourceFiles.find( file ) === -1 )
                    {
                        db.addOnce( file );
                    }
                }
            }
        }
    }

    files = jsData.split( format + "'" );
    if( files.length > 1 )
    {
        for( i=0; i<files.length-1; ++i )
        {
            file = files[i];
            file = FindOpeningQuote( file );
            if( file )
            {
                if( !file.isHTTP() )
                {
                    file += format;
                    if( DBAssets.ResourceFiles.find( file ) === -1 )
                    {
                        db.addOnce( file );
                    }
                }
            }
        }
    }
};





JSManager.ParseJSForInfoType = function(jsData, db, token)
{
    var FindClosingQuote = function(string)
    {
        for( var i=0; i<string.length; ++i )
        {
            if( string[i] === "\"" || string[i] === "'" )
            {
                return string.substring( 0, i );
            }
        }
        return null;
    };

    var infos, info, i;

    infos = jsData.split( "\"" + token + "." );
    if( infos.length > 1 )
    {
        for( i=1; i<infos.length; ++i )
        {
            info = infos[i];
            info = FindClosingQuote( info );
            if( info )
            {
                info = token + "." + info;
                db.addOnce( info );
            }
        }
    }

    infos = jsData.split( "'" + token + "." );
    if( infos.length > 1 )
    {
        for( i=1; i<infos.length; ++i )
        {
            info = infos[i];
            info = FindClosingQuote( info );
            if( info )
            {
                info = token + "." + info;
                db.addOnce( info );
            }
        }
    }
};


JSManager.ParseJSForAssets = function(jsData, files, infos)
{
    // Remove commented out code
    var deadCode = jsData.split( '//' );
    jsData = deadCode[0];
    for( var i=1; i<deadCode.length; ++i )
    {
        var code = String.SplitAfter( deadCode[i], '\n' );
        jsData += '\n';
        jsData += code;
    }

    JSManager.ParseJSForFileType( jsData, files, ".jpg" );
    JSManager.ParseJSForFileType( jsData, files, ".png" );
    JSManager.ParseJSForFileType( jsData, files, ".fbxi" );
    JSManager.ParseJSForFileType( jsData, files, ".obj" );

    JSManager.ParseJSForInfoType( jsData, infos, "audio" );
    JSManager.ParseJSForInfoType( jsData, infos, "character" );
    JSManager.ParseJSForInfoType( jsData, infos, "map" );
    JSManager.ParseJSForInfoType( jsData, infos, "model" );
};
