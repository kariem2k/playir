/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCJSEngine.cpp
 *-----------------------------------------------------------
 */

#include "CCDefines.h"
#include "CCJS.h"
#include "CCAppManager.h"
#include "CCFileManager.h"


static bool clearedScreen = false;
static CCMatrix matrix;
static CCList<char> arrayParameters;


CCJSEngine::CCJSEngine()
{
	webViewOpened = false;
    backButtonEnabled = false;

    numberOfCppToJSCommands = 0;

    currentVertexIndexBuffer = NULL;

	CCCameraBase::CurrentCamera = NULL;
}


void CCJSEngine::startup()
{
    jsUpdateRunning = true;
	jsUpdateTime = gEngine->time.lifetime;

    CCText script;
    script = "nativeStart();";
    CCAppManager::WebJSRunJavaScript( script.buffer, true, true );

    if( CCAppManager::GetOrientation().current != 0.0f || CCAppManager::GetOrientation().target != 0.0f )
    {
		script = "gEngine.updateOrientation( ";
		script += CCAppManager::GetOrientation().current;
		script += ", ";
		script += CCAppManager::GetOrientation().target;
		script += " );";
		CCAppManager::WebJSRunJavaScript( script.buffer, false, true );
    }

    touchSetMovementThreashold();
}


CCJSEngine::~CCJSEngine()
{
	if( webViewOpened )
	{
		webViewOpened = false;
		CCAppManager::WebViewClose();
	}

    pendingCppToJSCommands.deleteObjects();

    images.deleteObjects();

    while( jsScenes.length > 0 )
    {
        deleteScene( jsScenes.pop() );
    }
    CCASSERT( jsCameras.length == 0 );

    while( jsCollideables.length > 0 )
    {
        deleteCollideable( jsCollideables.pop() );
    }

    while( jsTexts.length > 0 )
    {
        deleteText( jsTexts.pop() );
    }

    while( jsObjects.length > 0 )
    {
        deleteObject( jsObjects.pop() );
    }

    while( jsModels.length > 0 )
    {
        deleteModel( jsModels.pop() );
    }
    CCASSERT( jsRenderables.length == 0 )

    while( jsPrimitiveFBXs.length > 0 )
    {
        deletePrimitiveFBX( jsPrimitiveFBXs.pop() );
    }

    while( jsPrimitiveOBJs.length > 0 )
    {
        deletePrimitiveObj( jsPrimitiveOBJs.pop() );
    }

    while( jsPrimitiveSquares.length > 0 )
    {
        deletePrimitiveSquare( jsPrimitiveSquares.pop() );
    }
    CCASSERT( jsPrimitives.length == 0 );

    vertexBufferFloats.deleteObjects();
    vertexBufferUInts.deleteObjects();
}


void CCJSEngine::runJSUpdate()
{
    if( CCAppManager::WebJSIsLoaded() )
    {
        if( jsUpdateRunning == false && jsToCppCommands.length == 0 )
        {
            jsUpdateRunning = true;
			const float delta = gEngine->time.lifetime - jsUpdateTime;
            //CCASSERT( delta > 0.0f );
			jsUpdateTime = gEngine->time.lifetime;

            static CCText script;
            if( numberOfCppToJSCommands > 0 )
            {
                int currentCommandIndex = 0;
				while( currentCommandIndex<numberOfCppToJSCommands )
                {
                    script = "nativeProcessCommands( [ ";
                    for( int i=currentCommandIndex; i<numberOfCppToJSCommands && i<currentCommandIndex+5; ++i )
                    {
                        if( i > currentCommandIndex )
                        {
                            script += ", ";
                        }
                        script += pendingCppToJSCommands.list[i]->buffer;
                    }
                    script += " ] );";
                    //DEBUGLOG( "%s", "nativeProcessCommands\n%s", script.buffer );
                    CCAppManager::WebJSRunJavaScript( script.buffer, false, false );

                    currentCommandIndex += 5;
                }

				numberOfCppToJSCommands = 0;
            }

            script = "nativeUpdate( ";
            script += delta;
            script += " );";
            CCAppManager::WebJSRunJavaScript( script.buffer, true, false );
        }
    }
}


void CCJSEngine::runNativeUpdate()
{
#if defined PROFILEON
    CCProfiler profile( "CCJSEngine::runNativeUpdate()" );
#endif

    //DEBUGLOG( "%s", "CCJSEngine::runNativeUpdate" );

    if( jsToCppCommands.length > 0 )
    {
        static CCList<char> commands;
        commands.clear();

        static CCText syncCommands, updateCommands, renderCommands;

        // First process our js update commands
        {
            CCNativeThreadLock();

            jsToCppCommands.split( commands, "\r\n" );
			syncCommands.length = 0;
			updateCommands.length = 0;
			renderCommands.length = 0;
			if( commands.length > 0 )
			{
				syncCommands = commands.list[0];
				if( commands.length > 1 )
				{
					updateCommands = commands.list[1];
					if( commands.length > 2 )
					{
						renderCommands = commands.list[2];
					}
				}
			}
            jsToCppCommands.length = 0;

            processSyncCommands( syncCommands );

            CCNativeThreadUnlock();
        }

        // Trigger our js update to include results from our update pass for the rendering update of our current frame
        runJSUpdate();

        // Meanwhile run the update and rendering of our current frame
        {
#ifdef DEBUGON
            if( CCText::Contains( updateCommands.buffer, "WebView" ) )
            {
                DEBUGLOG( "updateCommands\n%s\n", updateCommands.buffer );
            }
#endif
            processUpdateCommands( updateCommands );
        }

        {
#ifdef ANDROID
            // Only process new render commands as Android re-renders the screen continuously
            if( renderCommands.length > 0 )
#endif
            {
            	renderCommandsListBuffer = renderCommands;
    			renderCommandsList.clear();
    			renderCommandsListBuffer.split( renderCommandsList, "\n" );
            }

            //DEBUGLOG( "CCJSEngine::runNativeUpdate CCJSEngine::processRenderCommands" );

			clearedScreen = false;
			processRenderCommands( renderCommandsList );
			if( clearedScreen )
			{
				gRenderer->resolve();
			}
        }
    }
    else
    {
#ifdef ANDROID
        // Android re-renders the screen continuously
		clearedScreen = false;
        processRenderCommands( renderCommandsList );
		if( clearedScreen )
		{
			gRenderer->resolve();
		}
#endif

        runJSUpdate();
    }
}


void CCJSEngine::resized()
{
    static CCText script;

    const float frameBufferWidth = gRenderer->frameBufferManager.getWidth( -1 );
    const float frameBufferHeight = gRenderer->frameBufferManager.getHeight( -1 );
    script = "gRenderer.setSize( ";
    script += frameBufferWidth;
    script += ",";
    script += frameBufferHeight;
    script += ");";
    CCAppManager::WebJSRunJavaScript( script.buffer, false, false );


    script = "gEngine.updateOrientation( ";
    script += CCAppManager::GetOrientation().current;
    script += ", ";
    script += CCAppManager::GetOrientation().target;
    script += " );";
    CCAppManager::WebJSRunJavaScript( script.buffer, false, false );
}


void CCJSEngine::pause()
{
#ifndef ANDROID
    CCAppManager::WebJSRunJavaScript( "CCEngine.Pause();", false, true );
#endif
}


void CCJSEngine::resume()
{
#ifndef ANDROID
    CCAppManager::WebJSRunJavaScript( "CCEngine.Resume();", false, true );
#endif
}


void CCJSEngine::touchBegin(const int index, const float x, const float y)
{
    static CCText jsCommand;
    if( index < 2 )
    {
        jsCommand = "{ \"id\":\"gEngine.controls.touchBegin\", \"index\":";
        jsCommand += index;
        jsCommand += ", \"x\":";
        jsCommand += x;
        jsCommand += ", \"y\":";
        jsCommand += y;
        jsCommand += " }";
        addCppToJSCommand( jsCommand.buffer );
    }
}


void CCJSEngine::touchMove(const int index, const float x, const float y)
{
    static CCText jsCommand;
    if( index < 2 )
    {
        jsCommand = "{ \"id\":\"gEngine.controls.touchMove\", \"index\":";
        jsCommand += index;
        jsCommand += ", \"x\":";
        jsCommand += x;
        jsCommand += ", \"y\":";
        jsCommand += y;
        jsCommand += " }";
        addCppToJSCommand( jsCommand.buffer );
    }
}


void CCJSEngine::touchEnd(const int index)
{
    static CCText jsCommand;
    if( index < 2 )
    {
        jsCommand = "{ \"id\":\"gEngine.controls.touchEnd\", \"index\":";
        jsCommand += index;
        jsCommand += " }";
        addCppToJSCommand( jsCommand.buffer );
    }
}


void CCJSEngine::touchSetMovementThreashold()
{
    const CCPoint &TouchMovementThreashold = CCControls::GetTouchMovementThreashold();
    static CCText script;
    script = "CCControls.TouchSetMovementThreashold( ";
    script += TouchMovementThreashold.x;
    script += ", ";
    script += TouchMovementThreashold.y;
    script += " );";

    CCAppManager::WebJSRunJavaScript( script.buffer, false, false );
}


bool CCJSEngine::shouldHandleBackButton()
{
    if( backButtonEnabled )
    {
        return true;
    }
    return false;
}


void CCJSEngine::handleBackButton()
{
	addCppToJSCommand( "{ \"id\":\"gEngine.handleBackButton\" }" );
}


void CCJSEngine::keyboardUpdate(const char *key)
{
    static CCText script;
    script = "gEngine.controls.keyboardInput( \"";
    if( CCText::Equals( key, "\"" ) )
    {
    	key = "\\\"";
    }
    script += key;
    script += "\" );";
    CCAppManager::WebJSRunJavaScript( script.buffer, false, false );
}


void CCJSEngine::webViewUpdate(const char *url)
{
    static CCText script;
    script = "CCEngine.WebViewProcessURL( \"";
    script += url;
    script += "\", ";
    script += CCAppManager::WebViewIsLoaded() ? "true" : "false";
    script += " );";

#ifdef DEBUGON
    if( !CCAppManager::WebViewIsLoaded() )
    {
        CCAppManager::WebViewIsLoaded();
        DEBUGLOG( "CCJSEngine::WebViewUpdate %s\n", script.buffer );
    }
#endif

    CCAppManager::WebJSRunJavaScript( script.buffer, false, false );
}


void CCJSEngine::addCppToJSCommand(const char *command)
{
    numberOfCppToJSCommands++;
    if( pendingCppToJSCommands.length <= numberOfCppToJSCommands )
    {
        pendingCppToJSCommands.add( new CCText() );
    }

    *pendingCppToJSCommands.list[numberOfCppToJSCommands-1] = command;
}


bool CCJSEngine::CCBindVertexTextureBuffer(const int vertexBufferID)
{
    for( int i=0; i<vertexBufferFloats.length; ++i )
    {
        VertexBufferFloat *vertexBufferFloat = vertexBufferFloats.list[i];
        if( vertexBufferFloat->id == vertexBufferID )
        {
            CCSetTexCoords( vertexBufferFloat->buffer );
            return true;
        }
    }
    CCASSERT( false );
    return false;
}


bool CCJSEngine::CCBindVertexPositionBuffer(const int vertexBufferID)
{
    for( int i=0; i<vertexBufferFloats.length; ++i )
    {
        VertexBufferFloat *vertexBufferFloat = vertexBufferFloats.list[i];
        if( vertexBufferFloat->id == vertexBufferID )
        {
            GLVertexPointer( 3, GL_FLOAT, 0, vertexBufferFloat->buffer, vertexBufferFloat->size/3 );
            return true;
        }
    }
    CCASSERT( false );
    return false;
}


bool CCJSEngine::CCBindVertexIndexBuffer(const int vertexBufferID)
{
    for( int i=0; i<vertexBufferUInts.length; ++i )
    {
        VertexBufferUInt *vertexBufferUInt = vertexBufferUInts.list[i];
        if( vertexBufferUInt->id == vertexBufferID )
        {
            currentVertexIndexBuffer = vertexBufferUInt;
            return true;
        }
    }
    CCASSERT( false );
    return false;
}


float* CCJSEngine::getVertexFloatBuffer(const int vertexBufferID)
{
    for( int i=0; i<vertexBufferFloats.length; ++i )
    {
        VertexBufferFloat *vertexBufferFloat = vertexBufferFloats.list[i];
        if( vertexBufferFloat->id == vertexBufferID )
        {
            return vertexBufferFloat->buffer;
        }
    }
    CCASSERT( false );
    return NULL;
}


ushort* CCJSEngine::getVertexUIntBuffer(const int vertexBufferID)
{
    for( int i=0; i<vertexBufferUInts.length; ++i )
    {
        VertexBufferUInt *vertexBufferUInt = vertexBufferUInts.list[i];
        if( vertexBufferUInt->id == vertexBufferID )
        {
            return vertexBufferUInt->buffer;
        }
    }
    CCASSERT( false );
    return NULL;
}


void CCJSEngine::updateVertexBufferPointer(const int vertexBufferID, float *buffer, const bool assertOnFail)
{
    VertexBufferFloat *vertexBufferFloat = NULL;
    for( int i=0; i<vertexBufferFloats.length; ++i )
    {
        if( vertexBufferFloats.list[i]->id == vertexBufferID )
        {
            vertexBufferFloat = vertexBufferFloats.list[i];
            break;
        }
    }

    if( assertOnFail )
    {
        CCASSERT( vertexBufferFloat != NULL );
    }

    if( vertexBufferFloat != NULL )
    {
        if( vertexBufferFloat->buffer != NULL )
        {
            gRenderer->derefVertexPointer( ATTRIB_VERTEX, vertexBufferFloat->buffer );
        }
        vertexBufferFloat->buffer = buffer;
    }
}


