#!/bin/bash

cd Server/build
./rrolf-server &
echo "rrolf-server started in Server/build"

cd ../..

cd Client/build
python3 -m http.server 9999 &
echo "Python HTTP server started in Client/build on port 9999"

wait
