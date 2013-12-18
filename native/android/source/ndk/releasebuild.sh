cd ..

ndk-build RELEASE=1 clean
ndk-build RELEASE=1

./ndk/copy_assets.sh
./ndk/copy_libs.sh

