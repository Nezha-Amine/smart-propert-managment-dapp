// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract PropertyManagement is ReentrancyGuard {
    // Struct to store property details
    struct Property {
        uint256 id;
        address owner;
        string propertyAddress;
        uint256 size;
        string propertyType;
        bool isActive;
        uint256 createdAt;
        bool isForSale;
        uint256 salePrice;
        // Auction related fields
        bool onAuction;
        uint256 auctionEndTime;
        address highestBidder;
        uint256 highestBid;
        bool auctionEnded;
        bool isApproved;  // New field for notary approval
        string documentHash;  // New field for property document hash
    }
    
    // Struct to store lease agreement details
    struct LeaseAgreement {
        uint256 id;
        uint256 propertyId;
        address landlord;
        address tenant;
        uint256 monthlyRent;
        uint256 securityDeposit;
        uint256 startDate;
        uint256 endDate;
        bool isActive;
        uint256 createdAt;
        uint256 previousLeaseId; // Track renewal chain
        bool isRenewal;          // Flag to indicate if this is a renewal
    }
    
    // Struct to store property sale details
    struct PropertySale {
        uint256 id;
        uint256 propertyId;
        address seller;
        address buyer;
        uint256 salePrice;
        uint256 timestamp;
        bool completed;
    }
    
    // Struct to store transaction details
    struct Transaction {
        uint256 id;
        uint256 leaseId;
        address from;
        address to;
        uint256 amount;
        string transactionType; // "RENT", "SECURITY_DEPOSIT", "REFUND"
        uint256 timestamp;
    }
    
    // Struct to store auction details
    struct Auction {
        uint256 propertyId;
        uint256 startingPrice;
        uint256 highestBid;
        address highestBidder;
        uint256 auctionEndTime;
        bool ended;
        bool exists;
    }
    
    // Counters for generating IDs
    uint256 private propertyCounter;
    uint256 private leaseCounter;
    uint256 private transactionCounter;
    uint256 private saleCounter; //Counter for property sales
    // Mappings to store data
    mapping(uint256 => Property) public properties;
    mapping(address => uint256[]) public ownerProperties;
    mapping(uint256 => LeaseAgreement) public leaseAgreements;
    mapping(address => uint256[]) public tenantLeases;
    mapping(address => uint256[]) public landlordLeases;
    mapping(uint256 => Transaction[]) public leaseTransactions;
    mapping(uint256 => uint256) public renewedLeases; // Maps old lease ID to new lease ID
    mapping(uint256 => PropertySale) public propertySales; // NEW: Map property sales by ID
    mapping(uint256 => uint256[]) public propertyTransferHistory; // NEW: Record property ownership transfers
    mapping(uint256 => Auction) public auctions; // propertyId => Auction
    mapping(uint256 => mapping(address => uint256)) public pendingReturns; // propertyId => (bidder => amount)
   
    // Notary related state variables
    address public notary;
    mapping(uint256 => bool) public propertyApprovals;
    mapping(uint256 => string) public propertyDocuments;
   
    // Events
    event PropertyRegistered(uint256 propertyId, address owner, string propertyAddress);
    event LeaseCreated(uint256 leaseId, uint256 propertyId, address landlord, address tenant);
    event PaymentReceived(uint256 leaseId, address from, address to, uint256 amount, string transactionType);
    event LeaseRenewed(uint256 oldLeaseId, uint256 newLeaseId, uint256 newEndDate);
    event LeaseExpiringSoon(uint256 leaseId, uint256 daysRemaining);
    event PropertyListedForSale(uint256 propertyId, uint256 price); // NEW: Event for listing property
    event PropertySaleCancelled(uint256 propertyId); // NEW: Event for cancelling sale
    event PropertySaleInitiated(uint256 saleId, uint256 propertyId, address seller, address buyer, uint256 price); // NEW: Event for sale process
    event PropertySaleCompleted(uint256 saleId, uint256 propertyId, address newOwner); // NEW: Event for completed sale
    event AuctionStarted(uint256 indexed propertyId, uint256 startingPrice, uint256 duration);
    event BidPlaced(uint256 indexed propertyId, address indexed bidder, uint256 amount);
    event AuctionEnded(uint256 indexed propertyId, address winner, uint256 amount);
    event BidWithdrawn(uint256 indexed propertyId, address indexed bidder, uint256 amount);
    event AuctionCancelled(uint256 indexed propertyId, uint256 refundedAmount);
    event PropertySubmitted(uint256 propertyId, address owner, string propertyAddress);
    event PropertyApproved(uint256 propertyId, address notary);
    event PropertyRejected(uint256 propertyId, address notary);
   
    constructor() {
        notary = msg.sender; // Set the contract deployer as the notary
    }
    
    // Modifiers
    modifier onlyPropertyOwner(uint256 _propertyId) {
        require(properties[_propertyId].owner == msg.sender, "Not the property owner");
        _;
    }
    
    modifier onlyLandlordOrTenant(uint256 _leaseId) {
        require(
            leaseAgreements[_leaseId].landlord == msg.sender || 
            leaseAgreements[_leaseId].tenant == msg.sender,
            "Not authorized"
        );
        _;
    }

    modifier onlyLandlord(uint256 _leaseId) {
        require(leaseAgreements[_leaseId].landlord == msg.sender, "Only landlord can perform this action");
        _;
    }
    
    modifier onlyNotary() {
        require(msg.sender == notary, "Only notary can perform this action");
        _;
    }
    
    // Getter function for propertyCounter
    function getPropertyCounter() public view returns (uint256) {
        return propertyCounter;
    }
    
    // Function to register a new property
    function registerProperty(
        string memory _propertyAddress,
        uint256 _size,
        string memory _propertyType,
        string memory _documentHash
    ) external returns (uint256) {
        propertyCounter++;
        
        Property memory newProperty = Property({
            id: propertyCounter,
            owner: msg.sender,
            propertyAddress: _propertyAddress,
            size: _size,
            propertyType: _propertyType,
            isActive: false,  // Set to false until approved
            createdAt: block.timestamp,
            isForSale: false,
            salePrice: 0,
            onAuction: false,
            auctionEndTime: 0,
            highestBidder: address(0),
            highestBid: 0,
            auctionEnded: false,
            isApproved: false,
            documentHash: _documentHash
        });
        
        properties[propertyCounter] = newProperty;
        ownerProperties[msg.sender].push(propertyCounter);
        
        emit PropertySubmitted(propertyCounter, msg.sender, _propertyAddress);
        return propertyCounter;
    }
    
    // Function to create a lease agreement
    function createLeaseAgreement(
        uint256 _propertyId,
        address _tenant,
        uint256 _monthlyRent,
        uint256 _securityDeposit,
        uint256 _startDate,
        uint256 _endDate
    ) external onlyPropertyOwner(_propertyId) onlyApprovedProperty(_propertyId) returns (uint256) {
        require(properties[_propertyId].isActive, "Property is not active");
        require(!properties[_propertyId].isForSale, "Property is currently for sale"); //Cannot lease property that's for sale
        require(_tenant != address(0), "Invalid tenant address");
        require(_startDate < _endDate, "Invalid lease duration");
        
        leaseCounter++;
        
        LeaseAgreement memory newLease = LeaseAgreement({
            id: leaseCounter,
            propertyId: _propertyId,
            landlord: msg.sender,
            tenant: _tenant,
            monthlyRent: _monthlyRent,
            securityDeposit: _securityDeposit,
            startDate: _startDate,
            endDate: _endDate,
            isActive: true,
            createdAt: block.timestamp,
            previousLeaseId: 0,
            isRenewal: false
        });
        
        leaseAgreements[leaseCounter] = newLease;
        tenantLeases[_tenant].push(leaseCounter);
        landlordLeases[msg.sender].push(leaseCounter);
        
        emit LeaseCreated(leaseCounter, _propertyId, msg.sender, _tenant);
        return leaseCounter;
    }
    
    // Function to pay rent or security deposit
    function makePayment(uint256 _leaseId, string memory _transactionType) external payable {
        LeaseAgreement memory lease = leaseAgreements[_leaseId];
        require(lease.isActive, "Lease is not active");
        require(lease.tenant == msg.sender, "Not the tenant of this lease");
        
        uint256 requiredAmount = 0;
        
        if (keccak256(bytes(_transactionType)) == keccak256(bytes("RENT"))) {
            requiredAmount = lease.monthlyRent;
        } else if (keccak256(bytes(_transactionType)) == keccak256(bytes("SECURITY_DEPOSIT"))) {
            requiredAmount = lease.securityDeposit;
        } else {
            revert("Invalid transaction type");
        }
        
        require(msg.value == requiredAmount, "Incorrect payment amount");
        
        // Transfer the payment to the landlord
        payable(lease.landlord).transfer(msg.value);
        
        // Record the transaction
        transactionCounter++;
        Transaction memory newTransaction = Transaction({
            id: transactionCounter,
            leaseId: _leaseId,
            from: msg.sender,
            to: lease.landlord,
            amount: msg.value,
            transactionType: _transactionType,
            timestamp: block.timestamp
        });
        
        leaseTransactions[_leaseId].push(newTransaction);
        
        emit PaymentReceived(_leaseId, msg.sender, lease.landlord, msg.value, _transactionType);
    }
    
    // Function to terminate a lease
    function terminateLease(uint256 _leaseId) external onlyPropertyOwner(leaseAgreements[_leaseId].propertyId) {
        require(leaseAgreements[_leaseId].isActive, "Lease is not active");
        leaseAgreements[_leaseId].isActive = false;
    }
    
    // Check if a lease is expiring soon
    function checkLeaseExpiration(uint256 _leaseId) external view returns (bool isExpiring, uint256 daysRemaining) {
        LeaseAgreement memory lease = leaseAgreements[_leaseId];
        require(lease.id > 0, "Lease does not exist");
        
        // If lease is not active, it's already expired or terminated
        if (!lease.isActive) {
            return (false, 0);
        }
        
        uint256 currentTime = block.timestamp;
        
        // If current time is past end date, lease has expired
        if (currentTime > lease.endDate) {
            return (true, 0);
        }
        
        // Calculate days remaining (approximate as block timestamps can vary)
        uint256 timeRemaining = lease.endDate - currentTime;
        uint256 daysLeft = timeRemaining / 86400; // 86400 seconds in a day
        
        // Consider "expiring soon" if less than 30 days remaining
        return (daysLeft < 30, daysLeft);
    }
    
    // Renew a lease agreement
    function renewLease(
        uint256 _leaseId,
        uint256 _newMonthlyRent,
        uint256 _newSecurityDeposit,
        uint256 _newEndDate
    ) external onlyLandlord(_leaseId) returns (uint256) {
        LeaseAgreement memory oldLease = leaseAgreements[_leaseId];
        require(oldLease.isActive, "Cannot renew an inactive lease");
        
        // End the current lease
        leaseAgreements[_leaseId].isActive = false;
        
        // Create a new lease as a renewal
        leaseCounter++;
        
        LeaseAgreement memory newLease = LeaseAgreement({
            id: leaseCounter,
            propertyId: oldLease.propertyId,
            landlord: oldLease.landlord,
            tenant: oldLease.tenant,
            monthlyRent: _newMonthlyRent,
            securityDeposit: _newSecurityDeposit,
            startDate: oldLease.endDate, // Start new lease when old one ends
            endDate: _newEndDate,
            isActive: true,
            createdAt: block.timestamp,
            previousLeaseId: _leaseId,
            isRenewal: true
        });
        
        leaseAgreements[leaseCounter] = newLease;
        tenantLeases[oldLease.tenant].push(leaseCounter);
        landlordLeases[msg.sender].push(leaseCounter);
        
        // Record the renewal relationship
        renewedLeases[_leaseId] = leaseCounter;
        
        emit LeaseRenewed(_leaseId, leaseCounter, _newEndDate);
        return leaseCounter;
    }
    
    // FUNCTION: Get all expiring leases for a landlord (within 30 days)
    function getExpiringLeases(address _landlord) external view returns (uint256[] memory) {
        uint256[] memory landlordLeaseList = landlordLeases[_landlord];
        uint256 count = 0;
        
        // First, count expiring leases
        for (uint i = 0; i < landlordLeaseList.length; i++) {
            uint256 leaseId = landlordLeaseList[i];
            LeaseAgreement memory lease = leaseAgreements[leaseId];
            
            if (lease.isActive && lease.endDate <= block.timestamp + 30 days && lease.endDate > block.timestamp) {
                count++;
            }
        }
        
        // Create array of correct size
        uint256[] memory expiringLeases = new uint256[](count);
        uint256 index = 0;
        
        // Populate array with expiring lease IDs
        for (uint i = 0; i < landlordLeaseList.length; i++) {
            uint256 leaseId = landlordLeaseList[i];
            LeaseAgreement memory lease = leaseAgreements[leaseId];
            
            if (lease.isActive && lease.endDate <= block.timestamp + 30 days && lease.endDate > block.timestamp) {
                expiringLeases[index] = leaseId;
                index++;
            }
        }
        
        return expiringLeases;
    }
    
    //FUNCTION: Get renewal history of a lease
    function getLeaseRenewalHistory(uint256 _leaseId) external view returns (uint256[] memory) {
        // Start with current lease
        uint256 currentLeaseId = _leaseId;
        uint256 historyLength = 0;
        
        // First, count the history length
        while (leaseAgreements[currentLeaseId].previousLeaseId != 0) {
            historyLength++;
            currentLeaseId = leaseAgreements[currentLeaseId].previousLeaseId;
        }
        
        // Create array of history
        uint256[] memory history = new uint256[](historyLength + 1);
        
        // Populate history array (most recent first)
        currentLeaseId = _leaseId;
        for (uint i = 0; i <= historyLength; i++) {
            history[i] = currentLeaseId;
            if (i < historyLength) {
                currentLeaseId = leaseAgreements[currentLeaseId].previousLeaseId;
            }
        }
        
        return history;
    }
    
     //NEW: Function to list a property for sale
    function listPropertyForSale(uint256 _propertyId, uint256 _price) external onlyPropertyOwner(_propertyId) onlyApprovedProperty(_propertyId) {
        require(properties[_propertyId].isActive, "Property is not active");
        require(_price > 0, "Sale price must be greater than zero");
        
        // Check if the property has any active leases
        uint256[] memory landlordLeaseList = landlordLeases[msg.sender];
        for (uint i = 0; i < landlordLeaseList.length; i++) {
            LeaseAgreement memory lease = leaseAgreements[landlordLeaseList[i]];
            if (lease.propertyId == _propertyId && lease.isActive) {
                // End the lease before selling
                leaseAgreements[landlordLeaseList[i]].isActive = false;
            }
        }
        
        // Mark property as for sale
        properties[_propertyId].isForSale = true;
        properties[_propertyId].salePrice = _price;
        
        emit PropertyListedForSale(_propertyId, _price);
    }


 // NEW: Function to cancel property listing
    function cancelPropertySale(uint256 _propertyId) external onlyPropertyOwner(_propertyId) {
        require(properties[_propertyId].isForSale, "Property is not listed for sale");
        
        properties[_propertyId].isForSale = false;
        properties[_propertyId].salePrice = 0;
        
        emit PropertySaleCancelled(_propertyId);
    }
    
    // NEW: Function to initiate property purchase
    function initiatePropertyPurchase(uint256 _propertyId) external payable {
        Property memory property = properties[_propertyId];
        require(property.isActive, "Property is not active");
        require(property.isForSale, "Property is not for sale");
        require(property.owner != msg.sender, "Owner cannot buy their own property");
        require(msg.value == property.salePrice, "Incorrect payment amount");
        
        // Create sale record
        saleCounter++;
        PropertySale memory newSale = PropertySale({
            id: saleCounter,
            propertyId: _propertyId,
            seller: property.owner,
            buyer: msg.sender,
            salePrice: property.salePrice,
            timestamp: block.timestamp,
            completed: false
        });
        
        propertySales[saleCounter] = newSale;
        
        // Transfer the payment to the seller
        payable(property.owner).transfer(msg.value);
        
        // Record the transaction
        transactionCounter++;
        Transaction memory newTransaction = Transaction({
            id: transactionCounter,
            leaseId: 0, // Not related to a lease
            from: msg.sender,
            to: property.owner,
            amount: msg.value,
            transactionType: "PROPERTY_SALE",
            timestamp: block.timestamp
        });
        
        // Store the transaction under a dummy lease ID that represents property sales
        leaseTransactions[_propertyId].push(newTransaction);
        
        emit PropertySaleInitiated(saleCounter, _propertyId, property.owner, msg.sender, property.salePrice);
        
        // Complete the property transfer
        _completePropertyTransfer(_propertyId, property.owner, msg.sender, saleCounter);
    }
    
    // Internal function to complete property transfer
    function _completePropertyTransfer(
        uint256 _propertyId, 
        address _previousOwner, 
        address _newOwner,
        uint256 _saleId
    ) internal {
        // Update property ownership
        properties[_propertyId].owner = _newOwner;
        properties[_propertyId].isForSale = false;
        properties[_propertyId].salePrice = 0;
        
        // Remove from previous owner's list and add to new owner's list
        uint256[] storage previousOwnerProperties = ownerProperties[_previousOwner];
        uint256[] storage newOwnerProperties = ownerProperties[_newOwner];
        
        // Find and remove from previous owner
        for (uint i = 0; i < previousOwnerProperties.length; i++) {
            if (previousOwnerProperties[i] == _propertyId) {
                // Replace with the last element and pop
                previousOwnerProperties[i] = previousOwnerProperties[previousOwnerProperties.length - 1];
                previousOwnerProperties.pop();
                break;
            }
        }
        
        // Add to new owner
        newOwnerProperties.push(_propertyId);
        
        // Record transfer in history
        propertyTransferHistory[_propertyId].push(_saleId);
        
        // Mark sale as completed
        propertySales[_saleId].completed = true;
        
        emit PropertySaleCompleted(_saleId, _propertyId, _newOwner);
    }
    
    // NEW: Function to get properties for sale
    function getPropertiesForSale() external view returns (uint256[] memory) {
        uint256 count = 0;
        
        // First, count properties for sale
        for (uint i = 1; i <= propertyCounter; i++) {
            if (properties[i].isForSale) {
                count++;
            }
        }
        
        // Create array of correct size
        uint256[] memory forSaleProperties = new uint256[](count);
        uint256 index = 0;
        
        // Populate array with property IDs
        for (uint i = 1; i <= propertyCounter; i++) {
            if (properties[i].isForSale) {
                forSaleProperties[index] = i;
                index++;
            }
        }
        
        return forSaleProperties;
    }
    
    // NEW: Function to get property transfer history
    function getPropertyTransferHistory(uint256 _propertyId) external view returns (uint256[] memory) {
        return propertyTransferHistory[_propertyId];
    }
    
    // NEW: Function to get property sale details
    function getPropertySale(uint256 _saleId) external view returns (PropertySale memory) {
        return propertySales[_saleId];
    }
    

    // Getter functions
    function getPropertyById(uint256 _propertyId) external view returns (Property memory) {
        return properties[_propertyId];
    }
    
    function getOwnerProperties(address _owner) external view returns (uint256[] memory) {
        return ownerProperties[_owner];
    }
    
    function getLeaseById(uint256 _leaseId) external view returns (LeaseAgreement memory) {
        return leaseAgreements[_leaseId];
    }
    
    function getTenantLeases(address _tenant) external view returns (uint256[] memory) {
        return tenantLeases[_tenant];
    }
    
    function getLandlordLeases(address _landlord) external view returns (uint256[] memory) {
        return landlordLeases[_landlord];
    }
    
    function getLeaseTransactions(uint256 _leaseId) external view onlyLandlordOrTenant(_leaseId) returns (Transaction[] memory) {
        return leaseTransactions[_leaseId];
    }

    // Function to start an auction for a property
    function startAuction(
        uint256 _propertyId,
        uint256 _startingPrice,
        uint256 _durationInSeconds
    ) external onlyPropertyOwner(_propertyId) onlyApprovedProperty(_propertyId) {
        Property storage property = properties[_propertyId];
        require(property.isActive, "Property is not active");
        require(!property.onAuction, "Property is already on auction");
        require(!property.isForSale, "Property is already listed for sale");
        require(_startingPrice > 0, "Starting price must be greater than 0");
        require(_durationInSeconds >= 1 hours, "Auction duration must be at least 1 hour");
        require(_durationInSeconds <= 30 days, "Auction duration cannot exceed 30 days");

        property.onAuction = true;
        property.auctionEndTime = block.timestamp + _durationInSeconds;
        property.highestBid = _startingPrice;
        property.highestBidder = address(0);
        property.auctionEnded = false;

        auctions[_propertyId] = Auction({
            propertyId: _propertyId,
            startingPrice: _startingPrice,
            highestBid: _startingPrice,
            highestBidder: address(0),
            auctionEndTime: block.timestamp + _durationInSeconds,
            ended: false,
            exists: true
        });

        emit AuctionStarted(_propertyId, _startingPrice, _durationInSeconds);
    }

    // Function to place a bid on a property
    function placeBid(uint256 _propertyId) external payable nonReentrant {
        Property storage property = properties[_propertyId];
        require(property.onAuction, "Property is not on auction");
        require(block.timestamp < property.auctionEndTime, "Auction already ended");
        require(msg.value > property.highestBid, "Bid must be higher than current highest bid");
        require(msg.sender != property.owner, "Owner cannot bid on their own property");

        // If there was a previous bid, add it to pending returns
        if (property.highestBidder != address(0)) {
            pendingReturns[_propertyId][property.highestBidder] += property.highestBid;
        }

        property.highestBidder = msg.sender;
        property.highestBid = msg.value;

        // Update auction details
        Auction storage auction = auctions[_propertyId];
        auction.highestBidder = msg.sender;
        auction.highestBid = msg.value;

        emit BidPlaced(_propertyId, msg.sender, msg.value);
    }

    // Function to withdraw a bid that was outbid
    function withdrawBid(uint256 _propertyId) external nonReentrant {
        uint256 amount = pendingReturns[_propertyId][msg.sender];
        require(amount > 0, "No funds to withdraw");

        pendingReturns[_propertyId][msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");

        emit BidWithdrawn(_propertyId, msg.sender, amount);
    }

    // Function to end an auction (can be ended early by owner)
    function endAuction(uint256 _propertyId) external nonReentrant {
        Property storage property = properties[_propertyId];
        Auction storage auction = auctions[_propertyId];
        
        require(property.onAuction, "No active auction");
        require(!property.auctionEnded, "Auction already ended");
        
        // Allow owner to end early, others must wait for auction end time
        if (msg.sender != property.owner) {
            require(block.timestamp >= property.auctionEndTime, "Auction still in progress");
            require(msg.sender == property.highestBidder, "Only owner or highest bidder can end auction");
        }

        property.auctionEnded = true;
        property.onAuction = false;
        auction.ended = true;

        if (property.highestBidder != address(0)) {
            // Transfer ownership
            address previousOwner = property.owner;
            property.owner = property.highestBidder;

            // Remove property from previous owner's list
            uint256[] storage previousOwnerProperties = ownerProperties[previousOwner];
            for (uint256 i = 0; i < previousOwnerProperties.length; i++) {
                if (previousOwnerProperties[i] == _propertyId) {
                    previousOwnerProperties[i] = previousOwnerProperties[previousOwnerProperties.length - 1];
                    previousOwnerProperties.pop();
                    break;
                }
            }

            // Add property to new owner's list
            ownerProperties[property.highestBidder].push(_propertyId);

            // Transfer the highest bid to the previous owner
            (bool success, ) = payable(previousOwner).call{value: property.highestBid}("");
            require(success, "Transfer to previous owner failed");

            emit AuctionEnded(_propertyId, property.highestBidder, property.highestBid);
        } else {
            emit AuctionEnded(_propertyId, address(0), 0);
        }
    }

    // Function to cancel an auction (only owner, refunds all bidders)
    function cancelAuction(uint256 _propertyId) external nonReentrant {
        Property storage property = properties[_propertyId];
        Auction storage auction = auctions[_propertyId];
        
        require(property.onAuction, "No active auction");
        require(!property.auctionEnded, "Auction already ended");
        require(msg.sender == property.owner, "Only property owner can cancel auction");
        
        // Mark auction as ended/cancelled
        property.auctionEnded = true;
        property.onAuction = false;
        auction.ended = true;
        
        uint256 totalRefunded = 0;
        
        // Refund the highest bidder if there is one
        if (property.highestBidder != address(0)) {
            uint256 highestBidAmount = property.highestBid;
            address highestBidderAddress = property.highestBidder;
            
            // Clear the highest bid first to prevent reentrancy
            property.highestBidder = address(0);
            property.highestBid = 0;
            auction.highestBidder = address(0);
            auction.highestBid = 0;
            
            // Refund the highest bidder
            (bool success, ) = payable(highestBidderAddress).call{value: highestBidAmount}("");
            require(success, "Failed to refund highest bidder");
            
            totalRefunded += highestBidAmount;
        }
        
        // Reset property auction state
        property.auctionEndTime = 0;
        
        emit AuctionCancelled(_propertyId, totalRefunded);
    }

    // View function to get auction details
    function getAuctionDetails(uint256 _propertyId) external view returns (
        bool onAuction,
        uint256 auctionEndTime,
        address highestBidder,
        uint256 highestBid,
        bool ended
    ) {
        Property memory property = properties[_propertyId];
        return (
            property.onAuction,
            property.auctionEndTime,
            property.highestBidder,
            property.highestBid,
            property.auctionEnded
        );
    }

    // View function to get pending returns for a bidder
    function getPendingReturn(uint256 _propertyId, address _bidder) external view returns (uint256) {
        return pendingReturns[_propertyId][_bidder];
    }

    // Function to get a range of properties
    function getProperties(uint256 start, uint256 end) external view returns (Property[] memory) {
        require(start <= end, "Invalid range");
        require(end <= propertyCounter, "End index out of bounds");
        
        uint256 size = end - start + 1;
        Property[] memory result = new Property[](size);
        
        for (uint256 i = 0; i < size; i++) {
            result[i] = properties[start + i];
        }
        
        return result;
    }

    // Function for notary to approve property
    function approveProperty(uint256 _propertyId) external onlyNotary {
        require(_propertyId > 0 && _propertyId <= propertyCounter, "Invalid property ID");
        Property storage property = properties[_propertyId];
        require(!property.isApproved, "Property already approved");
        
        property.isApproved = true;
        property.isActive = true;
        propertyApprovals[_propertyId] = true;
        
        emit PropertyApproved(_propertyId, msg.sender);
    }

    // Function for notary to reject property
    function rejectProperty(uint256 _propertyId) external onlyNotary {
        require(_propertyId > 0 && _propertyId <= propertyCounter, "Invalid property ID");
        Property storage property = properties[_propertyId];
        require(!property.isApproved, "Property already approved");
        
        // Remove property from owner's list
        uint256[] storage ownerProps = ownerProperties[property.owner];
        for (uint i = 0; i < ownerProps.length; i++) {
            if (ownerProps[i] == _propertyId) {
                ownerProps[i] = ownerProps[ownerProps.length - 1];
                ownerProps.pop();
                break;
            }
        }
        
        delete properties[_propertyId];
        propertyCounter--;
        
        emit PropertyRejected(_propertyId, msg.sender);
    }

    // Function to get pending properties for notary approval
    function getPendingProperties() external view returns (uint256[] memory) {
        uint256 pendingCount = 0;
        
        // First count pending properties
        for (uint256 i = 1; i <= propertyCounter; i++) {
            if (!properties[i].isApproved && properties[i].owner != address(0)) {
                pendingCount++;
            }
        }
        
        // Create array of correct size
        uint256[] memory pendingProperties = new uint256[](pendingCount);
        uint256 index = 0;
        
        // Fill array with pending property IDs
        for (uint256 i = 1; i <= propertyCounter; i++) {
            if (!properties[i].isApproved && properties[i].owner != address(0)) {
                pendingProperties[index] = i;
                index++;
            }
        }
        
        return pendingProperties;
    }

    // Modify existing property-related functions to check for approval
    modifier onlyApprovedProperty(uint256 _propertyId) {
        require(properties[_propertyId].isApproved, "Property not approved by notary");
        _;
    }
}