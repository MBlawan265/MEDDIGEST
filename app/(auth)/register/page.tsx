'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaUserMd, FaWhatsapp, FaEnvelope, FaLock, FaUser, FaUniversity } from 'react-icons/fa';
import { NeuButton } from '@/components/ui/NeuButton';
import { NeuInput } from '@/components/ui/NeuInput';
import { NeuSelect } from '@/components/ui/NeuSelect';
import { NeuCard } from '@/components/ui/NeuCard';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        whatsapp: '',
        institution: '',
    });
    const [institutions, setInstitutions] = useState<{ _id: string, name: string }[]>([]);
    const [isForeign, setIsForeign] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchInstitutions = async () => {
            try {
                const res = await fetch('/api/institutions');
                if (res.ok) {
                    const data = await res.json();
                    setInstitutions(data);
                }
            } catch (err) {
                console.error('Failed to fetch institutions', err);
            }
        };
        fetchInstitutions();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'whatsapp') {
            // Only allow numbers
            const numericValue = value.replace(/\D/g, '');
            setFormData({ ...formData, [name]: numericValue });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        setSuggestions([]);

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setIsSubmitting(false);
            return;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters');
            setIsSubmitting(false);
            return;
        }

        try {
            // Exclude confirmPassword from body
            const { confirmPassword, ...submitData } = formData;
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submitData),
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.suggestions) {
                    setSuggestions(data.suggestions);
                }
                throw new Error(data.message || 'Registration failed');
            }

            // Redirect to login page
            router.push('/login?registered=true');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-neu-bg flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <div className="mx-auto h-20 w-20 rounded-full flex items-center justify-center text-blue-600 text-4xl shadow-neumorphism mb-6">
                    <FaUserMd />
                </div>
                <h2 className="text-center text-3xl font-extrabold text-gray-800">
                    Join MEDDIGEST
                </h2>
                <p className="mt-2 text-center text-sm text-gray-500">
                    Start your medical learning journey today
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <NeuCard className="py-8 px-4 sm:px-10">
                    {error && (
                        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                            <div className="flex flex-col">
                                <div className="flex">
                                    <div className="ml-3">
                                        <p className="text-sm text-red-700 font-medium">{error}</p>
                                    </div>
                                </div>
                                {suggestions.length > 0 && (
                                    <div className="mt-2 ml-3">
                                        <p className="text-sm text-gray-600">Available suggestions:</p>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {suggestions.map((sugg) => (
                                                <button
                                                    key={sugg}
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, username: sugg }))}
                                                    className="inline-flex items-center px-3 py-1 text-xs font-bold rounded-full text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none transition-colors shadow-sm"
                                                >
                                                    {sugg}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <NeuInput
                            id="fullName"
                            name="fullName"
                            type="text"
                            label="Full Name"
                            icon={<FaUser />}
                            required
                            placeholder="Abdul Yusuf"
                            value={formData.fullName}
                            onChange={handleChange}
                        />

                        <NeuInput
                            id="username"
                            name="username"
                            type="text"
                            label="Username"
                            icon={<FaUser />}
                            required
                            placeholder="FutureDr"
                            value={formData.username}
                            onChange={handleChange}
                        />

                        <NeuInput
                            id="email"
                            name="email"
                            type="email"
                            label="Email address"
                            icon={<FaEnvelope />}
                            required
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={handleChange}
                        />

                        <div>
                            {isForeign ? (
                                <NeuInput
                                    id="institution"
                                    name="institution"
                                    type="text"
                                    label="Institution"
                                    icon={<FaUniversity />}
                                    required
                                    placeholder="Enter your university name"
                                    value={formData.institution}
                                    onChange={handleChange}
                                />
                            ) : (
                                <NeuSelect
                                    id="institution"
                                    name="institution"
                                    label="Institution"
                                    icon={<FaUniversity />}
                                    required
                                    value={formData.institution}
                                    onChange={handleChange}
                                >
                                    <option value="">Select your institution</option>
                                    {institutions.map((inst) => (
                                        <option key={inst._id} value={inst.name}>
                                            {inst.name}
                                        </option>
                                    ))}
                                </NeuSelect>
                            )}
                            <div className="mt-3 flex items-center ml-1">
                                <input
                                    id="isForeign"
                                    name="isForeign"
                                    type="checkbox"
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded shadow-neumorphism-inset"
                                    checked={isForeign}
                                    onChange={(e) => {
                                        setIsForeign(e.target.checked);
                                        setFormData(prev => ({ ...prev, institution: '' }));
                                    }}
                                />
                                <label htmlFor="isForeign" className="ml-2 block text-sm text-gray-700 font-medium">
                                    Foreign Student?
                                </label>
                            </div>
                        </div>

                        <NeuInput
                            id="whatsapp"
                            name="whatsapp"
                            type="tel"
                            label="WhatsApp Number"
                            icon={<FaWhatsapp />}
                            required
                            placeholder="+234..."
                            value={formData.whatsapp}
                            onChange={handleChange}
                        />

                        <NeuInput
                            id="password"
                            name="password"
                            type="password"
                            label="Password"
                            icon={<FaLock />}
                            required
                            placeholder="•••••••• (min 8 chars)"
                            value={formData.password}
                            onChange={handleChange}
                        />

                        <NeuInput
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            label="Confirm Password"
                            icon={<FaLock />}
                            required
                            placeholder="••••••••"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                        />

                        <div className="pt-2">
                            <NeuButton
                                type="submit"
                                isLoading={isSubmitting}
                                className="w-full font-bold text-lg"
                                variant="primary"
                            >
                                {isSubmitting ? 'Creating account...' : 'Create Account'}
                            </NeuButton>
                        </div>
                    </form>

                    <div className="mt-8">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300 opacity-50" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-neu-bg text-gray-500 font-medium">
                                    Already have an account?
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 text-center">
                            <Link
                                href="/login"
                                className="font-bold text-blue-600 hover:text-blue-500 transition-colors"
                            >
                                Sign in instead
                            </Link>
                        </div>
                    </div>
                </NeuCard>
            </div>
        </div>
    );
}
