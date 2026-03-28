import { useState, useEffect } from "react";
import BedCard from "../../components/BedCard";
import Modal from "../../components/Modal";
import Button from "../../components/Button";
import StatCard from "../../components/StatCard";
import ExpectedDischargesTable from "../../components/ExpectedDischargesTable";
import PendingAdmissionsTable from "../../components/PendingAdmissionsTable";
import EscalationFlagsAlert from "../../components/EscalationFlagsAlert";

const generateBeds = (count, prefix, wardName) => {
  return Array.from({ length: count }).map((_, i) => {
    const isOccupied = Math.random() > 0.4;
    const status = isOccupied ? "occupied" : Math.random() > 0.6 ? "available" : Math.random() > 0.5 ? "cleaning" : "reserved";
    return {
      id: `${prefix}-${i + 1}`,
      ward: wardName,
      bedNumber: `${prefix}${i + 1}`,
      status,
      patient: status === "occupied" || status === "reserved" ? {
        name: `Patient ${Math.floor(Math.random() * 1000)}`,
        condition: ["Cardiac", "Ortho", "Observation", "Post-op"][Math.floor(Math.random() * 4)],
        doctor: "Dr. Smith",
        admitDate: "2026-03-26"
      } : null,
      since: status === "cleaning" ? "15 mins ago" : null,
    };
  });
};

