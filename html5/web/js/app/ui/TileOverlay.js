/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : TileOverlay.js
 * Description : A tile which has another tile overlayed (i.e for healthbars)
 *
 * Created     : 18/06/13
 *-----------------------------------------------------------
 */

function TileOverlay(scene, frameSrc, overlaySrc)
{
    this.construct( scene );
    this.aspectRatioLocked = true;

    if( !frameSrc )
    {
        frameSrc = "resources/common/uigame/ui_health_bar.png";
    }

    if( !overlaySrc )
    {
        overlaySrc = "resources/common/uigame/ui_health_bar_energy.png";
    }

    // Frame
    {
        this.getTileScaleInterpolator().setDuration( 0.25 );
        this.setDrawOrder( 201 );

        this.setTileSize();
        this.setTileTexture( frameSrc );
    }

    // Overlay
    {
        tile = new CCTile3DButton();
        tile.getTileScaleInterpolator().setDuration( 0.25 );
        tile.setTileSize();
        tile.setTileTexture( overlaySrc );
        this.tileOverlay = tile;

        this.addChild( tile, true );
    }

    this.amount = 1.0;
}
ExtendPrototype( TileOverlay, CCTile3DButton );


TileOverlay.prototype.setAmount = function(amount)
{
    amount = CC.FloatClamp( amount, 0.0, 1.0 );
    this.amount = amount;
    if( this.tileOverlay )
    {
        amount *= 0.9;
        amount += 0.05;
        this.tileOverlay.setTileSize( this.collisionSize.width * amount, this.collisionSize.height );
        if( this.flipped )
        {
            this.tileOverlay.getTileSquare().setTextureUVs( amount, 0.0, 0.0, 1.0 );
            this.tileOverlay.setPositionX( this.collisionBounds[0] - this.tileOverlay.collisionBounds[0] );
        }
        else
        {
            this.tileOverlay.getTileSquare().setTextureUVs( 0.0, 0.0, amount, 1.0 );
            this.tileOverlay.setPositionX( -this.collisionBounds[0] + this.tileOverlay.collisionBounds[0] );
        }
        this.tileOverlay.setColourAlpha( 0.5 + ( amount * 0.5 ), true );
    }
};


TileOverlay.prototype.setTileSize = function(width, height, depth)
{
    this.CCTile3DButton_setTileSize( width, height, depth );
    if( this.tileOverlay )
    {
        this.tileOverlay.setTileSize( width, height, depth );
    }
};


TileOverlay.prototype.flipTileY = function()
{
    this.CCTile3DButton_flipTileY();
    if( this.tileOverlay )
    {
        this.tileOverlay.flipTileY();
    }

    this.flipped = !this.flipped;
};
