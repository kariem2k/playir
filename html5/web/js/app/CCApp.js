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

var debugUseLocalServer = 0;
var debugSlowNetwork = 0;

var windowDomain = window.location.href.getDomain();
if( window.location.href.startsWith( "http://localhost" ) ||
    window.location.href.startsWith( "http://192.168." ) )
{
    debugIsLocalClient = true;
}

SERVER_ROOT = SERVER_ROOT.resolveURL();
if( debugUseLocalServer )
{
    window.SERVER_ASSETS_URL = SERVER_ROOT;
}
else
{
    window.SERVER_ASSETS_URL = "http://playitor.com/";
}
var CLIENT_VERSION = 17;

var FORCE_ONLINE = CC.GetJSLocationBarData( 'online' );


CCEngine.prototype.start = function()
{
    this.textureManager.loadFont( "HelveticaNeueLight" );

    //gRenderer.renderFlags = CC.AddFlag( gRenderer.renderFlags, CCRenderer.render_collisionBoxes );
    //gRenderer.renderFlags = CC.AddFlag( gRenderer.renderFlags, CCRenderer.render_pathFinder );
    //FORCE_ONLINE = true;

    if( !window.CLIENT_ID )
    {
        var client = CC.GetJSLocationBarData( 'client' );
        if( client )
        {
            window.CLIENT_ID = client;
        }
        else
        {
            window.CLIENT_ID = "multi";
        }
    }

    if( window.CLIENT_ID === "testgame" )
    {
        TestGame();
    }
    else if( window.CLIENT_ID === "testshop" )
    {
        setTimeout( function() {
            new SceneItemShop( "Get more coins", "topup_1", true, 1000, 10, 10, function (type, itemCode, value)
            {
                alert( type + " " + value );
            });
        }, 50 );
    }
    else
    {
        if( window.CLIENT_ID === "editor" )
        {
            new SceneGamesManager();
            SceneMultiManager.EditorEnabled = true;
            SceneMultiManager.EditorAllowed = true;
        }
        else
        {
            var joinMapID = CC.GetJSLocationBarData( 'map' );
            var joinPlayerType = CC.GetJSLocationBarData( 'player' );
            if( joinMapID )
            {
                new SceneManagerJoinMap( joinMapID, joinPlayerType );
            }
            else
            {
                new SceneMultiManager();
            }
        }
    }

    MultiplayerManager.DetectGeoLocation();
    MultiplayerManager.Connect();
};


function TestGame()
{
    var map = new SceneGame1vs1( null );
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
}