void CCJSEngine::deleteVertexBufferPointer(const int vertexBufferID, const bool assertOnFail)
{
    bool found = false;
    for( int i=0; i<vertexBufferFloats.length; ++i )
    {
        VertexBufferFloat *vertexBufferFloat = vertexBufferFloats.list[i];
        if( vertexBufferFloat->id == vertexBufferID )
        {
            found = true;
            vertexBufferFloats.remove( vertexBufferFloat );
            delete vertexBufferFloat;
            break;
        }
    }

    if( found == false )
    {
        for( int i=0; i<vertexBufferUInts.length; ++i )
        {
            VertexBufferUInt *vertexBufferUInt = vertexBufferUInts.list[i];
            if( vertexBufferUInt->id == vertexBufferID )
            {
                found = true;
                vertexBufferUInts.remove( vertexBufferUInt );
                delete vertexBufferUInt;
                break;
            }
        }
    }

    if( assertOnFail )
    {
        CCASSERT( found );
    }
}


void CCJSEngine::referenceImage(const int jsIndex, const char *filename, const bool mipmap)
{
    Image *image = new Image();
    images.add( image );
    image->jsIndex = jsIndex;
    image->mipmap = mipmap;

    image->handleIndex = gEngine->textureManager->assignTextureIndex( filename, Resource_Packaged, mipmap, false, true );

    image->file = filename;

    CCTextureHandle *handle = gEngine->textureManager->getTextureHandle( image->handleIndex );
    if( handle->texture != NULL )
    {
        loadedImage( image, handle->texture );
    }
}


void CCJSEngine::downloadImage(const int jsIndex, const char *url, const bool mipmap)
{
    Image *image = new Image();
    images.add( image );
    image->jsIndex = jsIndex;
    image->mipmap = mipmap;

    image->handleIndex = 0;

    CCText filename = url;
    filename.stripDirectory();
    if( CCText::Contains( filename.buffer, "=" ) )
    {
        filename.splitAfter( filename, "=" );
    }
    filename.splitBefore( filename, "&" );
    if( CCText::Contains( url, "facebook.php?" ) )
    {
    	filename += ".jpg";
        image->file = "fb.";
        image->file += filename.buffer;
    }
    else
    {
        image->file = filename.buffer;
    }

    CCResourceType resourceType = CCFileManager::FindFile( image->file.buffer );
    if( resourceType != Resource_Unknown )
    {
        downloadedImage( image, resourceType, true );
    }
    else
    {
        DEBUGLOG( "CCJSEngine::downloadImage %s\n", image->file.buffer );
        CCText downloadURL = url;
#ifdef _PLAYIR_DEBUG_JS
        if( CCText::Contains( downloadURL.buffer, "http://playir.com/" ) )
        {
            if( !CCText::Contains( downloadURL.buffer, "backend/helper.php?" ) )
            {
                downloadURL.replaceChars( "http://playir.com/", _PLAYIR_SERVER_URL );
            }
        }
#endif

        CCLAMBDA_2( DownloadedCallback, CCJSEngine, engine, Image*, image,
        {
            const bool success = (bool)runParameters;
            engine->downloadedImage( image, Resource_Cached, success );
        });
        CCJSEngine::GetAsset( image->file.buffer, downloadURL.buffer, new DownloadedCallback( this, image ) );
    }
}


void CCJSEngine::downloadedImage(Image *image, const CCResourceType resourceType, const bool success)
{
    if( CCAppManager::WebJSIsLoaded() )
    {
        if( success )
        {
            image->handleIndex = gEngine->textureManager->assignTextureIndex( image->file.buffer, resourceType, image->mipmap, false, false );
            CCLAMBDA_2( OnLoadCallback, CCJSEngine, engine, Image*, image,
            {
                const CCTextureBase *texture = (CCTextureBase*)runParameters;
                engine->loadedImage( image, texture );
            });
            gEngine->textureManager->getTextureAsync( image->handleIndex, new OnLoadCallback( this, image ) );
        }
        else
        {
            loadedImage( image, NULL );
        }
    }
}


void CCJSEngine::loadedImage(Image *image, const CCTextureBase *texture)
{
    static CCText script;

    if( texture != NULL )
    {
        image->width = texture->getRawWidth();
        image->height = texture->getRawHeight();
        image->allocatedWidth = texture->getAllocatedWidth();
        image->allocatedHeight = texture->getAllocatedHeight();

        script = "if( window.CCTextureManager ) { CCTextureManager.DownloadedImage( ";
        script += image->jsIndex;
        script += ", ";
        script += image->width;
        script += ", ";
        script += image->height;
#ifndef ANDROID
        script += ", ";
        script += image->allocatedWidth;
        script += ", ";
        script += image->allocatedHeight;
#endif
        script += " ); }";

		if( CCAppManager::WebJSIsLoaded() )
		{
			CCAppManager::WebJSRunJavaScript( script.buffer, false, false );
		}

#ifdef DEBUGON
		script += "\n";
		DEBUGLOG( "%s", script.buffer );
#endif
    }
	else
	{
        script = "if( window.CCTextureManager ) { CCTextureManager.DownloadedImage( ";
        script += image->jsIndex;
        script += " ); }";

		if( CCAppManager::WebJSIsLoaded() )
		{
			CCAppManager::WebJSRunJavaScript( script.buffer, false, false );
		}

        //CCASSERT( false );
	}
}


void CCJSEngine::loadedReferencedImage(const char *file, const CCTextureBase *texture)
{
    for( int i=0; i<images.length; ++i )
    {
        Image *image = images.list[i];
        if( CCText::Equals( image->file, file ) )
        {
            loadedImage( image, texture );
            break;
        }
    }
}


void CCJSEngine::load3DPrimitive(const char *primitiveID, const char *url, const char *filename)
{
    class CCDownloadedCallback : public CCURLCallback
    {
    public:
        CCDownloadedCallback(CCJSEngine *engine, const char *primitiveID)
        {
            this->engine = engine;
            this->lazyPointer = engine->lazyPointer;
            this->lazyID = engine->lazyID;

            this->primitiveID = primitiveID;
        }

        void run()
        {
            if( CCAppManager::WebJSIsLoaded() )
            {
                if( CCActiveAllocation::IsCallbackActive( lazyPointer, lazyID ) )
                {
                    engine->downloaded3DPrimitive( primitiveID.buffer, reply );
                }
            }
        }

    private:
        CCJSEngine *engine;
        void *lazyPointer;
        long lazyID;

        CCText primitiveID;
    };

    CCText downloadURL = url;
#ifdef _PLAYIR_DEBUG_JS
    if( CCText::Contains( downloadURL.buffer, "http://playir.com/" ) )
    {
        if( !CCText::Contains( downloadURL.buffer, "backend/helper.php?" ) )
        {
            downloadURL.replaceChars( "http://playir.com/", _PLAYIR_SERVER_URL );
        }
    }
#endif
    gEngine->urlManager->requestURLAndCacheAfterTimeout( downloadURL.buffer,
                                                         new CCDownloadedCallback( this, primitiveID ),
                                                         0,
                                                         filename, -1,
                                                         0.0f );
}


void CCJSEngine::downloaded3DPrimitive(const char *primitiveID, CCURLRequest *reply)
{
    if( reply->state >= CCURLRequest::succeeded )
    {
        CCPrimitive3D *primitive = (CCPrimitive3D*)getJSPrimitive( primitiveID );
        CCASSERT( primitive != NULL )
        if( primitive != NULL )
        {
            if( reply->cacheFile.length > 0 )
            {
                primitive->setFilename( reply->cacheFile.buffer );
            }
            primitive->loadDataAsync( reply->data.buffer );
            return;
        }
    }

    // Failed to load data
    {
        static CCText script;
        script = "CCPrimitive3D.Loaded( ";
        script += primitiveID;
        script += " );";
        CCAppManager::WebJSRunJavaScript( script.buffer, false, false );
    }
}


void CCJSEngine::downloadURL(Download *download, const int priority)
{
#ifdef _PLAYIR_DEBUG_JS
    if( CCText::Contains( download->url.buffer, "http://playir.com/" ) )
    {
        if( !CCText::Contains( download->url.buffer, "backend/helper.php?" ) )
        {
            download->url.replaceChars( "http://playir.com/", _PLAYIR_SERVER_URL );
        }
    }
#endif

    class CCDownloadedCallback : public CCURLCallback
    {
    public:
        CCDownloadedCallback(CCJSEngine *engine, Download *download)
        {
            this->engine = engine;
            this->lazyPointer = engine->lazyPointer;
            this->lazyID = engine->lazyID;

            this->download = download;
        }

        virtual ~CCDownloadedCallback()
        {
            delete download;
        }

        void run()
        {
            if( CCActiveAllocation::IsCallbackActive( lazyPointer, lazyID ) )
            {
                engine->downloadedURL( download, reply );
            }
        }

    private:
        CCJSEngine *engine;
        void *lazyPointer;
        long lazyID;

        Download *download;
    };

    if( download->postData.length() > 0 )
    {
        gEngine->urlManager->requestPostURL( download->url.buffer, download->postData,
                                             new CCDownloadedCallback( this, download ) );
    }
    else
    {
        gEngine->urlManager->requestURLAndCacheAfterTimeout( download->url.buffer,
                                                             new CCDownloadedCallback( this, download ),
                                                             priority,
                                                             download->cacheFile.buffer,
                                                             download->cacheFileTimeoutSeconds,
                                                             download->timeout );
    }
}


void CCJSEngine::downloadedURL(Download *download, CCURLRequest *reply)
{
    if( CCAppManager::WebJSIsLoaded() )
    {
        static CCText safeData;
        safeData.clear();

        if( download->returnBinary && reply->cacheFile.length > 0 )
        {
            //safeData = reply->cacheFile;
            CCResourceType resourceType = CCFileManager::FindFile( reply->cacheFile.buffer );
            if( resourceType != Resource_Unknown )
            {
#ifdef WP8
				// Windows phone web view's can access files from isolated storage only
				if( resourceType == Resource_Packaged )
				{
					CCData data;
					CCFileManager::GetFile( reply->cacheFile.buffer, data, Resource_Packaged );
					CCFileManager::SaveCachedFile( reply->cacheFile.buffer, data.buffer, data.length );
				}
				csActionStack.add( new CSAction( "CCFileManager::syncToIsoStore, ", reply->cacheFile.buffer ) );
#ifdef DEBUGON
                CCText debug = "CCFileManager::syncToIsoStore ";
                debug += reply->cacheFile.buffer;
                debug += " ";
                debug += gEngine->time.lifetime;
                debug += "\n";
                DEBUGLOG( "%s", debug.buffer );
#endif
#endif
                CCFileManager::GetFilePath( safeData, reply->cacheFile.buffer, resourceType );
                safeData.encodeForWeb();
            }
#ifdef DEBUGON
			CCText debug = "CCJSEngine::downloadedURL ";
			debug += safeData.buffer;
			debug += "\n";
			DEBUGLOG( "%s", debug.buffer );
#endif
        }
        else
        {
            safeData = reply->data.buffer;
        }

        safeData.encodeForWeb();


#ifdef DEBUGON
        CCText debug = "CCJSEngine::downloadedURL ";
        debug += download->url.buffer;
        debug += "\n";
        DEBUGLOG( "%s", debug.buffer );
#endif

        static CCText script;
        script = "gURLManager.downloaded( ";
        script += download->id.buffer;
        script += ", ";
        script += reply->state;
        script += ", \'";
        script += safeData.buffer;
        script += "\' );";
        CCAppManager::WebJSRunJavaScript( script.buffer, false, false );
    }
}


void CCJSEngine::registerNextFrameCommands(const char *commands)
{
    CCASSERT( jsToCppCommands.length == 0 );
    jsToCppCommands = commands;

    CCASSERT( jsUpdateRunning );
    jsUpdateRunning = false;
}


