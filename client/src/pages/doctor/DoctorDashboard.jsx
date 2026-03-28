import { useState, useEffect, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { toast } from "react-toastify";
import { X } from "lucide-react";
import StatCard from "../../components/StatCard";
import Modal from "../../components/Modal";
import Button from "../../components/Button";
import PatientClinicalTable from "../../components/PatientClinicalTable";

const initialPatients = [
  { id: 'P001', name: 'Rahul Sharma', bed: 'G12', age: 45, gender: 'M', condition: 'Acute Appendicitis', admissionDate: '2026-03-24', status: 'admitted', vitals: { bp: '120/80', hr: 75, temp: '98.6°F' }, meds: ['Ceftriaxone 1g IV bid', 'Paracetamol 500mg prn'], doctor: "Dr. Smith" },
  { id: 'P002', name: 'Priya Singh', bed: 'G07', age: 38, gender: 'F', condition: 'Dengue Fever', admissionDate: '2026-03-20', status: 'pending_clearance', vitals: { bp: '110/70', hr: 88, temp: '99.1°F' }, meds: ['IV Fluids 1L/8h', 'PCM 650mg'], doctor: "Dr. Smith" },
  { id: 'P003', name: 'Amit Patel', bed: 'I03', age: 62, gender: 'M', condition: 'Post-CABG Observation', admissionDate: '2026-03-25', status: 'critical', vitals: { bp: '135/85', hr: 92, temp: '98.8°F' }, meds: ['Aspirin 75mg', 'Atorvastatin 40mg', 'Metoprolol 25mg'], doctor: "Dr. Smith" },
  { id: 'P004', name: 'Neha Gupta', bed: 'G22', age: 29, gender: 'F', condition: 'Viral Gastroenteritis', admissionDate: '2026-03-26', status: 'admitted', vitals: { bp: '100/60', hr: 95, temp: '100.2°F' }, meds: ['Ondansetron 4mg bd', 'ORS'], doctor: "Dr. Smith" },
  { id: 'P005', name: 'Vikram Mehta', bed: 'P14', age: 55, gender: 'M', condition: 'Elective Hernia Repair', admissionDate: '2026-03-27', status: 'cleared_for_discharge', vitals: { bp: '125/82', hr: 70, temp: '98.4°F' }, meds: ['Ibuprofen 400mg'], doctor: "Dr. Smith" },
  { id: 'P006', name: 'Suresh Kumar', bed: 'I09', age: 68, gender: 'M', condition: 'COPD Exacerbation', admissionDate: '2026-03-22', status: 'admitted', vitals: { bp: '145/90', hr: 102, temp: '99.5°F' }, meds: ['Salbutamol NEBs', 'Hydrocortisone 100mg IV'], doctor: "Dr. Smith" }
];

const DoctorDashboard = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHandoverOpen, setIsHandoverOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const handoverPrintRef = useRef(null);

  useEffect(() => {
    setTimeout(() => {
      setPatients(initialPatients);
      setLoading(false);
    }, 500);
  }, []);

  const pendingClearancesCount = patients.filter(p => p.status === 'pending_clearance').length;
  const criticalCount = patients.filter(p => p.status === 'critical').length;

  const statsData = [
    { label: "My Active Patients", value: patients.length, subtext: "Total Clinical Load" },
    { label: "Pending Approvals", value: pendingClearancesCount, subtext: "Awaiting Discharge Review" },
    { label: "Critical Monitoring", value: criticalCount, subtext: "ICU & High Priority" },
  ];

  const handleReview = (patient) => {
    setSelectedPatient(patient);
    setIsModalOpen(true);
  };

  const authorizeDischarge = () => {
    setPatients(prev => prev.map(p => p.id === selectedPatient.id ? { ...p, status: 'cleared_for_discharge' } : p));
    setIsModalOpen(false);
  };

  const updatePatientStatus = (newStatus) => {
    setPatients(prev => prev.map(p => p.id === selectedPatient.id ? { ...p, status: newStatus } : p));
    setSelectedPatient(prev => ({...prev, status: newStatus}));
  };


  const handleGeneratePDF = useReactToPrint({
    contentRef: handoverPrintRef,
    // fallback for v2:
    content: () => handoverPrintRef.current,
    documentTitle: `Shift_Handover_Dr_Smith_${new Date().toISOString().split('T')[0]}`,
  });

  const handleShareLink = () => {
    navigator.clipboard.writeText(window.location.origin + "/shared-report/shift-dr-smith");
    toast.success("Secure Shift Handover Link copied to your clipboard!");
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
             onClick={() => setIsHandoverOpen(true)}
             className="text-xs font-extrabold uppercase tracking-widest border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white px-6 py-3 shadow-none transition-colors"
           >
             Generate Shift Handover
           </Button>
           <div className="px-6 py-3 text-xs font-extrabold uppercase tracking-widest rounded bg-gray-100 border border-gray-200 text-gray-900 shadow-sm flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-950 to-blue-900"></div> Dr. Smith
           </div>
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
        <PatientClinicalTable patients={patients} onReview={handleReview} />
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
                  <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Primary Diagnosis</p>
                  <p className="text-lg font-bold text-gray-900 leading-snug">{selectedPatient.condition}</p>
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

      {/* Shift Handover Report Modal */}
      <Modal isOpen={isHandoverOpen} onClose={() => setIsHandoverOpen(false)} title="SHIFT HANDOVER & REPORTING STATUS">
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

          <div className="bg-gray-100 p-2 md:p-6 rounded border border-gray-200 max-h-[550px] overflow-y-auto shadow-inner">
             {/* Printable A4 Container block */}
             <div ref={handoverPrintRef} id="handover-print-area" className="bg-white p-6 md:p-12 shadow-sm rounded-sm max-w-4xl mx-auto print:p-0 print:shadow-none">
                 <div className="border-b-4 border-gray-900 pb-4 mb-6 flex justify-between items-end">
                    <div>
                      <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">WARDWATCH SYSTEM</h1>
                      <h2 className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest mt-0.5">Automated Physician Shift Handover</h2>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Date Generated</p>
                       <p className="text-xs font-black text-gray-900 mt-0.5">{new Date().toLocaleString()}</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6 bg-gray-50 p-6 border-l-4 border-blue-900 mb-8 rounded-r">
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Attending Shift Lead</p>
                      <p className="text-base font-extrabold text-gray-900">Dr. Smith</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Active Roster</p>
                      <p className="text-base font-extrabold text-gray-900">{patients.length} INDIVIDUALS</p>
                    </div>
                 </div>

                 <div className="mb-8">
                   <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-widest border-b border-gray-200 pb-2 mb-4">Urgent Flagged Patients (Critical / Observation)</h3>
                   {patients.filter(p => p.status === 'critical').map(p => (
                       <div key={p.id} className="mb-3 pl-4 border-l-2 border-red-500">
                          <p className="text-sm font-extrabold text-gray-900 uppercase tracking-wide">{p.name} — Bed {p.bed}</p>
                          <p className="text-[10px] font-bold text-gray-600 mt-1 uppercase tracking-widest">Diagnosis: {p.condition}</p>
                          <p className="text-[10px] font-bold text-red-600 mt-0.5 uppercase tracking-widest">Latest Vitals: BP {p.vitals.bp} • HR {p.vitals.hr}</p>
                       </div>
                   ))}
                   {patients.filter(p => p.status === 'critical').length === 0 && <p className="text-xs font-bold text-gray-400 italic">No critically flagged patients on this roster.</p>}
                 </div>

                 <div className="mb-8">
                   <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-widest border-b border-gray-200 pb-2 mb-4">Pending Medical Discharges</h3>
                   {patients.filter(p => p.status === 'pending_clearance').map(p => (
                       <div key={p.id} className="mb-3 pl-4 border-l-2 border-yellow-400">
                          <p className="text-sm font-extrabold text-gray-900 uppercase tracking-wide">{p.name} — Bed {p.bed}</p>
                          <p className="text-[10px] font-bold text-gray-600 mt-1 uppercase tracking-widest">Requirements: Final Vitals Review prior to Exit</p>
                       </div>
                   ))}
                   {patients.filter(p => p.status === 'pending_clearance').length === 0 && <p className="text-xs font-bold text-gray-400 italic">No patients pending physician clearance.</p>}
                 </div>

                 <div className="mb-4">
                   <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-widest border-b border-gray-200 pb-2 mb-4">Active Standard Roster</h3>
                   <table className="w-full text-left">
                     <thead>
                       <tr>
                         <th className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest pb-3">Patient</th>
                         <th className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest pb-3">Bed</th>
                         <th className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest pb-3">Diagnosis Summary</th>
                       </tr>
                     </thead>
                     <tbody>
                       {patients.filter(p => p.status !== 'critical' && p.status !== 'pending_clearance').map(p => (
                         <tr key={p.id} className="border-t border-gray-50">
                           <td className="py-2 text-xs font-bold text-gray-900">{p.name}</td>
                           <td className="py-2 text-xs font-bold text-gray-600 uppercase">{p.bed}</td>
                           <td className="py-2 text-xs font-bold text-gray-600">{p.condition}</td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>

                 <div className="mt-12 text-center pt-8 border-t border-gray-200">
                   <p className="text-[8px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">— END OF CLINICAL HANDOVER REPORT —</p>
                   <p className="text-[8px] font-extrabold text-gray-300 uppercase tracking-widest">Generated securely by WardWatch Infrastructure</p>
                 </div>
             </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
             <Button 
               variant="primary" 
               onClick={handleGeneratePDF}
               className="flex-1 py-4 text-xs font-extrabold uppercase tracking-widest"
             >
               Print or Save as PDF
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
      </Modal>

    </div>
  );
};
export default DoctorDashboard;