import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { 
  Shield, Fish, Truck, ShoppingBag, Search, UserCheck, 
  Layers, Package, MapPin, Calendar, CheckCircle2, XCircle, 
  Clock, ArrowRight, Info, AlertCircle, HelpCircle, Users
} from 'lucide-react';

// Replace with your compiled address from Remix
const CONTRACT_ADDRESS = "0x2ef4d23039aE67e04B4C2C741D5d0f371c45C9Ab";
const CONTRACT_ABI = [
  "function registerParticipant(string name, string location, uint8 role) external",
  "function participants(address) external view returns (string name, string businessLocation, uint8 role, bool isRegistered)",
  "function registerBatch(string _type, string _harvestDate, string _pondOrigin, uint256 _quantity) external",
  "function transferOwnership(uint256 _batchId, address _newOwner) external",
  "function startTransit(uint256 _batchId) external",
  "function confirmDelivery(uint256 _batchId, bool _accept) external",
  "function batches(uint256) external view returns (uint256 id, string crayfishType, string harvestDate, string pondOrigin, uint256 quantity, address currentOwner, address currentTransporter, uint8 status, uint256 timestamp)",
  "function getBatchHistory(uint256 _batchId) external view returns (tuple(address actor, uint8 status, uint256 timestamp, string notes)[])",
  "function batchCounter() external view returns (uint256)"
];

// Aligned with Section IV, VI, and VIII Target Profiles & Stakeholders
const ROLE_MAP = ["Guest / Visitor", "Crayfish Farmer", "Distributor", "Transporter", "Vendor/Restaurant"];
// Aligned with Section VI Features and Section IX Workflow States
const STATUS_MAP = ["Created", "In Transit", "Delivered", "Rejected"];

