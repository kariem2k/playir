/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCModel3D.js
 * Description : Loads and handles a 3d model
 *
 * Created     : 15/10/12
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

function CCModel3D()
{
	this.construct();
}
ExtendPrototype( CCModel3D, CCModelBase );


CCModel3D.prototype.construct = function()
{
	this.CCModelBase_construct();

	this.primitive = null;
};


CCModel3D.prototype.getPrimitive = function()
{
	return this.primitive;
};


CCModel3D.prototype.getWidth = function()
{
	return this.primitive.getWidth();
};


CCModel3D.prototype.getHeight = function()
{
	return this.primitive.getHeight();
};


CCModel3D.prototype.getDepth = function()
{
	return this.primitive.getDepth();
};


CCModel3D.prototype.getOrigin = function()
{
	return this.primitive.getOrigin();
};


CCModel3D.prototype.moveVerticesToOrigin = function(callback)
{
	this.primitive.moveVerticesToOrigin( callback );
};


CCModel3D.prototype.setTexture = function(file, mipmap, load)
{
	if( file )
    {
        this.primitive.setTexture( file, mipmap, true, load );
    }
};


// Animations
CCModel3D.prototype.getAnimations = function()
{
    if( this.primitive.animations )
    {
        return this.primitive.animations;
    }
    return null;
};


CCModel3D.prototype.getAnimation = function()
{
    if( this.primitive.getAnimation )
    {
        return this.primitive.getAnimation();
    }
    return 0;
};


CCModel3D.prototype.getAnimationFrame = function()
{
    if( this.primitive.getAnimationFrame )
    {
        return this.primitive.getAnimationFrame();
    }
    return -1;
};


CCModel3D.prototype.getAnimationFPSCompression = function()
{
    if( this.primitive.getAnimationFPSCompression )
    {
        return this.primitive.getAnimationFPSCompression();
    }
    return 0.0;
};


CCModel3D.prototype.setAnimation = function(index)
{
    if( this.primitive.setNextAnimation )
    {
        this.primitive.setNextAnimation( index );
    }
};


CCModel3D.prototype.setAnimationFrame = function(index)
{
    if( this.primitive.setNextAnimationFrame )
    {
        this.primitive.setNextAnimationFrame( index );
    }
};


CCModel3D.prototype.toggleAnimationFrame = function(index)
{
    if( this.primitive.toggleAnimationFrame )
    {
        this.primitive.toggleAnimationFrame( index );
    }
};


CCModel3D.prototype.animate = function(delta, repeat, duration)
{
    if( this.primitive.animate )
    {
        if( repeat === undefined )
        {
            repeat = true;
        }

        if( duration !== undefined )
        {
            this.primitive.animateForDuration( delta, repeat, duration );
        }
        else
        {
            this.primitive.animate( delta, repeat );
        }

        gRenderer.pendingRender = true;
        return true;
    }
    return false;
};



// Caching
function PrimitiveCache()
{
    this.filename = undefined;
    this.primitive = undefined;
}
CCModel3D.ModelCache = [];

function ModelLoaderPacket()
{
    this.callbacks = [];
}
CCModel3D.LoadingQueue = [];
CCModel3D.CurrentLoad = null;


CCModel3D.CreatePrimitive = function(filename)
{
    var extension = filename.getExtension();
    if( extension === "obj" )
    {
        return new CCPrimitiveObj();
    }
    else if( extension === "fbxi" )
    {
        return new CCPrimitiveFBX();
    }
    return null;
};


