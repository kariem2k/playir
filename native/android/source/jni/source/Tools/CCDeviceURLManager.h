/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCDeviceURLManager.h
 * Description : Android specific url manager.
 *
 * Created     : 09/06/11
 * Author(s)   : Ashraf Samy Hegab, Chris Bowers
 *-----------------------------------------------------------
 */

#ifndef __CCDEVICEURLMANAGER_H__
#define __CCDEVICEURLMANAGER_H__

struct CCURLRequest;

class CCDeviceURLManager
{
public:
    CCDeviceURLManager();

    void clear();
    bool isReadyToRequest();

    void processRequest(CCURLRequest *inRequest);
    void downloadFinished(const char *url, const bool success,
    		const char *data, const int length,
    		CCList<CCText> &headerNames, CCList<CCText> &headerValues);

protected:
    CCList<CCURLRequest> currentRequests;
};

#endif // __CCDEVICEURLMANAGER_H__
