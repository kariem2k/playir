/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CharacterPlayerModel.js
 * Description : Player class for custom models.
 *
 * Created     : 24/05/13
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

function CharacterPlayerModel()
{
    this.construct();
}
ExtendPrototype( CharacterPlayerModel, CharacterPlayer );


CharacterPlayerModel.Spawn = function(type, onLoadedCallback)
{
    var character = new CharacterPlayerModel();
    character.type = type;

    DBAssets.LoadModelID( type, function (modelInfo)
    {
        var obj = modelInfo.obj;
        var tex = modelInfo.tex;
        character.setupBody( obj, tex, function()
        {
            character.finalizeModel();

            if( onLoadedCallback )
            {
                onLoadedCallback( character );
            }
        });
    });

    return character;
};


CharacterPlayerModel.prototype.finalizeModel = function()
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
};


CharacterPlayerModel.prototype.update = function(delta)
{
    this.CharacterPlayer_update( delta );

    if( this.modelBody )
    {
        this.modelBody.animate( delta * this.movementDirection[2] );
    }
};
