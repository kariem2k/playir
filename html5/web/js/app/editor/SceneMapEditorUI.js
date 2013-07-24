/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : SceneMapEditorUI.js
 * Description : UI for our in game editor
 *
 * Created     : 20/11/12
 *-----------------------------------------------------------
 */

function SceneMapEditorUI(mapEditor, mapsManager)
{
    this.construct();

    this.mapsManager = mapsManager;
    {
        this.mapEditor = mapEditor;

        // If our parent scene is removed, remove this scene as well
        mapsManager.linkScene( this );
    }

    {
        var parentCameraIndex = gEngine.findCameraIndex( mapEditor.camera );

        var camera = gEngine.newSceneCamera( this, parentCameraIndex+1 );
        camera.setupViewport( 0.0, 0.0, 1.0, 1.0 );
    }

    this.sceneJSMapEditor = null;
    this.sceneUIListObjects = null;
    this.sceneUIListModels = null;
    this.sceneAssetEditor = null;

    this.selectionBoxActive = false;
}
ExtendPrototype( SceneMapEditorUI, SceneEditorUI );


SceneMapEditorUI.prototype.setupUI = function()
{
    var self = this;
    var camera = this.camera;

    var tile;

    var bottomMenuTiles = this.bottomMenuTiles;
    var sideMenuTiles = this.sideMenuTiles;
    {
        {
            tile = new CCTile3DButton( this );
            tile.setupTextured( "resources/editor/editor_icon_delete.jpg", function()
            {
                self.requestResize();
            });
            tile.setColour( gColour.setRGBA( 0.5, 0.0, 0.0, 0.0 ) );
            tile.setDrawOrder( 204 );

            tile.onRelease.push( function()
            {
                self.mapsManager.handleDeleteMap();
            });
            this.addTile( tile, 0 );
            bottomMenuTiles.add( tile );

            this.tileDelete = tile;
        }

        {
            tile = new CCTile3DButton( this );
            tile.setupText( " ", 1.0, true, true );
            tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
            tile.setColour( gColour.setRGBA( 0.5, 0.65, 1.0, 0.0 ) );
            tile.setTextColour( gColour.setRGBA( 1.0, 1.0, 1.0, 0.0 ) );
            tile.setColour( gColour.set( 0.55, 0.0 ) );

            tile.setDrawOrder( 204 );

            tile.onRelease.push( function()
            {
                self.mapsManager.handleEditName();
            });
            this.addTile( tile, 0 );
            bottomMenuTiles.add( tile );

            this.tileMapName = tile;
        }

        {
            tile = new CCTile3DButton( this );
            tile.setupTile( 1.0 );
            tile.setColour( gColour.set( 1.0, 0.0 ) );
            tile.setDrawOrder( 204 );

            tile.onRelease.push( function()
            {
                self.mapsManager.handleEditPrivacy();
            });
            this.addTile( tile, 0 );
            bottomMenuTiles.add( tile );

            this.tileMapPrivacy = tile;
        }

        // {
        //     tile = new CCTile3DButton( this );
        //     tile.setupTextured( "resources/editor/editor_icon_js.jpg", function()
        //     {
        //         self.requestResize();
        //     });
        //     tile.setColour( gColour.set( 1.0, 0.0 ) );
        //     tile.setDrawOrder( 204 );

        //     tile.onRelease.push( function()
        //     {
        //         self.mapsManager.handleEditJS();
        //     });
        //     this.addTile( tile, 0 );
        //     bottomMenuTiles.add( tile );

        //     this.tileJS = tile;
        // }

        {
            tile = new CCTile3DButton( this );
            tile.setupText( " ", 1.0, true, true );
            tile.setTileTexture( "resources/editor/editor_tile_background.jpg" );
            tile.setColour( gColour.setRGBA( 0.5, 0.65, 1.0, 0.0 ) );
            tile.setTextColour( gColour.setRGBA( 1.0, 1.0, 1.0, 0.0 ) );
            tile.setColour( gColour.set( 0.55, 0.0 ) );

            tile.setDrawOrder( 204 );

            this.addTile( tile, 0 );
            bottomMenuTiles.add( tile );

            this.tileMapID = tile;
        }
    }

    {
        {
            tile = new CCTile3DButton( this );
            tile.setupTexturedWidth( camera.cameraWidth * 0.1, "resources/editor/editor_tile_back.jpg", function()
            {
                self.requestResize();
            });
            tile.setColour( gColour.setRGBA( 1.0, 1.0, 1.0, 0.0 ) );
            tile.setDrawOrder( 204 );

            tile.onRelease.push( function()
            {
                self.mapsManager.handleBackButton();
            });
            this.addTile( tile, 0 );

            this.tileBack = tile;
            sideMenuTiles.add( tile );
        }

        {
            tile = new CCTile3DButton( this );
            tile.setupTexturedWidth( camera.cameraWidth * 0.1, "resources/editor/editor_tile_selection.jpg", function()
            {
                self.requestResize();
            });
            tile.setColour( gColour.setRGBA( 1.0, 1.0, 1.0, 0.0 ) );
            tile.setDrawOrder( 204 );

            tile.onRelease.push( function()
            {
                self.handleSelectionButton();
            });
            this.addTile( tile, 0 );

            this.tileSelection = tile;
            sideMenuTiles.add( tile );
        }

        {
            tile = new CCTile3DButton( this );
            tile.setupTexturedWidth( camera.cameraWidth * 0.1, "resources/editor/editor_tile_hammer.jpg", function()
            {
                self.requestResize();
            });
            tile.setColour( gColour.setRGBA( 1.0, 1.0, 1.0, 0.0 ) );
            tile.setDrawOrder( 204 );

            tile.onRelease.push( function()
            {
                self.handleCreateButton();
            });
            this.addTile( tile, 0 );

            this.tileCreate = tile;
            sideMenuTiles.add( tile );
        }
    }
};


