/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCPrimitiveFBX.js
 * Description : Loads and handles an fbx model
 *
 * Created     : 30/04/13
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

function CCFBXSubModel(parent)
{
    this.parent = parent;
}


CCFBXSubModel.prototype.loadJSON = function(json)
{
    var i;

    this.name = json.name;

    var submeshes = json.submeshes;
    this.submeshes = [];
    for( i=0; i<submeshes.length; ++i )
    {
        this.submeshes.push( submeshes[i] );
    }

    var vertices = json.vertices;
    if( vertices.length < 3 )
    {
        return 0;
    }

    var vertexCount = this.vertexCount = vertices.length / 3;
    this.vertices = CCRenderer.NewArrayType( vertices, CCRenderer.Float32Array );
    this.skinnedVertices = CCRenderer.NewArrayType( vertices, CCRenderer.Float32Array );
    this.vertexPositionBuffer = gRenderer.CCCreateVertexBuffer( this.skinnedVertices );

    this.normals = json.normals;

    var indices = json.indices;
    this.indices = CCRenderer.NewArrayType( indices, CCRenderer.Uint16Array );
    this.vertexIndexBuffer = gRenderer.CCCreateVertexIndexBuffer( this.indices );

    var uvs = json.uvs;
    if( !uvs )
    {
        uvs = new Array( vertexCount*2 );
        for( i=0; i<vertexCount*2; ++i )
        {
            uvs[i] = 0.0;
        }
    }
    this.modelUVs = CCRenderer.NewArrayType( uvs, CCRenderer.Float32Array );
    this.vertexTextureBuffer = gRenderer.CCCreateVertexBuffer( this.modelUVs, 2 );

    return vertexCount;
};


function CCPrimitiveFBX()
{
	this.construct();

    this.animationFPS = 30;
    this.animationFPSCompression = 5;
    this.setAnimation( 0 );
}
ExtendPrototype( CCPrimitiveFBX, CCPrimitive3D );


CCPrimitiveFBX.prototype.construct = function()
{
	this.CCPrimitive3D_construct();

    if( CCEngine.NativeUpdateCommands !== undefined )
    {
        CCEngine.NativeUpdateCommands += 'CCPrimitiveFBX.construct;' + this.primitiveID + '\n';
    }
};


CCPrimitiveFBX.prototype.destruct = function()
{
    if( !this.cached )
    {
        if( this.submodels )
        {
            var submodels = this.submodels;
            for( var submodelIndex=0; submodelIndex<submodels.length; ++submodelIndex )
            {
                var submodel = submodels[submodelIndex];

                if( submodel.vertexIndexBuffer )
                {
                    gRenderer.CCDeleteVertexBuffer( submodel.vertexIndexBuffer );
                }

                if( submodel.vertexPositionBuffer )
                {
                    gRenderer.CCDeleteVertexBuffer( submodel.vertexPositionBuffer );
                }

                if( submodel.vertexTextureBuffer )
                {
                    gRenderer.CCDeleteVertexBuffer( submodel.vertexTextureBuffer );
                }
            }
        }
    }

    this.CCPrimitive3D_destruct();

    if( CCEngine.NativeUpdateCommands !== undefined )
    {
        CCEngine.NativeUpdateCommands += 'CCPrimitiveFBX.destruct;' + this.primitiveID + '\n';
    }
};


CCPrimitiveFBX.prototype.loadData = function(fileData, callback)
{
    if( fileData )
    {
        this.fileSize = fileData.length;

        var windowURL = window.URL || window.webkitURL;
        if( window.Worker && windowURL && windowURL.createObjectURL )
        {
            var self = this;

            if( !CCPrimitiveFBX.workerJSONParse )
            {
                var blob = new Blob([
"self.addEventListener( 'message', function (e) \
{   \
    var data = e.data;  \
    if( data.loadData ) \
    {   \
        var json = JSON.parse( data.loadData ); \
        self.postMessage( json );   \
    }   \
    else if( data.close ) \
    {   \
        self.close();   \
    }   \
}, false );"], { "type" : "text\/javascript" });

                // Obtain a blob URL reference to our worker 'file'.
                var blobURL = windowURL.createObjectURL( blob );
                CCPrimitiveFBX.workerJSONParse = new Worker( blobURL );
            }

            if( window.DEBUG_IsLocalClient )
            {
                //console.log( "CCPrimitiveFBX.loadingData", this.filename );
            }

            var worker = CCPrimitiveFBX.workerJSONParse;
            worker.onmessage = function(e)
            {
                if( window.DEBUG_IsLocalClient )
                {
                    //console.log( "CCPrimitiveFBX.loadedData", self.filename );
                }

                var json = e.data;
                CCEngine.RunNextUpdate( function()
                {
                    self.loadJSON( json, callback );
                });
            };

            worker.postMessage( { loadData: fileData } );
            return;
        }
        else
        {
            var json = JSON.parse( fileData );
            this.loadJSON( json, callback );
        }
    }
    else
    {
        this.loaded( callback );
    }
};