void CCJSEngine::processSyncCommands(CCText &jsCommands)
{
    static CCList<char> commands;
    commands.clear();

    static CCList<char> parameters;
    jsCommands.split( commands, "\n" );

    static CCText commandString;
    for( int i=0; i<commands.length-1; ++i )
    {
        commandString = commands.list[i];
        parameters.clear();
        commandString.split( parameters, ";" );

        const char *command = parameters.list[0];

        if( CCText::Equals( command, "CCCameraBase.update" ) )
        {
            //CCASSERT( parameters.length == 4 );
            if( parameters.length == 4 )
            {
                const char *cameraID = parameters.list[1];

                CCJSCamera *camera = getJSCamera( cameraID, false );
                if( camera != NULL )
                {
                    CCVector3 rotatedPosition, lookAt;
                    {
                        arrayParameters.clear();
                        CCText arrayString = parameters.list[2];
                        arrayString.split( arrayParameters, "," );
                        CCASSERT( arrayParameters.length == 3 );
                        if( arrayParameters.length == 3 )
                        {
                            rotatedPosition.x = (float)atof( arrayParameters.list[0] );
                            rotatedPosition.y = (float)atof( arrayParameters.list[1] );
                            rotatedPosition.z = (float)atof( arrayParameters.list[2] );
                        }
                    }
                    {
                        arrayParameters.clear();
                        CCText arrayString = parameters.list[3];
                        arrayString.split( arrayParameters, "," );
                        CCASSERT( arrayParameters.length == 3 );
                        if( arrayParameters.length == 3 )
                        {
                            lookAt.x = (float)atof( arrayParameters.list[0] );
                            lookAt.y = (float)atof( arrayParameters.list[1] );
                            lookAt.z = (float)atof( arrayParameters.list[2] );
                        }
                    }

                    camera->update( rotatedPosition, lookAt );
                }
            }
        }

        else if( CCText::Equals( command, "CC.MovementCollisionCheckAsync" ) )
        {
            CCASSERT( parameters.length == 5 );
            if( parameters.length == 5 )
            {
                const char *id = parameters.list[1];
                const long jsID = atol( parameters.list[2] );

                CCJSCollideable *collideable = getJSCollideable( jsID );
                if( collideable != NULL )
                {
                    CCVector3 startPosition, targetPosition;
                    {
                        arrayParameters.clear();
                        CCText arrayString = parameters.list[3];
                        arrayString.split( arrayParameters, "," );
                        CCASSERT( arrayParameters.length == 3 );
                        if( arrayParameters.length == 3 )
                        {
                            startPosition.x = (float)atof( arrayParameters.list[0] );
                            startPosition.y = (float)atof( arrayParameters.list[1] );
                            startPosition.z = (float)atof( arrayParameters.list[2] );
                        }
                    }
                    {
                        arrayParameters.clear();
                        CCText arrayString = parameters.list[4];
                        arrayString.split( arrayParameters, "," );
                        CCASSERT( arrayParameters.length == 3 );
                        if( arrayParameters.length == 3 )
                        {
                            targetPosition.x = (float)atof( arrayParameters.list[0] );
                            targetPosition.y = (float)atof( arrayParameters.list[1] );
                            targetPosition.z = (float)atof( arrayParameters.list[2] );
                        }
                    }

                    static CCList<CCCollideable> collisions;
                    collisions.clear();
                    CCOctreeMovementCollisionCheckAsync( collideable, startPosition, targetPosition, collisions );

                    static CCText jsCommand;
                    jsCommand = "{ \"id\":\"CC.MovementCollisionCheckResult\", \"collisionRequestID\":";
                    jsCommand += id;

                    jsCommand += ", \"collisions\":[";
                    for( int i=0; i<collisions.length; ++i )
                    {
                        CCCollideable *collideable = collisions.list[i];
                        if( i > 0 )
                        {
                            jsCommand += ",";
                        }
                        jsCommand += collideable->getJSID();
                    }
                    jsCommand += "] }";

                    this->addCppToJSCommand( jsCommand.buffer );
                }
            }
        }

        else if( CCText::Equals( command, "CCCollideable.construct" ) )
        {
            CCASSERT( parameters.length == 2 );
            if( parameters.length == 2 )
            {
                const long jsID = atol( parameters.list[1] );

                CCJSCollideable *collideable = new CCJSCollideable( jsID );
                jsCollideables.add( collideable );
                jsObjects.add( collideable );
                jsRenderables.add( collideable );
            }
        }

        else if( CCText::Equals( command, "CCEngine.NewScene" ) )
        {
            CCASSERT( parameters.length == 2 );
            if( parameters.length == 2 )
            {
                const char *sceneID = parameters.list[1];

                CCJSScene *scene = new CCJSScene( sceneID );
                jsScenes.add( scene );
            }
        }

        else if( CCText::Equals( command, "CCEngine.newSceneCamera" ) )
        {
            CCASSERT( parameters.length == 3 );
            if( parameters.length == 3 )
            {
                const char *sceneID = parameters.list[1];

                CCJSScene *scene = getJSScene( sceneID );
                if( scene != NULL )
                {
                    const char *cameraID = parameters.list[2];
                    CCJSCamera *camera = new CCJSCamera( this, cameraID );
                    scene->setCamera( camera );

#ifdef DEBUGON
					CCText debug = "CCEngine.newSceneCamera ";
					debug += cameraID;
					debug += "\n";
					DEBUGLOG( "%s", debug.buffer );
#endif

                    jsCameras.add( camera );
                }
            }
        }

        else
        {
            CCASSERT( false );
        }
    }
}


