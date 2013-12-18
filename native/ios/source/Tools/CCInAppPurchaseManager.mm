#import "CCDefines.h"
#import "CCInAppPurchaseManager.h"
#import "CCGLView.h"


@implementation InAppPurchaseManager


-(id)init
{
    self = [super init];

    state = inAppPurchase_Nothing;
    nsPurchasingItemCode = NULL;
    onSuccess = NULL;

    [[SKPaymentQueue defaultQueue] addTransactionObserver:self];

    return self;
}

-(void)dealloc
{
    [[SKPaymentQueue defaultQueue] removeTransactionObserver:self];
    [super dealloc];
}


-(void)requestInAppProductData
{
    if( alertNotification )
    {
        [alertNotification dismissWithClickedButtonIndex:0 animated:true];
        [alertNotification release];
    }

    // Connecting notification
    alertNotification = [[CCAlertView alloc] initWithTitle: @"In-App Store"
                                                    message: @"Connecting..."
                                                   delegate: self
                                          cancelButtonTitle: @"Cancel"
                                          otherButtonTitles: NULL];
    [alertNotification show];

    NSSet *productIdentifiers = [NSSet setWithObject:nsPurchasingItemCode];
    productsRequest = [[SKProductsRequest alloc] initWithProductIdentifiers:productIdentifiers];
    productsRequest.delegate = self;
    [productsRequest start];
}


-(void)productsRequest:(SKProductsRequest*)request didReceiveResponse:(SKProductsResponse*)response
{
    NSArray *products = response.products;
    // [products objectAtIndex:0] should be equivalent to [products firstObject]
    const int count = [products count];
    SKProduct *inAppProduct = count == 1 ? [[products objectAtIndex:0] retain] : nil;
    if( inAppProduct )
    {
        DEBUGLOG( "Product title: %s\n", [inAppProduct.localizedTitle UTF8String] );
        DEBUGLOG( "Product description: %s\n", [inAppProduct.localizedDescription UTF8String] );
//        DEBUGLOG( "Product price: %f", proUpgradeProduct.price );
        DEBUGLOG( "Product ID: %s\n", [inAppProduct.productIdentifier UTF8String] );
    }

    for( NSString *invalidProductId in response.invalidProductIdentifiers )
    {
        DEBUGLOG( "Invalid product ID: %s\n", [invalidProductId UTF8String] );
    }

    [productsRequest release];
    productsRequest = NULL;

    if( alertNotification )
    {
        [alertNotification dismissWithClickedButtonIndex:0 animated:true];
        [alertNotification release];
        alertNotification = NULL;

        // Only go on to buy the item if the notification hasn't been cancelled.
        if( inAppProduct )
        {
            [self purchaseInAppUpgrade];
        }
    }

    if( inAppProduct == NULL )
    {
        state = inAppPurchase_Nothing;
        if( nsPurchasingItemCode != NULL )
        {
            [nsPurchasingItemCode release];
            nsPurchasingItemCode = NULL;
        }
        DELETE_POINTER( onSuccess );
        [self notification:@"Coming Soon.\nPlease check back later."];
    }
}


// Call this before making a purchase
-(BOOL)canMakePurchases
{
    return [SKPaymentQueue canMakePayments];
}


-(void)purchaseInAppUpgrade
{
	[gView setActivityState:activity_on];

    SKPayment *payment = [SKPayment paymentWithProductIdentifier:nsPurchasingItemCode];
    [[SKPaymentQueue defaultQueue] addPayment:payment];
}


// Remove transaction from the queue and post a notification with the result
-(void)finishTransaction:(SKPaymentTransaction*)transaction wasSuccessful:(BOOL)wasSuccessful
{
	[gView setActivityState:activity_off];

    [[SKPaymentQueue defaultQueue] finishTransaction:transaction];

    //NSDictionary *userInfo = [NSDictionary dictionaryWithObjectsAndKeys:transaction, @"transaction", nil];
    if( wasSuccessful )
    {
        state = inAppPurchase_BoughtItem;
        if( onSuccess != NULL )
        {
            gEngine->nativeToEngineThread( onSuccess );
            onSuccess = NULL;
        }
    }
    else
    {
        DELETE_POINTER( onSuccess );
    }

    state = inAppPurchase_Nothing;
    if( nsPurchasingItemCode != NULL )
    {
        [nsPurchasingItemCode release];
        nsPurchasingItemCode = NULL;
    }
}


-(void)completeTransaction:(SKPaymentTransaction*)transaction
{
    [self finishTransaction:transaction wasSuccessful:YES];
    [self notification:@"Purchase complete."];
}


-(void)restoreTransaction:(SKPaymentTransaction*)transaction
{
    [self finishTransaction:transaction wasSuccessful:YES];
    [self notification:@"Purchase restored."];
}


-(void)failedTransaction:(SKPaymentTransaction*)transaction
{
#ifdef DEBUGON
    NSLog( @"FailedTransaction: %@", [transaction.error userInfo] );
#endif
    if( transaction.error.code != SKErrorPaymentCancelled )
    {
        [self finishTransaction:transaction wasSuccessful:NO];
        [self notification:@"Unable to purchase. \nPlease try again later."];
    }
    else
    {
        [self finishTransaction:transaction wasSuccessful:NO];
    }
}

