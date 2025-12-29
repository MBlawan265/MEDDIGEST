'use client';

import { useState, useEffect } from 'react';
import { signIn, getSession, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FaUserMd, FaLock, FaUser } from 'react-icons/fa';
import { NeuButton } from '@/components/ui/NeuButton';
import { NeuInput } from '@/components/ui/NeuInput';
import { NeuCard } from '@/components/ui/NeuCard';

export default function LoginPage() {
    const router = useRouter();
    const { status } = useSession();
    const searchParams = useSearchParams();
    const registered = searchParams.get('registered');
    const callbackUrl = searchParams.get('callbackUrl') || '/';

    const [formData, setFormData] = useState({
        identifier: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (status === 'authenticated') {
            router.replace(callbackUrl);
        }
    }, [status, router, callbackUrl]);

    useEffect(() => {
        if (registered) {
            setSuccessMessage('Account created successfully! Please sign in.');
        }
    }, [registered]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            const res = await signIn('credentials', {
                identifier: formData.identifier,
                password: formData.password,
                redirect: false,
            });

            if (res?.error) {
                setError(res.error);
                setIsSubmitting(false);
            } else {
                const session = await getSession();
                const userRole = session?.user?.role;

                if (callbackUrl && callbackUrl !== '/') {
                    router.push(callbackUrl);
                } else {
                    if (userRole === 'owner') {
                        router.push('/admin/courses');
                    } else if (userRole === 'instructor') {
                        router.push('/instructor/courses');
                    } else {
                        router.push('/');
                    }
                }
                router.refresh();
            }
        } catch (err: any) {
            setError('An unexpected error occurred');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-neu-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <div className="mx-auto h-20 w-20 rounded-full flex items-center justify-center text-blue-600 text-4xl shadow-neumorphism">
                    <FaUserMd />
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-800">
                    Sign in to MEDDIGEST
                </h2>
                <p className="mt-2 text-center text-sm text-gray-500">
                    Welcome back, future doctor
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <NeuCard className="py-8 px-4 sm:px-10">
                    {successMessage && (
                        <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                            <div className="flex">
                                <div className="ml-3">
                                    <p className="text-sm text-green-700 font-medium">{successMessage}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                            <div className="flex">
                                <div className="ml-3">
                                    <p className="text-sm text-red-700 font-medium">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <NeuInput
                            id="identifier"
                            name="identifier"
                            type="text"
                            label="Email or Username"
                            icon={<FaUser />}
                            required
                            placeholder="Enter your email or username"
                            value={formData.identifier}
                            onChange={handleChange}
                        />

                        <NeuInput
                            id="password"
                            name="password"
                            type="password"
                            label="Password"
                            icon={<FaLock />}
                            required
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                        />

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600">
                                    Remember me
                                </label>
                            </div>

                            <div className="text-sm">
                                <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                                    Forgot password?
                                </a>
                            </div>
                        </div>

                        <div>
                            <NeuButton
                                type="submit"
                                isLoading={isSubmitting}
                                className="w-full font-bold text-lg"
                                variant="primary"
                            >
                                {isSubmitting ? 'Signing in...' : 'Sign In'}
                            </NeuButton>
                        </div>
                    </form>

                    <div className="mt-8">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300 opacity-50" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-neu-bg text-gray-500">
                                    Don't have an account?
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 text-center">
                            <Link
                                href="/register"
                                className="font-bold text-blue-600 hover:text-blue-500 transition-colors"
                            >
                                Create an account
                            </Link>
                        </div>
                    </div>
                </NeuCard>
            </div>
        </div>
    );
}
