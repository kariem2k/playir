/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : TileSocialProfile.js
 * Description : Represents a Facebook/Twitter/Google+ Profile
 *
 * Created     : 10/08/11
 *-----------------------------------------------------------
 */

function GetDefaultProfilePhoto()
{
    var photos =
    [
        "resources/social/profile_derp.png",
        "resources/social/profile_f7u12.png",
        "resources/social/profile_girl.png",
        "resources/social/profile_grandma.png",
        "resources/social/profile_happy.png",
        "resources/social/profile_poker.png",
        "resources/social/profile_rich.png",
        "resources/social/profile_troll.png"
    ];

    var random = CC.Random( 7 );
    return photos[random];
}

function TileSocialProfile(scene, doNotBuffer)
{
    this.construct( scene );

    // Set a default profile photo
    if( !this.f7u12Photo )
    {
        this.f7u12Object = new CCObject();
        this.f7u12Object.setModel( new CCModelBase() );
        this.f7u12Object.setColour( gColour.set( 1.0 ) );
        this.f7u12Object.getColourInterpolator().setDuration( 0.25 );

        this.f7u12Photo = new CCPrimitiveSquare();
        this.f7u12Photo.setTexture( GetDefaultProfilePhoto() );
        this.f7u12Object.model.addPrimitive( this.f7u12Photo );

        // Make sure we're in the transparency pass as this objet gets drawn here and that we're drawn before the textObject
        this.f7u12Object.setTransparent();
        this.f7u12Object.setReadDepth( false );
        this.f7u12Object.setWriteDepth( false );

        this.addChild( this.f7u12Object, 0 );
    }

    this.setupTile( 1.0 );

    if( !doNotBuffer )
    {
        this.bufferInfo( 2 );
    }
}
ExtendPrototype( TileSocialProfile, TileProfileBase );


TileSocialProfile.prototype.renderObject = function(camera, alpha)
{
    this.TileProfileBase_renderObject( camera, alpha );
};


TileSocialProfile.prototype.renderModel = function(alpha)
{
    if( alpha )
    {
        this.TileProfileBase_renderModel( alpha );
    }
    else
    {
        this.TileProfileBase_renderModel( alpha );
    }
};


TileSocialProfile.prototype.APIDownloadedPhoto = function(url, photoID)
{
    if( photoID === this.facebookID ||
        photoID === this.twitterID ||
        photoID === this.googleID )
    {
        if( this.f7u12Object )
        {
            this.f7u12Object.setColourAlpha( 0.0, true );
        }

        if( this.tileSquares.length > 0 )
        {
            this.tileSquares[0].setTexture( url );
        }
    }
};


TileSocialProfile.prototype.removePhoto = function()
{
    this.f7u12Object.setColourAlpha( 1.0, true );

    this.profilePhotoRequestedPriority = -1;
    this.tileSquares[0].removeTexture();
};


TileSocialProfile.prototype.setTileSize = function(width, height)
{
    if( height === undefined )
    {
        height = width;
    }

	this.TileProfileBase_setTileSize( width, height );
	this.f7u12Photo.setScale( width * this.photoWidth, height * this.photoWidth, 1.0 );
};


TileSocialProfile.prototype.setFacebookID = function(inUserID)
{
    this.facebookID = inUserID;
    this.profilePhotoRequestedPriority = -1;
};


TileSocialProfile.prototype.getFacebookID = function()
{
    return this.facebookID;
};


TileSocialProfile.prototype.setTwitterID = function(inUserID)
{
    this.twitterID = inUserID;
    this.profilePhotoRequestedPriority = -1;
};


TileSocialProfile.prototype.getTwitterID = function()
{
    return this.twitterID;
};


TileSocialProfile.prototype.setGoogleID = function(inUserID)
{
    this.googleID = inUserID;
    this.profilePhotoRequestedPriority = -1;
};


TileSocialProfile.prototype.getGoogleID = function()
{
    return this.googleID;
};


TileSocialProfile.prototype.setName = function(inUserName)
{
    this.userName = inUserName;
	this.userSurname = String.LastWord( inUserName );
};


TileSocialProfile.prototype.getName = function()
{
    return this.userName;
};


TileSocialProfile.prototype.bufferInfo = function(priority, callback)
{
    // If we don't specifically have a facebook ID, try twitter first, then goole+
    if( !this.facebookID )
    {
        if( this.bufferTwitterInfo( 2, callback ) )
        {
            return;
        }

        if( this.bufferGoogleInfo( 2, callback ) )
        {
            return;
        }
    }

    this.bufferFBInfo( priority, false, callback );
};


TileSocialProfile.prototype.reset = function()
{
    this.userName = "";
    this.userSurname = "";
    this.googleID = "";
    this.twitterID = "";
    this.facebookID = "";

    this.removePhoto();
};


