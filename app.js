const contractAddress = "0x857663610f7A0BFE997C77ac4f8Ec2D6efe885e5";

const contractABI = [
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "auctionId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "winner",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "AuctionFinalized",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "itemDetails",
				"type": "string"
			}
		],
		"name": "createAuction",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "auctionId",
				"type": "uint256"
			}
		],
		"name": "finalizeAuction",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "auctionId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "itemDetails",
				"type": "string"
			}
		],
		"name": "NewAuction",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "auctionId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "bidder",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "NewBid",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "auctionId",
				"type": "uint256"
			}
		],
		"name": "placeBid",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "auctionCount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "auctions",
		"outputs": [
			{
				"internalType": "address payable",
				"name": "owner",
				"type": "address"
			},
			{
				"internalType": "string",
				"name": "itemDetails",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "highestBid",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "highestBidder",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "isActive",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

let web3;
let contract;

async function initWeb3() {
    if (window.ethereum) {
        web3 = new Web3(window.ethereum);
        try {
            await window.ethereum.request({ method: "eth_requestAccounts" });
            contract = new web3.eth.Contract(contractABI, contractAddress);
            const accounts = await web3.eth.getAccounts();
            document.getElementById('user-address').textContent = ` Connected: ${accounts[0]}`;
            loadAuctions();
            loadTransactionHistory();
            
            
            contract.events.AuctionFinalized({
                fromBlock: 'latest'
            }, function(error, event) {
                if (!error) {
                    console.log("Auction finalized, updating active auctions...");
                    loadAuctions();  
                } else {
                    console.error(error);
                }
            });

        } catch (error) {
            showMessage("User denied account access", "error");
        }
    } else if (window.web3) {
        web3 = new Web3(window.web3.currentProvider);
        contract = new web3.eth.Contract(contractABI, contractAddress);
        loadAuctions();
        loadTransactionHistory();
    } else {
        showMessage("Non-Ethereum browser detected. You should consider trying MetaMask!", "error");
    }
}

async function loadAuctions() {
    const auctionCount = await contract.methods.auctionCount().call();
    const auctionListElement = document.getElementById('auctions');
    auctionListElement.innerHTML = '';

    for (let i = 1; i <= auctionCount; i++) {
        const auction = await contract.methods.auctions(i).call();
        
        if (auction.isActive) {
            const auctionItem = document.createElement('li');
            auctionItem.textContent = `ID: ${i}, Item: ${auction.itemDetails}, Owner: ${auction.owner}, Highest Bid: ${web3.utils.fromWei(auction.highestBid, 'ether')} ETH, Highest Bidder: ${auction.highestBidder}`;
            auctionListElement.appendChild(auctionItem);
        }
    }
}

async function loadTransactionHistory() {
    const transactionTableBody = document.getElementById('transactions').getElementsByTagName('tbody')[0];
    transactionTableBody.innerHTML = ''; 

    // Fetch NewAuction Events
    const newAuctionEvents = await contract.getPastEvents('NewAuction', {
        fromBlock: 0,
        toBlock: 'latest'
    });
    newAuctionEvents.forEach(event => {
        const row = transactionTableBody.insertRow();
        row.insertCell(0).textContent = 'New Auction';
        row.insertCell(1).textContent = event.returnValues.auctionId;
        row.insertCell(2).textContent = `Owner: ${event.returnValues.owner}, Item: ${event.returnValues.itemDetails}`;
        row.insertCell(3).textContent = '-';
    });

    // Fetch NewBid Events
    const newBidEvents = await contract.getPastEvents('NewBid', {
        fromBlock: 0,
        toBlock: 'latest'
    });
    newBidEvents.forEach(event => {
        const row = transactionTableBody.insertRow();
        row.insertCell(0).textContent = 'New Bid';
        row.insertCell(1).textContent = event.returnValues.auctionId;
        row.insertCell(2).textContent = `Bidder: ${event.returnValues.bidder}`;
        row.insertCell(3).textContent = `${web3.utils.fromWei(event.returnValues.amount, 'ether')} ETH`;
    });

    // Fetch AuctionFinalized Events
    const auctionFinalizedEvents = await contract.getPastEvents('AuctionFinalized', {
        fromBlock: 0,
        toBlock: 'latest'
    });
    auctionFinalizedEvents.forEach(event => {
        const row = transactionTableBody.insertRow();
        row.insertCell(0).textContent = 'Auction Finalized';
        row.insertCell(1).textContent = event.returnValues.auctionId;
        row.insertCell(2).textContent = `Winner: ${event.returnValues.winner}`;
        row.insertCell(3).textContent = `${web3.utils.fromWei(event.returnValues.amount, 'ether')} ETH`;
    });
}

document.getElementById('auction-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const accounts = await web3.eth.getAccounts();
    const itemDetails = document.getElementById('itemDetails').value;

    showLoading("Creating auction...");
    try {
        await contract.methods.createAuction(itemDetails).send({ from: accounts[0] });
        showMessage("Auction created successfully!");
        loadAuctions();
        loadTransactionHistory();
    } catch (error) {
        showMessage("Failed to create auction: " + error.message, "error");
    } finally {
        hideLoading();
    }
});

document.getElementById('bid-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const accounts = await web3.eth.getAccounts();
    const auctionId = document.getElementById('auctionId').value;
    const bidAmount = web3.utils.toWei(document.getElementById('bidAmount').value, 'Wei');

    showLoading("Placing bid...");
    try {
        await contract.methods.placeBid(auctionId).send({ from: accounts[0], value: bidAmount });
        showMessage("Bid placed successfully!");
        loadAuctions();
        loadTransactionHistory();
    } catch (error) {
        showMessage("Failed to place bid: " + error.message, "error");
    } finally {
        hideLoading();
    }
});