const StaffDashboard = () => {
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBed, setSelectedBed] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeWard, setActiveWard] = useState("General Ward");

  const [discharges, setDischarges] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [escalations, setEscalations] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setTimeout(() => {
          const generalBeds = generateBeds(40, "G", "General Ward");
          const icuBeds = generateBeds(30, "I", "ICU Ward");
          const premiumBeds = generateBeds(20, "P", "Premium Ward");
          setBeds([...generalBeds, ...icuBeds, ...premiumBeds]);

          setDischarges([
            { id: 101, patientName: "Priya Singh", expectedTime: new Date(new Date().setHours(11, 0, 0, 0)), status: "pending", bedId: "G7" },
            { id: 102, patientName: "Vikram Mehta", expectedTime: new Date(new Date().setHours(14, 30, 0, 0)), status: "completed", bedId: null },
          ]);

          setAdmissions([
            { id: 201, patientName: "Sunita Verma", source: "Emergency", priority: "High", status: "waiting" },
          ]);

          setEscalations([
            { id: 1, type: "warning", message: "Bed G03 has been in 'Cleaning' status for over 30 minutes.", time: new Date(Date.now() - 10 * 60000).toISOString() },
            { id: 2, type: "critical", message: "Patient Priya Singh marked for discharge 2 hours ago but hasn't left (Bed G07).", time: new Date(Date.now() - 2 * 3600000).toISOString() },
            { id: 3, type: "warning", message: "Premium Ward projected to exceed 90% capacity by 8 PM.", time: new Date(Date.now() - 5 * 60000).toISOString() },
          ]);

          setLoading(false);
        }, 600);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const currentWardBeds = beds.filter(b => b.ward === activeWard);
  
  const occupiedCount = currentWardBeds.filter(b => b.status === "occupied").length;
  const availableCount = currentWardBeds.filter(b => b.status === "available").length;
  const cleaningCount = currentWardBeds.filter(b => b.status === "cleaning").length;
  const activeOccupancy = Math.round((occupiedCount / (currentWardBeds.length || 1)) * 100) || 0;
  
  const now = new Date();
  const time4h = new Date(now.getTime() + 4 * 60 * 60 * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const time8h = new Date(now.getTime() + 8 * 60 * 60 * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  const statsData = [
    { label: "Current Occupancy", value: `${activeOccupancy}%`, subtext: `${occupiedCount} of ${currentWardBeds.length} Beds` },
    { label: "4-Hour Forecast", value: `${Math.min(activeOccupancy + 15, 100)}%`, subtext: `By ${time4h}` },
    { label: "8-Hour Forecast", value: `${Math.min(activeOccupancy + 5, 100)}%`, subtext: `By ${time8h}` },
  ];

  const handleBedClick = (bed) => {
    setSelectedBed(bed);
    setIsModalOpen(true);
  };

  const updateStatus = (newStatus) => {
    setBeds(prev => prev.map(bed =>
      bed.id === selectedBed.id
        ? { ...bed, status: newStatus, patient: newStatus === "available" ? null : bed.patient }
        : bed
    ));
    setIsModalOpen(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center flex-1 h-[80vh]">
        <span className="text-xl font-extrabold text-gray-900 tracking-widest uppercase animate-pulse">Initializing Layout...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-8 max-w-[1800px] mx-auto pb-24">
      {/* Header & Ward Selector */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-gray-200 pb-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">WARD DASHBOARD</h2>
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mt-2">Live mapping & capacity forecasts</p>
        </div>
        <div className="flex w-full md:w-auto overflow-x-auto space-x-2 bg-gray-100 p-1 rounded-lg border border-gray-200 hide-scrollbar shrink-0">
          {["General Ward", "ICU Ward", "Premium Ward"].map(ward => (
            <button
              key={ward}
              onClick={() => setActiveWard(ward)}
              className={`px-5 py-3 md:py-2.5 text-xs font-bold uppercase tracking-widest rounded transition-colors whitespace-nowrap ${
                activeWard === ward 
                ? "bg-gradient-to-r from-blue-950 to-blue-900 text-white shadow-sm" 
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
              }`}
            >
              {ward}
            </button>
          ))}
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statsData.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Escalation Flags - Full Width */}
      <EscalationFlagsAlert escalations={escalations} />

      {/* Main Full-Width Bed Map Component */}
      <div className="w-full bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col shadow-sm">
        <div className="px-5 md:px-8 py-5 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50">
          <div>
            <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-widest">{activeWard} LAYOUT</h3>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mt-1">
              Showing {currentWardBeds.length} Total Beds — {availableCount} Available, {cleaningCount} Cleaning
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">
            <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-sm bg-gradient-to-r from-blue-950 to-blue-900 shadow-sm"></span> OCCUPIED</span>
            <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-sm bg-gray-100 border-2 border-gray-300"></span> RESERVED</span>
            <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-sm bg-white border-2 border-gray-300 border-dashed"></span> CLEANING</span>
            <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-sm bg-white border-2 border-gray-200"></span> AVAILABLE</span>
          </div>
        </div>
        
        {/* Deep highly responsive grid for Mobile to 4K Ultrawide */}
        <div className="p-5 md:p-8 bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-4 sm:gap-6">
            {currentWardBeds.map((bed) => (
              <BedCard key={bed.id} bed={bed} onClick={handleBedClick} />
            ))}
          </div>
        </div>
      </div>

      {/* Auxiliary Information Tables (Side-by-side on desktop) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        <ExpectedDischargesTable 
          discharges={discharges.filter(d => currentWardBeds.some(b => b.bedNumber === d.bedId || d.bedId === null))} 
          onComplete={(id) => setDischarges(prev => prev.map(item => item.id === id ? { ...item, status: 'completed' } : item))} 
        />
        <PendingAdmissionsTable 
          admissions={admissions} 
          onArrive={(id) => setAdmissions(prev => prev.map(item => item.id === id ? { ...item, status: 'arrived' } : item))} 
        />
      </div>

      {/* Bed Settings Modal */}
      {selectedBed && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`BED ${selectedBed.bedNumber} SETTINGS`}>
          <div className="space-y-8">
            {selectedBed.status === 'occupied' && selectedBed.patient && (
              <div className="bg-white p-5 rounded-lg border-2 border-gray-200">
                <h4 className="font-extrabold text-2xl text-gray-900 tracking-tight">{selectedBed.patient.name}</h4>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Condition</p>
                    <p className="text-sm font-bold text-gray-900">{selectedBed.patient.condition}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Doctor</p>
                    <p className="text-sm font-bold text-gray-900">{selectedBed.patient.doctor}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Admitted</p>
                    <p className="text-sm font-bold text-gray-900">{selectedBed.patient.admitDate}</p>
                  </div>
                </div>
              </div>
            )}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Update Status</p>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="secondary" onClick={() => updateStatus("available")} className="w-full py-4 border-2 border-gray-200 text-gray-900 hover:bg-white hover:border-gray-400 text-xs font-bold uppercase tracking-wider shadow-none">
                  Available
                </Button>
                <Button variant="secondary" onClick={() => updateStatus("occupied")} className="w-full py-4 border-2 border-gray-200 text-gray-900 hover:bg-white hover:border-gray-400 text-xs font-bold uppercase tracking-wider shadow-none">
                  Occupied
                </Button>
                <Button variant="secondary" onClick={() => updateStatus("cleaning")} className="w-full py-4 border-2 border-gray-200 text-gray-900 hover:bg-white hover:border-gray-400 text-xs font-bold uppercase tracking-wider shadow-none">
                  Cleaning
                </Button>
                <Button variant="secondary" onClick={() => updateStatus("reserved")} className="w-full py-4 border-2 border-gray-200 text-gray-900 hover:bg-white hover:border-gray-400 text-xs font-bold uppercase tracking-wider shadow-none">
                  Reserved
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default StaffDashboard;