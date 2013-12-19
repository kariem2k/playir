/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : AlertsManager.js
 * Description : Handles our alert messages
 *
 * Created     : 28/02/13
 *-----------------------------------------------------------
 */

function AlertsManager() {}
AlertsManager.AlertsList = [];


// When an alert is about to be removed
AlertsManager.RemovingAlert = function(inScene)
{
    var AlertsList = AlertsManager.AlertsList;
    AlertsList.remove( inScene );
};


AlertsManager.Hide = function(id)
{
    var AlertsList = AlertsManager.AlertsList;

    var found = false;
    for( var i=0; i<AlertsList.length; ++i )
    {
        var alert = AlertsList[i];
        if( alert.title === id || alert.message === id )
        {
            alert.close();
            AlertsList.remove( alert );
            break;
        }
    }
};


// Alerts that persist and remove non-persistance alerts
AlertsManager.ModalAlert = function(message, priority)
{
    var AlertsList = AlertsManager.AlertsList;

    if( !priority )
    {
        priority = 1;
    }

    var found = false;
    var i, alert;
    for( i=0; i<AlertsList.length; ++i )
    {
        alert = AlertsList[i];
        if( alert.message === message )
        {
            found = true;
            break;
        }
    }

    if( !found )
    {
        alert = new SceneUIAlert( message );
        alert.modal = priority;
        alert.open();
        AlertsList.add( alert );
    }

    // Remove all non-modal dialogs
    for( i=0; i<AlertsList.length; ++i )
    {
        alert = AlertsList[i];
        if( !alert.modal || alert.modal < priority )
        {
            AlertsManager.Hide( alert.message );
            --i;
        }
    }
};


// Alerts that require yes/no responses
AlertsManager.ConfirmationAlert = function(message, callback)
{
    var AlertsList = AlertsManager.AlertsList;

    var found = false;
    var i, alert;
    for( i=0; i<AlertsList.length; ++i )
    {
        alert = AlertsList[i];
        if( alert.message === message )
        {
            found = true;
            break;
        }
    }

    if( !found )
    {
        alert = new SceneUIAlert( message, true );
        alert.closeCallback = callback;
        alert.open();
        AlertsList.add( alert );
    }
};


// Alerts that require keyboard input
AlertsManager.InputAlert = function(message, callback, inputOptions)
{
    var AlertsList = AlertsManager.AlertsList;

    var found = false;
    var i, alert;
    for( i=0; i<AlertsList.length; ++i )
    {
        alert = AlertsList[i];
        if( alert.message === message )
        {
            found = true;
            break;
        }
    }

    if( !found )
    {
        alert = new SceneUIAlert( message, true, true );
        alert.closeCallback = callback;

        if( !inputOptions )
        {
            inputOptions = {};
        }
        alert.inputOptions = inputOptions;

        alert.open();

        AlertsList.add( alert );
    }
};


// Alerts that fade out over time or with a back press
AlertsManager.TimeoutAlert = function(message, timeout)
{
    var AlertsList = AlertsManager.AlertsList;

    var found = false;
    var i, alert;
    for( i=0; i<AlertsList.length; ++i )
    {
        alert = AlertsList[i];
        if( alert.message === message )
        {
            found = true;
            break;
        }
    }

    if( !found )
    {
        alert = new SceneUIAlert( message );
        if( timeout )
        {
            alert.setTimeout( timeout );
        }
        alert.open();
        AlertsList.add( alert );
    }
};


// Alerts that allow a user to cancel them
AlertsManager.Alert = function(message, callback, options)
{
    var AlertsList = AlertsManager.AlertsList;

    var found = false;
    var i, alert;
    for( i=0; i<AlertsList.length; ++i )
    {
        alert = AlertsList[i];
        if( alert.message === message )
        {
            found = true;
            break;
        }
    }

    if( !found )
    {
        alert = new SceneUIAlert( message, false, false, options );
        if( callback )
        {
            alert.closeCallback = callback;
        }
        alert.open();
        AlertsList.add( alert );
    }
};


// Notifications
AlertsManager.Notification = function(title, message, callback, timeout, colour, scale)
{
    var AlertsList = AlertsManager.AlertsList;

    var i, alert;
    for( i=0; i<AlertsList.length; ++i )
    {
        alert = AlertsList[i];
        if( alert.title === title )
        {
            alert.close();
            AlertsList.remove( alert );
            continue;
        }
    }

    if( !scale )
    {
        scale = 1.0;
    }

    // Double res notifications on mobile devices
    if( CCEngine.IsMobile() )
    {
        scale *= 2.0;
    }

    var height = 24.0*scale;
    var alertY = 480*0.5*0.75-height*0.5;
    for( i=0; i<AlertsList.length; ++i )
    {
        alert = AlertsList[i];
        if( alert.isNotification )
        {
            var y = alert.tileAlert.position[1];
            if( y >= alertY )
            {
                alertY = y - alert.tileAlert.collisionBounds[1] - height*0.5;
            }
        }
    }

    {
        alert = new SceneUINotification( title, message, height );
        if( callback )
        {
            alert.closeCallback = callback;
        }
        if( timeout )
        {
            alert.setTimeout( timeout );
        }
        alert.setY( alertY );
        if( scale )
        {
            alert.scale = scale;
            alert.requestResize();
        }
        if( colour )
        {
            alert.setColour( colour );
        }
        alert.open();
        AlertsList.add( alert );
    }
};


// User Messages
AlertsManager.UserMessage = function(userID, message, callback, timeout, colour)
{
    var AlertsList = AlertsManager.AlertsList;

    var i, alert;
    for( i=0; i<AlertsList.length; ++i )
    {
        alert = AlertsList[i];
        if( alert.title === userID )
        {
            alert.close();
            AlertsList.remove( alert );
            continue;
        }
    }

    {
        alert = new SceneUINotification( userID, message, 24.0, userID );
        if( callback )
        {
            alert.closeCallback = callback;
        }
        if( timeout )
        {
            alert.setTimeout( timeout );
        }
        if( colour )
        {
            alert.setColour( colour );
        }
        alert.open();
        AlertsList.add( alert );
    }
};
