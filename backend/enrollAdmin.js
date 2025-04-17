const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

async function enrollAdmin() {
    try {
        // Path to connection profile (connection-org1.json)
        const ccpPath = path.resolve(__dirname, 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Retrieve the CA URL from the connection profile
        const caURL = ccp.certificateAuthorities['ca.org1.example.com'].url;

        // Check if the CA URL is using HTTPS
        if (!caURL.startsWith('https://')) {
            console.error('Error: The CA URL must start with https://');
            return;
        }

        // Create a new Fabric CA client for interacting with the CA
        const ca = new FabricCAServices(caURL);

        // Setup the wallet to store identities
        const wallet = await Wallets.newFileSystemWallet(path.join(__dirname, 'wallet'));

        // Check if the admin identity already exists in the wallet
        const identity = await wallet.get('admin');
        if (identity) {
            console.log('Admin already enrolled');
            return;
        }

        // Enroll the admin user
        const enrollment = await ca.enroll({ enrollmentID: 'admin', enrollmentSecret: 'adminpw' });

        // Create an X.509 identity and store it in the wallet
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: 'Org1MSP',
            type: 'X.509',
        };
        await wallet.put('admin', x509Identity);
        console.log('Successfully enrolled admin');
    } catch (error) {
        console.error(`Failed to enroll admin: ${error}`);
    }
}

enrollAdmin();
