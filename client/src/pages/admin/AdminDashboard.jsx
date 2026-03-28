import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";
import StatCard from "../../components/StatCard";
import EscalationFlagsAlert from "../../components/EscalationFlagsAlert";
import BedCard from "../../components/BedCard";
import Modal from "../../components/Modal";
import Button from "../../components/Button";
import AdminWardCard from "../../components/AdminWardCard";

const generateBeds = (count, prefix, wardName) => {
  return Array.from({ length: count }).map((_, i) => {
    const isOccupied = Math.random() > 0.4;
    const status = isOccupied ? "occupied" : Math.random() > 0.6 ? "available" : Math.random() > 0.5 ? "cleaning" : "reserved";
    return {
      id: `${prefix}-${i + 1}`,
      ward: wardName,
      bedNumber: `${prefix}${i + 1}`,
      status,
      patient: status === "occupied" || status === "reserved" ? {
        name: `Patient ${Math.floor(Math.random() * 1000)}`,
        condition: ["Cardiac", "Ortho", "Observation", "Post-op", "Respiratory", "Trauma"][Math.floor(Math.random() * 6)],
        doctor: ["Dr. Smith", "Dr. Jones", "Dr. Patel", "Dr. Williams"][Math.floor(Math.random() * 4)],
        admitDate: new Date(Date.now() - Math.floor(Math.random() * 10) * 86400000).toISOString().split('T')[0]
      } : null,
      since: status === "cleaning" ? `${Math.floor(Math.random() * 45) + 5} mins ago` : null,
    };
  });
};

const occupancyTrendData = [
  { time: '00:00', General: 85, ICU: 90, Premium: 60 },
  { time: '04:00', General: 82, ICU: 93, Premium: 60 },
  { time: '08:00', General: 75, ICU: 85, Premium: 55 },
  { time: '12:00', General: 88, ICU: 85, Premium: 70 },
  { time: '16:00', General: 95, ICU: 96, Premium: 80 },
  { time: '20:00', General: 90, ICU: 92, Premium: 75 },
];

const patientFlowData = [
  { day: 'Mon', Admissions: 45, Discharges: 38 },
  { day: 'Tue', Admissions: 52, Discharges: 48 },
  { day: 'Wed', Admissions: 38, Discharges: 55 },
  { day: 'Thu', Admissions: 65, Discharges: 42 },
  { day: 'Fri', Admissions: 48, Discharges: 50 },
  { day: 'Sat', Admissions: 30, Discharges: 45 },
  { day: 'Sun', Admissions: 25, Discharges: 30 },
];

const ChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border-2 border-gray-900 p-4 shadow-xl">
        <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest mb-2 border-b border-gray-100 pb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-xs font-bold text-gray-900 tracking-tight mt-1 flex items-center justify-between gap-4">
            <span style={{ color: entry.color }} className="uppercase tracking-widest">{entry.name}:</span>
            <span>{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const AdminDashboard = () => {
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drilledWard, setDrilledWard] = useState(null);
  const [selectedBed, setSelectedBed] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [escalations, setEscalations] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [memberForm, setMemberForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "staff",
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleMemberChange = (e) => {
    setMemberForm({
      ...memberForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddMember = () => {
    console.log(memberForm); // later backend
    setIsAddModalOpen(false);
  };
  const [activeGlobalTab, setActiveGlobalTab] = useState("wards");

  useEffect(() => {
    const fetchHospitalData = async () => {
      try {
        setLoading(true);
        setTimeout(() => {
          const generalBeds = generateBeds(40, "G", "General Ward");
          const icuBeds = generateBeds(30, "I", "ICU Ward");
          const premiumBeds = generateBeds(20, "P", "Premium Ward");
          setBeds([...generalBeds, ...icuBeds, ...premiumBeds]);

          setEscalations([
            { id: 1, type: "critical", message: "ICU Ward: Projected to exceed critical threshold within 2 hours based on pending ED admissions.", time: new Date(Date.now() - 5 * 60000).toISOString() },
            { id: 2, type: "warning", message: "General Ward: 4 beds pending cleaning for over 45 minutes.", time: new Date(Date.now() - 20 * 60000).toISOString() },
            { id: 3, type: "warning", message: "Premium Ward: Discharge delays detected for 2 patients waiting > 3 hours.", time: new Date(Date.now() - 15 * 60000).toISOString() },
          ]);

          setLoading(false);
        }, 600);
      } catch (error) {
        console.error("Failed to fetch admin data", error);
        setLoading(false);
      }
    };
    fetchHospitalData();
  }, []);

  const totalBeds = beds.length;
  const totalOccupied = beds.filter(b => b.status === "occupied").length;
  const totalCleaning = beds.filter(b => b.status === "cleaning").length;
  const globalOccupancy = Math.round((totalOccupied / (totalBeds || 1)) * 100) || 0;

  const wards = ["General Ward", "ICU Ward", "Premium Ward"];

  const handleBedClick = (bed) => {
    setSelectedBed(bed);
    setIsModalOpen(true);
  };

  const handleDrillDown = (wardName) => {
    setDrilledWard(wardName);
  };

  const handleBackToGlobal = () => {
    setDrilledWard(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center flex-1 h-[80vh]">
        <span className="text-xl font-extrabold text-gray-900 tracking-widest uppercase animate-pulse">Initializing Command Center...</span>
      </div>
    );
  }

  const renderGlobalView = () => (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-gray-200 pb-8">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-gray-900">ADMINISTRATION VIEW</h2>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-2">Hospital Executive Analytics</p>
        </div>
        <div className="flex items-center gap-3">

          <Button onClick={() => setIsAddModalOpen(true)}>
            + Add Member
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard label="Global Occupancy" value={`${globalOccupancy}%`} subtext={`${totalOccupied} of ${totalBeds} Active Beds`} />
        <StatCard label="Cleaning Backlog" value={totalCleaning} subtext="Beds Unavailable Pending Prep" />
        <StatCard label="Critical Alerts" value={escalations.length} subtext="Requiring Administrative Review" />
      </div>

      <EscalationFlagsAlert escalations={escalations} />

      {/* Global Tab Toggles */}
      <div className="flex justify-center md:justify-start gap-6 border-b border-gray-200 mt-10">
        <button
          onClick={() => setActiveGlobalTab("wards")}
          className={`px-4 py-4 text-xs font-extrabold uppercase tracking-widest transition-colors border-b-2 shadow-none ${activeGlobalTab === "wards" ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400 hover:text-gray-900"}`}
        >
          Hospital Wards Directory
        </button>
        <button
          onClick={() => setActiveGlobalTab("analytics")}
          className={`px-4 py-4 text-xs font-extrabold uppercase tracking-widest transition-colors border-b-2 shadow-none ${activeGlobalTab === "analytics" ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400 hover:text-gray-900"}`}
        >
          Predictive Data Analytics
        </button>
      </div>

      <div className="min-h-[400px]">
        {/* Analytics Section */}
        {activeGlobalTab === "analytics" && (
          <div className="pt-8 animate-in fade-in duration-500">
            <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-widest mb-6">Real-Time Data Analytics</h3>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">

              {/* Occupancy Trend Chart */}
              <div className="bg-white border border-gray-200 p-8 rounded-xl shadow-sm">
                <div className="mb-6">
                  <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-widest">24-Hour Occupancy Trend</h4>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Percentage Utilization by Ward</p>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={occupancyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorGen" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorICU" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }} />
                      <RechartsTooltip content={<ChartTooltip />} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }} />
                      <Area type="monotone" dataKey="General" stroke="#1e3a8a" strokeWidth={3} fillOpacity={1} fill="url(#colorGen)" />
                      <Area type="monotone" dataKey="ICU" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorICU)" />
                      <Area type="monotone" dataKey="Premium" stroke="#9ca3af" strokeWidth={3} fillOpacity={0.3} fill="#9ca3af" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Velocity Flow Chart */}
              <div className="bg-white border border-gray-200 p-8 rounded-xl shadow-sm">
                <div className="mb-6">
                  <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-widest">Patient Flow Velocity</h4>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">7-Day Admissions vs Discharges</p>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={patientFlowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }} />
                      <RechartsTooltip content={<ChartTooltip />} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }} />
                      <Bar dataKey="Admissions" fill="#1e3a8a" radius={[4, 4, 0, 0]} barSize={20} />
                      <Bar dataKey="Discharges" fill="#d1d5db" radius={[4, 4, 0, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Wards Distribution Section */}
        {activeGlobalTab === "wards" && (
          <div className="pt-8 animate-in fade-in duration-500">
            <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-widest mb-6">Ward Distribution Overviews</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
              {wards.map(wardName => (
                <AdminWardCard key={wardName} name={wardName} beds={beds.filter(b => b.ward === wardName)} onDrillDown={handleDrillDown} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );

  const renderDrilledView = () => {
    const drilledBeds = beds.filter(b => b.ward === drilledWard);
    const availableCount = drilledBeds.filter(b => b.status === "available").length;
    const cleaningCount = drilledBeds.filter(b => b.status === "cleaning").length;

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-200 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Button variant="ghost" onClick={handleBackToGlobal} className="px-0 text-blue-900 hover:bg-transparent shadow-none text-[10px] font-extrabold uppercase tracking-widest underline decoration-2 underline-offset-4">
                &lt; Back to Hospital Center
              </Button>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 uppercase">{drilledWard} OVERVIEW</h2>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-2 flex items-center gap-4">
              <span>Map Drill-Down Analysis</span>
              <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-800 text-[9px] rounded font-bold uppercase tracking-widest">
                Read-Only Audit Mode
              </span>
            </p>
          </div>
        </div>

        <div className="w-full bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col shadow-sm">
          <div className="px-5 md:px-8 py-5 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50">
            <div>
              <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-widest">VISUAL SEAT MAP</h3>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                {drilledBeds.length} Total Beds — {availableCount} Available, {cleaningCount} Cleaning
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">
              <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-sm bg-gradient-to-r from-blue-950 to-blue-900 shadow-sm"></span> OCCUPIED</span>
              <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-sm bg-gray-100 border-2 border-gray-300"></span> RESERVED</span>
              <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-sm bg-white border-2 border-gray-300 border-dashed"></span> CLEANING</span>
              <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-sm bg-white border-2 border-gray-200"></span> AVAILABLE</span>
            </div>
          </div>

          <div className="p-5 md:p-8 bg-white">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-4 sm:gap-6">
              {drilledBeds.map((bed) => (
                <div key={bed.id} className="relative group">
                  <BedCard bed={bed} onClick={handleBedClick} />
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <span className="bg-gray-900 border border-black text-white text-[8px] px-2 py-1 rounded font-extrabold tracking-widest uppercase shadow-xl truncate">Audit View</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10 p-4 md:p-8 max-w-[1800px] mx-auto pb-32">
      {drilledWard ? renderDrilledView() : renderGlobalView()}

      {selectedBed && (

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`CLINICAL AUDIT: BED ${selectedBed.bedNumber}`}>
          <div className="space-y-8">
            <div className="bg-gray-50/70 p-8 rounded-lg border-2 border-dashed border-gray-200 shadow-inner">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[11px] font-extrabold text-blue-900 uppercase tracking-widest">Administrative Read-Only Profile</h4>
                <span className="text-[9px] font-bold text-gray-400 bg-gray-200 px-2 py-1 rounded uppercase tracking-widest">Audit System</span>
              </div>

              {selectedBed.status === 'occupied' && selectedBed.patient ? (
                <>
                  <h4 className="font-extrabold text-3xl text-gray-900 tracking-tight mt-6">{selectedBed.patient.name}</h4>
                  <div className="grid grid-cols-2 gap-8 mt-8 pt-8 border-t border-gray-200">
                    <div>
                      <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Condition Focus</p>
                      <p className="text-base font-bold text-gray-900 mt-1">{selectedBed.patient.condition}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Attending</p>
                      <p className="text-base font-bold text-gray-900 mt-1">{selectedBed.patient.doctor}</p>
                    </div>
                    <div className="col-span-2 flex items-center justify-between mt-2 bg-white p-4 border rounded">
                      <div>
                        <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Admitted Target</p>
                        <p className="text-sm font-bold text-gray-900 mt-1">{selectedBed.patient.admitDate}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Status Override</p>
                        <p className="text-xs font-extrabold text-red-600 uppercase tracking-widest mt-1 flex items-center gap-1 justify-end">LOCKED</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center flex flex-col items-center justify-center">
                  <p className="text-2xl font-extrabold text-gray-900 uppercase tracking-widest">{selectedBed.status}</p>
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-3">No Active Profile Linkage</p>
                </div>
              )}
            </div>

            <div className="bg-white p-5 text-center rounded border border-gray-200 shadow-sm">
              <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest leading-relaxed">
                Status modifications are restricted for administrative accounts.<br />
                Please contact the specialized Ward In-Charge for active adjustments.
              </p>
            </div>
          </div>
        </Modal>
      )}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="ADD MEMBER"
      >
        <div className="space-y-4">

          {/* First + Last */}
          <div className="flex gap-2">
            <input
              name="firstName"
              placeholder="First Name"
              value={memberForm.firstName}
              onChange={handleMemberChange}
              className="w-1/2 border p-2 rounded-lg"
            />
            <input
              name="lastName"
              placeholder="Last Name"
              value={memberForm.lastName}
              onChange={handleMemberChange}
              className="w-1/2 border p-2 rounded-lg"
            />
          </div>

          {/* Email */}
          <input
            name="email"
            placeholder="Email"
            value={memberForm.email}
            onChange={handleMemberChange}
            className="w-full border p-2 rounded-lg"
          />

          {/* Password */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={memberForm.password}
              onChange={handleMemberChange}
              className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-900 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Role */}
          <select
            name="role"
            value={memberForm.role}
            onChange={handleMemberChange}
            className="w-full border p-2 rounded-lg"
          >
            <option value="staff">Staff</option>
            <option value="doctor">Doctor</option>
          </select>

          {/* Buttons */}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMember}>
              Add Member
            </Button>
          </div>

        </div>
      </Modal>
    </div>
  );
};
export default AdminDashboard;