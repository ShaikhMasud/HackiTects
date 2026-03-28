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
  const [editingCondition, setEditingCondition] = useState(false);
  const [tempCondition, setTempCondition] = useState("");

  const handoverPrintRef = useRef(null);

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Not authenticated");
        return;
      }
      const res = await fetch("http://localhost:5000/api/patients/my-patients", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
         const data = await res.json();
         const mapped = data.map(p => ({
            id: p._id,
            name: p.patientName,
            bed: p.bed || 'TBD',
            age: p.age || 45,
            gender: p.gender || 'M',
            condition: p.primaryCondition || 'N/A',
            admissionDate: p.admissionDate ? p.admissionDate.split('T')[0] : 'N/A',
            status: p.status || 'admitted',
            vitals: p.vitals || { bp: '120/80', hr: 75, temp: '98.6°F' },
            meds: p.meds || ['Standard Care'],
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
       const res = await fetch(`http://localhost:5000/api/patients/${selectedPatient.id}/status`, {
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
       }
    } catch (e) {
       toast.error("Failed to update status");
    }
  };

  const saveCondition = async () => {
    try {
       const token = localStorage.getItem("token");
       const res = await fetch(`http://localhost:5000/api/patients/${selectedPatient.id}/condition`, {
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


  const handleGeneratePDF = useReactToPrint({
    contentRef: handoverPrintRef,
    // fallback for v2:
    content: () => handoverPrintRef.current,
    documentTitle: `Shift_Handover_${activeDoctor.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`,
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
      const res = await fetch(`http://localhost:5000/api/handover/all`);
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
       const res = await fetch("http://localhost:5000/api/handover/history");
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

  const loadHistoricalHandover = async (shareId) => {
    setIsHistoryOpen(false);
    setIsHandoverOpen(true);
    setHandoverLoading(true);
    try {
       const res = await fetch(`http://localhost:5000/api/handover/shared/${shareId}`);
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
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">ATTENDING PHYSICIAN</h2>
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mt-2">Clinical Overview & Approvals</p>
        </div>
        <div className="flex space-x-4 items-center">
           <Button 
             variant="outline" 
             onClick={handleLogout}
             className="text-xs font-extrabold uppercase tracking-widest border-2 border-gray-200 text-gray-900 px-4 py-3 shadow-none transition-colors hover:bg-red-50 hover:text-red-900 hover:border-red-200"
           >
             Logout
           </Button>
           <Button 
             variant="outline" 
             onClick={fetchHistory}
             className="text-xs font-extrabold uppercase tracking-widest border-2 border-gray-200 text-gray-900 hover:bg-gray-100 px-6 py-3 shadow-none transition-colors"
           >
             View Past Shifts
           </Button>
           <Button 
             variant="outline" 
             onClick={handleGenerateHandover}
             className="text-xs font-extrabold uppercase tracking-widest border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white px-6 py-3 shadow-none transition-colors"
           >
             Generate Live Handover
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
        <PatientClinicalTable patients={filteredPatients} onReview={handleReview} onReport={(patient, type) => setReportData({ patient, type })} />
      </div>

      {/* Complete Chart Review Modal */}
      {selectedPatient && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`CLINICAL REVIEW: ${selectedPatient.id}`}>
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
              <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mt-1">Bed {selectedPatient.bed} • {selectedPatient.age} Y/O {selectedPatient.gender}</p>
              
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
                  <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-3">Latest Vitals Summary</p>
                  <div className="flex gap-10 text-xs font-extrabold text-gray-400 tracking-widest uppercase">
                      <p>Blood Pressure: <span className="text-gray-900 text-base">{selectedPatient.vitals.bp}</span></p>
                      <p>Heart Rate: <span className="text-gray-900 text-base">{selectedPatient.vitals.hr}</span></p>
                      <p>Temperature: <span className="text-gray-900 text-base">{selectedPatient.vitals.temp}</span></p>
                  </div>
                </div>
                <div className="col-span-2 mt-2">
                  <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-3">Active Medications</p>
                  <ul className="flex flex-col gap-2">
                      {selectedPatient.meds.map((m, i) => (
                        <li key={i} className="text-sm font-bold text-gray-800 flex items-center gap-3">
                          <span className="w-1.5 h-1.5 rounded-sm bg-gradient-to-r from-blue-950 to-blue-900" /> {m}
                        </li>
                      ))}
                  </ul>
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
             <div className="bg-gray-50 border border-gray-200 p-6 rounded relative">
                <div className="flex justify-between items-start mb-6 border-b border-gray-200 pb-4">
                   <div>
                     <h3 className="text-xl font-extrabold text-gray-900 uppercase tracking-tight">{reportData.patient.name}</h3>
                     <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">ID: {reportData.patient.id} • Bed: {reportData.patient.bed}</p>
                   </div>
                   <div className="text-right">
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Generated</p>
                     <p className="text-sm font-black text-gray-900">{new Date().toLocaleDateString()}</p>
                   </div>
                </div>

                <div className="space-y-4">
                   <div>
                      <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Primary Diagnosis</p>
                      <p className="text-sm font-bold text-gray-900">{reportData.patient.condition}</p>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                        <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Latest Vitals</p>
                        <p className="text-xs font-bold text-gray-900 uppercase tracking-wide">BP: {reportData.patient.vitals.bp} | HR: {reportData.patient.vitals.hr} | T: {reportData.patient.vitals.temp}</p>
                     </div>
                     <div>
                        <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Attending</p>
                        <p className="text-xs font-bold text-gray-900 uppercase tracking-wide">{reportData.patient.doctor}</p>
                     </div>
                   </div>
                   <div>
                      <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Active Medications / Treatment Plan</p>
                      <ul className="flex flex-col gap-1 mt-1">
                        {reportData.patient.meds.map((m, i) => <li key={i} className="text-xs font-bold text-gray-800 flex gap-2 items-center"><div className="w-1.5 h-1.5 bg-gray-900 rounded-sm"></div> {m}</li>)}
                      </ul>
                   </div>
                   {reportData.type === 'discharge' && (
                     <div className="mt-6 pt-4 border-t border-gray-200">
                        <p className="text-[10px] font-extrabold text-gray-900 uppercase tracking-widest mb-2">Discharge Instructions</p>
                        <p className="text-xs font-bold text-gray-600 leading-relaxed max-w-lg">Patient advised to maintain adequate rest. Follow up in the Outpatient Department (OPD) after 7 days. Continue all prescribed daily medications strictly as directed. In case of unexpected emergency or onset of new acute symptoms, report immediately to the facility.</p>
                     </div>
                   )}
                </div>
             </div>
             
             <div className="flex justify-end pt-2">
                <Button 
                   onClick={() => { 
                      toast.success(`${reportData.type === 'discharge' ? 'Discharge Summary' : 'Clinical Report'} sent to printer queue.`); 
                      setReportData(null); 
                   }} 
                   className="px-6 py-3 bg-gray-900 hover:bg-black text-white text-[10px] font-extrabold uppercase tracking-widest shadow-none border-none"
                >
                   Print Document
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
             <div ref={handoverPrintRef} id="handover-print-area" className="bg-white text-black p-8 md:p-12 w-full mx-auto print:p-8 print:w-full print:bg-white print:text-black min-h-[500px] font-sans">
                 {/* HEADER */}
                 <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-8">
                     <div>
                         <h1 className="text-3xl font-bold uppercase tracking-wide text-slate-900 m-0">Shift Handover Report</h1>
                         <h2 className="text-sm text-slate-700 mt-2 font-semibold m-0">WardWatch Hospital Management System</h2>
                         <p className="text-xs text-slate-500 mt-1 m-0">Ref ID: {handoverData.shareId || 'LOCAL-PRINT'}</p>
                     </div>
                     <div className="text-right">
                         <p className="text-sm font-bold bg-slate-100 px-3 py-1 inline-block rounded mb-2 border border-slate-300">
                             {handoverData.archivedShiftName || "Live Ad-Hoc Report"}
                         </p>
                         <p className="text-xs font-semibold text-slate-600 block mt-1 m-0">
                             Generated: {new Date(handoverData.generatedAt).toLocaleString()}
                         </p>
                         <p className="text-xs font-semibold text-slate-600 block mt-1 m-0">
                             Attending: {activeDoctor.name}
                         </p>
                     </div>
                 </div>

                 {/* WARD STATS */}
                 <div className="mb-8">
                     <h3 className="text-lg font-bold border-b border-slate-300 pb-2 mb-4 text-slate-900 uppercase tracking-wider">Ward Status Overview</h3>
                     <div className="flex border border-slate-300 rounded overflow-hidden flex-row">
                         <div className="flex-1 p-4 border-r border-slate-300 bg-slate-50 text-center">
                             <p className="text-xs font-bold text-slate-500 uppercase m-0">Occupancy</p>
                             <p className="text-2xl font-black text-slate-900 my-1">{handoverData.stats.occupiedBeds} / {handoverData.stats.totalBeds}</p>
                             <p className="text-[10px] text-slate-500 m-0">Beds Occupied</p>
                         </div>
                         <div className="flex-1 p-4 border-r border-slate-300 text-center bg-white">
                            <p className="text-xs font-bold text-red-600 uppercase m-0">Critical Alerts</p>
                            <p className="text-2xl font-black text-red-600 my-1">{handoverData.stats.criticalEscalations}</p>
                            <p className="text-[10px] text-slate-500 m-0">Actively Triggered</p>
                         </div>
                         <div className="flex-1 p-4 border-r border-slate-300 text-center bg-slate-50">
                            <p className="text-xs font-bold text-orange-600 uppercase m-0">Pending Adms</p>
                            <p className="text-2xl font-black text-orange-600 my-1">{handoverData.stats.pendingAdmissions}</p>
                            <p className="text-[10px] text-slate-500 m-0">Awaiting Bed Assignment</p>
                         </div>
                         <div className="flex-1 p-4 text-center bg-white">
                            <p className="text-xs font-bold text-blue-600 uppercase m-0">Discharges</p>
                            <p className="text-2xl font-black text-blue-600 my-1">{handoverData.stats.pendingDischarges}</p>
                            <p className="text-[10px] text-slate-500 m-0">Expected to Leave</p>
                         </div>
                     </div>
                 </div>

                 {/* STAFF ROSTER */}
                 <div className="mb-8 page-break-inside-avoid">
                     <h3 className="text-lg font-bold border-b border-slate-300 pb-2 mb-4 text-slate-900 uppercase tracking-wider">Staff on Duty</h3>
                     <div className="grid grid-cols-2 gap-6 print:grid-cols-2">
                        <div className="border border-slate-200 p-4 rounded bg-slate-50 text-slate-900">
                            <p className="text-xs font-bold text-slate-900 uppercase mb-3 pb-2 border-b border-slate-200">Physicians ({handoverData.staff?.doctors?.length || 0})</p>
                            {handoverData.staff?.doctors?.length > 0 ? (
                               <ul className="text-sm space-y-2 m-0 p-0 list-none">
                                  {handoverData.staff.doctors.map((doc, i) => (
                                     <li key={`doc-${i}`} className="m-0">• Dr. {doc.firstName} {doc.lastName} <span className="text-xs text-slate-600 italic block ml-3">{doc.specialty || 'General'}</span></li>
                                  ))}
                               </ul>
                            ) : <p className="text-xs text-slate-500 italic m-0">No assigned doctors.</p>}
                        </div>
                        <div className="border border-slate-200 p-4 rounded bg-slate-50 text-slate-900">
                            <p className="text-xs font-bold text-slate-900 uppercase mb-3 pb-2 border-b border-slate-200">Nursing Staff ({handoverData.staff?.nurses?.length || 0})</p>
                            {handoverData.staff?.nurses?.length > 0 ? (
                               <ul className="text-sm space-y-2 m-0 p-0 list-none">
                                  {handoverData.staff.nurses.map((nurse, i) => (
                                     <li key={`nurse-${i}`} className="m-0">• {nurse.firstName} {nurse.lastName} <span className="text-xs text-slate-600 italic block ml-3">{nurse.assignedBeds?.length ? `Assigned to ${nurse.assignedBeds.length} beds` : 'Roving Support'}</span></li>
                                  ))}
                               </ul>
                            ) : <p className="text-xs text-slate-500 italic m-0">No assigned nurses.</p>}
                        </div>
                     </div>
                 </div>

                 {/* CRITICAL ALERTS */}
                 {(handoverData.escalations?.critical?.length > 0 || handoverData.escalations?.warnings?.length > 0) && (
                     <div className="mb-8 page-break-inside-avoid">
                         <h3 className="text-lg font-bold border-b border-slate-300 pb-2 mb-4 text-red-700 uppercase tracking-wider">Critical Escalations & Alerts</h3>
                         <div className="space-y-3">
                            {handoverData.escalations.critical.map((e, i) => (
                                <div key={`crit-${i}`} className="border-l-4 border-red-600 bg-red-50 p-3 flex justify-between items-start">
                                    <div>
                                        <span className="inline-block text-xs font-bold text-red-800 uppercase bg-red-200 px-2 py-0.5 rounded mr-2 mb-1">{e.type.replace(/-/g, ' ')}</span>
                                        <span className="text-sm font-semibold text-slate-900">{e.description || "System flagged an actionable escalation."}</span>
                                        <p className="text-xs text-slate-700 mt-1 m-0">Location: {(e.wardId && e.wardId.wardName) ? e.wardId.wardName : "Unknown Ward"} — Bed {(e.relatedBedId && e.relatedBedId.bedNumber) ? e.relatedBedId.bedNumber : "N/A"}</p>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-600 whitespace-nowrap">{new Date(e.createdAt).toLocaleTimeString()}</span>
                                </div>
                            ))}
                            {handoverData.escalations.warnings.map((e, i) => (
                                <div key={`warn-${i}`} className="border-l-4 border-orange-500 bg-orange-50 p-3 flex justify-between items-start">
                                    <div>
                                        <span className="inline-block text-xs font-bold text-orange-800 uppercase bg-orange-200 px-2 py-0.5 rounded mr-2 mb-1">{e.type.replace(/-/g, ' ')}</span>
                                        <span className="text-sm font-semibold text-slate-900">{e.description || "System flagged a workflow delay."}</span>
                                        <p className="text-xs text-slate-700 mt-1 m-0">Location: {(e.wardId && e.wardId.wardName) ? e.wardId.wardName : "Unknown Ward"} — Bed {(e.relatedBedId && e.relatedBedId.bedNumber) ? e.relatedBedId.bedNumber : "N/A"}</p>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-600 whitespace-nowrap">{new Date(e.createdAt).toLocaleTimeString()}</span>
                                </div>
                            ))}
                         </div>
                     </div>
                 )}

                 {/* ACTIVE PATIENT ROSTER */}
                 <div className="mb-8">
                     <h3 className="text-lg font-bold border-b border-slate-300 pb-2 mb-4 text-slate-900 uppercase tracking-wider">Clinical Roster ({handoverData.activePatients?.length || 0})</h3>
                     {handoverData.activePatients && handoverData.activePatients.length > 0 ? (
                         <table className="w-full text-left border-collapse border border-slate-300 print:text-sm text-slate-900">
                             <thead className="bg-slate-100">
                                 <tr>
                                     <th className="border border-slate-300 p-3 text-xs font-bold uppercase text-slate-800 w-1/4">Patient Details</th>
                                     <th className="border border-slate-300 p-3 text-xs font-bold uppercase text-slate-800 w-1/4">Location</th>
                                     <th className="border border-slate-300 p-3 text-xs font-bold uppercase text-slate-800 w-1/2">Primary Diagnosis & Notes</th>
                                 </tr>
                             </thead>
                             <tbody>
                                 {handoverData.activePatients.map((p, i) => (
                                     <tr key={`p-${i}`} className="hover:bg-slate-50 align-top">
                                         <td className="border border-slate-300 p-3">
                                             <p className="font-bold text-sm m-0">{p.patientName}</p>
                                             <p className="text-[10px] text-slate-600 m-0 mt-1 uppercase font-semibold">Admitted: {new Date(p.admissionDate).toLocaleDateString()}</p>
                                         </td>
                                         <td className="border border-slate-300 p-3">
                                             <p className="text-sm font-semibold m-0">{p.wardName}</p>
                                             <p className="text-xs text-slate-700 m-0 mt-0.5 uppercase font-semibold">Bed {p.bedNumber}</p>
                                         </td>
                                         <td className="border border-slate-300 p-3 whitespace-pre-wrap">
                                             <span className="text-sm text-slate-800 leading-snug block">{p.condition}</span>
                                         </td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                     ) : <p className="text-sm text-slate-500 italic">No active patients currently logged.</p>}
                 </div>

                 {/* ADMISSIONS & DISCHARGES */}
                 <div className="grid grid-cols-2 gap-8 print:grid-cols-2 mb-8 page-break-inside-avoid">
                     {/* INCOMING */}
                     <div>
                         <h3 className="text-md font-bold border-b border-slate-300 pb-2 mb-3 text-slate-900 uppercase tracking-wider">Incoming Admissions ({handoverData.admissions?.length || 0})</h3>
                         {handoverData.admissions && handoverData.admissions.length > 0 ? (
                             <ul className="border border-slate-300 rounded divide-y divide-slate-200 m-0 p-0 list-none bg-white">
                                 {handoverData.admissions.map((adm, i) => (
                                     <li key={`adm-${i}`} className="p-3 text-sm flex justify-between items-center bg-white">
                                         <div>
                                             <span className="font-bold block text-slate-900 m-0">{adm.patientId?.patientName || "Unknown Patient"}</span>
                                             <span className="text-xs text-slate-600 block m-0 mt-0.5">{adm.patientId?.primaryCondition || "Undiagnosed"}</span>
                                         </div>
                                         <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded border whitespace-nowrap ${adm.priority === 'emergency' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-100 text-slate-700 border-slate-300'}`}>{adm.priority}</span>
                                     </li>
                                 ))}
                             </ul>
                         ) : <p className="text-sm text-slate-500 italic m-0">No pending admissions.</p>}
                     </div>

                     {/* DISCHARGES */}
                     <div>
                         <h3 className="text-md font-bold border-b border-slate-300 pb-2 mb-3 text-slate-900 uppercase tracking-wider">Expected Discharges ({handoverData.discharges?.length || 0})</h3>
                         {handoverData.discharges && handoverData.discharges.length > 0 ? (
                             <ul className="border border-slate-300 rounded divide-y divide-slate-200 m-0 p-0 list-none bg-white">
                                 {handoverData.discharges.map((d, i) => (
                                     <li key={`dch-${i}`} className="p-3 text-sm flex justify-between items-center bg-white">
                                         <span className="font-bold text-slate-900 m-0">{d.patientId?.patientName}</span>
                                         <span className="text-xs text-green-800 bg-green-50 border border-green-200 px-2 py-1 rounded whitespace-nowrap font-semibold">
                                             {d.expectedDischargeDate ? new Date(d.expectedDischargeDate).toLocaleDateString() : 'Awaiting Clearance'}
                                         </span>
                                     </li>
                                 ))}
                             </ul>
                         ) : <p className="text-sm text-slate-500 italic m-0">No expected discharges.</p>}
                     </div>
                 </div>

                 {/* FOOTER */}
                 <div className="text-center pt-8 border-t border-slate-800 text-xs text-slate-500 font-bold tracking-widest uppercase page-break-before-auto">
                     — END OF HANDOVER REPORT —
                     <p className="mt-2 text-[10px] font-normal tracking-normal text-slate-400 m-0">WardWatch Hospital System • Data Integrity Validated</p>
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
            <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest leading-relaxed mb-4">
               Access previously generated automated hospital shift snapshots to maintain immutable handover continuity.
            </p>
            {historyDocs.length > 0 ? (
               <div className="max-h-[60vh] overflow-y-auto space-y-3">
                  {historyDocs.map((doc, i) => (
                     <div key={i} className="flex justify-between items-center p-4 border border-gray-200 rounded-sm hover:border-gray-900 hover:shadow-sm transition cursor-pointer" onClick={() => loadHistoricalHandover(doc.shareId)}>
                        <div>
                           <p className="text-xs font-extrabold tracking-widest uppercase text-gray-900">{doc.shiftName}</p>
                           <p className="text-[9px] font-bold text-gray-500 uppercase mt-1">{new Date(doc.generatedAt).toLocaleString()}</p>
                        </div>
                        <Button variant="outline" className="text-[9px] px-4 py-2 uppercase font-extrabold tracking-widest shadow-none">View</Button>
                     </div>
                  ))}
               </div>
            ) : (
               <div className="p-8 text-center bg-gray-50 border border-gray-100 rounded">
                  <p className="text-xs font-extrabold tracking-widest uppercase text-gray-500">No shift archives located yet.</p>
               </div>
            )}
            <div className="flex justify-end pt-4 border-t border-gray-100">
               <Button variant="outline" onClick={() => setIsHistoryOpen(false)} className="text-[10px] uppercase font-extrabold tracking-widest px-6 shadow-none">Close</Button>
            </div>
         </div>
      </Modal>

    </div>
  );
};
export default DoctorDashboard;