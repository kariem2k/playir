/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCBaseTypes.js
 * Description : Contains base structures.
 *
 * Created     : 30/11/12
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

// String extensions
String.Contains = function(src, token)
{
	if( src.indexOf( token ) !== -1 )
	{
		return true;
	}
	return false;
};


String.StripEquals = function(src)
{
	if( String.Contains( src, "=" ) )
	{
		var split = src.split( "=" );
		if( split.length > 1 )
		{
			return split[split.length-1];
		}
	}
	return src;
};


String.ReplaceChar = function(source, search, replace)
{
    var split = source.split( search );
    var result = "";
    for( var i=0; i<split.length; ++i )
    {
        if( i > 0 )
        {
            result += replace;
        }
        result += split[i];
    }
    return result;
};


String.SplitBetween = function(source, from, to)
{
	var splitFrom = source.split( from );
	if( splitFrom.length > 1 )
	{
		var splitTo = splitFrom[1].split( to );
		return splitTo[0];
	}
	return false;
};


String.SplitBefore = function(source, before)
{
    var split = source.split( before );
    return split[0];
};


String.SplitAfter = function(source, after)
{
    var split = source.split( after );
    if( split.length > 1 )
    {
        var result = split[1];
        for( var i=2; i<split.length; ++i )
        {
            result += after;
            result += split[i];
        }
        return result;
    }
    return "";
};


String.LastWord = function(source)
{
	var split = source.split( " " );
	return split[split.length-1];
};


String.RemoveBetween = function(source, before, after)
{
	var i;

    var result = "";
    var splitBefore = source.split( before );
    for( i=0; i<splitBefore.length-1; ++i )
    {
        result += before;
        result += splitBefore[i];
    }

    var splitAfter = source.split( after );
    for( i=1; i<splitAfter.length; ++i )
    {
        result += after;
        result += splitAfter[i];
    }

    return result;
};


String.RemoveBetweenIncluding = function(source, before, after)
{
    var result = "";
    var splitBefore = source.split( before );

    var i;
    for( i=0; i<splitBefore.length-1; ++i )
    {
        if( i !== 0 )
        {
            result += before;
        }
        result += splitBefore[i];
    }

    var splitAfter = source.split( after );
    for( i=1; i<splitAfter.length; ++i )
    {
        if( i !== 1 )
        {
            result += after;
        }
        result += splitAfter[i];
    }

    return result;
};


String.prototype.stripDirectory = function()
{
	return this.replace( /^.*[\\\/]/, '' );
};


String.prototype.getDomain = function()
{
	var start = String.SplitBefore( this, ":" );
	var domain = String.SplitBetween( this, "//", "/" );
	return start + "://" + domain;
};


String.prototype.getHostname = function()
{
	return String.SplitBetween( this, "//", "/" );
};


String.prototype.getFilename = function()
{
	var filename = this.stripDirectory();
	if( filename.contains( "=" ) )
	{
		filename = String.SplitAfter( filename, "=" );
	}
	return filename;
};


String.prototype.contains = function(token)
{
	if( this.indexOf( token ) !== -1 )
	{
		return true;
	}
	return false;
};


String.prototype.containsDirectory = function()
{
	if( this.contains( '/' ) )
	{
		return true;
	}
	return false;
};


String.prototype.isHTTP = function()
{
    var httpString = 'http://';
    if( this.substring( 0, httpString.length ) === httpString )
    {
		return true;
    }
    return false;
};


String.prototype.isHTTPS = function()
{
    var httpString = 'https://';
    if( this.substring( 0, httpString.length ) === httpString )
    {
		return true;
    }
    return false;
};


String.prototype.strip = function(token)
{
	return this.replace( token, "" );
};


String.prototype.stripExtension = function()
{
    var results = this.split( '.' );
    var newString = "";
    for( var i=0; i<results.length-1; ++i )
    {
		if( i > 0 )
		{
			newString += ".";
		}
		newString += results[i];
    }
    return newString;
};


String.prototype.stripFilename = function()
{
	return this.substring( 0, this.lastIndexOf( '/' ) );
};


String.prototype.stripStart = function(token)
{
	var index = this.indexOf( token );
	if( index !== -1 )
	{
		return string.substring( index );
	}
	return this;
};


// Removes start and end spaces and converts tabs to a single space;
String.prototype.formatSpacesAndTabs = function()
{
    var string = String.ReplaceChar( this, "\t", " " );
    while( string.length > 0 && string[0] === " " )
    {
        string = string.substring( 1 );
    }
    while( string.length > 0 && string[string.length-1] === " " )
    {
		string = string.substring( 0, string.length-1 );
    }
    return string;
};


String.prototype.getExtension = function()
{
	var results = this.split( '.' );
	if( results.length > 1 )
	{
		return results[results.length-1].toLowerCase();
	}
	return "";
};


String.prototype.resolveURL = function()
{
	var url = this;

	if( !url.startsWith( 'http' ) )
	{
		url = window.location.href.stripFilename() + '/' + this;
	}

    // Get rid of any ../
    var urlSplit = url.split( '/..' );
    if( urlSplit.length > 1 )
    {
        url = urlSplit[0].stripFilename() + urlSplit[1];
    }

	return url;
};


String.prototype.startsWith = function(needle)
{
    return ( this.indexOf( needle ) === 0 );
};


