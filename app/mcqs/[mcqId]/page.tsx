import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Mcq from '@/models/MCQ';
import { notFound, redirect } from 'next/navigation';
import { FaLock, FaExternalLinkAlt, FaArrowLeft, FaClipboardList } from 'react-icons/fa';
import Link from 'next/link';
import { NeuButton } from '@/components/ui/NeuButton';

async function getMcq(mcqId: string) {
    await connectToDatabase();
    const mcq = await Mcq.findOne({ _id: mcqId, isPublished: true }).lean();
    if (!mcq) return null;
    return JSON.parse(JSON.stringify(mcq));
}

export default async function McqDetailPage({ params }: { params: { mcqId: string } }) {
    const session = await getServerSession(authOptions);
    const mcq = await getMcq(params.mcqId);

    if (!mcq) {
        notFound();
    }

    if (!session) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-neumorphism max-w-md w-full text-center space-y-6">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-600">
                        <FaLock size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Login Required</h1>
                    <p className="text-gray-500">
                        You need to be logged in to access this quiz. Please login or creates an account to continue.
                    </p>
                    <div className="flex flex-col gap-3">
                        <Link href={`/login?callbackUrl=/mcqs/${params.mcqId}`}>
                            <NeuButton className="w-full justify-center">Login to Continue</NeuButton>
                        </Link>
                        <Link href="/register" className="text-sm text-blue-600 hover:underline">
                            Don't have an account? Register
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header / Back Button */}
                <div>
                    <Link href="/" className="inline-flex items-center text-gray-500 hover:text-blue-600 transition-colors mb-4">
                        <FaArrowLeft className="mr-2" /> Back to Home
                    </Link>
                </div>

                {/* MCQ Card */}
                <div className="bg-white rounded-2xl shadow-neumorphism overflow-hidden">
                    <div className="relative h-64 sm:h-80 w-full">
                        <img
                            src={mcq.thumbnail || 'https://via.placeholder.com/800x400?text=Quiz+Thumbnail'}
                            alt={mcq.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                            <div className="p-6 text-white w-full">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-600 text-white mb-2">
                                    <FaClipboardList className="mr-1.5" /> MCQ Quiz
                                </span>
                                <h1 className="text-3xl font-bold">{mcq.title}</h1>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 sm:p-10 space-y-8">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
                            <p className="text-gray-600 leading-relaxed text-lg">
                                {mcq.description || 'No description provided for this quiz.'}
                            </p>
                        </div>

                        <div className="border-t pt-8">
                            <h2 className="text-lg font-semibold text-gray-900 mb-6">Start Quiz</h2>

                            {mcq.links && mcq.links.length > 0 ? (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {mcq.links.map((link: any, index: number) => (
                                        <a
                                            key={index}
                                            href={link.scriptUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group block"
                                        >
                                            <div className="bg-white border-2 border-blue-100 rounded-xl p-4 hover:border-blue-500 hover:shadow-lg transition-all duration-300 flex items-center justify-between group-hover:scale-[1.02]">
                                                <span className="font-semibold text-gray-800 group-hover:text-blue-700">{link.buttonTitle}</span>
                                                <FaExternalLinkAlt className="text-gray-400 group-hover:text-blue-500" />
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 italic">No quiz links available yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
