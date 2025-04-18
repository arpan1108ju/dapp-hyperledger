import { getContract } from "../../contract/contract.js";
import { DONATE_TO_CAMPAIGN } from "../../constants.js";
import { connectToGateway } from "../../gateway/connect.js";

export const donateToCampaign = async ({ id, amount, timestamp }) => {
  await connectToGateway();
  const contract = await getContract();

  const result = await contract.submitTransaction(
    DONATE_TO_CAMPAIGN,
    id,
    amount,
    timestamp
  );

  return result ? JSON.parse(result.toString()) : null;

};
