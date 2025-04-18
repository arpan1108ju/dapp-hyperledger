import { getContract } from "../../contract/contract.js";
import { GET_USER_PAYMENTS } from "../../constants.js";
import { connectToGateway } from "../../gateway/connect.js";

export const getUserPaymentDetails = async ({ id }) => {
  await connectToGateway();
  const contract = await getContract();
  const result = await contract.evaluateTransaction(GET_USER_PAYMENTS);
  return result ? JSON.parse(result.toString()) : null;
};
