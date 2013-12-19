/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCObject.js
 * Description : A dynamic button widget.
 *
 * Created     : 21/10/11
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

function CCObject()
{
	this.construct();
}
ExtendPrototype( CCObject, CCRenderable );


CCObject.prototype.construct = function()
{
	this.CCRenderable_construct();

	this.deletingObjectCountdown = 0;
    this.parent = null;
	this.model = null;

    this.renderPass = CCRenderer.render_main;
    this.readDepth = true;
    this.writeDepth = true;
    this.disableCulling = false;

    this.transparent = false;

    this.colourInterpolator = null;

    if( CCEngine.NativeUpdateCommands !== undefined )
    {
        this.nativeConstruct();
    }
};


CCObject.prototype.nativeConstruct = function()
{
    CCEngine.NativeUpdateCommands += 'CCObject.construct;' + this.jsID + '\n';
};


CCObject.prototype.destruct = function()
{
    if( this.inScene )
    {
        this.removeFromScene();
    }
    else if( this.noScene )
    {
    }
    else if( !this.parent )
    {
        alert( false );
    }
    else
    {
        this.parent.removeChild( this );
    }

    var i;

    var updaters = this.updaters;
    if( updaters )
    {
        var updatersLength = updaters.length;
        for( i=0; i<updatersLength; ++i )
        {
            var updater = updaters[i];
            if( updater.destruct )
            {
                updater.destruct();
            }
        }
        updaters.length = 0;
    }

    var children = this.children;
    if( children )
    {
        var childrenLength = children.length;
        for( i=0; i<children.length; ++i )
        {
            var child = children[i];
            child.destruct();
            if( childrenLength !== children.length )
            {
                childrenLength = children.length;
                --i;
            }
        }
        delete this.children;
    }

    if( this.model )
    {
        this.model.destruct();
    }

	this.CCRenderable_destruct();

    if( CCEngine.NativeUpdateCommands !== undefined )
    {
        this.nativeDestruct();
    }
};


CCObject.prototype.nativeDestruct = function()
{
    CCEngine.NativeUpdateCommands += 'CCObject.destruct;' + this.jsID + '\n';
};


CCObject.prototype.deleteLater = function()
{
    this.deletingObjectCountdown = 2;
    this.deactivate();
};


CCObject.prototype.setScene = function(scene)
{
    scene.addObject( this );
};


CCObject.prototype.removeFromScene = function()
{
    this.deactivate();
    this.inScene.removeObject( this );
};


CCObject.prototype.isActive = function()
{
    return this.deletingObjectCountdown === 0;
};


CCObject.prototype.deactivate = function()
{
};


CCObject.prototype.addChild = function(object, preRender, index)
{
    if( !this.children )
    {
        this.children = [];
    }
    this.children.push( object );

    if( index !== undefined )
    {
        this.children.insert( object, index );
    }

    object.parent = this;

    if( preRender )
    {
        object.preRender = true;
    }
};


CCObject.prototype.removeChild = function(object)
{
    if( this.children && this.children.remove( object ) )
    {
        if( this.children.length === 0 )
        {
            delete this.children;
        }
        return true;
    }
    return false;
};


CCObject.prototype.addUpdater = function(updater)
{
    if( !this.updaters )
    {
        this.updaters = [];
    }
    this.updaters.push( updater );
};


CCObject.prototype.removeUpdater = function(updater)
{
    this.updaters.remove( updater );
    if( this.updaters.length === 0 )
    {
        delete this.updaters;
    }
};


CCObject.prototype.shouldCollide = function(collideWith, initialCall)
{
    // It's not me is it?
    if( this === collideWith )
    {
        return false;
    }

    // Ask my parent if we should collide
    if( this.parent )
    {
        return this.parent.shouldCollide( collideWith, initialCall );
    }

    // Yeah, let's collide baby
    return true;
};


CCObject.prototype.update = function(delta)
{
    var updated = false;

    var i;

    {
        var updaters = this.updaters;
        if( updaters )
        {
            var updatersLength = updaters.length;
            for( i=0; i<updatersLength; ++i )
            {
                if( updaters[i].updating )
                {
                    updated |= updaters[i].update( delta );
                }
            }
        }
    }

    {
        var children = this.children;
        if( children )
        {
            var childrenLength = children.length;
            for( i=0; i<childrenLength; ++i )
            {
                updated |= children[i].update( delta );
            }
        }
    }

    if( this.colourInterpolator )
    {
        if( this.colourInterpolator.updating )
        {
            updated |= this.colourInterpolator.update( delta );
            gRenderer.pendingRender = true;
        }
        else
        {
            delete this.colourInterpolator;
        }
    }

    return updated;
};


