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
	this.Loading = null;
	this.LoadQueue = [];
    this.SaveQueue = [];

	// Use indexed db
    var self = this;
    var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;
    if( indexedDB )
    {
        var dbVersion = 8;
        var request = indexedDB.open( "cache", dbVersion );

        var SetVersion = function (db)
        {
            if( db.objectStoreNames.contains( "cache" ) )
            {
                db.deleteObjectStore( "cache" );
            }
            var objectStore = db.createObjectStore( "cache", { keyPath: "key" } );
        };

        request.onupgradeneeded = function (event)
        {
            var db = event.currentTarget.result;
            SetVersion( db );
        };

        request.onsuccess = function (event)
        {
            // Remove our legacay localstorage cache
            if( window.localStorage )
            {
                if( window.localStorage.getItem( "cache" ) )
                {
                    window.localStorage.removeItem( "cache" );
                }
            }

            var db = request.result;
            if( db.setVersion )
            {
                var cacheFound = false;
                if( db.objectStoreNames.contains( "cache" ) )
                {
                    cacheFound = true;
                }

                if( !cacheFound || ( db.version !== dbVersion ) )
                {
                    var req = db.setVersion( dbVersion );
                    req.onsuccess = function()
                    {
                        SetVersion( db );
                        self.db = db;
                    };
                    req.onerror = function()
                    {
                        self.db = false;
                    };
                    return;
                }
            }

            self.db = db;
            self.LoadedDB();
        };

        request.onerror = function (event)
        {
            self.db = false;
            self.LoadedDB();
        };
    }
    else
    {
        self.db = false;
        self.LoadedDB();
    }
};
CCFileManager.SingletonConstructor();


CCFileManager.LoadedDB = function()
{
    for( var i=0; i<this.SaveQueue.length; ++i )
    {
        var save = this.SaveQueue[i];
        this.Save( save.key, save.data );
    }
    delete this.SaveQueue;
    this.Loaded();
};


CCFileManager.Loaded = function()
{
    if( CCFileManager.LoadQueue.length > 0 )
    {
        var self = this;

        var packet = CCFileManager.LoadQueue.safePop();
        CCFileManager.Loading = packet.key;
        this.ProcessLoad( packet.key, function (data)
        {
            packet.onLoad( data );
            self.Loaded();
        });
    }
    else
    {
        CCFileManager.Loading = null;
    }
};


// Public function
CCFileManager.Load = function(key, onLoad, priority)
{
    if( onLoad )
    {
        var self = this;

        // Load cache next if there's nothing currently loaded
        if( !CCFileManager.Loading && this.db !== undefined )
        {
            CCFileManager.Loading = key;
            this.ProcessLoad( key, function (data)
            {
                onLoad( data );
                self.Loaded();
            });
        }

        // Otherwise queue
        else
        {
            var packet = {};
            packet.key = key;
            packet.onLoad = onLoad;
            CCFileManager.LoadQueue.push( packet );

            if( priority > 0 )
            {
                CCFileManager.LoadQueue.insert( packet, 0 );
            }
        }
    }
};


CCFileManager.ProcessLoad = function(key, onLoad)
{
    var db = this.db;
    if( db )
    {
        var self = this;

        var transaction = db.transaction( "cache", 'readwrite' );
        var objectStore = transaction.objectStore( "cache" );

        var request = objectStore.get( key );
        request.onerror = function(event)
        {
            onLoad( undefined );
        };

        request.onsuccess = function(event)
        {
            var item = event.target.result;
            if( item )
            {
                var data = item.data;
                if( data && data.length > 0 )
                {
                    // Update our timestamp
                    item.time = Date.now();
                    self.UpdateTimestamp( item, item.key );

                    onLoad( data );
                    return;
                }
            }

            // On fail
            onLoad( undefined );
        };
    }

    // Revert to LocalStorage if indexedDB is unavailable
    else
    {
        var data = CC.LoadLocalStorageCache( key );
        onLoad( data );
    }
};


// Public function
CCFileManager.Save = function(key, data)
{
    if( data && data.length > 0 )
    {
        if( this.db === undefined )
        {
            this.SaveQueue.push( {key:key, data:data} );
            return;
        }

        var db = this.db;
        if( db )
        {
            var self = this;

            var transaction = db.transaction( "cache", 'readwrite' );
            var objectStore = transaction.objectStore( "cache" );

            var item = {};
            item.key = key;
            item.time = Date.now();
            item.data = data;

            var request = objectStore.put( item );
            request.onerror = function(event)
            {
                self.Trim(function()
                {
                    self.Save( key, data );
                });
            };

            request.onsuccess = function (event)
            {
                // if( window.console && console.log )
                // {
                //     console.log( event.target.result );
                // }
            };
        }
    }

    // Revert to LocalStorage if indexedDB is unavailable
    else
    {
        CC.SaveLocalStorageCache( key, data );
    }
};