CCPrimitiveFBX.prototype.loadJSON = function(json, callback)
{
    if( json )
    {
        var i;

        if( json.materials )
        {
            this.materials = json.materials;
        }

        if( json.models && json.models.length > 0 )
        {
            this.submodels = [];
            for( i=0; i<json.models.length; ++i )
            {
                var model = json.models[i];
                if( model.submeshes && model.vertices )
                {
                    var submodel = new CCFBXSubModel( this );
                    var vertexCount = submodel.loadJSON( model );
                    if( vertexCount > 0 )
                    {
                        this.vertexCount += vertexCount;
                        this.submodels.push( submodel );
                    }
                }
            }
        }

        if( json.animations )
        {
            this.animations = json.animations;

            if( json.animationFPS )
            {
                this.animationFPS = json.animationFPS;
            }

            if( json.animationFPSCompression )
            {
                this.animationFPSCompression = json.animationFPSCompression;
            }

            this.setAnimation( 0 );
            this.nextFrame();
        }

        var self = this;
        this.calculateMinMaxAsync( function()
        {
            self.width = self.mmX.size();
            self.height = self.mmY.size();
            self.depth = self.mmZ.size();
            self.loaded( callback );
        });
        return;
    }

    this.loaded( callback );
};


CCPrimitiveFBX.prototype.loaded = function(callback)
{
    callback( this.vertexCount > 0 );
};


CCPrimitiveFBX.prototype.render = function()
{
    if( CCEngine.NativeUpdateCommands !== undefined )
    {
        gRenderer.unbindBuffers();
        CCEngine.NativeRenderCommands += 'CCPrimitiveFBX.render;' + this.primitiveID + '\n';
    }
    else
    {
        if( this.textureIndex !== -1 )
        {
            gEngine.textureManager.setTextureIndex( this.textureIndex );
        }
        else
        {
            gEngine.textureManager.setTextureIndex( 1 );
        }

        this.renderVertices( gRenderer );
    }
};


CCPrimitiveFBX.prototype.renderVertices = function(renderer)
{
    renderer.CCSetRenderStates();

    var submodels = this.submodels;
    for( var submodelIndex=0; submodelIndex<submodels.length; ++submodelIndex )
    {
        var submodel = submodels[submodelIndex];

        if( submodel.disabled )
        {
            continue;
        }

        if( submodel.vertexTextureBuffer )
        {
            renderer.CCBindVertexTextureBuffer( submodel.vertexTextureBuffer );
        }
        renderer.CCBindVertexPositionBuffer( submodel.vertexPositionBuffer );

        renderer.CCBindVertexIndexBuffer( submodel.vertexIndexBuffer );

        var submeshes = submodel.submeshes;
        for( var i=0; i<submeshes.length; ++i )
        {
            var submesh = submeshes[i];
            renderer.GLDrawElements( "TRIANGLES", submesh.count, submesh.offset );
        }
    }
};


CCPrimitiveFBX.prototype.getYMinMaxAtZ = function(atZ, callback)
{
    var mmYAtZ = new CCMinMax();

    // var vertices = this.vertices;
    // var vertexCount = this.vertexCount;
    // for( var i=0; i<vertexCount; ++i )
    // {
    //     var index = i*3;
    //     var y = vertices[index+1];
    //     var z = vertices[index+2];

    //     if( z >= atZ )
    //     {
    //         mmYAtZ.consider( y );
    //     }
    // }

    callback( mmYAtZ );
};


CCPrimitiveFBX.prototype.calculateMinMaxAsync = function(callback)
{
    // this.calculateMinMaxWorker( callback );
    // return;
    var self = this;
    //setTimeout( function() {
        CCEngine.RunNextUpdate( function()
        {
            self.calculateMinMax();
            if( callback )
            {
                callback();
            }
        });
    //}, CCEngine.IsMobile() ? 500 : 100 );
};


