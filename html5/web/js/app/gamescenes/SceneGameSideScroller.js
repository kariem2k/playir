/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : SceneGameSideScroller.js
 * Description : Side scroller implementation of the base game scene
 *
 * Created     : 21/05/13
 *-----------------------------------------------------------
 */

function SceneGameSideScroller(mapID)
{
    this.construct( mapID );
}
ExtendPrototype( SceneGameSideScroller, SceneGameBattleRoyale );


SceneGameSideScroller.prototype.setup = function()
{
    this.SceneGameBattleRoyale_setup();
    this.camera.targetOffset[2] = 65.0;
    this.camera.setRotationX( -5.0 );
};


// SceneGameSideScroller.prototype.touchCameraRotating = function(x, y)
// {
//     return false;
// };


// SceneGameSideScroller.prototype.touchReleaseSwipe = function(touch)
// {
//     return false;
// };


SceneGameSideScroller.prototype.assignPlayerCharacter = function(character)
{
    this.sceneUI.setProfile( 0, character.getPlayerID(), character.getUserID() );
    this.SceneGameSyndicate_assignPlayerCharacter( character );
};
