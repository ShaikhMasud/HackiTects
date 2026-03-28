import Button from "./Button";

const AdminWardCard = ({ name, beds, onDrillDown }) => {
  const total = beds.length;
  const occupied = beds.filter(b => b.status === "occupied").length;
  const cleaning = beds.filter(b => b.status === "cleaning").length;
  const available = beds.filter(b => b.status === "available").length;
  const reserved = beds.filter(b => b.status === "reserved").length;

  const occupancyPercent = Math.round((occupied / (total || 1)) * 100) || 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow">
      <div className="p-8 border-b border-gray-100 bg-gray-50 flex justify-between items-start">
        <div>
           <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">{name}</h3>
           <p className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest mt-1">Capacity: {total} Beds</p>
        </div>
        <div className="text-right">
           <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">{occupancyPercent}%</h3>
           <p className="text-[10px] font-extrabold text-blue-900 uppercase tracking-widest mt-1">Occupancy</p>
        </div>
      </div>
      
      <div className="p-8 flex-grow">
          <div className="w-full h-3 rounded-full overflow-hidden flex mb-8 bg-gray-100">
             <div style={{ width: `${occupancyPercent}%` }} className="bg-gradient-to-r from-blue-950 to-blue-900"></div>
             <div style={{ width: `${(reserved/total)*100}%` }} className="bg-gray-300"></div>
             <div style={{ width: `${(cleaning/total)*100}%` }} className="bg-gray-200"></div>
          </div>

          <div className="grid grid-cols-2 gap-y-6 gap-x-6">
             <div>
                <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Occupied</p>
                <p className="text-xl font-bold text-gray-900">{occupied}</p>
             </div>
             <div>
                <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Available</p>
                <p className="text-xl font-bold text-gray-900">{available}</p>
             </div>
             <div>
                <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Cleaning</p>
                <p className="text-xl font-bold text-gray-900">{cleaning}</p>
             </div>
             <div>
                <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Reserved</p>
                <p className="text-xl font-bold text-gray-900">{reserved}</p>
             </div>
          </div>
      </div>
      <div className="p-5 border-t border-gray-100 bg-white">
          <Button variant="outline" onClick={() => onDrillDown(name)} className="w-full py-5 text-[11px] font-extrabold uppercase tracking-widest text-gray-900 border-2 border-gray-200 hover:border-gray-900 hover:bg-white rounded-lg shadow-none">
             Analyze Ward Map
          </Button>
      </div>
    </div>
  );
};
export default AdminWardCard;