void CCJSEngine::processUpdateCommands(CCText &jsCommands)
{
    static CCList<char> commands;
    commands.clear();

    static CCList<char> parameters;
    jsCommands.split( commands, "\n" );

    static CCText commandString;
    for( int i=0; i<commands.length-1; ++i )
    {
        commandString = commands.list[i];
        parameters.clear();
        commandString.split( parameters, ";" );

        const char *command = parameters.list[0];

        // CCRenderable
        if( CCText::Contains( command, "CCRenderable." ) )
        {
            if( CCText::Equals( command, "CCRenderable.setPositionXYZ" ) )
            {
                CCASSERT( parameters.length == 5 );
                if( parameters.length == 5 )
                {
                    const long jsID = atol( parameters.list[1] );

                    CCRenderable *renderable = getJSRenderable( jsID, false );
                    if( renderable != NULL )
                    {
                        const float x = (float)atof( parameters.list[2] );
                        const float y = (float)atof( parameters.list[3] );
                        const float z = (float)atof( parameters.list[4] );

                        renderable->setPositionXYZ( x, y, z );
                    }
                }
            }

            else if( CCText::Equals( command, "CCRenderable.setRotationXYZ" ) )
            {
                CCASSERT( parameters.length == 5 );
                if( parameters.length == 5 )
                {
                    const long jsID = atol( parameters.list[1] );

                    CCRenderable *renderable = getJSRenderable( jsID, false );
                    if( renderable != NULL )
                    {
                        const float x = (float)atof( parameters.list[2] );
                        const float y = (float)atof( parameters.list[3] );
                        const float z = (float)atof( parameters.list[4] );

                        renderable->setRotation( CCVector3( x, y, z ) );
                    }
                }
            }

            else if( CCText::Equals( command, "CCRenderable.setScale" ) )
            {
                CCASSERT( parameters.length == 5 );
                if( parameters.length == 5 )
                {
                    const long jsID = atol( parameters.list[1] );

                    CCRenderable *renderable = getJSRenderable( jsID, false );
                    if( renderable != NULL )
                    {
                        const float x = (float)atof( parameters.list[2] );
                        const float y = (float)atof( parameters.list[3] );
                        const float z = (float)atof( parameters.list[4] );
                        renderable->setScale( x, y, z );
                    }
                }
            }
        }

        else if( CCText::Equals( command, "CC.MovementCollisionCheckAsync" ) )
        {
            CCASSERT( parameters.length == 5 );
            if( parameters.length == 5 )
            {
                const char *id = parameters.list[1];
                const long jsID = atol( parameters.list[2] );

                CCJSCollideable *collideable = getJSCollideable( jsID );
                if( collideable != NULL )
                {
                    CCVector3 startPosition, targetPosition;
                    {
                        arrayParameters.clear();
                        CCText arrayString = parameters.list[3];
                        arrayString.split( arrayParameters, "," );
                        CCASSERT( arrayParameters.length == 3 );
                        if( arrayParameters.length == 3 )
                        {
                            startPosition.x = (float)atof( arrayParameters.list[0] );
                            startPosition.y = (float)atof( arrayParameters.list[1] );
                            startPosition.z = (float)atof( arrayParameters.list[2] );
                        }
                    }
                    {
                        arrayParameters.clear();
                        CCText arrayString = parameters.list[4];
                        arrayString.split( arrayParameters, "," );
                        CCASSERT( arrayParameters.length == 3 );
                        if( arrayParameters.length == 3 )
                        {
                            targetPosition.x = (float)atof( arrayParameters.list[0] );
                            targetPosition.y = (float)atof( arrayParameters.list[1] );
                            targetPosition.z = (float)atof( arrayParameters.list[2] );
                        }
                    }

                    static CCList<CCCollideable> collisions;
                    collisions.clear();
                    CCOctreeMovementCollisionCheckAsync( collideable, startPosition, targetPosition, collisions );

                    static CCText jsCommand;
                    jsCommand = "{ \"id\":\"CC.MovementCollisionCheckResult\", \"collisionRequestID\":";
                    jsCommand += id;

                    jsCommand += ", \"collisions\":[";
                    for( int i=0; i<collisions.length; ++i )
                    {
                        CCCollideable *collideable = collisions.list[i];
                        if( i > 0 )
                        {
                            jsCommand += ",";
                        }
                        jsCommand += collideable->getJSID();
                    }
                    jsCommand += "] }";

                    this->addCppToJSCommand( jsCommand.buffer );
                }
            }
        }

        else if( CCText::Equals( command, "CC.UpdateCollisions" ) )
        {
            CCASSERT( parameters.length == 4 );
            if( parameters.length == 4 )
            {
                const long jsID = atol( parameters.list[1] );

                CCJSCollideable *collideable = getJSCollideable( jsID, false );
                if( collideable != NULL )
                {
                    CCVector3 position, collisionBounds;
                    {
                        arrayParameters.clear();
                        CCText arrayString = parameters.list[2];
                        arrayString.split( arrayParameters, "," );
                        CCASSERT( arrayParameters.length == 3 );
                        if( arrayParameters.length == 3 )
                        {
                            position.x = (float)atof( arrayParameters.list[0] );
                            position.y = (float)atof( arrayParameters.list[1] );
                            position.z = (float)atof( arrayParameters.list[2] );
                        }
                    }
                    {
                        arrayParameters.clear();
                        CCText arrayString = parameters.list[3];
                        arrayString.split( arrayParameters, "," );
                        CCASSERT( arrayParameters.length == 3 );
                        if( arrayParameters.length == 3 )
                        {
                            collisionBounds.x = (float)atof( arrayParameters.list[0] );
                            collisionBounds.y = (float)atof( arrayParameters.list[1] );
                            collisionBounds.z = (float)atof( arrayParameters.list[2] );
                        }
                    }

                    collideable->setPositionAndSize( position, collisionBounds );
                }
            }
        }

        // CCObjectText
        else if( CCText::Contains( command, "CCObjectText." ) )
        {
            if( CCText::Equals( command, "CCObjectText.construct" ) )
            {
                CCASSERT( parameters.length == 2 );
                if( parameters.length == 2 )
                {
                    const long jsID = atol( parameters.list[1] );

                    CCObjectText *objectText = new CCObjectText( jsID );
                    jsTexts.add( objectText );
                    jsObjects.add( objectText );
                    jsRenderables.add( objectText );
                }
            }

            else if( CCText::Equals( command, "CCObjectText.destruct" ) )
            {
                CCASSERT( parameters.length == 2 );
                if( parameters.length == 2 )
                {
                    const long jsID = atol( parameters.list[1] );

                    CCObjectText *objectText = getJSText( jsID, false );
                    if( objectText != NULL )
                    {
                        deleteText( objectText );
                    }
                }
            }

            else if( CCText::Equals( command, "CCObjectText.setText" ) )
            {
                CCASSERT( parameters.length >= 3 );
                if( parameters.length >= 3 )
                {
                    const long jsID = atol( parameters.list[1] );
                    CCText text = parameters.list[2];
                    text.replaceChars( "\\n", "\n" );

                    for( int i=3; i<parameters.length; ++i )
                    {
                        text += ";";
                        text += parameters.list[i];
                    }

                    CCObjectText *objectText = getJSText( jsID );
                    if( objectText != NULL )
                    {
                        objectText->setText( text.buffer );
                    }
                }
            }

            else if( CCText::Equals( command, "CCObjectText.setHeight" ) )
            {
                CCASSERT( parameters.length == 3 );
                if( parameters.length == 3 )
                {
                    const long jsID = atol( parameters.list[1] );
                    const float height = (float)atof( parameters.list[2] );

                    CCObjectText *objectText = getJSText( jsID );
                    if( objectText != NULL )
                    {
                        objectText->setHeight( height );
                    }
                }
            }

            else if( CCText::Equals( command, "CCObjectText.setCentered" ) )
            {
                CCASSERT( parameters.length == 3 );
                if( parameters.length == 3 )
                {
                    const long jsID = atol( parameters.list[1] );
                    const bool centered = CCText::Equals( parameters.list[2], "true" );

                    CCObjectText *objectText = getJSText( jsID );
                    if( objectText != NULL )
                    {
                        objectText->setCentered( centered );
                    }
                }
            }

            else if( CCText::Equals( command, "CCObjectText.setFont" ) )
            {
                CCASSERT( parameters.length == 3 );
                if( parameters.length == 3 )
                {
                    const long jsID = atol( parameters.list[1] );
                    const char *font = parameters.list[2];

                    CCObjectText *objectText = getJSText( jsID );
                    if( objectText != NULL )
                    {
                        objectText->setFont( font );
                    }
                }
            }

            else if( CCText::Equals( command, "CCObjectText.setEndMarker" ) )
            {
                CCASSERT( parameters.length == 3 );
                if( parameters.length == 3 )
                {
                    const long jsID = atol( parameters.list[1] );
                    const bool toggle = CCText::Equals( parameters.list[2], "true" );

                    CCObjectText *objectText = getJSText( jsID );
                    if( objectText != NULL )
                    {
                        objectText->setEndMarker( toggle );
                    }
                }
            }
        }

        else if( processSceneCommands( command, parameters ) )
        {
        }

        else if( CCText::Equals( command, "CCRenderer.CCCreateVertexBuffer" ) )
        {
            CCASSERT( parameters.length == 2 );
            if( parameters.length == 2 )
            {
                const int vertexBufferID = atoi( parameters.list[1] );

                VertexBufferFloat *vertexBufferFloat = new VertexBufferFloat();
                vertexBufferFloat->id = vertexBufferID;
                vertexBufferFloats.add( vertexBufferFloat );
            }
        }

        else if( CCText::Equals( command, "CCRenderer.CCCreateVertexIndexBuffer" ) )
        {
            CCASSERT( parameters.length == 2 );
            if( parameters.length == 2 )
            {
                const int vertexBufferID = atoi( parameters.list[1] );

                VertexBufferUInt *vertexBufferUInt = new VertexBufferUInt();
                vertexBufferUInt->id = vertexBufferID;
                vertexBufferUInts.add( vertexBufferUInt );
            }
        }

        else if( CCText::Equals( command, "CCRenderer.CCUpdateVertexBuffer" ) )
        {
            CCASSERT( parameters.length == 3 );
            if( parameters.length == 3 )
            {
                const int vertexBufferID = atoi( parameters.list[1] );

                // Floats
                {
                    VertexBufferFloat *vertexBufferFloat = NULL;
                    for( int i=0; i<vertexBufferFloats.length; ++i )
                    {
                        if( vertexBufferFloats.list[i]->id == vertexBufferID )
                        {
                            vertexBufferFloat = vertexBufferFloats.list[i];
                            break;
                        }
                    }

                    if( vertexBufferFloat != NULL )
                    {
                        arrayParameters.clear();
                        CCText arrayString = parameters.list[2];
                        arrayString.split( arrayParameters, "," );
                        CCASSERT( arrayParameters.length > 0 );
                        if(  arrayParameters.length > 0 )
                        {
                            if( vertexBufferFloat->buffer != NULL )
                            {
                                gRenderer->derefVertexPointer( ATTRIB_VERTEX, vertexBufferFloat->buffer );
                                free( vertexBufferFloat->buffer );
                            }
                            vertexBufferFloat->buffer = (float*)malloc( sizeof( float ) * arrayParameters.length );

                            for( int arrayIndex=0; arrayIndex<arrayParameters.length; ++arrayIndex )
                            {
                                vertexBufferFloat->buffer[arrayIndex] = (float)atof( arrayParameters.list[arrayIndex] );
                            }

                            vertexBufferFloat->size = arrayParameters.length;
                        }
                        continue;
                    }
                }

                // UInts
                {
                    VertexBufferUInt *vertexBufferUInt = NULL;
                    for( int i=0; i<vertexBufferUInts.length; ++i )
                    {
                        if( vertexBufferUInts.list[i]->id == vertexBufferID )
                        {
                            vertexBufferUInt = vertexBufferUInts.list[i];
                            break;
                        }
                    }

                    if( vertexBufferUInt != NULL )
                    {
                        arrayParameters.clear();
                        CCText arrayString = parameters.list[2];
                        arrayString.split( arrayParameters, "," );
                        CCASSERT( arrayParameters.length > 0 );
                        if(  arrayParameters.length > 0 )
                        {
                            if( vertexBufferUInt->buffer != NULL )
                            {
                                free( vertexBufferUInt->buffer );
                            }
                            vertexBufferUInt->buffer = (ushort*)malloc( sizeof( ushort ) * arrayParameters.length );

                            for( int arrayIndex=0; arrayIndex<arrayParameters.length; ++arrayIndex )
                            {
                                vertexBufferUInt->buffer[arrayIndex] = (uint)atoi( arrayParameters.list[arrayIndex] );
                            }

                            vertexBufferUInt->size = arrayParameters.length;
                        }
                        continue;
                    }
                }
            }

            CCASSERT( false );
        }

        else if( CCText::Equals( command, "CCRenderer.CCDeleteVertexBuffer" ) )
        {
            CCASSERT( parameters.length == 2 );
            if( parameters.length == 2 )
            {
                const int vertexBufferID = atoi( parameters.list[1] );
                deleteVertexBufferPointer( vertexBufferID );
            }
        }

        // CCTextureManager
        else if( CCText::Contains( command, "CCTextureManager." ) )
        {
            if( CCText::Equals( command, "CCTextureManager.loadFont" ) )
            {
                CCASSERT( parameters.length == 2 );
                if( parameters.length == 2 )
                {
                    //const char *font = parameters.list[1];
                    gEngine->textureManager->loadFont( "HelveticaNeueLight" );
                }
            }
            else if( CCText::Equals( command, "CCTextureManager.assignTextureIndex" ) )
            {
                CCASSERT( parameters.length == 4 );
                if( parameters.length == 4 )
                {
                    const int index = atoi( parameters.list[1] );
                    CCText url = parameters.list[2];
                    const bool mipmap = CCText::Equals( parameters.list[3], "true" );

                    downloadImage( index, url.buffer, mipmap );
                }
            }
            else if( CCText::Equals( command, "CCTextureManager.referenceTexture" ) )
            {
                CCASSERT( parameters.length == 4 );
                if( parameters.length == 4 )
                {
                    const int index = atoi( parameters.list[1] );
                    CCText url = parameters.list[2];
                    const bool mipmap = CCText::Equals( parameters.list[3], "true" );

                    referenceImage( index, url.buffer, mipmap );
                }
            }
        }

        // CCFileManager
        else if( CCText::Contains( command, "CCFileManager." ) )
        {
            if( CCText::Equals( command, "CCFileManager.Load" ) )
            {
                CCASSERT( parameters.length == 2 );
                if( parameters.length == 2 )
                {
                    const char *file = parameters.list[1];
                    CCText data;
                    bool success = CCFileManager::GetFile( file, data, Resource_Cached, false ) != -1;

                    CCText script;
                    script = "CCFileManager.Loaded( \"";
                    script += file;
                    script += "\", ";
                    if( success )
                    {
                        data.encodeForWeb();
                        script += "\"";
                        script += data.buffer;
                        script += "\"";
                    }
                    else
                    {
                        script += "null";
                    }
                    script += " );";
                    CCAppManager::WebJSRunJavaScript( script.buffer, false, false );
                }
            }
            else if( CCText::Equals( command, "CCFileManager.Save" ) )
            {
                CCASSERT( parameters.length >= 3 );
                if( parameters.length >= 3 )
                {
                    const char *file = parameters.list[1];
                    CCText data = parameters.list[2];
                    for( int i=3; i<parameters.length; ++i )
                    {
                        data += ";";
                        data += parameters.list[i];
                    }

                    CCFileManager::SaveCachedFile( file, data.buffer, data.length );
                }
            }
            else if( CCText::Equals( command, "CCURLManager.setDomainTimeOut" ) )
            {
                CCASSERT( parameters.length == 3 );
                if( parameters.length == 3 )
                {
                    const char *domain = parameters.list[1];
                    const float timeout = (float)atof( parameters.list[2] );

                    gEngine->urlManager->setDomainTimeOut( domain, timeout );
                }
            }
        }

        // CCURLManager
        else if( CCText::Contains( command, "CCURLManager." ) )
        {
            if( CCText::Equals( command, "CCURLManager.requestURL" ) )
            {
                CCASSERT( parameters.length == 9 );
                if( parameters.length == 9 )
                {
                    Download *download = new Download();
                    download->id = parameters.list[1];
                    download->url = parameters.list[2];

                    CCText postDataFilename = parameters.list[3];
                    if( postDataFilename.length > 0 )
                    {
                        CCData postData;
                        CCFileManager::GetFile( postDataFilename.buffer, postData, Resource_Cached );

                        if( postData.length > 0 )
                        {
                            json_error_t error;
                            json_t *json = json_loads( postData.buffer, 0, &error );
                            if( json != NULL )
                            {
                                void *iter = json_object_iter( json );
                                while( iter )
                                {
                                    const char *jsonKey = json_object_iter_key( iter );
                                    const json_t *jsonValue = json_object_iter_value( iter );

                                    CCText *key = new CCText( jsonKey );
                                    CCData *value = new CCData();

                                    if( jsonValue->type == JSON_STRING )
                                    {
                                        const char *stringValue = json_string_value( jsonValue );
                                        value->set( stringValue, strlen( stringValue ) );
                                    }

                                    download->postData.names.add( key );
                                    download->postData.values.add( value );

                                    iter = json_object_iter_next( json, iter );
                                }

                                json_decref( json );
                            }
                        }


                        CCFileManager::DeleteCachedFile( postDataFilename.buffer );
                    };
                    const int priority = atoi( parameters.list[4] );
                    download->cacheFile = parameters.list[5];
                    download->cacheFileTimeoutSeconds = atoi( parameters.list[6] );
                    download->timeout = (float)atof( parameters.list[7] );
                    download->returnBinary = CCText::Equals( parameters.list[8], "true" );

                    downloadURL( download, priority );
                }
            }
            else if( CCText::Equals( command, "CCURLManager.updateRequestPriority" ) )
            {
                CCASSERT( parameters.length == 4 );
                if( parameters.length == 4 )
                {
                    const char *url = parameters.list[1];
                    const char *cacheFile = parameters.list[2];
                    const int priority = atoi( parameters.list[3] );

                    CCURLRequest *urlRequest = gEngine->urlManager->findUnprocessedRequest( url, cacheFile );
                    if( urlRequest != NULL )
                    {
                        gEngine->urlManager->updateRequestPriority( urlRequest, priority );
                    }
                }
            }
            else if( CCText::Equals( command, "CCURLManager.setDomainTimeOut" ) )
            {
                CCASSERT( parameters.length == 3 );
                if( parameters.length == 3 )
                {
                    const char *domain = parameters.list[1];
                    const float timeout = (float)atof( parameters.list[2] );

                    gEngine->urlManager->setDomainTimeOut( domain, timeout );
                }
            }
        }

        // CCURLManager
        else if( CCText::Contains( command, "CCAudioManager." ) )
        {
            if( CCText::Equals( command, "CCAudioManager.Prepare" ) )
            {
                CCASSERT( parameters.length == 3 );
                if( parameters.length == 3 )
                {
                    const char *id = parameters.list[1];
                    const char *url = parameters.list[2];
                    CCAudioManager::Prepare( id, url );
                }
            }
            else if( CCText::Equals( command, "CCAudioManager.Play" ) )
            {
                CCASSERT( parameters.length == 5 );
                if( parameters.length == 5 )
                {
                    const char *id = parameters.list[1];
                    const char *url = parameters.list[2];
                    const bool restart = CCText::Equals( parameters.list[3], "true" );
                    const bool loop = CCText::Equals( parameters.list[4], "true" );

                    CCAudioManager::Play( id, url, restart, loop );
                }
            }
            else if( CCText::Equals( command, "CCAudioManager.Stop" ) )
            {
                CCASSERT( parameters.length == 2 );
                if( parameters.length == 2 )
                {
                    const char *id = parameters.list[1];
                    CCAudioManager::Stop( id );
                }
            }
            else if( CCText::Equals( command, "CCAudioManager.Pause" ) )
            {
                CCASSERT( parameters.length == 2 );
                if( parameters.length == 2 )
                {
                    const char *id = parameters.list[1];
                    CCAudioManager::Pause( id );
                }
            }
            else if( CCText::Equals( command, "CCAudioManager.Resume" ) )
            {
                CCASSERT( parameters.length == 2 );
                if( parameters.length == 2 )
                {
                    const char *id = parameters.list[1];
                    CCAudioManager::Resume( id );
                }
            }
            else if( CCText::Equals( command, "CCAudioManager.SetTime" ) )
            {
                CCASSERT( parameters.length == 3 );
                if( parameters.length == 3 )
                {
                    const char *id = parameters.list[1];
                    const float time = atof( parameters.list[2] );
                    CCAudioManager::SetTime( id, time );
                }
            }
            else if( CCText::Equals( command, "CCAudioManager.SetVolume" ) )
            {
                CCASSERT( parameters.length == 3 );
                if( parameters.length == 3 )
                {
                    const char *id = parameters.list[1];
                    const float time = atof( parameters.list[2] );
                    CCAudioManager::SetVolume( id, time );
                }
            }
        }

        // Keyboard
        else if( CCText::Contains( command, "CCControls." ) )
        {
            if( CCText::Equals( command, "CCControls.requestKeyboard" ) )
            {
                CCASSERT( parameters.length == 1 );
                if( parameters.length == 1 )
                {
                    CCAppManager::KeyboardToggle( true );
                }
            }
            else if( CCText::Equals( command, "CCControls.removeKeyboard" ) )
            {
                CCASSERT( parameters.length == 1 );
                if( parameters.length == 1 )
                {
                    CCAppManager::KeyboardToggle( false );
                }
            }
        }

        // Web
        else if( CCText::Equals( command, "CCEngine.InAppPurchase" ) )
        {
            CCASSERT( parameters.length == 3 );
            if( parameters.length == 3 )
            {
                const char *itemCode = parameters.list[1];
                const bool consumable = CCText::Equals( parameters.list[2], "true" );

                class SuccessCallback : public CCLambdaSafeCallback
                {
                public:
                    SuccessCallback(CCJSEngine *engine, const char *itemCode)
                    {
                        this->engine = engine;
                        this->lazyPointer = engine->lazyPointer;
                        this->lazyID = engine->lazyID;
                        this->itemCode = itemCode;
                    }
                    void safeRun()
                    {
                        // Always save our success
                        //CCSaveData( itemCode.buffer, ":)" );
                        CCLambdaSafeCallback::safeRun();
                    }
                protected:
                    void run()
                    {
                        CCText jsCommand;
                        {
                            jsCommand = "{ \"id\":\"CCEngine.InAppPurchased\" }";
                            engine->addCppToJSCommand( jsCommand.buffer );
                        }
                    }

                    CCJSEngine *engine;
                    CCText itemCode;
                };

                CCLAMBDA_3( ThreadCallback, CCJSEngine, engine, CCText, itemCode, bool, consumable, {
                    CCAppManager::InAppPurchase( itemCode.buffer, consumable, new SuccessCallback( engine, itemCode.buffer ) );
                });

                gEngine->engineToNativeThread( new ThreadCallback( this, itemCode, consumable ) );
            }
        }
        else if( CCText::Equals( command, "CCEngine.WebBrowserOpen" ) )
        {
            CCASSERT( parameters.length == 2 );
            if( parameters.length == 2 )
            {
                const char *url = parameters.list[1];
                CCAppManager::WebBrowserOpen( url );
            }
        }
        else if( CCText::Equals( command, "CCEngine.WebViewOpen" ) )
        {
            CCASSERT( parameters.length == 2 );
            if( parameters.length == 2 )
            {
				webViewOpened = true;
                const char *url = parameters.list[1];
                CCAppManager::WebViewOpen( url );
            }
        }
        else if( CCText::Equals( command, "CCEngine.WebViewClose" ) )
        {
            CCASSERT( parameters.length == 1 );
            if( parameters.length == 1 )
            {
				webViewOpened = false;
                CCAppManager::WebViewClose();
            }
        }

        else if( CCText::Equals( command, "CCEngine.EnableBackButton" ) )
        {
            CCASSERT( parameters.length == 2 );
            if( parameters.length == 2 )
            {
                const bool toggle = CCText::Equals( parameters.list[1], "true" );
                backButtonEnabled = toggle;
            }
        }

        else if( CCText::Equals( command, "CCEngine.Restart" ) )
        {
            gEngine->restartLauncher();
        }

        else if( CCText::Equals( command, "CCEngine.RestartClient" ) )
        {
            CCASSERT( parameters.length == 2 );
            if( parameters.length == 2 )
            {
                CURRENT_APP_ID = parameters.list[1];
                gEngine->urlSchemeUpdate();
            }
        }

        else
        {
            CCASSERT( false );
        }
    }
}


