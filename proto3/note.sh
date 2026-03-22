protoc-gen-grpc --js_out=import_style=commonjs:. --grpc_out=. srpc.proto
protoc-gen-grpc --ts_out=service=grpc-node:. --grpc_out=. srpc.proto

protoc --go_out=. -I. --go-grpc_out=.  srpc.proto

protoc --plugin=protoc-gen-ts=$(which protoc-gen-ts) --js_out=import_style=commonjs,binary:./ --ts_out=./ srpc.proto

protoc --js_out=import_style=commonjs,binary:. --grpc_out=.  srpc.proto


#ok
protoc --go_out=. -I. --go-grpc_out=.  srpc.proto
protoc-gen-grpc --ts_out=service=grpc-node:.  srpc.proto

#protoc-gen-grpc --python_out=.  srpc.proto
#protoc --python_out=.  srpc.proto
# pip install "grpcio-tools==1.43.0"
python3 -m grpc_tools.protoc -I. --python_out=. --grpc_python_out=. srpc.proto


#打包
npx webpack --config webpack.config.js

#linux编译：
scp /Users/a1-6/Code/sillyplus/proto3/dist/sillygirl.js root@imdraw.com:/root/node/node-18.16.1/lib
ssh root@imdraw.com
cd /root/node/node-18.16.1 && ninja -C out/Release && scp -P 20211 out/Release/node a1-6@frp2.echowxsy.cn:/Users/a1-6/Code/nodes/node_linux_amd64
#
macos编译：
cp /Users/a1-6/Code/sillyplus/proto3/dist/sillygirl.js /Users/a1-6/Code/node/node-v18.16.1/lib/sillygirl.js && cd /Users/a1-6/Code/node/node-v18.16.1 && ninja -C out/Release && cp out/Release/node /Users/a1-6/Code/nodes/node_darwin_arm64

#压缩
cd /Users/a1-6/Code/nodes/node_darwin_arm64
cd /Users/a1-6/Code/nodes/node_linux_amd64

##
git add . && git commit -m "x" && git push