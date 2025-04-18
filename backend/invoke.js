import {
  CAMPAIGN_CATEGORY,
  CAMPAIGN_CREATED_AT,
  CAMPAIGN_DEADLINE,
  CAMPAIGN_DESC,
  CAMPAIGN_GOAL,
  CAMPAIGN_ID,
  CAMPAIGN_IMAGE,
  CAMPAIGN_TITLE,
  CHANNEL_NAME,
  CONTRACT_NAME,
  CREATE_CAMPAIGN,
} from "./constants.js";
import { disconnectFromGateway } from "./gateway/disconnect.js";
import { createCampaign } from "./methods/invoke/createCampaign.js";

const main = async () => {
  try {
    const result = await createCampaign({
      id: CAMPAIGN_ID,
      title: CAMPAIGN_TITLE,
      description: CAMPAIGN_DESC,
      category: CAMPAIGN_CATEGORY,
      goal: CAMPAIGN_GOAL,
      deadline: CAMPAIGN_DEADLINE,
      image: CAMPAIGN_IMAGE,
      createdAt: CAMPAIGN_CREATED_AT,
    });
    console.log(
      `✅ Transaction has been submitted: ${JSON.parse(result.toString())}`
    );
  } catch (error) {
    console.error(`❌ Failed to submit transaction: ${error}`);
  } finally {
    await disconnectFromGateway();
    process.exit(0);
  }
};

main();