void CCJSEngine::processRenderCommands(CCList<char> &commands)
{
    static CCList<char> parameters;
    static CCText commandString;

    for( int i=0; i<commands.length-1; ++i )
    {
        commandString = commands.list[i];
        parameters.clear();
        commandString.split( parameters, ";" );

        const char *command = parameters.list[0];

        if( processRenderCommands( command, parameters ) )
        {
        }

        else if( processMatrixCommands( command, parameters ) )
        {
        }

        else if( CCText::Equals( command, "CCObjectText.renderObject" ) )
        {
            CCASSERT( parameters.length == 2 );
            if( parameters.length == 2 )
            {
                const long jsID = atol( parameters.list[1] );

                CCObjectText *objectText = getJSText( jsID, false );
                if( objectText != NULL )
                {
                    objectText->renderObject( NULL, true );
                }
            }
        }

        else if( CCText::Equals( command, "CCObject.renderModel" ) )
        {
            CCASSERT( parameters.length == 3 );
            if( parameters.length == 3 )
            {
                const long jsID = atol( parameters.list[1] );
                const bool alpha = CCText::Equals( parameters.list[2], "true" );

                CCObject *object = getJSObject( jsID, false );
                if( object != NULL )
                {
                    object->renderModel( alpha );
                }
            }
        }

        else if( CCText::Equals( command, "CCCameraBase.set" ) )
        {
            CCASSERT( parameters.length == 2 )
            if( parameters.length == 2 )
            {
                const char *cameraID = parameters.list[1];

                CCJSCamera *camera = getJSCamera( cameraID, false );
                if( camera != NULL )
                {
                    camera->set();
                }
                else
                {
                    CCCameraBase::CurrentCamera = NULL;
                }
            }
        }

        // CCTextureManager
        else if( CCText::Equals( command, "CCTextureManager.setTextureIndex" ) )
        {
            CCASSERT( parameters.length == 2 );
            if( parameters.length == 2 )
            {
                const int index = atoi( parameters.list[1] );

                Image *image = NULL;
                for( int imageIndex=0; imageIndex<images.length; ++imageIndex )
                {
                    Image *imageItr = images.list[imageIndex];
                    if( imageItr->jsIndex == index )
                    {
                        image = imageItr;
                        break;
                    }
                }

                if( image != NULL )
                {
                    gEngine->textureManager->setTextureIndex( image->handleIndex );
                }
                else
                {
                    // Transparent texture
                    gEngine->textureManager->setTextureIndex( 0 );
                }
            }
        }

        // CCModelBase
        else if( CCText::Equals( command, "CCModelBase.render" ) )
        {
            CCASSERT( parameters.length == 3 );
            if( parameters.length == 3 )
            {
                const long jsID = atol( parameters.list[1] );
                const bool alpha = CCText::Equals( parameters.list[2], "true" );

                CCModelBase *model = getJSModel( jsID );
                if( model != NULL )
                {
                    model->render( alpha );
                }
            }
        }

        // CCPrimitiveFBX
        else if( CCText::Equals( command, "CCPrimitiveFBX.render" ) )
        {
            CCASSERT( parameters.length == 2 );
            if( parameters.length == 2 )
            {
                const char *primitiveID = parameters.list[1];

                CCJSPrimitiveFBX *primitiveFBX = getJSPrimitiveFBX( primitiveID );
                if( primitiveFBX != NULL )
                {
                    primitiveFBX->render();
                }
            }
        }

        // CCPrimitiveOBJ
        else if( CCText::Equals( command, "CCPrimitiveOBJ.render" ) )
        {
            CCASSERT( parameters.length == 2 );
            if( parameters.length == 2 )
            {
                const char *primitiveID = parameters.list[1];

                CCJSPrimitiveOBJ *primitiveObj = getJSPrimitiveOBJ( primitiveID );
                if( primitiveObj != NULL )
                {
                    primitiveObj->render();
                }
            }
        }

        // CCPrimitiveSquare
        else if( CCText::Equals( command, "CCPrimitiveSquare.render" ) )
        {
            CCASSERT( parameters.length == 2 );
            if( parameters.length == 2 )
            {
                const char *primitiveID = parameters.list[1];

                CCPrimitiveSquare *primitiveSquare = getJSPrimitiveSquare( primitiveID );
                if( primitiveSquare != NULL )
                {
                    primitiveSquare->render();
                }
            }
        }

        else
        {
            CCASSERT( false );
        }
    }
}


bool CCJSEngine::processRenderCommands(const char *command, CCList<char> &parameters)
{
#if defined PROFILEON
    CCProfiler profile( "CCJSEngine::processRenderCommands()" );
#endif

    if( CCText::Contains( command, "gl." ) )
    {
        if( CCText::Equals( command, "gl.clear" ) )
        {
            if( !clearedScreen )
            {
                clearedScreen = true;
                gRenderer->bind();
            }
            gRenderer->clear( parameters.length == 3 );
            return true;
        }

        else if( CCText::Equals( command, "gl.clearColor" ) )
        {
            if( parameters.length == 2 )
            {
                arrayParameters.clear();
                CCText arrayString = parameters.list[1];
                arrayString.split( arrayParameters, "," );
                if( arrayParameters.length == 4 );
                {
#ifndef DXRENDERER
                    const float r = (float)atof( arrayParameters.list[0] );
                    const float g = (float)atof( arrayParameters.list[1] );
                    const float b = (float)atof( arrayParameters.list[2] );
                    const float a = (float)atof( arrayParameters.list[3] );
                    glClearColor( r, g, b, a );
#endif
                    return true;
                }
            }
        }

        else if( CCText::Equals( command, "gl.depthFunc" ) )
        {
            return true;
        }

        else if( CCText::Equals( command, "gl.blendFunc" ) )
        {
            return true;
        }

        else if( CCText::Equals( command, "gl.lineWidth" ) )
        {
            return true;
        }

        else if( CCText::Equals( command, "gl.viewport" ) )
        {
            if( parameters.length == 2 )
            {
                arrayParameters.clear();
                CCText arrayString = parameters.list[1];
                arrayString.split( arrayParameters, "," );
                if( arrayParameters.length == 4 )
                {
                    const float x = (float)atof( arrayParameters.list[0] );
                    const float y = (float)atof( arrayParameters.list[1] );
                    const float width = (float)atof( arrayParameters.list[2] );
                    const float height = (float)atof( arrayParameters.list[3] );

                    gRenderer->GLViewport( x, y, width, height );
                    return true;
                }
            }
        }

        else if( CCText::Equals( command, "gl.scissor" ) )
        {
            if( parameters.length == 2 )
            {
                arrayParameters.clear();
                CCText arrayString = parameters.list[1];
                arrayString.split( arrayParameters, "," );
                if( arrayParameters.length == 4 )
                {
                    const float x = (float)atof( arrayParameters.list[0] );
                    const float y = (float)atof( arrayParameters.list[1] );
                    const float width = (float)atof( arrayParameters.list[2] );
                    const float height = (float)atof( arrayParameters.list[3] );

                    gRenderer->GLScissor( x, y, width, height );
                    return true;
                }
            }
        }

        else if( CCText::Equals( command, "gl.uniformMatrix4fv" ) )
        {
            if( parameters.length == 3 )
            {
                const char *mode = parameters.list[1];

                arrayParameters.clear();
                CCText arrayString = parameters.list[2];
                arrayString.split( arrayParameters, "," );
                if( arrayParameters.length == 16 )
                {
                    for( int arrayIndex=0; arrayIndex<arrayParameters.length; ++arrayIndex )
                    {
                        matrix.data()[arrayIndex] = (float)atof( arrayParameters.list[arrayIndex] );
                    }

                    const GLint *uniforms = gRenderer->getShader()->uniforms;
                    if( CCText::Equals( mode, "UNIFORM_PROJECTIONMATRIX" ) )
                    {
                        gRenderer->GLUniformMatrix4fv( uniforms[UNIFORM_PROJECTIONMATRIX], 1, GL_FALSE, matrix.m );
                    }
                    else if( CCText::Equals( mode, "UNIFORM_VIEWMATRIX" ) )
                    {
                        gRenderer->GLUniformMatrix4fv( uniforms[UNIFORM_VIEWMATRIX], 1, GL_FALSE, matrix.m );
                    }
                    else if( CCText::Equals( mode, "UNIFORM_MODELMATRIX" ) )
                    {
                        gRenderer->GLUniformMatrix4fv( uniforms[UNIFORM_MODELMATRIX], 1, GL_FALSE, matrix.m );
                    }
                    else
                    {
                        CCASSERT( false );
                    }
                    return true;
                }
            }
        }

        else if( CCText::Equals( command, "gl.drawArrays" ) )
        {
            if( parameters.length == 4 )
            {
                const char *mode = parameters.list[1];
                const int first = atoi( parameters.list[2] );
                const int count = atoi( parameters.list[3] );

                if( CCText::Equals( mode, "TRIANGLE_STRIP" ) )
                {
                    gRenderer->GLDrawArrays( GL_TRIANGLE_STRIP, first, count );
                }
                else if( CCText::Equals( mode, "TRIANGLES" ) )
                {
                    gRenderer->GLDrawArrays( GL_TRIANGLES, first, count );
                }
                else if( CCText::Equals( mode, "LINES" ) )
                {
                    gRenderer->GLDrawArrays( GL_LINES, first, count );
                }
                else
                {
                    CCASSERT( false );
                }

                return true;
            }
        }

        else if( CCText::Equals( command, "gl.drawElements" ) )
        {
            if( parameters.length == 4 )
            {
                if( currentVertexIndexBuffer != NULL )
                {
                    const char *mode = parameters.list[1];
                    const int count = atoi( parameters.list[2] );
                    const int offsetInBytes = atoi( parameters.list[3] );

                    if( count > 0 )
                    {
                        const int offset = offsetInBytes / 2;

                        const ushort *indices = currentVertexIndexBuffer->buffer;

                        if( CCText::Equals( mode, "LINE_STRIP" ) )
                        {
                            gRenderer->GLDrawElements( GL_LINE_STRIP, count, GL_UNSIGNED_SHORT, &indices[offset] );
                        }
                        else if( CCText::Equals( mode, "TRIANGLE_STRIP" ) )
                        {
                            gRenderer->GLDrawElements( GL_TRIANGLE_STRIP, count, GL_UNSIGNED_SHORT, &indices[offset] );
                        }
                        else if( CCText::Equals( mode, "TRIANGLES" ) )
                        {
                            gRenderer->GLDrawElements( GL_TRIANGLES, count, GL_UNSIGNED_SHORT, &indices[offset] );
                        }
                        else
                        {
                            CCASSERT( false );
                        }
                        return true;
                    }
                }
            }
        }
    }

    else if( CCText::Contains( command, "CCRenderer." ) )
    {
        if( CCText::Equals( command, "CCRenderer.CCSetColour" ) )
        {
            if( parameters.length == 2 )
            {
                arrayParameters.clear();
                CCText arrayString = parameters.list[1];
                arrayString.split( arrayParameters, "," );
                if( arrayParameters.length == 4 )
                {
                    const float r = (float)atof( arrayParameters.list[0] );
                    const float g = (float)atof( arrayParameters.list[1] );
                    const float b = (float)atof( arrayParameters.list[2] );
                    const float a = (float)atof( arrayParameters.list[3] );

                    GLColor4f( r, g, b, a );
                    return true;
                }
            }
        }

        else if( CCText::Equals( command, "CCRenderer.CCSetBlend" ) )
        {
            if( parameters.length == 2 )
            {
                const bool toggle = CCText::Equals( parameters.list[1], "true" );
                CCRenderer::CCSetBlend( toggle );
                return true;
            }
        }

        else if( CCText::Equals( command, "CCRenderer.CCSetDepthRead" ) )
        {
            CCASSERT( parameters.length == 2 );
            if( parameters.length == 2 )
            {
                const bool toggle = CCText::Equals( parameters.list[1], "true" );
                CCRenderer::CCSetDepthRead( toggle );
                return true;
            }
        }

        else if( CCText::Equals( command, "CCRenderer.CCSetDepthWrite" ) )
        {
            if( parameters.length == 2 )
            {
                const bool toggle = CCText::Equals( parameters.list[1], "true" );
                CCRenderer::CCSetDepthWrite( toggle );
                return true;
            }
        }

        else if( CCText::Equals( command, "CCRenderer.CCSetCulling" ) )
        {
            if( parameters.length == 2 )
            {
                const bool toggle = CCText::Equals( parameters.list[1], "true" );
                CCRenderer::CCSetCulling( toggle );
                return true;
            }
        }

        else if( CCText::Equals( command, "CCRenderer.CCSetFrontCulling" ) )
        {
            if( parameters.length == 1 )
            {
                CCRenderer::CCSetFrontCulling();
                return true;
            }
        }

        else if( CCText::Equals( command, "CCRenderer.CCSetBackCulling" ) )
        {
            if( parameters.length == 1 )
            {
                CCRenderer::CCSetBackCulling();
                return true;
            }
        }

        else if( CCText::Equals( command, "CCRenderer.CCSetRenderStates" ) )
        {
            CCRenderer::CCSetRenderStates( true );
            return true;
        }

        else if( CCText::Equals( command, "CCRenderer.CCBindVertexTextureBuffer" ) )
        {
            if( parameters.length == 2 )
            {
                const int vertexBufferID = atoi( parameters.list[1] );
                CCBindVertexTextureBuffer( vertexBufferID );
                return true;
            }
        }

        else if( CCText::Equals( command, "CCRenderer.CCBindVertexPositionBuffer" ) )
        {
            if( parameters.length == 2 )
            {
                const int vertexBufferID = atoi( parameters.list[1] );
                CCBindVertexPositionBuffer( vertexBufferID );
                return true;
            }
        }

        else if( CCText::Equals( command, "CCRenderer.CCBindVertexIndexBuffer" ) )
        {
            if( parameters.length == 2 )
            {
                const int vertexBufferID = atoi( parameters.list[1] );
                CCBindVertexIndexBuffer( vertexBufferID );
                return true;
            }
        }

        else if( CCText::Equals( command, "CCRenderer.GLVertexPointer" ) )
        {
            if( parameters.length == 2 )
            {
                arrayParameters.clear();
                CCText arrayString = parameters.list[1];
                arrayString.split( arrayParameters, "," );
                if( arrayParameters.length > 0 )
                {
                    static float *vertices = NULL;
                    if( vertices != NULL )
                    {
                        free( vertices );
                    }
                    vertices = (float*)malloc( sizeof( float ) * arrayParameters.length );

                    for( int arrayIndex=0; arrayIndex<arrayParameters.length; ++arrayIndex )
                    {
                        vertices[arrayIndex] = (float)atof( arrayParameters.list[arrayIndex] );
                    }

                    GLVertexPointer( 3, GL_FLOAT, 0, vertices, arrayParameters.length/3 );
                    return true;
                }
            }
        }

        else if( CCText::Equals( command, "CCRenderer.CCSetTexCoords" ) )
        {
            if( parameters.length == 2 )
            {
                arrayParameters.clear();
                CCText arrayString = parameters.list[1];
                arrayString.split( arrayParameters, "," );
                if( arrayParameters.length > 0 )
                {
                    static float *uvs = NULL;
                    if( uvs != NULL )
                    {
                        free( uvs );
                    }
                    uvs = (float*)malloc( sizeof( float ) * arrayParameters.length );

                    for( int arrayIndex=0; arrayIndex<arrayParameters.length; ++arrayIndex )
                    {
                        uvs[arrayIndex] = (float)atof( arrayParameters.list[arrayIndex] );
                    }

                    CCSetTexCoords( uvs );
                    return true;
                }
            }
        }
    }

    return false;
}


