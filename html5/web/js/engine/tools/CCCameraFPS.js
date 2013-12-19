/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCCameraFPS.js
 * Description : First person view oriented camera.
 *
 * Created     : 30/05/13
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

function CCCameraFPS()
{
    this.construct();

    this.targetWidth = 1.0;
    this.targetHeight = 1.0;
}
ExtendPrototype( CCCameraFPS, CCCameraBase );


CCCameraFPS.prototype.update = function()
{
	this.CCCameraBase_update();
};
