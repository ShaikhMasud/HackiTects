function BedCard({ bed, onClick }) {
  const getColor = () => {
    if (bed.status === "occupied") return "bg-red-500";
    if (bed.status === "available") return "bg-green-500";
    if (bed.status === "cleaning") return "bg-yellow-400";
    if (bed.status === "reserved") return "bg-blue-500";
  };

  return (
    <div
      onClick={() => onClick(bed)}
      className={`p-4 rounded-xl text-white cursor-pointer ${getColor()}`}
    >
      <h2 className="font-bold">Bed {bed.id}</h2>

      <p className="text-sm">{bed.status}</p>

      {bed.patient && (
        <div className="text-xs mt-2">
          <p>{bed.patient.name}</p>
          <p>{bed.patient.condition}</p>
        </div>
      )}
    </div>
  );
}

export default BedCard;