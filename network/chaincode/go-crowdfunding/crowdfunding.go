package main

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

type SmartContract struct {
	contractapi.Contract
}

// Campaign defines a crowdfunding campaign
type Campaign struct {
	ID              string   `json:"id"`
	Owner           string   `json:"owner"`
	Title           string   `json:"title"`
	Description     string   `json:"description"`
	CampaignType    string   `json:"campaignType"`
	Target          int64    `json:"target"`
	Deadline        int64    `json:"deadline"`
	AmountCollected int64    `json:"amountCollected"`
	Image           string   `json:"image"`
	Donators        []string `json:"donators"`
	Donations       []int64  `json:"donations"`
	Withdrawn       bool     `json:"withdrawn"`
	Canceled        bool     `json:"canceled"`
}

// PaymentDetail records a payment-related event
type PaymentDetail struct {
	CampaignID  string `json:"campaignId"`
	Amount      int64  `json:"amount"`
	Timestamp   int64  `json:"timestamp"`
	PaymentType string `json:"paymentType"`
}

// Init initializes the chaincode
func (s *SmartContract) InitLedger(ctx contractapi.TransactionContextInterface) error {
	return nil
}

// CreateCampaign adds a new campaign to the ledger
func (s *SmartContract) CreateCampaign(ctx contractapi.TransactionContextInterface, id, title, description, campaignType string, target, deadline int64, image string) error {
	exists, err := s.CampaignExists(ctx, id)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("campaign %s already exists", id)
	}

	currentTime := time.Now().Unix()
	if deadline <= currentTime {
		return fmt.Errorf("deadline must be in the future")
	}

	clientID, err := ctx.GetClientIdentity().GetID()
	if err != nil {
		return fmt.Errorf("failed to get client identity: %v", err)
	}

	campaign := Campaign{
		ID:              id,
		Owner:           clientID,
		Title:           title,
		Description:     description,
		CampaignType:    campaignType,
		Target:          target,
		Deadline:        deadline,
		AmountCollected: 0,
		Image:           image,
		Withdrawn:       false,
		Canceled:        false,
		Donators:        []string{},   // ✅ Initialized
		Donations:       []int64{},    // ✅ Initialized
	}

	campaignJSON, err := json.Marshal(campaign)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(id, campaignJSON)
}

// DonateToCampaign allows a user to donate to a campaign
func (s *SmartContract) DonateToCampaign(ctx contractapi.TransactionContextInterface, id string, amount int64,timestamp int64) error {
	campaign, err := s.ReadCampaign(ctx, id)
	if err != nil {
		return err
	}
	if campaign.Canceled {
		return fmt.Errorf("cannot donate to a canceled campaign")
	}
	if campaign.AmountCollected+amount > campaign.Target {
		return fmt.Errorf("donation exceeds campaign target")
	}

	donorID, err := ctx.GetClientIdentity().GetID()
	if err != nil {
		return err
	}

	campaign.AmountCollected += amount
	campaign.Donators = append(campaign.Donators, donorID)
	campaign.Donations = append(campaign.Donations, amount)

	campaignJSON, err := json.Marshal(campaign)
	if err != nil {
		return err
	}

	err = ctx.GetStub().PutState(id, campaignJSON)
	if err != nil {
		return err
	}

	payment := PaymentDetail{
		CampaignID:  id,
		Amount:      amount,
		Timestamp:   timestamp,
		PaymentType: "donation",
	}

	return s.appendPayment(ctx, donorID, payment)
}

