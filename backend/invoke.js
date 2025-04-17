import { Gateway, Wallets } from 'fabric-network';
import path from 'path';
import fs from 'fs';

import { CONNECTION_PROFILE_PATH, WALLET_PATH } from './paths.js';
import { CAMPAIGN_CATEGORY, CAMPAIGN_CREATED_AT, CAMPAIGN_DEADLINE, CAMPAIGN_DESC, CAMPAIGN_GOAL, CAMPAIGN_ID, CAMPAIGN_IMAGE, CAMPAIGN_TITLE, CHANNEL_NAME, CONTRACT_NAME, CREATE_CAMPAIGN } from './dummy_data.js';

const main = async () => {

    let gateway;

    try {
        // Use correct relative path to connection-org1.json (now in backend)
        const ccp = JSON.parse(fs.readFileSync(CONNECTION_PROFILE_PATH, 'utf8'));
        const wallet = await Wallets.newFileSystemWallet(WALLET_PATH);

        const identity = await wallet.get('admin');
        if (!identity) {
            console.log('❌ Admin identity not found in wallet');
            return;
        }

        console.log('creating gateway... ');
        gateway = new Gateway();
        console.log('gateway created : ',gateway);        
        
        console.log('connecting...');        
        await gateway.connect(ccp, {
            wallet,
            identity: 'admin',
            discovery: { enabled: true, asLocalhost: true },
        });

        console.log('connected');

        const network = await gateway.getNetwork(CHANNEL_NAME);
        const contract = network.getContract(CONTRACT_NAME);

        console.log('network : ',network);
        console.log('wallet : ',wallet);
        console.log('contract : ',contract);

        // Change this to the actual function and args you want to invoke
        const result = await contract.submitTransaction(CREATE_CAMPAIGN,CAMPAIGN_ID,CAMPAIGN_TITLE,CAMPAIGN_DESC,CAMPAIGN_CATEGORY,CAMPAIGN_GOAL,CAMPAIGN_DEADLINE,CAMPAIGN_IMAGE,CAMPAIGN_CREATED_AT);
        console.log(`✅ Transaction has been submitted: ${result.toString()}`);

    } catch (error) {
        console.error(`❌ Failed to submit transaction: ${error}`);
    }
     finally {
    // Always disconnect from the gateway regardless of success or failure
        if (gateway) {
            console.log('Disconnecting gateway...');
            await gateway.disconnect();
            console.log('disconnected');
        }
    }
};

main();

