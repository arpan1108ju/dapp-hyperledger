import { getContract } from "../../contract/contract.js";
import { WITHDRAW_CAMPAIGN } from "../../constants.js";
import { connectToGateway } from "../../gateway/connect.js";

export const withdrawCampaign = async ({ id, timestamp }) => {
  await connectToGateway();
  const contract = await getContract();

  const result = await contract.submitTransaction(
    WITHDRAW_CAMPAIGN,
    id,
    timestamp
  );

  return result ? JSON.parse(result.toString()) : null;

};