// Withdraw allows the campaign owner to withdraw funds after deadline
func (s *SmartContract) Withdraw(ctx contractapi.TransactionContextInterface, id string) error {
	campaign, err := s.ReadCampaign(ctx, id)
	if err != nil {
		return err
	}

	if campaign.Withdrawn {
		return fmt.Errorf("funds already withdrawn")
	}
	if campaign.AmountCollected <= 0 {
		return fmt.Errorf("no funds to withdraw")
	}
	if campaign.Deadline > time.Now().Unix() {
		return fmt.Errorf("cannot withdraw before deadline")
	}

	clientID, err := ctx.GetClientIdentity().GetID()
	if err != nil {
		return err
	}
	if campaign.Owner != clientID {
		return fmt.Errorf("only campaign owner can withdraw")
	}

	campaign.Withdrawn = true

	campaignJSON, err := json.Marshal(campaign)
	if err != nil {
		return err
	}

	err = ctx.GetStub().PutState(id, campaignJSON)
	if err != nil {
		return err
	}

	payment := PaymentDetail{
		CampaignID:  id,
		Amount:      campaign.AmountCollected,
		Timestamp:   time.Now().Unix(),
		PaymentType: "withdrawal",
	}
	return s.appendPayment(ctx, clientID, payment)
}

// CancelCampaign cancels the campaign and refunds donors
func (s *SmartContract) CancelCampaign(ctx contractapi.TransactionContextInterface, id string) error {
	campaign, err := s.ReadCampaign(ctx, id)
	if err != nil {
		return err
	}
	if campaign.Canceled {
		return fmt.Errorf("campaign is already canceled")
	}
	if campaign.Deadline <= time.Now().Unix() {
		return fmt.Errorf("cannot cancel after deadline")
	}

	clientID, err := ctx.GetClientIdentity().GetID()
	if err != nil {
		return err
	}
	if campaign.Owner != clientID {
		return fmt.Errorf("only campaign owner can cancel")
	}

	for i, donor := range campaign.Donators {
		amount := campaign.Donations[i]
		refund := PaymentDetail{
			CampaignID:  id,
			Amount:      amount,
			Timestamp:   time.Now().Unix(),
			PaymentType: "refund",
		}
		err := s.appendPayment(ctx, donor, refund)
		if err != nil {
			return fmt.Errorf("failed to log refund: %v", err)
		}
	}

	campaign.Canceled = true
	campaignJSON, err := json.Marshal(campaign)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(id, campaignJSON)
}

// ReadCampaign returns the campaign stored in the ledger with given ID
func (s *SmartContract) ReadCampaign(ctx contractapi.TransactionContextInterface, id string) (*Campaign, error) {
	campaignJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return nil, err
	}
	if campaignJSON == nil {
		return nil, fmt.Errorf("campaign %s does not exist", id)
	}

	var campaign Campaign
	err = json.Unmarshal(campaignJSON, &campaign)
	if err != nil {
		return nil, err
	}

	return &campaign, nil
}

// GetAllCampaigns returns all campaigns from world state
func (s *SmartContract) GetAllCampaigns(ctx contractapi.TransactionContextInterface) ([]*Campaign, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var campaigns []*Campaign
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var campaign Campaign
		err = json.Unmarshal(queryResponse.Value, &campaign)
		if err != nil {
			continue
		}

		campaigns = append(campaigns, &campaign)
	}

	if campaigns == nil {
		campaigns = []*Campaign{}
	}

	return campaigns, nil

}

// appendPayment appends a payment detail to a composite key list
func (s *SmartContract) appendPayment(ctx contractapi.TransactionContextInterface, user string, payment PaymentDetail) error {
	paymentKey, err := ctx.GetStub().CreateCompositeKey("payment", []string{user, fmt.Sprint(time.Now().UnixNano())})
	if err != nil {
		return err
	}
	paymentJSON, err := json.Marshal(payment)
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState(paymentKey, paymentJSON)
}

// CampaignExists returns true if campaign with given ID exists
func (s *SmartContract) CampaignExists(ctx contractapi.TransactionContextInterface, id string) (bool, error) {
	campaignJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return false, err
	}
	return campaignJSON != nil, nil
}

func main() {
	chaincode, err := contractapi.NewChaincode(new(SmartContract))
	if err != nil {
		panic(fmt.Sprintf("Error creating chaincode: %v", err))
	}

	if err := chaincode.Start(); err != nil {
		panic(fmt.Sprintf("Error starting chaincode: %v", err))
	}
}
