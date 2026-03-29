import { useState } from 'react';
import { ChevronDown, ChevronUp, Flag } from 'lucide-react';

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
  const [isCollapsed, setIsCollapsed] = useState(true);

  if (!escalations || escalations.length === 0) return null;

  return (
    <div className="bg-white border-2 border-gray-900 border-dashed rounded-xl p-4 md:p-6 shadow-sm transition-all duration-300">
      <div 
        className="flex justify-between items-center cursor-pointer group"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-3">
            <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-widest flex items-center gap-2">
              <Flag size={14} className="text-red-500" strokeWidth={3} />
              Mandatory Escalation Flags
            </h3>
            <span className="bg-red-100 border border-red-200 text-red-800 px-2 py-0.5 rounded font-extrabold text-[9px] uppercase tracking-widest">
              {escalations.length} Active
            </span>
        </div>
        <div className="text-gray-400 group-hover:text-gray-900 transition-colors">
            {isCollapsed ? <ChevronDown size={18} strokeWidth={2.5}/> : <ChevronUp size={18} strokeWidth={2.5}/>}
        </div>
      </div>
      
      {!isCollapsed && (
        <ul className="space-y-4 mt-6 border-t border-gray-100 pt-5">
          {escalations.map((esc) => (
            <li key={esc.id} className="flex gap-4 items-start pb-4 border-b border-gray-100 last:border-0 last:pb-0">
              <div className="flex-shrink-0 mt-0.5">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-gray-900 text-white text-xs font-bold shadow-sm">
                  !
                </span>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 leading-tight tracking-tight">{esc.message}</p>
                <p className="text-xs text-gray-500 mt-1.5 font-semibold uppercase tracking-wider">
                  {esc.type} • {timeAgo(esc.time)} ({new Date(esc.time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })})
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default EscalationFlagsAlert;
