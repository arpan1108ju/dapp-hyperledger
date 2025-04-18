import { getContract } from "../../contract/contract.js";
import { CREATE_CAMPAIGN } from "../../constants.js";
import { connectToGateway } from "../../gateway/connect.js";

export const createCampaign = async ({
  id,
  title,
  description,
  category,
  goal,
  deadline,
  image,
  createdAt,
}) => {
  await connectToGateway();
  const contract = await getContract();

  const result = await contract.submitTransaction(
    CREATE_CAMPAIGN,
    id,
    title,
    description,
    category,
    goal,
    deadline,
    image,
    createdAt
  );

  return result ? JSON.parse(result.toString()) : null;

};
