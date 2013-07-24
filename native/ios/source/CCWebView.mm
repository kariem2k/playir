/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCWebView.mm
 *-----------------------------------------------------------
 */

#import "CCWebView.h"
#import "CCDefines.h"
#import "CCAppManager.h"


@implementation CCWebView

-(id)initWithView:(UIView*)parentView
{
    // Create a view container to help us with our toolbar and rotations
    UIView *view = [[UIView alloc] initWithFrame:parentView.frame];
    [parentView addSubview:view];
    [view release];

    // Create a toolbar where we can place some buttons
    {
        toolbar = [[UIToolbar alloc] initWithFrame:CGRectMake( 0, 0, view.bounds.size.width, 40 )];
        toolbar.autoresizingMask=UIViewAutoresizingFlexibleWidth;
        [toolbar setBarStyle: UIBarStyleBlackTranslucent];

        // create an array for the buttons
        NSMutableArray* buttons = [[NSMutableArray alloc] initWithCapacity:3];

        // create a standard back button
        UIBarButtonItem *cancelButton = [[UIBarButtonItem alloc] initWithBarButtonSystemItem:UIBarButtonSystemItemCancel
                                                                                      target:self
                                                                                      action:@selector( cancelAction: )];
        cancelButton.style = UIBarButtonItemStyleBordered;
        [buttons addObject:cancelButton];
        [cancelButton release];

        // put the buttons in the toolbar and release them
        [toolbar setItems:buttons animated:true];
        [buttons release];
    }

    // Setup our WebView
    {
        loaded = false;
        self = [super initWithFrame:CGRectMake( 0, toolbar.bounds.size.height,
                                                view.bounds.size.width, view.bounds.size.height - toolbar.bounds.size.height )];

        self.delegate = self;
        self.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;

        [self setBackgroundColor:[UIColor blackColor]];
    }

    viewContainer = view;
    [CCAppManager::ViewController registerRotateableView:self];
    [self setOrientation:[CCAppManager::ViewController getInterfaceOrientation] duration:0.0f];

    [view addSubview:toolbar];
    [toolbar release];
    [view addSubview:self];
    [self release];

    return self;
}


-(void)dealloc
{
    [CCAppManager::ViewController unregisterRotateableView:self];
    [super dealloc];
}


-(void)remove
{
    [viewContainer removeFromSuperview];
    [self release];
}


-(void)setOrientation:(UIInterfaceOrientation)inOrientation duration:(const float)duration
{
    if( interfaceOrientation != inOrientation )
    {
        interfaceOrientation = inOrientation;

        [UIView setAnimationBeginsFromCurrentState:true];
        [UIView beginAnimations:@"View Flip" context:nil];
        [UIView setAnimationDuration:duration];
        [UIView setAnimationCurve:UIViewAnimationCurveEaseInOut];

        if( interfaceOrientation == UIInterfaceOrientationPortrait )
        {
            CGAffineTransform transform = CGAffineTransformMakeRotation( CC_DEGREES_TO_RADIANS( 0.0f ) );
            viewContainer.transform = transform;
        }
        else if( interfaceOrientation == UIInterfaceOrientationPortraitUpsideDown )
        {
            CGAffineTransform transform = CGAffineTransformMakeRotation( CC_DEGREES_TO_RADIANS( 180.0f ) );
            viewContainer.transform = transform;
        }
        else if( interfaceOrientation == UIInterfaceOrientationLandscapeLeft )
        {
            CGAffineTransform transform = CGAffineTransformMakeRotation( CC_DEGREES_TO_RADIANS( 270.0f ) );
            viewContainer.transform = transform;
        }
        else if( interfaceOrientation == UIInterfaceOrientationLandscapeRight )
        {
            CGAffineTransform transform = CGAffineTransformMakeRotation( CC_DEGREES_TO_RADIANS( 90.0f ) );
            viewContainer.transform = transform;
        }

        const CCSize &size = gEngine->renderer->getScreenSize();
        CGRect screenRect = CGRectMake( 0, 0, size.width, size.height );
        viewContainer.frame = screenRect;

        if( interfaceOrientation == UIInterfaceOrientationPortrait || interfaceOrientation == UIInterfaceOrientationPortraitUpsideDown )
        {
            toolbar.frame = CGRectMake( 0, 0, screenRect.size.width, 40 );
            self.frame = CGRectMake( 0, toolbar.bounds.size.height,
                                    screenRect.size.width, screenRect.size.height - toolbar.bounds.size.height );
        }
        else
        {
            toolbar.frame = CGRectMake( 0, 0, screenRect.size.height, 40 );
            self.frame = CGRectMake( 0, toolbar.bounds.size.height,
                                     screenRect.size.height, screenRect.size.width - toolbar.bounds.size.height );
        }

        [UIView commitAnimations];
    }
}


-(void)cancelAction:(id)inButton
{
    CCAppManager::WebViewClose( true );
}


-(void)openPage:(const char*)url
{
    loaded = false;

    [self loadRequest:[NSURLRequest requestWithURL:[NSURL URLWithString:[NSString stringWithFormat:@"%s", url]]]];
}


-(void)webViewDidFinishLoad:(UIWebView*)webView
{
    loaded = true;

    NSString *url = webView.request.URL.absoluteString;
    currentUrl = [url UTF8String];
    CCText data = [self runJavaScript:"document.body.innerHTML"];

    CCAppManager::WebViewLoadedNativeThread( [self getURL], data.buffer );
}


-(void)webView:(UIWebView*)webView didFailLoadWithError:(NSError*)error
{
    loaded = false;

    NSString *url = webView.request.URL.absoluteString;
    currentUrl = [url UTF8String];
    CCAppManager::WebViewLoadedNativeThread( [self getURL], "" );
}


-(const char*)getURL
{
    return currentUrl.buffer;
}


-(const char*)runJavaScript:(const char*)script
{
    NSString *html = [self stringByEvaluatingJavaScriptFromString:[NSString stringWithFormat:@"%s", script]];
    if( html != NULL )
    {
        return [html UTF8String];
    }
    return NULL;
}


+(void)ClearData
{
    gEngine->urlManager->flushPendingRequests();

    [[NSURLCache sharedURLCache] removeAllCachedResponses];

    // Clear cookies
    for( NSHTTPCookie *cookie in [[NSHTTPCookieStorage sharedHTTPCookieStorage] cookies] )
    {
        //NSString *domain = [cookie domain];
        //if( [domain isEqualToString:someNSStringUrlDomain] )
        {
            [[NSHTTPCookieStorage sharedHTTPCookieStorage] deleteCookie:cookie];
        }
    }
}


@end