bool CCJSEngine::processMatrixCommands(const char *command, CCList<char> &parameters)
{
#if defined PROFILEON
    CCProfiler profile( "CCJSEngine::processMatrixCommands()" );
#endif

    if( CCText::Contains( command, "Matrix." ) )
    {
        if( CCText::Equals( command, "Matrix.GLPushMatrix" ) )
        {
            GLPushMatrix();
            return true;
        }
        else if( CCText::Equals( command, "Matrix.GLPopMatrix" ) )
        {
            GLPopMatrix();
            return true;
        }
        else if( CCText::Equals( command, "Matrix.GLLoadIdentity" ) )
        {
            GLLoadIdentity();
            return true;
        }
        else if( CCText::Equals( command, "Matrix.GLMultMatrix" ) )
        {
            if( parameters.length == 17 )
            {
                for( int arrayIndex=0; arrayIndex<16; ++arrayIndex )
                {
                    matrix.data()[arrayIndex] = (float)atof( parameters.list[1+arrayIndex] );
                }

                GLMultMatrixf( matrix );
                return true;
            }
        }
        else if( CCText::Equals( command, "Matrix.GLTranslate" ) )
        {
            if( parameters.length == 4 )
            {
                const float x = (float)atof( parameters.list[1] );
                const float y = (float)atof( parameters.list[2] );
                const float z = (float)atof( parameters.list[3] );

                GLTranslatef( x, y, z );
                return true;
            }
        }
        else if( CCText::Equals( command, "Matrix.GLScale" ) )
        {
            if( parameters.length == 4 )
            {
                const float x = (float)atof( parameters.list[1] );
                const float y = (float)atof( parameters.list[2] );
                const float z = (float)atof( parameters.list[3] );

                GLScalef( x, y, z );
                return true;
            }
        }
        else if( CCText::Equals( command, "Matrix.GLRotate" ) )
        {
            if( parameters.length == 5 )
            {
                const float angle = (float)atof( parameters.list[1] );

                const float x = (float)atof( parameters.list[2] );
                const float y = (float)atof( parameters.list[3] );
                const float z = (float)atof( parameters.list[4] );

                GLRotatef( angle, x, y, z );
                return true;
            }
        }

        // ModelMatrix
        else if( CCText::Equals( command, "Matrix.ModelMatrixMultiply" ) )
        {
            if( parameters.length == 2 )
            {
                const long jsID = atol( parameters.list[1] );

                CCRenderable *renderable = getJSRenderable( jsID, false );
                if( renderable != NULL )
                {
                    GLMultMatrixf( renderable->getModelMatrix() );
                }
                return true;
            }
        }

        else if( CCText::Equals( command, "Matrix.ModelMatrixIdentity" ) )
        {
            if( parameters.length == 2 )
            {
                const long jsID = atol( parameters.list[1] );

                CCRenderable *renderable = getJSRenderable( jsID, false );
                if( renderable != NULL )
                {
                    CCMatrixLoadIdentity( renderable->getModelMatrix() );
                }
                return true;
            }
        }

        else if( CCText::Equals( command, "Matrix.ModelMatrixTranslate" ) )
        {
            if( parameters.length == 5 )
            {
                const long jsID = atol( parameters.list[1] );

                CCRenderable *renderable = getJSRenderable( jsID, false );
                if( renderable != NULL )
                {
                    const float x = (float)atof( parameters.list[2] );
                    const float y = (float)atof( parameters.list[3] );
                    const float z = (float)atof( parameters.list[4] );

                    CCMatrixTranslate( renderable->getModelMatrix(), x, y, z );
                }
                return true;
            }
        }

        else if( CCText::Equals( command, "Matrix.ModelMatrixScale" ) )
        {
            if( parameters.length == 5 )
            {
                const long jsID = atol( parameters.list[1] );

                CCRenderable *renderable = getJSRenderable( jsID, false );
                if( renderable != NULL )
                {
                    const float x = (float)atof( parameters.list[2] );
                    const float y = (float)atof( parameters.list[3] );
                    const float z = (float)atof( parameters.list[4] );

                    CCMatrixScale( renderable->getModelMatrix(), x, y, z );
                }
                return true;
            }
        }

        else if( CCText::Equals( command, "Matrix.ModelMatrixRotate" ) )
        {
            if( parameters.length == 6 )
            {
                const long jsID = atol( parameters.list[1] );

                CCRenderable *renderable = getJSRenderable( jsID, false );
                if( renderable != NULL )
                {
                    const float angle = (float)atof( parameters.list[2] );
                    const float x = (float)atof( parameters.list[3] );
                    const float y = (float)atof( parameters.list[4] );
                    const float z = (float)atof( parameters.list[5] );

                    CCMatrixRotateDegrees( renderable->getModelMatrix(), angle, x, y, z );
                }
                return true;
            }
        }
    }

    return false;
}


