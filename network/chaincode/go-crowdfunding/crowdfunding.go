package main

import (
	"encoding/json"
	"fmt"
	"log"

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
	
	log.Printf("Successfully called InitLedger")
	return nil
}

// CreateCampaign adds a new campaign to the ledger
func (s *SmartContract) CreateCampaign(ctx contractapi.TransactionContextInterface, id, title, description, campaignType string, target, deadline int64, image string,timestamp int64) error {
	exists, err := s.CampaignExists(ctx, id)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("campaign %s already exists", id)
	}

	if deadline <= timestamp {
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

	
	log.Printf("Successfully created campaign: %s", id)

	return ctx.GetStub().PutState(id, campaignJSON)
}


// UpdateCampaign allows campaign owner to update editable fields before deadline and before donations
func (s *SmartContract) UpdateCampaign(ctx contractapi.TransactionContextInterface, id, title, description, campaignType string, target, deadline int64, image string, timestamp int64) error {
	campaign, err := s.ReadCampaign(ctx, id)
	if err != nil {
		return err
	}

	if campaign.Canceled {
		return fmt.Errorf("cannot update a canceled campaign")
	}
	if campaign.Withdrawn {
		return fmt.Errorf("cannot update a withdrawn campaign")
	}
	if campaign.Deadline <= timestamp {
		return fmt.Errorf("cannot update a campaign after deadline")
	}

	clientID, err := ctx.GetClientIdentity().GetID()
	if err != nil {
		return fmt.Errorf("failed to get client identity: %v", err)
	}
	if campaign.Owner != clientID {
		return fmt.Errorf("only campaign owner can update the campaign")
	}

	if campaign.AmountCollected > 0 {
		// If funds already collected, restrict update to only title, description and image
		campaign.Title = title
		campaign.Description = description
		campaign.Image = image
	} else {
		// Full editable if no donations
		if deadline <= timestamp {
			return fmt.Errorf("new deadline must be in the future")
		}
		campaign.Title = title
		campaign.Description = description
		campaign.CampaignType = campaignType
		campaign.Target = target
		campaign.Deadline = deadline
		campaign.Image = image
	}

	campaignJSON, err := json.Marshal(campaign)
	if err != nil {
		return err
	}

	err = ctx.GetStub().PutState(id, campaignJSON)
	if err != nil {
		return err
	}

	log.Printf("Successfully updated campaign: %s", id)
	return nil
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

	
	log.Printf("Successfully donated to campaign: %s", id)

	return s.appendPayment(ctx, donorID, payment)
}

// Withdraw allows the campaign owner to withdraw funds after deadline
func (s *SmartContract) Withdraw(ctx contractapi.TransactionContextInterface, id string,timestamp int64) error {
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
	if campaign.Deadline > timestamp {
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
		Timestamp:   timestamp,
		PaymentType: "withdrawal",
	}

	
	log.Printf("Successfully withdrawn campaign: %s", id)
	return s.appendPayment(ctx, clientID, payment)
}

// CancelCampaign cancels the campaign and refunds donors
func (s *SmartContract) CancelCampaign(ctx contractapi.TransactionContextInterface, id string, timestamp int64) error {
	campaign, err := s.ReadCampaign(ctx, id)
	if err != nil {
		return err
	}
	if campaign.Canceled {
		return fmt.Errorf("campaign is already canceled")
	}
	if campaign.Deadline <= timestamp {
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
			Timestamp:   timestamp,
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

	
	log.Printf("Successfully cenceled campaign: %s", id)

	return ctx.GetStub().PutState(id, campaignJSON)
	
}

// DeleteCampaign deletes a campaign if it exists, is not withdrawn, and belongs to the caller
func (s *SmartContract) DeleteCampaign(ctx contractapi.TransactionContextInterface, id string) error {
	campaign, err := s.ReadCampaign(ctx, id)
	if err != nil {
		return err
	}

	clientID, err := ctx.GetClientIdentity().GetID()
	if err != nil {
		return fmt.Errorf("failed to get client identity: %v", err)
	}

	if campaign.Owner != clientID {
		return fmt.Errorf("only the campaign owner can delete the campaign")
	}

	if campaign.Withdrawn {
		return fmt.Errorf("cannot delete a campaign that has already been withdrawn")
	}

	if campaign.Canceled {
		return fmt.Errorf("campaign is already canceled; deletion not allowed")
	}

	err = ctx.GetStub().DelState(id)
	if err != nil {
		return fmt.Errorf("failed to delete campaign: %v", err)
	}

	log.Printf("Successfully deleted campaign: %s", id)
	return nil
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

	log.Printf("Successfully read campaign: %s", id)
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

	
	log.Printf("Got all campaign : ")
	return campaigns, nil

}

// GetUserPayments retrieves all payment records for the calling user
func (s *SmartContract) GetUserPayments(ctx contractapi.TransactionContextInterface) ([]*PaymentDetail, error) {
	userID, err := ctx.GetClientIdentity().GetID()
	if err != nil {
		return nil, fmt.Errorf("failed to get client identity: %v", err)
	}

	iterator, err := ctx.GetStub().GetStateByPartialCompositeKey("payment", []string{userID})
	if err != nil {
		return nil, fmt.Errorf("failed to get payment history for user %s: %v", userID, err)
	}
	defer iterator.Close()

	var payments []*PaymentDetail

	for iterator.HasNext() {
		response, err := iterator.Next()
		if err != nil {
			return nil, err
		}

		var payment PaymentDetail
		err = json.Unmarshal(response.Value, &payment)
		if err != nil {
			continue // skip any corrupted record
		}

		payments = append(payments, &payment)
	}

	if payments == nil {
		payments = []*PaymentDetail{}
	}

	log.Printf("Retrieved %d payments for user: %s", len(payments), userID)
	return payments, nil
}


// appendPayment appends a payment detail to a composite key list
func (s *SmartContract) appendPayment(ctx contractapi.TransactionContextInterface, user string, payment PaymentDetail) error {
	paymentKey, err := ctx.GetStub().CreateCompositeKey("payment", []string{user, fmt.Sprint(payment.Timestamp)})
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

