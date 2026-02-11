# 🏗️ Smart Property Management DApp

A decentralized Smart Property Management System built on Ethereum to improve transparency, security, and efficiency in property transactions.

This platform integrates **blockchain-based smart contracts**, **notary validation workflows**, and **decentralized document storage (IPFS)** to modernize traditional property management processes.

---

## 🚀 Overview

Traditional property management systems rely on centralized authorities, making records vulnerable to tampering, fraud, and administrative delays.

This project introduces a blockchain-based solution where:

- Property transactions are recorded on-chain
- Notaries act as validators before property activation
- Ownership history is immutable and auditable
- Leases and auctions are automated via smart contracts
- Property documents are securely stored on IPFS

---

## ✨ Key Features

### 🏠 Property Registration with Notary Approval
- Users submit property details and supporting documents
- Properties are marked **Pending** until reviewed
- Notaries approve or reject submissions
- Only approved properties become active on the platform

### 📜 Lease Management
- Landlords create lease agreements on-chain
- Lease status tracking (active / terminated)
- Transparent record of agreements

### 🔁 Auctions & Ownership Transfer
- Property owners can initiate auctions
- Users place bids directly through the interface
- Automatic transfer of ownership to highest bidder
- Refund mechanism for outbid participants

### 📂 Ownership History
- Transparent and immutable ownership records
- Full audit trail accessible through the interface

### 🔐 Decentralized Document Storage
- Property documents stored on **IPFS (via Pinata)**
- Tamper-proof and secure file handling

---

## 🏗️ System Architecture

The system consists of:

- **Smart Contracts (Solidity)** – Business logic for property registration, leasing, auctions, and notary validation
- **Blockchain Network (Ethereum)** – Immutable ledger for transactions
- **Web Interface (Web3 Integration)** – User and notary dashboards
- **IPFS (Pinata)** – Decentralized storage for property documents

---

## 🛠️ Tech Stack

- **Solidity**
- **Truffle**
- **Ganache**
- **Web3.js**
- **IPFS (Pinata)**
- **Next.js / Web-based frontend**

---

## 🖥️ Screenshots

### Main Dashboard
After logging in, users are presented with a uni ed dashboard that acts as the central point
for all system activities. The dashboard provides access to modules for property manage
ment, lease agreements, and property auctions, with a user-friendly interface tailored for
both property owners and notaries

<img width="641" height="364" alt="image" src="https://github.com/user-attachments/assets/f12c8351-e1b8-4fd4-b7e3-c94f4e138a29" />

###  Property Registration and Notary Validation
To register a property, users complete a detailed form and upload supporting documents.
The system transparently displays the required blockchain network fee before submission.

<img width="518" height="368" alt="image" src="https://github.com/user-attachments/assets/e27c601b-f7c4-41bb-a361-c128d2b028ed" />

<img width="532" height="354" alt="image" src="https://github.com/user-attachments/assets/b2829be1-191d-4e26-8223-868f1b5e0c14" />

Once submitted, properties appear in the user's property list with a status indicator
(pending, approved, or rejected). Only after notary approval does a property become
active.
<img width="705" height="248" alt="image" src="https://github.com/user-attachments/assets/e00b44c8-bef7-4210-abda-409c58a323d2" />

Notaries access a dedicated dashboard to review and validate pending property regis
trations, ensuring only legitimate properties are recorded on the blockchain.

<img width="658" height="245" alt="image" src="https://github.com/user-attachments/assets/51b0552a-caf4-4394-aadf-64488fccb43a" />

### Property Information and Ownership History
Users can view detailed information about each property, including its characteristics and
documentation.
<img width="553" height="293" alt="image" src="https://github.com/user-attachments/assets/284ff821-1f76-4ba8-8824-342c47132199" />