-(void)paymentQueue:(SKPaymentQueue*)queue updatedTransactions:(NSArray*)transactions
{
    for( SKPaymentTransaction *transaction in transactions )
    {
        SKPaymentTransactionState transactionState = transaction.transactionState;
        switch( transactionState )
        {
            case SKPaymentTransactionStatePurchased:
                [self completeTransaction:transaction];
                break;

            case SKPaymentTransactionStateFailed:
                [self failedTransaction:transaction];
                break;

            case SKPaymentTransactionStateRestored:
                [self restoreTransaction:transaction];
                break;

            default:
                break;
        }
    }
}


-(void)buyItem:(const char*)itemCode consumable:(bool)consumable callback:(CCLambdaCallback*)callback
{
    if( state == inAppPurchase_Nothing )
    {
        if( productsRequest )
        {
            [productsRequest release];
        }

        if( onSuccess != NULL )
        {
            DELETE_POINTER( onSuccess );
        }

        if( alertNotification )
        {
            [alertNotification dismissWithClickedButtonIndex:0 animated:true];
            [alertNotification release];
        }

        nsPurchasingItemCode = [[NSString alloc] initWithFormat:@"%s", itemCode];
        onSuccess = callback;

        // Connecting notification
        if( consumable )
        {
            [self requestInAppProductData];
        }
        else
        {
            state = inAppPurchase_RequestDialog;
            alertNotification = [[CCAlertView alloc] initWithTitle: @"In-App Store\n "
                                                           message: @"     You have selected a premium item.     "
                                                          delegate: self
                                                 cancelButtonTitle: @"Cancel"
                                                 otherButtonTitles: @"Purchase Item", @"Restore Item", NULL];
            [alertNotification show];
        }
    }
}


-(void)restoreItem
{
    state = inAppPurcahse_RestoringItem;

    // Show we're doing something
    [gView setActivityState:activity_on];

    [[SKPaymentQueue defaultQueue] restoreCompletedTransactions];
}


-(void)notification:(NSString*)message
{
    CCAlertView *alert = [[CCAlertView alloc] initWithTitle: @"In-App Store"
                                                    message: message
                                                   delegate: NULL
                                          cancelButtonTitle: @"OK"
                                          otherButtonTitles: NULL];
    [alert show];
    [alert release];
}


-(void)alertView:(UIAlertView*)alertView clickedButtonAtIndex:(NSInteger)buttonIndex
{
    if( alertView == alertNotification )
    {
        [alertNotification release];
        alertNotification = NULL;

        // Cancel button pressed
        if( buttonIndex == 0 )
        {
            if( productsRequest )
            {
                [productsRequest release];
                productsRequest = NULL;
            }

            DELETE_POINTER( onSuccess );

            state = inAppPurchase_Nothing;
            if( nsPurchasingItemCode != NULL )
            {
                [nsPurchasingItemCode release];
                nsPurchasingItemCode = NULL;
            }
        }
        else if( state == inAppPurchase_RequestDialog )
        {
            if( buttonIndex == 1 )
            {
                [self requestInAppProductData];
            }
            else if( buttonIndex == 2 )
            {
                [self restoreItem];
            }
        }
    }
}


// Sent when an error is encountered while adding transactions from the user's purchase history back to the queue.
-(void)paymentQueue:(SKPaymentQueue *)queue restoreCompletedTransactionsFailedWithError:(NSError *)error
{
	[gView setActivityState:activity_off];

    if( error != NULL )
    {
        NSString *nsError = [error localizedDescription];
        if( nsError != NULL )
        {
            DEBUGLOG( "%s", [nsError UTF8String] );
        }
    }

    if( state == inAppPurcahse_RestoringItem )
    {
        state = inAppPurchase_Nothing;
        [self notification:@"Unable to restore item. \nPlease try again later."];
    }
}


// Sent when all transactions from the user's purchase history have successfully been added back to the queue.
-(void)paymentQueueRestoreCompletedTransactionsFinished:(SKPaymentQueue*)queue
{
	[gView setActivityState:activity_off];

    if( nsPurchasingItemCode != NULL )
    {
        const char *purchasingItem = [nsPurchasingItemCode UTF8String];
        bool itemFound = false;

#ifdef DEBUGON
        DEBUGLOG( "received restored transactions: %i", queue.transactions.count );
#endif
        for( SKPaymentTransaction *transaction in queue.transactions )
        {
            if( transaction != NULL )
            {
                //SKPaymentTransactionState transactionState = [transaction transactionState];
                SKPayment *payment = [transaction payment];
                if( payment != NULL )
                {
                    NSString *nsProductIdentifier = [payment productIdentifier];
                    if( nsProductIdentifier != NULL )
                    {
                        const char *productIdentifier = [nsProductIdentifier UTF8String];
                        if( CCText::Equals( productIdentifier, purchasingItem ) )
                        {
                            itemFound = true;
                            break;
                        }
                    }
                }
            }
        }

        if( itemFound )
        {
            state = inAppPurchase_RestoredItem;
            if( onSuccess != NULL )
            {
                gEngine->nativeToEngineThread( onSuccess );
                onSuccess = NULL;
            }

            // Connecting notification
            alertNotification = [[CCAlertView alloc] initWithTitle: @"In-App Store"
                                                           message: @"Item has been restored."
                                                          delegate: self
                                                 cancelButtonTitle: @"Continue"
                                                 otherButtonTitles: NULL];
            [alertNotification show];
        }
        else
        {
            state = inAppPurchase_Nothing;
            [self notification:@"Unable to restore item. \nPlease try again later."];
        }
    }
}


@end