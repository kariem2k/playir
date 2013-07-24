/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCPlatform.h
 * Description : Platform specific functions.
 *
 * Created     : 25/01/11
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

#ifndef __CCPLATFORM_H__
#define __CCPLATFORM_H__


#define IOS

#ifdef __OBJC__

#include <OpenGLES/EAGL.h>

#else

#include <stdlib.h>
#include <stdint.h>
#include <string.h>
#include <stdio.h>
#include <cctype>

#include <math.h>

#ifndef MAX
#define MAX(x,y) ((x>=y)?x:y)
#endif

#ifndef MIN
#define MIN(x,y) ((x>=y)?y:x)
#endif

typedef	unsigned int uint;

#endif

// OpenGL 2.0
#include <OpenGLES/ES2/gl.h>
#include <OpenGLES/ES2/glext.h>

#define glBindVertexArray glBindVertexArrayOES
#define glGenVertexArrays glGenVertexArraysOES
#define glDeleteVertexArrays glDeleteVertexArraysOES

extern void CCNativeThreadLock();
extern void CCNativeThreadUnlock();

extern void CCJobsThreadLock();
extern void CCJobsThreadUnlock();


class CCProfiler
{
public:
	CCProfiler(const char *name);
	~CCProfiler();

	static void open();
	static void save();

protected:
	const char *name;
	double startTime;

	static uint stackIndex;
	static class CCText buffer;
};


#endif // __CCPLATFORM_H__