SceneMapEditorUI.prototype.setupMenu = function(mapID, mapName, mapOpen)
{
    var self = this;

    var camera = this.camera;
    var bottomMenuTiles = this.bottomMenuTiles;
    var sideMenuTiles = this.sideMenuTiles;
    var tile, i;

    for( i=0; i<bottomMenuTiles.length; ++i )
    {
        tile = bottomMenuTiles[i];
        tile.setCollideable( true );

        if( tile === this.tileMapID )
        {
            tile.setText( mapID, true );
            tile.setTextColourAlpha( 1.0, true );
        }
        else if( tile === this.tileMapName )
        {
            tile.setText( mapName, true );
            tile.setTextColourAlpha( 1.0, true );
        }
        else if( tile === this.tileMapPrivacy )
        {
            if( mapOpen )
            {
                tile.setTileTexture( "resources/editor/editor_icon_public.jpg" );
            }
            else
            {
                tile.setTileTexture( "resources/editor/editor_icon_private.jpg" );
            }
        }

        tile.setColourAlpha( 1.0, true );
    }

    this.requestResize();

    this.showMenu();
};


SceneMapEditorUI.prototype.hideMenu = function(shouldDelete)
{
    this.objectEditorClose();
    this.closeModelsList();
    this.closeAssetEditor();

    this.SceneEditorUI_hideMenu( shouldDelete );
};


SceneMapEditorUI.prototype.handleSelectionButton = function()
{
    this.selectionBoxActive = !this.selectionBoxActive;
    if( this.selectionBoxActive )
    {
        if( this.creatingObjects )
        {
            this.handleCreateButton();
        }

        this.selectionBoxActive = true;
        this.tileSelection.setColour( gColour.setRGBA( 0.25, 0.5, 1.0, 1.0 ), true );
    }
    else
    {
        this.tileSelection.setColour( gColour.setRGBA( 1.0, 1.0, 1.0, 1.0 ), true );
    }
};


