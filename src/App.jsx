import React, { useState } from 'react';

export default function App() {
  const [searchIndex, setSearchIndex] = useState('');
  const [activeTab, setActiveTab] = useState('Account Registration');
  const [recordFound, setRecordFound] = useState(false);
  const [searched, setSearched] = useState(false);

  // Hardcoded mockup data to simulate ledger queries
  const mockLedgerData = {
    "403": {
      origin: "Zone 7 - Pacific Deepwater Pen",
      farmer: "AquaCulture Pioneer Node #12",
      transit: "In Transit - Cold Chain Container Alpha",
      retailer: "Oceanic Bulk Distribution Center",
      hash: "0x4fbc7188a10d6a76bd505f2bff98ba3f34e98ef3aa71"
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearched(true);
    if (mockLedgerData[searchIndex]) {
      setRecordFound(true);
    } else {
      setRecordFound(false);
    }
  };

  const navModules = [
    "Account Registration",
    "Farmer Tracking Module",
    "Transit Operations",
    "Retail Vendor Intake"
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-900">
      
      {/* Top Banner / Navigation */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <span className="font-black text-slate-950 text-xs tracking-wider">AQ</span>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">AquaChain</h1>
              <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">Aquaculture Ledger Framework</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-400/10 text-amber-400 border border-amber-400/20 animate-pulse">
              FRE403 Local Context
            </span>
            <div className="text-right hidden sm:block">
              <p className="text-xs text-slate-400 font-mono">Profile Node: <span className="text-cyan-400">0x39b3d...8ef3</span></p>
              <p className="text-[10px] text-rose-400 font-medium tracking-wider uppercase">Awaiting Authorization</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Module Sub-Navigation Switcher */}
        <section className="bg-slate-950 p-1.5 rounded-xl border border-slate-800/80 flex flex-wrap gap-1">
          {navModules.map((module) => (
            <button
              key={module}
              onClick={() => setActiveTab(module)}
              className={`flex-1 min-w-[150px] text-center px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide uppercase transition-all duration-200 ${
                activeTab === module
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold shadow-md shadow-cyan-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {module}
            </button>
          ))}
        </section>

        {/* Dashboard Grid split into Two Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Column 1 & 2: Audit Engine Search & Results */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-950 rounded-xl border border-slate-800 p-6 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <span className="text-6xl font-black font-mono">AUDIT</span>
              </div>
              
              <div>
                <h2 className="text-base font-bold text-white tracking-wide uppercase">Public Ledger Audit Engine</h2>
                <p className="text-sm text-slate-400 mt-1">Verify origin authenticity and structural handling history reports mined across public state registries.</p>
              </div>

              {/* Form Input Terminal */}
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      placeholder="Input numeric indexing reference code (Try 403)..."
                      value={searchIndex}
                      onChange={(e) => setSearchIndex(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2 shrink-0 shadow-lg shadow-cyan-500/10"
                  >
                    <span>Pull On-Chain Record</span>
                  </button>
                </div>
              </form>

              {/* Results State Block */}
              <div className="border-t border-slate-800/80 pt-6">
                {!searched ? (
                  <div className="rounded-lg border border-dashed border-slate-800 p-8 text-center bg-slate-900/30">
                    <p className="text-xs text-slate-500 font-mono uppercase tracking-wider">No Target Records Selected</p>
                    <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">Input a numeric indexing reference code inside the tracking terminal above to extract immutable blockchain verification histories.</p>
                  </div>
                ) : recordFound ? (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="flex justify-between items-center bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-xs text-emerald-400 font-mono">
                      <span>✓ CRYPTOGRAPHIC TRACE VERIFIED</span>
                      <span className="text-[10px] text-slate-500">{mockLedgerData[searchIndex].hash.substring(0, 16)}...</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-900/60 p-4 rounded-lg border border-slate-800/60">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Product Origin</span>
                        <p className="text-sm font-semibold text-slate-200 mt-1">{mockLedgerData[searchIndex].origin}</p>
                      </div>
                      <div className="bg-slate-900/60 p-4 rounded-lg border border-slate-800/60">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Assigned Farmer</span>
                        <p className="text-sm font-semibold text-slate-200 mt-1">{mockLedgerData[searchIndex].farmer}</p>
                      </div>
                      <div className="bg-slate-900/60 p-4 rounded-lg border border-slate-800/60">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Transit Logistics</span>
                        <p className="text-sm font-semibold text-slate-200 mt-1">{mockLedgerData[searchIndex].transit}</p>
                      </div>
                      <div className="bg-slate-900/60 p-4 rounded-lg border border-slate-800/60">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Retailer Outlet</span>
                        <p className="text-sm font-semibold text-slate-200 mt-1">{mockLedgerData[searchIndex].retailer}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-6 text-center animate-fadeIn">
                    <p className="text-xs text-rose-400 font-mono uppercase tracking-wider">Block Index [{searchIndex}] State Error</p>
                    <p className="text-sm text-slate-400 mt-1">No metadata matching that reference code exists within the current localized network context runtime block height.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Column 3: Environment Side Metrics */}
          <div className="space-y-6">
            <div className="bg-slate-950 rounded-xl border border-slate-800 p-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Project Environment</h3>
              
              <div className="space-y-3 font-mono text-xs">
                <div className="bg-slate-900 p-3 rounded-lg flex justify-between items-center border border-slate-800">
                  <span className="text-slate-500">Network ID</span>
                  <span className="text-cyan-400 font-bold">FRE403 Local</span>
                </div>
                <div className="bg-slate-900 p-3 rounded-lg flex justify-between items-center border border-slate-800">
                  <span className="text-slate-500">Provider Link</span>
                  <span className="text-slate-300">Metamask Extension</span>
                </div>
                <div className="bg-slate-900 p-3 rounded-lg flex justify-between items-center border border-slate-800">
                  <span className="text-slate-500">Consensus</span>
                  <span className="text-slate-300">Proof of Authority</span>
                </div>
              </div>

              <div className="bg-slate-900/40 p-3.5 rounded-lg border border-slate-800 text-xs text-slate-400 leading-relaxed">
                <strong className="text-slate-300 block mb-1">Traceability Search Engine Notice:</strong> 
                The interface layer is currently targeting the client-side injection state hooks mapping out smart contract logic behaviors.
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 bg-slate-950/20 mt-12 py-6 text-center text-xs text-slate-500 font-mono">
        <div>© 2026 AquaChain Network Ledger Engine. All State Registries Retained.</div>
        <div className="text-[10px] text-slate-600 mt-1">Proposal Build: FRE403 Frontend Compilation Layer</div>
      </footer>
    </div>
  );
}