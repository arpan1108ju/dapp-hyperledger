const CHANNEL_NAME = "mychannel";
const CONTRACT_NAME = "crowdfundingGO";


const  CAMPAIGN_ID="camp123"
const  CAMPAIGN_TITLE="Save the Planet"
const  CAMPAIGN_DESC="Campaign to plant trees"
const  CAMPAIGN_CATEGORY="Environment"
const  CAMPAIGN_GOAL="10000"
const  CAMPAIGN_IMAGE="https://image.url"

const  CAMPAIGN_CREATED_AT="1000000000"
const  CAMPAIGN_DEADLINE="2000000000"

const  DONATION_AMOUNT="500"
const  DONATION_TIMESTAMP="1000000010"

const  WITHDRAW_TIMESTAMP="2000100000"
const  CANCEL_TIMESTAMP=  "1000100000"

/*******************function name****************** */

const CREATE_CAMPAIGN = "CreateCampaign";
const DONATE_TO_CAMPAIGN = "DonateToCampaign";
const WITHDRAW_CAMPAIGN = "Withdraw";
const CANCEL_CAMPAIGN = "CancelCampaign";
const GET_ALL_CAMPAIGNS = "GetAllCampaigns";
const GET_CAMPAIGN = "ReadCampaign";
const GET_USER_PAYMENTS="GetUserPayments";
const DELETE_CAMPAIGN="DeleteCampaign";
const UPDATE_CAMPAIGN = "UpdateCampaign";

const ADMIN = "admin";
const USER = "appUser";
export { 
    ADMIN,
    USER,
    CAMPAIGN_ID,
    CAMPAIGN_TITLE,
    CAMPAIGN_DESC,
    CAMPAIGN_CATEGORY,
    CAMPAIGN_GOAL,
    CAMPAIGN_IMAGE,
    CAMPAIGN_CREATED_AT,
    CAMPAIGN_DEADLINE,
    DONATION_AMOUNT,
    DONATION_TIMESTAMP,
    WITHDRAW_TIMESTAMP,
    CANCEL_TIMESTAMP,
    CREATE_CAMPAIGN,
    DONATE_TO_CAMPAIGN,
    CANCEL_CAMPAIGN,
    WITHDRAW_CAMPAIGN,
    GET_ALL_CAMPAIGNS,
    GET_CAMPAIGN,
    CHANNEL_NAME,
    CONTRACT_NAME,
    GET_USER_PAYMENTS,
    DELETE_CAMPAIGN,
    UPDATE_CAMPAIGN
};
