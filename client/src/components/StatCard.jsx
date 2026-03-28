const StatCard = ({ label, value, subtext }) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
      <div className="text-xs font-extrabold text-gray-500 uppercase tracking-widest mb-3">{label}</div>
      <div className="flex items-baseline gap-3">
        <div className="text-4xl font-extrabold text-gray-900 tracking-tight leading-none">{value}</div>
        {subtext && <div className="text-sm font-semibold text-gray-500">{subtext}</div>}
      </div>
    </div>
  );
};

export default StatCard;