CCObject.prototype.renderObject = function(camera, alpha)
{
    if( this.shouldRender && !this.loading )
    {
        var children = this.children;
        var i;
        var childrenLength = 0;
        if( children )
        {
            childrenLength = children.length;
        }

        if( alpha === this.transparent || childrenLength > 0 )
        {
            CCRenderer.GLPushMatrix();
            {
                if( this.updateModelMatrix )
                {
                    this.refreshModelMatrix();
                }
                CCRenderer.ModelMatrixMultiply( this );

                for( i=0; i<childrenLength; ++i )
                {
                    if( children[i].preRender )
                    {
                        children[i].renderObject( camera, alpha );
                    }
                }

                if( alpha === this.transparent )
                {
                    if( this.colour )
                    {
                        gRenderer.CCSetColour( this.colour );
                    }
                    this.renderModel( alpha );
                }

                for( i=0; i<childrenLength; ++i )
                {
                    if( !children[i].preRender )
                    {
                        children[i].renderObject( camera, alpha );
                    }
                }
            }
            CCRenderer.GLPopMatrix();
        }
    }
};


CCObject.prototype.renderModel = function(alpha)
{
    var model = this.model;
    if( model )
    {
        var renderer = gRenderer;

        if( CCEngine.NativeRenderCommands !== undefined )
        {
            renderer.unbindBuffers();
            CCEngine.NativeRenderCommands += 'CCObject.renderModel;' + this.jsID + ';' + alpha + '\n';
        }
        else
        {
            if( this.disableCulling )
            {
                renderer.CCSetCulling( false );
            }

            if( alpha )
            {
                if( this.readDepth )
                {
                    renderer.CCSetDepthRead( true );
                    if( this.writeDepth )
                    {
                        renderer.CCSetDepthWrite( true );
                        model.render( alpha );
                        renderer.CCSetDepthWrite( false );
                    }
                    else
                    {
                        model.render( alpha );
                    }
                    renderer.CCSetDepthRead( false );
                }
                else
                {
                    model.render( alpha );
                }
            }
            else
            {
                if( this.readDepth )
                {
                    if( this.writeDepth )
                    {
                        model.render( alpha );
                    }
                    else
                    {
                        renderer.CCSetDepthWrite( false );
                        model.render( alpha );
                        renderer.CCSetDepthWrite( true );
                    }
                }
                else
                {
                    renderer.CCSetDepthRead( false );
                    model.render( alpha );
                    renderer.CCSetDepthRead( true );
                }
            }

            if( this.disableCulling )
            {
                renderer.CCSetCulling( true );
            }
        }
    }
};


CCObject.prototype.isTransparent = function()
{
    return this.transparent;
};


CCObject.prototype.setTransparent = function(toggle)
{
    if( toggle === undefined )
    {
        toggle = true;
    }

    this.transparent = toggle;
};


CCObject.prototype.getColourInterpolator = function()
{
    if( !this.colourInterpolator )
    {
        this.colourInterpolator = new CCInterpolatorColour();
        if( this.colour )
        {
            this.colourInterpolator.setup( this.colour, this.colour );
        }
    }
    return this.colourInterpolator;
};


CCObject.prototype.setColour = function(inColour, interpolate, inCallback)
{
    if( typeof( inColour ) === "number" )
    {
        inColour = gColour.setRGBA( inColour, inColour, inColour, 1.0 );
    }

    if( !this.colour )
    {
        this.colour = new CCColour();
    }

    if( interpolate )
    {
        this.getColourInterpolator().setup( this.colour, inColour );
    }
    else
    {
        this.colour.set( inColour );
        if( this.colourInterpolator )
        {
            this.colourInterpolator.setup( this.colour );
        }
    }
};


CCObject.prototype.setColourAlpha = function(inAlpha, interpolate, inCallback)
{
    if( !this.colour )
    {
        this.colour = new CCColour();
    }

    if( interpolate )
    {
        this.getColourInterpolator().setTargetAlpha( inAlpha, inCallback );
    }
    else
    {
        this.colour.a = inAlpha;
        if( this.colourInterpolator )
        {
            this.colourInterpolator.finish();
            this.colourInterpolator.setup( this.colour );
        }
    }
};


CCObject.prototype.setModel = function(model)
{
    this.model = model;

    if( CCEngine.NativeUpdateCommands !== undefined )
    {
        CCEngine.NativeUpdateCommands += 'CCObject.setModel;' + this.jsID + ';' + model.jsID + '\n';
    }

    return model;
};


CCObject.prototype.setReadDepth = function(toggle)
{
    this.readDepth = toggle;

    if( CCEngine.NativeUpdateCommands !== undefined )
    {
        CCEngine.NativeUpdateCommands += 'CCObject.setReadDepth;' + this.jsID + ';' + toggle + '\n';
    }
};


CCObject.prototype.setWriteDepth = function(toggle)
{
    this.writeDepth = toggle;

    if( CCEngine.NativeUpdateCommands !== undefined )
    {
        CCEngine.NativeUpdateCommands += 'CCObject.setWriteDepth;' + this.jsID + ';' + toggle + '\n';
    }
};


CCObject.prototype.setCulling = function(toggle)
{
    this.disableCulling = !toggle;

    if( CCEngine.NativeUpdateCommands !== undefined )
    {
        CCEngine.NativeUpdateCommands += 'CCObject.setCulling;' + this.jsID + ';' + toggle + '\n';
    }
};