CCPrimitiveFBX.prototype.calculateMinMaxWorker = function(callback)
{
    var windowURL = window.URL || window.webkitURL;
    if( window.Worker && windowURL && windowURL.createObjectURL )
    {
        var self = this;

        if( !CCPrimitiveFBX.workerCalculateMinMax )
        {
            var blob = new Blob([
"function calculateMinMax(mmX, mmY, mmZ, submodels, animations) \
{ \
 \
    var submodelsLength; \
    var submodelIndex; \
    var submodel; \
 \
    var MathMin = Math.min; \
    var MathMax = Math.max; \
    var x, y, z; \
 \
    if( animations && animations.length > 0 ) \
    { \
        var animation = animations[0]; \
        var frames = animation.frames; \
        if( frames && frames.length > 0 ) \
        { \
            var animationFrameSubmodels = frames[0]; \
            var animationFrameSubmodelsLength = animationFrameSubmodels.length; \
            if( animationFrameSubmodels && animationFrameSubmodelsLength > 0 ) \
            { \
                for( var iSubmodel=0; iSubmodel<animationFrameSubmodelsLength; ++iSubmodel ) \
                { \
                    var animationSubmodel = animationFrameSubmodels[iSubmodel]; \
                    var v = animationSubmodel.v; \
                    if( !v ) \
                    { \
                        submodelsLength = submodels.length; \
                        for( submodelIndex=0; submodelIndex<submodelsLength; ++submodelIndex ) \
                        { \
                            submodel = submodels[submodelIndex]; \
                            if( submodel.name === animationSubmodel.n ) \
                            { \
                                v = submodel.vertices; \
                                break; \
                            } \
                        } \
                    } \
                    if( v ) \
                    { \
                        var vLength = v.length; \
                        for( var vertexIndex=0; vertexIndex<vLength; vertexIndex+=3 ) \
                        { \
                            x = v[vertexIndex+0]; \
                            y = v[vertexIndex+1]; \
                            z = v[vertexIndex+2]; \
 \
                            mmX.min = MathMin( mmX.min, x ); \
                            mmX.max = MathMax( mmX.max, x ); \
 \
                            mmY.min = MathMin( mmY.min, y ); \
                            mmY.max = MathMax( mmY.max, y ); \
 \
                            mmZ.min = MathMin( mmZ.min, z ); \
                            mmZ.max = MathMax( mmZ.max, z ); \
                        } \
                    } \
                } \
                return; \
            } \
        } \
    } \
 \
    if( submodels ) \
    { \
        submodelsLength = submodels.length; \
        for( submodelIndex=0; submodelIndex<submodelsLength; ++submodelIndex ) \
        { \
            submodel = submodels[submodelIndex]; \
            var vertices = submodel.vertices; \
            var vertexCount = submodel.vertexCount; \
            for( var i=0; i<vertexCount; ++i ) \
            { \
                var index = i*3; \
 \
                x = vertices[index+0]; \
                y = vertices[index+1]; \
                z = vertices[index+2]; \
 \
                mmX.min = MathMin( mmX.min, x ); \
                mmX.max = MathMax( mmX.max, x ); \
 \
                mmY.min = MathMin( mmY.min, y ); \
                mmY.max = MathMax( mmY.max, y ); \
 \
                mmZ.min = MathMin( mmZ.min, z ); \
                mmZ.max = MathMax( mmZ.max, z ); \
            } \
        } \
    } \
}; \
 \
self.addEventListener( 'message', function (e) \
{ \
    var data = e.data.data;  \
 \
    var mmX = data.mmX; \
    var mmY = data.mmY; \
    var mmZ = data.mmZ; \
    var submodels = data.submodels; \
    var animations = data.animations; \
 \
    calculateMinMax( mmX, mmY, mmZ, submodels, animations ); \
    var result = {}; \
    result.mmX = mmX; \
    result.mmY = mmY; \
    result.mmZ = mmZ; \
    self.postMessage( result ); \
}, false );"], { "type" : "text\/javascript" });

            // Obtain a blob URL reference to our worker 'file'.
            var blobURL = windowURL.createObjectURL( blob );
            CCPrimitiveFBX.workerCalculateMinMax = new Worker( blobURL );
        }

        if( window.DEBUG_IsLocalClient )
        {
            //console.log( "CCPrimitiveFBX.loadingData", this.filename );
        }

        var worker = CCPrimitiveFBX.workerCalculateMinMax;
        var self = this;
        worker.onmessage = function(e)
        {
            if( window.DEBUG_IsLocalClient )
            {
                //console.log( "CCPrimitiveFBX.loadedData", self.filename );
            }

            var result = e.data;
            self.mmX.min = result.mmX.min;
            self.mmX.max = result.mmX.max;
            self.mmY.min = result.mmY.min;
            self.mmY.max = result.mmY.max;
            self.mmZ.min = result.mmZ.min;
            self.mmZ.max = result.mmZ.max;

            if( callback )
            {
                callback();
            }
        };

        this.mmX.reset();
        this.mmY.reset();
        this.mmZ.reset();

        var data = {};
        data.mmX = this.mmX;
        data.mmY = this.mmY;
        data.mmZ = this.mmZ;
        data.submodels = this.animations;
        data.animations = this.animations;
        worker.postMessage( { data:data } );
        return;
    }
    else
    {
        this.calculateMinMax();
    }
};