CCModel3D.CacheModel = function(url, moveVerticesToOrigin, callback, priority)
{
    url = MultiplayerManager.GetAssetURL( url );

    var i;

    var filename = url.stripDirectory();
    filename = String.StripEquals( filename );

    var cachedModel = null;
    var ModelCache = CCModel3D.ModelCache;
    var length = ModelCache.length;
    for( i=0; i<length; ++i )
    {
        var cache = ModelCache[i];
        if( moveVerticesToOrigin === cache.primitive.hasMovedToOrigin() )
        {
            if( cache.filename === filename )
            {
                cachedModel = cache;
                break;
            }
        }
    }

    if( !cachedModel )
    {
        var loaderPacket;

        // Are we loading another one of the current loading model?
        if( CCModel3D.CurrentLoad )
        {
            loaderPacket = CCModel3D.CurrentLoad;
            if( loaderPacket.moveVerticesToOrigin === moveVerticesToOrigin )
            {
                if( loaderPacket.url === url )
                {
                    if( callback )
                    {
                        loaderPacket.callbacks.add( callback );

                        if( priority > 0 )
                        {
                            gURLManager.updateRequestPriority( url, filename, priority );
                        }
                    }
                }
            }
        }

        // Is the model already queued for loading?
        var LoadingQueue = CCModel3D.LoadingQueue;
        for( i=0; i<LoadingQueue.length; ++i )
        {
            loaderPacket = LoadingQueue[i];
            if( loaderPacket.moveVerticesToOrigin === moveVerticesToOrigin )
            {
                if( loaderPacket.url === url )
                {
                    if( callback )
                    {
                        loaderPacket.callbacks.add( callback );
                    }

                    // If it's a high priority request, re-sort
                    if( priority > 0 )
                    {
                        CCModel3D.ResortQueue( loaderPacket, priority );
                    }
                    return;
                }
            }
        }

        // No pending load found, create an ModelLoaderPacket so if another request
        // is made during the load it'll just add it's callback
        {
            loaderPacket = new ModelLoaderPacket();
            loaderPacket.filename = filename;
            loaderPacket.url = url;
            loaderPacket.priority = priority ? priority : 0;
            loaderPacket.moveVerticesToOrigin = moveVerticesToOrigin;
            if( callback )
            {
                loaderPacket.callbacks.add( callback );
            }

            var primitive = CCModel3D.CreatePrimitive( filename );
            if( primitive )
            {
                loaderPacket.primitive = primitive;
                LoadingQueue.add( loaderPacket );
                //console.log( "Queueing", filename, priority );

                // If it's a high priority request, re-sort
                if( priority > 0 )
                {
                    CCModel3D.ResortQueue( loaderPacket, priority );
                }

                CCModel3D.LoadFromQueue();
            }
        }
    }
    else if( callback )
    {
        CCModel3D.CacheModelResult( cachedModel, [callback] );
    }
};


CCModel3D.ResortQueue = function(packet, priority)
{
    var LoadingQueue = CCModel3D.LoadingQueue;
    for( var i=0; i<LoadingQueue.length; ++i )
    {
        var itr = LoadingQueue[i];
        if( itr === packet )
        {
            break;
        }
        else if( itr.priority < priority )
        {
            LoadingQueue.insert( packet, i );
            break;
        }
    }
};


CCModel3D.LoadFromQueue = function()
{
    if( !CCModel3D.CurrentLoad && CCModel3D.LoadingQueue.length > 0 )
    {
        CCModel3D.CurrentLoad = CCModel3D.LoadingQueue.safePop();
        var loaderPacket = CCModel3D.CurrentLoad;
        var filename = loaderPacket.filename;
        var url = loaderPacket.url;
        var priority = loaderPacket.priority;
        var moveVerticesToOrigin = loaderPacket.moveVerticesToOrigin;
        var primitive = loaderPacket.primitive;
        //console.log( "Loading", filename, priority );
        primitive.load( filename, url, priority, function(succeeded)
        {
            if( succeeded )
            {
                // Load our model
                var cachedModel = new PrimitiveCache();
                cachedModel.filename = filename;
                cachedModel.primitive = primitive;
                CCModel3D.ModelCache.add( cachedModel );

                //console.log( "ModelCache size", ModelCache.length );

                if( moveVerticesToOrigin )
                {
                    primitive.moveVerticesToOrigin( function()
                    {
                        CCModel3D.CurrentLoad = null;

                        CCModel3D.CacheModelResult( cachedModel, loaderPacket.callbacks );
                    });
                }
                else
                {
                    CCModel3D.CurrentLoad = null;

                    CCModel3D.CacheModelResult( cachedModel, loaderPacket.callbacks );
                }
            }
            else
            {
                CCModel3D.CurrentLoad = null;

                primitive.destruct();
                CCModel3D.CacheModelResult( null, loaderPacket.callbacks );
            }
        });
    }
};


CCModel3D.CacheModelResult = function(cachedModel, callbacks)
{
    for( var i=0; i<callbacks.length; ++i )
    {
        var model = null;
        if( cachedModel )
        {
            model = new CCModel3D();
            var primitive = CCModel3D.CreatePrimitive( cachedModel.filename );
            primitive.copy( cachedModel.primitive );
            model.primitive = primitive;
            model.addPrimitive( primitive );
        }
        callbacks[i]( model );
    }

    CCModel3D.LoadFromQueue();
};
