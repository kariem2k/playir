/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCBaseTools.js
 * Description : Contains base functions.
 *
 * Created     : 30/11/11
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

function DetectBrowser()
{
    var BO = {};
    BO.ie            = navigator.appName === 'Microsoft Internet Explorer';
    BO.ie6           = BO.ie && ( document.implementation ) && ( document.implementation.hasFeature );
    BO.ie10          = BO.ie && document.all && window.atob;
    BO.chrome        = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
    BO.safari        = ( document.childNodes ) && ( !document.all ) && ( !navigator.taintEnabled ) && ( !navigator.accentColorName ) && !BO.chrome;
    BO.firefox       = navigator.userAgent.indexOf('Firefox') > -1;

    BO.iphone        = navigator.userAgent.toLowerCase().indexOf('iphone') > -1;
    BO.ipad          = navigator.userAgent.toLowerCase().indexOf('ipad') > -1;
    BO.android       = navigator.userAgent.toLowerCase().indexOf('android') > -1;

    BO.mobile        = BO.iphone || BO.android || BO.iPad || window.tizen;

    return BO;
}
var BrowserType = new DetectBrowser();


if( !document.getElementsByClassName )
{
    document.getElementsByClassName = function(className)
    {
        var elements = document.getElementsByTagName( '*' );
        var matchedElements = [];
        for( var i=0; i<elements.length; ++i )
        {
            var element = elements[i];
            if( element.className === className )
            {
                matchedElements.push( element );
            }
        }

        return matchedElements;
    };
}



// CCTools helper class
function CC() {}

CC.TextArea = document.getElementById( "log" );


CC.DEBUGLOG = function(message, object)
{
    //if( window.console && console.log )
    {
        //console.log( message, object );
    }
};

