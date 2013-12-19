/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CharacterPlayerTank.js
 * Description : Player class for our Soldier characters
 *
 * Created     : 21/10/12
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

function CharacterPlayerSoldier()
{
    this.construct();
}
ExtendPrototype( CharacterPlayerSoldier, CharacterPlayer );


CharacterPlayerSoldier.Spawn = function(type, onLoadedCallback)
{
    var character = new CharacterPlayerSoldier();
    character.type = type;

    // The custom soldier path (body parts)
    var typePath = type;
    typePath += "_";

    // The default soldier path (weapons)
    var classPath = "soldier_";

    {
        var objPath = classPath;
        objPath += "body.obj";
        var texPath = typePath;
        texPath += "body_diffuse.jpg";

        character.setupBody( objPath, texPath, function()
        {
            character.finalizeModel();
            {
                objPath = typePath;
                objPath += "head.obj";
                texPath = typePath;
                texPath += "head_diffuse.jpg";
                character.setupHead( objPath, texPath, function()
                {
                    character.finalizeModel();

                    if( onLoadedCallback )
                    {
                        onLoadedCallback( character );
                    }

                    objPath = classPath;
                    objPath += "weapon_bazooka.obj";
                    texPath = classPath;
                    texPath += "weapon_bazooka_diffuse.jpg";
                    character.setupArms( objPath, texPath );
                });
            }
        });
    }

    return character;
};


CharacterPlayerSoldier.prototype.construct = function()
{
	this.CharacterPlayer_construct();
};


CharacterPlayerSoldier.prototype.destruct = function()
{
    this.CharacterPlayer_destruct();
};


CharacterPlayerSoldier.prototype.setupArms = function(modelFile, textureFile, callback)
{
    var self = this;
    this.setupModel( modelFile, textureFile, function(model3d)
    {
        self.modelArms = model3d;

        // Move the model back to its origin point
        {
            var origin = model3d.getOrigin();
            model3d.translate( origin[0], -origin[1], origin[2] );
        }

        self.setupWeapon( self.modelArms, 0 );

        if( callback )
        {
            callback();
        }
    });
};


CharacterPlayerSoldier.prototype.finalizeModel = function()
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
        var headHeight = modelHead.getHeight();
        modelHeight += headHeight;
        modelBody.setPositionXYZ( 0.0, ( -modelHeight * 0.5 ) + ( bodyHeight * 0.5 ), 0.0 );
        modelHead.setPositionXYZ( 0.0, modelBody.position[1] + bodyHeight * 0.5 + headHeight * 0.5, 0.0 );

        if( modelHead.getWidth() > modelWidth )
        {
            modelWidth = modelHead.getWidth();
        }
    }

    this.finalizeSize( modelWidth, modelDepth, modelHeight );
};
