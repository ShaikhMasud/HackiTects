import { useState, useEffect } from "react";
import { toast } from "react-toastify";
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
  const [selectedAdmissionId, setSelectedAdmissionId] = useState("");
  const [transferWardId, setTransferWardId] = useState("");
  const [transferBedId, setTransferBedId] = useState("");
  
  const [isAdmissionModalOpen, setIsAdmissionModalOpen] = useState(false);
  const [admissionForm, setAdmissionForm] = useState({
    patientName: "",
    wardId: "General Ward",
    priority: "Routine",
    doctorId: "D-101",
    bedId: "",
  });

  const handleAdmissionChange = (e) => {
    // If ward changes, reset bed selection since beds are ward-specific
    if (e.target.name === "wardId") {
       setAdmissionForm({ ...admissionForm, wardId: e.target.value, bedId: "" });
    } else {
       setAdmissionForm({ ...admissionForm, [e.target.name]: e.target.value });
    }
  };

  const submitAdmission = () => {
    if (!admissionForm.patientName.trim()) {
       toast.error("Please enter a patient name.");
       return;
    }

    const newAdmission = {
      id: Math.floor(Math.random() * 10000),
      patientName: admissionForm.patientName,
      source: "Manual Entry",
      priority: admissionForm.priority === "Emergency" ? "High" : admissionForm.priority === "Urgent" ? "Medium" : "Standard",
      targetWard: admissionForm.wardId,
      status: "waiting",
    };

    if (admissionForm.bedId) {
      // Direct bed assignment bypasses the pending queue
      const doctorMeta = admissionForm.doctorId === "D-101" ? "Dr. Smith" : admissionForm.doctorId === "D-102" ? "Dr. Jones" : "Assigned Doctor";
      
      setBeds(prev => prev.map(bed => 
         bed.bedNumber === admissionForm.bedId 
            ? { 
                ...bed, 
                status: "occupied", 
                patient: { 
                  name: newAdmission.patientName, 
                  condition: "Direct Admission", 
                  doctor: doctorMeta, 
                  admitDate: new Date().toISOString().split('T')[0] 
                } 
              } 
            : bed
      ));
      toast.success(`Direct Admission: ${newAdmission.patientName} assigned to Bed ${admissionForm.bedId}`);
    } else {
      setAdmissions((prev) => [newAdmission, ...prev]);
      toast.success(`Admission scheduled for ${newAdmission.patientName}`);
    }

    setAdmissionForm({ patientName: "", wardId: "General Ward", priority: "Routine", doctorId: "D-101", bedId: "" });
    setIsAdmissionModalOpen(false);
  };

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
            { id: 201, patientName: "Sunita Verma", source: "Emergency", priority: "High", targetWard: "ICU Ward", status: "waiting" },
            { id: 202, patientName: "Ramesh Singh", source: "Elective Post-Op", priority: "Standard", targetWard: "Premium Ward", status: "waiting" },
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

  const currentDischarges = discharges.filter(d => currentWardBeds.some(b => b.bedNumber === d.bedId || d.bedId === null));
  const pendingAdmissionsTargettingWard = admissions.filter(a => a.targetWard === activeWard && (a.status === 'waiting' || a.status === 'arrived')).length;

  const dischargesNext4h = currentDischarges.filter(d => d.status === 'pending' && new Date(d.expectedTime) <= new Date(Date.now() + 4 * 3600000)).length;
  const dischargesNext8h = currentDischarges.filter(d => d.status === 'pending' && new Date(d.expectedTime) <= new Date(Date.now() + 8 * 3600000)).length;

  const activeOccupancy = Math.round((occupiedCount / (currentWardBeds.length || 1)) * 100) || 0;
  const occupancy4h = Math.round(((occupiedCount - dischargesNext4h + pendingAdmissionsTargettingWard) / (currentWardBeds.length || 1)) * 100) || 0;
  const occupancy8h = Math.round(((occupiedCount - dischargesNext8h + pendingAdmissionsTargettingWard) / (currentWardBeds.length || 1)) * 100) || 0;

  const now = new Date();
  const time4h = new Date(now.getTime() + 4 * 60 * 60 * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const time8h = new Date(now.getTime() + 8 * 60 * 60 * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  const statsData = [
    { label: "Current Occupancy", value: `${activeOccupancy}%`, subtext: `${occupiedCount} of ${currentWardBeds.length} Beds` },
    { label: "4-Hour Forecast", value: `${Math.min(Math.max(occupancy4h, 0), 100)}%`, subtext: `By ${time4h}` },
    { label: "8-Hour Forecast", value: `${Math.min(Math.max(occupancy8h, 0), 100)}%`, subtext: `By ${time8h}` },
  ];

  // Dynamic Escalations
  const dynamicEscalations = [];
  if (occupancy4h > 90) {
    dynamicEscalations.push({ id: `cap-${activeWard}`, type: "critical", message: `${activeWard} projected to exceed 90% capacity within 4 hours.`, time: new Date().toISOString() });
  }
  currentWardBeds.filter(b => b.status === "cleaning").slice(0, 1).forEach(b => {
    // Flag the first cleaning bed as an example delay
    dynamicEscalations.push({ id: `c-${b.id}`, type: "warning", message: `Bed ${b.bedNumber} has been in 'Cleaning' status for over 30 minutes.`, time: new Date(Date.now() - 35 * 60000).toISOString() });
  });
  currentDischarges.filter(d => d.status === "pending" && new Date(d.expectedTime).getTime() < (Date.now() - 2 * 3600000)).forEach(d => {
    dynamicEscalations.push({ id: `d-${d.id}`, type: "critical", message: `Patient ${d.patientName} marked for discharge >2 hours ago and hasn't left.`, time: new Date(d.expectedTime).toISOString() });
  });

  const handleBedClick = (bed) => {
    setSelectedBed(bed);
    setSelectedAdmissionId("");
    setTransferWardId(bed.ward);
    setTransferBedId("");
    setIsModalOpen(true);
  };

  const updateStatus = (newStatus) => {
    setBeds(prev => prev.map(bed =>
      bed.id === selectedBed.id
        ? { ...bed, status: newStatus, patient: ["available", "cleaning"].includes(newStatus) ? null : bed.patient }
        : bed
    ));
    setIsModalOpen(false);
    toast.success(`Bed ${selectedBed.bedNumber} updated to ${newStatus}`);
  };

  const handleDischarge = () => {
     setBeds(prev => prev.map(bed =>
       bed.id === selectedBed.id
         ? { ...bed, status: "cleaning", patient: null }
         : bed
     ));
     setDischarges(prev => prev.map(d => d.bedId === selectedBed.bedNumber ? { ...d, status: 'completed' } : d));
     setIsModalOpen(false);
     toast.info(`Bed ${selectedBed.bedNumber} is now cleaning. Patient discharged.`);
  };

  const handleTransfer = () => {
     if (!transferBedId) return;

     setBeds(prev => prev.map(bed => {
       if (bed.id === selectedBed.id) {
         return { ...bed, status: "cleaning", patient: null };
       }
       if (bed.bedNumber === transferBedId) {
         return { ...bed, status: "occupied", patient: selectedBed.patient };
       }
       return bed;
     }));

     setIsModalOpen(false);
     toast.success(`Patient successfully transferred to Bed ${transferBedId}. Original bed marked for cleaning.`);
  };

  const handleAssignAdmission = (admitId) => {
     const admin = admissions.find(a => a.id.toString() === admitId.toString());
     if(!admin) return;

     setBeds(prev => prev.map(bed => 
        bed.id === selectedBed.id 
           ? { 
               ...bed, 
               status: "occupied", 
               patient: { 
                 name: admin.patientName, 
                 condition: admin.source, 
                 doctor: "Assigned Doctor", 
                 admitDate: new Date().toISOString().split('T')[0] 
               } 
             } 
           : bed
     ));

     setAdmissions(prev => prev.filter(a => a.id.toString() !== admitId.toString()));
     setSelectedAdmissionId("");
     setIsModalOpen(false);
     toast.success(`${admin.patientName} assigned to Bed ${selectedBed.bedNumber}`);
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
        <div className="flex w-full md:w-auto flex-col md:flex-row gap-4 items-start md:items-center shrink-0">
          <div className="flex w-full overflow-x-auto space-x-2 bg-gray-100 p-1 rounded-lg border border-gray-200 hide-scrollbar">
            {["General Ward", "ICU Ward", "Premium Ward"].map(ward => (
              <button
                key={ward}
                onClick={() => setActiveWard(ward)}
                className={`px-5 py-3 md:py-2.5 text-xs font-bold uppercase tracking-widest rounded transition-colors whitespace-nowrap ${activeWard === ward
                    ? "bg-gradient-to-r from-blue-950 to-blue-900 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                  }`}
              >
                {ward}
              </button>
            ))}
          </div>
          <Button onClick={() => setIsAdmissionModalOpen(true)} className="px-6 py-3 md:py-3.5 text-xs font-extrabold uppercase tracking-widest bg-gray-900 hover:bg-black w-full md:w-auto shadow-none whitespace-nowrap">
            + Create Admission
          </Button>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statsData.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Escalation Flags - Full Width */}
      <EscalationFlagsAlert escalations={dynamicEscalations.length > 0 ? dynamicEscalations : escalations} />

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
          discharges={discharges.filter(d => currentWardBeds.some(b => b.bedNumber === d.bedId || b.id === d.bedId))}
          onComplete={(id) => setDischarges(prev => prev.map(item => item.id === id ? { ...item, status: 'completed' } : item))}
          onDiscard={(id) => setDischarges(prev => prev.filter(item => item.id !== id))}
        />
        <PendingAdmissionsTable
          admissions={admissions.filter(a => a.targetWard === activeWard)}
          onArrive={(id) => setAdmissions(prev => prev.map(item => item.id === id ? { ...item, status: 'arrived' } : item))}
          onDiscard={(id) => setAdmissions(prev => prev.filter(item => item.id !== id))}
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
                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                  <Button onClick={handleDischarge} className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white text-[10px] font-extrabold uppercase tracking-widest shadow-none border-none">
                     Discharge Patient & Clean Bed
                  </Button>
                </div>
              </div>
            )}

            {selectedBed.status === 'occupied' && selectedBed.patient && (
              <div className="bg-white p-5 rounded-lg border-2 border-gray-200 mb-4">
                 <p className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4">Transfer Patient</p>
                 <div className="grid grid-cols-2 gap-4 mb-4">
                   <div>
                     <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1 block">Target Ward</label>
                     <select 
                         className="w-full pl-3 pr-8 py-2.5 border-2 border-gray-200 rounded focus:ring-0 focus:border-gray-900 outline-none transition text-sm font-bold text-gray-900 bg-white"
                         value={transferWardId}
                         onChange={(e) => { setTransferWardId(e.target.value); setTransferBedId(""); }}
                     >
                        {["General Ward", "ICU Ward", "Premium Ward"].map(w => (
                           <option key={w} value={w}>{w}</option>
                        ))}
                     </select>
                   </div>
                   <div>
                     <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1 block">Destination Bed</label>
                     <select 
                         className="w-full pl-3 pr-8 py-2.5 border-2 border-gray-200 rounded focus:ring-0 focus:border-gray-900 outline-none transition text-sm font-bold text-gray-900 bg-white"
                         value={transferBedId}
                         onChange={(e) => setTransferBedId(e.target.value)}
                     >
                        <option value="">-- Select Bed --</option>
                        {beds.filter(b => b.ward === transferWardId && ["available", "reserved"].includes(b.status) && b.id !== selectedBed.id).map(b => (
                           <option key={b.id} value={b.bedNumber}>Bed {b.bedNumber} [{b.status.toUpperCase()}]</option>
                        ))}
                     </select>
                   </div>
                 </div>
                 <Button 
                    onClick={handleTransfer} 
                    disabled={!transferBedId}
                    className="w-full py-3.5 border-none bg-blue-900 text-white hover:bg-blue-950 text-[10px] font-extrabold uppercase tracking-widest disabled:opacity-50 transition-colors"
                 >
                    Execute Transfer
                 </Button>
              </div>
            )}

            {["available", "cleaning"].includes(selectedBed.status) && (
              <div className="bg-white p-5 rounded-lg border-2 border-gray-200 mb-4">
                 <p className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4">Assign Admission</p>
                 <select 
                     className="w-full pl-4 pr-4 py-3 border-2 border-gray-200 rounded focus:ring-0 focus:border-gray-900 outline-none transition text-sm font-bold text-gray-900 bg-white mb-4"
                     value={selectedAdmissionId}
                     onChange={(e) => setSelectedAdmissionId(e.target.value)}
                 >
                    <option value="">-- Select Pending/Arrived Admission --</option>
                    {admissions.filter(a => (a.status === 'waiting' || a.status === 'arrived') && a.targetWard === selectedBed.ward).map(a => (
                       <option key={a.id} value={a.id}>{a.patientName} [{a.status.toUpperCase()}]</option>
                    ))}
                 </select>
                 <Button 
                    onClick={() => handleAssignAdmission(selectedAdmissionId)} 
                    disabled={!selectedAdmissionId}
                    className="w-full py-4 border-none bg-gray-900 text-white hover:bg-black text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                 >
                    Assign Patient to Bed
                 </Button>
              </div>
            )}

            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Manual Status Update</p>
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

      {/* CREATE ADMISSION MODAL */}
      <Modal
        isOpen={isAdmissionModalOpen}
        onClose={() => setIsAdmissionModalOpen(false)}
        title="SCHEDULE NEW ADMISSION"
      >
        <div className="space-y-6">
          <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 leading-relaxed">
            Register a direct patient incoming stream to the active pending bed roster.
          </p>

          <div>
            <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 block">
              Patient Full Name
            </label>
            <input
              name="patientName"
              placeholder="e.g. John Doe"
              value={admissionForm.patientName}
              onChange={handleAdmissionChange}
              className="w-full pl-4 pr-4 py-3 border-2 border-gray-200 rounded focus:ring-0 focus:border-gray-900 outline-none transition text-sm font-bold placeholder:font-bold placeholder:text-gray-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
               <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 block">
                Target Ward
               </label>
               <select
                 name="wardId"
                 value={admissionForm.wardId}
                 onChange={handleAdmissionChange}
                 className="w-full pl-4 pr-4 py-3 border-2 border-gray-200 rounded focus:ring-0 focus:border-gray-900 outline-none transition text-sm font-bold text-gray-900 bg-white"
               >
                 <option value="General Ward">General Ward</option>
                 <option value="ICU Ward">ICU Ward</option>
                 <option value="Premium Ward">Premium Ward</option>
               </select>
            </div>
            
            <div>
              <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 block">
                Clinical Priority
              </label>
              <select
                name="priority"
                value={admissionForm.priority}
                onChange={handleAdmissionChange}
                className="w-full pl-4 pr-4 py-3 border-2 border-gray-200 rounded focus:ring-0 focus:border-gray-900 outline-none transition text-sm font-bold text-gray-900 bg-white"
              >
                 <option value="Emergency">Emergency</option>
                 <option value="Urgent">Urgent</option>
                 <option value="Routine">Routine</option>
              </select>
            </div>
          </div>

            <div>
              <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 block">
                Attending Physician
              </label>
              <select
                name="doctorId"
                value={admissionForm.doctorId}
                onChange={handleAdmissionChange}
                className="w-full pl-4 pr-4 py-3 border-2 border-gray-200 rounded focus:ring-0 focus:border-gray-900 outline-none transition text-sm font-bold text-gray-900 bg-white"
              >
                 <option value="D-101">Dr. Smith [D-101]</option>
                 <option value="D-102">Dr. Jones [D-102]</option>
                 <option value="D-103">Dr. Patel [D-103]</option>
                 <option value="D-104">Dr. Williams [D-104]</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 block">
                Assign Bed (Optional)
              </label>
              <select
                name="bedId"
                value={admissionForm.bedId}
                onChange={handleAdmissionChange}
                className="w-full pl-4 pr-4 py-3 border-2 border-gray-200 rounded focus:ring-0 focus:border-blue-900 outline-none transition text-sm font-bold text-blue-900 bg-blue-50 border-blue-200"
              >
                 <option value="" className="text-gray-900 bg-white">-- Add to Pending Queue Instead --</option>
                 {beds.filter(b => b.ward === admissionForm.wardId && ["available", "reserved"].includes(b.status)).map(b => (
                    <option key={b.id} value={b.bedNumber} className="text-gray-900 bg-white">Bed {b.bedNumber} [{b.status.toUpperCase()}]</option>
                 ))}
              </select>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-2 ml-1">Leave unselected to explicitly place patient on the pending queue.</p>
            </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={() => setIsAdmissionModalOpen(false)} className="px-6 text-[10px] font-extrabold uppercase tracking-widest shadow-none border-2 border-gray-200 text-gray-600">
              Cancel
            </Button>
            <Button onClick={submitAdmission} className="px-6 text-[10px] font-extrabold uppercase tracking-widest shadow-none border-2 border-gray-900 bg-gray-900">
              Submit Admission
            </Button>
          </div>

        </div>
      </Modal>
    </div>
  );
};

export default StaffDashboard;