import { useState } from "react";
import { toast } from "react-toastify";
import {
    Eye,
    EyeOff,
    Loader2,
    Mail,
    Lock,
    Stethoscope,
    ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Login() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
        role: "staff", // UI only
    });

    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async () => {
        try {
            setIsLoading(true);

            const res = await fetch("http://localhost:5000/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Login failed");
            }

            // ✅ Store token & user
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            
            toast.success("Logged in successfully!");

            // ✅ Redirect based on backend role
            const role = data.user.role;

            if (role === "nurse") navigate("/staff");
            else if (role == "admin") navigate("/admin");
            else if (role === "doctor") navigate("/doctor");

        } catch (err) {
            toast.error(err.message || "Authentication failed.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-blue-50 p-4 lg:p-6 gap-4">

            {/* LEFT IMAGE SECTION */}
            <div className="hidden md:block w-1/2 relative rounded-[40px] overflow-hidden shadow-2xl border border-gray-200">
                <img
                    src="https://images.unsplash.com/photo-1586773860418-d37222d8fce3"
                    alt="hospital"
                    className="h-full w-full object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-r from-blue-900/60 to-transparent"></div>

                <div className="absolute bottom-16 left-16 text-white max-w-md">
                    <h2 className="text-5xl font-black tracking-tight mb-4 uppercase">WardWatch</h2>
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-300">
                        Smart Real-Time Hospital Ward Monitoring System
                    </p>
                </div>
            </div>

            {/* RIGHT LOGIN SECTION */}
            <div className="flex items-center justify-center w-full md:w-1/2 px-6">

                <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-sm p-10">

                    {/* Header */}
                    <div className="text-center mb-10 border-b border-gray-100 pb-6">
                        <div className="w-14 h-14 bg-gradient-to-r from-blue-900 to-blue-700 rounded-xl mx-auto mb-4 flex items-center justify-center shadow-md">
                            <Stethoscope className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight uppercase">
                            Welcome Back
                        </h1>

                        <p className="text-[10px] font-extrabold text-gray-400 mt-2 uppercase tracking-widest">
                            Login to continue
                        </p>
                    </div>

                    <div className="space-y-6">

                        {/* Email */}
                        <div>
                            <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 block">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded focus:ring-0 focus:border-gray-900 outline-none transition text-sm font-bold placeholder:font-bold placeholder:text-gray-300"
                                    placeholder="Enter email"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block">
                                    Password
                                </label>
                                <button
                                    type="button"
                                    onClick={() => navigate('/forgotpassword')}
                                    className="text-[10px] font-extrabold text-blue-900 uppercase tracking-widest hover:text-blue-700 transition"
                                >
                                    Forgot Password?
                                </button>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded focus:ring-0 focus:border-gray-900 outline-none transition text-sm font-bold placeholder:font-bold placeholder:text-gray-300"
                                    placeholder="Enter password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Button */}
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="w-full bg-gray-900 text-white py-4 rounded font-extrabold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-black transition shadow-none mt-4"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Logging in...
                                </>
                            ) : (
                                <>
                                    Secure Login
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}