TileSocialProfile.GetFBInfo = function(priority, callback, noCache)
{
    var self = this;
    function FBInfoCallback() {}
    FBInfoCallback.prototype.run = function()
    {
        var reply = this.reply;
        if( reply && reply.state >= CCURLRequest.Succeeded )
        {
            // If we can't parse the json data, we have bad data in our cache
            var root;
            try
            {
                root = JSON.parse( reply.data );
            }
            catch (error)
            {
                // Try again without our cache
                if( reply.state === CCURLRequest.Used_Cache )
                {
                    self.GetFBInfo( priority, callback, true );
                }
            }

            if( root )
            {
                if( callback )
                {
                    callback( root.id, root.name );
                }
            }
        }

        // Failed
        else
        {
            if( callback )
            {
                callback();
            }
        }
    };
    CCAPIFacebook.Request( new FBInfoCallback(), this.facebookID ? this.facebookID : "me", priority, noCache );
};


TileSocialProfile.prototype.bufferFBInfo = function(priority, noCache, callback)
{
    var self = this;
    TileSocialProfile.GetFBInfo( priority, function (id, name)
    {
        if( id && name )
        {
            self.parseFBInfoJSON( id, name, priority, callback );
        }
    }, noCache );
};


TileSocialProfile.prototype.parseFBInfoJSON = function(id, name, priority, callback)
{
	var jsonStringID = id;
	var jsonStringName = name;

    this.setFacebookID( jsonStringID );
    this.setName( jsonStringName );

    this.bufferFBProfilePhoto( priority );
    //this.bufferTaggedPhotos( 0 );

    if( callback )
    {
        callback( this, true );
    }
};


TileSocialProfile.GetTwitterInfo = function(callback)
{
    return CC.LoadData( "twitter.me" );
};


TileSocialProfile.prototype.bufferTwitterInfo = function(priority, callback)
{
    var username = TileSocialProfile.GetTwitterInfo();
    if( username !== undefined )
    {
        this.setTwitterID( username );
        this.setName( "@" + username );
        this.bufferTwitterProfilePhoto( priority );

        if( callback )
        {
            callback( this, true );
        }
        return true;
    }


    if( callback )
    {
        callback( this, false );
    }
    return false;
};


TileSocialProfile.GetGoogleInfo = function(callback)
{
    var user = CC.LoadData( "google.me" );
    if( user !== undefined )
    {
        if( callback )
        {
            var json = JSON.parse( user );
            callback( json.id, json.name );
        }
    }
    else if( callback )
    {
        callback();
    }
    return user;
};


TileSocialProfile.prototype.bufferGoogleInfo = function(priority, callback)
{
    var self = this;
    var user = TileSocialProfile.GetGoogleInfo( function (id, name)
    {
        if( id && name )
        {
            self.setGoogleID( id );
            self.setName( name );
            self.bufferGoogleProfilePhoto( priority );

            if( callback )
            {
                callback( self, true );
            }
        }
    });

    if( user === undefined )
    {
        if( callback )
        {
            callback( this, false );
        }
        return false;
    }

    return true;
};


TileSocialProfile.prototype.bufferFBProfilePhoto = function(priority)
{
    if( this.profilePhotoRequestedPriority >= -1 )
    {
        if( this.profilePhotoRequestedPriority !== priority )
        {
            this.profilePhotoRequestedPriority = priority;

            CCAPIFacebook.RequestPhotoID( this, this.facebookID, priority );
        }
    }
};


TileSocialProfile.prototype.bufferTwitterProfilePhoto = function(priority)
{
    if( this.profilePhotoRequestedPriority >= -1 )
    {
        if( this.profilePhotoRequestedPriority !== priority )
        {
            this.profilePhotoRequestedPriority = priority;

            CCAPITwitter.RequestPhotoID( this, this.twitterID, priority );
        }
    }
};


TileSocialProfile.prototype.bufferGoogleProfilePhoto = function(priority)
{
    if( this.profilePhotoRequestedPriority >= -1 )
    {
        if( this.profilePhotoRequestedPriority !== priority )
        {
            this.profilePhotoRequestedPriority = priority;

            CCAPIGoogle.RequestPhotoID( this, this.googleID, priority );
        }
    }
};


function FBPhotosCallback(scene, priority, refresh, previousPhotoID)
{
    this.scene = scene;
    this.priority = priority;
    this.refreshing = refresh;
    this.previousPhotoID = previousPhotoID;
}
FBPhotosCallback.prototype.run = function()
{
    this.scene.parseFBPhotos( this.reply.state,
                             this.reply.url,
                             this.reply.data,
                             this.priority,
                             this.refreshing,
                             this.previousPhotoID );
};


