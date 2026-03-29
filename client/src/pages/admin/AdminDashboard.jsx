import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
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
  const [wards, setWards] = useState([]);
  const [occupancyTrendData, setOccupancyTrendData] = useState([]);
  const [patientFlowData, setPatientFlowData] = useState([]);
  const [specializations, setSpecializations] = useState(["General", "ICU", "Premium"]);
  const [loading, setLoading] = useState(true);
  const [drilledWard, setDrilledWard] = useState(null);
  const [selectedBed, setSelectedBed] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [escalations, setEscalations] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isManageMenuOpen, setIsManageMenuOpen] = useState(false);
  const [isCreateWardModalOpen, setIsCreateWardModalOpen] = useState(false);
  const [editingWardId, setEditingWardId] = useState(null);
  const [deletingWardId, setDeletingWardId] = useState(null);
  const navigate = useNavigate();

  const handleLogout = () => {
     localStorage.removeItem("token");
     localStorage.removeItem("user");
     navigate("/");
  };

  const [wardForm, setWardForm] = useState({
    wardName: "",
    wardCategory: "",
    numberOfBeds: "",
  });

  const handleWardChange = (e) => {
    setWardForm({
      ...wardForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleSaveWard = async () => {
    try {
      const url = editingWardId ? `http://localhost:5000/api/wards/${editingWardId}` : "http://localhost:5000/api/wards";
      const method = editingWardId ? "PUT" : "POST";
      const res = await fetch(url, {
         method,
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
            wardName: wardForm.wardName,
            totalBeds: parseInt(wardForm.numberOfBeds) || 10,
            specialization: wardForm.wardCategory || "General"
         })
      });
      if(res.ok) {
         setWardForm({ wardName: "", wardCategory: "", numberOfBeds: "" });
         setEditingWardId(null);
         toast.success(editingWardId ? "Ward successfully updated." : "New ward successfully deployed.");
         fetchHospitalData(); 
      } else {
         const info = await res.json();
         toast.error(info.message || "Failed to save ward");
      }
    } catch(e) { console.error(e); }
    setIsCreateWardModalOpen(false);
  };

  const handleEditWard = (wardId) => {
     const w = wards.find(w => w._id === wardId);
     if(w) {
        setEditingWardId(wardId);
        setWardForm({ wardName: w.wardName, wardCategory: w.specialization || "General", numberOfBeds: w.totalBeds });
        setIsCreateWardModalOpen(true);
     }
  };

  const handleDeleteWard = (wardId) => {
     setDeletingWardId(wardId);
  };
  
  const executeDeleteWard = async () => {
     if(!deletingWardId) return;
     try {
        const res = await fetch(`http://localhost:5000/api/wards/${deletingWardId}`, { method: "DELETE" });
        if(res.ok) {
           setDeletingWardId(null);
           toast.success("Ward successfully uninstalled.");
           fetchHospitalData();
        } else {
           const info = await res.json();
           toast.error(info.message || "Failed to delete ward.");
        }
     } catch(e) { console.error(e); }
  };

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

  const handleAddMember = async () => {
  try {
    // Optional: basic validation
    if (!memberForm.email || !memberForm.password) {
      toast.error("Email and password are required");
      return;
    }
    if(memberForm.role=="staff"){
      memberForm.role="nurse"
    }

    const res = await fetch("http://localhost:5000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        firstName: memberForm.firstName,
        lastName: memberForm.lastName,
        email: memberForm.email,
        password: memberForm.password,
        role: memberForm.role,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Registration failed");
    }

    // ✅ Success
    toast.success("System Member provisioned successfully!");

    // (optional) store token if needed
    // localStorage.setItem("token", data.token);

    // ✅ Reset form
    setMemberForm({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "staff",
    });

    // ✅ Close modal
    setIsAddModalOpen(false);

  } catch (err) {
    toast.error(err.message || "Failed to provision team member");
  }
};
  const [activeGlobalTab, setActiveGlobalTab] = useState("wards");

  const fetchHospitalData = async () => {
    try {
      setLoading(true);
      const wardsRes = await fetch("http://localhost:5000/api/wards");
      const wd = await wardsRes.json();
      setWards(wd);

      const bedPromises = wd.map(w => fetch(`http://localhost:5000/api/wards/${w._id}`).then(r => r.json()));
      const results = await Promise.all(bedPromises);
      
      const allBeds = results.flatMap((r, index) => r.beds.map(b => ({
          id: b._id,
          ward: wd[index].wardName,
          bedNumber: b.bedNumber,
          status: b.status,
          patient: b.occupantPatientId ? {
              name: b.occupantPatientId.patientName,
              condition: b.occupantPatientId.primaryCondition || 'Standard',
              doctor: b.occupantPatientId.responsibleDoctorId ? `Dr. ${b.occupantPatientId.responsibleDoctorId.lastName}` : 'Assigned Provider',
              admitDate: b.occupantPatientId.admissionDate ? b.occupantPatientId.admissionDate.split('T')[0] : 'Pending'
          } : null,
          since: b.cleaningStartTime ? 'Cleaning' : null
      })));

      setBeds(allBeds);
      
      const allEscalationsRes = await fetch("http://localhost:5000/api/escalations");
      if (allEscalationsRes.ok) {
        const escData = await allEscalationsRes.json();
        setEscalations(escData.map(e => {
            const wardPrefix = e.wardId?.wardName ? `[${e.wardId.wardName}] ` : '';
            const bedPrefix = e.relatedBedId?.bedNumber ? `Bed ${e.relatedBedId.bedNumber} - ` : '';
            const patientPrefix = e.relatedPatientId?.patientName ? `[${e.relatedPatientId.patientName}] ` : '';
            return {
                id: e._id,
                type: e.severity ? e.severity.toLowerCase() : 'warning',
                message: `${wardPrefix}${bedPrefix}${patientPrefix}${e.description}`,
                time: e.createdAt || new Date().toISOString()
            };
        }));
      } else { setEscalations([]); }

      // Analytics
      const analyticsRes = await fetch("http://localhost:5000/api/analytics/dashboard");
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setOccupancyTrendData(analyticsData.occupancyTrendData);
        setPatientFlowData(analyticsData.patientFlowData);
        const fetchedSpecs = analyticsData.specializations;
        if (fetchedSpecs && fetchedSpecs.length > 0) {
            setSpecializations(fetchedSpecs);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitalData();
  }, []);

  useEffect(() => {
    const eventSource = new EventSource("http://localhost:5000/api/events/stream");

    const handleEvent = () => {
      fetchHospitalData();
    };

    eventSource.addEventListener("bed-updated", handleEvent);
    eventSource.addEventListener("patient-admitted", handleEvent);
    eventSource.addEventListener("patient-discharged", handleEvent);
    eventSource.addEventListener("escalation-created", handleEvent);
    eventSource.addEventListener("escalation-resolved", handleEvent);

    return () => {
      eventSource.removeEventListener("bed-updated", handleEvent);
      eventSource.removeEventListener("patient-admitted", handleEvent);
      eventSource.removeEventListener("patient-discharged", handleEvent);
      eventSource.removeEventListener("escalation-created", handleEvent);
      eventSource.removeEventListener("escalation-resolved", handleEvent);
      eventSource.close();
    };
  }, []);

  const totalBeds = beds.length;
  const totalOccupied = beds.filter(b => b.status === "occupied").length;
  const totalCleaning = beds.filter(b => b.status === "cleaning").length;
  const globalOccupancy = Math.round((totalOccupied / (totalBeds || 1)) * 100) || 0;

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
          <h2 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900">SYSTEM ADMINISTRATION</h2>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-2">Hospital Executive Analytics</p>
        </div>
        <div className="flex items-center gap-3 relative">
          <Button onClick={() => setIsManageMenuOpen(!isManageMenuOpen)} className="text-xs font-extrabold uppercase tracking-widest px-6 py-3 shadow-none">
            Manage Hospital ▼
          </Button>
          <Button onClick={handleLogout} variant="outline" className="text-xs font-extrabold uppercase tracking-widest px-4 py-3 shadow-none border-2 border-gray-200 text-gray-900 ml-2 hover:bg-red-50 hover:text-red-900 hover:border-red-200">
            Logout
          </Button>

          {isManageMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white border-2 border-gray-900 rounded shadow-xl z-50 overflow-hidden">
              <button 
                onClick={() => { setIsAddModalOpen(true); setIsManageMenuOpen(false); }}
                className="w-full text-left px-5 py-4 text-[10px] font-extrabold uppercase tracking-widest text-gray-900 hover:bg-gray-100 hover:text-black transition-colors border-b-2 border-gray-100"
              >
                + Add System Member
              </button>
              <button 
                onClick={() => { setEditingWardId(null); setWardForm({ wardName: "", wardCategory: "", numberOfBeds: "" }); setIsCreateWardModalOpen(true); setIsManageMenuOpen(false); }}
                className="w-full text-left px-5 py-4 text-[10px] font-extrabold uppercase tracking-widest text-gray-900 hover:bg-gray-100 hover:text-black transition-colors"
              >
                + Create New Ward
              </button>
            </div>
          )}
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
                      {specializations.filter(s => !['General', 'ICU', 'Premium'].includes(s)).map((spec, i) => (
                        <Area key={spec} type="monotone" dataKey={spec} stroke={`hsl(${i*40}, 70%, 50%)`} strokeWidth={3} fillOpacity={0.3} fill={`hsl(${i*40}, 70%, 50%)`} />
                      ))}
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
              {wards.map(ward => (
                <AdminWardCard 
                   key={ward._id} 
                   wardId={ward._id}
                   name={ward.wardName} 
                   beds={beds.filter(b => b.ward === ward.wardName)} 
                   onDrillDown={handleDrillDown} 
                   onEdit={handleEditWard}
                   onDelete={handleDeleteWard}
                />
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-gray-200 pb-6">
          <div className="w-full">
            <div className="flex items-center gap-3 mb-4">
              <Button variant="ghost" onClick={handleBackToGlobal} className="px-0 text-gray-400 hover:text-gray-900 hover:bg-transparent shadow-none text-[10px] font-extrabold uppercase tracking-widest transition-colors">
                &larr; Back to Hospital Center
              </Button>
            </div>
            <h2 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 uppercase">{drilledWard} OVERVIEW</h2>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mt-2">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Map Drill-Down Analysis</p>
              <span className="inline-flex items-center px-2.5 py-1 bg-gray-900 text-white text-[9px] rounded font-extrabold uppercase tracking-widest shadow-sm">
                Read-Only Audit Mode
              </span>
            </div>
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
              <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-sm bg-gradient-to-br from-blue-950 to-blue-900 shadow-sm border border-blue-950"></span> OCCUPIED</span>
              <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-sm bg-gradient-to-br from-violet-900 to-violet-800 shadow-sm border border-violet-950"></span> RESERVED</span>
              <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-sm bg-gradient-to-br from-amber-600 to-amber-500 shadow-sm border border-amber-700"></span> CLEANING</span>
              <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-sm bg-gradient-to-br from-emerald-600 to-emerald-500 shadow-sm border border-emerald-700"></span> AVAILABLE</span>
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
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)} className="px-6 text-[10px] font-extrabold uppercase tracking-widest shadow-none border-2 border-gray-200 text-gray-600">
              Cancel
            </Button>
            <Button onClick={handleAddMember} className="px-6 text-[10px] font-extrabold uppercase tracking-widest shadow-none">
              Commit Member
            </Button>
          </div>

        </div>
      </Modal>

      {/* CREATE WARD MODAL */}
      <Modal
        isOpen={isCreateWardModalOpen}
        onClose={() => setIsCreateWardModalOpen(false)}
        title={editingWardId ? "EDIT HOSPITAL WARD" : "CREATE HOSPITAL WARD"}
      >
        <div className="space-y-6">
          <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 leading-relaxed">
            Provision a new clinical ward inside the central administration roster. This expands capacity limits.
          </p>

          <div>
            <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 block">
              Ward Identification Name
            </label>
            <input
              name="wardName"
              placeholder="e.g. Pediatrics Wing"
              value={wardForm.wardName}
              onChange={handleWardChange}
              className="w-full pl-4 pr-4 py-3 border-2 border-gray-200 rounded focus:ring-0 focus:border-gray-900 outline-none transition text-sm font-bold placeholder:font-bold placeholder:text-gray-300"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
               <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 block">
                Ward Category
               </label>
               <input
                 type="text"
                 name="wardCategory"
                 placeholder="e.g. ICU, General"
                 value={wardForm.wardCategory}
                 onChange={handleWardChange}
                 className="w-full pl-4 pr-4 py-3 border-2 border-gray-200 rounded focus:ring-0 focus:border-gray-900 outline-none transition text-sm font-bold placeholder:font-bold placeholder:text-gray-300"
               />
            </div>
            
            <div className="w-1/3">
              <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 block">
                Bed Count
              </label>
              <input
                type="number"
                name="numberOfBeds"
                placeholder="0"
                value={wardForm.numberOfBeds}
                onChange={handleWardChange}
                className="w-full pl-4 pr-4 py-3 border-2 border-gray-200 rounded focus:ring-0 focus:border-gray-900 outline-none transition text-sm font-bold placeholder:font-bold placeholder:text-gray-300"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={() => setIsCreateWardModalOpen(false)} className="px-6 text-[10px] font-extrabold uppercase tracking-widest shadow-none border-2 border-gray-200 text-gray-600">
              Abort
            </Button>
            <Button onClick={handleSaveWard} className="px-6 text-[10px] font-extrabold uppercase tracking-widest shadow-none">
              {editingWardId ? "Save Ward Changes" : "Deploy Ward Space"}
            </Button>
          </div>

        </div>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={!!deletingWardId}
        onClose={() => setDeletingWardId(null)}
        title="DANGER: DECOMMISSION WARD"
      >
        <div className="space-y-6">
          <p className="text-sm font-bold text-gray-900 leading-relaxed">
            Are you absolutely sure you want to permanently decommission this clinical ward and its entire capacity framework?
          </p>
          <p className="text-[10px] font-extrabold text-red-500 uppercase tracking-widest leading-relaxed">
            Warning: This action cannot be undone. You cannot delete a ward if any beds inside are occupied.
          </p>
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={() => setDeletingWardId(null)} className="px-6 text-[10px] font-extrabold uppercase tracking-widest shadow-none border-2 border-gray-200 text-gray-600">
               Abort
            </Button>
            <Button onClick={executeDeleteWard} className="px-6 text-[10px] font-extrabold border-red-600 hover:border-red-700 uppercase tracking-widest bg-red-600 text-white hover:bg-red-700 shadow-none hover:shadow-lg transition-all">
               Format Ward Data
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};
export default AdminDashboard;