bool CCJSEngine::processSceneCommands(const char *command, CCList<char> &parameters)
{
#if defined PROFILEON
    CCProfiler profile( "CCJSEngine::processSceneCommands()" );
#endif

    if( CCText::Contains( command, "CCEngine." ) )
    {
        if( CCText::Equals( command, "CCEngine.removeScene" ) )
        {
            if( parameters.length == 2 )
            {
                const char *sceneID = parameters.list[1];

                CCJSScene *scene = getJSScene( sceneID );
                if( scene != NULL )
                {
#ifdef DEBUGON
					CCText debug = "CCJSEngine::removeScene ";
					debug += sceneID;
					debug += "\n";
					DEBUGLOG( "%s", debug.buffer );
#endif
                    deleteScene( scene );
                }
                return true;
            }
        }
    }

    else if( CCText::Contains( command, "CCCameraBase." ) )
    {
        if( CCText::Equals( command, "CCCameraBase.setupViewport" ) )
        {
            if( parameters.length == 6 )
            {
                const char *cameraID = parameters.list[1];

                CCJSCamera *camera = getJSCamera( cameraID );
                if( camera != NULL )
                {
                    const float x = (float)atof( parameters.list[2] );
                    const float y = (float)atof( parameters.list[3] );
                    const float width = (float)atof( parameters.list[4] );
                    const float height = (float)atof( parameters.list[5] );

                    camera->setupViewport( x, y, width, height );
                }
                return true;
            }
        }
        else if( CCText::Equals( command, "CCCameraBase.gluPerspective" ) )
        {
            if( parameters.length == 6 )
            {
                const char *cameraID = parameters.list[1];

                CCJSCamera *camera = getJSCamera( cameraID );
                if( camera != NULL )
                {
                    const float right = (float)atof( parameters.list[2] );
                    const float top = (float)atof( parameters.list[3] );
                    const float zNear = (float)atof( parameters.list[4] );
                    const float zFar = (float)atof( parameters.list[5] );

                    camera->gluPerspective( right, top, zNear, zFar );
                }
                return true;
            }
        }
        else if( CCText::Equals( command, "CCCameraBase.useSceneCollideables" ) )
        {
            if( parameters.length == 3 )
            {
                const char *cameraID = parameters.list[1];
                const char *sceneID = parameters.list[2];

                CCJSCamera *camera = getJSCamera( cameraID );
                if( camera != NULL )
                {
                    CCJSScene *scene = getJSScene( sceneID );
                    if( scene != NULL )
                    {
                        camera->setCollideables( &scene->getCollideables() );
                    }
                }
                return true;
            }
        }
    }

    else if( CCText::Contains( command, "CCSceneBase." ) )
    {
        if( CCText::Equals( command, "CCSceneBase.addCollideable" ) )
        {
            if( parameters.length == 3 )
            {
                const char *sceneID = parameters.list[1];
                const long collideableID = atol( parameters.list[2] );

                CCJSScene *scene = getJSScene( sceneID, false );
                if( scene != NULL )
                {
                    CCJSCollideable *collideable = getJSCollideable( collideableID );
                    if( collideable != NULL )
                    {
                        scene->addCollideable( collideable );
                    }
                }
                return true;
            }
        }
        else if( CCText::Equals( command, "CCSceneBase.removeCollideable" ) )
        {
            if( parameters.length == 3 )
            {
                const char *sceneID = parameters.list[1];
                const long jsID = atol( parameters.list[2] );

                CCJSScene *scene = getJSScene( sceneID, false );

                CCJSCollideable *collideable = getJSCollideable( jsID, false );
                if( collideable != NULL )
                {
                    // If our scene is still active, remove it from there, it not, remove it from our engine list
                    if( scene != NULL )
                    {
                        scene->removeCollideable( collideable );
                    }
                    else
                    {
                        gEngine->collisionManager.removeCollideable( collideable );
                    }
                }
                return true;
            }
        }
    }

    // CCObject
    else if( CCText::Contains( command, "CCObject." ) )
    {
        if( CCText::Equals( command, "CCObject.construct" ) )
        {
            if( parameters.length == 2 )
            {
                const long jsID = atol( parameters.list[1] );

                CCObject *object = new CCObject( jsID );
                jsObjects.add( object );
                jsRenderables.add( object );

                return true;
            }
        }

        else if( CCText::Equals( command, "CCObject.destruct" ) )
        {
            if( parameters.length == 2 )
            {
                const long jsID = atol( parameters.list[1] );

                CCObject *object = getJSObject( jsID, false );
                if( object != NULL )
                {
                    deleteObject( object );
                }
                return true;
            }
        }

        else if( CCText::Equals( command, "CCObject.setModel" ) )
        {
            if( parameters.length == 3 )
            {
                const long jsID = atol( parameters.list[1] );
                const long modelID = atol( parameters.list[2] );

                CCObject *object = getJSObject( jsID, false );
                if( object != NULL )
                {
                    CCModelBase *model = getJSModel( modelID );
                    if( model != NULL )
                    {
                        object->setModel( model );
                    }
                }
                return true;
            }
        }

        else if( CCText::Equals( command, "CCObject.setReadDepth" ) )
        {
            if( parameters.length == 3 )
            {
                const long jsID = atol( parameters.list[1] );
                const bool toggle = CCText::Equals( parameters.list[2], "true" );

                CCObject *object = getJSObject( jsID, false );
                if( object != NULL )
                {
                    object->setReadDepth( toggle );
                }
                return true;
            }
        }

        else if( CCText::Equals( command, "CCObject.setWriteDepth" ) )
        {
            if( parameters.length == 3 )
            {
                const long jsID = atol( parameters.list[1] );
                const bool toggle = CCText::Equals( parameters.list[2], "true" );

                CCObject *object = getJSObject( jsID );
                if( object != NULL )
                {
                    object->setWriteDepth( toggle );
                }
                return true;
            }
        }

        else if( CCText::Equals( command, "CCObject.setCulling" ) )
        {
            if( parameters.length == 3 )
            {
                const long jsID = atol( parameters.list[1] );
                const bool toggle = CCText::Equals( parameters.list[2], "true" );

                CCObject *object = getJSObject( jsID );
                if( object != NULL )
                {
                    object->setCulling( toggle );
                }
                return true;
            }
        }
    }

    // CCCollideable
    else if( CCText::Contains( command, "CCCollideable." ) )
    {
        if( CCText::Equals( command, "CCCollideable.destruct" ) )
        {
            const long jsID = atol( parameters.list[1] );

            CCJSCollideable *collideable = getJSCollideable( jsID );
            if( collideable != NULL )
            {
                deleteCollideable( collideable );
            }
            return true;
        }

        else if( CCText::Equals( command, "CCCollideable.setDrawOrder" ) )
        {
            if( parameters.length == 3 )
            {
                const long jsID = atol( parameters.list[1] );

                CCJSCollideable *collideable = getJSCollideable( jsID );
                if( collideable != NULL )
                {
                    const int drawOrder = atoi( parameters.list[2] );
                    collideable->setDrawOrder( drawOrder );
                }
                return true;
            }
        }
    }

    // CCModelBase
    else if( CCText::Contains( command, "CCModelBase." ) )
    {
        if( CCText::Equals( command, "CCModelBase.construct" ) )
        {
            if( parameters.length == 2 )
            {
                const long jsID = atol( parameters.list[1] );

                CCModelBase *model = new CCModelBase( jsID );
                jsModels.add( model );
                jsRenderables.add( model );
                return true;
            }
        }

        else if( CCText::Equals( command, "CCModelBase.destruct" ) )
        {
            if( parameters.length == 2 )
            {
                const long jsID = atol( parameters.list[1] );

                CCModelBase *model = getJSModel( jsID, false );
                if( model != NULL )
                {
                    deleteModel( model );
                }
                return true;
            }
        }

        else if( CCText::Equals( command, "CCModelBase.addModel" ) )
        {
            if( parameters.length == 3 )
            {
                const long jsID = atol( parameters.list[1] );
                const long childID = atol( parameters.list[2] );

                CCModelBase *model = getJSModel( jsID, false );
                if( model != NULL )
                {
                    CCModelBase *child = getJSModel( childID );
                    if( child != NULL )
                    {
                        model->addModel( child );
                    }
                }
                return true;
            }
        }

        else if( CCText::Equals( command, "CCModelBase.removeModel" ) )
        {
            if( parameters.length == 3 )
            {
                const long jsID = atol( parameters.list[1] );
                const long childID = atol( parameters.list[2] );

                CCModelBase *model = getJSModel( jsID, false );
                if( model != NULL )
                {
                    CCModelBase *child = getJSModel( childID );
                    if( child != NULL )
                    {
                        model->removeModel( child );
                    }
                }
                return true;
            }
        }

        else if( CCText::Equals( command, "CCModelBase.addPrimitive" ) )
        {
            if( parameters.length == 3 )
            {
                const long jsID = atol( parameters.list[1] );
                const char *primitiveID = parameters.list[2];

                CCModelBase *model = getJSModel( jsID, false );
                if( model != NULL )
                {
                    CCPrimitiveBase *primitive = getJSPrimitive( primitiveID, false );
                    if( primitive != NULL )
                    {
                        model->addPrimitive( primitive );
                    }
                }
                return true;
            }
        }
    }

    // CCPrimitiveBase
    else if( CCText::Equals( command, "CCPrimitiveBase.setTexture" ) )
    {
        if( parameters.length == 3 )
        {
            const char *primitiveID = parameters.list[1];
            const int jsTextureIndex = atoi( parameters.list[2] );

#ifdef DEBUGON
//			CCText debug = "CCPrimitiveBase.setTexture ";
//			debug += primitiveID;
//			debug += " ";
//			debug += jsTextureIndex;
//			debug += "\n";
//			DEBUGLOG( "%s", debug.buffer );
#endif

            CCPrimitiveBase *primitive = getJSPrimitive( primitiveID, false );
            if( primitive != NULL )
            {
                Image *image = NULL;
                for( int imageIndex=0; imageIndex<images.length; ++imageIndex )
                {
                    Image *imageItr = images.list[imageIndex];
                    if( imageItr->jsIndex == jsTextureIndex )
                    {
                        image = imageItr;
                        break;
                    }
                }
                CCASSERT( image != NULL )
                if( image != NULL )
                {
                    primitive->setTextureHandleIndex( image->handleIndex );
                }
            }
            return true;
        }
    }
    else if( CCText::Equals( command, "CCPrimitiveBase.adjustTextureUVs" ) )
    {
        if( parameters.length == 3 )
        {
            const char *primitiveID = parameters.list[1];
            const int jsTextureIndex = atoi( parameters.list[2] );

#ifdef DEBUGON
//		CCText debug = "CCPrimitiveBase.adjustTextureUVs ";
//		debug += primitiveID;
//		debug += " ";
//		debug += jsTextureIndex;
//		debug += "\n";
//		DEBUGLOG( "%s", debug.buffer );
#endif

            CCPrimitiveBase *primitive = getJSPrimitive( primitiveID, false );
            if( primitive != NULL )
            {
                Image *image = NULL;
                for( int imageIndex=0; imageIndex<images.length; ++imageIndex )
                {
                    Image *imageItr = images.list[imageIndex];
                    if( imageItr->jsIndex == jsTextureIndex )
                    {
                        image = imageItr;
                        break;
                    }
                }
                CCASSERT( image != NULL );
                if( image != NULL )
                {
                    primitive->setTextureHandleIndex( image->handleIndex );
                }
            }
            return true;
        }
    }

    else if( CCText::Equals( command, "CCPrimitive3D.moveVerticesToOrigin" ) )
    {
        if( parameters.length == 2 )
        {
            const char *primitiveID = parameters.list[1];

            CCPrimitive3D *primitive = (CCPrimitive3D*)getJSPrimitive( primitiveID );
            if( primitive != NULL )
            {
                primitive->moveVerticesToOriginAsync();
            }
            return true;
        }
    }

    else if( CCText::Equals( command, "CCPrimitive3D.getYMinMaxAtZ" ) )
    {
        if( parameters.length == 4 )
        {
            const char *primitiveID = parameters.list[1];
            const char *sourcePrimitiveID = parameters.list[2];

            CCPrimitive3D *sourcePrimitive = (CCPrimitive3D*)getJSPrimitive( sourcePrimitiveID );
            if( sourcePrimitive != NULL )
            {
                const float atZ = (float)atof( parameters.list[3] );
                const CCMinMax mmYAtZ = sourcePrimitive->getYMinMaxAtZ( atZ );

                static CCText script;
                script = "CCPrimitive3D.ReturnYMinMaxAtZ( ";
                script += primitiveID;
                script += ", { ";

                {
                    script += "\"min\":";
                    script += mmYAtZ.min;
                    script += ", \"max\":";
                    script += mmYAtZ.max;
                }

                script += " } );";
                CCAppManager::WebJSRunJavaScript( script.buffer, false, false );
            }
            return true;
        }
    }

    // CCPrimitiveFBX
    else if( CCText::Contains( command, "CCPrimitiveFBX." ) )
    {
        if( CCText::Equals( command, "CCPrimitiveFBX.construct" ) )
        {
            if( parameters.length == 2 )
            {
                const char *primitiveID = parameters.list[1];

                CCJSPrimitiveFBX *primitive = new CCJSPrimitiveFBX( primitiveID );
                jsPrimitiveFBXs.add( primitive );
                jsPrimitives.add( primitive );
                return true;
            }
        }

        else if( CCText::Equals( command, "CCPrimitiveFBX.destruct" ) )
        {
            if( parameters.length == 2 )
            {
                const char *primitiveID = parameters.list[1];

#ifdef DEBUGON
                CCText debug = "CCPrimitiveFBX.destruct ";
                debug += primitiveID;
                debug += "\n";
                DEBUGLOG( "%s", debug.buffer );
#endif

                CCJSPrimitiveFBX *primitive = getJSPrimitiveFBX( primitiveID );
                if( primitive != NULL )
                {
                    deletePrimitiveFBX( primitive );
                }
                return true;
            }
        }

        else if( CCText::Equals( command, "CCPrimitiveFBX.load" ) )
        {
            if( parameters.length == 4 )
            {
                const char *primitiveID = parameters.list[1];
                const char *url = parameters.list[2];
                const char *filename = parameters.list[3];

                load3DPrimitive( primitiveID, url, filename );
                return true;
            }
        }

        else if( CCText::Equals( command, "CCPrimitiveFBX.addSubmesh" ) )
        {
            if( parameters.length == 4 )
            {
                const char *primitiveID = parameters.list[1];

                CCJSPrimitiveFBX *primitive = getJSPrimitiveFBX( primitiveID, false );
                if( primitive != NULL )
                {
                    const int count = atoi( parameters.list[2] );
                    const int offset = atoi( parameters.list[3] );
                    primitive->addSubmesh( count, offset );
                }
                return true;
            }
        }

        else if( CCText::Equals( command, "CCPrimitiveFBX.copy" ) )
        {
            if( parameters.length == 3 )
            {
                const char *primitiveID = parameters.list[1];
                CCJSPrimitiveFBX *primitive = getJSPrimitiveFBX( primitiveID, false );
                if( primitive != NULL )
                {
                    const char *sourcePrimitiveID = parameters.list[2];
                    CCJSPrimitiveFBX *sourcePrimitive = getJSPrimitiveFBX( sourcePrimitiveID, false );
                    if( sourcePrimitive != NULL )
                    {
                        primitive->copy( sourcePrimitive );
                    }
                }
                return true;
            }
        }

        else if( CCText::Equals( command, "CCPrimitiveFBX.interpolateFrames" ) )
        {
            if( parameters.length == 7 )
            {
                const char *primitiveID = parameters.list[1];
                CCJSPrimitiveFBX *primitive = getJSPrimitiveFBX( primitiveID, false );
                if( primitive != NULL )
                {
                    const int currentAnimationIndex = atoi( parameters.list[2] );
                    const int currentFrameIndex = atoi( parameters.list[3] );

                    const int nextAnimationIndex = atoi( parameters.list[4] );
                    const int nextFrameIndex = atoi( parameters.list[5] );

                    const float frameDelta = (float)atof( parameters.list[6] );
                    primitive->interpolateFrames( currentAnimationIndex, currentFrameIndex, nextAnimationIndex, nextFrameIndex, frameDelta );
                }
                return true;
            }
        }
    }

    // CCPrimitiveOBJ
    else if( CCText::Contains( command, "CCPrimitiveOBJ." ) )
    {
        if( CCText::Equals( command, "CCPrimitiveOBJ.destruct" ) )
        {
            if( parameters.length == 2 )
            {
                const char *primitiveID = parameters.list[1];

#ifdef DEBUGON
                CCText debug = "CCPrimitiveOBJ.destruct ";
                debug += primitiveID;
                debug += "\n";
                DEBUGLOG( "%s", debug.buffer );
#endif

                CCJSPrimitiveOBJ *primitiveObj = getJSPrimitiveOBJ( primitiveID, false );
                if( primitiveObj != NULL )
                {
                    deletePrimitiveObj( primitiveObj );
                }
                return true;
            }
        }

        else if( CCText::Equals( command, "CCPrimitiveOBJ.load" ) )
        {
            if( parameters.length == 6 )
            {
                const char *primitiveID = parameters.list[1];
                const int vertexPositionBufferID = atoi( parameters.list[2] );
                const int vertexTextureBufferID = atoi( parameters.list[3] );

                CCJSPrimitiveOBJ *primitiveObj = new CCJSPrimitiveOBJ( this, primitiveID, vertexPositionBufferID, vertexTextureBufferID );
                jsPrimitiveOBJs.add( primitiveObj );
                jsPrimitives.add( primitiveObj );

                const char *url = parameters.list[4];
                const char *filename = parameters.list[5];

                load3DPrimitive( primitiveID, url, filename );
                return true;
            }
        }

        else if( CCText::Equals( command, "CCPrimitiveOBJ.reference" ) )
        {
            if( parameters.length == 5 )
            {
                const char *primitiveID = parameters.list[1];
                const int vertexPositionBufferID = atoi( parameters.list[2] );
                const int vertexTextureBufferID = atoi( parameters.list[3] );

                CCJSPrimitiveOBJ *primitiveObj = new CCJSPrimitiveOBJ( this, primitiveID, vertexPositionBufferID, vertexTextureBufferID );
                jsPrimitiveOBJs.add( primitiveObj );
                jsPrimitives.add( primitiveObj );

                const char *filename = parameters.list[4];
                if( CCText::Equals( filename, gEngine->cameraRecorder->getCurrent().name ) )
                {
                    gEngine->cameraRecorder->getCurrent().linked.addOnce( primitiveObj );
                }

                return true;
            }
        }

        else if( CCText::Equals( command, "CCPrimitiveOBJ.copy" ) )
        {
            if( parameters.length == 4 )
            {
                const char *primitiveID = parameters.list[1];
                const char *sourcePrimitiveID = parameters.list[2];
                const int vertexTextureBufferID = atoi( parameters.list[3] );

                CCJSPrimitiveOBJ *sourcePrimitiveObj = getJSPrimitiveOBJ( sourcePrimitiveID, false );
                if( sourcePrimitiveObj != NULL )
                {
                    CCJSPrimitiveOBJ *primitiveObj = new CCJSPrimitiveOBJ( this, primitiveID, -1, vertexTextureBufferID );
                    primitiveObj->copy( sourcePrimitiveObj );
                    jsPrimitiveOBJs.add( primitiveObj );
                    jsPrimitives.add( primitiveObj );
                }
                return true;
            }
        }
    }

    // CCPrimitiveSquare
    else if( CCText::Contains( command, "CCPrimitiveSquare." ) )
    {
        if( CCText::Equals( command, "CCPrimitiveSquare.construct" ) )
        {
            if( parameters.length == 2 )
            {
                const char *primitiveID = parameters.list[1];

                CCPrimitiveSquare *primitiveSquare = new CCPrimitiveSquare( primitiveID );
                jsPrimitiveSquares.add( primitiveSquare );
                jsPrimitives.add( primitiveSquare );
                return true;
            }
        }

        else if( CCText::Equals( command, "CCPrimitiveSquare.destruct" ) )
        {
            if( parameters.length == 2 )
            {
                const char *primitiveID = parameters.list[1];

#ifdef DEBUGON
                CCText debug = "CCPrimitiveSquare.destruct ";
                debug += primitiveID;
                debug += "\n";
                DEBUGLOG( "%s", debug.buffer );
#endif

                CCPrimitiveSquare *primitiveSquare = getJSPrimitiveSquare( primitiveID );
                if( primitiveSquare != NULL )
                {
                    deletePrimitiveSquare( primitiveSquare );
                }
                return true;
            }
        }

        else if( CCText::Equals( command, "CCPrimitiveSquare.setScale" ) )
        {
            if( parameters.length == 5 )
            {
                const char *primitiveID = parameters.list[1];
                const float width = (float)atof( parameters.list[2] );
                const float height = (float)atof( parameters.list[3] );
                const float depth = (float)atof( parameters.list[4] );

                CCPrimitiveSquare *primitiveSquare = getJSPrimitiveSquare( primitiveID, false );
                if( primitiveSquare != NULL )
                {
                    primitiveSquare->setScale( width, height, depth );
                }
                return true;
            }
        }

        else if( CCText::Equals( command, "CCPrimitiveSquare.removeTexture" ) )
        {
            if( parameters.length == 2 )
            {
                const char *primitiveID = parameters.list[1];

                CCPrimitiveSquare *primitiveSquare = getJSPrimitiveSquare( primitiveID );
                if( primitiveSquare != NULL )
                {
                    primitiveSquare->removeTexture();
                }
                return true;
            }
        }

        else if( CCText::Equals( command, "CCPrimitiveSquare.setVertexBufferID" ) )
        {
            if( parameters.length == 3 )
            {
                const char *primitiveID = parameters.list[1];
                const int vertexPositionBufferID = atoi( parameters.list[2] );

                CCPrimitiveSquare *primitiveSquare = getJSPrimitiveSquare( primitiveID );
                if( primitiveSquare != NULL )
                {
                    float *buffer = getVertexFloatBuffer( vertexPositionBufferID );
                    if( buffer != NULL )
                    {
                        primitiveSquare->setCustomVertexPositionBuffer( buffer );
                    }
                }
                return true;
            }
        }

        else if( CCText::Equals( command, "CCPrimitiveSquare.setTextureUVs" ) )
        {
            if( parameters.length == 6 )
            {
                const char *primitiveID = parameters.list[1];
                const float x1 = (float)atof( parameters.list[2] );
                const float y1 = (float)atof( parameters.list[3] );
                const float x2 = (float)atof( parameters.list[4] );
                const float y2 = (float)atof( parameters.list[5] );

                CCPrimitiveSquare *primitiveSquare = getJSPrimitiveSquare( primitiveID );
                if( primitiveSquare != NULL )
                {
                    primitiveSquare->setTextureUVs( x1, y1, x2, y2 );
                }
                return true;
            }
        }

        else if( CCText::Equals( command, "CCPrimitiveSquare.flipY" ) )
        {
            if( parameters.length == 2 )
            {
                const char *primitiveID = parameters.list[1];

                CCPrimitiveSquare *primitiveSquare = getJSPrimitiveSquare( primitiveID );
                if( primitiveSquare != NULL )
                {
                    primitiveSquare->flipY();
                }
                return true;
            }
        }
    }

    return false;
}



