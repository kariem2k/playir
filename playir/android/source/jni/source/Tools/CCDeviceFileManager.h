/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCDeviceFileManager.h
 * Description : Android specific file manager.
 *
 * Created     : 15/05/11
 * Author(s)   : Chris Bowers, Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

#ifndef __CCDEVICEFILEMANAGER_H__
#define __CCDEVICEFILEMANAGER_H__

#include "CCFileManager.h"

#include "../libzip/zip.h"


class CCBaseFile;


class CCDeviceFileManager : public CCFileManager
{
public:
	CCDeviceFileManager(CCResourceType resourceType);
	~CCDeviceFileManager();

	bool open(const char *file);
	void close();
	uint read(void *dest, const uint size);
	void seek(const uint size);
	void setPosition(const uint pos);
	bool endOfFile();
	uint size();
	uint position();

public:
    static CCText apkPath;
    static CCText dataPath;

private:
    CCBaseFile *m_File;
};



class CCBaseFile
{
public:
	virtual const bool open(const char *file) = 0;
	virtual void close() = 0;
	virtual const uint read(void *dest, const uint size) = 0;
	virtual void seek(const uint size) = 0;
	virtual void setPosition(const uint pos) = 0;
	const bool endOfFile()
	{
		return m_Position >= m_Size;
	}

	virtual const uint size()
	{
		return m_Size;
	}

	virtual const uint position()
	{
		return m_Position;
	}

protected:
	uint m_Size;
	uint m_Position;
};



class CCZipFile : public CCBaseFile
{
public:
	CCZipFile();

	const bool open(const char *file);
	void close();
	const uint read(void *dest, const uint size);
	void seek(const uint size);
	void setPosition(const uint pos);

protected:
	zip_file *m_File;

private:
	zip *m_apkArchive;
};



class CCBinaryFile : public CCBaseFile
{
public:
	CCBinaryFile();

	const bool open(const char *file);
	void close();
	const uint read(void *dest, const uint size);
	void seek(const uint size);
	void setPosition(const uint pos);

protected:
	FILE *m_File;
};


#endif // __CCDEVICEFILEMANAGER_H__