function GetStackTrace()
{
    var i;
    var callstack = [];
    var lines;
    var isCallstackPopulated = false;

    try
    {
        i.dont.exist += 0; //doesn't exist- that's the point
    }
    catch(e)
    {
        if( e.stack )
        {
            //Firefox
            lines = e.stack.split('\n');
            for (i=0, len=lines.length; i<len; i++)
            {
                callstack.push(lines[i]);
            }

            //Remove call to printStackTrace()
            callstack.shift();
            isCallstackPopulated = true;
        }
        else if( window.opera && e.message )
        {
            //Opera
            lines = e.message.split( '\n' );
            for( i=0, len=lines.length; i<len; i++ )
            {
                if( lines[i].match( /^\s*[A-Za-z0-9\-_\$]+\(/) )
                {
                    var entry = lines[i];
                    //Append next line also since it has the file info
                    if( lines[i+1] )
                    {
                        entry += ' at ' + lines[i+1];
                        i++;
                    }
                    callstack.push( entry );
                }
            }

            //Remove call to printStackTrace()
            callstack.shift();
            isCallstackPopulated = true;
        }
    }

    if( !isCallstackPopulated )
    {
        //IE and Safari
        var currentFunction = arguments.callee.caller;
        while( currentFunction )
        {
            var fn = currentFunction.toString();
            var fname = fn.substring( fn.indexOf( "function" ) + 8, fn.indexOf( '' ) ) || 'anonymous';
            callstack.push( fname );
            currentFunction = currentFunction.caller;
        }
    }

    return callstack.join( '\n\n' );
}


CC.ASSERT = function(test, message)
{
    if( !test )
    {
        var debug = "TEST FAILED\n";
        debug += GetStackTrace();
        alert( debug );

        if( message )
        {
            alert( message );
        }
    }
};


CC.LoadScript = function(url, callback)
{
    // adding the script tag to the head as suggested before
    var head = document.getElementsByTagName( 'head' )[0];
    var script = document.createElement( 'script' );
    script.type = 'text/javascript';
    script.src = url;

    script.onload = function()
    {
        callback( true, script );
    };

    script.onerror = function()
    {
        callback( false, script );
    };

    // fire the loading
    head.appendChild( script );
};


// Add a listener function callback only once per socket
CC.SocketIOSocketOnOnly = function(name, fn)
{
    var listeners = this.listeners( name );
    if( listeners.length > 0 )
    {
        this.removeAllListeners( name );
        if( window.console && console.log )
        {
            console.log( 'socket.on re-registering', this.sessionID );
        }
    }
    this.on( name, fn );
    return this;
};


CC.DeepCopy = function(object)
{
    if( typeof( object ) === 'object' )
    {
        var cache = [];
        var objectJSONString = JSON.stringify( object, function(key, value)
        {
            if( typeof( value ) === 'object' && value !== null)
            {
                if( cache.indexOf( value ) !== -1 )
                {
                    // Circular reference found, discard key
                    return;
                }

                // Store value in our collection
                cache.push( value );
            }
            return value;
        });

        var newObject = JSON.parse( objectJSONString );
        return newObject;
    }
    return null;
};


CC.DeepEquals = function(o1, o2)
{
    if( o1 === o2 && o2 === undefined )
    {
        return true;
    }

    if( o1 === o2 && o2 === null )
    {
        return true;
    }

    if( ( o1 && !o2 ) || ( !o1 && o2 ) )
    {
        return false;
    }

    var k1 = Object.keys( o1 );
    var k2 = Object.keys( o2 );
    if( k1.length !== k2.length )
    {
        return false;
    }

    for( var i=0; i<k1.length; ++i )
    {
        if( k1[i] !== k2[i] )
        {
            return false;
        }

        var key = k1[i];
        var keyType = typeof( o1[key] );
        if( typeof( o1[key] ) !== typeof( o2[key] ) )
        {
            return false;
        }

        if( keyType === "object" )
        {
            if( !CC.DeepEquals( o1[key], o2[key] ) )
            {
                return false;
            }
        }
        else if( o1[key] !== o2[key] )
        {
            return false;
        }
    }

    return true;
};


CC.LoadData = function(key)
{
    if( window.localStorage )
    {
        var data = window.localStorage.getItem( key );
        if( data )
        {
            return data;
        }
    }
    return undefined;
};


CC.SaveData = function(key, data)
{
    if( window.localStorage )
    {
        CC.ASSERT( key );
        window.localStorage.setItem( key, data );
    }
};


CC.DeleteData = function(key)
{
    if( window.localStorage )
    {
        window.localStorage.removeItem( key );
    }
};


function ExtendPrototype(descendant, parent, noPrefixCopy)
{
    descendant.super = parent;

    // Fill in the parent.name for IE
    if( !parent.name )
    {
        parent.name = parent.toString().match(/^function\s*([^\s(]+)/)[1];
    }

    for( var m in parent.prototype )
    {
        if( !noPrefixCopy )
        {
            // Don't prefix previously prefixed funtions
            // (prefixed functions are reserved to indicate inheritance)
            if( m.split( '_' ).length === 1 )
            {
                var combined = parent.name + '_' + m;
                descendant.prototype[combined] = parent.prototype[m];
            }
        }
        descendant.prototype[m] = parent.prototype[m];
    }
}


CC.HasFlag = function(source, flag)
{
    var result = source & flag;
    if( result !== 0 )
    {
        return true;
    }

    return false;
};


CC.AddFlag = function(source, flag)
{
    if( !CC.HasFlag( source, flag ) )
    {
        source |= flag;
    }
    return source;
};


CC.RemoveFlag = function(source, flag)
{
    if( CC.HasFlag( source, flag ) )
    {
        source ^= flag;
    }
    return source;
};



function CCTools()
{
	this.resize();

	this.monthNames = new Array( 12 );
	this.monthNames[0] = "January";
	this.monthNames[1] = "February";
	this.monthNames[2] = "March";
	this.monthNames[3] = "April";
	this.monthNames[4] = "May";
	this.monthNames[5] = "June";
	this.monthNames[6] = "July";
	this.monthNames[7] = "August";
	this.monthNames[8] = "September";
	this.monthNames[9] = "October";
	this.monthNames[10] = "November";
	this.monthNames[11] = "December";
}


CCTools.prototype.resize = function()
{
    var self = this;
    CCTools.GetScreenSize( function (width, height)
    {
        self.screenWidth = width;
        self.screenHeight = height;
        self.screenEnd = height + CCTools.GetScreenScroll();
    });
};


CCTools.GetScreenWidth = function()
{
    var width = 720;
    if( document.body && document.body.clientWidth )
    {
        width = document.body.clientWidth;
    }
    else if( document.width )
    {
        width = parseInt( document.width, 10 );
    }
    else if( window.innerWidth )
    {
        width = window.innerWidth;
    }
    return width;
};


CCTools.GetScreenHeight = function()
{
    var height = 480;
    if( window && window.innerHeight )
    {
        height = window.innerHeight;
    }
    else if( document.body && document.body.clientHeight )
    {
        height = document.body.clientHeight;
    }
    else if( document.height )
    {
        height = parseInt( document.height, 10 );
    }
    return height;
};


CCTools.GetScreenSize = function(callback)
{
    var width = CCTools.GetScreenWidth();
    var height = CCTools.GetScreenHeight();

    if( window.tizen && window.tizen.systeminfo )
    {
        function successCallback(display)
        {
            callback( display.resolutionHeight, display.resolutionWidth, display.resolutionHeight/width );
        }
        function errorCallback(error)
        {
            //alert( error );
            callback( 800, 400, 1.0 );
        }
        window.tizen.systeminfo.getPropertyValue( "DISPLAY", successCallback, errorCallback );
    }
    else
    {
        callback( width, height, 1.0 );
    }
};


CCTools.GetScreenScroll = function()
{
	return document.body.scrollTop;
};


CCTools.GetX = function(object)
{
	var parentObject = object;
    var returnValue = object.offsetLeft;
    while( ( object = object.offsetParent ) )
    {
        if( object.tagName !== 'HTML' )
        {
            returnValue += object.offsetLeft;
        }
    }
	parentObject.x = returnValue;
    return returnValue;
};


CCTools.GetY = function(object)
{
	var parentObject = object;
    var returnValue = object.offsetTop;
    while( ( object = object.offsetParent ) )
    {
        if( object.tagName !== 'HTML' )
        {
            returnValue += object.offsetTop;
        }
    }
	parentObject.y = returnValue;
    return returnValue;
};


CC.SetOpacity = function(object, value)
{
	object.style.opacity = value;
};


CC.SetGradient = function(style, from, to)
{
    if( to === undefined )
    {
        to = from;
    }

	if( from === to )
	{
		style.background = to;
	}
	else if( BrowserType.firefox )
	{
		style.background = "-moz-linear-gradient( top, " + from + ", " + to + " )";
	}
    else if( BrowserType.ie10 )
    {
        style.background = "-ms-linear-gradient( top, " + from + ", " + to + " )";
    }
	else if( BrowserType.ie )
	{
		style.filter = "progid:DXImageTransform.Microsoft.Gradient( StartColorStr='" + from + "', EndColorStr='" + to + "', GradientType=0 )";
	}
	else
	{
		try
		{
			style.background = "-webkit-gradient( linear, left top, left bottom, from( " + from + " ), to( " + to + " ) )";
		}
		catch( e )
		{
			style.background = to;
		}

		if( !style.background )
		{
			style.background = to;
		}
	}
};


CCTools.prototype.equalDates = function(date1, date2)
{
	if( date1.getDate() === date2.getDate() && date1.getMonth() === date2.getMonth() && date1.getFullYear() === date2.getFullYear() )
	{
		return true;
	}
	return false;
};


CCTools.prototype.betweenDates = function(date, dateStart, dateEnd)
{
    if( this.equalDates( date, dateStart ) )
    {
        return true;
    }

    if( this.equalDates( date, dateEnd ) )
    {
        return true;
    }

    if( date > dateStart && date < dateEnd )
    {
        return true;
    }

    return false;
};


CCTools.prototype.daysBetween = function(date1, date2)
{
	// The number of milliseconds in one day
	var ONE_DAY = 1000 * 60 * 60 * 24;

	// Convert both dates to milliseconds
	var date1_ms = date1.getTime();
	var date2_ms = date2.getTime();

	// Calculate the difference in milliseconds
	var difference_ms = CC.Distance( date1_ms, date2_ms );

	// Convert back to days and return
	return Math.round( difference_ms / ONE_DAY );
};


CCTools.prototype.dateToString = function(date)
{
	return date.getFullYear() + this.monthNames[date.getMonth()] + date.getDate();
};


CC.LocalTimeFromUTC = function(utcTime)
{
    var minutesOffset = -( new Date().getTimezoneOffset() );
    var hoursOffset = minutesOffset / 60;
    minutesOffset = minutesOffset % 60;

    var timeSplit = utcTime.split( ":" );
    var hours = parseInt( timeSplit[0], 10 );
    var minutes = parseInt( timeSplit[1], 10 );
    minutes += minutesOffset;

    if( minutes < 0 )
    {
        hours--;
        minutes += 60;
    }
    else if( minutes >= 60 )
    {
        hours++;
        minutes += 60;
    }

    hours += hoursOffset;
    if( hours < 0 )
    {
        hours += 24;
    }
    else if( hours >= 24 )
    {
        hours -= 24;
    }

    if( hours < 10 )
    {
        hours = "0" + hours;
    }
    if( minutes < 10 )
    {
        minutes = "0" + minutes;
    }

    return "" + hours + ":" + minutes;
};


CC.GetJSLocationBarData = function(key, defaultValue, url)
{
    if( !url )
    {
        url = window.location.href;
    }

    var urlSplit = url.split( '#' );
    if( urlSplit.length > 1 )
    {
        var urlPackets = urlSplit[1].split( '&' );
        for( var i=0; i<urlPackets.length; ++i )
        {
            var urlPacket = urlPackets[i].split( '=' );
            var urlKey = urlPacket[0];
            var urlValue = true;
            if( urlPacket.length > 1 )
            {
                urlValue = urlPacket[1];
            }

            if( urlKey === key )
            {
                return urlValue;
            }
        }
    }

    if( defaultValue === undefined )
    {
        defaultValue = false;
    }
    return defaultValue;
};


CC.RemoveJSLocationBarData = function(key, setURL)
{
    var urlSplit = window.location.href.split( '#' );

    var url = urlSplit[0];
    url += '#';

    if( urlSplit.length > 1 )
    {
        var urlData = urlSplit[1];
        var tokensArray = urlData.split( '&' );
        for( var i=0; i<tokensArray.length; ++i )
        {
            var tokenString = tokensArray[i];
            var tokenKeyValue = tokenString.split( '=' );
            var tokenKey = tokenKeyValue[0];
            if( tokenKey.length > 0 && tokenKey !== key )
            {
                url += tokenString;
                url += '&';
            }
        }
    }

    if( CCEngine.NativeUpdateCommands === undefined )
    {
        if( setURL === undefined || setURL )
        {
            CC.SetWindowURL( url );
        }
    }
    return url;
};


CC.SetJSLocationBarData = function(key, value)
{
    var url = CC.RemoveJSLocationBarData( key, false );
    if( value === undefined )
    {
        url += key + '&';
    }
    else
    {
        url += key + '=' + value + '&';
    }

    if( CCEngine.NativeUpdateCommands === undefined )
    {
        CC.SetWindowURL( url );
    }
};


CC.SetPHPLocationBarData = function(key, value)
{
    var urlSplit = window.location.href.split( '?' );
    var url = urlSplit[0];
    url += '?' + key + '=' + value;

    // Append any JS data
    if( urlSplit.length > 1 )
    {
        var hashSplit = urlSplit[1].split( '#' );
        if( hashSplit.length > 1 )
        {
            url += '#' + hashSplit[1];
        }
    }

    if( url === window.location.href )
    {
        window.location.reload();
    }
    else
    {
        CC.SetWindowURL( url );
    }
};


CC.SetWindowURL = function(url, resetStack)
{
    if( !CC.WindowURLUpdatesDisabled )
    {
        if( CC.WindowURL !== url )
        {
            // Used with window.onhashchange to look for window back/forward button presses
            if( !CC.PendingURLStack )
            {
                CC.PendingURLStack = [];
            }
            if( resetStack )
            {
                CC.PendingURLStack.length = 0;
            }
            CC.WindowURL = url;
            if( window.location.href !== url )
            {
                CC.PendingURLStack.push( url );
                window.location.href = url;
            }
        }
    }
};


CC.GetURLWithoutLocationBarData = function()
{
    var urlSplit = window.location.href.split( '?' );
    if( urlSplit.length > 1 )
    {
        return urlSplit[0];
    }

    urlSplit = window.location.href.split( '#' );
    return urlSplit[0];
};


CC.WindowPrompt = function(title, message)
{
    if( CCEngine.DeviceType === "Web" )
    {
        return window.prompt( title, message );
    }
    //var iframe = document.createElement( "iframe" );
    //iframe.style.display = "none";
    //document.body.appendChild( iframe );
    //iframe.contentWindow.prompt( title, message );
    //iframe.parentNode.removeChild( iframe );
    return false;
};


CCTools.prototype.isAlphabetic = function(string)
{
    return "/^[a-zA-Z]+$/".test( string );
};


CC.IsAlphaNumeric = function(string)
{
    return ( /^[a-zA-Z0-9]*$/.test( string ) );
};
