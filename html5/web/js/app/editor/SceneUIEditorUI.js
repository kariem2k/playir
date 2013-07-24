/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : SceneUIEditorUI.js
 * Description : UI for our in UI editor
 *
 * Created     : 01/06/13
 *-----------------------------------------------------------
 */

function SceneUIEditorUI(editor, manager)
{
    this.construct();

    this.manager = manager;
    {
        this.editor = editor;

        // If our parent scene is removed, remove this scene as well
        manager.linkScene( this );
    }

    {
        var parentCameraIndex = gEngine.findCameraIndex( editor.camera );

        var camera = gEngine.newSceneCamera( this, parentCameraIndex-1 );
        camera.setupViewport( 0.0, 0.0, 1.0, 1.0 );
    }

    this.sceneUIListObjects = null;
    this.sceneUIListModels = null;
    this.sceneAssetEditor = null;

    this.selectionBoxActive = false;

    gEngine.addScene( this );
}
ExtendPrototype( SceneUIEditorUI, SceneEditorUI );


SceneUIEditorUI.prototype.resize = function()
{
    this.SceneEditorUI_resize();

    var camera = this.camera;
    var tile;
    {
        tile = this.tileBackground;
        var width = camera.targetWidth * 0.55;
        var height = (720.0/1080.0) * width;
        tile.setTileSize( width, height );
    }
};


SceneUIEditorUI.prototype.setupUI = function()
{
    var self = this;
    var camera = this.camera;

    var tile;

    {
        tile = new CCTile3DButton( this );
        tile.setupTile();
        tile.setTileTexture( "resources/editor/editor_tabletscreen.png" );
        tile.setColour( gColour.set( 1.0, 0.0 ) );
        tile.setColourAlpha( 1.0, true );

        tile.setDrawOrder( 200 );

        this.cameraStickyTiles.add( tile );

        this.tileBackground = tile;
    }

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
                self.manager.handleDelete();
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
                self.manager.handleEditName();
            });
            this.addTile( tile, 0 );
            bottomMenuTiles.add( tile );

            this.tileName = tile;
        }

        {
            tile = new CCTile3DButton( this );
            tile.setupTile( 1.0 );
            tile.setColour( gColour.set( 1.0, 0.0 ) );
            tile.setDrawOrder( 204 );

            tile.onRelease.push( function()
            {
                self.manager.handleEditPrivacy();
            });
            this.addTile( tile, 0 );
            bottomMenuTiles.add( tile );

            this.tilePrivacy = tile;
        }

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

            this.tileID = tile;
        }

        {
            tile = new CCTile3DButton( this );
            tile.setupTextured( "resources/editor/editor_icon_js.jpg", function()
            {
                self.requestResize();
            });
            tile.setupTile( 1.0 );
            tile.setColour( gColour.set( 1.0, 0.0 ) );
            tile.setDrawOrder( 204 );

            tile.onRelease.push( function()
            {
                self.manager.handleEditJS();
            });
            this.addTile( tile, 0 );
            bottomMenuTiles.add( tile );

            this.tileEditJS = tile;
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
                self.manager.handleBackButton();
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


SceneUIEditorUI.prototype.setupMenu = function(info)
{
    var id = info.id;
    var name = info.name;
    var open = info.open;

    var self = this;

    var camera = this.camera;
    var bottomMenuTiles = this.bottomMenuTiles;
    var sideMenuTiles = this.sideMenuTiles;
    var tile, i;

    for( i=0; i<bottomMenuTiles.length; ++i )
    {
        tile = bottomMenuTiles[i];
        tile.setCollideable( true );

        if( tile === this.tileID )
        {
            tile.setText( id, true );
            tile.setTextColourAlpha( 1.0, true );
        }
        else if( tile === this.tileName )
        {
            tile.setText( name, true );
            tile.setTextColourAlpha( 1.0, true );
        }
        else if( tile === this.tilePrivacy )
        {
            if( open )
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


SceneUIEditorUI.prototype.hideMenu = function(shouldDelete)
{
    this.tileBackground.getColourInterpolator().setDuration( 0.1 );
    this.tileBackground.setColourAlpha( 0.0, true );

    this.objectEditorClose();
    this.closeAssetEditor();

    this.SceneEditorUI_hideMenu( shouldDelete );
};


SceneUIEditorUI.prototype.handleSelectionButton = function()
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


SceneUIEditorUI.prototype.handleCreateButton = function()
{
    this.creatingObjects = !this.creatingObjects;
    if( this.creatingObjects )
    {
        if( this.selectionBoxActive )
        {
            this.handleSelectionButton();
        }

        this.objectEditorClose();
        this.tileCreate.setColour( gColour.setRGBA( 0.25, 0.5, 1.0, 1.0 ), true );
    }
    else
    {
        this.tileCreate.setColour( gColour.setRGBA( 1.0, 1.0, 1.0, 1.0 ), true );
    }

    // See if it'll affect our selected objects
    this.editor.selectedObjectsUpdated();
};


SceneUIEditorUI.prototype.objectEditorOpen = function(objects)
{
    if( !this.sceneUIListObjects )
    {
        this.sceneUIListObjects = new SceneUIListUIObjects( this, this.editor );
    }

    this.sceneUIListObjects.showObjects( objects );
};


SceneUIEditorUI.prototype.objectEditorClose = function()
{
    if( this.sceneUIListObjects )
    {
        this.sceneUIListObjects.close();
        this.sceneUIListObjects = null;
    }
};


SceneUIEditorUI.prototype.openAssetEditor = function(title, supportObj, callback)
{
    if( this.sceneAssetEditor )
    {
        this.closeAssetEditor();
    }

    this.sceneAssetEditor = new SceneAssetEditor( this, supportObj );
    this.sceneAssetEditor.open( title );

    var self = this;
    this.sceneAssetEditor.onClose = function(tex)
    {
        if( tex )
        {
            if( self.sceneAssetEditor && self.sceneAssetEditor.sceneUIListImages )
            {
                self.sceneAssetEditor.sceneUIListImages.findAndSelect( tex );
            }
        }

        if( callback )
        {
            callback( tex );
        }
    };

    if( callback )
    {
        this.sceneAssetEditor.onClose = callback;
    }
};


SceneUIEditorUI.prototype.closeAssetEditor = function()
{
    if( this.sceneAssetEditor )
    {
        this.sceneAssetEditor.close();
        this.sceneAssetEditor = null;
    }
};
