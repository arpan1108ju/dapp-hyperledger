// /backend/gateway/contract.js

 // Or another config file
import { CHANNEL_NAME, CONTRACT_NAME } from '../constants.js';
import { connectToGateway } from '../gateway/connect.js';
import { getGateway } from '../gateway/gateway.js';

export const getContract = async () => {
    await connectToGateway();
    const gateway = getGateway();

    if (!gateway) {
        throw new Error('Gateway is not connected. Please connect first.');
    }

    const network = await gateway.getNetwork(CHANNEL_NAME);
    const contract = network.getContract(CONTRACT_NAME);
    console.log('✅ Network connected');

    return contract;
};