CCPrimitiveFBX.prototype.calculateMinMax = function()
{
    var mmX = this.mmX;
    var mmY = this.mmY;
    var mmZ = this.mmZ;

    mmX.reset();
    mmY.reset();
    mmZ.reset();

    var submodels = this.submodels;
    var submodelsLength;
    var submodelIndex;
    var submodel;

    // Unroll CCMinMax.consider
    var MathMin = Math.min;
    var MathMax = Math.max;
    var x, y, z;

    // Get the size of the model from the first animation frame
    var animations = this.animations;
    if( animations && animations.length > 0 )
    {
        var animation = animations[0];
        var frames = animation.frames;
        if( frames && frames.length > 0 )
        {
            var animationFrameSubmodels = frames[0];
            var animationFrameSubmodelsLength = animationFrameSubmodels.length;
            if( animationFrameSubmodels && animationFrameSubmodelsLength > 0 )
            {
                for( var iSubmodel=0; iSubmodel<animationFrameSubmodelsLength; ++iSubmodel )
                {
                    var animationSubmodel = animationFrameSubmodels[iSubmodel];
                    var v = animationSubmodel.v;
                    if( !v )
                    {
                        // Find vertices from our submodels
                        submodelsLength = submodels.length;
                        for( submodelIndex=0; submodelIndex<submodelsLength; ++submodelIndex )
                        {
                            submodel = submodels[submodelIndex];
                            if( submodel.name === animationSubmodel.n )
                            {
                                v = submodel.vertices;
                                break;
                            }
                        }
                    }
                    if( v )
                    {
                        var vLength = v.length;
                        for( var vertexIndex=0; vertexIndex<vLength; vertexIndex+=3 )
                        {
                            x = v[vertexIndex+0];
                            y = v[vertexIndex+1];
                            z = v[vertexIndex+2];

                            // Unroll CCMinMax.consider
                            //mmX.consider( x );
                            //mmY.consider( y );
                            //mmZ.consider( z );

                            mmX.min = MathMin( mmX.min, x );
                            mmX.max = MathMax( mmX.max, x );

                            mmY.min = MathMin( mmY.min, y );
                            mmY.max = MathMax( mmY.max, y );

                            mmZ.min = MathMin( mmZ.min, z );
                            mmZ.max = MathMax( mmZ.max, z );
                        }
                    }
                }
                return;
            }
        }
    }

    // No animations use the model vertices
    if( submodels )
    {
        submodelsLength = submodels.length;
        for( submodelIndex=0; submodelIndex<submodelsLength; ++submodelIndex )
        {
            submodel = submodels[submodelIndex];
            var vertices = submodel.vertices;
            var vertexCount = submodel.vertexCount;
            for( var i=0; i<vertexCount; ++i )
            {
                var index = i*3;

                x = vertices[index+0];
                y = vertices[index+1];
                z = vertices[index+2];

                // Unroll CCMinMax.consider
                // mmX.consider( x );
                // mmY.consider( y );
                // mmZ.consider( z );

                mmX.min = MathMin( mmX.min, x );
                mmX.max = MathMax( mmX.max, x );

                mmY.min = MathMin( mmY.min, y );
                mmY.max = MathMax( mmY.max, y );

                mmZ.min = MathMin( mmZ.min, z );
                mmZ.max = MathMax( mmZ.max, z );
            }
        }
    }
};


