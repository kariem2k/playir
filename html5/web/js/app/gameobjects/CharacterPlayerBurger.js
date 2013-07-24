/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CharacterPlayerBurger.js
 * Description : Player class for our Burger characters
 *
 * Created     : 21/10/12
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

function CharacterPlayerBurger()
{
    this.construct();
}
ExtendPrototype( CharacterPlayerBurger, CharacterPlayer );


CharacterPlayerBurger.Spawn = function(type, onLoadedCallback)
{
    var character = new CharacterPlayerBurger();
    character.type = type;

    var path = "resources/burgers/bots/";

    var classPath = path;
    if( type.contains( "burger" ) )
    {
        classPath += "burger";
    }
    else
    {
        classPath += "fries";
    }

    {
        var objPath = path;
        if( type === "doublefries" )
        {
            objPath += "fries";
        }
        else
        {
            objPath += type;
        }
        objPath += ".obj";
        var texPath = classPath;
        texPath += "_diffuse.jpg";

        character.setupBody( objPath, texPath, function()
        {
            character.finalizeModel();

            if( onLoadedCallback )
            {
                onLoadedCallback( character );
            }

            {
                objPath = path;
                objPath += "bazooka.obj";
                texPath = path;
                texPath += "bazooka_diffuse.jpg";

                character.setupRightArm( objPath, texPath, function()
                {
                    character.finalizeModel();
                    character.setupWeapon( character.modelRightArm, 0 );

                    if( type.contains( "double" ) )
                    {
                        character.setupLeftArm( objPath, texPath, function()
                        {
                            character.finalizeModel();
                            character.setupWeapon( character.modelLeftArm, 1 );
                            character.weapons[0].setFireRate( 0.2 );
                            character.weapons[0].setMaxAmmo( 0.5 );
                            character.weapons[1].setFireRate( 0.2 );
                            character.weapons[1].setMaxAmmo( 0.5 );
                        });
                    }
                });
            }
        });
    }

    return character;
};


CharacterPlayerBurger.prototype.construct = function()
{
	this.CharacterPlayer_construct();

    this.modelLeftArm = this.modelRightArm = null;
};


CharacterPlayerBurger.prototype.destruct = function()
{
    this.CharacterPlayer_destruct();
};


CharacterPlayerBurger.prototype.setupLeftArm = function(modelFile, textureFile, callback)
{
    var self = this;
    this.setupModel( modelFile, textureFile, function(model3d)
    {
        self.modelLeftArm = model3d;
        callback();
    });
};


CharacterPlayerBurger.prototype.setupRightArm = function(modelFile, textureFile, callback)
{
    var self = this;
    this.setupModel( modelFile, textureFile, function(model3d)
    {
        self.modelRightArm = model3d;
        callback();
    });
};


CharacterPlayerBurger.prototype.finalizeModel = function()
{
    var characterSize = this.characterSize;
    var modelWidth = characterSize;
    var modelDepth = characterSize;
    var bodyHeight = characterSize;

    var modelBody = this.modelBody;
    if( modelBody )
    {
        modelWidth = modelBody.getWidth();
        modelDepth = modelBody.getDepth();
        bodyHeight = modelBody.getHeight();
    }

    var modelHeight = bodyHeight;

    this.finalizeSize( modelWidth, modelDepth, modelHeight );

    var combinedWidth, y;

    var modelLeftArm = this.modelLeftArm;
    if( modelLeftArm )
    {
        combinedWidth = modelBody.getWidth() * 0.7;
        y = ( bodyHeight * 0.35 ) - ( modelLeftArm.getHeight() * 0.5 );
        modelLeftArm.setPositionXYZ( -combinedWidth, y, modelLeftArm.getDepth() * 0.25 );
    }

    var modelRightArm = this.modelRightArm;
    if( modelRightArm )
    {
        combinedWidth = modelBody.getWidth() * 0.7;
        y = ( bodyHeight * 0.35 ) - ( modelRightArm.getHeight() * 0.5 );
        modelRightArm.setPositionXYZ( combinedWidth, y, modelRightArm.getDepth() * 0.25 );
    }

};
