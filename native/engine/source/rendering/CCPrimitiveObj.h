/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCPrimitiveObj.h
 * Description : Loads and handles an obj model
 *
 * Created     : 26/12/11
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

#ifndef __CCPRIMITIVEOBJ_H__
#define __CCPRIMITIVEOBJ_H__


#include "ObjLoader.h"


class CCPrimitiveObj : public CCPrimitive3D
{
    typedef CCPrimitive3D super;

public:
    CCPrimitiveObj();
    virtual void destruct();

	static void LoadObj(const char *file, const CCResourceType resourceType, CCLambdaCallback *callback);
    virtual bool loadData(const char *fileData);
protected:
	bool loadObjMesh(ObjMesh *objMesh);

    // PrimitiveBase
public:
	virtual void renderVertices(const bool textured);

    virtual void copy(const CCPrimitiveObj *primitive);
};


#endif // __CCPRIMITIVEOBJ_H__
