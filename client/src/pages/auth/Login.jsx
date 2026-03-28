import { useState } from "react";
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
        role: "staff",
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
        setIsLoading(true);

        setTimeout(() => {
            if (formData.role === "staff") navigate("/staff");
            else if (formData.role === "doctor") navigate("/doctor");
            else navigate("/admin");
        }, 800);
    };

    return (
        <div className="min-h-screen flex">

            {/* LEFT IMAGE SECTION */}
            <div className="hidden md:block w-1/2 relative">
                <img
                    src="https://images.unsplash.com/photo-1586773860418-d37222d8fce3"
                    alt="hospital"
                    className="h-full w-full object-cover"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-900/70 to-transparent"></div>

                {/* Curve effect */}
                <div className="absolute right-0 top-0 h-full w-24 bg-white"
                    style={{ clipPath: "ellipse(100% 100% at 100% 50%)" }}>
                </div>

                {/* Text on image */}
                <div className="absolute bottom-10 left-10 text-white max-w-sm">
                    <h2 className="text-3xl font-bold mb-2">
                        WardWatch
                    </h2>
                    <p className="text-sm opacity-90">
                        Smart real-time hospital ward monitoring system
                    </p>
                </div>
            </div>

            {/* RIGHT LOGIN SECTION */}
            <div className="flex items-center justify-center w-full md:w-1/2 px-6 bg-gradient-to-br from-blue-50 via-white to-blue-100">

                <div className="w-full max-w-md bg-white/80 backdrop-blur-lg border border-gray-200 rounded-2xl shadow-xl p-8">

                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-14 h-14 bg-gradient-to-r from-blue-900 to-blue-700 rounded-xl mx-auto mb-4 flex items-center justify-center shadow-md">
                            <Stethoscope className="w-6 h-6 text-white" />
                        </div>

                        <h1 className="text-2xl font-semibold text-gray-900">
                            Welcome Back
                        </h1>

                        <p className="text-sm text-gray-500 mt-1">
                            Login to continue
                        </p>
                    </div>

                    <div className="space-y-5">

                        {/* Email */}
                        <div>
                            <label className="text-sm font-medium text-gray-600 mb-1 block">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                                    placeholder="Enter your email"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="text-sm font-medium text-gray-600 mb-1 block">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                                    placeholder="Enter your password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Button */}
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-blue-900 to-blue-700 text-white py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 hover:opacity-95 transition shadow-md"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Logging in...
                                </>
                            ) : (
                                <>
                                    Sign in
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                        <p className="text-sm text-center text-gray-500 mt-4">
                            Don’t have credentials?{" "}
                            <span
                                onClick={() => navigate("/register")}
                                className="text-blue-700 font-medium cursor-pointer hover:underline"
                            >
                                Register here
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}