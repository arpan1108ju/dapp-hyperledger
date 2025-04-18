import { getContract } from "../../contract/contract.js";
import { GET_ALL_CAMPAIGNS } from "../../constants.js";
import { connectToGateway } from "../../gateway/connect.js";

export const getAllCampaigns = async () => {
  await connectToGateway();
  const contract = await getContract();
  const result = await contract.evaluateTransaction(GET_ALL_CAMPAIGNS);
  return result ? JSON.parse(result.toString()) : null;

};
