// backend/query.js
const { getContract } = require('./gateway');

async function query() {
    const { gateway, contract } = await getContract();

    const result = await contract.evaluateTransaction('ReadAsset', '1111');
    console.log('✅ Query Result:', result.toString());

    await gateway.disconnect();
}

query();
