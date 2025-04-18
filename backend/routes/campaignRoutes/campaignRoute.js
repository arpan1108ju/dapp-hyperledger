import express from "express";
import { getAllCampaignsHandler } from "../../controllers/campaign-controllers/getAllCampaigns.js";
import { getCampaignHandler } from "../../controllers/campaign-controllers/getCampaign.js";
import { createCampaignHandler } from "../../controllers/campaign-controllers/createCampaign.js";
import { donateCampaignHandler } from "../../controllers/campaign-controllers/donateCampaign.js";
import { withdrawCampaignHandler } from "../../controllers/campaign-controllers/withdrawCampaign.js";
import { cancelCampaignHandler } from "../../controllers/campaign-controllers/cancelCampaign.js";
import { deleteCampaignHandler } from "../../controllers/campaign-controllers/deleteCampaign.js";
import { updateCampaignHandler } from "../../controllers/campaign-controllers/updateCampaign.js";

const router = express.Router();

router.get('/',getAllCampaignsHandler);
router.get('/:id',getCampaignHandler);

router.post('/',createCampaignHandler);

router.post('/:id/donate',donateCampaignHandler);
router.post('/:id/withdraw',withdrawCampaignHandler);
router.post('/:id/cancel',cancelCampaignHandler);
router.patch('/:id',updateCampaignHandler);
router.delete('/:id',deleteCampaignHandler);


export default router;