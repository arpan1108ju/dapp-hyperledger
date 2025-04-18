// /backend/gateway/disconnect.js
import { getGateway, resetGateway } from './gateway.js';

export const disconnectFromGateway = async () => {
    const gateway = getGateway();
    if (gateway) {
        await gateway.disconnect();
        gateway.dispose?.();
        resetGateway();
        console.log('🛑 Gateway disconnected');
    } else {
        console.log('⚠️ No gateway to disconnect');
    }
};
