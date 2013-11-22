/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCDeviceURLManager.h
 * Description : Windows specific url manager.
 *
 * Created     : 05/01/12
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

#ifndef __CCDEVICEURLMANAGER_H__
#define __CCDEVICEURLMANAGER_H__


#include "CCBaseTools.h"
#include "CCBaseTypes.h"
#include "CCJSON.h"
struct CCURLRequest;

class CCDeviceURLManager
{
public:
    CCDeviceURLManager();

    void clear();
    bool isReadyToRequest();

	void processRequest(CCURLRequest *inRequest);
	void downloadFinished(const char *url, const bool success, const char *result, const int length, const char *headers);

protected:
    void downloadFinished(const char *url, const bool success,
    					  const char *data, const int length,
    					  CCList<CCText> &headerNames, CCList<CCText> &headerValues);

protected:
    CCList<CCURLRequest> currentRequests;
};


#endif // __CCDEVICEURLMANAGER_H__
