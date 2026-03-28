const timeAgo = (dateInput) => {
  const date = new Date(dateInput);
  const now = new Date();
  const seconds = Math.round((now - date) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (seconds < 60) return `a few seconds ago`;
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  return `${days} day${days !== 1 ? 's' : ''} ago`;
};

const EscalationFlagsAlert = ({ escalations }) => {
  if (!escalations || escalations.length === 0) return null;

  return (
    <div className="bg-white border-2 border-gray-900 border-dashed rounded-xl p-6 shadow-sm">
      <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-widest mb-5">
        Mandatory Escalation Flags
      </h3>
      <ul className="space-y-3">
        {escalations.map((esc) => (
          <li key={esc.id} className="flex gap-4 items-start pb-4 border-b border-gray-100 last:border-0 last:pb-0">
            <div className="flex-shrink-0 mt-0.5">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-gray-900 text-white text-xs font-bold">
                !
              </span>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-tight tracking-tight">{esc.message}</p>
              <p className="text-xs text-gray-500 mt-1.5 font-semibold uppercase tracking-wider">{esc.type} • {timeAgo(esc.time)}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default EscalationFlagsAlert;
