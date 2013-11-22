/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCBaseTypes.h
 * Description : Contains base structures.
 *
 * Created     : 01/03/10
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

#ifndef __CCBASETYPES_H__
#define __CCBASETYPES_H__


#include "CCBaseTools.h"


typedef	unsigned short ushort;


enum CCResourceType
{
    Resource_Unknown,
    Resource_Cached,
    Resource_Packaged
};


class CCBaseType
{
public:
    virtual ~CCBaseType();
    virtual void destruct() = 0;
};


class CCUpdater : public CCBaseType
{
public:
    typedef CCBaseType super;

    CCUpdater()
    {
#ifdef DEBUGON
        destructCalled = false;
#endif
    }

    virtual ~CCUpdater()
    {
#ifdef DEBUGON
        CCASSERT( destructCalled );
#endif
    }

    virtual void destruct()
    {
        #ifdef DEBUGON
            destructCalled = true;
        #endif
    }

    virtual bool update(const float delta) = 0;
    virtual void finish() {}

#ifdef DEBUGON
protected:
    bool destructCalled;
#endif
};


// A list containing pointers which aren't deleted on release
template <typename T> class CCList
{
public:
    CCList(const uint size=0)
    {
        list = NULL;
        length = 0;
        allocated = 0;

        if( size > 0 )
        {
            allocate( size );
        }
    }

    ~CCList()
    {
        freeList();
    }

    void allocate(const int size)
    {
        allocated = size;

        if( list != NULL )
        {
            ::free( list );
        }

        const uint sizeOfPointer = sizeof( void* );
        list = (T**)malloc( sizeOfPointer * allocated );
        CCASSERT( list != NULL );
    }

    void add(T *object, const int index=-1)
    {
        //CCASSERT( find( object ) == -1 );
        if( length == allocated )
        {
            allocated += 16;
            const uint sizeOfPointer = sizeof( void* );
            T **newArray = (T**)malloc( sizeOfPointer * allocated );
            CCASSERT( newArray != NULL );

            if( list != NULL )
            {
                for( int i=0; i<length; ++i )
                {
                    newArray[i] = list[i];
                }

                ::free( list );
            }

            newArray[length++] = object;
            list = newArray;
        }
        else
        {
            list[length++] = object;
        }

        if( index >= 0 )
        {
            reinsert( object, index );
        }
    }

    void addOnce(T *object)
    {
        if( find( object ) == -1 )
        {
            add( object );
        }
    }

    bool removeIndex(const int index)
    {
        if( index >= 0 && index < length )
        {
            length--;
            for( int i=index; i<length; ++i )
            {
                list[i] = list[i+1];
            }
            return true;
        }

        return false;
    }

    bool remove(const void *object)
    {
        int index = find( object );
        if( index != -1 )
        {
            CCASSERT( length > 0 );
            return removeIndex( index );
        }

        return false;
    }

    void clear()
    {
        length = 0;
    }

    void freeList()
    {
        if( list != NULL )
        {
            free( list );
            list = NULL;
        }
        length = 0;
        allocated = 0;
    }

    void deleteObjects()
    {
        for( int i=0; i<length; ++i )
        {
            delete list[i];
        }
        length = 0;
    }

    void deleteObjectsAndList()
    {
        deleteObjects();
        freeList();
    }

    void resize(const int size)
    {
        // If it's too small
        while( length < size )
        {
            add( new T() );
        }

        // If it's too big
        for( int i=size; i<length; ++i )
        {
            delete list[i];
        }
        length = size;
    }

    void copy(CCList<T> &other)
    {
        for( int i=0; i<other.length; ++i )
        {
            add( other.list[i] );
        }
    }

    void push(T *object)
    {
        add( object );
        reinsert( object, 0 );
    }

    T* pop()
    {
        CCASSERT( length > 0 );
        T *object = list[0];
        remove( object );
        return object;
    }

    // Re-insert from the back of the queue
    void reinsert(T *object, const int index)
    {
        CCASSERT( list[length-1] == object );
        for( int i=length-1; i>index; --i )
        {
            list[i] = list[i-1];
        }
        list[index] = object;
    }

    int find(const void *object)
    {
        for( int i=0; i<length; ++i )
        {
            if( list[i] == object )
            {
                return i;
            }
        }
        return -1;
    }

    T* first()
    {
        if( length > 0 )
        {
            return list[0];
        }
        return NULL;
    }

    T* last() const
    {
        CCASSERT( length > 0 );
        return list[length-1];
    }

    T **list;
    int length;

protected:
    int allocated;
};