CCPrimitiveFBX.prototype.moveVerticesToOrigin = function(callback)
{
    if( !this.movedToOrigin )
    {
        var origin = this.getOrigin();

        var animations = this.animations;
        if( animations )
        {
            var animationsLength = animations.length;
            for( var animationIndex=0; animationIndex<animationsLength; ++animationIndex )
            {
                var animation = animations[animationIndex];
                var frames = animation.frames;
                if( frames )
                {
                    var framesLength = frames.length;
                    for( var frameIndex=0; frameIndex<framesLength; ++frameIndex )
                    {
                        var animationFrameSubmodels = animation.frames[frameIndex];
                        for( var iSubmodel=0; iSubmodel<animationFrameSubmodels.length; ++iSubmodel )
                        {
                            var animationSubmodel = animationFrameSubmodels[iSubmodel];
                            var v = animationSubmodel.v;
                            if( v )
                            {
                                var vLength = v.length;
                                for( var vertexIndex=0; vertexIndex<vLength; vertexIndex+=3 )
                                {
                                    v[vertexIndex+0] -= origin[0];
                                    v[vertexIndex+1] -= origin[1];
                                    v[vertexIndex+2] -= origin[2];
                                }
                            }
                        }
                    }
                }
            }
        }

        var submodels = this.submodels;
        var submodelsLength;
        for( var submodelIndex=0; submodelIndex<submodelsLength; ++submodelIndex )
        {
            var submodel = submodels[submodelIndex];
            var vertices = submodel.vertices;
            var skinnedVertices = submodel.skinnedVertices;
            var vertexCount = submodel.vertexCount;
            for( var i=0; i<vertexCount; ++i )
            {
                var index = i*3;
                var x = index+0;
                var y = index+1;
                var z = index+2;

                vertices[x] -= origin[0];
                vertices[y] -= origin[1];
                vertices[z] -= origin[2];
                skinnedVertices[x] -= origin[0];
                skinnedVertices[y] -= origin[1];
                skinnedVertices[z] -= origin[2];
            }

            gRenderer.CCUpdateVertexBuffer( submodel.vertexPositionBuffer, skinnedVertices );
        }

        var self = this;
        this.calculateMinMaxAsync( function()
        {
            self.movedToOrigin = true;
            if( callback )
            {
                callback();
            }
        });
        return;
    }

    if( callback )
    {
        callback();
    }
};


CCPrimitiveFBX.prototype.copy = function(sourcePrimitive)
{
    this.filename = sourcePrimitive.filename;
    this.fileSize = sourcePrimitive.fileSize;

    if( CCEngine.NativeUpdateCommands !== undefined )
    {
        CCEngine.NativeUpdateCommands += 'CCPrimitiveFBX.copy;' + this.primitiveID + ';' + sourcePrimitive.primitiveID + '\n';
    }
    else
    {
        var submodels = this.submodels = [];
        var sourceSubmodels = sourcePrimitive.submodels;
        var sourceSubmodelsLength = sourcePrimitive.submodels.length;
        for( var submodelIndex=0; submodelIndex<sourceSubmodelsLength; ++submodelIndex )
        {
            var sourceSubmodel = sourcePrimitive.submodels[submodelIndex];
            var submodel = {};
            submodels.push( submodel );

            submodel.name = sourceSubmodel.name;
            submodel.submeshes = [];
            for( i=0; i<sourceSubmodel.submeshes.length; ++i )
            {
                submodel.submeshes.push( sourceSubmodel.submeshes[i] );
            }

            submodel.vertexCount = sourceSubmodel.vertexCount;
            submodel.vertices = sourceSubmodel.vertices;
            submodel.normals = sourceSubmodel.normals;
            submodel.skinnedVertices = CCRenderer.NewArrayType( submodel.vertices, CCRenderer.Float32Array );
            submodel.vertexPositionBuffer = gRenderer.CCCreateVertexBuffer( submodel.skinnedVertices );

            submodel.indices = sourceSubmodel.indices;
            submodel.vertexIndexBuffer = sourceSubmodel.vertexIndexBuffer;

            submodel.modelUVs = sourceSubmodel.modelUVs;
            submodel.vertexTextureBuffer = sourceSubmodel.vertexTextureBuffer;
        }

        this.sourcePrimitive = sourcePrimitive;
    }

    this.sourcePrimitiveID = sourcePrimitive.primitiveID;

    this.materials = sourcePrimitive.materials;

    this.animations = sourcePrimitive.animations;
    this.animationFPS = sourcePrimitive.animationFPS;
    this.animationFPSCompression = sourcePrimitive.animationFPSCompression;

    this.setAnimation( 0 );
    this.nextFrame();

    this.vertexCount = sourcePrimitive.vertexCount;

    this.width = sourcePrimitive.width;
    this.height = sourcePrimitive.height;
    this.depth = sourcePrimitive.depth;
    this.mmX = sourcePrimitive.mmX;
    this.mmY = sourcePrimitive.mmY;
    this.mmZ = sourcePrimitive.mmZ;

    this.cached = true;
    this.movedToOrigin = sourcePrimitive.movedToOrigin;
    this.origin = sourcePrimitive.origin;
};


