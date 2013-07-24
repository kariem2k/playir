/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CharacterPlayerAndroid.js
 * Description : Player class for our Android character
 *
 * Created     : 08/10/12
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

function CharacterPlayerAndroid()
{
    this.construct();
}
ExtendPrototype( CharacterPlayerAndroid, CharacterPlayer );


CharacterPlayerAndroid.Spawn = function(type, onLoadedCallback)
{
    var character = new CharacterPlayerAndroid();
    character.type = type;

    var path = "resources/androids/bots/";
    path += type;
    path += "_";

    {
        var objPath = path;
        objPath += "body.obj";
        var texPath = path;
        texPath += "diffuse.jpg";

        character.setupBody( objPath, texPath, function()
        {
            character.finalizeModel();
            if( type === "androBot" )
            {
                objPath = path;
                objPath += "screen.obj";
                texPath = path;
                texPath += "screen_diffuse.jpg";
                character.setupScreen( objPath, texPath, function()
                {
                    character.finalizeModel();
                });
            }

            if( type === "androBot" || type === "iBot" )
            {
                objPath = path;
                objPath += "head.obj";
                texPath = path;
                texPath += "diffuse.jpg";

                character.setupHead( objPath, texPath, function()
                {
                    character.finalizeModel();

                    if( onLoadedCallback )
                    {
                        onLoadedCallback( character );
                    }
                });
            }
            else
            {
                if( onLoadedCallback )
                {
                    onLoadedCallback( character );
                }
            }

            {
                objPath = path;
                objPath += "rightarm.obj";
                texPath = path;
                texPath += "diffuse.jpg";

                character.setupRightArm( objPath, texPath, function()
                {
                    character.finalizeModel();
                    character.setupWeapon( character.modelRightArm, 0 );

                    if( type === "iBot" )
                    {
                        objPath = path;
                        objPath += "leftarm.obj";

                        character.setupLeftArm( objPath, texPath, function()
                        {
                            if( character.modelLeftArm )
                            {
                                character.finalizeModel();
                                character.setupWeapon( character.modelLeftArm, 1 );

                                character.weapons[0].setFireRate( 0.2 );
                                character.weapons[0].setMaxAmmo( 0.5 );
                                character.weapons[1].setFireRate( 0.2 );
                                character.weapons[1].setMaxAmmo( 0.5 );
                            }
                        });
                    }
                });
            }
        });
    }

    return character;
};


CharacterPlayerAndroid.prototype.construct = function()
{
	this.CharacterPlayer_construct();

    this.modelScreen = null;
    this.modelLeftArm = this.modelRightArm = null;
};


CharacterPlayerAndroid.prototype.destruct = function()
{
    this.CharacterPlayer_destruct();
};


CharacterPlayerAndroid.prototype.setupScreen = function(modelFile, textureFile, callback)
{
    var self = this;
    this.setupModel( modelFile, textureFile, function(model3d)
    {
        self.modelScreen = model3d;
        callback();
    });
};


CharacterPlayerAndroid.prototype.setupLeftArm = function(modelFile, textureFile, callback)
{
    var self = this;
    this.setupModel( modelFile, textureFile, function(model3d)
    {
        self.modelLeftArm = model3d;
        callback();
    });
};


CharacterPlayerAndroid.prototype.setupRightArm = function(modelFile, textureFile, callback)
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


CharacterPlayerAndroid.prototype.finalizeModel = function()
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
        if( modelBody )
        {
            modelBody.setPositionXYZ( 0.0, -modelHead.getHeight() * 0.5, 0.0 );
            modelHead.setPositionXYZ( 0.0, modelBody.getHeight() * 0.5, modelBody.getDepth() * 0.25 + modelHead.getDepth() * 0.25 );
        }
    }

    this.finalizeSize( modelWidth, modelDepth, modelHeight );

    if( this.modelScreen )
    {
        this.modelScreen.setPositionXYZ( 0.0, modelBody.position[1], modelBody.getDepth() * 0.5 );
    }

    var combinedWidth, y;

    var modelLeftArm = this.modelLeftArm;
    if( modelLeftArm )
    {
        combinedWidth = modelBody.getWidth() * 0.5 + modelLeftArm.getWidth() * 0.5;
        y = ( bodyHeight * 0.25 ) - ( modelLeftArm.getHeight() * 0.5 );
        modelLeftArm.setPositionXYZ( -combinedWidth, y, modelLeftArm.getDepth() * 0.25 );
    }

    var modelRightArm = this.modelRightArm;
    if( modelRightArm )
    {
        combinedWidth = modelBody.getWidth() * 0.5 + modelRightArm.getWidth() * 0.5;
        y = ( bodyHeight * 0.25 ) - ( modelRightArm.getHeight() * 0.5 );
        modelRightArm.setPositionXYZ( combinedWidth, y, modelRightArm.getDepth() * 0.25 );
    }
};
