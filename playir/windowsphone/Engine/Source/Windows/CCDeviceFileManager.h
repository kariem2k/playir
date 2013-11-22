/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCDeviceFileManager.h
 * Description : Windows specific file manager
 *
 * Created     : 05/01/12
 * Author(s)   : Ashraf Samy Hegabs
 *-----------------------------------------------------------
 */

#ifndef __CCDEVICEFILEMANAGER_H__
#define __CCDEVICEFILEMANAGER_H__


#include "CCFileManager.h"
#include "BasicReaderWriter.h"


class CCDeviceFileManager : public CCFileManager
{
public:
    CCDeviceFileManager(CCResourceType resourceType);
	~CCDeviceFileManager();

    bool open(const char *filePath);
	void close();
    uint read(void *dest, const uint size);
    void seek(const uint size);
    void setPosition(const uint pos);
    bool endOfFile();
    uint size();
    uint position();

    bool save(const char *filePath, const char *data, const int length);
	bool deleteFile(const char *filePath);

    bool exists(const char *filePath);

protected:
	BasicReaderWriter *m_basicReaderWriter;

	CCData data;
};



#endif // __CCDEVICEFILEMANAGER_H__
