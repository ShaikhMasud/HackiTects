import Button from "./Button";

const ExpectedDischargesTable = ({ discharges, onComplete, onDiscard }) => {
  return (
    <div className="w-full bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
      <div className="px-6 py-5 border-b border-gray-200 bg-white">
        <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-widest">
          Expected Discharges
        </h3>
      </div>
      {discharges.length > 0 ? (
        <div className="w-full overflow-x-auto flex-1">
          <table className="w-full min-w-[500px] divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">Patient</th>
                <th className="px-6 py-3 text-left text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">Bed</th>
                <th className="px-6 py-3 text-left text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">Time</th>
                <th className="px-6 py-3 text-left text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {discharges.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900 tracking-tight">{d.patientName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-600">
                    {d.bedNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-600">
                    {new Date(d.expectedTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap flex items-center gap-2">
                    {d.status === 'completed' ? (
                      <span className="inline-flex items-center px-4 text-xs font-bold uppercase tracking-widest text-gray-400">
                        Completed
                      </span>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => onComplete(d.id)} className="text-gray-900 bg-white border-2 border-gray-200 hover:border-gray-400 hover:bg-gray-50 shadow-none text-xs font-bold uppercase tracking-wider">
                        Mark Done
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => onDiscard && onDiscard(d.id)} className="text-red-600 bg-white border-2 border-red-200 hover:border-red-600 hover:bg-red-50 hover:text-red-700 shadow-none text-xs font-bold uppercase tracking-wider px-2.5 transition-colors" title="Discard Discharge Entry">
                      ×
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 flex-1 flex items-center justify-center text-sm font-semibold text-gray-500">No scheduled discharges.</div>
      )}
    </div>
  );
};

export default ExpectedDischargesTable;
