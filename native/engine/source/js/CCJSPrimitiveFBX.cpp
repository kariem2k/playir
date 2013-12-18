/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCJSPrimitiveFBX.cpp
 *-----------------------------------------------------------
 */

#include "CCDefines.h"
#include "CCAppManager.h"


CCJSPrimitiveFBX::CCJSPrimitiveFBX(const char *primitiveID)
{
    this->primitiveID = primitiveID;
    animations = NULL;
    animationFPS = 1.0f;
    animationFPSCompression = 0;
}


void CCJSPrimitiveFBX::destruct()
{
    submodels.deleteObjects();

    if( !cached )
    {
        if( animations != NULL )
        {
            delete animations;
            animations = NULL;
        }
    }

    super::destruct();
}


static CCText script;

bool CCJSPrimitiveFBX::loadData(const char *fileData)
{
    json_error_t error;
    json_t *json = json_loads( fileData, 0, &error );
    if( json != NULL )
    {
        fileSize = strlen( fileData );

        if( json_object_get( json, "animations" ) )
        {
            animations = new CCList<Animation>();

            json_t *json_animations = json_object_get( json, "animations" );
            if( json_animations != NULL && json_is_array( json_animations ) )
            {
                const uint json_animations_length = json_array_size( json_animations );
                for( uint animationIndex=0; animationIndex<json_animations_length; ++animationIndex )
                {
                    json_t *json_animation = json_array_get( json_animations, animationIndex );
                    if( json_animation != NULL )
                    {
                        Animation *animation = new Animation();
                        animations->add( animation );

                        json_object_string( animation->name, json_animation, "name" );
                        json_t *json_animation_frames = json_object_get( json_animation, "frames" );
                        if( json_animation_frames != NULL && json_is_array( json_animation_frames ) )
                        {
                            const uint json_animation_frames_length = json_array_size( json_animation_frames );
                            for( uint frameIndex=0; frameIndex<json_animation_frames_length; ++frameIndex )
                            {
                                AnimationFrame *frame = new AnimationFrame();
                                animation->frames.add( frame );

                                json_t *json_frame_submodels = json_array_get( json_animation_frames, frameIndex );
                                if( json_frame_submodels != NULL && json_is_array( json_frame_submodels ) )
                                {
                                    const uint json_frame_submodels_length = json_array_size( json_frame_submodels );
                                    for( uint submodelIndex=0; submodelIndex<json_frame_submodels_length; ++submodelIndex )
                                    {
                                        AnimationFrameSubmodel *frameSubmodel = new AnimationFrameSubmodel();
                                        frame->submodels.add( frameSubmodel );

                                        json_t *json_frame_submodel = json_array_get( json_frame_submodels, submodelIndex );
                                        json_object_string( frameSubmodel->name, json_frame_submodel, "n" );
                                        json_t *json_vertices = json_object_get( json_frame_submodel, "v" );
                                        if( json_vertices != NULL && json_is_array( json_vertices ) )
                                        {
                                            const uint json_vertices_length = json_array_size( json_vertices );
                                            frameSubmodel->vertices = (float*)malloc( sizeof( float ) * json_vertices_length );
                                            for( uint vertIndex=0; vertIndex<json_vertices_length; ++vertIndex )
                                            {
                                                const float vert = json_object_float( json_array_get( json_vertices, vertIndex ) );
                                                frameSubmodel->vertices[vertIndex] = vert;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                json_t *json_animationFPS = json_object_get( json, "animationFPS" );
                if( json_animationFPS != NULL )
                {
                    animationFPS = json_object_float( json_animationFPS );
                }
                
                json_t *json_animationFPSCompression = json_object_get( json, "animationFPSCompression" );
                if( json_animationFPSCompression != NULL )
                {
                    animationFPSCompression = json_object_int( json_animationFPSCompression );
                }
            }
        }

        json_t *json_models = json_object_get( json, "models" );
        if( json_models != NULL && json_is_array( json_models ) )
        {
            const uint json_models_length = json_array_size( json_models );
            for( uint i=0; i<json_models_length; ++i )
            {
                json_t *json_model = json_array_get( json_models, i );
                json_t *json_model_submeshes = json_object_get( json_model, "submeshes" );
                json_t *json_model_vertices = json_object_get( json_model, "vertices" );
                if( json_model_submeshes != NULL && json_model_vertices != NULL )
                {
                    int submodel_vertexCount = loadSubmodel( json_model );
                    vertexCount += submodel_vertexCount;
                }
            }
        }
        json_decref( json );

        calculateMinMax();
        width = mmX.size();
        height = mmY.size();
        depth = mmZ.size();

        return true;
    }

    return false;
}


void CCJSPrimitiveFBX::loaded()
{
    // Firstly pass in the animation data one by one as they can overflow our javascript buffer
    if( animations != NULL )
    {
        for( int animationIndex=0; animationIndex<animations->length; ++animationIndex )
        {
            Animation &animation = *animations->list[animationIndex];

            script = "CCPrimitive3D.LoadedAnimation(";
            script += primitiveID.buffer;
            script += ",\"";
            script += animation.name.buffer;
            script += "\");";
            CCAppManager::WebJSRunJavaScript( script.buffer, false, false );

            
            for( int frameIndex=0; frameIndex<animation.frames.length; ++frameIndex )
            {
                script = "CCPrimitive3D.LoadedAnimationFrame(";
                script += primitiveID.buffer;
                script += ",[";

                AnimationFrame &animationFrame = *animation.frames.list[frameIndex];
                for( int modelIndex=0; modelIndex<animationFrame.submodels.length; ++modelIndex )
                {
                    if( modelIndex > 0 )
                    {
                        script += ",";
                    }

                    AnimationFrameSubmodel &modelAnimation = *animationFrame.submodels.list[modelIndex];
                    script += "{\"n\":\"";
                    script += modelAnimation.name.buffer;
                    script += "\"}";
                }

                script += "]);";
                CCAppManager::WebJSRunJavaScript( script.buffer, false, false );
            }
        }
    }

    // Then tell our primitive that we've loaded
    script = "CCPrimitive3D.Loaded( ";
    script += primitiveID.buffer;
    script += ", {\n";

    script += "\"fileSize\":";
    script += (int)fileSize;

    script += ",\"vertexCount\":";
    script += (int)vertexCount;

    {
        script += ",\n\"mmXmin\":";
        script += mmX.min;
        script += ",\n\"mmXmax\":";
        script += mmX.max;
    }
    {
        script += ",\n\"mmYmin\":";
        script += mmY.min;
        script += ",\n\"mmYmax\":";
        script += mmY.max;
    }
    {
        script += ",\n\"mmZmin\":";
        script += mmZ.min;
        script += ",\n\"mmZmax\":";
        script += mmZ.max;
    }

    // Animations
    if( animations != NULL )
    {
        if( animationFPS != 1.0f )
        {
            script += ",\n\"animationFPS\":";
            script += animationFPS;
        }

        if( animationFPSCompression != 0 )
        {
            script += ",\n\"animationFPSCompression\":";
            script += animationFPSCompression;
        }
    }

    script += "\n} );";
    CCAppManager::WebJSRunJavaScript( script.buffer, false, false );
}


int CCJSPrimitiveFBX::loadSubmodel(json_t *json)
{
    Submodel *submodel = new Submodel();
    submodels.add( submodel );

    json_object_string( submodel->name, json, "name" );

    json_t *json_submeshes = json_object_get( json, "submeshes" );
    if( json_submeshes != NULL && json_is_array( json_submeshes ) )
    {
        const uint json_submeshes_length = json_array_size( json_submeshes );
        for( uint i=0; i<json_submeshes_length; ++i )
        {
            json_t *json_submesh = json_array_get( json_submeshes, i );
            if( json_submesh != NULL )
            {
                int count = json_object_int( json_submesh, "count" );
                int offsetInBytes = json_object_int( json_submesh, "offset" );
                addSubmesh( count, offsetInBytes/2 );
            }
        }
    }

    json_t *json_vertices = json_object_get( json, "vertices" );
    if( json_vertices != NULL && json_is_array( json_vertices ) )
    {
        const uint json_vertices_length = json_array_size( json_vertices );
        submodel->vertexCount = json_vertices_length / 3;

        submodel->vertices = (float*)malloc( sizeof( float ) * json_vertices_length );
        submodel->skinnedVertices = (float*)malloc( sizeof( float ) * json_vertices_length );
        for( uint i=0; i<json_vertices_length; ++i )
        {
            const float vert = json_object_float( json_array_get( json_vertices, i ) );
            submodel->vertices[i] = vert;
            submodel->skinnedVertices[i] = vert;
        }
    }

    json_t *json_indices = json_object_get( json, "indices" );
    if( json_indices != NULL && json_is_array( json_indices ) )
    {
        const uint json_indices_length = json_array_size( json_indices );

        submodel->indices = (ushort*)malloc( sizeof( ushort ) * json_indices_length );
        for( uint i=0; i<json_indices_length; ++i )
        {
            const ushort index = (ushort)json_integer_value( json_array_get( json_indices, i ) );
            submodel->indices[i] = index;
        }
    }

    json_t *json_uvs = json_object_get( json, "uvs" );
    if( json_uvs != NULL && json_is_array( json_uvs ) )
    {
        const uint json_uvs_length = json_array_size( json_uvs );

        submodel->modelUVs = (float*)malloc( sizeof( float ) * json_uvs_length );
        for( uint i=0; i<json_uvs_length; ++i )
        {
            const float vert = json_object_float( json_array_get( json_uvs, i ) );
            submodel->modelUVs[i] = vert;
        }
    }
    else
    {
        // Create dummy uvs
        submodel->modelUVs = (float*)malloc( sizeof( float ) * submodel->vertexCount * 2 );
        for( int i=0; i<submodel->vertexCount * 2; ++i )
        {
            submodel->modelUVs[i] = 0.0f;
        }
    }

    return submodel->vertexCount;
}


void CCJSPrimitiveFBX::addSubmesh(const int count, const int offset)
{
    Submodel *submodel = submodels.last();

    Submesh *submesh = new Submesh();
    submesh->count = count;
    submesh->offset = offset;

    submodel->submeshes.add( submesh );
}


void CCJSPrimitiveFBX::setTextureHandleIndex(const int index)
{
    super::setTextureHandleIndex( index );
}


void CCJSPrimitiveFBX::adjustTextureUVs()
{
    // We scale the textures to be square on Android
#ifndef ANDROID
    if( textureInfo != NULL )
    {
        const int textureHandleIndex = textureInfo->primaryIndex;
        CCTextureHandle *textureHandle = gEngine->textureManager->getTextureHandle( textureHandleIndex );
        const CCTextureBase *texture = textureHandle->texture;
        CCASSERT( texture != NULL );
        if( texture != NULL )
        {
            const float width = texture->getImageWidth();
            const float height = texture->getImageHeight();
            const float allocatedWidth = texture->getAllocatedWidth();
            const float allocatedHeight = texture->getAllocatedHeight();

            if( width != allocatedWidth || height != allocatedHeight )
            {
                const float xScale = width / allocatedWidth;
                const float yScale = height / allocatedHeight;

                for( int subModelIndex=0; subModelIndex<submodels.length; ++subModelIndex )
                {
                    Submodel &submodel = *submodels.list[subModelIndex];

                    if( submodel.adjustedUVs == NULL )
                    {
                        submodel.adjustedUVs = (float*)malloc( sizeof( float ) * submodel.vertexCount * 2 );
                    }

                    for( int i=0; i<submodel.vertexCount; ++i )
                    {
                        const int uvIndex = i*2;
                        const int x = uvIndex+0;
                        const int y = uvIndex+1;

                        submodel.adjustedUVs[x] = submodel.modelUVs[x] * xScale;
                        submodel.adjustedUVs[y] = submodel.modelUVs[y] * yScale;
                    }
                }

                return;
            }
        }
    }

    // Clear out our adjustedUVs if we haven't processed them above
    for( int subModelIndex=0; subModelIndex<submodels.length; ++subModelIndex )
    {
        Submodel &submodel = *submodels.list[subModelIndex];

        if( submodel.adjustedUVs != NULL )
        {
            free( submodel.adjustedUVs );
            submodel.adjustedUVs = NULL;
        }
    }
#endif
}


void CCJSPrimitiveFBX::render()
{
    super::render();
}


void CCJSPrimitiveFBX::renderVertices(const bool textured)
{
    CCRenderer::CCSetRenderStates( true );

    for( int subModelIndex=0; subModelIndex<submodels.length; ++subModelIndex )
    {
        Submodel &submodel = *submodels.list[subModelIndex];

        if( submodel.adjustedUVs != NULL )
        {
            CCSetTexCoords( submodel.adjustedUVs );
        }
        else if( submodel.modelUVs )
        {
            CCSetTexCoords( submodel.modelUVs );
        }
        GLVertexPointer( 3, GL_FLOAT, 0, submodel.skinnedVertices, submodel.vertexCount );

        if( submodel.indices != NULL )
        {
            for( int i=0; i<submodel.submeshes.length; ++i )
            {
                Submesh &submesh = *submodel.submeshes.list[i];
                gRenderer->GLDrawElements( GL_TRIANGLES, submesh.count, GL_UNSIGNED_SHORT, &submodel.indices[submesh.offset] );
            }
        }
    }
}


void CCJSPrimitiveFBX::copy(const CCJSPrimitiveFBX *primitive)
{
    vertexCount = primitive->vertexCount;
    width = primitive->width;
    height = primitive->height;
    depth = primitive->depth;
    mmX = primitive->mmX;
    mmY = primitive->mmY;
    mmZ = primitive->mmZ;
    cached = true;
    movedToOrigin = primitive->movedToOrigin;
    origin = primitive->origin;

    if( primitive->animations != NULL )
    {
        animations = primitive->animations;
    }

    for( int i=0; i<primitive->submodels.length; ++i )
    {
        Submodel *sourceSubmodel = primitive->submodels.list[i];

        Submodel *submodel = new Submodel();
        submodels.add( submodel );

        submodel->cached = true;
        submodel->name = sourceSubmodel->name.buffer;

        for( int submeshIndex=0; submeshIndex<sourceSubmodel->submeshes.length; ++submeshIndex )
        {
            const Submesh &submesh = *sourceSubmodel->submeshes.list[submeshIndex];
            addSubmesh( submesh.count, submesh.offset );
        }

        submodel->vertexCount = sourceSubmodel->vertexCount;

        submodel->vertices = sourceSubmodel->vertices;
        submodel->indices = sourceSubmodel->indices;
        submodel->modelUVs = sourceSubmodel->modelUVs;

        const int verticesLength = sourceSubmodel->vertexCount * 3;
        submodel->skinnedVertices = (float*)malloc( sizeof( float ) * verticesLength );
        for( int i=0; i<verticesLength; ++i )
        {
            submodel->skinnedVertices[i] = sourceSubmodel->vertices[i];
        }
    }
}


void CCJSPrimitiveFBX::calculateMinMax()
{
    mmX.reset();
    mmY.reset();
    mmZ.reset();

    // Get the size of the model from the first animation frame
    if( animations != NULL && animations->length > 0 )
    {
        Animation &animation = *animations->list[0];
        if( animation.frames.length > 0 )
        {
            AnimationFrame &animationFrame = *animation.frames.list[0];
            if( animationFrame.submodels.length > 0 )
            {
                for( int modelIndex=0; modelIndex<animationFrame.submodels.length; ++modelIndex )
                {
                    AnimationFrameSubmodel &modelAnimation = *animationFrame.submodels.list[modelIndex];

                    float *vertices = modelAnimation.vertices;
                    int vertexCount = 0;

                    // Find vertices info from our submodels
                    for( int subModelIndex=0; subModelIndex<submodels.length; ++subModelIndex )
                    {
                        Submodel &submodel = *submodels.list[subModelIndex];
                        if( CCText::Equals( submodel.name, modelAnimation.name ) )
                        {
                            if( vertices == NULL )
                            {
                                vertices = submodel.vertices;
                            }
                            vertexCount = submodel.vertexCount;
                            break;
                        }
                    }

                    if( vertices != NULL )
                    {
                        for( int vertexIndex=0; vertexIndex<vertexCount; ++vertexIndex )
                        {
                            int index = vertexIndex*3;
                            float x = vertices[index+0];
                            float y = vertices[index+1];
                            float z = vertices[index+2];
                            mmX.consider( x );
                            mmY.consider( y );
                            mmZ.consider( z );
                        }
                    }
                }
                return;
            }
        }
    }

    // No animations use the model vertices
    for( int subModelIndex=0; subModelIndex<submodels.length; ++subModelIndex )
    {
        Submodel &submodel = *submodels.list[subModelIndex];
        for( int i=0; i<submodel.vertexCount; ++i )
        {
            int index = i*3;
            mmX.consider( submodel.vertices[index+0] );
            mmY.consider( submodel.vertices[index+1] );
            mmZ.consider( submodel.vertices[index+2] );
        }
    }
}


void CCJSPrimitiveFBX::moveVerticesToOrigin()
{
    if( movedToOrigin == false )
    {
        const CCVector3 origin = getOrigin();

        if( animations != NULL && animations->length > 0 )
        {
            for( int animationIndex=0; animationIndex<animations->length; ++animationIndex )
            {
                Animation &animation = *animations->list[animationIndex];
                for( int frameIndex=0; frameIndex<animation.frames.length; ++frameIndex )
                {
                    AnimationFrame &animationFrame = *animation.frames.list[frameIndex];
                    if( animationFrame.submodels.length > 0 )
                    {
                        for( int modelIndex=0; modelIndex<animationFrame.submodels.length; ++modelIndex )
                        {
                            AnimationFrameSubmodel &modelAnimation = *animationFrame.submodels.list[modelIndex];
                            if( modelAnimation.vertices != NULL )
                            {
                                // Find vertices from our submodels
                                for( int subModelIndex=0; subModelIndex<submodels.length; ++subModelIndex )
                                {
                                    Submodel &submodel = *submodels.list[subModelIndex];
                                    if( CCText::Equals( submodel.name, modelAnimation.name ) )
                                    {
                                        int vertexCount = submodel.vertexCount;
                                        for( int vertexIndex=0; vertexIndex<vertexCount; ++vertexIndex )
                                        {
                                            int index = vertexIndex*3;
                                            modelAnimation.vertices[index+0] -= origin.x;
                                            modelAnimation.vertices[index+1] -= origin.y;
                                            modelAnimation.vertices[index+2] -= origin.z;
                                        }
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        for( int subModelIndex=0; subModelIndex<submodels.length; ++subModelIndex )
        {
            Submodel &submodel = *submodels.list[subModelIndex];
            for( int i=0; i<submodel.vertexCount; ++i )
            {
                int index = i*3;
                int x = index+0;
                int y = index+1;
                int z = index+2;

                submodel.vertices[x] -= origin[0];
                submodel.vertices[y] -= origin[1];
                submodel.vertices[z] -= origin[2];
                submodel.skinnedVertices[x] -= origin[0];
                submodel.skinnedVertices[y] -= origin[1];
                submodel.skinnedVertices[z] -= origin[2];
            }

            gRenderer->updateVertexPointer( ATTRIB_VERTEX, submodel.skinnedVertices );
        }

        calculateMinMax();
        movedToOrigin = true;
    }
}


void CCJSPrimitiveFBX::movedVerticesToOrigin()
{
    script = "CCPrimitive3D.MovedVerticesToOrigin( ";
    script += primitiveID.buffer;
    script += ", {\n";

    {
        script += "\"mmXmin\":";
        script += mmX.min;
        script += ",\n\"mmXmax\":";
        script += mmX.max;
    }
    {
        script += ",\n\"mmYmin\":";
        script += mmY.min;
        script += ",\n\"mmYmax\":";
        script += mmY.max;
    }
    {
        script += ",\n\"mmZmin\":";
        script += mmZ.min;
        script += ",\n\"mmZmax\":";
        script += mmZ.max;
    }

    script += "\n} );";
    CCAppManager::WebJSRunJavaScript( script.buffer, false, false );
}


void CCJSPrimitiveFBX::interpolateFrames(const int currentAnimationIndex, const int currentFrameIndex, const int nextAnimationIndex, const int nextFrameIndex, const float frameDelta)
{
    for( int subModelIndex=0; subModelIndex<submodels.length; ++subModelIndex )
    {
        if( animations != NULL && animations->length > currentAnimationIndex && animations->length > nextAnimationIndex )
        {
            const Animation &currentAnimation = *animations->list[currentAnimationIndex];
            const Animation &nextAnimation = *animations->list[nextAnimationIndex];
            if( currentAnimation.frames.length > currentFrameIndex && nextAnimation.frames.length > nextFrameIndex )
            {
                const AnimationFrame &currentFrame = *currentAnimation.frames.list[currentFrameIndex];
                const AnimationFrame &nextFrame = *nextAnimation.frames.list[nextFrameIndex];

                const Submodel &submodel = *submodels.list[subModelIndex];

                const float *currentFrameVertices = getSubmodelAnimationFrameVertices( submodel.name.buffer, currentFrame );
                const float *nextFrameVertices = getSubmodelAnimationFrameVertices( submodel.name.buffer, nextFrame );

                if( currentFrameVertices != NULL && nextFrameVertices != NULL )
                {
                    const float inverseDelta = 1.0 - frameDelta;

                    float *skinnedVertices = submodel.skinnedVertices;
                    int verticesLength = submodel.vertexCount * 3;
                    for( int vertIndex=0; vertIndex<verticesLength; ++vertIndex )
                    {
                        float interpolatedVert = currentFrameVertices[vertIndex] * inverseDelta + nextFrameVertices[vertIndex] * frameDelta;
                        skinnedVertices[vertIndex] = interpolatedVert;
                    }

                    gRenderer->updateVertexPointer( ATTRIB_VERTEX, skinnedVertices );
                }
            }
        }
    }
}


float* CCJSPrimitiveFBX::getSubmodelAnimationFrameVertices(const char *submodelName, const AnimationFrame &frame)
{
    for( int modelIndex=0; modelIndex<frame.submodels.length; ++modelIndex )
    {
        const AnimationFrameSubmodel &frameSubmodel = *frame.submodels.list[modelIndex];
        if( CCText::Equals( frameSubmodel.name, submodelName ) )
        {
            return frameSubmodel.vertices;
        }
    }
    return NULL;
};
