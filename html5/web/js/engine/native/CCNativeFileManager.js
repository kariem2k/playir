/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCFileManager.js
 * Description : Manager for db/file requests.
 *
 * Created     : 03/07/13
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

function CCFileManager() {}
CCFileManager.SingletonConstructor = function()
{
	this.LoadQueue = [];
};
CCFileManager.SingletonConstructor();


CCFileManager.Loaded = function(file, data)
{
    for( var i=0; i<this.LoadQueue.length; ++i )
    {
        var load = this.LoadQueue[i];
        if( load.file === file )
        {
            this.LoadQueue.remove( load );
            for( var iOnLoad=0; iOnLoad<load.onLoad.length; ++iOnLoad )
            {
                load.onLoad[iOnLoad]( data );
            }
            return;
        }
    }
};


CCFileManager.Load = function(file, onLoad, priority)
{
    if( onLoad )
    {
        for( var i=0; i<this.LoadQueue.length; ++i )
        {
            var load = this.LoadQueue[i];
            if( load.file === file )
            {
                load.onLoad.push( onLoad );
                return;
            }
        }

        var packet = {};
        packet.file = file;
        packet.onLoad = [];
        packet.onLoad.push( onLoad );
        this.LoadQueue.push( packet );

        CCEngine.NativeUpdateCommands += 'CCFileManager.Load;' + file + '\n';
    }
};


CCFileManager.Save = function(file, data)
{
    if( typeof( data ) === "object" )
    {
        data = JSON.stringify( data );
    }

    if( data && data.length > 0 )
    {
        var encodedData = String.ReplaceChar( data, '\n', '\\n' );
        CCEngine.NativeUpdateCommands += 'CCFileManager.Save;' + file + ';' + encodedData + '\n';
    }
};
