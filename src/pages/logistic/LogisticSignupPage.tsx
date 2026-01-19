import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Truck, Shield, Clock, MapPin, CheckCircle } from 'lucide-react';

export function LogisticSignupPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [vehicleType, setVehicleType] = useState('motorcycle');
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { signUp } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Sign up user
        const { error: signUpError, data } = await signUp(email, password, fullName, 'logistic');

        if (signUpError) {
            setError(signUpError.message);
            setLoading(false);
            return;
        }

        if (data?.user) {
            try {
                // Create driver profile using RPC
                const { error: driverError } = await supabase.rpc('register_logistic_driver', {
                    p_profile_id: data.user.id,
                    p_driver_name: fullName,
                    p_phone_number: phone,
                    p_vehicle_type: vehicleType,
                    p_vehicle_number: vehicleNumber
                });

                if (driverError) {
                    console.error('Error creating driver profile:', driverError);
                    // Even if profile creation fails, they are signed up as a user
                }

                navigate('/logistic/dashboard');
            } catch (err) {
                console.error('Unexpected error:', err);
                navigate('/logistic/dashboard');
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <div className="flex flex-col lg:flex-row">
                {/* Left Side - Info */}
                <div className="lg:w-1/2 bg-emerald-600 p-12 lg:min-h-screen flex flex-col justify-center text-white">
                    <div className="max-w-md mx-auto">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8">
                            <Truck className="h-10 w-10 text-white" />
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-bold mb-6">Drive with ZimLogistics</h1>
                        <p className="text-emerald-50 text-xl mb-12">Join our fleet of professional drivers and start earning on your own schedule.</p>

                        <div className="space-y-8">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                                    <Clock className="h-6 w-6 text-emerald-200" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">Flexible Hours</h3>
                                    <p className="text-emerald-100/80">Choose when you want to work. Be your own boss.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                                    <Shield className="h-6 w-6 text-emerald-200" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">Reliable Income</h3>
                                    <p className="text-emerald-100/80">Get paid weekly directly to your digital wallet.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                                    <MapPin className="h-6 w-6 text-emerald-200" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">Local Deliveries</h3>
                                    <p className="text-emerald-100/80">Deliver within your city and stay close to home.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="lg:w-1/2 p-8 lg:p-24 flex items-center justify-center">
                    <div className="max-w-md w-full">
                        <div className="mb-10">
                            <h2 className="text-3xl font-bold text-slate-900 mb-2">Driver Registration</h2>
                            <p className="text-slate-500">Create your account to join the fleet.</p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-medium flex items-center gap-3">
                                <div className="w-1.5 h-1.5 bg-red-600 rounded-full" />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                                        placeholder="Enter Full Name"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                                        placeholder="+1234567890"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                                    placeholder="email@example.com"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Vehicle Type</label>
                                    <select
                                        value={vehicleType}
                                        onChange={(e) => setVehicleType(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-emerald-500 transition-all outline-none appearance-none"
                                    >
                                        <option value="motorcycle">Motorcycle</option>
                                        <option value="car">Car</option>
                                        <option value="van">Van</option>
                                        <option value="truck">Truck</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">License Plate</label>
                                    <input
                                        type="text"
                                        value={vehicleNumber}
                                        onChange={(e) => setVehicleNumber(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                                        placeholder="ABC-1234"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? 'Processing...' : 'Register as Driver'}
                                    <CheckCircle className="h-5 w-5" />
                                </button>
                            </div>
                        </form>

                        <div className="mt-8 text-center bg-slate-50 p-6 rounded-3xl border border-slate-100">
                            <p className="text-slate-500 text-sm">
                                Already have a driver account?{' '}
                                <Link to="/login" className="text-emerald-600 font-bold hover:underline">
                                    Sign in as Logistic
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
