import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { toast } from "react-toastify";
import Button from "../../components/Button";

const SharedHandoverReport = () => {
  const { shareId } = useParams();
  const [handoverData, setHandoverData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const handoverPrintRef = useRef(null);

  useEffect(() => {
    const fetchHandover = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/handover/shared/${shareId}`);
        if (res.ok) {
          const data = await res.json();
          setHandoverData(data);
        } else {
          setError(true);
          toast.error("Handover document not found or expired.");
        }
      } catch (e) {
        console.error(e);
        setError(true);
        toast.error("Failed to connect to the server.");
      } finally {
        setLoading(false);
      }
    };
    fetchHandover();
  }, [shareId]);

  const handleGeneratePDF = useReactToPrint({
    contentRef: handoverPrintRef,
    documentTitle: `Shift_Handover_${new Date().toISOString().split('T')[0]}`,
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <span className="text-xl font-extrabold text-gray-900 tracking-widest uppercase animate-pulse">Retrieving Secure Document...</span>
      </div>
    );
  }

  if (error || !handoverData) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50 p-8 text-center space-y-4">
        <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight uppercase">Document Unavailable</h2>
        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">This handover link is invalid, expired, or has been purged from the system.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 md:px-8 flex flex-col items-center">
      <div className="w-full max-w-[1000px] flex justify-between items-center mb-8 print:hidden">
        <div>
           <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight uppercase">SECURE HANDOVER DOCUMENT</h2>
           <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Ref: {handoverData.shareId}</p>
        </div>
        <Button onClick={handleGeneratePDF} className="px-6 py-3 shadow-none text-[10px] font-extrabold uppercase tracking-widest bg-gray-900 text-white border-none">
           Download PDF
        </Button>
      </div>

      <div className="w-full max-w-[1000px] shadow-2xl overflow-hidden rounded-xl border border-gray-200">
         {/* Using the exact same UI structure but modernized fonts */}
         <div ref={handoverPrintRef} className="bg-white text-gray-900 p-8 md:p-14 w-full mx-auto print:p-8 print:w-full min-h-[500px] font-sans">
             {/* HEADER */}
             <div className="flex justify-between items-start border-b-2 border-gray-900 pb-8 mb-10">
                 <div>
                     <h1 className="text-4xl font-extrabold uppercase tracking-tight text-gray-900 m-0">Shift Handover Note</h1>
                     <h2 className="text-xs text-gray-500 mt-3 font-extrabold tracking-widest uppercase m-0">WardWatch Clinical System</h2>
                     <p className="text-[10px] text-gray-400 mt-1 font-bold tracking-widest uppercase m-0">Signature Ref: {handoverData.shareId}</p>
                 </div>
                 <div className="text-right">
                     <p className="text-xs font-extrabold bg-gray-900 text-white px-4 py-2 inline-block rounded uppercase tracking-widest mb-3">
                         {handoverData.archivedShiftName || "Live Ad-Hoc Report"}
                     </p>
                     <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest block m-0">
                         Snapshot Logged: <span className="text-gray-900">{new Date(handoverData.generatedAt).toLocaleString()}</span>
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
    </div>
  );
};

export default SharedHandoverReport;
