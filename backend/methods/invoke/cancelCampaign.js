import { getContract } from "../../contract/contract.js";
import { CANCEL_CAMPAIGN } from "../../constants.js";
import { connectToGateway } from "../../gateway/connect.js";

export const cancelCampaign = async ({ id, timestamp }) => {
  await connectToGateway();
  const contract = await getContract();

  const result = await contract.submitTransaction(
    CANCEL_CAMPAIGN,
    id,
    timestamp
  );

  return result ? JSON.parse(result.toString()) : null;

};
