/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCJSCollideable.h
 * Description : A scene managed moveable object.
 *
 * Created     : 10/03/13
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

class CCJSCollideable : public CCCollideable
{
	typedef CCCollideable super;

public:
	CCJSCollideable(const long jsID);

    void setPositionAndSize(const CCVector3 &position, const CCVector3 &collisionBounds);
};
