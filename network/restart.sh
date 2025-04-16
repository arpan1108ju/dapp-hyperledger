./scripts/kill-all-container.sh

sleep 2

./scripts/generate.sh

sleep 2

./scripts/start.sh

./createChannel.sh

./deployChaincodeCrowdFundingGo.sh