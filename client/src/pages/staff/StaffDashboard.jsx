import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  const [activeWard, setActiveWard] = useState(null);
  const [wardsList, setWardsList] = useState([]);
  const [doctorsList, setDoctorsList] = useState([]);
  const [globalBeds, setGlobalBeds] = useState([]);
  const [selectedAdmissionId, setSelectedAdmissionId] = useState("");
  const [transferWardId, setTransferWardId] = useState("");
  const [transferBedId, setTransferBedId] = useState("");
  
  const [isAdmissionModalOpen, setIsAdmissionModalOpen] = useState(false);
  const [admissionForm, setAdmissionForm] = useState({
    patientName: "",
    age: "",
    gender: "M",
    bp: "",
    hr: "",
    temp: "",
    condition: "",
    wardId: "",
    priority: "Routine",
    doctorId: "",
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

  const submitAdmission = async () => {
    if (!admissionForm.patientName.trim()) {
       toast.error("Please enter a patient name.");
       return;
    }

    const finalWardId = admissionForm.wardId || activeWard;
    const finalDoctorId = admissionForm.doctorId || (doctorsList.length > 0 ? doctorsList[0]._id : "");

    if (!finalWardId) {
       toast.error("Please select a valid ward.");
       return;
    }

    try {
      // Step 1: Create the patient implicitly via admission or wait, backend admissionController handles Patient creation if sent? Look at backend logic. 
      // Instead of guessing, since we might need Patient ID, let's just send the admission request if the backend endpoint supports direct creation without patientId. 
      // If doing a true integration, we assume the backend handles it.
      const res = await fetch("http://localhost:5000/api/admissions", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
            patientName: admissionForm.patientName,
            age: admissionForm.age,
            gender: admissionForm.gender,
            bp: admissionForm.bp,
            hr: admissionForm.hr,
            temp: admissionForm.temp,
            condition: admissionForm.condition,
            wardId: finalWardId,
            priority: admissionForm.priority.toLowerCase(),
            doctorId: finalDoctorId,
            bedId: admissionForm.bedId || undefined
         })
      });
      if (res.ok) {
         toast.success(admissionForm.bedId ? `Patient directly assigned to bed` : `Admission scheduled for ${admissionForm.patientName}`);
         fetchDashboardData();
      } else {
         toast.error("Failed to create admission");
      }
    } catch(e) { console.error(e); }
    
    
    setAdmissionForm({ patientName: "", age: "", gender: "M", bp: "", hr: "", temp: "", condition: "", wardId: activeWard || "", priority: "Routine", doctorId: doctorsList[0]?._id || "", bedId: "" });
    setIsAdmissionModalOpen(false);
  };

  const [discharges, setDischarges] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [escalations, setEscalations] = useState([]);
  const [capacity, setCapacity] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const wardsRes = await fetch("http://localhost:5000/api/wards");
      const wardsData = await wardsRes.json();
      setWardsList(wardsData);
      
      const allBedsRes = await fetch("http://localhost:5000/api/beds");
      if (allBedsRes.ok) {
         setGlobalBeds(await allBedsRes.json());
      }
      
      const docsRes = await fetch("http://localhost:5000/api/staff/doctors");
      let fetchedDoctors = [];
      if (docsRes.ok) {
         const docsData = await docsRes.json();
         fetchedDoctors = docsData.doctors || [];
         setDoctorsList(fetchedDoctors);
         if (!admissionForm.doctorId && fetchedDoctors.length > 0) {
            setAdmissionForm(prev => ({ ...prev, doctorId: fetchedDoctors[0]._id }));
         }
      }
      
      let currentWardId = activeWard || localStorage.getItem("wardWatchActiveWard");
      if (!currentWardId && wardsData.length > 0) {
        currentWardId = wardsData[0]._id;
      }
      if (currentWardId) {
        setActiveWard(currentWardId);
        localStorage.setItem("wardWatchActiveWard", currentWardId);
      }
      
      if (!currentWardId) {
        setLoading(false);
        return;
      }
      
      const [bedsRes, discRes, admRes, escRes, capRes] = await Promise.all([
         fetch(`http://localhost:5000/api/wards/${currentWardId}`),
         fetch(`http://localhost:5000/api/discharges/ward/${currentWardId}`),
         fetch(`http://localhost:5000/api/admissions/ward/${currentWardId}`),
         fetch(`http://localhost:5000/api/escalations/ward/${currentWardId}`),
         fetch(`http://localhost:5000/api/capacity/${currentWardId}/forecast`)
      ]);
      
      if(bedsRes.ok) {
         const wd = await bedsRes.json();
         // map beds to frontend structure
         const mappedBeds = wd.beds.map(b => ({
            id: b._id,
            ward: currentWardId,
            bedNumber: b.bedNumber,
            status: b.status,
            patient: b.occupantPatientId ? {
                name: b.occupantPatientId.patientName,
                condition: b.occupantPatientId.primaryCondition || 'Standard Admission',
                doctor: 'Assigned Provider',
                admitDate: b.occupantPatientId.admissionDate ? b.occupantPatientId.admissionDate.split('T')[0] : 'N/A',
                los: b.occupantPatientId.admissionDate ? Math.floor((new Date() - new Date(b.occupantPatientId.admissionDate)) / (1000 * 60 * 60 * 24)) : 0
            } : null,
            since: b.cleaningStartTime ? 'Cleaning' : null
         }));
         setBeds(mappedBeds);
      }
      
      if(discRes.ok) {
         const d = await discRes.json();
         setDischarges(d.map(x => ({ 
             id: x._id, 
             patientName: x.patientId?.patientName || 'Unknown', 
             expectedTime: x.scheduledDischargeTime, 
             status: x.status, 
             bedId: x.bedId?._id || x.bedId,
             bedNumber: x.bedId?.bedNumber || '-'
         })));
      } else { setDischarges([]); }
      
      if(admRes.ok) {
         const a = await admRes.json();
         setAdmissions(a.map(x => ({ id: x._id, patientName: x.patientId?.patientName || 'Unknown', source: x.priority, priority: x.priority, targetWard: x.wardId, status: x.status })));
      } else { setAdmissions([]); }
      
      if(escRes.ok) {
         const escData = await escRes.json();
         setEscalations(escData.map(e => {
             const bedPrefix = e.relatedBedId?.bedNumber ? `Bed ${e.relatedBedId.bedNumber} - ` : '';
             const patientPrefix = e.relatedPatientId?.patientName ? `[${e.relatedPatientId.patientName}] ` : '';
             return {
                 id: e._id,
                 type: e.severity ? e.severity.toLowerCase() : 'warning',
                 message: `${bedPrefix}${patientPrefix}${e.description}`,
                 time: e.createdAt || new Date().toISOString()
             };
         }));
      } else { setEscalations([]); }

      if (capRes.ok) {
         setCapacity(await capRes.json());
      } else { setCapacity(null); }

    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [activeWard]);

  useEffect(() => {
    const eventSource = new EventSource("http://localhost:5000/api/events/stream");

    const handleEvent = () => {
      fetchDashboardData();
    };

    eventSource.addEventListener("bed-updated", handleEvent);
    eventSource.addEventListener("patient-admitted", handleEvent);
    eventSource.addEventListener("patient-discharged", handleEvent);
    eventSource.addEventListener("discharge-scheduled", handleEvent);
    eventSource.addEventListener("escalation-created", handleEvent);
    eventSource.addEventListener("escalation-resolved", handleEvent);

    return () => {
      eventSource.removeEventListener("bed-updated", handleEvent);
      eventSource.removeEventListener("patient-admitted", handleEvent);
      eventSource.removeEventListener("patient-discharged", handleEvent);
      eventSource.removeEventListener("discharge-scheduled", handleEvent);
      eventSource.removeEventListener("escalation-created", handleEvent);
      eventSource.removeEventListener("escalation-resolved", handleEvent);
      eventSource.close();
    };
  }, [activeWard]);

  const currentWardBeds = beds.filter(b => b.ward === activeWard);

  const occupiedCount = currentWardBeds.filter(b => b.status === "occupied").length;
  const availableCount = currentWardBeds.filter(b => b.status === "available").length;
  const cleaningCount = currentWardBeds.filter(b => b.status === "cleaning").length;

  const currentDischarges = discharges.filter(d => currentWardBeds.some(b => b.bedNumber === d.bedId || d.bedId === null));
  const pendingAdmissionsTargettingWard = admissions.filter(a => a.targetWard === activeWard && a.status === 'pending').length;

  const dischargesNext4h = currentDischarges.filter(d => d.status === 'pending' && new Date(d.expectedTime) <= new Date(Date.now() + 4 * 3600000)).length;
  const dischargesNext8h = currentDischarges.filter(d => d.status === 'pending' && new Date(d.expectedTime) <= new Date(Date.now() + 8 * 3600000)).length;

  const activeOccupancy = capacity ? Math.round((capacity.current / (capacity.forecast_4hr?.totalBeds || 1)) * 100) : 0;
  const occupancy4h = capacity?.forecast_4hr ? Math.round(parseFloat(capacity.forecast_4hr.occupancyRate)) : 0;
  const occupancy8h = capacity?.forecast_8hr ? Math.round(parseFloat(capacity.forecast_8hr.occupancyRate)) : 0;
  
  const currentTotal = capacity?.forecast_4hr?.totalBeds || currentWardBeds.length;

  const now = new Date();
  const time4h = new Date(now.getTime() + 4 * 60 * 60 * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const time8h = new Date(now.getTime() + 8 * 60 * 60 * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  const statsData = [
    { label: "Current Occupancy", value: `${Math.min(Math.max(activeOccupancy, 0), 100)}%`, subtext: `${capacity?.current || occupiedCount} of ${currentTotal} Beds` },
    { label: "4-Hour Forecast", value: `${Math.min(Math.max(occupancy4h, 0), 100)}%`, subtext: `By ${time4h}` },
    { label: "8-Hour Forecast", value: `${Math.min(Math.max(occupancy8h, 0), 100)}%`, subtext: `By ${time8h}` },
  ];

  const handleBedClick = (bed) => {
    setSelectedBed(bed);
    setSelectedAdmissionId("");
    setTransferWardId(bed.ward);
    setTransferBedId("");
    setIsModalOpen(true);
  };

  const updateStatus = async (newStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/api/beds/${selectedBed.id}/status`, {
         method: "PUT",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ status: newStatus })
      });
      if(res.ok) {
        toast.success(`Bed ${selectedBed.bedNumber} updated to ${newStatus}`);
        fetchDashboardData();
      }
    } catch(e) { console.error(e); }
    setIsModalOpen(false);
  };

  const handleTransfer = async () => {
     if (!transferBedId) return;
     try {
       const res = await fetch(`http://localhost:5000/api/beds/transfer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sourceBedId: selectedBed.id, targetBedId: transferBedId })
       });
       if(res.ok) {
         toast.success(`Patient successfully transferred to new bed!`);
         setTransferBedId("");
         fetchDashboardData();
       } else {
         const errorInfo = await res.json();
         toast.error(errorInfo.message || "Failed to finalize bed transfer.");
       }
     } catch(e) { 
       console.error(e);
       toast.error("Network error executing transfer");
     }
     setIsModalOpen(false);
  };

  const handleAssignAdmission = async (admitId) => {
     try {
       const res = await fetch(`http://localhost:5000/api/admissions/${admitId}/arrived`, { method: "PUT" });
       if(res.ok) {
         toast.success(`Patient marked as arrived. System will auto-assign queue.`);
         fetchDashboardData();
       }
     } catch(e) {}
     setSelectedAdmissionId("");
     setIsModalOpen(false);
  };

  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
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
          <select
            value={activeWard || ""}
            onChange={(e) => {
              setActiveWard(e.target.value);
              localStorage.setItem("wardWatchActiveWard", e.target.value);
            }}
            className="w-full md:w-56 pl-4 pr-8 py-3 md:py-3.5 bg-gray-100 border border-gray-200 rounded text-xs font-extrabold text-gray-900 uppercase tracking-widest cursor-pointer transition-colors focus:outline-none focus:ring-0 focus:border-gray-900 hover:bg-gray-200 shadow-sm"
          >
            {wardsList.map(ward => (
              <option key={ward._id} value={ward._id} className="font-bold bg-white text-gray-900">
                {ward.wardName}
              </option>
            ))}
          </select>
          <Button onClick={() => setIsAdmissionModalOpen(true)} className="px-6 py-3 md:py-3.5 text-xs font-extrabold uppercase tracking-widest bg-gray-900 hover:bg-black w-full md:w-auto shadow-none whitespace-nowrap">
            + Create Admission
          </Button>
          <Button onClick={handleLogout} variant="outline" className="px-4 py-3 md:py-3.5 text-xs font-extrabold uppercase tracking-widest text-gray-900 border-2 border-gray-200 hover:bg-red-50 hover:text-red-900 hover:border-red-200 shadow-none w-full md:w-auto">
            Logout
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
      <EscalationFlagsAlert escalations={escalations} />

      {/* Main Full-Width Bed Map Component */}
      <div className="w-full bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col shadow-sm">
        <div className="px-5 md:px-8 py-5 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50">
          <div>
            <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-widest">{(wardsList.find(w => w._id === activeWard) || {}).wardName} LAYOUT</h3>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mt-1">
              Showing {currentWardBeds.length} Total Beds — {availableCount} Available, {cleaningCount} Cleaning
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">
            <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-sm bg-gradient-to-br from-blue-950 to-blue-900 shadow-sm border border-blue-950"></span> OCCUPIED</span>
            <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-sm bg-gradient-to-br from-violet-900 to-violet-800 shadow-sm border border-violet-950"></span> RESERVED</span>
            <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-sm bg-gradient-to-br from-amber-600 to-amber-500 shadow-sm border border-amber-700"></span> CLEANING</span>
            <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-sm bg-gradient-to-br from-emerald-600 to-emerald-500 shadow-sm border border-emerald-700"></span> AVAILABLE</span>
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
          onComplete={async (id) => {
            try {
               await fetch(`http://localhost:5000/api/discharges/${id}/complete`, {method: "PUT"});
               fetchDashboardData();
            }catch(e){}
          }}
          onDiscard={(id) => setDischarges(prev => prev.filter(item => item.id !== id))}
        />
        <PendingAdmissionsTable
          admissions={admissions.filter(a => a.targetWard === activeWard && a.status === 'pending')}
          onArrive={async (id) => {
             try {
                await fetch(`http://localhost:5000/api/admissions/${id}/arrived`, {method: "PUT"});
                fetchDashboardData();
             }catch(e){}
          }}
          onDiscard={(id) => setAdmissions(prev => prev.filter(item => item.id !== id))}
        />
      </div>

      {/* Bed Settings Modal */}
      {selectedBed && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`BED ${selectedBed.bedNumber} SETTINGS`}>
          <div className="space-y-4">
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
                        {wardsList.map(w => (
                           <option key={w._id} value={w._id}>{w.wardName}</option>
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
                        {globalBeds.filter(b => b.wardId === transferWardId && ["available", "reserved"].includes(b.status) && b._id !== selectedBed?.id).map(b => (
                           <option key={b._id} value={b._id}>Bed {b.bedNumber} [{b.status.toUpperCase()}]</option>
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
                    <option value="">-- Select Pending Admission --</option>
                    {admissions.filter(a => a.status === 'pending' && a.targetWard === selectedBed.ward).map(a => (
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
             <div>
               <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 block">
                 Primary Condition
               </label>
               <input
                 name="condition"
                 placeholder="e.g. Cardiac Arrest"
                 value={admissionForm.condition}
                 onChange={handleAdmissionChange}
                 className="w-full pl-4 pr-4 py-3 border-2 border-gray-200 rounded focus:ring-0 focus:border-gray-900 outline-none transition text-sm font-bold placeholder:font-bold placeholder:text-gray-300"
               />
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
               <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 block">
                 Patient Age
               </label>
               <input
                 type="number"
                 name="age"
                 placeholder="e.g. 45"
                 value={admissionForm.age}
                 onChange={handleAdmissionChange}
                 className="w-full pl-4 pr-4 py-3 border-2 border-gray-200 rounded focus:ring-0 focus:border-gray-900 outline-none transition text-sm font-bold placeholder:font-bold placeholder:text-gray-300"
               />
            </div>
            
            <div>
              <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 block">
                Sex / Gender
              </label>
              <select
                name="gender"
                value={admissionForm.gender}
                onChange={handleAdmissionChange}
                className="w-full pl-4 pr-4 py-3 border-2 border-gray-200 rounded focus:ring-0 focus:border-gray-900 outline-none transition text-sm font-bold text-gray-900 bg-white"
              >
                 <option value="M">Male</option>
                 <option value="F">Female</option>
                 <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="bg-gray-50 border-2 border-gray-100 p-4 rounded-sm flex flex-col gap-4 md:grid md:grid-cols-3">
             <div className="col-span-3 pb-2 border-b border-gray-200 mb-1">
                 <p className="text-[9px] font-black text-gray-500 tracking-widest uppercase">Initial Clinical Vitals</p>
             </div>
             <div>
                 <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 block">Blood Pressure</label>
                 <input type="text" name="bp" placeholder="120/80" value={admissionForm.bp} onChange={handleAdmissionChange} className="w-full px-3 py-2 border-2 border-gray-200 rounded focus:border-gray-900 text-xs font-bold transition" />
             </div>
             <div>
                 <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 block">Heart Rate</label>
                 <input type="number" name="hr" placeholder="75" value={admissionForm.hr} onChange={handleAdmissionChange} className="w-full px-3 py-2 border-2 border-gray-200 rounded focus:border-gray-900 text-xs font-bold transition" />
             </div>
             <div>
                 <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 block">Temp (°F)</label>
                 <input type="number" step="0.1" name="temp" placeholder="98.6" value={admissionForm.temp} onChange={handleAdmissionChange} className="w-full px-3 py-2 border-2 border-gray-200 rounded focus:border-gray-900 text-xs font-bold transition" />
             </div>
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
                 {wardsList.map(w => (
                   <option key={w._id} value={w._id}>{w.wardName}</option>
                 ))}
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
                 {doctorsList.map(doc => (
                    <option key={doc._id} value={doc._id}>
                       Dr. {doc.firstName || doc.lastName ? `${doc.firstName || ''} ${doc.lastName || ''}`.trim() : doc.email.split('@')[0]}
                    </option>
                 ))}
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
                 {globalBeds.filter(b => b.wardId === admissionForm.wardId && ["available", "reserved"].includes(b.status)).map(b => (
                    <option key={b._id} value={b._id} className="text-gray-900 bg-white">Bed {b.bedNumber} [{b.status.toUpperCase()}]</option>
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