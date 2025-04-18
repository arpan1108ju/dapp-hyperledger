import { getContract } from "../../contract/contract.js";
import { GET_CAMPAIGN } from "../../constants.js";
import { connectToGateway } from "../../gateway/connect.js";

export const getCampaign = async ({ id }) => {
  await connectToGateway();
  const contract = await getContract();
  const result = await contract.evaluateTransaction(GET_CAMPAIGN, id);
  return result ? JSON.parse(result.toString()) : null;
};
