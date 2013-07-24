LOCAL_PATH := $(call my-dir)

$(shell ndk/copy_assets.sh)

include $(call all-subdir-makefiles)
