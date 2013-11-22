/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCTextureFontPageFile.cpp
 *-----------------------------------------------------------
 */

#include "CCDefines.h"
#include "CCTextureFontPageFile.h"
#include "CCFileManager.h"


CCTextureFontPageFile::CCTextureFontPageFile(const char *inName)
{
    name = inName;
}


CCTextureFontPageFile::~CCTextureFontPageFile()
{
}


bool CCTextureFontPageFile::load()
{
    CCText textureFile( name );
    textureFile += ".png";

    CCResourceType resourceType = CCFileManager::FindFile( textureFile.buffer );
    if( resourceType != Resource_Unknown )
    {
        texturePageIndex = gEngine->textureManager->assignTextureIndex( textureFile.buffer, resourceType, true, true, true );

        CCText csvFile = name;
        csvFile += ".csv";

        // Load the descriptor file
        CCText textData;
        CCFileManager::GetFile( csvFile.buffer, textData, resourceType );

        CCList<char> lettersSplit;
        textData.split( lettersSplit, "\n" );

        CCText rawLetterData;
        CCList<char> letterDataSplit;
        for( int i=0; i<lettersSplit.length; ++i )
        {
            const char *raw = lettersSplit.list[i];
            rawLetterData.set( raw );

            letterDataSplit.clear();
            rawLetterData.split( letterDataSplit, "," );
            CCASSERT( letterDataSplit.length == 4 );

            Letter &letter = letters[i];
            const char *x1 = letterDataSplit.list[0];
            const char *y1 = letterDataSplit.list[1];
            const char *x2 = letterDataSplit.list[2];
            const char *y2 = letterDataSplit.list[3];

            letter.start.x = (float)atof( x1 );
            letter.start.y = (float)atof( y1 );
            letter.end.x = (float)atof( x2 );
            letter.end.y = (float)atof( y2 );

            // 16.0f because there's 16 tiles per font page
            letter.size.width = ( letter.end.x - letter.start.x ) * 16.0f;
            letter.size.height = ( letter.end.y - letter.start.y ) * 16.0f;
        }

        return true;
    }
    return false;
}


void CCTextureFontPageFile::bindTexturePage() const
{
    //DEBUGLOG( "CCTextureFontPageFile::bindTexturePage %i", texturePageIndex );
	gEngine->textureManager->setTextureIndex( texturePageIndex );
}