String.strncmp = function(a, b, n)
{
    return a.substring( 0, n ) === b.substring( 0, n );
};


// Array extensions
Array.prototype.safePop = function()
{
	var result = this[0];
	for( var i=0; i<this.length-1; ++i )
	{
		this[i] = this[i+1];
	}
	this.length--;
	return result;
};


Array.prototype.add = function(object)
{
    this.push( object );
};


Array.prototype.addOnce = function(object)
{
	if( this.find( object ) === -1 )
	{
		this.push( object );
		return true;
	}
	return false;
};


Array.prototype.insert = function(object, index)
{
	var currentIndex = this.find( object );
	if( currentIndex !== -1 )
	{
		if( currentIndex === index )
		{
			return false;
		}
		this.remove( object );
	}
	this.add( object );

    var length = this.length;
    for( var i=length-1; i>index; --i )
    {
        this[i] = this[i-1];
    }
    this[index] = object;
    return true;
};


Array.prototype.remove = function(object)
{
    var length = this.length;
    for( var i=0; i<length; ++i )
    {
        if( this[i] === object )
        {
            length--;
            for( var j=i; j<length; ++j )
            {
                this[j] = this[j+1];
            }
            this.length--;
            return true;
        }
    }
    return false;
};


Array.prototype.removeIndex = function(index)
{
    var length = this.length;
    if( index < length )
    {
		for( var i=index; i<length; ++i )
		{
			this[i] = this[i+1];
		}
		this.length--;
		return true;
	}
    return false;
};


Array.prototype.find = function(object)
{
	var length = this.length;
    for( var i=0; i<length; ++i )
    {
        if( this[i] === object )
        {
            return i;
        }
    }
    return -1;
};


Array.prototype.last = function(object)
{
	if( this.length > 0 )
	{
		return this[this.length-1];
	}
	return null;
};


// Run all our function callbacks
Array.prototype.emit = function()
{
    for( var i=0; i<this.length; ++i )
    {
        this[i]();
    }
};


Array.prototype.first = function()
{
	if( this.length > 0 )
	{
		return this[0];
	}
	return null;
};



// DOMDimensions
// Tracks object size and position
function DOMDimensions(object)
{
	this.object = object;

	this.x = 0;
	this.y = 0;
	this.width = 1;
	this.height = 1;
	this.totalWidth = 1;
	this.totalHeight = 1;

	this.borderSize = 0;
}


DOMDimensions.prototype.setPosition = function(x, y)
{
	var object = this.object;
	if( x !== this.x )
	{
		object.style.left = x + 'px';
		this.x = x;
	}

	if( y !== this.y )
	{
		object.style.top = y + 'px';
		this.y = y;
	}
};


DOMDimensions.prototype.refreshBorder = function()
{
	this.borderSize = this.object.style.border ? parseInt( this.object.style.border, 10 ) : 0;
};


DOMDimensions.prototype.refreshPosition = function()
{
	var dimensions = this;
	dimensions.x = CCTools.GetX( this.object );
	dimensions.y = CCTools.GetY( this.object );
};


DOMDimensions.prototype.refreshSize = function()
{
	var dimensions = this;

	var width = this.object.clientWidth;
	var height = this.object.clientHeight;

	if( width < 1 )
	{
		width = 1;
	}
	if( height < 1 )
	{
		height = 1;
	}
	dimensions.width = width;
	dimensions.height = height;

	dimensions.totalWidth = width + dimensions.borderSize * 2;
	dimensions.totalHeight = height + dimensions.borderSize * 2;
};


DOMDimensions.prototype.refresh = function()
{
	this.refreshBorder();
	this.refreshPosition();
	this.refreshSize();
};


// TableComponent
// Base HTML table component which can be processed by the engine.
function TableComponent(parent, selectable)
{
	this.callbacks = [];

	var table = this.table = document.createElement( 'table' );
	table.cellPadding = 0;
	table.cellSpacing = 0;

	var style = this.style = table.style;
	style.marginLeft = 0;
	style.marginRight = 0;
	style.marginTop = 0;
	style.marginBottom = 0;

    if( !selectable )
    {
        style.cursor = 'pointer';
        table.unselectable = true;
        style.MozUserSelect = 'none';
    }

	this.dimensions = new DOMDimensions( this.table );

	style.position = 'absolute';
	style.left = '0px';
	style.top = '0px';

	var tBody = this.tBody = document.createElement( 'tbody' );
	table.appendChild( tBody );

	this.tr = [];
	this.addRow();
	this.addColumn();
	this.td = this.tr[0].td[0];

    if( parent )
    {
        parent.appendChild( this.table );
    }
}


TableComponent.prototype.addRow = function()
{
	var index = this.tr ? this.tr.length : 0;
	var tr = this.tr[index] = document.createElement( 'tr' );
	tr.td = [];
	this.tBody.appendChild( tr );
	return tr;
};


TableComponent.prototype.addColumnToRow = function(row)
{
	if( row >= this.tr.length )
	{
		alert( 'TableComponent.prototype.addColumn() - invalid row' );
		return;
	}

	var index = this.tr[row].td ? this.tr[row].td.length : 0;
	var td = this.tr[row].td[index] = document.createElement( 'td' );
	this.tr[row].appendChild( td );
	return td;
};


TableComponent.prototype.addColumn = function()
{
	return this.addColumnToRow( this.tr.length-1 );
};
