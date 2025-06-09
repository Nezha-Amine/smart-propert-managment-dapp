const PropertyManagement = artifacts.require("PropertyManagement");
const { BN, time } = require('@openzeppelin/test-helpers');

contract("PropertyManagement", accounts => {
  const owner = accounts[0];
  const tenant = accounts[1];
  
  let propertyManagement;
  let propertyId;
  let leaseId;
  
  before(async () => {
    propertyManagement = await PropertyManagement.deployed();
  });
  
  describe("Property Registration", () => {
    it("should register a new property", async () => {
      const result = await propertyManagement.registerProperty(
        "123 Main St, Anytown USA", 
        1500, // size in sq ft
        "Apartment",
        { from: owner }
      );
      
      propertyId = result.logs[0].args.propertyId.toNumber();
      
      assert.isTrue(propertyId > 0, "Property ID should be greater than 0");
      
      const property = await propertyManagement.getPropertyById(propertyId);
      assert.equal(property.owner, owner, "Property owner should be the sender");
      assert.equal(property.propertyAddress, "123 Main St, Anytown USA", "Property address should match");
      assert.equal(property.size, 1500, "Property size should match");
      assert.equal(property.propertyType, "Apartment", "Property type should match");
      assert.isTrue(property.isActive, "Property should be active");
    });
    
    it("should list owner's properties", async () => {
      const properties = await propertyManagement.getOwnerProperties(owner);
      assert.equal(properties.length, 1, "Owner should have 1 property");
      assert.equal(properties[0].toNumber(), propertyId, "Property ID should match");
    });
  });
  
  describe("Lease Agreement", () => {
    it("should create a lease agreement", async () => {
      const now = Math.floor(Date.now() / 1000);
      const oneYearFromNow = now + 31536000; // One year in seconds
      
      const monthlyRent = web3.utils.toWei("0.1", "ether"); // 0.1 ETH
      const securityDeposit = web3.utils.toWei("0.3", "ether"); // 0.3 ETH
      
      const result = await propertyManagement.createLeaseAgreement(
        propertyId,
        tenant,
        monthlyRent,
        securityDeposit,
        now,
        oneYearFromNow,
        { from: owner }
      );
      
      leaseId = result.logs[0].args.leaseId.toNumber();
      
      assert.isTrue(leaseId > 0, "Lease ID should be greater than 0");
      
      const lease = await propertyManagement.getLeaseById(leaseId);
      assert.equal(lease.propertyId, propertyId, "Property ID should match");
      assert.equal(lease.landlord, owner, "Landlord should be the owner");
      assert.equal(lease.tenant, tenant, "Tenant should match");
      assert.equal(lease.monthlyRent, monthlyRent, "Monthly rent should match");
      assert.equal(lease.securityDeposit, securityDeposit, "Security deposit should match");
      assert.isTrue(lease.isActive, "Lease should be active");
    });
    
    it("should list tenant's leases", async () => {
      const leases = await propertyManagement.getTenantLeases(tenant);
      assert.equal(leases.length, 1, "Tenant should have 1 lease");
      assert.equal(leases[0].toNumber(), leaseId, "Lease ID should match");
    });
    
    it("should list landlord's leases", async () => {
      const leases = await propertyManagement.getLandlordLeases(owner);
      assert.equal(leases.length, 1, "Landlord should have 1 lease");
      assert.equal(leases[0].toNumber(), leaseId, "Lease ID should match");
    });
  });
  
  describe("Payments", () => {
    it("should allow tenant to pay security deposit", async () => {
      const lease = await propertyManagement.getLeaseById(leaseId);
      const securityDeposit = lease.securityDeposit;
      
      const initialLandlordBalance = await web3.eth.getBalance(owner);
      
      await propertyManagement.makePayment(
        leaseId,
        "SECURITY_DEPOSIT",
        { from: tenant, value: securityDeposit }
      );
      
      const finalLandlordBalance = await web3.eth.getBalance(owner);
      
      // Check that landlord received the security deposit
      assert.isTrue(
        new BN(finalLandlordBalance).gt(new BN(initialLandlordBalance)),
        "Landlord balance should increase"
      );
      
      // Check transaction was recorded
      const transactions = await propertyManagement.getLeaseTransactions(leaseId, { from: tenant });
      assert.equal(transactions.length, 1, "There should be 1 transaction");
      assert.equal(transactions[0].transactionType, "SECURITY_DEPOSIT", "Transaction type should be SECURITY_DEPOSIT");
    });
    
    it("should allow tenant to pay rent", async () => {
      const lease = await propertyManagement.getLeaseById(leaseId);
      const monthlyRent = lease.monthlyRent;
      
      const initialLandlordBalance = await web3.eth.getBalance(owner);
      
      await propertyManagement.makePayment(
        leaseId,
        "RENT",
        { from: tenant, value: monthlyRent }
      );
      
      const finalLandlordBalance = await web3.eth.getBalance(owner);
      
      // Check that landlord received the rent
      assert.isTrue(
        new BN(finalLandlordBalance).gt(new BN(initialLandlordBalance)),
        "Landlord balance should increase"
      );
      
      // Check transaction was recorded
      const transactions = await propertyManagement.getLeaseTransactions(leaseId, { from: tenant });
      assert.equal(transactions.length, 2, "There should be 2 transactions");
      assert.equal(transactions[1].transactionType, "RENT", "Transaction type should be RENT");
    });
  });
  
  describe("Lease Termination", () => {
    it("should allow landlord to terminate lease", async () => {
      await propertyManagement.terminateLease(leaseId, { from: owner });
      
      const lease = await propertyManagement.getLeaseById(leaseId);
      assert.isFalse(lease.isActive, "Lease should be inactive");
    });
    
    it("should not allow non-owner to terminate lease", async () => {
      try {
        // Try to register a new property first
        const propertyResult = await propertyManagement.registerProperty(
          "456 Second St, Anytown USA", 
          2000, 
          "House",
          { from: tenant }
        );
        
        const newPropertyId = propertyResult.logs[0].args.propertyId.toNumber();
        
        // Create a lease for the new property
        const now = Math.floor(Date.now() / 1000);
        const oneYearFromNow = now + 31536000;
        
        const leaseResult = await propertyManagement.createLeaseAgreement(
          newPropertyId,
          owner, // owner becomes tenant
          web3.utils.toWei("0.2", "ether"),
          web3.utils.toWei("0.4", "ether"),
          now,
          oneYearFromNow,
          { from: tenant }
        );
        
        const newLeaseId = leaseResult.logs[0].args.leaseId.toNumber();
        
        // Owner should not be able to terminate this lease
        await propertyManagement.terminateLease(newLeaseId, { from: owner });
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert.include(error.message, "Not the property owner", "Expected 'Not the property owner' error");
      }
    });
  });
});