export default function App() {
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('trace'); // Defaults to public search engine
  const [loading, setLoading] = useState(false);
  const [network, setNetwork] = useState(null); // { name, chainId, isSepolia }
  
  // Node Registration Inputs
  const [regName, setRegName] = useState('');
  const [regLocation, setRegLocation] = useState('');
  const [regRole, setRegRole] = useState(1);

  // Farmer Initialization Inputs
  const [crayfishType, setCrayfishType] = useState('');
  const [harvestDate, setHarvestDate] = useState('');
  const [pondOrigin, setPondOrigin] = useState('');
  const [quantity, setQuantity] = useState('');

  // Transfer Custody Inputs
  const [targetBatchId, setTargetBatchId] = useState('');
  const [targetReceiver, setTargetReceiver] = useState('');

  // Transporter Inputs
  const [transitId, setTransitId] = useState('');

  // Vendor/Restaurant Intake Inputs
  const [vendorBatchId, setVendorBatchId] = useState('');

  // Trace Search Engine Inputs
  const [searchId, setSearchId] = useState('');
  const [searchedBatch, setSearchedBatch] = useState(null);
  const [searchedHistory, setSearchedHistory] = useState([]);

  useEffect(() => {
    connectWallet();
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        setAccount(accounts[0] || '');
        window.location.reload();
      });
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }
  }, []);

  const SEPOLIA_CHAIN_ID = 11155111;

  const getNetworkInfo = (chainId) => {
    const id = Number(chainId);
    const names = {
      1: 'Ethereum Mainnet',
      11155111: 'Sepolia Testnet',
      17000: 'Holesky Testnet',
      1337: 'Localhost',
    };
    return {
      chainId: id,
      name: names[id] || `Chain ID: ${id}`,
      isSepolia: id === SEPOLIA_CHAIN_ID,
    };
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        const provider = new ethers.BrowserProvider(window.ethereum);

        const net = await provider.getNetwork();
        const networkInfo = getNetworkInfo(net.chainId);
        setNetwork(networkInfo);

        // Auto-intercept connection if on wrong network to prevent queue blocking issues
        if (!networkInfo.isSepolia) {
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0xaa36a7' }],
            });
            return;
          } catch (switchErr) {
            console.error("Auto network switch intercepted/canceled", switchErr);
          }
        }

        const signer = await provider.getSigner();
        const aquaContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        setContract(aquaContract);

        const profile = await aquaContract.participants(accounts[0]);
        if (profile.isRegistered) {
          setMyProfile({
            name: profile.name,
            location: profile.businessLocation,
            role: Number(profile.role)
          });
        }
      } catch (err) {
        console.error("Metamask initialization handshake error", err);
      }
    }
  };

  const switchNetwork = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }], 
      });
    } catch (error) {
      console.error("Manual fallback network request rejected", error);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!contract) return alert("Connect your MetaMask wallet extension first!");
    setLoading(true);
    try {
      const tx = await contract.registerParticipant(regName, regLocation, regRole);
      await tx.wait();
      alert("Success: Identity committed to blockchain registration index!");
      window.location.reload();
    } catch (err) { 
      alert("Transaction failed: " + (err.reason || err.message)); 
    } finally { setLoading(false); }
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    if (!contract) return;
    setLoading(true);
    try {
      const tx = await contract.registerBatch(crayfishType, harvestDate, pondOrigin, quantity);
      await tx.wait();
      
      // Proactive Look-up: Fetch the newest Batch ID from the contract counter variable
      const currentCounter = await contract.batchCounter();
      const generatedId = currentCounter.toString();

      alert(`Success: Unique Crayfish Batch ID #${generatedId} generated and status initialized to 'Created'!`);
      setCrayfishType(''); setHarvestDate(''); setPondOrigin(''); setQuantity('');
    } catch (err) { alert("Transaction failed: " + (err.reason || err.message)); }
    finally { setLoading(false); }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!contract) return;
    setLoading(true);
    try {
      const tx = await contract.transferOwnership(targetBatchId, targetReceiver);
      await tx.wait();
      alert("Success: Digital custody ownership transfer signatures recorded to next ledger node.");
      setTargetBatchId(''); setTargetReceiver('');
    } catch (err) { alert("Transaction failed: " + (err.reason || err.message)); }
    finally { setLoading(false); }
  };

  const handleTransit = async (e) => {
    e.preventDefault();
    if (!contract || !transitId) return;
    setLoading(true);
    try {
      const tx = await contract.startTransit(transitId);
      await tx.wait();
      alert("Success: Physical batch pickup verified. Status updated to 'In Transit'.");
      setTransitId('');
    } catch (err) { alert("Transaction failed: " + (err.reason || err.message)); }
    finally { setLoading(false); }
  };

  const handleDeliveryConfirm = async (accepted) => {
    if (!contract || !vendorBatchId) return;
    setLoading(true);
    try {
      const tx = await contract.confirmDelivery(vendorBatchId, accepted);
      await tx.wait();
      alert(`Batch processing successfully finalized on-chain as: ${accepted ? 'Delivered' : 'Rejected'}`);
      setVendorBatchId('');
    } catch (err) { alert("Transaction failed: " + (err.reason || err.message)); }
    finally { setLoading(false); }
  };

  const handleTraceSearch = async (e) => {
    e.preventDefault();
    if (!contract || !searchId) return;
    setLoading(true);
    try {
      const batchData = await contract.batches(searchId);
      if (batchData.crayfishType === "") {
        alert("Error: Product ID reference does not exist within this ledger instance.");
        setSearchedBatch(null);
        return;
      }
      setSearchedBatch({
        id: Number(batchData.id),
        type: batchData.crayfishType,
        harvestDate: batchData.harvestDate,
        origin: batchData.pondOrigin,
        quantity: Number(batchData.quantity),
        owner: batchData.currentOwner,
        status: Number(batchData.status)
      });
      const logs = await contract.getBatchHistory(searchId);
      setSearchedHistory(logs);
    } catch (err) { 
      console.error(err); 
      alert("Error gathering public tracing chain logs.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col antialiased font-sans">
      
      {/* Top Banner Navigation Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-md shadow-blue-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight block">AquaChain</span>
              <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase block -mt-1">Aquaculture Supply Chain Ledger</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {network && (
              <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border ${
                network.isSepolia ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-amber-400/10 border-amber-400/30 text-amber-400'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${network.isSepolia ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                {network.name}
              </div>
            )}
            <div className="text-right hidden sm:block">
              <span className="text-xs font-semibold block text-slate-200">{myProfile ? myProfile.name : "User Node:"}</span>
              <span className="text-[10px] font-bold block text-blue-400 uppercase tracking-wider">
                {myProfile ? ROLE_MAP[myProfile.role] : "Awaiting Authorization"}
              </span>
            </div>
            <div className="bg-slate-800 border border-slate-700/80 rounded-xl px-3 py-1.5 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${account ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              <span className="font-mono text-xs text-slate-300 max-w-[110px] truncate">{account ? account : "Disconnected"}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Network Verification Overlay Alert */}
      {network && !network.isSepolia && (
        <div className="bg-amber-400/10 border-b border-amber-400/20 px-4 py-3">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-500 text-xs font-semibold">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>Wrong network detected: <span className="font-bold">{network.name}</span>. Transactions require local context alignment. Please switch to Sepolia.</span>
            </div>
            <button onClick={switchNetwork} className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 rounded-lg font-bold transition shadow-md">
              Force Switch to Sepolia
            </button>
          </div>
        </div>
      )}

      {/* Main Responsive Grid Layout Module */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 flex-grow grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Hand Navigation Panel: Structured perfectly with Section IV Framework Path */}
        <aside className="lg:col-span-3 flex flex-col gap-1.5">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-2">System Infrastructure</p>
          
          <button onClick={() => setActiveTab('register')} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between transition-all ${activeTab === 'register' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-600 hover:bg-slate-200/60'}`}>
            <span className="flex items-center gap-3"><UserCheck className="w-4 h-4" /> Node Enrollment</span>
            <ArrowRight className={`w-3.5 h-3.5 opacity-60 ${activeTab === 'register' ? 'block' : 'hidden'}`} />
          </button>
          
          <div className="my-2 border-t border-slate-200" />
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-2">Core Supply Chain Steps</p>

          <button onClick={() => setActiveTab('farmer')} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between transition-all ${activeTab === 'farmer' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200/60'}`}>
            <span className="flex items-center gap-3"><Fish className="w-4 h-4" /> 1. Crayfish Farmer Panel</span>
            <ArrowRight className={`w-3.5 h-3.5 opacity-60 ${activeTab === 'farmer' ? 'block' : 'hidden'}`} />
          </button>

          <button onClick={() => setActiveTab('distributor')} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between transition-all ${activeTab === 'distributor' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200/60'}`}>
            <span className="flex items-center gap-3"><Users className="w-4 h-4" /> 2. Distributor Panel</span>
            <ArrowRight className={`w-3.5 h-3.5 opacity-60 ${activeTab === 'distributor' ? 'block' : 'hidden'}`} />
          </button>
          
          <button onClick={() => setActiveTab('logistics')} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between transition-all ${activeTab === 'logistics' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200/60'}`}>
            <span className="flex items-center gap-3"><Truck className="w-4 h-4" /> 3. Transporter Panel</span>
            <ArrowRight className={`w-3.5 h-3.5 opacity-60 ${activeTab === 'logistics' ? 'block' : 'hidden'}`} />
          </button>
          
          <button onClick={() => setActiveTab('vendor')} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between transition-all ${activeTab === 'vendor' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200/60'}`}>
            <span className="flex items-center gap-3"><ShoppingBag className="w-4 h-4" /> 4. Vendor / Restaurant Panel</span>
            <ArrowRight className={`w-3.5 h-3.5 opacity-60 ${activeTab === 'vendor' ? 'block' : 'hidden'}`} />
          </button>

          <div className="my-2 border-t border-slate-200" />
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-2">Public Audits</p>

          <button onClick={() => setActiveTab('trace')} className={`w-full text-left px-4 py-3.5 rounded-xl text-sm font-bold flex items-center gap-3 transition-all ${activeTab === 'trace' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-700 bg-slate-200/60 hover:bg-slate-200'}`}>
            <Search className="w-4 h-4 text-blue-500" /> Traceability Search Engine
          </button>
        </aside>

        {/* Right Hand Dynamic Working Canvas Display Area */}
        <main className="lg:col-span-9 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs relative">
          
          {loading && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center z-40">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm font-semibold text-slate-700">Awaiting block confirmation seal...</p>
            </div>
          )}

          {/* VIEW: Node Enrollment Form */}
          {activeTab === 'register' && (
            <div className="max-w-xl animate-fadeIn">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Eco System Node Enrollment</h2>
              <p className="text-sm text-slate-500 mt-1 mb-6">Link your specific cryptographic public key coordinates onto the global decentralized stakeholder roster map.</p>
              
              {myProfile ? (
                <div className="bg-emerald-50 border border-emerald-200/60 rounded-2xl p-5 flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-emerald-900 text-md">Wallet Authorized and Synced</h3>
                    <p className="text-sm text-emerald-700 mt-1">This node address is mapped to the business asset register profile details below:</p>
                    <div className="mt-3 space-y-1 text-xs text-emerald-800 font-mono">
                      <p><strong>Entity Name:</strong> {myProfile.name}</p>
                      <p><strong>Hub Coordinates:</strong> {myProfile.location}</p>
                      <p><strong>Mandate Authority:</strong> {ROLE_MAP[myProfile.role]}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleRegister} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Business / Legal Corporate Entity Title</label>
                    <input type="text" placeholder="e.g. Small-to-medium farm name" className="w-full border border-slate-200 bg-slate-50 p-3 rounded-xl text-sm" value={regName} onChange={(e) => setRegName(e.target.value)} required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Physical Facility Location Address</label>
                    <input type="text" placeholder="e.g. Bulacan, Pampanga, or Iloilo" className="w-full border border-slate-200 bg-slate-50 p-3 rounded-xl text-sm" value={regLocation} onChange={(e) => setRegLocation(e.target.value)} required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Eco System Role Mandate Assignment</label>
                    <select className="w-full border border-slate-200 bg-slate-50 p-3 rounded-xl text-sm font-semibold text-slate-700" value={regRole} onChange={(e) => setRegRole(Number(e.target.value))}>
                      <option value={1}>Crayfish Farmer</option>
                      <option value={2}>Distributor</option>
                      <option value={3}>Transporter</option>
                      <option value={4}>Vendor/Restaurant</option>
                    </select>
                  </div>
                  <button type="submit" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl text-sm transition shadow-md">
                    Sign Registry Parameters to Ledger
                  </button>
                </form>
              )}
            </div>
          )}

          {/* VIEW: Farmer Workflow Interface */}
          {activeTab === 'farmer' && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">Crayfish Batch Registration Panel</h2>
                <p className="text-sm text-slate-500 mt-1 mb-6">Initialize tracking metrics for fresh harvests to produce an immutable batch look-up identity token.</p>
                
                <form onSubmit={handleCreateBatch} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Crayfish Type</label>
                    <input type="text" placeholder="e.g. Live Crayfish, Frozen Crayfish, Processed Seafood" className="w-full border border-slate-200 bg-slate-50 p-3 rounded-xl text-sm" value={crayfishType} onChange={(e) => setCrayfishType(e.target.value)} required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Harvest Date</label>
                    <input type="date" className="w-full border border-slate-200 bg-slate-50 p-3 rounded-xl text-sm text-slate-600" value={harvestDate} onChange={(e) => setHarvestDate(e.target.value)} required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Pond/Farm Origin</label>
                    <input type="text" placeholder="e.g. Sector 3 Cultivation Pen" className="w-full border border-slate-200 bg-slate-50 p-3 rounded-xl text-sm" value={pondOrigin} onChange={(e) => setPondOrigin(e.target.value)} required />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Quantity (Kilograms)</label>
                    <input type="number" placeholder="Volume net weight mass..." className="w-full border border-slate-200 bg-slate-50 p-3 rounded-xl text-sm" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
                  </div>
                  <div className="sm:col-span-2 pt-2">
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl text-sm transition">
                      Mint Batch Record Registry (State: 'Created')
                    </button>
                  </div>
                </form>
              </div>

              <div className="pt-8 border-t border-slate-200">
                <h3 className="text-xl font-bold tracking-tight text-slate-900">Ownership Transfer Authorization</h3>
                <p className="text-sm text-slate-500 mt-1 mb-6">Authorize digital chain of custody movement records downstream to clear an asset transaction loop.</p>
                
                <form onSubmit={handleTransfer} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Target Batch ID</label>
                    <input type="number" placeholder="Index #" className="w-full border border-slate-200 bg-slate-50 p-3 rounded-xl text-sm" value={targetBatchId} onChange={(e) => setTargetBatchId(e.target.value)} required />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Receiver / Distributor Wallet Address</label>
                    <input type="text" placeholder="0x... public key coordinates" className="w-full border border-slate-200 bg-slate-50 p-3 rounded-xl text-sm font-mono" value={targetReceiver} onChange={(e) => setTargetReceiver(e.target.value)} required />
                  </div>
                  <div className="sm:col-span-3">
                    <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-xl text-sm transition">
                      Trigger transferOwnership Handshake Call
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* VIEW: Distributor Framework Action Hub Panel */}
          {activeTab === 'distributor' && (
            <div className="max-w-xl animate-fadeIn">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Distributor Logistics Management</h2>
              <p className="text-sm text-slate-500 mt-1 mb-6">As an intermediate supplier node, review purchased batches and verify current ownership standing records on the network ledger layout.</p>
              
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-slate-500">
                <Users className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-700">Financial / Trade Clearing Hub</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  According to your proposal outline workflow, once the Farmer initiates <code>transferOwnership</code> to you, the batch ownership is locked to your node address before clearing physical transit distribution.
                </p>
              </div>
            </div>
          )}

          {/* VIEW: Transporter Shipment Workflow Panel */}
          {activeTab === 'logistics' && (
            <div className="max-w-xl animate-fadeIn">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Transporter Control Station</h2>
              <p className="text-sm text-slate-500 mt-1 mb-6">Acknowledge cold-chain logistical storage payload acquisition. Transition batch records into transit tracking modes.</p>
              
              <form onSubmit={handleTransit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Shipment Target Batch ID</label>
                  <input type="number" placeholder="Enter target product ID identifier parameter..." className="w-full border border-slate-200 bg-slate-50 p-3 rounded-xl text-sm" value={transitId} onChange={(e) => setTransitId(e.target.value)} required />
                </div>
                <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-6 rounded-xl text-sm transition">
                  Set Tracking State to 'In Transit'
                </button>
              </form>
            </div>
          )}

          {/* VIEW: Vendor / Restaurant Intake Validation Module Panel */}
          {activeTab === 'vendor' && (
            <div className="max-w-xl animate-fadeIn">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Vendor / Restaurant Intake Compliance</h2>
              <p className="text-sm text-slate-500 mt-1 mb-6">Perform arriving parameters assessment evaluation matching target freshness status criteria guidelines before terminating cycle loops.</p>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Intake Target Batch ID</label>
                  <input type="number" placeholder="Input tracking number parameter..." className="w-full border border-slate-200 bg-slate-50 p-3 rounded-xl text-sm" value={vendorBatchId} onChange={(e) => setVendorBatchId(e.target.value)} required />
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button onClick={() => handleDeliveryConfirm(true)} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-sm">
                    <CheckCircle2 className="w-4 h-4" /> Trigger confirmDelivery ('Delivered')
                  </button>
                  <button onClick={() => handleDeliveryConfirm(false)} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-sm">
                    <XCircle className="w-4 h-4" /> File Quality Defect ('Rejected')
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: Public Search Engine (Audit Features) */}
          {activeTab === 'trace' && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">Public Supply Chain Traceability Engine</h2>
                <p className="text-sm text-slate-500 mt-1 mb-6">Verify origin authenticity data metrics and structural handling transaction histories mined across public registries.</p>
                
                <form onSubmit={handleTraceSearch} className="flex flex-col sm:flex-row gap-3 max-w-lg">
                  <input type="number" placeholder="Enter Batch ID lookup index reference..." className="border border-slate-200 bg-slate-50 p-3 rounded-xl text-sm flex-grow font-medium" value={searchId} onChange={(e) => setSearchId(e.target.value)} required />
                  <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-3 rounded-xl text-sm transition flex items-center justify-center gap-2">
                    <Search className="w-4 h-4 text-blue-400" /> Pull On-Chain Record
                  </button>
                </form>
              </div>

              {searchedBatch ? (
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/40 animate-slideUp">
                  
                  <div className="p-6 bg-white border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 border border-blue-200 rounded-md">PRODUCT ID #{searchedBatch.id}</span>
                        <h3 className="font-bold text-lg text-slate-900">{searchedBatch.type}</h3>
                      </div>
                      <p className="text-xs font-mono text-slate-400 mt-1 truncate max-w-md">Current Owner Key: {searchedBatch.owner}</p>
                    </div>
                    
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold tracking-wide flex items-center gap-1.5 ${
                      searchedBatch.status === 2 ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' :
                      searchedBatch.status === 1 ? 'bg-amber-50 border border-amber-200 text-amber-800' :
                      searchedBatch.status === 3 ? 'bg-rose-50 border border-rose-200 text-rose-800' : 'bg-blue-50 border border-blue-200 text-blue-800'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        searchedBatch.status === 2 ? 'bg-emerald-500' : searchedBatch.status === 1 ? 'bg-amber-500' : searchedBatch.status === 3 ? 'bg-rose-500' : 'bg-blue-500'
                      }`} />
                      {STATUS_MAP[searchedBatch.status]}
                    </span>
                  </div>

                  <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6 bg-white">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-400"><Layers className="w-4 h-4" /></div>
                      <div><span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quantity</span><strong className="text-sm text-slate-800">{searchedBatch.quantity} kg</strong></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-400"><Calendar className="w-4 h-4" /></div>
                      <div><span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Harvest Date</span><strong className="text-sm text-slate-800">{searchedBatch.harvestDate}</strong></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-400"><MapPin className="w-4 h-4" /></div>
                      <div><span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pond/Farm Origin</span><strong className="text-sm text-slate-800 block truncate max-w-[110px]">{searchedBatch.origin}</strong></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-400"><Package className="w-4 h-4" /></div>
                      <div><span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ledger Engine</span><strong className="text-sm text-slate-800">AquaChain</strong></div>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-50/50 border-t border-slate-100">
                    <h4 className="text-xs font-bold uppercase text-slate-400 tracking-widest mb-5 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> Immutable Event Audit Trail
                    </h4>
                    
                    <div className="space-y-4 relative before:absolute before:inset-y-1 before:left-3.5 before:w-0.5 before:bg-slate-200">
                      {searchedHistory.map((log, index) => (
                        <div key={index} className="flex gap-4 items-start relative pl-8 animate-fadeIn">
                          <div className={`absolute left-1.5 top-1.5 w-4 h-4 rounded-full border-4 border-slate-50 flex items-center justify-center shadow-xs ${
                            Number(log.status) === 2 ? 'bg-emerald-500' : Number(log.status) === 3 ? 'bg-rose-500' : Number(log.status) === 1 ? 'bg-amber-500' : 'bg-blue-500'
                          }`}>
                            <div className="w-1 h-1 rounded-full bg-white" />
                          </div>
                          
                          <div className="bg-white border border-slate-200/60 p-4 rounded-xl shadow-xs flex-grow hover:border-slate-300 transition">
                            <span className="text-[10px] font-semibold text-slate-400 float-right bg-slate-100 px-2 py-0.5 rounded-md">Verified Block State Event</span>
                            <p className="font-bold text-sm text-slate-900">{log.notes}</p>
                            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 border-t border-slate-100 pt-2 font-mono">
                              <span className="truncate max-w-[180px] text-slate-500"><strong>Actor Coordinate:</strong> {log.actor}</span>
                              <span className="text-slate-200">|</span>
                              <span><strong>Shipment Status:</strong> {STATUS_MAP[Number(log.status)]}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              ) : (
                <div className="border border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400 max-w-lg mx-auto bg-slate-50/30">
                  <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-600">No Target Records Loaded</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">Input a unique numeric batch product reference code parameter in the explorer field above to verify tracking history ledger states.</p>
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* Blueprint Architecture Footer Block */}
      <footer className="bg-white border-t border-slate-200/60 mt-auto py-4 text-center text-xs font-medium text-slate-400">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p>© 2026 AquaChain Supply Chain Registries Engine.</p>
          <p className="font-mono text-[11px] bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-slate-500">Proposal Build Architecture: FRE403</p>
        </div>
      </footer>
    </div>
  );
}