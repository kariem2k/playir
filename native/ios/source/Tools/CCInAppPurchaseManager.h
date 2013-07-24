#import <Foundation/Foundation.h>
#import <StoreKit/StoreKit.h>
#import "CCAlertView.h"

enum BuyingState
{
    inAppPurchase_Nothing,
    inAppPurchase_RequestDialog,
    inAppPurcahse_RestoringItem,
    inAppPurchase_RestoredItem,
    inAppPurchase_BuyingItem,
    inAppPurchase_BoughtItem
};

@interface InAppPurchaseManager : NSObject <SKProductsRequestDelegate, SKPaymentTransactionObserver>
{
    SKProductsRequest *productsRequest;

    CCAlertView *alertNotification;

    BuyingState state;
    NSString *nsPurchasingItemCode;
    class CCLambdaCallback *onSuccess;
}

-(BOOL)canMakePurchases;
-(void)purchaseInAppUpgrade;

-(void)buyItem:(const char*)itemCode consumable:(bool)consumable callback:(CCLambdaCallback*)callback;

-(void)notification:(NSString*)message;


@end