import Button from "./Button";

const PendingAdmissionsTable = ({ admissions, onArrive }) => {
  return (
    <div className="w-full bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
      <div className="px-6 py-5 border-b border-gray-200 bg-white">
        <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-widest">
          Pending Admissions
        </h3>
      </div>
      {admissions.length > 0 ? (
        <div className="w-full overflow-x-auto flex-1">
          <table className="w-full min-w-[500px] divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">Patient</th>
                <th className="px-6 py-3 text-left text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">Source</th>
                <th className="px-6 py-3 text-left text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">Priority</th>
                <th className="px-6 py-3 text-left text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {admissions.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900 tracking-tight">{a.patientName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-600">
                    {a.source}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${a.priority === 'High' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>
                      {a.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {a.status === 'arrived' ? (
                      <span className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-gray-400">
                        Arrived
                      </span>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => onArrive(a.id)} className="text-gray-900 bg-white border-2 border-gray-200 hover:border-gray-400 hover:bg-gray-50 shadow-none text-xs font-bold uppercase tracking-wider">
                        Mark Arrived
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 flex-1 flex items-center justify-center text-sm font-semibold text-gray-500">No pending admissions.</div>
      )}
    </div>
  );
};

export default PendingAdmissionsTable;
