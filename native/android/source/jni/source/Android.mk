LOCAL_PATH:= $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE    := libccjni

LOCAL_STATIC_LIBRARIES := libzip

LOCAL_C_INCLUDES := \
				$(LOCAL_PATH)/ \
				$(LOCAL_PATH)/Rendering \
				$(LOCAL_PATH)/Tools \
\
				$(LOCAL_PATH)/../libzip \
\
				$(LOCAL_PATH)/../../../../Engine/source \
				$(LOCAL_PATH)/../../../../Engine/source/AI \
				$(LOCAL_PATH)/../../../../Engine/source/js \
				$(LOCAL_PATH)/../../../../Engine/source/Objects \
				$(LOCAL_PATH)/../../../../Engine/source/Rendering \
				$(LOCAL_PATH)/../../../../Engine/source/Scenes \
				$(LOCAL_PATH)/../../../../Engine/source/Tools \
\
				$(LOCAL_PATH)/../../../../External/3dsloader \
				$(LOCAL_PATH)/../../../../External/jansson-2.3.1/src \
				$(LOCAL_PATH)/../../../../External/ObjLoader3 \
\
				$(LOCAL_PATH)/../../../../App/source/ \
				$(LOCAL_PATH)/../../../../App/source/editor/ \
				$(LOCAL_PATH)/../../../../App/source/game/ \
				$(LOCAL_PATH)/../../../../App/source/multi/ \
				$(LOCAL_PATH)/../../../../App/source/scenes/ \
				$(LOCAL_PATH)/../../../../App/source/ui/ \

# Use the wildcard operator so we only need to update the
# makefile if a new folder is added/one is removed or renamed
MY_FILES := \
		    $(wildcard $(LOCAL_PATH)/*.cpp) \
		    $(wildcard $(LOCAL_PATH)/Rendering/*.cpp) \
		    $(wildcard $(LOCAL_PATH)/Tools/*.cpp) \
		    \
		    $(wildcard $(LOCAL_PATH)/../../../../Engine/source/*.cpp) \
		    $(wildcard $(LOCAL_PATH)/../../../../Engine/source/AI/*.cpp) \
		    $(wildcard $(LOCAL_PATH)/../../../../Engine/source/js/*.cpp) \
		    $(wildcard $(LOCAL_PATH)/../../../../Engine/source/Objects/*.cpp) \
		    $(wildcard $(LOCAL_PATH)/../../../../Engine/source/Rendering/*.cpp) \
		    $(wildcard $(LOCAL_PATH)/../../../../Engine/source/Scenes/*.cpp) \
		    $(wildcard $(LOCAL_PATH)/../../../../Engine/source/Tools/*.cpp) \
		    \
		    $(wildcard $(LOCAL_PATH)/../../../../External/3dsloader/*.cpp) \
		    $(wildcard $(LOCAL_PATH)/../../../../External/jansson-2.3.1/src/*.c) \
		    $(wildcard $(LOCAL_PATH)/../../../../External/ObjLoader3/*.cpp) \
		    \
		    $(wildcard $(LOCAL_PATH)/../../../../App/source/*.cpp) \
		    $(wildcard $(LOCAL_PATH)/../../../../App/source/editor/*.cpp) \
		    $(wildcard $(LOCAL_PATH)/../../../../App/source/game/*.cpp) \
		    $(wildcard $(LOCAL_PATH)/../../../../App/source/scenes/*.cpp) \
		    $(wildcard $(LOCAL_PATH)/../../../../App/source/multi/*.cpp) \
		    $(wildcard $(LOCAL_PATH)/../../../../App/source/ui/*.cpp) \

LOCAL_SRC_FILES := $(MY_FILES:$(LOCAL_PATH)/%=%)

LOCAL_LDLIBS  := -llog -lGLESv2
LOCAL_LDLIBS  += -L$(SYSROOT)/usr/lib -ldl
LOCAL_LDLIBS  += -L$(SYSROOT)/usr/lib -lz

include $(BUILD_SHARED_LIBRARY)
