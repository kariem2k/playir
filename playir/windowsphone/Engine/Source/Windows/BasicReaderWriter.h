//// THIS CODE AND INFORMATION IS PROVIDED "AS IS" WITHOUT WARRANTY OF
//// ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING BUT NOT LIMITED TO
//// THE IMPLIED WARRANTIES OF MERCHANTABILITY AND/OR FITNESS FOR A
//// PARTICULAR PURPOSE.
////
//// Copyright (c) Microsoft Corporation. All rights reserved

#pragma once

#include <wrl/client.h>
#include <ppl.h>
#include <ppltasks.h>

// A simple reader/writer class that provides support for reading and writing
// files on disk. Provides synchronous and asynchronous methods.
class BasicReaderWriter
{
public:
    BasicReaderWriter();

    bool exists(
        _In_ Platform::String^ filePath
        );

    Platform::Array<byte>^ ReadData(
        _In_ Platform::String^ filePath
        );

    uint32 WriteData(
        _In_ Platform::String^ filePath,
        _In_ const char *data, 
		_In_ const int length
        );
	
    bool deleteFile(
        _In_ Platform::String^ filePath
        );
};
