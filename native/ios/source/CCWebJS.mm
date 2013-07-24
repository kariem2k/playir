/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCWebJS.mm
 *-----------------------------------------------------------
 */

#import "CCWebJS.h"
#import "CCDefines.h"
#import "CCAppManager.h"


#ifdef DEBUGON
//#define DEBUG_JS_ERRORS
#endif


@interface DebugWebDelegate : NSObject
@end
@implementation DebugWebDelegate
@class WebView;
@class WebScriptCallFrame;

#define kDidParseSource         0
#define kFailedToParseSource    1
#define kExceptionWasRaised     1
#define kDidEnterCallFrame      0
#define kWillExecuteStatement   0
#define kWillLeaveCallFrame     0

-(id)functionNameForFrame:(WebScriptCallFrame*)frame
{
    SEL functionNameSelector = @selector(functionName);
    id exception = [(id)frame performSelector:functionNameSelector];
    return exception;
}

-(id)callerForFrame:(WebScriptCallFrame*)frame
{
    SEL callerSelector = @selector(caller);
    id exception = [(id)frame performSelector:callerSelector];
    return exception;
}

-(id)exceptionForFrame:(WebScriptCallFrame*)frame
{
    SEL exceptionSelector = @selector(exception);
    id exception = [(id)frame performSelector:exceptionSelector];
    return exception;
}

- (void)webView:(WebView *)webView      didParseSource:(NSString *)source
 baseLineNumber:(unsigned)lineNumber
        fromURL:(NSURL *)url
       sourceId:(int)sid
    forWebFrame:(WebFrame *)webFrame {
    if (kDidParseSource)
        NSLog(@"ScriptDebugger called didParseSource: \nsourceId=%d, \nurl=%@", sid, url);
}

// some source failed to parse
- (void)webView:(WebView *)webView failedToParseSource:(NSString *)source
 baseLineNumber:(unsigned)lineNumber
        fromURL:(NSURL *)url
      withError:(NSError *)error
    forWebFrame:(WebFrame *)webFrame {
    if (kFailedToParseSource)
        NSLog(@"ScriptDebugger called failedToParseSource:\
              \nurl=%@ \nline=%d \nerror=%@ \nsource=%@",
              url, lineNumber, error, source);
}

- (void)webView:(WebView *)webView  exceptionWasRaised:(WebScriptCallFrame *)frame
       sourceId:(int)sid
           line:(int)lineno
    forWebFrame:(WebFrame *)webFrame {
    if (kExceptionWasRaised)
        NSLog(@"ScriptDebugger exception:\
              \nsourceId=%d \nline=%d \nfunction=%@, \ncaller=%@, \nexception=%@",
              sid,
              lineno,
              [self functionNameForFrame:frame],
              [self callerForFrame:frame],
              [self exceptionForFrame:frame]);
}

// just entered a stack frame (i.e. called a function, or started global scope)
- (void)webView:(WebView *)webView    didEnterCallFrame:(WebScriptCallFrame *)frame
       sourceId:(int)sid
           line:(int)lineno
    forWebFrame:(WebFrame *)webFrame {
    if (kDidEnterCallFrame)
        NSLog(@"ScriptDebugger didEnterCallFrame:\
              \nsourceId=%d \nline=%d \nfunction=%@, \ncaller=%@, \nexception=%@",
              sid,
              lineno,
              [self functionNameForFrame:frame],
              [self callerForFrame:frame],
              [self exceptionForFrame:frame]);
}

// about to execute some code
- (void)webView:(WebView *)webView willExecuteStatement:(WebScriptCallFrame *)frame
       sourceId:(int)sid
           line:(int)lineno
    forWebFrame:(WebFrame *)webFrame {
    if (kWillExecuteStatement)
        NSLog(@"ScriptDebugger willExecuteStatement:\
              \nsourceId=%d \nline=%d \nfunction=%@, \ncaller=%@, \nexception=%@",
              sid,
              lineno,
              [self functionNameForFrame:frame],
              [self callerForFrame:frame],
              [self exceptionForFrame:frame]);
}

