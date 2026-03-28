const BedCard = ({ bed, onClick }) => {
  const isOccupied = bed.status === "occupied";
  const isAvailable = bed.status === "available";
  const isCleaning = bed.status === "cleaning";
  const isReserved = bed.status === "reserved";

  let bgClass = "bg-white border-gray-200 hover:border-blue-900";
  let statusText = "AVAILABLE";
  let textClass = "text-gray-400";
  
  if (isOccupied) {
    bgClass = "bg-gradient-to-br from-blue-950 to-blue-900 border-blue-950 text-white shadow-md hover:shadow-lg";
    statusText = "OCCUPIED";
    textClass = "text-blue-100";
  } else if (isReserved) {
    bgClass = "bg-gray-100 border-gray-300 hover:border-gray-400";
    statusText = "RESERVED";
    textClass = "text-gray-500";
  } else if (isCleaning) {
    bgClass = "bg-white border-dashed border-gray-300 hover:border-gray-400";
    statusText = "CLEANING";
    textClass = "text-gray-400";
  }

  return (
    <div
      onClick={() => onClick(bed)}
      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 select-none flex flex-col justify-between min-h-[140px] ${bgClass}`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className={`text-2xl font-extrabold tracking-tight ${isOccupied ? 'text-white' : 'text-gray-900'}`}>
          {bed.bedNumber}
        </span>
        <span className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${textClass}`}>
          {statusText}
        </span>
      </div>
      
      <div className="flex-grow flex flex-col justify-end">
        {isOccupied && bed.patient ? (
          <div>
            <p className="text-base font-bold tracking-tight text-white mb-2 leading-tight">{bed.patient.name}</p>
            <div className="flex flex-col gap-0.5">
              <p className="text-[11px] font-semibold tracking-wide text-blue-100 uppercase">{bed.patient.condition}</p>
              <p className="text-[11px] font-medium text-blue-200 opacity-80">{bed.patient.doctor} • Admin: {bed.patient.admitDate}</p>
            </div>
          </div>
        ) : isReserved && bed.patient ? (
          <div>
            <p className="text-sm font-bold tracking-tight text-gray-900 leading-tight">{bed.patient.name}</p>
            <p className="text-[11px] font-medium text-gray-500 mt-1">Pending Arrival</p>
          </div>
        ) : isCleaning ? (
          <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">In Progress</p>
        ) : (
          <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase">Ready</p>
        )}
      </div>
    </div>
  );
};

export default BedCard;