CCPrimitiveFBX.prototype.getAnimation = function()
{
    if( this.nextNextAnimationIndex !== undefined )
    {
        return this.nextNextAnimationIndex;
    }
    return this.nextAnimationIndex;
};


CCPrimitiveFBX.prototype.getAnimationFrame = function()
{
    if( this.lockedAnimationFrameIndex !== undefined )
    {
        return this.lockedAnimationFrameIndex;
    }
    return -1;
};


CCPrimitiveFBX.prototype.getAnimationNumberOfFrames = function()
{
    return this.numberOfFrames;
};


CCPrimitiveFBX.prototype.getAnimationFPSCompression = function()
{
    return this.animationFPSCompression;
};


CCPrimitiveFBX.prototype.setAnimation = function(index)
{
    this.currentAnimationIndex = index;
    this.currentFrameIndex = 0;
    this.nextAnimationIndex = index;
    this.nextFrameIndex = 0;
    this.frameDelta = 0.0;
    this.frameSpeed = this.animationFPS / this.animationFPSCompression;

    this.numberOfFrames = 0;
    if( this.animations && this.animations.length > 0 && this.nextAnimationIndex < this.animations.length )
    {
        var animations = this.animations;
        var nextAnimation = animations[this.nextAnimationIndex];
        if( nextAnimation )
        {
            var frames = nextAnimation.frames;
            this.numberOfFrames = frames.length;
        }
    }

    if( this.lockedAnimationFrameIndex !== undefined )
    {
        delete this.lockedAnimationFrameIndex;
    }
    this.setAnimationFrame( 0 );
};


CCPrimitiveFBX.prototype.setAnimationFrame = function(index)
{
    if( this.animations && this.animations.length > 0 )
    {
        var currentAnimationIndex;
        if( this.nextNextAnimationIndex !== undefined )
        {
            currentAnimationIndex = this.nextNextAnimationIndex;
        }
        else
        {
            currentAnimationIndex = this.nextAnimationIndex;
        }

        if( currentAnimationIndex >= this.animations.length )
        {
            currentAnimationIndex = 0;
        }

        this.interpolateFrames( currentAnimationIndex, index, currentAnimationIndex, index, 0.0 );
    }
};


CCPrimitiveFBX.prototype.setNextAnimationFrame = function(index)
{
    this.nextFrameIndex = index;
};


CCPrimitiveFBX.prototype.toggleAnimationFrame = function(index)
{
    if( index < 0 )
    {
        index = 0;
    }

    if( index > this.numberOfFrames-1 )
    {
        index = this.numberOfFrames-1;
    }

    if( this.lockedAnimationFrameIndex !== undefined )
    {
        if( this.lockedAnimationFrameIndex === index )
        {
            this.setAnimationFrame( index );
            this.setNextAnimationFrame( index );
            delete this.lockedAnimationFrameIndex;
            return;
        }
    }

    this.lockedAnimationFrameIndex = index;
    this.setAnimationFrame( index );
};


CCPrimitiveFBX.prototype.setNextAnimation = function(index)
{
    this.nextNextAnimationIndex = index;

    if( this.lockedAnimationFrameIndex !== undefined )
    {
        delete this.lockedAnimationFrameIndex;
    }
};


