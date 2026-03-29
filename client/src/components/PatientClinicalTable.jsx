import Button from "./Button";
import { Download, FileText, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

const PatientClinicalTable = ({ patients, onReview, onReport, onDelete }) => {
  return (
    <div className="w-full bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
      <div className="px-8 py-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-widest">
          Assigned Patients Roster
        </h3>
        <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Showing All Active Admissions</p>
      </div>
      {patients.length > 0 ? (
        <div className="w-full overflow-x-auto flex-1">
          <table className="w-full min-w-[950px] divide-y divide-gray-200">
            <thead className="bg-white">
              <tr>
                <th className="px-8 py-4 text-left text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">Patient / Bed</th>
                <th className="px-8 py-4 text-left text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">Focus / Admitted</th>
                <th className="px-8 py-4 text-left text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">Vitals Summary</th>
                <th className="px-8 py-4 text-left text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">Medications</th>
                <th className="px-8 py-4 text-left text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-4 text-left text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">Report</th>
                <th className="px-8 py-4 text-right text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {patients.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-8 py-6 whitespace-nowrap">
                    <p className="text-base font-extrabold text-gray-900 tracking-tight leading-tight">{p.name}</p>
                    <p className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest mt-1">
                      {['cleared_for_discharge', 'discharged'].includes(p.status) ? 'VACATED' : (p.bed?.toString().toLowerCase() === 'queue' ? 'PENDING BED' : `BED ${p.bed}`)} • {p.age} Y/O {p.gender}
                    </p>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <p className="text-sm font-bold text-gray-800 tracking-tight leading-tight">{p.condition}</p>
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mt-1">Adm: {p.admissionDate}</p>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="flex flex-col gap-0.5 text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
                      <p>BP: <span className="text-gray-900">{p.vitals.bp}</span></p>
                      <p>HR: <span className="text-gray-900">{p.vitals.hr} bpm</span></p>
                      <p>TEMP: <span className="text-gray-900">{p.vitals.temp}</span></p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1 mt-0.5">
                      {p.meds.map((med, i) => (
                         <span key={i} className="text-[11px] font-bold text-gray-700 tracking-wide truncate max-w-[180px]">• {med}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1.5 rounded text-[9px] font-extrabold uppercase tracking-widest ${
                      p.status === 'critical' ? 'bg-gray-900 text-white' : 
                      p.status === 'pending_clearance' ? 'bg-white border-2 border-dashed border-gray-400 text-gray-800' :
                      p.status === 'cleared_for_discharge' ? 'bg-gradient-to-r from-blue-950 to-blue-900 text-white' :
                      'bg-white border-2 border-gray-200 text-gray-600'
                    }`}>
                      {p.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    {p.status === 'cleared_for_discharge' ? (
                       <button onClick={() => onReport ? onReport(p, 'discharge') : toast.info(`Downloading Discharge Summary for ${p.name}...`)} className="flex items-center justify-center gap-1.5 px-3 py-1.5 border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-colors rounded text-[9px] font-extrabold uppercase tracking-widest">
                          <Download size={12} strokeWidth={3} /> Discharge
                       </button>
                    ) : (
                       <button onClick={() => onReport ? onReport(p, 'clinical') : toast.info(`Downloading Clinical History for ${p.name}...`)} className="flex items-center justify-center gap-1.5 px-3 py-1.5 border-2 border-gray-200 text-gray-400 hover:border-gray-900 hover:text-gray-900 transition-colors rounded text-[9px] font-extrabold uppercase tracking-widest">
                          <FileText size={12} strokeWidth={3} /> Clinical
                       </button>
                    )}
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap text-right flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => onReview(p)} className="text-gray-900 bg-white border-2 border-gray-200 hover:border-gray-900 shadow-none text-[10px] px-4 py-2 font-extrabold uppercase tracking-widest">
                      Review Chart
                    </Button>
                    {p.status === 'cleared_for_discharge' && (
                      <Button variant="outline" size="sm" onClick={() => onDelete && onDelete(p.id)} className="text-red-500 bg-gray-50 border-2 border-gray-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200 shadow-none px-3 py-2 transition-colors" title="Remove Discharged Patient">
                        <Trash2 size={13} strokeWidth={2.5} />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-16 flex-1 flex items-center justify-center text-sm font-bold text-gray-500 uppercase tracking-widest">No active patients.</div>
      )}
    </div>
  );
};
export default PatientClinicalTable;
