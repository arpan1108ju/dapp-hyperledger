export CORE_PEER_TLS_ENABLED=true
export ORDERER_CA=${PWD}/crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
export PEER0_ORG1_CA=${PWD}/crypto-config/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export PEER0_ORG2_CA=${PWD}/crypto-config/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
export FABRIC_CFG_PATH=${PWD}/config/

export PRIVATE_DATA_CONFIG=${PWD}/private-data/collections_config.json

export CHANNEL_NAME=mychannel

setGlobalsForOrderer() {
    export CORE_PEER_LOCALMSPID="OrdererMSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
    export CORE_PEER_MSPCONFIGPATH=${PWD}/crypto-config/ordererOrganizations/example.com/users/Admin@example.com/msp
}

setGlobalsForPeer0Org1() {
    export CORE_PEER_LOCALMSPID="Org1MSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_ORG1_CA
    export CORE_PEER_MSPCONFIGPATH=${PWD}/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
    export CORE_PEER_ADDRESS=localhost:7051
}


setGlobalsForPeer0Org2() {
    export CORE_PEER_LOCALMSPID="Org2MSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_ORG2_CA
    export CORE_PEER_MSPCONFIGPATH=${PWD}/crypto-config/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
    export CORE_PEER_ADDRESS=localhost:9051

}



presetup() {
    echo "==================== Vendoring go dependencies ==============="
    pushd ./chaincode/go-crowdfunding
    GO111MODULE=on go mod vendor
    popd
    echo "==================== Finished vendoring go dependencies =============="
}
# presetup

export CHANNEL_NAME="mychannel"
export CC_RUNTIME_LANGUAGE="golang"
export VERSION="1"
export CC_SRC_PATH=${PWD}/chaincode/go-crowdfunding
export CC_NAME="crowdfundingGO"

packageChaincode() {
    setGlobalsForPeer0Org1

    rm -rf ./chaincode-package/${CC_NAME}.tar.gz
    
    peer lifecycle chaincode package ./chaincode-package/${CC_NAME}.tar.gz \
        --path ${CC_SRC_PATH} --lang ${CC_RUNTIME_LANGUAGE} \
        --label ${CC_NAME}_${VERSION}
    echo "===================== Chaincode is packaged on peer0.org1 ===================== "
}
# packageChaincode

installChaincode() {
    setGlobalsForPeer0Org1
    peer lifecycle chaincode install ./chaincode-package/${CC_NAME}.tar.gz
    echo "===================== Chaincode is installed on peer0.org1 ===================== "

  
    setGlobalsForPeer0Org2
    peer lifecycle chaincode install ./chaincode-package/${CC_NAME}.tar.gz
    echo "===================== Chaincode is installed on peer0.org2 ===================== "

}

# installChaincode

queryInstalledForOrg1() {
    setGlobalsForPeer0Org1
   
    peer lifecycle chaincode queryinstalled >&log.txt
    cat log.txt
    PACKAGE_ID=$(sed -n "/${CC_NAME}_${VERSION}/{s/^Package ID: //; s/, Label:.*$//; p;}" log.txt)
    echo PackageID is ${PACKAGE_ID}
    echo "===================== Query installed successful on peer0.org1 on channel ===================== "
}


queryInstalledForOrg2() {
    setGlobalsForPeer0Org2
   
    peer lifecycle chaincode queryinstalled >&log.txt
    cat log.txt
    PACKAGE_ID=$(sed -n "/${CC_NAME}_${VERSION}/{s/^Package ID: //; s/, Label:.*$//; p;}" log.txt)
    echo PackageID is ${PACKAGE_ID}
    echo "===================== Query installed successful on peer0.org2 on channel ===================== "
}

# queryInstalled

# --collections-config ./artifacts/private-data/collections_config.json \
#         --signature-policy "OR('Org1MSP.member','Org2MSP.member')" \
# --collections-config $PRIVATE_DATA_CONFIG \

approveForMyOrg1() {
    setGlobalsForPeer0Org1
    # set -x
    peer lifecycle chaincode approveformyorg -o localhost:7050 \
        --ordererTLSHostnameOverride orderer.example.com --tls \
        --collections-config $PRIVATE_DATA_CONFIG \
        --cafile $ORDERER_CA --channelID $CHANNEL_NAME --name ${CC_NAME} --version ${VERSION} \
        --init-required --package-id ${PACKAGE_ID} \
        --sequence ${VERSION}
    # set +x

    echo "===================== chaincode approved from org 1 ===================== "

}