// about to leave a stack frame (i.e. return from a function)
- (void)webView:(WebView *)webView   willLeaveCallFrame:(WebScriptCallFrame *)frame
       sourceId:(int)sid
           line:(int)lineno
    forWebFrame:(WebFrame *)webFrame {
    if (kWillLeaveCallFrame)
        NSLog(@"ScriptDebugger willLeaveCallFrame:\
              \nsourceId=%d \nline=%d \nfunction=%@, \ncaller=%@, \nexception=%@",
              sid,
              lineno,
              [self functionNameForFrame:frame],
              [self callerForFrame:frame],
              [self exceptionForFrame:frame]);
}
@end



@implementation CCWebJS

-(id)initWithFrame:(CGRect)frame
{
    self = [super initWithFrame:frame];
    if( self != NULL )
    {
        self.delegate = self;
        self.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
        self->loaded = false;
        self.hidden = true;

        self.allowsInlineMediaPlayback = true;
        self.mediaPlaybackRequiresUserAction = false;
    }

    return self;
}

-(void)dealloc
{
    [super dealloc];
}


-(void)remove
{
    [self removeFromSuperview];
}


-(void)openPage:(const char*)url
{
    loaded = false;

    [[NSURLCache sharedURLCache] removeAllCachedResponses];
    [self loadRequest:[NSURLRequest requestWithURL:[NSURL URLWithString:[NSString stringWithFormat:@"%s", url]]]];
}


-(void)openFile:(const char*)file
{
    loaded = false;

    if( [NSURLCache sharedURLCache] != NULL )
    {
        [[NSURLCache sharedURLCache] removeAllCachedResponses];
    }
    [self loadRequest:[NSURLRequest requestWithURL:[NSURL fileURLWithPath:[NSString stringWithFormat:@"%s", file]]]];
}


-(void)openData:(const char*)url data:(const char*)data
{
    loaded = false;

    [self loadHTMLString:[NSString stringWithFormat:@"%s", data] baseURL:[NSURL URLWithString:[NSString stringWithFormat:@"%s", url]]];
}


-(void)webViewDidStartLoad:(UIWebView*)webView
{
}


-(void)webViewDidFinishLoad:(UIWebView*)webView
{
    loaded = true;

    NSString *url = webView.request.URL.absoluteString;
    currentUrl = [url UTF8String];
    CCText data = [self runJavaScript:"document.body.innerHTML"];

    CCAppManager::WebJSLoadedNativeThread( [self getURL], data.buffer );
}


-(void)webView:(UIWebView*)webView didFailLoadWithError:(NSError*)error
{
    loaded = false;

    NSString *url = webView.request.URL.absoluteString;
    currentUrl = [url UTF8String];
    CCAppManager::WebJSLoadedNativeThread( [self getURL], "" );
}


-(const char*)getURL
{
    return currentUrl.buffer;
}


-(const char*)runJavaScript:(const char*)script
{
//    const NSTimeInterval startTime = [NSDate timeIntervalSinceReferenceDate];
    NSString *result = [self stringByEvaluatingJavaScriptFromString:[NSString stringWithFormat:@"%s", script]];
//    const NSTimeInterval endTime = [NSDate timeIntervalSinceReferenceDate];
//    const NSTimeInterval time = endTime - startTime;
//    DEBUGLOG( "%s %.1fms\n", script, time * 1000.0f );
//    DEBUGLOG( "%s\n", script );

    if( result != NULL )
    {
        return [result UTF8String];
    }
    return NULL;
}


#ifdef DEBUG_JS_ERRORS
- (void)webView:(id)sender didClearWindowObject:(id)windowObject forFrame:(WebFrame*)frame
{
    [sender setScriptDebugDelegate:[[DebugWebDelegate alloc] init]];
}
#endif


@end
