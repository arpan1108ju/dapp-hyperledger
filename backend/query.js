// backend/query.js


import { disconnectFromGateway } from "./gateway/disconnect.js";
import { getAllCampaigns } from "./methods/query/getAllCampaigns.js";
import { getCampaign } from "./methods/query/getCampaign.js";

async function query() {
    try {
        const result = await getAllCampaigns();
        // const result = await getCampaign({id : "camp1234"});

        // await connectToGateway();
        // const contract = await getContract();
        // const result = await contract.evaluateTransaction(GET_CAMPAIGN,"camp1234");


        console.log('✅ Query Result:', result);
        
    } catch (error) {
        console.error(`❌ Failed to submit transaction: ${error}`);   
    }
    finally {
        await disconnectFromGateway();
        process.exit(0);
    }
}

query();