The system also maintains a transparent ownership history for every property, acces
sible to authorized users. Both the current and original ownership records are available
for audit and veri cation.
<img width="543" height="407" alt="image" src="https://github.com/user-attachments/assets/b08b6132-67be-459c-a749-88e56fd16f22" />
<img width="383" height="289" alt="image" src="https://github.com/user-attachments/assets/3e219a11-1f87-4b23-be38-84a580175a42" />

### Lease Management
Landlords can initiate new lease agreements through a guided form. The system displays
the required network fee before submission.
<img width="485" height="346" alt="image" src="https://github.com/user-attachments/assets/1b11ff12-a075-4ced-9520-ecd67eea2de9" />
<img width="587" height="417" alt="image" src="https://github.com/user-attachments/assets/f9a253a4-ca10-48e3-9372-bd79e58ed85b" />

If a landlord has no properties available for leasing, the system noti es them accordingly.
<img width="585" height="214" alt="image" src="https://github.com/user-attachments/assets/abce8865-458d-407a-9be7-73056ad28339" />

Landlords and tenants can view their active and historical leases. Landlords can also terminate leases, with the interface updating to re ect the change.
<img width="560" height="204" alt="image" src="https://github.com/user-attachments/assets/155d1bdb-0f8f-49d5-b0e1-317a251dc941" />
<img width="575" height="223" alt="image" src="https://github.com/user-attachments/assets/095f7f27-202a-4d95-bd56-abfaae9694cb" />
<img width="538" height="406" alt="image" src="https://github.com/user-attachments/assets/8b41cc67-fc9f-4a3a-bbb2-e00ee27906de" />

### Auction Functionality
Property owners can initiate auctions for their properties by specifying parameters such as
the starting price and auction duration. The auction module provides real-time updates
on all ongoing auctions, allowing users to monitor activity and participate seamlessly.
<img width="475" height="200" alt="image" src="https://github.com/user-attachments/assets/1b38fc50-b6fa-4a53-a2a2-6bfbc1d92938" />
<img width="705" height="370" alt="image" src="https://github.com/user-attachments/assets/19e9d9f2-a8f5-42f4-be6e-33e009328747" />

Users can view their participation in auctions, including both active and completed events. The system maintains a comprehensive auction history for transparency and
record-keeping.
<img width="692" height="373" alt="image" src="https://github.com/user-attachments/assets/dd7ae5aa-0474-4b58-b983-e649b6f73613" />
<img width="686" height="266" alt="image" src="https://github.com/user-attachments/assets/a5c447cc-5375-4163-8b34-11d4b8738f34" />

Auction owners can cancel an auction before it concludes. When an auction ends,the system automatically transfers property ownership to the highest bidder, ensuring a
secure and transparent process.
<img width="478" height="305" alt="image" src="https://github.com/user-attachments/assets/460e4916-5873-436e-a343-2ccafecd52f8" />
<img width="476" height="273" alt="image" src="https://github.com/user-attachments/assets/a124283a-eef4-423f-b7d2-39009d409cc6" />

### Bid Management
Bidding is streamlined: users place bids directly from the auction interface. If a user is outbid, the system automatically refunds their previous bid. Users also have the option
to manually withdraw their bids at any time
<img width="456" height="220" alt="image" src="https://github.com/user-attachments/assets/a1470649-f3ee-4512-9dad-5ae53a1d850b" />
<img width="479" height="151" alt="image" src="https://github.com/user-attachments/assets/b7df7ead-ab18-439a-a676-8d4cc8de1830" />

### Decentralized Storage
All property documents are securely stored on IPFS, managed via Pinata. This ensures documents are tamper-proof and accessible only to authorized users.
<img width="470" height="151" alt="image" src="https://github.com/user-attachments/assets/90380f07-70b3-4e2d-9a7c-fff0e496d198" />

---

## 🎥 Demo

https://tinyurl.com/yvy4ah3x

---

## 📈 Future Enhancements

- Notification system (lease expiration, approvals)
- NFT-based tokenization of properties
- Multi-blockchain compatibility
- Advanced analytics dashboard
- Enhanced notary audit features