TileSocialProfile.prototype.bufferTaggedPhotos = function(priority, refresh)
{
    if( refresh )
    {
        this.taggedPhotosRefreshing = true;
    }

    var fbRequest = this.facebookID;
    fbRequest += "/photos";
    var fbCallback = new FBPhotosCallback( this, 1, refresh, false );
    CCAPIFacebook.Request( fbCallback, fbRequest, 1, refresh, 0.5, 12 );
};


TileSocialProfile.prototype.parseFBPhotos = function(state,
                                                     requestURL,
                                                     response,
                                                     priority,
                                                     refreshing,
                                                     previousPhotoID)
{
    var taggedPhotos = this.taggedPhotos;

    // If we're refreshing, ignore any previous requests
    if( this.taggedPhotosRefreshing )
    {
        if( !refreshing )
        {
            return;
        }

        if( previousPhotoID )
        {
            return;
        }

        this.taggedPhotosRefreshing = false;
        taggedPhotos.clear();
    }

    // If our download has failed, exit..
    if( state < CCURLRequest.Succeeded )
    {
        //DEBUGLOG( "Failed to download photos list\n" );
        if( this.photosDownloadedCallback )
        {
            this.photosDownloadedCallback.run();
        }
        return;
    }

    function PhotoData(inPhotoID, inThumbnailURL, inPhotoURL)
    {
        this.photoID = inPhotoID;

        // https is slow
        this.thumbnailURL = String.RemoveBetween( inThumbnailURL, "http", "://" );
        this.photoURL = String.RemoveBetween( inPhotoURL, "http", "://" );
    }
    var downloadedPhotoData = [];

    var root = JSON.parse( response );
    if( root )
    {
        var i, jsonObject;

        {
            var jsonData = root.data;
            if( jsonData )
            {
                var length = jsonData.length;
                for( i=0; i<length; ++i )
                {
                    jsonObject = jsonData[i];

                    var jsonPhotoID = jsonObject.id;
                    var jsonThumbnailURL = jsonObject.picture;
                    var jsonPhotoURL = jsonObject.source;
                    if( !jsonPhotoID || !jsonThumbnailURL || !jsonPhotoURL )
                    {
                        continue;
                    }

                    downloadedPhotoData.add( new PhotoData( jsonPhotoID, jsonThumbnailURL, jsonPhotoURL ) );
                }
            }
        }

        // Find the current index into our photos list
        var photoIndex = 0;
        if( previousPhotoID )
        {
            for( i=0; i<taggedPhotos.length; ++i )
            {
                var taggedPhoto = taggedPhotos.list[i];
                var photoID = taggedPhoto.photoID;
                if( photoID === previousPhotoID )
                {
                    photoIndex = i+1;
                    break;
                }
            }
        }

        // Add our new downloaded photos to our tagged photos list
        for( i=0; i<downloadedPhotoData.length; ++i )
        {
            var downloadedData = downloadedPhotoData[i];

            var found = false;
            if( photoIndex < taggedPhotos.length )
            {
                var downloadedPhotoID = downloadedData.photoID;
                var currentPhotoID = taggedPhotos.list[photoIndex].photoID;
                if( currentPhotoID === downloadedPhotoID )
                {
                    found = true;
                }
            }

            if( !found )
            {
                var newPhoto = new PhotoData( downloadedData.photoID,
                                              downloadedData.thumbnailURL,
                                              downloadedData.photoURL );
                taggedPhotos.insert( newPhoto, photoIndex );

                // Load in these images in the background
                //CCAPIFacebook::RequestPhotoURL( this, downloadedData.photoID.buffer, downloadedData.thumbnailURL.buffer, true, 0 );
                //CCAPIFacebook::RequestPhotoURL( this, downloadedData.photoID.buffer, downloadedData.photoURL.buffer, false, 0 );
            }

            photoIndex++;
        }

        if( this.photosDownloadedCallback )
        {
            this.photosDownloadedCallback.run();
        }

        {
            jsonObject = root.paging;
            if( jsonObject )
            {
                //json_t *jsonPrevious = json_object_get( jsonObject, "previous" );
                //const char *jsonStringPrevious = json_string_value( jsonPrevious );

                var url = jsonObject.next;
                if( url && url.length > 0 )
                {
                    var currentURL = String.SplitBetween( requestURL, "until=", "&" );

                    var nextURL = String.SplitBetween( url, "until=", "&" );

                    if( currentURL !== nextURL )
                    {
                        var fbCallback = new FBPhotosCallback( this, 1, refreshing, downloadedPhotoData.last().photoID );
                        CCAPIFacebook.RequestFBURL( fbCallback, url, priority, refreshing, 1.0 );
                    }
                    else
                    {
                        //DEBUGLOG( "TileProfileBase::Repeat URL %s \n", requestURL );
                    }
                }
            }
        }
    }
};
