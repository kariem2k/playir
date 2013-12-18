/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCDeviceFileManager.h
 * Description : iOS specific file manager.
 *
 * Created     : 09/03/10
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

#include "CCFileManager.h"

class CCDeviceFileManager : public CCFileManager
{
public:
	CCDeviceFileManager(CCResourceType resourceType);

	bool open(const char *filePath);
	void close();
	uint read(void *dest, const uint size);
    void seek(const uint size);
	void setPosition(const uint pos);
	bool endOfFile();
	uint size();
	uint position();

    static const char* GetAppFolder();
    static const char* GetDocsFolder();

protected:
	FILE *m_File;
	uint m_Size;
	uint m_Position;
};
