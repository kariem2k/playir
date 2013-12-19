/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CharacterPlayerTank.js
 * Description : Player class for our Tank characters
 *
 * Created     : 21/10/12
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

function CharacterPlayerTank()
{
    this.construct( undefined, 20.0 );
}
ExtendPrototype( CharacterPlayerTank, CharacterPlayer );


CharacterPlayerTank.Spawn = function(type, onLoadedCallback)
{
    var character = new CharacterPlayerTank();
    character.type = type;

    var path = "tank_";

    var texPath = path;
    texPath += "diffuse.jpg";

    {
        var objPath = path;
        objPath += "body.obj";

        character.setupBody( objPath, texPath, function()
        {
            character.finalizeModel();
            {
                objPath = path;
                objPath += "head.obj";
                character.setupHead( objPath, texPath, function()
                {
                    character.finalizeModel();
                    character.setupWeapon( character.modelHead );

                    if( onLoadedCallback )
                    {
                        onLoadedCallback( character );
                    }
                });
            }
        });
    }

    return character;
};


CharacterPlayerTank.prototype.construct = function()
{
	this.CharacterPlayer_construct();
};


CharacterPlayerTank.prototype.destruct = function()
{
    this.CharacterPlayer_destruct();
};


CharacterPlayerTank.prototype.setupHead = function(modelFile, textureFile, callback)
{
    var self = this;
    this.setupModel( modelFile, textureFile, function(model3d)
    {
        self.model3DBase.removeModel( model3d );
        self.modelHead = model3d;

        // Restore our temp model weapon base (model3DBase)
        var currentWeaponRotation = 0.0;
        if( self.modelWeaponBase === self.model3DBase )
        {
            currentWeaponRotation = self.modelWeaponBase.rotation[1];
            self.modelWeaponBase.rotation[1] = 0.0;
            self.modelWeaponBase.dirtyModelMatrix();
        }

        // Set up our real weapon holder
        self.modelWeaponBase = new CCModelBase();
        self.modelWeaponBase.rotation[1] = currentWeaponRotation;

        self.modelWeaponBase.addModel( model3d );
        self.model3DBase.addModel( self.modelWeaponBase );

        if( callback )
        {
            callback();
        }
    });
};


CharacterPlayerTank.prototype.finalizeModel = function()
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

        // Move the model back to its origin point
        // Note we use the headheight for the y, because the origin.y moves the head below the base (BUG)
        {
            var origin = modelHead.getOrigin();
            modelHead.setPositionXYZ( origin[0], headHeight * 0.5, origin[2] );
        }
    }

    this.finalizeSize( modelWidth, modelDepth, modelHeight );
};
