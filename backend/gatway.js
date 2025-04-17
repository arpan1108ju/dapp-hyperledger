// backend/gateway.js
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

const ccpPath = path.resolve(__dirname, 'connection-org1.json');
const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
const walletPath = path.join(__dirname, 'wallet');

async function getContract() {
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    const gateway = new Gateway();

    await gateway.connect(ccp, {
        wallet,
        identity: 'admin',
        discovery: { enabled: true, asLocalhost: true },
    });

    const network = await gateway.getNetwork('mychannel');
    const contract = network.getContract('fabcar'); // or 'assetTransfer'
    return { gateway, contract };
}

module.exports = { getContract };
