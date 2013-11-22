/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCDeviceAudioManager.cpp
 *-----------------------------------------------------------
 */

#include "CCDefines.h"
#include "CCAppManager.h"
#include "CCFileManager.h"
#include "CCDeviceAudioManager.h"


void CCDeviceAudioManager::Reset()
{
	csActionStack.add( new CSAction( "CCDeviceAudioManager::Reset" ) );
}


void CCDeviceAudioManager::Prepare(const char *id, const char *url)
{
	CCResourceType resourceType = CCFileManager::FindFile( url );
	CCText path;
	CCFileManager::GetFilePath( path, url, resourceType );
	
	CCText parameters = id;
	parameters += ", ";
	parameters += url;
	parameters += ", ";
	parameters += path;

	csActionStack.add( new CSAction( "CCDeviceAudioManager::Prepare, ", parameters.buffer ) );
}


void CCDeviceAudioManager::Play(const char *id, const char *url, const bool restart, const bool loop)
{
	CCResourceType resourceType = CCFileManager::FindFile( url );
	CCText path;
	CCFileManager::GetFilePath( path, url, resourceType );
	
	CCText parameters = id;
	parameters += ", ";
	parameters += url;
	parameters += ", ";
	parameters += path;
	parameters += ", ";
	parameters += restart ? "true" : "false";
	parameters += ", ";
	parameters += loop ? "true" : "false";

	csActionStack.add( new CSAction( "CCDeviceAudioManager::Play, ", parameters.buffer ) );
}


void CCDeviceAudioManager::Stop(const char *id)
{
	csActionStack.add( new CSAction( "CCDeviceAudioManager::Stop, ", id ) );
}


void CCDeviceAudioManager::Pause(const char *id)
{
	csActionStack.add( new CSAction( "CCDeviceAudioManager::Pause, ", id ) );
}


void CCDeviceAudioManager::Resume(const char *id)
{
	csActionStack.add( new CSAction( "CCDeviceAudioManager::Resume, ", id ) );
}


void CCDeviceAudioManager::SetTime(const char *id, const float time)
{
	CCText parameters = id;
	parameters += ", ";
	parameters += time;

	csActionStack.add( new CSAction( "CCDeviceAudioManager::SetTime, ", id ) );
}


void CCDeviceAudioManager::SetVolume(const char *id, const float volume)
{
	CCText parameters = id;
	parameters += ", ";
	parameters += volume;

	csActionStack.add( new CSAction( "CCDeviceAudioManager::SetVolume, ", id ) );
}