getBlock() {
    setGlobalsForPeer0Org1
    # peer channel fetch 10 -c mychannel -o localhost:7050 \
    #     --ordererTLSHostnameOverride orderer.example.com --tls \
    #     --cafile $ORDERER_CA

    peer channel getinfo  -c mychannel -o localhost:7050 \
        --ordererTLSHostnameOverride orderer.example.com --tls \
        --cafile $ORDERER_CA
}

# getBlock

# approveForMyOrg1

# --signature-policy "OR ('Org1MSP.member')"
# --peerAddresses localhost:7051 --tlsRootCertFiles $PEER0_ORG1_CA --peerAddresses localhost:9051 --tlsRootCertFiles $PEER0_ORG2_CA
# --peerAddresses peer0.org1.example.com:7051 --tlsRootCertFiles $PEER0_ORG1_CA --peerAddresses peer0.org2.example.com:9051 --tlsRootCertFiles $PEER0_ORG2_CA
#--channel-config-policy Channel/Application/Admins
# --signature-policy "OR ('Org1MSP.peer','Org2MSP.peer')"

checkCommitReadyness() {
    setGlobalsForPeer0Org1
    peer lifecycle chaincode checkcommitreadiness \
        --collections-config $PRIVATE_DATA_CONFIG \
        --channelID $CHANNEL_NAME --name ${CC_NAME} --version ${VERSION} \
        --sequence ${VERSION} --output json --init-required
    echo "===================== checking commit readyness from org 1 ===================== "
}

# checkCommitReadyness

# --collections-config ./artifacts/private-data/collections_config.json \
# --signature-policy "OR('Org1MSP.member','Org2MSP.member')" \
approveForMyOrg2() {
    setGlobalsForPeer0Org2
    # export VERSION=1
    peer lifecycle chaincode approveformyorg -o localhost:7050 \
        --ordererTLSHostnameOverride orderer.example.com --tls $CORE_PEER_TLS_ENABLED \
        --cafile $ORDERER_CA --channelID $CHANNEL_NAME --name ${CC_NAME} \
        --collections-config $PRIVATE_DATA_CONFIG \
        --version ${VERSION} --init-required --package-id ${PACKAGE_ID} \
        --sequence ${VERSION}

    echo "===================== chaincode approved from org 2 ===================== "
}

# approveForMyOrg2

# checkCommitReadyness() {

#     setGlobalsForPeer0Org1
#     peer lifecycle chaincode checkcommitreadiness --channelID $CHANNEL_NAME \
#         --peerAddresses localhost:7051 --tlsRootCertFiles $PEER0_ORG1_CA \
#         --collections-config $PRIVATE_DATA_CONFIG \
#         --name ${CC_NAME} --version ${VERSION} --sequence ${VERSION} --output json --init-required
#     echo "===================== checking commit readyness from org 1 ===================== "
# }

# checkCommitReadyness

commitChaincodeDefination() {
    setGlobalsForPeer0Org1
    peer lifecycle chaincode commit -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com \
        --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA \
        --channelID $CHANNEL_NAME --name ${CC_NAME} \
        --collections-config $PRIVATE_DATA_CONFIG \
        --peerAddresses localhost:7051 --tlsRootCertFiles $PEER0_ORG1_CA \
        --peerAddresses localhost:9051 --tlsRootCertFiles $PEER0_ORG2_CA \
        --version ${VERSION} --sequence ${VERSION} --init-required

}

# commitChaincodeDefination

queryCommitted() {
    setGlobalsForPeer0Org1
    peer lifecycle chaincode querycommitted --channelID $CHANNEL_NAME --name ${CC_NAME}

}

# queryCommitted

chaincodeInvokeInit() {

    echo " =================== calling init ======================"

    setGlobalsForPeer0Org1
    peer chaincode invoke -o localhost:7050 \
        --ordererTLSHostnameOverride orderer.example.com \
        --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA \
        -C $CHANNEL_NAME -n ${CC_NAME} \
        --peerAddresses localhost:7051 --tlsRootCertFiles $PEER0_ORG1_CA \
        --peerAddresses localhost:9051 --tlsRootCertFiles $PEER0_ORG2_CA \
        --isInit -c '{"function": "InitLedger","Args":[]}'
}
#!/bin/bash

# ======================== Variables ============================
CAMPAIGN_ID="camp1234"
CAMPAIGN_TITLE="Save the Planet"
CAMPAIGN_DESC="Campaign to plant trees"
CAMPAIGN_CATEGORY="Environment"
CAMPAIGN_GOAL="10000"
CAMPAIGN_IMAGE="https://image.url"

CAMPAIGN_CREATED_AT="1000000000"
CAMPAIGN_DEADLINE="2000000000"

DONATION_AMOUNT="500"
DONATION_TIMESTAMP="1000000010"

