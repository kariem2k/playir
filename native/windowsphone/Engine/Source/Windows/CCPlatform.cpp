/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCPlatform.cpp
 *-----------------------------------------------------------
 */

#include "CCDefines.h"


CCList<JSAction> jsActionStack;
CCList<CSAction> csActionStack;


void CCNativeThreadLock()
{
}


void CCNativeThreadUnlock()
{
}


void CCJobsThreadLock()
{
}


void CCJobsThreadUnlock()
{
}


const char* GetChars(Platform::String^ string)
{
	if( string != nullptr )
	{
		static CCText text;

		const wchar_t *wchars = string->Data();
		const size_t length = wcslen( wchars );

		text.setSize( length+1 );

		size_t CharactersConverted=0;
		wcstombs_s( &CharactersConverted, text.buffer, text.length, wchars, length );

		return text.buffer;
	}

	return "";
}


Platform::String^ GetString(const char *c)
{
	size_t requiredSize = 0;
	mbstowcs_s( &requiredSize, NULL, 0, c, 0 );
    wchar_t* wc = new wchar_t[requiredSize+1];
	mbstowcs_s( &requiredSize, wc, requiredSize + 1, c, requiredSize );

	Platform::String^ string = ref new Platform::String( wc );
	delete[] wc;

    return string;
}