CCPrimitiveFBX.prototype.nextFrame = function(repeat)
{
    if( this.animations && this.animations.length > 0 && this.nextAnimationIndex < this.animations.length )
    {
        this.currentFrameIndex = this.nextFrameIndex;
        this.currentAnimationIndex = this.nextAnimationIndex;
        this.nextFrameIndex++;

        if( this.nextNextAnimationIndex !== undefined && this.nextAnimationIndex != this.nextNextAnimationIndex )
        {
            this.nextAnimationIndex = this.nextNextAnimationIndex;
            this.nextFrameIndex = 0;
        }

        var animations = this.animations;
        var nextAnimation = animations[this.nextAnimationIndex];
        if( nextAnimation )
        {
            var frames = nextAnimation.frames;
            if( frames && frames.length > 0 )
            {
                if( this.nextFrameIndex >= frames.length )
                {
                    if( repeat )
                    {
                        this.nextFrameIndex = 0;
                    }
                    else
                    {
                        this.nextFrameIndex = frames.length-1;
                    }
                }
            }
        }
    }
};


CCPrimitiveFBX.prototype.animateForDuration = function(delta, repeat, duration)
{
    if( this.lockedAnimationFrameIndex !== undefined )
    {
        return;
    }

    if( this.animations && this.animations.length > 0 && this.currentAnimationIndex < this.animations.length )
    {
        this.frameDelta += delta * this.numberOfFrames * duration;
        if( this.frameDelta >= 1.0 )
        {
            this.frameDelta = 0.0;
            this.nextFrame( repeat );
        }

        this.interpolateFrames( this.currentAnimationIndex, this.currentFrameIndex, this.nextAnimationIndex, this.nextFrameIndex, this.frameDelta );
    }
};


CCPrimitiveFBX.prototype.animate = function(delta, repeat)
{
    if( this.lockedAnimationFrameIndex !== undefined )
    {
        return;
    }

    if( this.animations && this.animations.length > 0 && this.currentAnimationIndex < this.animations.length )
    {
        this.frameDelta += delta * this.frameSpeed;
        if( this.frameDelta >= 1.0 )
        {
            this.frameDelta = 0.0;
            this.nextFrame( repeat );
        }

        this.interpolateFrames( this.currentAnimationIndex, this.currentFrameIndex, this.nextAnimationIndex, this.nextFrameIndex, this.frameDelta );
    }
};


CCPrimitiveFBX.prototype.interpolateFrames = function(currentAnimationIndex, currentFrameIndex, nextAnimationIndex, nextFrameIndex, frameDelta)
{
    if( this.submodels )
    {
        var submodels = this.submodels;
        var submodelsLength = this.submodels.length;

        var currentAnimation = this.animations[currentAnimationIndex];
        var nextAnimation = this.animations[nextAnimationIndex];
        if( currentAnimation && nextAnimation )
        {
            if( currentAnimation.frames && nextAnimation.frames )
            {
                var currentFrame = currentAnimation.frames[currentFrameIndex];
                var nextFrame = nextAnimation.frames[nextFrameIndex];
                for( var submodelIndex=0; submodelIndex<submodelsLength; ++submodelIndex )
                {
                    var submodel = submodels[submodelIndex];
                    var currentFrameVertices = this.getAnimationFrameSubmodelVertices( submodel.name, currentFrame );
                    var nextFrameVertices = this.getAnimationFrameSubmodelVertices( submodel.name, nextFrame );

                    if( currentFrameVertices && nextFrameVertices )
                    {
                        var inverseDelta = 1.0 - frameDelta;

                        var skinnedVertices = submodel.skinnedVertices;
                        var skinnedVerticesLength = skinnedVertices.length;
                        for( var vertIndex=0; vertIndex<skinnedVerticesLength; ++vertIndex )
                        {
                            var interpolatedVert = currentFrameVertices[vertIndex] * inverseDelta + nextFrameVertices[vertIndex] * frameDelta;
                            skinnedVertices[vertIndex] = interpolatedVert;
                        }
                        gRenderer.CCUpdateVertexBuffer( submodel.vertexPositionBuffer, skinnedVertices );
                    }
                }
            }
        }
    }
};


CCPrimitiveFBX.prototype.getAnimationFrameSubmodelVertices = function(submodelName, frame)
{
    if( frame )
    {
        var frameLength = frame.length;
        for( var iSubmodel=0; iSubmodel<frameLength; ++iSubmodel )
        {
            if( frame[iSubmodel].n === submodelName )
            {
                return frame[iSubmodel].v;
            }
        }
    }
    return null;
};


// Ensure our animation data is unlocked from any cached sets
CCPrimitiveFBX.prototype.unlockAnimationsData = function()
{
    if( this.sourcePrimitive && this.sourcePrimitive.animations === this.animations )
    {
        this.animations = CC.DeepCopy( this.animations );
    }
}