SceneMapEditorUI.prototype.handleCreateButton = function()
{
    this.creatingObjects = !this.creatingObjects;
    if( this.creatingObjects )
    {
        if( this.selectionBoxActive )
        {
            this.handleSelectionButton();
        }

        this.openModelsList();
        this.tileCreate.setColour( gColour.setRGBA( 0.25, 0.5, 1.0, 1.0 ), true );
    }
    else
    {
        this.closeModelsList();
        this.tileCreate.setColour( gColour.setRGBA( 1.0, 1.0, 1.0, 1.0 ), true );
    }

    // See if it'll affect our selected objects
    this.mapEditor.selectedObjectsUpdated();
};


SceneMapEditorUI.prototype.objectEditorOpen = function(objects)
{
    if( !this.sceneUIListObjects )
    {
        this.sceneUIListObjects = new SceneUIListMapObjects( this, this.mapEditor );
    }

    this.sceneUIListObjects.showObjects( objects );
};


SceneMapEditorUI.prototype.objectEditorClose = function()
{
    if( this.sceneUIListObjects )
    {
        this.sceneUIListObjects.close();
        this.sceneUIListObjects = null;
    }
};


SceneMapEditorUI.prototype.openModelsList = function()
{
    this.objectEditorClose();

    if( !this.sceneUIListModels )
    {
        var self = this;

        this.sceneUIListModels = new SceneUIListModels( this );
        this.sceneUIListModels.onSelected = function (modelInfo)
        {
            self.mapsManager.modelSelected( modelInfo.objectID );
        };
        this.sceneUIListModels.onEdit = function (modelInfo)
        {
            self.openAssetEditor( "Edit Model", true, false, function (modelInfo)
            {
                self.mapsManager.modelSelected( modelInfo.objectID );
            });
            self.sceneAssetEditor.setModel( modelInfo );
        };
    }
};


SceneMapEditorUI.prototype.updateModelsList = function(model, highlight)
{
    if( this.sceneUIListModels )
    {
        this.sceneUIListModels.modelUpdated( model, highlight );
    }

    return false;
};


SceneMapEditorUI.prototype.getSelectedModel = function()
{
    if( this.sceneUIListModels )
    {
        return this.sceneUIListModels.getSelected();
    }
    return null;
};


SceneMapEditorUI.prototype.closeModelsList = function()
{
    if( this.sceneUIListModels )
    {
        this.sceneUIListModels.close();
        this.sceneUIListModels = null;
    }
};


SceneMapEditorUI.prototype.flagPendingModelUpdate = function()
{
    if( this.sceneUIListModels )
    {
        this.sceneUIListModels.loaded = false;
    }
};


SceneMapEditorUI.prototype.findAndSelectModelID = function(modelID, callback)
{
    if( this.sceneUIListModels )
    {
        this.sceneUIListModels.findAndSelectID( modelID, callback );
    }
};


SceneMapEditorUI.prototype.openJSMapEditor = function(callback)
{
    if( this.sceneAssetEditor )
    {
        this.closeAssetEditor();
    }
    if( this.sceneJSMapEditor )
    {
        this.closeJSMapEditor();
    }

    this.hideMenu();

    this.sceneJSMapEditor = new SceneJSMapEditor( this );
    this.sceneJSMapEditor.open();

    if( callback )
    {
        this.sceneJSMapEditor.onClose = callback;
    }
};


SceneMapEditorUI.prototype.closeJSMapEditor = function()
{
    if( this.sceneJSMapEditor )
    {
        this.sceneJSMapEditor.close();
        this.sceneJSMapEditor = null;
    }
};


SceneMapEditorUI.prototype.openAssetEditor = function(title, supportObj, showLists, callback)
{
    if( this.sceneAssetEditor )
    {
        this.closeAssetEditor();
    }
    if( this.sceneJSMapEditor )
    {
        this.closeJSMapEditor();
    }

    this.sceneAssetEditor = new SceneAssetEditor( this, supportObj, showLists );
    this.sceneAssetEditor.open( title );

    if( callback )
    {
        this.sceneAssetEditor.onClose = callback;
    }
};


SceneMapEditorUI.prototype.closeAssetEditor = function()
{
    if( this.sceneAssetEditor )
    {
        this.sceneAssetEditor.close();
        this.sceneAssetEditor = null;
    }
};
