/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCPlatform.h
 * Description : Platform specific functions.
 *
 * Created     : 05/01/12
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

#ifndef __CCPLATFORM_H__
#define __CCPLATFORM_H__


#define WP8
#define DXRENDERER

typedef	unsigned int uint;
typedef	uint GLenum;
typedef	uint GLuint;
typedef unsigned char GLubyte;
typedef	int GLint;
typedef	float GLfloat;
typedef	void GLvoid;
typedef int GLsizei;
typedef GLuint FBOType;
#define GL_FALSE false
#define GL_TRUE true

typedef __int16           int16_t;
typedef __int32           int32_t;
typedef __int64           int64_t;
typedef unsigned __int8   uint8_t;
typedef unsigned __int16  uint16_t;
typedef unsigned __int32  uint32_t;
typedef unsigned __int64  uint64_t;

#include <stdio.h>
#include <cstdlib>
#include <ctype.h>
#include <io.h>
#include <string.h>
#include <sstream>
using namespace std;

#define _USE_MATH_DEFINES
#include <math.h>
#define MAX(x,y)	((x>=y)?x:y)
#define MIN(x,y)	((x>=y)?y:x)
#define MAXFLOAT 	((float)3.40282346638528860e+38)

inline float roundf(float num) { return num > 0 ? floorf(num + 0.5f) : ceilf(num - 0.5f); }
inline int round(float num) { return (int)roundf( num ); }
#define atoll _atoi64

#include <thread>
inline void usleep(const int t) { std::this_thread::sleep_for( std::chrono::milliseconds( t ) ); }

#define	F_OK		0


enum CCGLTypes
{
	GL_FLOAT,
	GL_UNSIGNED_BYTE,
	GL_UNSIGNED_SHORT,
	GL_TRIANGLE_STRIP,
	GL_TRIANGLES,
	GL_LINE_STRIP,
	GL_LINES,
	GL_BACK,
	GL_FRONT,
	GL_CULL_FACE,
	GL_BLEND,
	GL_DEPTH_TEST,
	GL_LINEAR,
	GL_NEAREST,
	GL_LINEAR_MIPMAP_LINEAR,
	GL_LINEAR_MIPMAP_NEAREST,
	GL_NEAREST_MIPMAP_LINEAR,
	GL_NEAREST_MIPMAP_NEAREST,
	GL_CLAMP_TO_EDGE,
	GL_REPEAT,
	GL_TEXTURE_2D,

	// Extras
	CC_DEPTH_WRITE,
};
#define GL_SRC_ALPHA D3D11_BLEND_SRC_ALPHA
#define GL_ONE_MINUS_SRC_ALPHA D3D11_BLEND_INV_SRC_ALPHA


extern void CCNativeThreadLock();
extern void CCNativeThreadUnlock();
extern void CCJobsThreadLock();
extern void CCJobsThreadUnlock();


#endif // __CCPLATFORM_H__