document.getElementById('finalize-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const accounts = await web3.eth.getAccounts();
    const auctionId = document.getElementById('finalizeAuctionId').value;

    const auction = await contract.methods.auctions(auctionId).call();
    if (auction.owner.toLowerCase() !== accounts[0].toLowerCase()) {
        showMessage("You are not the owner of this auction!", "error");
        return;
    }

    try {
        showLoading("Finalizing auction...");
        await contract.methods.finalizeAuction(auctionId).send({ from: accounts[0] });
        showMessage("Auction finalized successfully!");
        loadAuctions();
        loadTransactionHistory();
    } catch (error) {
        showMessage("Failed to finalize auction: " + error.message, "error");
    } finally {
        hideLoading();
    }
});





function displayAuctions(auctionList) {
    const auctionListElement = document.getElementById('auctions');
    auctionListElement.innerHTML = '';
    auctionList.forEach(auction => {
        const auctionItem = document.createElement('li');
        auctionItem.textContent = `ID: ${auction.id}, Item: ${auction.itemDetails}, Highest Bid: ${web3.utils.fromWei(auction.highestBid, 'ether')} ETH, Highest Bidder: ${auction.highestBidder}`;
        auctionListElement.appendChild(auctionItem);
    });
}

function showLoading(message) {
    const messageBox = document.getElementById('messages');
    messageBox.textContent = message;
    messageBox.style.color = "blue";
}

function hideLoading() {
    const messageBox = document.getElementById('messages');
    messageBox.textContent = '';
}

function showMessage(message, type = "info") {
    const messageBox = document.getElementById('messages');
    messageBox.textContent = message;
    if (type === "error") {
        messageBox.style.color = "red";
    } else {
        messageBox.style.color = "green";
    }
    setTimeout(() => {
        messageBox.textContent = '';
    }, 5000);
}

window.onload = () => {
    initWeb3(); 
    window.ethereum.on('accountsChanged', async function (accounts) {
		if (accounts.length > 0) {
			await initWeb3(); 
			document.getElementById('user-address').textContent = `Connected: ${accounts[0]}`;
		} else {
			document.getElementById('user-address').textContent = 'No account connected';
		}
	});
};