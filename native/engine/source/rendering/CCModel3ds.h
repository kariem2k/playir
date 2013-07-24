/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCModel3ds.h
 * Description : Loads and handles a 3ds model.
 *
 * Created     : 05/08/11
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

#ifndef __CCMODEL3DS_H__
#define __CCMODEL3DS_H__

#include "3dsloader.h"

class CCPrimitive3ds : public CCPrimitive3D
{
    typedef CCPrimitive3D super;

public:
    CCPrimitive3ds();
    virtual void destruct();

    bool load(const char *file);

public:
	virtual void renderVertices(const bool textured);
};

class CCModel3ds : public CCModelBase
{
public:
    typedef CCModelBase super;

	CCModel3ds(const char *file,
               const char *texture1, const CCResourceType resourceType=Resource_Packaged,
               const bool mipmap=false, const bool alwaysResident=false, const char *texture2=NULL);

    float getWidth() { return primitive3ds->getWidth(); }
    float getHeight() { return primitive3ds->getHeight(); }
    float getDepth() { return primitive3ds->getDepth(); }

public:
	CCPrimitive3ds *primitive3ds;
};

#endif // __CCMODEL3DS_H__
