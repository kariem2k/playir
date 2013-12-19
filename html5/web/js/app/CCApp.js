/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCApp.js
 * Description : App start point.
 *
 * Created     : 02/10/12
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

var DEBUG_UseLocalServer = 0;
var DEBUG_SlowNetwork = 0;

if( !window.WINDOW_DOMAIN )
{
    window.WINDOW_DOMAIN = window.location.href;
}
WINDOW_DOMAIN = WINDOW_DOMAIN.getDomain();
if( window.location.href.startsWith( "http://localhost" ) ||
    window.location.href.startsWith( "http://192.168." ) )
{
    window.DEBUG_IsLocalClient = true;
}

if( !window.SERVER_ROOT )
{
    window.SERVER_ROOT = "";
}
SERVER_ROOT = SERVER_ROOT.resolveURL();
if( DEBUG_UseLocalServer )
{
    window.SERVER_ASSETS_URL = SERVER_ROOT;
}
else
{
    window.SERVER_ASSETS_URL = "http://playir.com/";
}
var CLIENT_VERSION = 17;
var FORCE_ONLINE = CC.GetJSLocationBarData( 'online' );

window.APP_ID = CC.GetJSLocationBarData( 'id', window.APP_ID );
if( !window.APP_ID )
{
    window.APP_ID = "multi";
}
window.LAUNCH_APP_ID = window.APP_ID;
window.DEFAULT_PURCHASE_ID = "topup_1";


CCEngine.prototype.start = function()
{
    JSManager.RemoveJSFiles();
    CCAudioManager.StopAll();
    this.textureManager.loadFont( "HelveticaNeueLight" );

    //gRenderer.renderFlags = CC.AddFlag( gRenderer.renderFlags, CCRenderer.render_collisionBoxes );
    //gRenderer.renderFlags = CC.AddFlag( gRenderer.renderFlags, CCRenderer.render_pathFinder );

    //FORCE_ONLINE = true;
    
    //window.APP_ID = "testgame";

    if( window.APP_ID === "testgame" )
    {
        TestGame();
    }
    else if( window.APP_ID === "testshop" )
    {
        setTimeout( function() {
            new SceneItemShop( "Get more coins", "topup_1", true, 1000, 10, 10, function (type, itemCode, value)
            {
                alert( type + " " + value );
            });
        }, 50 );
    }
    else if( window.APP_ID === "testperceptual" )
    {
        TestPerceptual();
    }
    else
    {
        var joinMapID = CC.GetJSLocationBarData( 'map' );
        if( joinMapID )
        {
            var joinPlayerType = CC.GetJSLocationBarData( 'player' );
            new SceneManagerJoinMap( joinMapID, joinPlayerType );
        }
        else
        {
            new SceneMultiManager();
        }
    }

    MultiplayerManager.DetectGeoLocation();
    MultiplayerManager.Connect();
};


function TestGame()
{
    var map = new SceneGame1vs1( null );

    //var objFile = "barbedwire.obj";
    //var texFile = "barbedwire_diffuse.png";
    //var objFile = "_knight.fbxi";
    //var objFile = "_humanoid.fbxi";
    //var objFile = "_boxxy.fbxi";
    //var objFile = "_boxxy.fbxi";
    var objFile = "androBot_head.obj";
    var texFile = "_boxxy.jpg";

    var object = new CCCollideableStaticMesh( "boxxy" );
    object.setScene( map );
    object.setCollideable( false );

    object.setTransparent();
    object.setDrawOrder( 99 );
    object.setupModel( objFile, texFile, 50.0, function(object)
    {
        //object.getMovementInterpolator().setMovementY( object.collisionBounds[1] * 2 );
    });

    var player;
    {
        player = map.spawnCharacter( "iBot" );
        map.assignPlayerCharacter( player );
        player.setPositionX( -50 );
    }

    {
        player = map.spawnCharacter( "androBot" );
        map.addEnemy( player );
        player.setPositionX( 50 );
    }

    map.startPlaying();

    // // Test
    // {
    //     var locationString = "0,0,0";
    //     var location = vec3.fromString( locationString );

    //     var mapBounds = map.getMapBounds();
    //     location[0] *= mapBounds.width;
    //     location[2] *= mapBounds.height;
    //     map.syncPlayerSetLocation( playerID, location );
    // }
}