// A list containing objects that deleted using the destruct call on release
template <typename T> class CCDestructList : public CCList<T>
{
public:
    void deleteObjects(const bool reversed=false)
    {
        if( reversed )
        {
            for( int i=this->length-1; i>=0; --i )
            {
                T *object = this->list[i];
                DELETE_OBJECT( object );
            }
        }
        else
        {
            for( int i=0; i<this->length; ++i )
            {
                T *object = this->list[i];
                DELETE_OBJECT( object );
            }
        }
        this->length = 0;
    }

	void deleteObjectsAndList(const bool reversed=false)
	{
		if( this->list != NULL )
		{
            deleteObjects( reversed );
            this->freeList();
		}
	}
};


// Always feed on destruct
template <typename T1, typename T2> class CCPairList
{
public:
    void add(T1 *name, T1 *value)
    {
        names.add( name );
        values.add( value );
    }

    int length() const { return names.length; }

    ~CCPairList()
    {
        names.deleteObjects();
        values.deleteObjects();
    }

    CCList< T1 > names;
    CCList< T2 > values;
};


struct CCData
{
    CCData();
    ~CCData();

    void setSize(const uint inLength);
    void ensureLength(const uint minLength, const bool keepData=false);
    void set(const char *data, const uint inLength);
	void append(const char *data, const uint inLength);

    CCData& operator+=(const CCText &other);
    CCData& operator+=(const char *other);
    CCData& operator+=(const char other);
    CCData& operator+=(const int value);
    CCData& operator+=(const uint value);
    CCData& operator+=(const long value);
    CCData& operator+=(const long long value);
    CCData& operator+=(const float value);

protected:
    void zero();

public:
	uint length;
    char *buffer;
    uint bufferSize;
};


struct CCText : CCData
{
    CCText() {}
    explicit CCText(const int inLength);
    CCText(const char *text);
    CCText(const CCText &other);

    bool operator==(const char *other) const;
    bool operator!=(const char *other) const;
    CCText& operator=(const char *text);
    CCText& operator=(const CCText &other);

    void set(const char *text);
    void clear();
    void trimLength(const uint maxLength);

    void split(CCList<char> &splitList, const char *token, const bool first=false);

    inline static bool Equals(const CCText &text, const CCText &token)
    {
        return Equals( text.buffer, token.buffer );
    }

    inline static bool Equals(const CCText &text, const char *token)
    {
        return Equals( text.buffer, token );
    }
    
    inline static bool Equals(const char *buffer, const char *token)
    {
        if( buffer == NULL && token == NULL )
        {
            return true;
        }
        if( buffer != NULL && token != NULL )
        {
            return strcmp( buffer, token ) == 0;
        }
        return false;
    }

    inline static bool Contains(const char *buffer, const char *token)
    {
        if( buffer != NULL && token != NULL )
        {
            return strstr( buffer, token ) != NULL;
        }
        return false;
    }

    static bool StartsWith(const char *buffer, const char *token);
    void stripExtension();
    void stripFile();
    void stripDirectory(const bool windowsDirectories=false);
    void strip(const char *token);
    void toLowerCase();
    static void SetLastWord(const char *inBuffer, CCText &outText);

    const char* getExtension()
    {
        if( length > 4 )
        {
            return buffer+length-4;
        }
        return NULL;
    }

    void replaceChar(const char search, const char replace);
    void replaceChars(const char *token, const char *replace);

    // Set the text to be the value between the split tokens
    void splitBetween(CCText source, const char *from, const char *to);
    void splitBefore(CCText source, const char *before);
    void splitAfter(CCText source, const char *after);
    void removeBetween(const char *from, const char *to);
    void removeBetweenIncluding(const char *from, const char *to);

    void encodeForWeb();
};


#endif // __CCBASETYPES_H__
