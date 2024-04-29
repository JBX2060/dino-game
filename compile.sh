#!/bin/bash

cd Client/build
. ~/emsdk/emsdk_env.sh
cmake .. -DWASM_BUILD=1
make -j$(nproc)

cd ../..

cd Server/build
cmake ..
make -j$(nproc)

cd ../..
