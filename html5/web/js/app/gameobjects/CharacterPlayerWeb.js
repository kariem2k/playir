/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CharacterPlayerWeb.js
 * Description : Player class for our Web character
 *
 * Created     : 22/10/12
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

function CharacterPlayerWeb()
{
    this.construct();
}
ExtendPrototype( CharacterPlayerWeb, CharacterPlayer );


CharacterPlayerWeb.Spawn = function(type, onLoadedCallback)
{
    var character = new CharacterPlayerWeb();
    character.type = type;

    var path = type;
    path += "_";

    var texPath = path;
    texPath += "diffuse.jpg";

    {
        var objPath = path;
        objPath += "body.obj";

        character.setupBody( objPath, texPath, function()
        {
            {
                objPath = path;
                objPath += "head.obj";

                character.setupHead( objPath, texPath, function()
                {
                    character.finalizeModel();

                    if( onLoadedCallback )
                    {
                        onLoadedCallback( character );
                    }
                });
            }

            {
                objPath = path;
                objPath += "bazooka.obj";

                character.setupRightArm( objPath, texPath, function()
                {
                    character.finalizeModel();
                    character.setupWeapon( character.modelRightArm, 0 );
                });
            }
        });
    }

    return character;
};


CharacterPlayerWeb.prototype.construct = function()
{
	this.CharacterPlayer_construct();
};


CharacterPlayerWeb.prototype.destruct = function()
{
    this.CharacterPlayer_destruct();
};


CharacterPlayerWeb.prototype.setupLeftArm = function(modelFile, textureFile, callback)
{
    var self = this;
    this.setupModel( modelFile, textureFile, function(model3d)
    {
        self.modelLeftArm = model3d;
        callback();
    });
};


CharacterPlayerWeb.prototype.setupRightArm = function(modelFile, textureFile, callback)
{
    var self = this;
    this.setupModel( modelFile, textureFile, function(model3d)
    {
        if( model3d )
        {
            self.modelRightArm = model3d;
            callback();
        }
    });
};


CharacterPlayerWeb.prototype.finalizeModel = function()
{
    var characterSize = this.characterSize;
    var modelWidth = characterSize;
    var modelDepth = characterSize;
    var bodyHeight = characterSize;

    var modelBody = this.modelBody;
    var modelHead = this.modelHead;
    if( modelBody )
    {
        modelWidth = modelBody.getWidth();
        modelDepth = modelBody.getDepth();
        bodyHeight = modelBody.getHeight();
    }

    var modelHeight = bodyHeight;
    if( modelHead )
    {
        modelHeight += modelHead.getHeight();
        modelBody.setPositionXYZ( 0.0, -modelHead.getHeight() * 0.5, 0.0 );
        modelHead.setPositionXYZ( 0.0, modelBody.getHeight() * 0.5, -modelBody.getDepth() * 0.5 );
    }

    this.finalizeSize( modelWidth, modelDepth, modelHeight );

    var combinedWidth, y;

    var modelLeftArm = this.modelLeftArm;
    if( modelLeftArm )
    {
        combinedWidth = modelBody.getWidth() * 0.25;
        y = ( bodyHeight * 0.25 ) - ( modelLeftArm.getHeight() * 0.5 );
        modelLeftArm.setPositionXYZ( combinedWidth, y, modelLeftArm.getDepth() * 0.25 );
    }

    var modelRightArm = this.modelRightArm;
    if( modelRightArm )
    {
        combinedWidth = modelBody.getWidth() * 0.25;
        y = -( modelRightArm.getHeight() * 0.75 );
        modelRightArm.setPositionXYZ( -combinedWidth, y, modelRightArm.getDepth() * 0.3 );
    }
};
