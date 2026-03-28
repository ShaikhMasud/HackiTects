import { useState, useEffect } from "react";
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
  const [loading, setLoading] = useState(true);

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
        <div className="flex space-x-2">
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
              <div className="grid grid-cols-1 gap-3">
                {selectedPatient.status !== 'cleared_for_discharge' ? (
                  <Button 
                    variant="primary" 
                    onClick={authorizeDischarge} 
                    className="w-full py-5 text-sm font-extrabold uppercase tracking-widest shadow-md transition-all active:scale-[0.99] border-none"
                  >
                    Authorize Patient Discharge
                  </Button>
                ) : (
                  <div className="w-full py-5 bg-gray-50 border-2 border-dashed border-gray-300 text-center rounded-lg">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Discharge Already Authorized</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
export default DoctorDashboard;