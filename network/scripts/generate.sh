## run from /network directory 

sudo chmod -R 0755 ./crypto-config


#!/bin/bash

# Function to safely delete file or directory
delete_if_exists() {
  local path="$1"
  if [ -d "$path" ]; then
    rm -rf "$path"
    echo "Deleted directory: $path"
  elif [ -f "$path" ]; then
    rm "$path"
    echo "Deleted file: $path"
  else
    echo "Path does not exist: $path"
  fi
}

# Use the function
delete_if_exists "./crypto-config"
delete_if_exists "./channel-artifacts"

mkdir crypto-config channel-artifacts

#Generate Crypto artifactes for organizations
cryptogen generate --config=./config/crypto-config.yaml --output=./crypto-config/

# System channel
SYS_CHANNEL="sys-channel"

# channel name defaults to "mychannel"
CHANNEL_NAME="mychannel"


echo "Copying configtx.yaml to root..."
cp config/configtx.yaml ./configtx.yaml
# Generate System Genesis block
configtxgen -profile OrdererGenesis \
    -configPath . \
    -channelID $SYS_CHANNEL  \
    -outputBlock ./channel-artifacts/genesis.block

# # Generate channel configuration block
configtxgen -profile BasicChannel \
    -configPath . \
    -outputCreateChannelTx ./channel-artifacts/mychannel.tx \
    -channelID $CHANNEL_NAME

echo "#######    Generating anchor peer update for Org1MSP  ##########"
configtxgen -profile BasicChannel \
    -configPath . \
    -outputAnchorPeersUpdate ./channel-artifacts/Org1MSPanchors.tx \
    -channelID $CHANNEL_NAME \
    -asOrg Org1MSP

echo "#######    Generating anchor peer update for Org2MSP  ##########"
configtxgen -profile BasicChannel \
            -configPath . \
            -outputAnchorPeersUpdate ./channel-artifacts/Org2MSPanchors.tx \
            -channelID $CHANNEL_NAME \
            -asOrg Org2MSP


echo "Cleaning up configtx.yaml..."
rm ./configtx.yaml