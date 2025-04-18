import FabricCAServices from 'fabric-ca-client';
import { Wallets } from 'fabric-network';
import fs from 'fs';

import { CONNECTION_PROFILE_PATH , WALLET_PATH } from '../paths.js';



async function enrollAdmin() {
    try {
        // Load connection profile
        const ccp = JSON.parse(fs.readFileSync(CONNECTION_PROFILE_PATH, 'utf8'));

        // Get CA URL
        const caURL = ccp.certificateAuthorities['ca.org1.example.com'].url;

        // Check HTTPS
        if (!caURL.startsWith('https://')) {
            console.error('Error: The CA URL must start with https://');
            return;
        }

        // Initialize CA client
        const ca = new FabricCAServices(caURL);

        // Create wallet directory
        const wallet = await Wallets.newFileSystemWallet(WALLET_PATH);

        // Check if admin already exists
        const identity = await wallet.get('admin');
        if (identity) {
            console.log('Admin already enrolled');
            return;
        }

        // Enroll admin
        const enrollment = await ca.enroll({ enrollmentID: 'admin', enrollmentSecret: 'adminpw' });

        // Create and store identity
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: 'Org1MSP',
            type: 'X.509',
        };
        await wallet.put('admin', x509Identity);
        console.log('✅ Successfully enrolled admin');
    } catch (error) {
        console.error(`❌ Failed to enroll admin: ${error}`);
    }
}

enrollAdmin();