CCFileManager.UpdateTimestamp = function(item, index)
{
    var db = this.db;
    if( db )
    {
        var transaction = db.transaction( "cache", 'readwrite' );
        var objectStore = transaction.objectStore( "cache" );

        var request = objectStore.put( item );
        request.onerror = function(event)
        {
            //console.log( event );
        };

        request.onsuccess = function (event)
        {
            //console.log( event );
        };
    }
};


CCFileManager.Delete = function(key, onDelete)
{
    var db = this.db;
    if( db )
    {
        var self = this;

        var transaction = db.transaction( "cache", 'readwrite' );
        var objectStore = transaction.objectStore( "cache" );

        var request = objectStore.delete( key );
        request.onerror = function(event)
        {
            // Hard fail, delete entire db
            self.DeleteAll( onDelete );
        };

        request.onsuccess = function (event)
        {
            if( onDelete )
            {
                onDelete();
            }
        };
    }
};


CCFileManager.DeleteAll = function(onDelete)
{
    var db = this.db;
    if( db )
    {
        var transaction = db.transaction( "cache", 'readwrite' );
        var objectStore = transaction.objectStore( "cache" );

        var request = objectStore.clear();
        request.onerror = function(event)
        {
            if( window.console && console.log )
            {
                console.log( event );
            }
        };

        request.onsuccess = function (event)
        {
            if( onDelete )
            {
                onDelete();
            }
        };
    }
};


CCFileManager.Trim = function(onTrimmed)
{
    if( onTrimmed )
    {
        var db = this.db;
        if( db )
        {
            var self = this;

            var transaction = db.transaction( "cache", 'readwrite' );
            var objectStore = transaction.objectStore( "cache" );

            var request = objectStore.openCursor();
            request.onerror = function(event)
            {
                // Hard fail, delete entire db
                self.DeleteAll( onTrimmed );
            };

            var oldestItem;
            var oldestTime = Date.now();
            request.onsuccess = function(event)
            {
                var cursor = event.target.result;
                if( cursor )
                {
                    var item = cursor.value;
                    if( item.time < oldestTime )
                    {
                        oldestItem = item;
                        oldestTime = item.time;
                        console.log( "CCFileManager.Trim consider", item );
                    }

                    cursor.continue();
                    return;
                }

                if( oldestItem )
                {
                    if( window.debugIsLocalClient )
                    {
                        console.log( "CCFileManager.Trim delete", oldestItem );
                    }
                    self.Delete( oldestItem.key, onTrimmed );
                }
                else
                {
                    if( window.debugIsLocalClient )
                    {
                        console.log( "CCFileManager.Trim delete all" );
                    }

                    // Hard fail, delete entire db
                    self.DeleteAll( onTrimmed );
                }
            };
        }
    }
};


// CCFileManager.Find = function(key, onFind)
// {
//     var db = this.db;
//     if( db )
//     {
//         var transaction = db.transaction( "cache", 'readwrite' );
//         var objectStore = transaction.objectStore( "cache" );

//         // Get an item via it's key
//         //var index = objectStore.index( "key" );
//         //var request = objectStore.openCursor( key );
//         var request = objectStore.get( key );
//         request.onerror = function(event)
//         {
//             onFind( undefined, undefined );
//         };

//         request.onsuccess = function(event)
//         {
//             var cursor = event.target.result;
//             if( cursor )
//             {
//                 var item = cursor.value;
//                 onFind( item, cursor );
//             }
//             else
//             {
//                 onFind( undefined, undefined );
//             }
//         };

//         // Iterate through all the items
//         // var request = objectStore.openCursor();
//         // request.onerror = function(event)
//         // {
//         //     onLoad( undefined );
//         // };

//         // request.onsuccess = function(event)
//         // {
//         //     var cursor = event.target.result;
//         //     if( cursor )
//         //     {
//         //         if( cursor.value.key === key )
//         //         {
//         //             // Update our timestamp
//         //             var item = cursor.value;
//         //             item.time = Date.now();
//         //             var data = item.data;
//         //             if( data && data.length > 0 )
//         //             {
//         //                 self.updateCache( item, cursor.key );

//         //                 onLoad( data );
//         //                 return;
//         //             }
//         //         }
//         //         cursor.continue();
//         //     }
//         //     else
//         //     {
//         //         onLoad( undefined );
//         //     }
//         // };
//     }
// };