CCPrimitiveFBX.prototype.deleteAnimation = function(animationName)
{
    this.unlockAnimationsData();

    var animations = this.animations;
    for( var i=0; i<animations.length; ++i )
    {
        if( animations[i].name === animationName )
        {
            animations.remove( animations[i] );
            this.setAnimation( 0 );
            return true;
        }
    }

    return false;
};


CCPrimitiveFBX.prototype.moveAnimationFrame = function(oldIndex, newIndex)
{
    this.unlockAnimationsData();

    if( this.lockedAnimationFrameIndex !== undefined )
    {
        delete this.lockedAnimationFrameIndex;
    }

    var currentAnimation = this.animations[this.currentAnimationIndex];
    var frames = currentAnimation.frames;
    if( oldIndex >= 0 && oldIndex < frames.length &&
        newIndex >= 0 && newIndex < frames.length )
    {
        var frame = frames[oldIndex];
        frames.insert( frame, newIndex );
        return true;
    }

    return false;
};


CCPrimitiveFBX.prototype.deleteAnimationFrame = function(index)
{
    if( this.lockedAnimationFrameIndex !== undefined )
    {
        delete this.lockedAnimationFrameIndex;
    }

    var currentAnimation = this.animations[this.currentAnimationIndex];
    var frames = currentAnimation.frames;
    if( index >= 0 && index < frames.length )
    {
        frames.remove( frames[index] );
        return true;
    }

    return false;
};


CCPrimitiveFBX.prototype.toggleSubmodel = function(submodelName)
{
    var submodels = this.submodels;
    var i, submodel;

    for( i=0; i<submodels.length; ++i )
    {
        if( submodels[i].name === submodelName )
        {
            submodel = submodels[i];
        }
    }

    if( submodel )
    {
        if( submodel.disabled )
        {
            delete submodel.disabled;
        }
        else
        {
            submodel.disabled = true;
        }
    }
};


CCPrimitiveFBX.prototype.deleteSubmodel = function(submodelName)
{
    var submodels = this.submodels;
    var i, submodel;

    for( i=0; i<submodels.length; ++i )
    {
        if( submodels[i].name === submodelName )
        {
            submodel = submodels[i];
        }
    }

    if( submodel )
    {
        submodels.remove( submodel );

        // Get the size of the model from the first animation frame
        var animations = this.animations;
        for( i=0; i<animations.length; ++i )
        {
            var animation = animations[i];
            var frames = animation.frames;
            for( var iFrame=0; iFrame<frames.length; ++iFrame )
            {
                var animationFrameSubmodels = frames[iFrame];
                for( var iSubmodel=0; iSubmodel<animationFrameSubmodels.length; ++iSubmodel )
                {
                    var animationSubmodel = animationFrameSubmodels[iSubmodel];
                    var animationSubmodelName = animationSubmodel.n;
                    if( animationSubmodelName === submodelName )
                    {
                        animationFrameSubmodels.remove( animationSubmodel );
                        --iSubmodel;
                    }
                }
            }
        }
        return true;
    }
    return false;
};



CCPrimitiveFBX.prototype.exportJSONString = function(callback)
{
    var i;

    var json = {};
    json.animationFPS = this.animationFPS;
    json.animationFPSCompression = this.animationFPSCompression;
    json.materials = this.materials;
    json.models = [];

    var submodels = this.submodels;
    for( i=0; i<submodels.length; ++i )
    {
        var submodel = submodels[i];

        var model = {};
        model.name = submodel.name;
        model.submeshes = submodel.submeshes;

        var iVert;
        model.vertices = [];
        for( iVert=0; iVert<submodel.vertices.length; ++iVert )
        {
            model.vertices.push( submodel.vertices[iVert] );
        }

        model.normals = submodel.normals;

        model.uvs = [];
        for( iVert=0; iVert<submodel.modelUVs.length; ++iVert )
        {
            model.uvs.push( submodel.modelUVs[iVert] );
        }

        model.indices = [];
        for( iVert=0; iVert<submodel.indices.length; ++iVert )
        {
            model.indices.push( submodel.indices[iVert] );
        }

        json.models.push( model );
    }

    json.animations = this.animations;

    CCFileManager.Stringify( json, function(string)
    {
        callback( string );
    });
};
