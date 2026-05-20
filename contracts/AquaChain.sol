// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

contract AquaChain {
    
    enum Role { None, Farmer, Distributor, Transporter, Vendor }
    enum Status { Created, InTransit, Delivered, Rejected }

    struct Participant {
        string name;
        string businessLocation;
        Role role;
        bool isRegistered;
    }

    struct CrayfishBatch {
        uint256 id;
        string crayfishType;
        string harvestDate;
        string pondOrigin;
        uint256 quantity;
        address currentOwner;
        address currentTransporter;
        Status status;
        uint256 timestamp;
    }

    struct HistoryLog {
        address actor;
        Status status;
        uint256 timestamp;
        string notes;
    }

    uint256 public batchCounter;
    mapping(address => Participant) public participants;
    mapping(uint256 => CrayfishBatch) public batches;
    mapping(uint256 => HistoryLog[]) public batchHistory;

    event ParticipantRegistered(address indexed wallet, string name, Role role);
    event BatchCreated(uint256 indexed batchId, string crayfishType, address indexed farmer);
    event OwnershipTransferred(uint256 indexed batchId, address indexed previousOwner, address indexed newOwner);
    event StatusUpdated(uint256 indexed batchId, Status newStatus, address indexed updatedBy);

    modifier onlyRegistered() {
        require(participants[msg.sender].isRegistered, "AquaChain: You are not a registered participant.");
        _;
    }

    modifier onlyRole(Role _role) {
        require(participants[msg.sender].role == _role, "AquaChain: Unauthorized role access.");
        _;
    }

    modifier onlyOwner(uint256 _batchId) {
        require(batches[_batchId].currentOwner == msg.sender, "AquaChain: You do not own this batch.");
        _;
    }

    // --- Participant Registration ---
    function registerParticipant(string memory _name, string memory _location, Role _role) external {
        require(!participants[msg.sender].isRegistered, "Participant already registered.");
        require(_role != Role.None, "Invalid role assignment.");

        participants[msg.sender] = Participant(_name, _location, _role, true);
        emit ParticipantRegistered(msg.sender, _name, _role);
    }

    // --- 1. Farmer Action: Register Batch ---
    function registerBatch(
        string memory _type,
        string memory _harvestDate,
        string memory _pondOrigin,
        uint256 _quantity
    ) external onlyRole(Role.Farmer) {
        batchCounter++;
        
        batches[batchCounter] = CrayfishBatch({
            id: batchCounter,
            crayfishType: _type,
            harvestDate: _harvestDate,
            pondOrigin: _pondOrigin,
            quantity: _quantity,
            currentOwner: msg.sender,
            currentTransporter: address(0),
            status: Status.Created,
            timestamp: block.timestamp
        });

        _addHistory(batchCounter, Status.Created, "Batch harvested and registered into ledger.");
        emit BatchCreated(batchCounter, _type, msg.sender);
    }

    // --- 2. Owner Action: Transfer Ownership (Farmer -> Distributor or Distributor -> Vendor) ---
    function transferOwnership(uint256 _batchId, address _newOwner) external onlyOwner(_batchId) {
        require(participants[_newOwner].isRegistered, "Target destination wallet is unregistered.");
        address prevOwner = msg.sender;
        
        batches[_batchId].currentOwner = _newOwner;
        
        _addHistory(_batchId, batches[_batchId].status, string(abi.encodePacked("Ownership transferred to ", participants[_newOwner].name)));
        emit OwnershipTransferred(_batchId, prevOwner, _newOwner);
    }

    // --- 3. Transporter Action: Pick up Shipment (In Transit) ---
    function startTransit(uint256 _batchId) external onlyRole(Role.Transporter) {
        require(batches[_batchId].status == Status.Created, "Batch is not ready for transit.");
        
        batches[_batchId].status = Status.InTransit;
        batches[_batchId].currentTransporter = msg.sender;

        _addHistory(_batchId, Status.InTransit, "Shipment picked up. In transit to destination.");
        emit StatusUpdated(_batchId, Status.InTransit, msg.sender);
    }

    // --- 4. Vendor Action: Confirm Delivery ---
    function confirmDelivery(uint256 _batchId, bool _accept) external onlyOwner(_batchId) onlyRole(Role.Vendor) {
        require(batches[_batchId].status == Status.InTransit, "Batch is not currently in transit.");
        
        Status finalStatus = _accept ? Status.Delivered : Status.Rejected;
        batches[_batchId].status = finalStatus;

        string memory note = _accept ? "Delivery accepted by Vendor/Restaurant." : "Delivery rejected due to quality check failure.";
        _addHistory(_batchId, finalStatus, note);
        emit StatusUpdated(_batchId, finalStatus, msg.sender);
    }

    // --- Internal History Helper ---
    function _addHistory(uint256 _batchId, Status _status, string memory _notes) internal {
        batchHistory[_batchId].push(HistoryLog({
            actor: msg.sender,
            status: _status,
            timestamp: block.timestamp,
            notes: _notes
        }));
    }

    // --- Public Traceability Search ---
    function getBatchHistory(uint256 _batchId) external view returns (HistoryLog[] memory) {
        return batchHistory[_batchId];
    }
}