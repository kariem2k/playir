/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : SceneManagerAndroids.js
 * Description : Androids game manager
 *
 * Created     : 03/10/12
 *-----------------------------------------------------------
 */

function SceneManagerAndroids()
{
    this.construct();
}
ExtendPrototype( SceneManagerAndroids, SceneManagerGame );


SceneManagerAndroids.prototype.construct = function()
{
    this.SceneManagerGame_construct();

    if( CCEngine.DeviceType === "iOS" )
    {
        this.playerType = "iBot";
    }
    else if( CCEngine.DeviceType === "Android" )
    {
        this.playerType = "androBot";
    }
    else if( CCEngine.DeviceType.contains( "Windows" ) )
    {
        this.playerType = "winBot";
    }
    else
    {
        this.playerType = "webBot";
    }

    gEngine.addScene( this );
};


SceneManagerAndroids.prototype.isUsablePlayer = function(launchShop)
{
    if( launchShop === undefined )
    {
        launchShop = true;
    }

    var allowedPlayerType = "webBot";
    if( CCEngine.DeviceType === "iOS" )
    {
        allowedPlayerType = "iBot";
    }
    else if( CCEngine.DeviceType === "Android" )
    {
        allowedPlayerType = "androBot";
    }
    else if( CCEngine.DeviceType.contains( "Windows" ) )
    {
        allowedPlayerType = "winBot";
    }

    if( !this.playerType.contains( allowedPlayerType ) )
    {
        var playerItemCode = "androids_switchTeams";

        var self = this;
        if( !SceneItemShop.HasPurchasedNonConsumable( playerItemCode ) )
        {
            if( launchShop )
            {
                new SceneItemShop( "Get coins to unlock\n all Phone Wars characters", playerItemCode, true, "unlock", "unlock", "unlock", function (type, itemCode, value)
                {
                    CC.SaveData( "shop." + playerItemCode + ".item", true );
                    self.scenePlayScreen.showPlayerView( self.playerType );
                });
            }
            return false;
        }
    }
    return true;
};