CCJSScene* CCJSEngine::getJSScene(const char *jsID, const bool assertOnFail)
{
    for( int i=0; i<jsScenes.length; ++i )
    {
        CCJSScene *itr = jsScenes.list[i];
        if( CCText::Equals( itr->getSceneID(), jsID ) )
        {
            return itr;
        }
    }

    if( assertOnFail )
    {
        CCASSERT( false );
    }
    return NULL;
}


CCJSCamera* CCJSEngine::getJSCamera(const char *jsID, const bool assertOnFail)
{
    for( int i=0; i<jsCameras.length; ++i )
    {
        CCJSCamera *itr = jsCameras.list[i];
        if( CCText::Equals( itr->getCameraID(), jsID ) )
        {
            return itr;
        }
    }

    if( assertOnFail )
    {
        CCASSERT( false );
    }
    return NULL;
}


CCRenderable* CCJSEngine::getJSRenderable(const long jsID, const bool assertOnFail)
{
    for( int i=0; i<jsRenderables.length; ++i )
    {
        CCRenderable *itr = jsRenderables.list[i];
        if( itr->getJSID() == jsID )
        {
            return itr;
        }
    }

    if( assertOnFail )
    {
        CCASSERT( false );
    }
    return NULL;
}


CCObject* CCJSEngine::getJSObject(const long jsID, const bool assertOnFail)
{
    for( int i=0; i<jsObjects.length; ++i )
    {
        CCObject *itr = jsObjects.list[i];
        if( itr->getJSID() == jsID )
        {
            return itr;
        }
    }

    if( assertOnFail )
    {
        CCASSERT( false );
    }
    return NULL;
}


CCObjectText* CCJSEngine::getJSText(const long jsID, const bool assertOnFail)
{
    for( int i=0; i<jsTexts.length; ++i )
    {
        CCObjectText *itr = jsTexts.list[i];
        if( itr->getJSID() == jsID )
        {
            return itr;
        }
    }

    if( assertOnFail )
    {
        CCASSERT( false );
    }
    return NULL;
}


CCJSCollideable* CCJSEngine::getJSCollideable(const long jsID, const bool assertOnFail)
{
    for( int i=0; i<jsCollideables.length; ++i )
    {
        CCJSCollideable *itr = jsCollideables.list[i];
        if( itr->getJSID() == jsID )
        {
            return itr;
        }
    }

    if( assertOnFail )
    {
        CCASSERT( false );
    }
    return NULL;
}


CCModelBase* CCJSEngine::getJSModel(const long jsID, const bool assertOnFail)
{
    for( int i=0; i<jsModels.length; ++i )
    {
        CCModelBase *itr = jsModels.list[i];
        if( itr->getJSID() == jsID )
        {
            return itr;
        }
    }

    if( assertOnFail )
    {
        CCASSERT( false );
    }
    return NULL;
}


CCPrimitiveBase* CCJSEngine::getJSPrimitive(const char *jsID, const bool assertOnFail)
{
    for( int i=0; i<jsPrimitives.length; ++i )
    {
        CCPrimitiveBase *itr = jsPrimitives.list[i];
        if( CCText::Equals( itr->getPrimitiveID(), jsID ) )
        {
            return itr;
        }
    }

    if( assertOnFail )
    {
        CCASSERT( false );
    }
    return NULL;
}


CCJSPrimitiveFBX* CCJSEngine::getJSPrimitiveFBX(const char *jsID, const bool assertOnFail)
{
    for( int i=0; i<jsPrimitiveFBXs.length; ++i )
    {
        CCJSPrimitiveFBX *itr = jsPrimitiveFBXs.list[i];
        if( CCText::Equals( itr->getPrimitiveID(), jsID ) )
        {
            return itr;
        }
    }

    if( assertOnFail )
    {
        CCASSERT( false );
    }
    return NULL;
}


CCJSPrimitiveOBJ* CCJSEngine::getJSPrimitiveOBJ(const char *jsID, const bool assertOnFail)
{
    for( int i=0; i<jsPrimitiveOBJs.length; ++i )
    {
        CCJSPrimitiveOBJ *itr = jsPrimitiveOBJs.list[i];
        if( CCText::Equals( itr->getPrimitiveID(), jsID ) )
        {
            return itr;
        }
    }

    if( assertOnFail )
    {
        CCASSERT( false );
    }
    return NULL;
}


CCPrimitiveSquare* CCJSEngine::getJSPrimitiveSquare(const char *jsID, const bool assertOnFail)
{
    for( int i=0; i<jsPrimitiveSquares.length; ++i )
    {
        CCPrimitiveSquare *itr = jsPrimitiveSquares.list[i];
        if( CCText::Equals( itr->getPrimitiveID(), jsID ) )
        {
            return itr;
        }
    }

    if( assertOnFail )
    {
        CCASSERT( false );
    }
    return NULL;
}


void CCJSEngine::deleteScene(CCJSScene *scene)
{
    if( scene->getCameraJS() != NULL )
    {
        CCJSCamera *camera = scene->getCameraJS();
        if( camera != NULL )
        {
#ifdef DEBUGON
			CCText debug = "CCEngine.deleteSceneCamera ";
			debug += camera->getCameraID();
			debug += "\n";
			DEBUGLOG( "%s", debug.buffer );
#endif

            jsCameras.remove( camera );
            delete camera;
        }
    }

#ifdef DEBUGON
		CCText debug = "CCEngine.deleteScene ";
		debug += scene->getSceneID();
		debug += "\n";
		DEBUGLOG( "%s", debug.buffer );
#endif

    jsScenes.remove( scene );
    scene->clearCollideables();

    delete scene;
}


void CCJSEngine::deleteCollideable(CCJSCollideable *collideable)
{
    gEngine->collisionManager.removeCollideable( collideable );
    jsCollideables.remove( collideable );
    jsObjects.remove( collideable );
    jsRenderables.remove( collideable );

    delete collideable; // No destruct call as it doesn't have a parent

}


void CCJSEngine::deleteText(CCObjectText *objectText)
{
    jsTexts.remove( objectText );
    jsObjects.remove( objectText );
    jsRenderables.remove( objectText );

    delete objectText;              // No destruct call as it doesn't have a parent
}


void CCJSEngine::deleteObject(CCObject *object)
{
    jsObjects.remove( object );
    jsRenderables.remove( object );

    delete object;              // No destruct call as it doesn't have a parent
}


void CCJSEngine::deleteModel(CCModelBase *model)
{
    jsModels.remove( model );
    jsRenderables.remove( model );

    // Cleared via javascript pipeline
    model->models.clear();
    model->primitives.clear();
    DELETE_OBJECT( model );
}


void CCJSEngine::deletePrimitiveFBX(CCJSPrimitiveFBX *primitiveFBX)
{
    jsPrimitiveFBXs.remove( primitiveFBX );
    jsPrimitives.remove( primitiveFBX );
    DELETE_OBJECT( primitiveFBX );
}


void CCJSEngine::deletePrimitiveObj(CCJSPrimitiveOBJ *primitiveObj)
{
    jsPrimitiveOBJs.remove( primitiveObj );
    jsPrimitives.remove( primitiveObj );

    // Remove any linked primitives
    gEngine->cameraRecorder->unlink( primitiveObj );

    DELETE_OBJECT( primitiveObj );
}


void CCJSEngine::deletePrimitiveSquare(CCPrimitiveSquare *primitiveSquare)
{
    jsPrimitiveSquares.remove( primitiveSquare );
    jsPrimitives.remove( primitiveSquare );
    DELETE_OBJECT( primitiveSquare )
}


void CCJSEngine::GetAsset(const char *file, const char *url, CCLambdaCallback *callback)
{
    CCText filename = file;
    filename.stripDirectory();

    class ServerCallback : public CCURLCallback
    {
    public:
        ServerCallback(CCLambdaCallback *callback)
        {
            this->callback = callback;
        }

        void run()
        {
            if( reply->state >= CCURLRequest::succeeded )
            {
                // Failed
                if( reply->data.length > 0 )
                {
                    callback->runParameters = (void*)true;
                }
                else
                {
                    CCFileManager::DeleteCachedFile( reply->cacheFile.buffer );
                }
            }
            callback->safeRun();
            delete callback;
        }

    private:
        CCLambdaCallback *callback;
    };

    CCText downloadUrl;
    if( url != NULL )
    {
        downloadUrl = url;
    }
    else
    {
        downloadUrl = _PLAYIR_SERVER_URL;
        downloadUrl += "assets/?file=";
        downloadUrl += filename.buffer;
    }
    gEngine->urlManager->requestURLAndCache( downloadUrl.buffer, new ServerCallback( callback ), 0, filename.buffer );
}
