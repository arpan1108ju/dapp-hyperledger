const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

async function main() {
    try {
        // Use correct relative path to connection-org1.json (now in backend)
        const ccpPath = path.resolve(__dirname, 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        const walletPath = path.join(__dirname, 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        const identity = await wallet.get('appUser');
        if (!identity) {
            console.log('❌ Admin identity not found in wallet');
            return;
        }

        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity: 'appUser',
            discovery: { enabled: true, asLocalhost: true },
        });

        const network = await gateway.getNetwork('mychannel');
        const contract = network.getContract('fabcar');

        // Change this to the actual function and args you want to invoke
        const result = await contract.submitTransaction('CreateAsset', 'asset7', 'purple', '20', 'Alice', '999');
        console.log(`✅ Transaction has been submitted: ${result.toString()}`);

        await gateway.disconnect();
    } catch (error) {
        console.error(`❌ Failed to submit transaction: ${error}`);
    }
}

main();