WITHDRAW_TIMESTAMP="2000100000"
CANCEL_TIMESTAMP="1000100000"

# ======================== Functions ============================

CreateCampaign() {
    echo "================= create campaign ============================"

    setGlobalsForPeer0Org1

    peer chaincode invoke -o localhost:7050 \
        --ordererTLSHostnameOverride orderer.example.com \
        --tls $CORE_PEER_TLS_ENABLED \
        --cafile $ORDERER_CA \
        -C $CHANNEL_NAME -n ${CC_NAME} \
        --peerAddresses localhost:7051 --tlsRootCertFiles $PEER0_ORG1_CA \
        --peerAddresses localhost:9051 --tlsRootCertFiles $PEER0_ORG2_CA \
        -c '{"function": "CreateCampaign", "Args":["'"$CAMPAIGN_ID"'", "'"$CAMPAIGN_TITLE"'", "'"$CAMPAIGN_DESC"'", "'"$CAMPAIGN_CATEGORY"'", "'"$CAMPAIGN_GOAL"'", "'"$CAMPAIGN_DEADLINE"'", "'"$CAMPAIGN_IMAGE"'", "'"$CAMPAIGN_CREATED_AT"'"]}'
}

DonateToCampaign() {
    echo "================= donate to campaign ============================"

    setGlobalsForPeer0Org2

    peer chaincode invoke -o localhost:7050 \
        --ordererTLSHostnameOverride orderer.example.com \
        --tls $CORE_PEER_TLS_ENABLED \
        --cafile $ORDERER_CA \
        -C $CHANNEL_NAME -n ${CC_NAME} \
        --peerAddresses localhost:7051 --tlsRootCertFiles $PEER0_ORG1_CA \
        --peerAddresses localhost:9051 --tlsRootCertFiles $PEER0_ORG2_CA \
        -c '{"function": "DonateToCampaign", "Args":["'"$CAMPAIGN_ID"'", "'"$DONATION_AMOUNT"'", "'"$DONATION_TIMESTAMP"'"]}'
}

Withdraw() {
    echo "================= withdraw campaign ============================"

    setGlobalsForPeer0Org1

    peer chaincode invoke -o localhost:7050 \
        --ordererTLSHostnameOverride orderer.example.com \
        --tls $CORE_PEER_TLS_ENABLED \
        --cafile $ORDERER_CA \
        -C $CHANNEL_NAME -n ${CC_NAME} \
        --peerAddresses localhost:7051 --tlsRootCertFiles $PEER0_ORG1_CA \
        --peerAddresses localhost:9051 --tlsRootCertFiles $PEER0_ORG2_CA \
        -c '{"function": "Withdraw", "Args":["'"$CAMPAIGN_ID"'","'"$WITHDRAW_TIMESTAMP"'"]}'
}

CancelCampaign() {
    echo "================= cancel campaign ============================"

    setGlobalsForPeer0Org1

    peer chaincode invoke -o localhost:7050 \
        --ordererTLSHostnameOverride orderer.example.com \
        --tls $CORE_PEER_TLS_ENABLED \
        --cafile $ORDERER_CA \
        -C $CHANNEL_NAME -n ${CC_NAME} \
        --peerAddresses localhost:7051 --tlsRootCertFiles $PEER0_ORG1_CA \
        --peerAddresses localhost:9051 --tlsRootCertFiles $PEER0_ORG2_CA \
        -c '{"function": "CancelCampaign", "Args":["'"$CAMPAIGN_ID"'","'"$CANCEL_TIMESTAMP"'"]}'
}

ReadCampaign() {
    echo "============= Read a specific campaign ============="

    setGlobalsForPeer0Org2

    peer chaincode query -C $CHANNEL_NAME -n ${CC_NAME} \
        -c '{"function": "ReadCampaign", "Args":["'"$CAMPAIGN_ID"'"]}' | jq .
}

GetAllCampaigns() {
    echo "============= Get all campaigns ============="

    setGlobalsForPeer0Org2

    peer chaincode query -C $CHANNEL_NAME -n ${CC_NAME} \
        -c '{"function": "GetAllCampaigns", "Args":[]}' | jq .
}





# Run this function if you add any new dependency in chaincode
presetup

packageChaincode
installChaincode
queryInstalledForOrg1
queryInstalledForOrg2
approveForMyOrg1
checkCommitReadyness
approveForMyOrg2
checkCommitReadyness
commitChaincodeDefination
queryCommitted

chaincodeInvokeInit
# sleep 3
# CreateCampaign
# sleep 3
# DonateToCampaign
# sleep 3
# Withdraw
# sleep 3
# CancelCampaign

# sleep 2

# ReadCampaign 
# sleep 2
# GetAllCampaigns 

