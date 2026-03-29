import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { toast } from "react-toastify";
import { X } from "lucide-react";
import StatCard from "../../components/StatCard";
import Modal from "../../components/Modal";
import Button from "../../components/Button";
import PatientClinicalTable from "../../components/PatientClinicalTable";

const DoctorDashboard = () => {
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : {};
  const fallbackName = user.firstName ? `Dr. ${user.firstName} ${user.lastName}` : "Attending Doctor";
  const [patients, setPatients] = useState([]);
  const [activeDoctor] = useState({ name: fallbackName, specialty: "General Medicine" });
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHandoverOpen, setIsHandoverOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [handoverData, setHandoverData] = useState(null);
  const [handoverLoading, setHandoverLoading] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyDocs, setHistoryDocs] = useState([]);
  const [historyFilter, setHistoryFilter] = useState("all");
  const [editingCondition, setEditingCondition] = useState(false);
  const [tempCondition, setTempCondition] = useState("");

  const [newVitalsBp, setNewVitalsBp] = useState("");
  const [newVitalsHr, setNewVitalsHr] = useState("");
  const [newVitalsTemp, setNewVitalsTemp] = useState("");
  const [recordingVitals, setRecordingVitals] = useState(false);

  const [newMedication, setNewMedication] = useState("");
  const [addingMed, setAddingMed] = useState(false);

  const handoverPrintRef = useRef(null);

  const handleAddMedication = async () => {
    if (!newMedication.trim()) return toast.error("Please enter a medication name");
    
    setAddingMed(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL || "https://hackitects.onrender.com"}/api/patients/${selectedPatient.id}/medications`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ medication: newMedication })
      });
      if (res.ok) {
        toast.success("Medication added to patient profile");
        setNewMedication("");
      } else {
        toast.error("Failed to add medication");
      }
    } catch (e) {
      toast.error("Network Error adding medication");
    } finally {
      setAddingMed(false);
    }
  };

  const handleRecordVitals = async () => {
    if (!newVitalsBp.trim() || !newVitalsHr || !newVitalsTemp) {
      toast.error("Please fill out BP, HR, and Temp");
      return;
    }
    setRecordingVitals(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL || "https://hackitects.onrender.com"}/api/patients/${selectedPatient.id}/vitals`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bp: newVitalsBp, hr: Number(newVitalsHr), temp: Number(newVitalsTemp) })
      });
      if (res.ok) {
        toast.success("Vitals snapshot recorded successfully");
        setNewVitalsBp("");
        setNewVitalsHr("");
        setNewVitalsTemp("");
        // No need to manually fetchPatients() here as the SSE will trigger it globally on success!
      } else {
        toast.error("Failed to record vitals");
      }
    } catch (e) {
      toast.error("Network Error saving vitals");
    } finally {
      setRecordingVitals(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Not authenticated");
        return;
      }
      const res = await fetch(`${import.meta.env.VITE_API_URL || "https://hackitects.onrender.com"}/api/patients/my-patients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
         const data = await res.json();
         const sortedData = data.sort((a, b) => new Date(b.createdAt || b.admissionDate || 0) - new Date(a.createdAt || a.admissionDate || 0));
         const mapped = sortedData.map(p => ({
            id: p._id,
            name: p.patientName,
            bed: p.bed || 'Queue',
            ward: p.wardId?.wardName || 'Unassigned',
            age: p.age || 45,
            gender: p.gender || 'M',
            condition: p.primaryCondition || 'Undiagnosed',
            admissionDate: p.admissionDate ? p.admissionDate.split('T')[0] : 'Pending',
            status: p.status || 'admitted',
            vitals: p.vitals || { bp: '120/80', hr: 75, temp: '98.6°F' },
            vitalsHistory: p.vitalsHistory || [],
            meds: (p.medications && p.medications.length > 0) ? p.medications : (p.meds || ['Standard Care']),
            doctor: activeDoctor.name
         }));
         setPatients(mapped);
      } else {
         toast.error("Failed to load patient roster");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [activeDoctor]);

  useEffect(() => {
    const eventSource = new EventSource(`${import.meta.env.VITE_API_URL || "https://hackitects.onrender.com"}/api/events/stream`);

    const handleEvent = () => {
      fetchPatients();
    };

    eventSource.addEventListener("doctor-assigned", handleEvent);
    eventSource.addEventListener("patient-admitted", handleEvent);
    eventSource.addEventListener("patient-discharged", handleEvent);

    return () => {
      eventSource.removeEventListener("doctor-assigned", handleEvent);
      eventSource.removeEventListener("patient-admitted", handleEvent);
      eventSource.removeEventListener("patient-discharged", handleEvent);
      eventSource.close();
    };
  }, [activeDoctor]);

  useEffect(() => {
    if (selectedPatient) {
      const updatedMatch = patients.find(p => p.id === selectedPatient.id);
      if (updatedMatch && JSON.stringify(updatedMatch) !== JSON.stringify(selectedPatient)) {
        setSelectedPatient(updatedMatch);
      }
    }
  }, [patients]);

  const filteredPatients = patients; // Removing frontend doctor filtering as API only returns my patients

  const pendingClearancesCount = filteredPatients.filter(p => p.status === 'pending_clearance').length;
  const criticalCount = filteredPatients.filter(p => p.status === 'critical').length;

  const statsData = [
    { label: "My Active Patients", value: filteredPatients.length, subtext: "Total Clinical Load" },
    { label: "Pending Approvals", value: pendingClearancesCount, subtext: "Awaiting Discharge Review" },
    { label: "Critical Monitoring", value: criticalCount, subtext: "ICU & High Priority" },
  ];

  const handleReview = (patient) => {
    setSelectedPatient(patient);
    setIsModalOpen(true);
  };

  const updatePatientStatus = async (newStatus) => {
    try {
       const token = localStorage.getItem("token");
       const res = await fetch(`${import.meta.env.VITE_API_URL || "https://hackitects.onrender.com"}/api/patients/${selectedPatient.id}/status`, {
          method: "PUT",
          headers: {
             "Content-Type": "application/json",
             Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ status: newStatus })
       });
       if (res.ok) {
          toast.success("Status updated!");
          setPatients(prev => prev.map(p => p.id === selectedPatient.id ? { ...p, status: newStatus } : p));
          setSelectedPatient(prev => ({...prev, status: newStatus}));
          setIsModalOpen(false);
       }
    } catch (e) {
       toast.error("Failed to update status");
    }
  };

  const saveCondition = async () => {
    try {
       const token = localStorage.getItem("token");
       const res = await fetch(`${import.meta.env.VITE_API_URL || "https://hackitects.onrender.com"}/api/patients/${selectedPatient.id}/condition`, {
          method: "PUT",
          headers: {
             "Content-Type": "application/json",
             Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ condition: tempCondition })
       });
       if(res.ok) {
           toast.success("Primary condition successfully updated!");
           setPatients(prev => prev.map(p => p.id === selectedPatient.id ? { ...p, condition: tempCondition } : p));
           setSelectedPatient(prev => ({...prev, condition: tempCondition}));
           setEditingCondition(false);
       } else {
           toast.error("Failed to update diagnosis");
       }
    } catch(e) {
       toast.error("Network Error");
    }
  };


  const handleDeletePatient = async (id) => {
    if (window.confirm("Are you sure you want to completely remove this patient from the system? This action is irreversible.")) {
       try {
          const token = localStorage.getItem("token");
          const res = await fetch(`${import.meta.env.VITE_API_URL || "https://hackitects.onrender.com"}/api/patients/${id}`, { 
             method: "DELETE",
             headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
             toast.success("Patient record permanently removed.");
             setPatients(prev => prev.filter(p => p.id !== id));
          } else {
             toast.error("Failed to remove patient.");
          }
       } catch (e) {
          toast.error("Network error when removing patient.");
       }
    }
  };

  const handleGeneratePDF = useReactToPrint({
    contentRef: handoverPrintRef,
    content: () => handoverPrintRef.current,
    documentTitle: `Shift_Handover_${activeDoctor.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`,
  });

  const clinicalReportPrintRef = useRef(null);
  const handlePrintClinicalReport = useReactToPrint({
    contentRef: clinicalReportPrintRef,
    content: () => clinicalReportPrintRef.current,
    documentTitle: `Clinical_Report_${new Date().toISOString().split('T')[0]}`,
    onAfterPrint: () => setReportData(null),
  });

  const handleShareLink = () => {
     if(handoverData?.shareId) {
        navigator.clipboard.writeText(window.location.origin + "/shared-report/" + handoverData.shareId);
        toast.success("Secure Shift Handover Link copied to your clipboard!");
     } else {
        toast.error("Generate a report first to get a share id");
     }
  };

  const handleGenerateHandover = async () => {
    setIsHandoverOpen(true);
    setHandoverLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "https://hackitects.onrender.com"}/api/handover/all`);
      if (res.ok) {
         const data = await res.json();
         setHandoverData(data); 
      } else {
         toast.error("Failed to generate handover report from API.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Network error fetching handover.");
    } finally {
      setHandoverLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
       const res = await fetch(`${import.meta.env.VITE_API_URL || "https://hackitects.onrender.com"}/api/handover/history`);
       if(res.ok) {
           const data = await res.json();
           setHistoryDocs(data.history || []);
           setIsHistoryOpen(true);
       } else {
           toast.error("Failed to load shift history");
       }
    } catch(e) {
       console.error("Failed to parse history");
    }
  };

  const handleDeleteHandover = async (shareId, e) => {
    e.stopPropagation();
    if(!window.confirm("Are you sure you want to permanently delete this shift handover archive?")) return;
    try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || "https://hackitects.onrender.com"}/api/handover/history/${shareId}`, { method: "DELETE" });
        if (res.ok) {
           toast.success("Shift Snapshot successfully deleted.");
           setHistoryDocs(prev => prev.filter(d => d.shareId !== shareId));
        } else {
           toast.error("Failed to delete snapshot");
        }
    } catch(err) { toast.error("Network Error"); }
  };

  const loadHistoricalHandover = async (shareId) => {
    setIsHistoryOpen(false);
    setIsHandoverOpen(true);
    setHandoverLoading(true);
    try {
       const res = await fetch(`${import.meta.env.VITE_API_URL || "https://hackitects.onrender.com"}/api/handover/shared/${shareId}`);
       if(res.ok) {
           const data = await res.json();
           setHandoverData(data); 
       } else {
           toast.error("Failed to fetch shared snapshot");
           setIsHandoverOpen(false);
       }
    } catch(e) { toast.error("Network Error"); } 
    finally { setHandoverLoading(false); }
  };

  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center flex-1 h-[80vh]">
        <span className="text-xl font-extrabold text-gray-900 tracking-widest uppercase animate-pulse">Loading Clinical Data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-8 max-w-[1800px] mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-gray-200 pb-6">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900">CLINICAL COMMAND CENTER</h2>
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mt-2">Specialist Overview & Approvals</p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 items-start sm:items-center">
           <Button 
             variant="outline" 
             onClick={fetchHistory}
             className="w-full sm:w-auto text-xs font-extrabold uppercase tracking-widest border-2 border-gray-200 text-gray-900 hover:bg-gray-100 px-6 py-3 shadow-none transition-colors"
           >
             View Past Shifts
           </Button>
           <Button 
             variant="outline" 
             onClick={handleGenerateHandover}
             className="w-full sm:w-auto text-xs font-extrabold uppercase tracking-widest border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white px-6 py-3 shadow-none transition-colors"
           >
             Generate Live Handover
           </Button>
           <Button 
             variant="outline" 
             onClick={handleLogout}
             className="w-full sm:w-auto text-xs font-extrabold uppercase tracking-widest border-2 border-gray-200 text-gray-900 px-6 py-3 shadow-none transition-colors hover:bg-red-50 hover:text-red-900 hover:border-red-200"
           >
             Logout
           </Button>
        </div>
      </div>

      {/* Doctor Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statsData.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Patient Clinical Table */}
      <div className="w-full">
        <PatientClinicalTable patients={filteredPatients} onReview={handleReview} onReport={(patient, type) => setReportData({ patient, type })} onDelete={handleDeletePatient} />
      </div>

      {/* Complete Chart Review Modal */}
      {selectedPatient && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="CLINICAL REVIEW">
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-lg border-2 border-gray-200 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                  <h4 className="font-extrabold text-3xl text-gray-900 tracking-tight">{selectedPatient.name}</h4>
                  <span className={`inline-flex items-center px-4 py-2 rounded text-[10px] font-extrabold uppercase tracking-widest ${
                      selectedPatient.status === 'cleared_for_discharge' ? 'bg-gradient-to-r from-blue-950 to-blue-900 text-white shadow-sm' : 'bg-gray-100 border-2 border-gray-200 text-gray-800'
                  }`}>
                      {selectedPatient.status.replace(/_/g, ' ')}
                  </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                 <span className={`px-2 py-0.5 rounded shadow-sm text-[10px] font-extrabold uppercase tracking-widest text-center ${['cleared_for_discharge', 'discharged'].includes(selectedPatient.status) ? 'bg-gray-500 text-white' : 'bg-blue-600 text-white'}`}>
                    {['cleared_for_discharge', 'discharged'].includes(selectedPatient.status) 
                      ? 'OFFBOARDING / VACATED' 
                      : (selectedPatient.bed?.toString().toLowerCase() === 'queue' ? 'PENDING ASSIGNMENT' : `BED ${selectedPatient.bed}`)}
                 </span>
                 <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">
                    {['cleared_for_discharge', 'discharged'].includes(selectedPatient.status) ? 'TRANSIT / RELEASE' : selectedPatient.ward} • {selectedPatient.age} Y/O {selectedPatient.gender}
                 </p>
              </div>
              
              <div className="grid grid-cols-2 gap-8 mt-8 pt-8 border-t border-gray-100">
                <div>
                  <div className="flex justify-between items-center mb-1.5 pr-4">
                     <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Primary Diagnosis</p>
                     {!editingCondition && (
                        <button onClick={() => { setEditingCondition(true); setTempCondition(selectedPatient.condition); }} className="text-[9px] font-extrabold text-blue-600 hover:text-blue-900 uppercase tracking-wider">
                           Edit
                        </button>
                     )}
                  </div>
                  {editingCondition ? (
                     <div className="flex flex-col gap-2 mt-2">
                        <textarea 
                           className="w-full text-sm font-bold text-gray-900 border-2 border-gray-200 rounded p-3 focus:outline-none focus:border-gray-900 transition resize-none" 
                           rows="3" 
                           value={tempCondition} 
                           onChange={(e) => setTempCondition(e.target.value)} 
                        />
                        <div className="flex gap-2">
                           <Button onClick={saveCondition} className="py-2 px-4 shadow-none text-[10px] uppercase font-extrabold tracking-widest border-2 border-gray-900 bg-gray-900 text-white hover:bg-black">Save</Button>
                           <Button variant="outline" onClick={() => setEditingCondition(false)} className="py-2 px-4 shadow-none text-[10px] uppercase font-extrabold tracking-widest border-2 border-gray-200 hover:bg-gray-50">Cancel</Button>
                        </div>
                     </div>
                  ) : (
                     <p className="text-lg font-bold text-gray-900 leading-snug">{selectedPatient.condition}</p>
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Admitted On</p>
                  <p className="text-lg font-bold text-gray-900">{selectedPatient.admissionDate}</p>
                </div>
                <div className="col-span-2 bg-gray-50/50 p-5 rounded border-2 border-dashed border-gray-200 mt-2">
                  <div className="flex justify-between items-end mb-4">
                    <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Vitals History & Timeline</p>
                  </div>
                  
                  {/* Historical Log */}
                  {selectedPatient.vitalsHistory && selectedPatient.vitalsHistory.length > 0 ? (
                    <div className="flex flex-col gap-3 mb-6 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                       {selectedPatient.vitalsHistory.slice().reverse().map((v, i) => (
                          <div key={i} className="flex justify-between items-center bg-white p-3 rounded shadow-sm border border-gray-100">
                             <div className="flex gap-6 text-[10px] font-extrabold text-gray-400 tracking-widest uppercase">
                                 <p>BP: <span className="text-gray-900 text-sm">{v.bp}</span></p>
                                 <p>HR: <span className="text-gray-900 text-sm">{v.hr}</span></p>
                                 <p>TEMP: <span className="text-gray-900 text-sm">{v.temp}</span></p>
                             </div>
                             <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                {new Date(v.recordedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                             </p>
                          </div>
                       ))}
                    </div>
                  ) : (
                    <div className="flex gap-10 text-xs font-extrabold text-gray-400 tracking-widest uppercase mb-6 bg-white p-4 rounded shadow-sm border border-gray-100">
                      <p>Blood Pressure: <span className="text-gray-900 text-base">{selectedPatient.vitals.bp}</span></p>
                      <p>Heart Rate: <span className="text-gray-900 text-base">{selectedPatient.vitals.hr}</span></p>
                      <p>Temperature: <span className="text-gray-900 text-base">{selectedPatient.vitals.temp}</span></p>
                    </div>
                  )}

                  {/* Add New Vitals Inline Form */}
                  <div className="grid grid-cols-4 gap-3 bg-white p-4 rounded shadow-sm border border-gray-200 items-end">
                     <div>
                       <label className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest block mb-1">Blood Pressure</label>
                       <input type="text" placeholder="120/80" value={newVitalsBp} onChange={e => setNewVitalsBp(e.target.value)} className="w-full border-2 border-gray-200 rounded px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-gray-900 transition" />
                     </div>
                     <div>
                       <label className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest block mb-1">Heart Rate</label>
                       <input type="number" placeholder="75" value={newVitalsHr} onChange={e => setNewVitalsHr(e.target.value)} className="w-full border-2 border-gray-200 rounded px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-gray-900 transition" />
                     </div>
                     <div>
                       <label className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest block mb-1">Temp (°F/C)</label>
                       <input type="number" step="0.1" placeholder="98.6" value={newVitalsTemp} onChange={e => setNewVitalsTemp(e.target.value)} className="w-full border-2 border-gray-200 rounded px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-gray-900 transition" />
                     </div>
                     <Button onClick={handleRecordVitals} disabled={recordingVitals} className="w-full py-2.5 px-3 text-[10px] font-extrabold tracking-widest uppercase shadow-none bg-blue-900 hover:bg-blue-950 border-none transition-colors disabled:opacity-50 text-white">
                        {recordingVitals ? "Saving..." : "+ Record"}
                     </Button>
                  </div>
                </div>
                <div className="col-span-2 mt-2">
                  <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-3">Active Medications</p>
                  <ul className="flex flex-col gap-2 mb-4">
                      {selectedPatient.meds.map((m, i) => (
                        <li key={i} className="text-sm font-bold text-gray-800 flex items-center gap-3">
                          <span className="w-1.5 h-1.5 rounded-sm bg-gradient-to-r from-blue-950 to-blue-900" /> {m}
                        </li>
                      ))}
                  </ul>
                  <div className="flex gap-2">
                     <input 
                       type="text" 
                       placeholder="e.g. Paracetamol 500mg" 
                       value={newMedication} 
                       onChange={(e) => setNewMedication(e.target.value)} 
                       className="flex-1 border-2 border-gray-200 rounded px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-gray-900 transition" 
                       onKeyDown={(e) => { if(e.key === 'Enter') handleAddMedication(); }}
                     />
                     <Button 
                       onClick={handleAddMedication} 
                       disabled={addingMed} 
                       className="py-2 px-6 shadow-none text-[10px] uppercase font-extrabold tracking-widest bg-gray-900 text-white hover:bg-black transition-colors border-2 border-gray-900"
                     >
                       {addingMed ? "Adding..." : "+ Add"}
                     </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-4">Physician Actions</p>
              <div className="flex flex-col gap-3">
                 <label className="text-[10px] font-extrabold text-gray-900 uppercase tracking-widest block">Update Clinical Status</label>
                 <select 
                    value={selectedPatient.status}
                    onChange={(e) => updatePatientStatus(e.target.value)}
                    className="w-full pl-4 pr-4 py-3 border-2 border-gray-200 rounded focus:ring-0 focus:border-gray-900 outline-none transition text-sm font-bold text-gray-900 bg-white shadow-sm"
                 >
                    <option value="admitted">Admitted (Standard Care)</option>
                    <option value="critical">Critical / ICU Observation</option>
                    <option value="pending_clearance">Pending Medical Clearance</option>
                    <option value="cleared_for_discharge">Cleared for Discharge</option>
                 </select>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Patient Report Modal */}
      {reportData && (
        <Modal isOpen={!!reportData} onClose={() => setReportData(null)} title={reportData.type === 'discharge' ? `DISCHARGE SUMMARY: ${reportData.patient.name}` : `CLINICAL HISTORY: ${reportData.patient.name}`}>
          <div className="space-y-6">
             <div ref={clinicalReportPrintRef} className="bg-white border md:border-gray-200 p-8 rounded relative min-h-[400px] print:p-8 print:w-full font-sans">
                <div className="flex justify-between items-start mb-6 border-b border-gray-200 pb-4">
                   <div>
                     <h3 className="text-xl font-extrabold text-gray-900 uppercase tracking-tight">{reportData.patient.name}</h3>
                     <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">ID: {reportData.patient.id} • Bed Nbr: {reportData.patient.bed}</p>
                   </div>
                   <div className="text-right">
                     <p className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest">Document Generated On</p>
                     <p className="text-sm font-black text-gray-900">{new Date().toLocaleString()}</p>
                   </div>
                </div>

                <div className="space-y-6">
                   <div>
                      <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5 border-b border-gray-100 pb-1">Primary Clinical Diagnosis</p>
                      <p className="text-sm font-bold text-gray-900">{reportData.patient.condition}</p>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                        <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5 border-b border-gray-100 pb-1">Historical Vitals Snapshot</p>
                        <p className="text-xs font-extrabold text-gray-900 uppercase tracking-wide">BP: <span className="font-bold">{reportData.patient.vitals.bp}</span> | HR: <span className="font-bold">{reportData.patient.vitals.hr}</span> | TEMP: <span className="font-bold">{reportData.patient.vitals.temp}</span></p>
                     </div>
                     <div>
                        <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5 border-b border-gray-100 pb-1">Attending Specialist</p>
                        <p className="text-xs font-bold text-gray-900 uppercase tracking-wide">{reportData.patient.doctor}</p>
                     </div>
                   </div>
                   <div>
                      <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5 border-b border-gray-100 pb-1">Active Medical Treatment Plan</p>
                      <ul className="flex flex-col gap-1.5 mt-2">
                        {reportData.patient.meds.map((m, i) => <li key={i} className="text-xs font-bold text-gray-800 flex gap-2 items-center"><div className="w-1 h-1 bg-gray-900 rounded-sm"></div> {m}</li>)}
                      </ul>
                   </div>
                   {reportData.type === 'discharge' && (
                     <div className="mt-8 pt-6 border-t border-gray-200">
                        <p className="text-[10px] font-extrabold text-gray-900 uppercase tracking-widest mb-2.5">Official Discharge Instructions</p>
                        <p className="text-xs font-bold text-gray-600 leading-relaxed max-w-2xl bg-gray-50 p-4 border-l-4 border-gray-900">Patient is advised to maintain adequate rest and follow up in the Outpatient Department (OPD) after 7 days. Continue all prescribed daily medications strictly as directed. In case of unexpected emergency or onset of new acute symptoms, report immediately to the clinical facility.</p>
                     </div>
                   )}

                   <div className="mt-12 pt-8 text-center border-t border-gray-200">
                      <p className="text-[9px] text-gray-400 font-extrabold tracking-widest uppercase">
                         /// VERIFIED BY WARDWATCH SYSTEM ///
                      </p>
                   </div>
                </div>
             </div>
             
             <div className="flex justify-end pt-2">
                <Button 
                   onClick={() => { 
                      toast.success(`Initializing secure PDF engine...`); 
                      handlePrintClinicalReport();
                   }} 
                   className="px-6 py-3 bg-gray-900 hover:bg-black text-white text-[10px] font-extrabold uppercase tracking-widest shadow-none border-none"
                >
                   Print / Export PDF
                </Button>
             </div>
          </div>
        </Modal>
      )}

      {/* Shift Handover Report Modal */}
      <Modal isOpen={isHandoverOpen} onClose={() => setIsHandoverOpen(false)} title="SHIFT HANDOVER & REPORTING STATUS" maxWidth="max-w-[95vw]">
        {handoverLoading ? (
           <div className="flex flex-col justify-center items-center py-16">
               <span className="text-sm font-extrabold text-gray-900 tracking-widest uppercase animate-pulse">Compiling Shift Notes...</span>
           </div>
        ) : !handoverData ? (
           <div className="flex justify-center items-center py-16 text-xs font-bold text-gray-500 uppercase tracking-widest">
              Handover record is not available.
           </div>
        ) : (
        <div className="space-y-6 relative">
          <div className="flex justify-between items-start gap-4">
            <p className="text-[11px] text-gray-500 uppercase tracking-widest font-bold leading-relaxed flex-1">
              Please review the generated shift handover note below. You can download this document as a PDF to append to the central clinical records, or copy a secure view link to share dynamically.
            </p>
            <button 
              onClick={() => setIsHandoverOpen(false)}
              className="p-1.5 text-gray-400 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
              title="Close Handover Report"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="-mx-6 px-4 md:px-6 py-4 max-h-[60vh] overflow-y-auto print:max-h-none print:overflow-visible">
             <div ref={handoverPrintRef} id="handover-print-area" className="bg-white text-gray-900 p-8 md:p-14 w-full mx-auto print:p-8 print:w-full print:bg-white min-h-[500px] font-sans">
                 {/* HEADER */}
                 <div className="flex justify-between items-start border-b-2 border-gray-900 pb-8 mb-10">
                     <div>
                         <h1 className="text-4xl font-extrabold uppercase tracking-tight text-gray-900 m-0">Shift Handover Note</h1>
                         <h2 className="text-xs text-gray-500 mt-3 font-extrabold tracking-widest uppercase m-0">WardWatch Clinical System</h2>
                         <p className="text-[10px] text-gray-400 mt-1 font-bold tracking-widest uppercase m-0">Signature Ref: {handoverData.shareId || 'LOCAL-PRINT'}</p>
                     </div>
                     <div className="text-right">
                         <p className="text-xs font-extrabold bg-gray-900 text-white px-4 py-2 inline-block rounded uppercase tracking-widest mb-3">
                             {handoverData.archivedShiftName || "Live Ad-Hoc Report"}
                         </p>
                         <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest block m-0">
                             Snapshot Logged: <span className="text-gray-900">{new Date(handoverData.generatedAt).toLocaleString()}</span>
                         </p>
                         <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest block mt-1 m-0">
                             Attending: <span className="text-gray-900">{activeDoctor.name}</span>
                         </p>
                     </div>
                 </div>

                 {/* WARD STATS */}
                 <div className="mb-10">
                     <h3 className="text-sm font-extrabold border-b border-gray-200 pb-3 mb-5 text-gray-900 uppercase tracking-widest">Active Ward Operational Capacity</h3>
                     <div className="flex border border-gray-200 rounded overflow-hidden">
                         <div className="flex-1 p-5 border-r border-gray-200 bg-gray-50 text-center">
                             <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest m-0">Census</p>
                             <p className="text-3xl font-black text-gray-900 mt-2 mb-1 tracking-tighter">{handoverData.stats?.occupiedBeds || 0} / {handoverData.stats?.totalBeds || 0}</p>
                             <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest m-0">Occupied Seats</p>
                         </div>
                         <div className="flex-1 p-5 border-r border-gray-200 text-center bg-white">
                            <p className="text-[10px] font-extrabold text-red-600 uppercase tracking-widest m-0">Critical</p>
                            <p className="text-3xl font-black text-red-600 mt-2 mb-1 tracking-tighter">{handoverData.stats?.criticalEscalations || 0}</p>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest m-0">Active Hazards</p>
                         </div>
                         <div className="flex-1 p-5 border-r border-gray-200 text-center bg-gray-50">
                            <p className="text-[10px] font-extrabold text-orange-600 uppercase tracking-widest m-0">Admitting</p>
                            <p className="text-3xl font-black text-orange-600 mt-2 mb-1 tracking-tighter">{handoverData.stats?.pendingAdmissions || 0}</p>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest m-0">Queue Backlog</p>
                         </div>
                         <div className="flex-1 p-5 text-center bg-white">
                            <p className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest m-0">Discharges</p>
                            <p className="text-3xl font-black text-blue-600 mt-2 mb-1 tracking-tighter">{handoverData.stats?.pendingDischarges || 0}</p>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest m-0">Expected Release</p>
                         </div>
                     </div>
                 </div>

                 {/* STAFF ROSTER */}
                 <div className="mb-10 page-break-inside-avoid">
                     <h3 className="text-sm font-extrabold border-b border-gray-200 pb-3 mb-5 text-gray-900 uppercase tracking-widest">On-Duty Medical Personnel</h3>
                     <div className="grid grid-cols-2 gap-8 print:grid-cols-2">
                        <div className="border border-gray-200 rounded bg-gray-50 overflow-hidden">
                            <div className="bg-gray-100 px-5 py-3 border-b border-gray-200">
                               <p className="text-[10px] font-extrabold text-gray-900 uppercase tracking-widest m-0">Attending Physicians ({handoverData.staff?.doctors?.length || 0})</p>
                            </div>
                            <div className="p-5">
                                {handoverData.staff?.doctors?.length > 0 ? (
                                   <ul className="space-y-3 m-0 p-0 list-none">
                                      {handoverData.staff.doctors.map((doc, i) => (
                                         <li key={`doc-${i}`} className="text-sm font-bold text-gray-900 m-0 leading-tight">
                                            Dr. {doc.firstName} {doc.lastName} <span className="text-[10px] text-gray-500 block mt-1 uppercase tracking-widest">{doc.specialty || 'General'}</span>
                                         </li>
                                      ))}
                                   </ul>
                                ) : <p className="text-xs font-bold text-gray-400 uppercase tracking-widest m-0">No assigned doctors.</p>}
                            </div>
                        </div>
                        <div className="border border-gray-200 rounded bg-gray-50 overflow-hidden">
                            <div className="bg-gray-100 px-5 py-3 border-b border-gray-200">
                               <p className="text-[10px] font-extrabold text-gray-900 uppercase tracking-widest m-0">Nursing Staff ({handoverData.staff?.nurses?.length || 0})</p>
                            </div>
                            <div className="p-5">
                                {handoverData.staff?.nurses?.length > 0 ? (
                                   <ul className="space-y-3 m-0 p-0 list-none">
                                      {handoverData.staff.nurses.map((nurse, i) => (
                                         <li key={`nurse-${i}`} className="text-sm font-bold text-gray-900 m-0 leading-tight">
                                            {nurse.firstName} {nurse.lastName} <span className="text-[10px] text-gray-500 block mt-1 uppercase tracking-widest">{nurse.assignedBeds?.length ? `Assigned Coverage: ${nurse.assignedBeds.length} beds` : 'Roving Support Float'}</span>
                                         </li>
                                      ))}
                                   </ul>
                                ) : <p className="text-xs font-bold text-gray-400 uppercase tracking-widest m-0">No assigned nurses.</p>}
                            </div>
                        </div>
                     </div>
                 </div>

                 {/* CRITICAL ALERTS */}
                 {(handoverData.escalations?.critical?.length > 0 || handoverData.escalations?.warnings?.length > 0) && (
                     <div className="mb-10 page-break-inside-avoid">
                         <h3 className="text-sm font-extrabold border-b border-gray-200 pb-3 mb-5 text-red-700 uppercase tracking-widest">Shift Anomalies & Operational Escalations</h3>
                         <div className="space-y-4">
                            {handoverData.escalations?.critical?.map((e, i) => (
                                <div key={`crit-${i}`} className="border-l-4 border-red-600 bg-red-50 p-5 flex justify-between items-start shadow-sm">
                                    <div>
                                        <span className="inline-block text-[9px] font-extrabold text-red-900 uppercase tracking-widest bg-red-200 px-2 py-1 rounded-sm mr-2 mb-2">{e.type.replace(/-/g, ' ')}</span>
                                        <span className="text-sm font-bold text-gray-900 leading-snug block">{e.description || "System flagged an actionable escalation."}</span>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2 m-0">Location Anchor: {(e.wardId && e.wardId.wardName) ? e.wardId.wardName : "Global Queue"} — Bed {(e.relatedBedId && e.relatedBedId.bedNumber) ? e.relatedBedId.bedNumber : "Unassigned"}</p>
                                    </div>
                                    <span className="text-[10px] font-extrabold text-gray-500 tracking-widest whitespace-nowrap">{new Date(e.createdAt).toLocaleTimeString()}</span>
                                </div>
                            ))}
                            {handoverData.escalations?.warnings?.map((e, i) => (
                                <div key={`warn-${i}`} className="border-l-4 border-orange-500 bg-orange-50 p-5 flex justify-between items-start shadow-sm">
                                    <div>
                                        <span className="inline-block text-[9px] font-extrabold text-orange-900 uppercase tracking-widest bg-orange-200 px-2 py-1 rounded-sm mr-2 mb-2">{e.type.replace(/-/g, ' ')}</span>
                                        <span className="text-sm font-bold text-gray-900 leading-snug block">{e.description || "System flagged a workflow delay."}</span>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2 m-0">Location Anchor: {(e.wardId && e.wardId.wardName) ? e.wardId.wardName : "Global Queue"} — Bed {(e.relatedBedId && e.relatedBedId.bedNumber) ? e.relatedBedId.bedNumber : "Unassigned"}</p>
                                    </div>
                                    <span className="text-[10px] font-extrabold text-gray-500 tracking-widest whitespace-nowrap">{new Date(e.createdAt).toLocaleTimeString()}</span>
                                </div>
                            ))}
                         </div>
                     </div>
                 )}

                 {/* ACTIVE PATIENT ROSTER */}
                 <div className="mb-10">
                     <h3 className="text-sm font-extrabold border-b border-gray-200 pb-3 mb-5 text-gray-900 uppercase tracking-widest">Admitted Patient Demographics ({handoverData.activePatients?.length || 0})</h3>
                     {handoverData.activePatients && handoverData.activePatients.length > 0 ? (
                         <table className="w-full text-left border-collapse border border-gray-200 print:text-sm text-gray-900 shadow-sm">
                             <thead className="bg-gray-100">
                                 <tr>
                                     <th className="border-b border-gray-200 p-4 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 w-1/4">Reference Identity</th>
                                     <th className="border-b border-gray-200 p-4 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 w-1/4">Location Vector</th>
                                     <th className="border-b border-gray-200 p-4 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 w-1/2">Diagnostic Remarks</th>
                                 </tr>
                             </thead>
                             <tbody className="divide-y divide-gray-100">
                                 {handoverData.activePatients.map((p, i) => (
                                     <tr key={`p-${i}`} className="hover:bg-gray-50 align-top transition">
                                         <td className="p-4">
                                             <p className="font-extrabold text-sm text-gray-900 m-0">{p.patientName}</p>
                                             <p className="text-[9px] text-gray-400 m-0 mt-1 uppercase tracking-widest font-extrabold">Logged: {new Date(p.admissionDate).toLocaleDateString()}</p>
                                         </td>
                                         <td className="p-4">
                                             <p className="text-xs font-bold text-gray-900 uppercase tracking-widest m-0">{p.wardName}</p>
                                             <p className="text-[10px] text-gray-500 m-0 mt-1 font-extrabold tracking-widest">BED MAP: {p.bedNumber}</p>
                                         </td>
                                         <td className="p-4 pr-6 whitespace-pre-wrap">
                                             <span className="text-xs font-bold text-gray-700 leading-relaxed block">{p.condition}</span>
                                         </td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                     ) : <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest m-0">No active patients actively mapped in system.</p>}
                 </div>

                 {/* ADMISSIONS & DISCHARGES */}
                 <div className="grid grid-cols-2 gap-8 print:grid-cols-2 mb-10 page-break-inside-avoid">
                     {/* INCOMING */}
                     <div>
                         <h3 className="text-sm font-extrabold border-b border-gray-200 pb-3 mb-5 text-gray-900 uppercase tracking-widest">Inbound Queue ({handoverData.admissions?.length || 0})</h3>
                         {handoverData.admissions && handoverData.admissions.length > 0 ? (
                             <ul className="border border-gray-200 rounded divide-y divide-gray-100 m-0 p-0 list-none bg-white shadow-sm">
                                 {handoverData.admissions.map((adm, i) => (
                                     <li key={`adm-${i}`} className="p-4 text-sm flex justify-between items-center bg-white hover:bg-gray-50 transition">
                                         <div>
                                             <span className="font-extrabold block text-gray-900 uppercase tracking-wide m-0 text-xs">{adm.patientId?.patientName || "Unknown"}</span>
                                             <span className="text-[10px] font-bold block text-gray-500 m-0 mt-1 uppercase tracking-wider">{adm.patientId?.primaryCondition || "Evaluation Pend"}</span>
                                         </div>
                                         <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-1 rounded shadow-sm whitespace-nowrap ${adm.priority === 'emergency' ? 'bg-red-600 text-white border border-red-700' : 'bg-gray-200 text-gray-800'}`}>{adm.priority}</span>
                                     </li>
                                 ))}
                             </ul>
                         ) : <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest m-0">No active pipeline.</p>}
                     </div>

                     {/* DISCHARGES */}
                     <div>
                         <h3 className="text-sm font-extrabold border-b border-gray-200 pb-3 mb-5 text-gray-900 uppercase tracking-widest">Expected Release ({handoverData.discharges?.length || 0})</h3>
                         {handoverData.discharges && handoverData.discharges.length > 0 ? (
                             <ul className="border border-gray-200 rounded divide-y divide-gray-100 m-0 p-0 list-none bg-white shadow-sm">
                                 {handoverData.discharges.map((d, i) => (
                                     <li key={`dch-${i}`} className="p-4 text-sm flex justify-between items-center bg-white hover:bg-gray-50 transition">
                                         <span className="font-extrabold text-gray-900 uppercase tracking-wide m-0 text-xs">{d.patientId?.patientName}</span>
                                         <span className="text-[9px] font-extrabold text-blue-900 bg-blue-100 border border-blue-200 px-2 py-1 rounded shadow-sm whitespace-nowrap uppercase tracking-widest">
                                             {d.expectedDischargeDate ? new Date(d.expectedDischargeDate).toLocaleDateString() : 'Awaiting Orders'}
                                         </span>
                                     </li>
                                 ))}
                             </ul>
                         ) : <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest m-0">No active departure queue.</p>}
                     </div>
                 </div>

                 {/* FOOTER */}
                 <div className="text-center pt-10 border-t border-gray-200 text-[10px] text-gray-400 font-extrabold tracking-widest uppercase page-break-before-auto">
                     <p className="m-0 py-2">/// SECURE END OF HANDOVER TRANSMISSION ///</p>
                     <p className="mt-2 text-[9px] font-bold tracking-widest text-gray-300 m-0 uppercase flex items-center justify-center gap-2">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block"></span>
                        Verified By WardWatch System
                     </p>
                 </div>
             </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
             <Button 
               variant="primary" 
               onClick={handleGeneratePDF}
               className="flex-1 py-4 text-xs font-extrabold uppercase tracking-widest"
             >
               Print / Export PDF
             </Button>
             <Button 
               variant="outline" 
               onClick={handleShareLink}
               className="flex-1 py-4 text-xs font-extrabold uppercase tracking-widest text-gray-700 bg-white border-2 border-gray-200 hover:border-gray-900"
             >
               Copy Share Link
             </Button>
          </div>
        </div>
        )}
      </Modal>

      {/* Historical Shifts Modal */}
      <Modal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} title="SHIFT HANDOVER CONTINUITY LOG">
         <div className="space-y-4">
            <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest leading-relaxed mb-2">
               Access previously generated automated hospital shift snapshots to maintain immutable handover continuity.
            </p>
            
            <div className="flex gap-2 mb-4 bg-gray-50 p-2 rounded border border-gray-100 w-max">
               <button onClick={() => setHistoryFilter('12h')} className={`text-[9px] px-4 py-1.5 rounded uppercase font-extrabold tracking-widest transition-colors ${historyFilter === '12h' ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'}`}>Past 12h</button>
               <button onClick={() => setHistoryFilter('24h')} className={`text-[9px] px-4 py-1.5 rounded uppercase font-extrabold tracking-widest transition-colors ${historyFilter === '24h' ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'}`}>Past 24h</button>
               <button onClick={() => setHistoryFilter('all')} className={`text-[9px] px-4 py-1.5 rounded uppercase font-extrabold tracking-widest transition-colors ${historyFilter === 'all' ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'}`}>All Time</button>
            </div>

            {(() => {
               const filteredDocs = historyDocs.filter(doc => {
                  if (historyFilter === "all") return true;
                  const hoursAgo = (new Date() - new Date(doc.generatedAt)) / (1000 * 60 * 60);
                  if (historyFilter === "12h") return hoursAgo <= 12;
                  if (historyFilter === "24h") return hoursAgo <= 24;
                  return true;
               });
               return filteredDocs.length > 0 ? (
                  <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                     {filteredDocs.map((doc, i) => (
                        <div key={i} className="flex justify-between items-center p-4 border border-gray-200 rounded-sm hover:border-gray-900 hover:shadow-sm transition cursor-pointer bg-white" onClick={() => loadHistoricalHandover(doc.shareId)}>
                           <div>
                              <p className="text-xs font-extrabold tracking-widest uppercase text-gray-900">{doc.shiftName}</p>
                              <p className="text-[9px] font-bold text-gray-500 uppercase mt-1">{new Date(doc.generatedAt).toLocaleString()}</p>
                           </div>
                           <div className="flex gap-2">
                              <Button variant="outline" className="text-[9px] px-4 py-2 uppercase font-extrabold tracking-widest shadow-none hover:bg-gray-900 hover:text-white hover:border-gray-900">View</Button>
                              <Button variant="outline" onClick={(e) => handleDeleteHandover(doc.shareId, e)} className="text-[9px] px-3 py-2 uppercase font-extrabold tracking-widest text-red-600 border-gray-200 hover:border-red-200 hover:bg-red-50 hover:text-red-700 shadow-none"><X size={14} strokeWidth={2.5} /></Button>
                           </div>
                        </div>
                     ))}
                  </div>
               ) : (
                  <div className="p-8 text-center bg-gray-50 border border-gray-100 rounded">
                     <p className="text-xs font-extrabold tracking-widest uppercase text-gray-500">No shift archives located for this timeframe.</p>
                  </div>
               );
            })()}
            <div className="flex justify-end pt-4 border-t border-gray-100">
               <Button variant="outline" onClick={() => setIsHistoryOpen(false)} className="text-[10px] uppercase font-extrabold tracking-widest px-6 shadow-none">Close</Button>
            </div>
         </div>
      </Modal>

    </div>
  );
};
export default DoctorDashboard;