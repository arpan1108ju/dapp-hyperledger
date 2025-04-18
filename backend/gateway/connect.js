// /backend/gateway/connect.js
import { Gateway, Wallets } from 'fabric-network';
import fs from 'fs';
import { CONNECTION_PROFILE_PATH, WALLET_PATH } from '../paths.js';
import { getGateway, setGateway } from './gateway.js';
import { USER , ADMIN } from '../constants.js';

export const connectToGateway = async () => {

    let gateway = await getGateway();
    if(gateway){
        return;
    }

    const currentRole = USER;

    const ccp = JSON.parse(fs.readFileSync(CONNECTION_PROFILE_PATH, 'utf8'));
    const wallet = await Wallets.newFileSystemWallet(WALLET_PATH);
    const identity = await wallet.get(currentRole);

    if (!identity) {
        throw new Error('Admin identity not found in wallet');
    }

    gateway = new Gateway();
    await gateway.connect(ccp, {
        wallet,
        identity: currentRole,
        discovery: { enabled: true, asLocalhost: true },
    });

    setGateway(gateway);
    console.log('✅ Gateway connected');
};
