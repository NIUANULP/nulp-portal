#!/bin/bash
STARTTIME=$(date +%s)
CLIENT_NODE_VERSION=14.20.0
SERVER_NODE_VERSION=16.19.0
echo "Starting portal build from build.sh"
set -euo pipefail	
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
build_tag=$1
name=player
node=$2
org=$3
buildDockerImage=$4
buildCdnAssests=$5
echo "buildDockerImage: " $buildDockerImage
echo "buildCdnAssests: " $buildCdnAssests
if [ $buildCdnAssests == true ]
then
    cdnUrl=$6
    echo "cdnUrl: " $cdnUrl
fi

commit_hash=$(git rev-parse --short HEAD)
# nvm install $NODE_VERSION # same is used in client and server
nvm install $CLIENT_NODE_VERSION # used in client
nvm install $SERVER_NODE_VERSION #  used in server
cd src/app
mkdir -p app_dist/ # this folder should be created prior server and client build
rm -rf dist-cdn # remove cdn dist folder

# function to run client build for docker image
build_client_docker(){
    echo "starting client local prod build"
    npm run build # Angular prod build
    echo "completed client local prod build"
    cd ..
    mv app_dist/dist/index.html app_dist/dist/index.ejs # rename index file
}

# function to run client build for cdn
build_client_cdn(){
    echo "starting client cdn prod build"
    npm run build-cdn -- --deployUrl $cdnUrl # prod command
    export sunbird_portal_cdn_url=$cdnUrl # required for inject-cdn-fallback task
    npm run inject-cdn-fallback
    echo "completed client cdn prod build"
}

# function to run client build
build_client(){
    echo "Building client in background"
    nvm use $CLIENT_NODE_VERSION
    cd client
    echo "starting client yarn install"
    yarn install --no-progress --production=true
    echo "completed client yarn install"
    if [ $buildDockerImage == true ]
    then
        build_client_docker & # run client local build in background 
    fi
    if [ $buildCdnAssests == true ]
    then
        build_client_cdn & # run client local build in background
    fi
    wait # wait for both build to complete
    echo "completed client post_build"
}

# function to run server build
build_server(){
    echo "Building server in background"
    echo "copying required files to app_dist"
    cp -R libs helpers proxy resourcebundles package.json framework.config.js sunbird-plugins routes constants controllers server.js ./../../Dockerfile app_dist
    
    # Copy additional files to dist folder
    #echo "copying additional files to dist"
    #cp -r /var/lib/jenkins/workspace/Build/Core/Player/prod-build/* /var/lib/jenkins/workspace/Build/Core/Player/src/app/app_dist/dist/
    
    cd app_dist
    nvm use $SERVER_NODE_VERSION
    echo "starting server yarn install"
    yarn install --no-progress --production=true
    echo "completed server yarn install"
    node helpers/resourceBundles/build.js -task="phraseAppPull"

    #cp -r /var/lib/jenkins/workspace/Build/Core/elite-ui/prod-build/* /var/lib/jenkins/workspace/Build/Core/Player/src/app/app_dist/dist/
}

build_client & # run client build in background 
if [ $buildDockerImage == true ]
then
   build_server & # run client build in background
fi

# wait for both build to complete
wait 

BUILD_ENDTIME=$(date +%s)
echo "Client and Server Build complete. Took $((BUILD_ENDTIME - STARTTIME)) seconds to complete."
