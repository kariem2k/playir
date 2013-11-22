/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCJSEngine.h
 * Description : JS based engine proxy
 *
 * Created     : 24/03/13
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

class CCJSEngine : public virtual CCActiveAllocation
{
	bool webViewOpened;
    bool backButtonEnabled;

    bool jsUpdateRunning;
	float jsUpdateTime;
    CCText jsToCppCommands;                 // JS to Cpp commands

    CCList<CCText> pendingCppToJSCommands;  // Cpp to JS commands
    int numberOfCppToJSCommands;

    CCList<char> renderCommandsList;
    CCText renderCommandsListBuffer;


    struct VertexBufferFloat
    {
        VertexBufferFloat()
        {
            buffer = NULL;
            size = 0;
        }
        ~VertexBufferFloat()
        {
            if( buffer != NULL )
            {
                gRenderer->derefVertexPointer( ATTRIB_VERTEX, buffer );
                free( buffer );
                buffer = NULL;
            }
        }
        int id;
        float *buffer;
        int size;
    };
    CCList<VertexBufferFloat> vertexBufferFloats;


    struct VertexBufferUInt
    {
        VertexBufferUInt()
        {
            buffer = NULL;
            size = 0;
        }
        ~VertexBufferUInt()
        {
            if( buffer != NULL )
            {
                free( buffer );
                buffer = NULL;
            }
        }
        int id;
        ushort *buffer;
        int size;
    };
    CCList<VertexBufferUInt> vertexBufferUInts;
    VertexBufferUInt *currentVertexIndexBuffer; // TEMP: Until we move to VBOs


    struct Image
    {
        int jsIndex;
        uint handleIndex;
        CCText file;
        float width, height;
        float allocatedWidth, allocatedHeight;

        bool mipmap;
    };
    CCList<Image> images;

    struct Download
    {
        CCText id;
        CCText url;
        CCPairList<CCText,CCData> postData;
        CCText cacheFile;
        int cacheFileTimeoutSeconds;    // Time before our cache becomes invalid
        float timeout;
        bool returnBinary;
    };

    CCList<CCJSScene> jsScenes;
    CCList<CCJSCamera> jsCameras;

    CCList<CCRenderable> jsRenderables;

    CCList<CCObject> jsObjects;
    CCList<CCObjectText> jsTexts;
    CCList<CCJSCollideable> jsCollideables;

    CCList<CCModelBase> jsModels;
    CCList<CCPrimitiveBase> jsPrimitives;

    CCList<CCJSPrimitiveFBX> jsPrimitiveFBXs;
    CCList<CCJSPrimitiveOBJ> jsPrimitiveOBJs;
    CCList<CCPrimitiveSquare> jsPrimitiveSquares;


public:
    CCJSEngine();
    void startup();
    
    virtual ~CCJSEngine();

public:
    void runJSUpdate();
    void runNativeUpdate();

    void resized();

    void pause();
    void resume();

    void touchBegin(const int index, const float x, const float y);
    void touchMove(const int index, const float x, const float y);
    void touchEnd(const int index);
    void touchSetMovementThreashold();

    bool shouldHandleBackButton();
    void handleBackButton();

    void keyboardUpdate(const char *key);
    void webViewUpdate(const char *url);

    void addCppToJSCommand(const char *command);

    bool CCBindVertexTextureBuffer(const int vertexBufferID);
    bool CCBindVertexPositionBuffer(const int vertexBufferID);
    bool CCBindVertexIndexBuffer(const int vertexBufferID);

    float* getVertexFloatBuffer(const int vertexBufferID);
    ushort* getVertexUIntBuffer(const int vertexBufferID);

    void updateVertexBufferPointer(const int vertexBufferID, float *buffer, const bool assertOnFail=true);
    void deleteVertexBufferPointer(const int vertexBufferID, const bool assertOnFail=true);

protected:
    void referenceImage(const int jsIndex, const char *url, const bool mipmap);

    void downloadImage(const int jsIndex, const char *url, const bool mipmap);
    void downloadedImage(Image *image, const CCResourceType resourceType, const bool success);
    void loadedImage(Image *image, const CCTextureBase *texture);
public:
    void loadedReferencedImage(const char *file, const CCTextureBase *texture);

protected:
    void load3DPrimitive(const char *primitiveID, const char *url, const char *filename);
    void downloaded3DPrimitive(const char *primitiveID, CCURLRequest *reply);

    void downloadURL(Download *download, const int priority);
    void downloadedURL(Download *download, CCURLRequest *reply);

public:
    void registerNextFrameCommands(const char *commands);

protected:
    void processSyncCommands(CCText &jsCommands);
    void processUpdateCommands(CCText &jsCommands);
    void processRenderCommands(CCList<char> &commands);

    bool processRenderCommands(const char *command, CCList<char> &parameters);
    bool processMatrixCommands(const char *command, CCList<char> &parameters);
    bool processSceneCommands(const char *command, CCList<char> &parameters);


    CCJSScene* getJSScene(const char *jsID, const bool assertOnFail=true);
    CCJSCamera* getJSCamera(const char *jsID, const bool assertOnFail=true);

    CCRenderable* getJSRenderable(const long jsID, const bool assertOnFail=true);
    CCObject* getJSObject(const long jsID, const bool assertOnFail=true);
    CCObjectText* getJSText(const long jsID, const bool assertOnFail=true);
    CCJSCollideable* getJSCollideable(const long jsID, const bool assertOnFail=true);
    CCModelBase* getJSModel(const long jsID, const bool assertOnFail=true);

    CCPrimitiveBase* getJSPrimitive(const char *jsID, const bool assertOnFail=true);
    CCJSPrimitiveFBX* getJSPrimitiveFBX(const char *jsID, const bool assertOnFail=true);
    CCJSPrimitiveOBJ* getJSPrimitiveOBJ(const char *jsID, const bool assertOnFail=true);
    CCPrimitiveSquare* getJSPrimitiveSquare(const char *jsID, const bool assertOnFail=true);

    void deleteScene(CCJSScene *scene);

    void deleteCollideable(CCJSCollideable *collideable);
    void deleteText(CCObjectText *objectText);
    void deleteObject(CCObject *object);
    void deleteModel(CCModelBase *model);
    void deleteRenderable(CCRenderable *renderable);

    void deletePrimitiveFBX(CCJSPrimitiveFBX *primitiveFBX);
    void deletePrimitiveObj(CCJSPrimitiveOBJ *primitiveObj);
    void deletePrimitiveSquare(CCPrimitiveSquare *primitiveSquare);

public:
    static void GetAsset(const char *file, const char *url, CCLambdaCallback *callback);
};

