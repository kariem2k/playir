cd ..

ndk-build NDK_DEBUG=1

./ndk/copy_assets.sh
./ndk/copy_libs.sh
