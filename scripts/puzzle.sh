#!/bin/bash

#Retrieve the latest git commit hash
BUILD_TAG=$(git rev-parse --short HEAD | tr -d '\n\r')

# #Build the docker image
docker build -t 192.168.49.2:30400/puzzle:$BUILD_TAG -f applications/puzzle/Dockerfile applications/puzzle

# #Setup the proxy for the registry
# #docker stop socat-registry; docker rm socat-registry; docker run -d -e "REG_IP=`minikube ip`" -e "REG_PORT=30400" --name socat-registry -p 30400:5000 socat-registry

echo "5 second sleep to make sure the registry is ready"
sleep 5;

# #Push the images
docker push 192.168.49.2:30400/puzzle:$BUILD_TAG

#Stop the registry proxy
docker stop socat-registry

# Create the deployment and service for the puzzle server aka puzzle
#sed 's#192.168.49.2:30400/puzzle:$BUILD_TAG#192.168.49.2:30400/puzzle:'$BUILD_TAG'#' applications/puzzle/k8s/deployment.yaml | kubectl apply -f -
#sed 's#192.168.49.2:30400/monitor-scale:$BUILD_TAG#192.168.49.2:30400/monitor-scale:'`git rev-parse --short HEAD`'#' applications/monitor-scale/k8s/deployment.yaml | kubectl apply -f -
sed 's#192.168.49.2:30400/puzzle:$BUILD_TAG#192.168.49.2:30400/puzzle:'$BUILD_TAG'#' applications/puzzle/k8s/deployment.yaml | kubectl apply -f -