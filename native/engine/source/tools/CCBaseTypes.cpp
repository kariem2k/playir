/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCBaseTypes.cpp
 *-----------------------------------------------------------
 */

#include "CCDefines.h"


// CCBaseType
CCBaseType::~CCBaseType()
{
}



// CCData
CCData::CCData()
{
    zero();
}


void CCData::zero()
{
    length = 0;
    buffer = NULL;
    bufferSize = 0;
}


CCData::~CCData()
{
    if( buffer != NULL )
    {
        free( buffer );
    }
}


void CCData::setSize(const uint inLength)
{
    if( inLength > 0 )
    {
        length = inLength;
        if( length+1 > bufferSize )
        {
            if( buffer != NULL )
            {
                free( buffer );
            }

            // 32 byte aligned
            bufferSize = ( ( length / 32 ) + 1 ) * 32;
            buffer = (char*)malloc( bufferSize );
        }
        buffer[inLength] = 0;
    }
    else
    {
        if( buffer != NULL )
        {
            free( buffer );
        }
        zero();
    }
}


void CCData::ensureLength(const uint minLength, const bool keepData)
{
    if( minLength+1 > bufferSize )
    {
		char *currentData = buffer;
		const uint currentLength = length;

        // 32 byte aligned
        bufferSize = ( ( minLength / 32 ) + 1 ) * 32;
        buffer = (char*)malloc( bufferSize );
        CCASSERT( buffer != NULL );

		if( currentData != NULL )
		{
			if( keepData )
			{
				memcpy( buffer, currentData, currentLength );
				buffer[currentLength] = 0;
			}
			free( currentData );
		}
    }

    if( buffer != NULL )
    {
        buffer[minLength] = 0;
    }
}


void CCData::set(const char *data, const uint inLength)
{
    if( inLength > 0 )
    {
		setSize( inLength );
        memcpy( buffer, data, inLength );
    }
}


void CCData::append(const char *data, const uint inLength)
{
    if( inLength > 0 )
    {
		const uint currentLength = length;
		const uint newLength = length+inLength;
		ensureLength( newLength, true );
		memcpy( buffer+currentLength, data, inLength );
		buffer[newLength] = 0;
		length = newLength;
	}
}


CCData& CCData::operator+=(const CCText &other)
{
	if( other.length > 0 )
	{
		*this += other.buffer;
	}
    return *this;
}


CCData& CCData::operator+=(const char *other)
{
    if( other != NULL )
    {
        if( length == 0 )
        {
            const uint length = strlen( other );
            ensureLength( length );
            set( other, length );
        }
        else
        {
            const uint otherLength = strlen( other );
            const uint totalLength = length + otherLength;
            ensureLength( totalLength, true );

            memcpy( buffer+length, other, otherLength );
            length = totalLength;
        }
    }
    return *this;
}


CCData& CCData::operator+=(const char value)
{
    char other[32];
    sprintf( other, "%c", value );
    *this += other;
    return *this;
}


CCData& CCData::operator+=(const uint value)
{
    return operator+=( (int)value );
}

CCData& CCData::operator+=(const int value)
{
    char other[32];
    sprintf( other, "%i", value );
    *this += other;
    return *this;
}


CCData& CCData::operator+=(const long value)
{
    char other[64];
    sprintf( other, "%ld", value );
    *this += other;
    return *this;
}


CCData& CCData::operator+=(const long long value)
{
    char other[64];
    sprintf( other, "%lld", value );
    *this += other;
    return *this;
}


CCData& CCData::operator+=(const float value)
{
    ensureLength( length+64, true );

    sprintf( buffer, "%s%f", buffer, value );
    length = strlen( buffer );
    return *this;
}



// CCText
CCText::CCText(const int inLength)
{
    ensureLength( inLength );
}


CCText::CCText(const char *text)
{
    zero();
    set( text );
}


CCText::CCText(const CCText &other)
{
    zero();
    set( other.buffer );
}


bool CCText::operator==(const char *other) const
{
    if( length > 0 )
    {
        return ( strcmp( buffer, other ) == 0 );
    }
    return false;
}


bool CCText::operator!=(const char *other) const
{
    if( length > 0 )
    {
        return ( strcmp( buffer, other ) != 0 );
    }
    return false;
}


CCText& CCText::operator=(const char *text)
{
    set( text );
    return *this;
}


CCText& CCText::operator=(const CCText &other)
{
    if( this != &other )
    {
        if( other.buffer != NULL )
        {
            set( other.buffer );
        }
        else if( buffer != NULL )
        {
            free( buffer );
            buffer = NULL;
            bufferSize = 0;
        }
    }
    return *this;
}


void CCText::set(const char *text)
{
    if( text != NULL )
    {
        length = strlen( text );
        ensureLength( length );

        if( buffer != NULL )
        {
            memcpy( buffer, text, length );
        }
    }
}


void CCText::clear()
{
    set( "" );
}


void CCText::trimLength(const uint maxLength)
{
    if( length > maxLength )
    {
        length = maxLength;
        buffer[length] = '\0';
    }
}


