'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { FaPlayCircle, FaCheckCircle, FaLock, FaUserMd, FaTimes, FaChevronDown, FaChevronUp, FaGraduationCap, FaClock, FaBookOpen } from 'react-icons/fa';
import ReactPlayer from 'react-player/youtube';
import { NeuButton } from '@/components/ui/NeuButton';
import { NeuCard } from '@/components/ui/NeuCard';

export default function CourseDetailsPage() {
    const { data: session } = useSession();
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const courseId = params.courseId as string;

    const paymentStatus = searchParams.get('payment');

    const [course, setCourse] = useState<any>(null);
    const [selectedVideo, setSelectedVideo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [initializingPayment, setInitializingPayment] = useState(false);
    const [error, setError] = useState('');

    // Accordion state: Store IDs of open sections (by index)
    // Default: first section open
    const [openSections, setOpenSections] = useState<number[]>([0]);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const [verifying, setVerifying] = useState(false);

    useEffect(() => {
        if (courseId) {
            fetchCourse();
        }

        // Handle Payment Verification
        const trxref = searchParams.get('trxref');
        const reference = searchParams.get('reference');

        if (paymentStatus === 'verify' && (trxref || reference) && !verifying) {
            verifyPayment(trxref || reference!);
        }
    }, [courseId, session, paymentStatus, searchParams]);

    const verifyPayment = async (reference: string) => {
        if (verifying) return;
        setVerifying(true);
        try {
            const res = await fetch('/api/payment/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reference })
            });

            const data = await res.json();

            if (res.ok && data.status === 'success') {
                // Refresh course data to reflect enrollment
                await fetchCourse();
                // Clear URL params
                router.replace(`/courses/${courseId}?payment=success`);
            } else {
                setError(data.message || 'Payment verification failed');
            }
        } catch (err) {
            console.error(err);
            setError('Failed to verify payment');
        } finally {
            setVerifying(false);
        }
    };

    const fetchCourse = async () => {
        try {
            // Use PUBLIC endpoint (handles sanitization for non-enrolled)
            const res = await fetch(`/api/courses/${courseId}`);
            if (res.ok) {
                const data = await res.json();
                setCourse(data);
            } else {
                setError('Course not found');
            }
        } catch (err) {
            setError('Failed to load course');
        } finally {
            setLoading(false);
        }
    };

    const handleBuyNow = async () => {
        if (!session) {
            signIn();
            return;
        }

        setInitializingPayment(true);
        setError('');

        try {
            const res = await fetch('/api/payment/initialize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseId }),
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.message === 'Already enrolled') {
                    router.push(`/courses/${courseId}/learn`);
                } else {
                    setError(data.message || 'Payment initialization failed');
                }
            } else {
                window.location.href = data.authorizationUrl;
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setInitializingPayment(false);
        }
    };

    const toggleSection = (index: number) => {
        setOpenSections(prev =>
            prev.includes(index)
                ? prev.filter(i => i !== index)
                : [...prev, index]
        );
    };

    const handleLessonClick = (video: any, isEnrolled: boolean) => {
        if (!session) {
            const redirectUrl = encodeURIComponent(`/courses/${courseId}`);
            router.push(`/login?callbackUrl=${redirectUrl}`);
            return;
        }

        if (isEnrolled) {
            router.push(`/courses/${courseId}/learn`);
            return;
        }

        if (video.isPreview) {
            setSelectedVideo(video);
        } else {
            showToast("This lecture is locked. Purchase the course to continue.");
        }
    };

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-neu-bg">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
    );

    if (error) return <div className="p-8 text-center text-red-600 font-medium">{error}</div>;
    if (!course) return null;

    // BRANDING FORCE
    const INSTRUCTOR_NAME = "MB LAWAN";

    const totalStudents = course.enrolledCount || 0;
    const updatedDate = new Date(course.updatedAt).toLocaleDateString();

    return (
        <div className="min-h-screen bg-neu-bg text-gray-700 font-sans pb-12">
            {/* Toast */}
            {toastMessage && (
                <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-neu-bg text-gray-800 px-6 py-3 rounded-full shadow-neumorphism z-50 flex items-center animate-fade-in-down border border-white/50">
                    <FaLock className="mr-2 text-yellow-500" />
                    {toastMessage}
                </div>
            )}

            {/* Hero Section - Soft UI Header */}
            <div className="bg-neu-bg pt-12 pb-8 px-4 sm:px-6 lg:px-8 shadow-neumorphism mb-8 relative z-10 transition-all duration-500">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
                    <div className="flex-1 space-y-6">
                        <div className="flex items-center space-x-2 text-blue-600 text-sm font-bold uppercase tracking-wider">
                            <FaGraduationCap />
                            <span>Medical Education</span>
                        </div>
                        <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-gray-800">
                            {course.title}
                        </h1>
                        <p className="text-lg text-gray-600 leading-relaxed max-w-2xl">
                            {course.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
                            <div className="flex items-center">
                                <FaUserMd className="mr-2 text-blue-500" />
                                Created by <span className="text-gray-800 font-bold ml-1 text-base">{INSTRUCTOR_NAME}</span>
                            </div>
                            <div className="flex items-center">
                                <FaClock className="mr-2" />
                                <span>Last updated {updatedDate}</span>
                            </div>
                            <div className="flex items-center">
                                <FaBookOpen className="mr-2" />
                                <span>{course.sections?.reduce((acc: any, s: any) => acc + (s.lessons?.length || 0), 0)} lectures</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Main Content: Curriculum */}
                    <div className="flex-1">
                        {paymentStatus === 'success' && (
                            <NeuCard className="mb-8 border-l-4 border-green-500">
                                <div className="flex items-center">
                                    <FaCheckCircle className="text-green-500 text-xl mr-3" />
                                    <div>
                                        <h3 className="text-green-800 font-bold">Payment Successful!</h3>
                                        <p className="text-green-700 text-sm">Welcome aboard. You can now access all course materials.</p>
                                    </div>
                                </div>
                            </NeuCard>
                        )}

                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Course Curriculum</h2>

                        <div className="space-y-6">
                            {course.sections?.map((section: any, idx: number) => {
                                const isOpen = openSections.includes(idx);
                                const totalLectures = section.lessons?.length || 0;

                                return (
                                    <NeuCard key={idx} className="!p-0 overflow-hidden transition-all duration-300">
                                        <button
                                            onClick={() => toggleSection(idx)}
                                            className={`
                                                w-full flex items-center justify-between px-6 py-5 transition-all duration-300 focus:outline-none
                                                ${isOpen ? 'bg-neu-bg shadow-neumorphism-inset text-blue-600' : 'bg-neu-bg text-gray-700 hover:text-blue-600'}
                                            `}
                                        >
                                            <div className="flex items-center gap-4">
                                                {isOpen ? <FaChevronUp /> : <FaChevronDown />}
                                                <div>
                                                    <h3 className="font-bold text-left text-lg">{section.title}</h3>
                                                </div>
                                            </div>
                                            <span className="text-sm font-medium opacity-70 bg-gray-200/50 px-3 py-1 rounded-full">{totalLectures} lectures</span>
                                        </button>

                                        {isOpen && (
                                            <div className="mt-2 p-4 space-y-3 bg-neu-bg">
                                                {section.lessons?.map((lesson: any, lIdx: number) => (
                                                    <div
                                                        key={lIdx}
                                                        onClick={() => handleLessonClick(lesson, course.isEnrolled)}
                                                        className={`
                                                            flex items-center justify-between px-6 py-4 rounded-xl cursor-pointer transition-all duration-300
                                                            ${(course.isEnrolled || lesson.isPreview)
                                                                ? 'bg-neu-bg shadow-neumorphism hover:shadow-neumorphism-hover border border-blue-100/30'
                                                                : 'bg-neu-bg shadow-neumorphism-flat opacity-80 hover:opacity-100 hover:shadow-neumorphism-sm'
                                                            }
                                                        `}
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            {(course.isEnrolled || lesson.isPreview)
                                                                ? <FaPlayCircle className="text-blue-500 text-xl" />
                                                                : <FaLock className="text-gray-400 text-sm" />
                                                            }
                                                            <div>
                                                                <p className={`text-sm font-bold ${(course.isEnrolled || lesson.isPreview) ? 'text-blue-800' : 'text-gray-600'}`}>
                                                                    {lesson.title}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {lesson.isPreview && !course.isEnrolled && (
                                                            <span className="text-[10px] text-blue-600 font-extrabold tracking-widest uppercase bg-blue-50 px-2 py-1 rounded-md shadow-sm">
                                                                Preview
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </NeuCard>
                                );
                            })}
                        </div>
                    </div>

                    {/* Sidebar: Sticky Buy Card */}
                    <div className="lg:w-96 relative">
                        <div className="sticky top-8 space-y-8">
                            {/* Course Enrollment Card */}
                            <NeuCard className="overflow-hidden p-0 pb-6 relative z-10 transition-transform duration-300">
                                <div className="aspect-video relative bg-neu-bg mb-6 shadow-neumorphism-inset mx-4 mt-4 rounded-xl overflow-hidden">
                                    {course.thumbnail ? (
                                        <img
                                            src={course.thumbnail}
                                            alt={course.title}
                                            className="w-full h-full object-cover mix-blend-multiply opacity-90 hover:scale-105 transition-transform duration-700"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-400 font-bold">
                                            No Thumbnail
                                        </div>
                                    )}
                                </div>
                                <div className="px-6">
                                    <div className="flex items-end justify-between mb-6">
                                        {course.isEnrolled ? (
                                            <div className="text-2xl font-extrabold text-green-600 bg-green-50 px-4 py-2 rounded-xl shadow-neumorphism-inset flex items-center">
                                                <FaCheckCircle className="mr-2" />
                                                Enrolled
                                            </div>
                                        ) : (
                                            <div className="text-4xl font-extrabold text-gray-800 tracking-tight">₦{course.price?.toLocaleString()}</div>
                                        )}
                                    </div>

                                    {course.isEnrolled ? (
                                        <NeuButton
                                            onClick={() => router.push(`/courses/${courseId}/learn`)}
                                            className="w-full font-bold text-lg"
                                            variant="primary"
                                        >
                                            Continue Learning
                                        </NeuButton>
                                    ) : (
                                        <NeuButton
                                            onClick={handleBuyNow}
                                            disabled={initializingPayment}
                                            isLoading={initializingPayment}
                                            className="w-full font-bold text-lg"
                                            variant="primary"
                                        >
                                            {initializingPayment ? 'Processing...' : `Buy Now`}
                                        </NeuButton>
                                    )}

                                    {!course.isEnrolled && (
                                        <p className="mt-4 text-xs text-center text-gray-500 font-medium">
                                            30-Day Money-Back Guarantee
                                        </p>
                                    )}

                                    <div className="mt-8 space-y-4 border-t border-gray-200 pt-6">
                                        <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wide opacity-80">Included in course</h4>
                                        <ul className="text-sm text-gray-600 space-y-3 font-medium">
                                            <li className="flex items-center"><FaPlayCircle className="mr-3 text-blue-400" /> On-demand video</li>
                                            <li className="flex items-center"><FaBookOpen className="mr-3 text-blue-400" /> Full lifetime access</li>
                                            <li className="flex items-center"><FaGraduationCap className="mr-3 text-blue-400" /> Certificate of completion</li>
                                        </ul>
                                    </div>
                                </div>
                            </NeuCard>
                        </div>
                    </div>
                </div>
            </div>

            {/* Video Preview Modal - Neumorphic Style */}
            {selectedVideo && (
                <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        <div
                            className="fixed inset-0 bg-neu-bg/90 transition-opacity backdrop-blur-sm"
                            aria-hidden="true"
                            onClick={() => setSelectedVideo(null)}
                        ></div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="inline-block align-middle bg-neu-bg rounded-2xl text-left overflow-hidden shadow-neumorphism transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full p-4 border border-white/50">
                            <div className="relative aspect-video w-full rounded-xl overflow-hidden shadow-neumorphism-inset bg-black">
                                <ReactPlayer
                                    url={selectedVideo.youtubeUrl}
                                    width="100%"
                                    height="100%"
                                    controls
                                    playing
                                    config={{
                                        playerVars: { showinfo: 0 }
                                    }}
                                />
                            </div>
                            <div className="mt-6 flex justify-between items-center px-4 mb-2">
                                <h3 className="text-lg font-bold text-gray-800">
                                    Preview: <span className="text-blue-600">{selectedVideo.title}</span>
                                </h3>
                                <NeuButton
                                    onClick={() => setSelectedVideo(null)}
                                    className="h-12 w-12 !p-0 flex items-center justify-center rounded-full"
                                >
                                    <FaTimes className="text-lg" />
                                </NeuButton>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
