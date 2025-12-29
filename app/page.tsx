import Link from 'next/link';
import { FaBook, FaUserMd, FaClipboardList, FaArrowRight } from 'react-icons/fa';
import connectToDatabase from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import UserMenu from '@/components/UserMenu';
import Course from '@/models/Course';
import Mcq from '@/models/MCQ';
import User from '@/models/User';
import { NeuButton } from '@/components/ui/NeuButton';

// Force dynamic rendering so new courses show up
export const dynamic = 'force-dynamic';

async function getCourses() {
    await connectToDatabase();
    // Only show published courses
    const courses = await Course.find({ isPublished: true })
        .populate('instructor', 'username')
        .sort({ createdAt: -1 })
        .lean();
    return JSON.parse(JSON.stringify(courses));
}

async function getMcqs() {
    await connectToDatabase();
    // Only show published MCQs
    const mcqs = await Mcq.find({ isPublished: true })
        .sort({ createdAt: -1 })
        .lean();
    return JSON.parse(JSON.stringify(mcqs));
}

export default async function HomePage() {
    const courses = await getCourses();
    const mcqs = await getMcqs();
    const session = await getServerSession(authOptions);

    let enrolledCourseIds = new Set<string>();
    let isAdminOrOwner = false;

    if (session?.user?.id) {
        if (session.user.role === 'owner' || session.user.role === 'admin') {
            isAdminOrOwner = true;
        }

        await connectToDatabase();
        // If not admin/owner, get real enrollments
        if (!isAdminOrOwner) {
            const user = await User.findById(session.user.id).select('enrolledCourses').lean();
            if (user && user.enrolledCourses) {
                user.enrolledCourses.forEach((id: any) => enrolledCourseIds.add(id.toString()));
            }
        }
    }

    return (
        <div className="min-h-screen bg-neu-bg flex flex-col">
            <header className="bg-neu-bg shadow-neumorphism z-50">
                <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <h1 className="text-3xl font-extrabold text-blue-800 tracking-tight">
                        MEDDIGEST
                    </h1>
                    <div className="space-x-4">
                        {session?.user ? (
                            <UserMenu user={session.user} />
                        ) : (
                            <>
                                <Link href="/login" className="text-gray-600 hover:text-blue-600 font-bold transition-colors">Login</Link>
                                <Link href="/register">
                                    <NeuButton variant="primary">Get Started</NeuButton>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </header>


            <main className="flex-1 max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 w-full space-y-16">

                {/* Hero Section */}
                <div className="text-center">
                    <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
                        Medical Education <span className="text-blue-600">Simplified</span>
                    </h2>
                    <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
                        Structured, accurate, and deterministic learning for medical professionals.
                    </p>
                </div>

                {/* Courses Section */}
                <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-4 flex items-center gap-2">
                        <FaBook className="text-blue-600" /> Available Courses
                    </h3>

                    {courses.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500 text-lg">No courses available yet. Check back soon.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                            {courses.map((course: any) => {
                                const isEnrolled = isAdminOrOwner || enrolledCourseIds.has(course._id.toString());
                                return (
                                    <Link href={`/courses/${course._id}`} key={course._id} className="flex flex-col course-card overflow-hidden transition-shadow cursor-pointer group">
                                        <div className="flex-shrink-0">
                                            <img
                                                className="h-48 w-full object-cover group-hover:opacity-90 transition-opacity"
                                                src={course.thumbnail || 'https://via.placeholder.com/400x200?text=No+Thumbnail'}
                                                alt={course.title}
                                            />
                                        </div>
                                        <div className="flex-1 p-6 flex flex-col justify-between">
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-blue-600">
                                                    Medical Course
                                                </p>
                                                <div className="block mt-2">
                                                    <p className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{course.title}</p>
                                                    <p className="mt-3 text-base text-gray-500 line-clamp-3">
                                                        {course.description}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="mt-6 flex items-center justify-between">
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <FaUserMd className="mr-1" />
                                                    {course.instructor?.username || 'Instructor'}
                                                </div>
                                                {isEnrolled ? (
                                                    <div className="text-lg font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                                                        Enrolled
                                                    </div>
                                                ) : (
                                                    <div className="text-lg font-bold text-gray-900">
                                                        ₦{course.price.toLocaleString()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* MCQs Section */}
                {mcqs.length > 0 && (
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-4 flex items-center gap-2">
                            <FaClipboardList className="text-blue-600" /> Practice Quizzes (MCQs)
                        </h3>

                        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                            {mcqs.map((mcq: any) => (
                                <Link href={`/mcqs/${mcq._id}`} key={mcq._id} className="flex flex-col course-card overflow-hidden transition-shadow cursor-pointer group">
                                    <div className="flex-shrink-0 relative">
                                        <img
                                            className="h-48 w-full object-cover group-hover:opacity-90 transition-opacity"
                                            src={mcq.thumbnail || 'https://via.placeholder.com/400x200?text=No+Thumbnail'}
                                            alt={mcq.title}
                                        />
                                        <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
                                            MCQ
                                        </div>
                                    </div>
                                    <div className="flex-1 p-6 flex flex-col justify-between">
                                        <div className="flex-1">
                                            <div className="block mt-2">
                                                <p className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{mcq.title}</p>
                                                <p className="mt-3 text-base text-gray-500 line-clamp-3">
                                                    {mcq.description}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-6">
                                            <div className="w-full flex items-center justify-center bg-blue-50 text-blue-700 font-bold py-2 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                Take Quiz <FaArrowRight className="ml-2" />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

            </main>

            <footer className="bg-slate-900 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <h4 className="text-lg font-bold mb-4">MEDDIGEST</h4>
                        <p className="text-gray-400 text-sm">
                            Building trustworthy medical knowledge for the next generation of healthcare professionals.
                        </p>
                    </div>
                    <div>
                        <h4 className="text-lg font-bold mb-4">Links</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><Link href="/about" className="hover:text-white">About Us</Link></li>
                            <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-lg font-bold mb-4">Contact</h4>
                        <p className="text-gray-400 text-sm">support@meddigest.com</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
