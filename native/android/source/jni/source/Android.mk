LOCAL_PATH:= $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE    := libccjni

LOCAL_STATIC_LIBRARIES := libzip

LOCAL_C_INCLUDES := \
				$(LOCAL_PATH)/ \
				$(LOCAL_PATH)/rendering \
				$(LOCAL_PATH)/tools \
\
				$(LOCAL_PATH)/../libzip \
\
				$(LOCAL_PATH)/../../../../engine/source \
				$(LOCAL_PATH)/../../../../engine/source/ai \
				$(LOCAL_PATH)/../../../../engine/source/js \
				$(LOCAL_PATH)/../../../../engine/source/objects \
				$(LOCAL_PATH)/../../../../engine/source/rendering \
				$(LOCAL_PATH)/../../../../engine/source/scenes \
				$(LOCAL_PATH)/../../../../engine/source/tools \
\
				$(LOCAL_PATH)/../../../../external/3dsloader \
				$(LOCAL_PATH)/../../../../external/jansson-2.5/src \
				$(LOCAL_PATH)/../../../../external/ObjLoader3 \
\
				$(LOCAL_PATH)/../../../../app/source/ \

# Use the wildcard operator so we only need to update the
# makefile if a new folder is added/one is removed or renamed
MY_FILES := \
		    $(wildcard $(LOCAL_PATH)/*.cpp) \
		    $(wildcard $(LOCAL_PATH)/rendering/*.cpp) \
		    $(wildcard $(LOCAL_PATH)/tools/*.cpp) \
		    \
		    $(wildcard $(LOCAL_PATH)/../../../../engine/source/*.cpp) \
		    $(wildcard $(LOCAL_PATH)/../../../../engine/source/ai/*.cpp) \
		    $(wildcard $(LOCAL_PATH)/../../../../engine/source/js/*.cpp) \
		    $(wildcard $(LOCAL_PATH)/../../../../engine/source/objects/*.cpp) \
		    $(wildcard $(LOCAL_PATH)/../../../../engine/source/rendering/*.cpp) \
		    $(wildcard $(LOCAL_PATH)/../../../../engine/source/scenes/*.cpp) \
		    $(wildcard $(LOCAL_PATH)/../../../../engine/source/tools/*.cpp) \
		    \
		    $(wildcard $(LOCAL_PATH)/../../../../external/3dsloader/*.cpp) \
		    $(wildcard $(LOCAL_PATH)/../../../../external/jansson-2.5/src/*.c) \
		    $(wildcard $(LOCAL_PATH)/../../../../external/ObjLoader3/*.cpp) \
		    \
		    $(wildcard $(LOCAL_PATH)/../../../../app/source/*.cpp) \

LOCAL_SRC_FILES := $(MY_FILES:$(LOCAL_PATH)/%=%)

LOCAL_LDLIBS  := -llog -lGLESv2
LOCAL_LDLIBS  += -L$(SYSROOT)/usr/lib -ldl
LOCAL_LDLIBS  += -L$(SYSROOT)/usr/lib -lz

include $(BUILD_SHARED_LIBRARY)
