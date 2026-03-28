import { useState } from "react";
import { toast } from "react-toastify";
import { Loader2, Mail, ArrowRight, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (!email) {
            toast.error("Please enter a valid email address");
            return;
        }

        try {
            setIsLoading(true);

            const res = await fetch("http://localhost:5000/api/auth/forgotpassword", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Failed to send reset email");
            }

            toast.success("OTP sent to your email!");
            navigate('/resetpassword', { state: { email } });
        } catch (err) {
            toast.error(err.message || "Something went wrong.");
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
                    <button 
                        onClick={() => navigate('/')} 
                        className="absolute top-6 left-6 text-gray-400 hover:text-gray-900 transition flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest"
                    >
                        <ArrowLeft size={14} /> Back
                    </button>

                    {/* Header */}
                    <div className="text-center mb-8 border-b border-gray-100 pb-6 pt-6">
                        <div className="w-14 h-14 bg-gradient-to-r from-blue-900 to-blue-700 rounded-xl mx-auto mb-4 flex items-center justify-center shadow-md">
                            <Mail className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight uppercase">
                            Reset Password
                        </h1>
                        <p className="text-[10px] font-extrabold text-gray-400 mt-2 uppercase tracking-widest max-w-[280px] mx-auto leading-relaxed">
                            Enter your email and we'll send you instructions to reset your password.
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
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded focus:ring-0 focus:border-gray-900 outline-none transition text-sm font-bold placeholder:font-bold placeholder:text-gray-300"
                                        placeholder="Enter email"
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
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        Send Reset Link
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
