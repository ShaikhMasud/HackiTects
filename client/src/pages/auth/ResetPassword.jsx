import { useState } from "react";
import { toast } from "react-toastify";
import { Loader2, Lock, ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";

export default function ResetPassword() {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email;

    const [otp, setOtp] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    if (!email) {
        return <Navigate to="/forgotpassword" replace />;
    }

    const handleSubmit = async () => {
        if (!otp || otp.length !== 6) {
            toast.error("Please enter a valid 6-digit OTP");
            return;
        }
        if (!password || password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }
        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        try {
            setIsLoading(true);

            const res = await fetch(`${import.meta.env.VITE_API_URL || "https://hackitects.onrender.com"}/api/auth/resetpassword`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, otp, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Failed to reset password");
            }

            setSuccess(true);
            toast.success("Password successfully reset!");
        } catch (err) {
            toast.error(err.message || "Invalid or expired token.");
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

            {/* RIGHT SECTION */}
            <div className="flex flex-col items-center justify-center w-full md:w-1/2 px-6">
                <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-sm p-10 relative">

                    {/* Header */}
                    <div className="text-center mb-8 border-b border-gray-100 pb-6 pt-2">
                        <div className="w-14 h-14 bg-gradient-to-r from-blue-900 to-blue-700 rounded-xl mx-auto mb-4 flex items-center justify-center shadow-md">
                            <Lock className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight uppercase">
                            Set New Password
                        </h1>
                        <p className="text-[10px] font-extrabold text-gray-400 mt-2 uppercase tracking-widest max-w-[280px] mx-auto leading-relaxed">
                            Create a strong, secure password for your account.
                        </p>
                    </div>

                    {success ? (
                        <div className="text-center space-y-6">
                            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-sm font-bold">
                                Your password has been successfully reset! You can now access your dashboard.
                            </div>
                            <button
                                onClick={() => navigate('/')}
                                className="w-full bg-gray-900 text-white py-4 rounded font-extrabold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-black transition shadow-none"
                            >
                                Login With New Password
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* OTP */}
                            <div>
                                <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 block">
                                    6-Digit OTP
                                </label>
                                <div className="relative">
                                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        maxLength={6}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded focus:ring-0 focus:border-gray-900 outline-none transition text-sm font-bold placeholder:font-bold placeholder:text-gray-300 tracking-widest"
                                        placeholder="123456"
                                    />
                                </div>
                            </div>

                            {/* New Password */}
                            <div>
                                <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 block">
                                    New Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded focus:ring-0 focus:border-gray-900 outline-none transition text-sm font-bold placeholder:font-bold placeholder:text-gray-300"
                                        placeholder="••••••••"
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

                            {/* Confirm Password */}
                            <div>
                                <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 block">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded focus:ring-0 focus:border-gray-900 outline-none transition text-sm font-bold placeholder:font-bold placeholder:text-gray-300"
                                        placeholder="••••••••"
                                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                                    />
                                </div>
                            </div>

                            {/* Button */}
                            <button
                                onClick={handleSubmit}
                                disabled={isLoading}
                                className="w-full bg-gray-900 text-white py-4 rounded font-extrabold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-black transition shadow-none"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        Update Password
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
