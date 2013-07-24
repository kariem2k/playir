/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CollideableParticle.js
 * Description : A particle the moves without collision, but is depth sorted
 *
 * Created     : 19/10/12
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

function CollideableParticle(life, speed)
{
    this.construct( life, speed );
}
ExtendPrototype( CollideableParticle, CCCollideable );


CollideableParticle.prototype.construct = function(life, speed)
{
    if( !life )
    {
        life = 1.0;
    }

    if( !speed )
    {
        speed = 50.0;
    }

    this.CCCollideable_construct();

    this.life = life;
    this.speed = speed;

    this.setTransparent();
    this.setReadDepth( false );
    this.setWriteDepth( false );

    this.setDrawOrder( 201 );
};


// ObjectBase
CollideableParticle.prototype.update = function(delta)
{
    if( this.life <= 0.0 )
    {
        this.deleteLater();
    }
    else
    {
        if( this.life < 1.0 )
        {
            this.setColourAlpha( 0.0, true );
        }

        this.life -= delta;
        this.CCCollideable_update( delta );

        this.translate( 0.0, delta * this.speed, 0.0 );
    }
    return true;
};


CollideableParticle.prototype.renderModel = function(alpha)
{
    if( alpha )
    {
        this.CCCollideable_renderModel( alpha );
    }
    else
    {
        this.CCCollideable_renderModel( alpha );
    }
};