void CCText::split(CCList<char> &splitList, const char *token, const bool first)
{
    const uint tokenLength = strlen( token );
    if( buffer )
    {
        char *previousFind = NULL;
        char *currentFind = buffer;
        splitList.add( currentFind );
        do
        {
            previousFind = currentFind;
            currentFind = strstr( currentFind, token );
            if( currentFind != NULL )
            {
                *currentFind = 0;
                currentFind += tokenLength;
                if( currentFind != buffer )
                {
                    splitList.add( currentFind );

                    if( first )
                    {
                        break;
                    }
                }
            }
        } while( currentFind != NULL && currentFind != previousFind );
    }
}


bool CCText::StartsWith(const char *buffer, const char *token)
{
    if( buffer != NULL )
    {
        const char *find = strstr( buffer, token );
        if( find == buffer )
        {
            return true;
        }
    }
    return false;
}


void CCText::stripExtension()
{
    length -= 4;
    buffer[length] = 0;
}


void CCText::stripFile()
{
    CCList<char> directorySplit;
    CCText data = buffer;
    data.split( directorySplit, "/" );

    this->clear();
    for( int i=0; i<directorySplit.length-1; ++i )
    {
        *this += directorySplit.list[i];
        *this += "/";
    }
}

void CCText::stripDirectory(const bool windowsDirectories)
{
    CCList<char> directorySplit;
    CCText data = buffer;
    data.split( directorySplit, "/" );
    if( directorySplit.length > 1 )
    {
        set( directorySplit.list[directorySplit.length-1] );
    }

	if( windowsDirectories )
	{
		data = buffer;
		data.split( directorySplit, "\\" );
		if( directorySplit.length > 1 )
		{
			set( directorySplit.list[directorySplit.length-1] );
		}
	}
}


void CCText::strip(const char *token)
{
    CCList<char> tokenSplit;
    CCText data = buffer;
    data.split( tokenSplit, token );
    if( tokenSplit.length > 1 )
    {
        set( tokenSplit.list[0] );
        for( int i=1; i<tokenSplit.length; ++i )
        {
            *this += tokenSplit.list[i];
        }
    }
}


void CCText::toLowerCase()
{
	for( uint i=0; i<length; ++i )
	{
		char lowercase = tolower( buffer[i] );
		buffer[i] = lowercase;
	}
}


void CCText::SetLastWord(const char *inBuffer, CCText &outText)
{
    CCText nameData = inBuffer;
    CCList<char> nameDataSplit;
    nameData.split( nameDataSplit, " " );
    CCASSERT( nameDataSplit.length > 0 );
    outText = nameDataSplit.list[nameDataSplit.length-1];
}


void CCText::replaceChar(const char search, const char replace)
{
    for( uint i=0; i<length; ++i )
    {
        if( buffer[i] == search )
        {
            buffer[i] = replace;
        }
    }
}


void CCText::replaceChars(const char *token, const char *replace)
{
    CCList<char> tokenSplit;
    split( tokenSplit, token );
    CCText newText;
    for( int i=0; i<tokenSplit.length; ++i )
    {
        const char *rawData = tokenSplit.list[i];
        newText += rawData;

        if( i < tokenSplit.length-1 )
        {
            newText += replace;
        }
    }

    set( newText.buffer );
}


void CCText::splitBetween(CCText source, const char *from, const char *to)
{
    CCText &result = source;
    result.splitAfter( result, from );
    result.splitBefore( result, to );
    set( result.buffer );
}


void CCText::splitBefore(CCText source, const char *before)
{
    CCList<char> list1;
    source.split( list1, before, true );
    set( list1.list[0] );
}


void CCText::splitAfter(CCText source, const char *after)
{
    CCList<char> list1;
    source.split( list1, after, true );
    if( list1.length > 1 )
    {
        set( list1.list[1] );
        for( int i=2; i<list1.length; ++i )
        {
            *this += after;
            *this += list1.list[i];
        }
    }
    else
    {
        *this = "";
    }
}


void CCText::removeBetween(const char *from, const char *to)
{
    CCText start( buffer );
    start.splitAfter( start, to );
    CCText end( buffer );
    end.splitBefore( end, from );

    *this = end.buffer;
    *this += from;
    *this += to;
    *this += start.buffer;
}


void CCText::removeBetweenIncluding(const char *from, const char *to)
{
    CCText start( buffer );
    CCList<char> list1;
    split( list1, from );
    if( list1.length > 1 )
    {
        CCText end( list1.list[1] );
        start.set( list1.list[0] );
        end.splitAfter( end, to );

        set( start.buffer );
        *this += end.buffer;
    }
}


void CCText::encodeForWeb()
{
    replaceChars( "\\", "\\\\" );
    replaceChars( "\"", "\\\"" );
    replaceChars( "\'", "\\\'" );
    replaceChars( "\n", "\\n" );
    replaceChars( "\r", "\\r" );
    replaceChars( "\f", "\\f" );
}
