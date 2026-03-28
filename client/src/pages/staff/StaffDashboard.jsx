import { useState } from "react";
import BedCard from "../../components/BedCard";
import Modal from "../../components/Modal";
import Button from "../../components/Button";

function StaffDashboard() {
  // 🛏️ Sample beds data
  const [beds, setBeds] = useState([
    { id: 1, status: "occupied", patient: { name: "Rahul", condition: "Cardiac" } },
    { id: 2, status: "available" },
    { id: 3, status: "cleaning" },
    { id: 4, status: "reserved" },
    { id: 5, status: "available" },
    { id: 6, status: "occupied", patient: { name: "Amit", condition: "Ortho" } },
  ]);

  const [selectedBed, setSelectedBed] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 👉 When bed is clicked
  const handleBedClick = (bed) => {
    setSelectedBed(bed);
    setIsModalOpen(true);
  };

  // 👉 Update bed status
  const updateStatus = (newStatus) => {
    setBeds((prev) =>
      prev.map((bed) =>
        bed.id === selectedBed.id
          ? { ...bed, status: newStatus, patient: newStatus === "available" ? null : bed.patient }
          : bed
      )
    );
    setIsModalOpen(false);
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      
      {/* Header */}
      <h1 className="text-3xl font-bold text-blue-600 mb-6">
        Staff Dashboard 🏥
      </h1>

      {/* 🛏️ Bed Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {beds.map((bed) => (
          <BedCard key={bed.id} bed={bed} onClick={handleBedClick} />
        ))}
      </div>

      {/* 🪟 Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        
        {selectedBed && (
          <div>
            <h2 className="text-xl font-bold mb-4">
              Bed {selectedBed.id}
            </h2>

            <p className="mb-4">Change Status:</p>

            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => updateStatus("available")}>
                Available
              </Button>
              <Button onClick={() => updateStatus("occupied")}>
                Occupied
              </Button>
              <Button onClick={() => updateStatus("cleaning")}>
                Cleaning
              </Button>
              <Button onClick={() => updateStatus("reserved")}>
                Reserved
              </Button>
            </div>
          </div>
        )}

      </Modal>
    </div>
  );
}

export default StaffDashboard;