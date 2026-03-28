const BedCard = ({ bed, onClick }) => {
  const isOccupied = bed.status === "occupied";
  const isAvailable = bed.status === "available";
  const isCleaning = bed.status === "cleaning";
  const isReserved = bed.status === "reserved";

  let bgClass = "bg-gradient-to-br from-emerald-600 to-emerald-500 border-emerald-700 text-white shadow-md hover:shadow-lg";
  let statusText = "AVAILABLE";
  let textClass = "text-emerald-100";
  let numClass = "text-white";
  let contentTextClass = "text-emerald-50";

  if (isOccupied) {
    bgClass = "bg-gradient-to-br from-blue-950 to-blue-900 border-blue-950 text-white shadow-md hover:shadow-lg";
    statusText = "OCCUPIED";
    textClass = "text-blue-200";
    numClass = "text-white";
    contentTextClass = "text-blue-100";
  } else if (isReserved) {
    bgClass = "bg-gradient-to-br from-violet-900 to-violet-800 border-violet-950 text-white shadow-md hover:shadow-lg";
    statusText = "RESERVED";
    textClass = "text-violet-200";
    numClass = "text-white";
    contentTextClass = "text-violet-100";
  } else if (isCleaning) {
    bgClass = "bg-gradient-to-br from-amber-600 to-amber-500 border-amber-700 text-white shadow-md hover:shadow-lg";
    statusText = "CLEANING";
    textClass = "text-amber-100";
    numClass = "text-white";
    contentTextClass = "text-amber-50";
  }

  return (
    <div
      onClick={() => onClick(bed)}
      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 select-none flex flex-col justify-between min-h-[140px] ${bgClass}`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className={`text-2xl font-extrabold tracking-tight ${numClass}`}>
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
              <p className={`text-[11px] font-semibold tracking-wide uppercase ${textClass}`}>{bed.patient.condition}</p>
              <div className="flex justify-between items-center">
                 <p className={`text-[10px] font-medium opacity-80 ${contentTextClass}`}>Admitted: {bed.patient.admitDate}</p>
                 {bed.patient.los > 0 && (
                   <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded shadow-sm ${bed.patient.los >= 7 ? 'bg-red-500 text-white' : 'bg-white/20 text-white'}`}>
                      {bed.patient.los} DAY LOS
                   </span>
                 )}
              </div>
            </div>
          </div>
        ) : isReserved && bed.patient ? (
          <div>
            <p className="text-sm font-bold tracking-tight text-white leading-tight">{bed.patient.name}</p>
            <p className={`text-[11px] font-medium mt-1 ${textClass}`}>Pending Arrival</p>
          </div>
        ) : isCleaning ? (
          <p className={`text-xs font-semibold tracking-wide uppercase ${textClass}`}>In Progress</p>
        ) : (
          <p className={`text-xs font-semibold tracking-wide uppercase ${textClass}`}>Ready</p>
        )}
      </div>
    </div>
  );
};

export default BedCard;
