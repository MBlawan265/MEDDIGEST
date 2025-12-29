'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import GoogleDrivePlayer from '@/components/GoogleDrivePlayer';
import {
    FaCheckCircle,
    FaCircle,
    FaPlayCircle,
    FaBars,
    FaArrowLeft,
    FaFilePdf,
} from 'react-icons/fa';
import { NeuButton } from '@/components/ui/NeuButton';

export default function LearningPage({ params }: { params: { courseId: string } }) {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [course, setCourse] = useState<any>(null);
    const [progress, setProgress] = useState<any>(null);
    const [currentLesson, setCurrentLesson] = useState<any>(null);
    const [currentSection, setCurrentSection] = useState<any>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [loading, setLoading] = useState(true);
    const [completing, setCompleting] = useState(false);
    const [activeTab, setActiveTab] = useState('notes');


    // Load Course and Progress
    useEffect(() => {
        if (status === 'loading') return;

        if (!session) {
            router.push(`/login?callbackUrl=/courses/${params.courseId}/learn`);
            return;
        }

        const loadData = async () => {
            try {
                const [courseRes, progressRes] = await Promise.all([
                    fetch(`/api/courses/${params.courseId}`),
                    fetch(`/api/progress/${params.courseId}`)
                ]);

                if (!courseRes.ok) {
                    // Not enrolled or course not found - redirect to course page
                    router.push(`/courses/${params.courseId}`);
                    return;
                }

                const courseData = await courseRes.json();
                const progressData = progressRes.ok ? await progressRes.json() : null;

                // Check if enrolled
                if (!courseData.isEnrolled) {
                    router.push(`/courses/${params.courseId}`);
                    return;
                }

                setCourse(courseData);
                setProgress(progressData);
                console.log('[DEBUG] Course Data:', courseData);

                // Resume from last position if available
                if (progressData?.lastLessonId && courseData.sections) {
                    let foundLesson = null;
                    let foundSection = null;

                    for (const section of courseData.sections) {
                        for (const lesson of section.lessons) {
                            if (lesson._id === progressData.lastLessonId) {
                                foundLesson = lesson;
                                foundSection = section;
                                break;
                            }
                        }
                        if (foundLesson) break;
                    }

                    if (foundLesson) {
                        setCurrentLesson(foundLesson);
                        setCurrentSection(foundSection);
                    } else {
                        // Fallback to first lesson
                        setDefaultLesson(courseData);
                    }
                } else {
                    setDefaultLesson(courseData);
                }

            } catch (error) {
                console.error('Failed to load course data:', error);
                router.push(`/courses/${params.courseId}`);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [params.courseId, router, session, status]);

    const setDefaultLesson = (courseData: any) => {
        if (courseData.sections?.length > 0 && courseData.sections[0].lessons?.length > 0) {
            setCurrentSection(courseData.sections[0]);
            setCurrentLesson(courseData.sections[0].lessons[0]);
        }
    };







    // Timer for auto-completion (Google Drive workaround)
    useEffect(() => {
        let timer: NodeJS.Timeout;

        if (currentLesson && currentSection && !isCompleted(currentLesson._id)) {
            // Default to 60 seconds if duration is missing or 0 to prevent instant completion
            // This is a "soft" check. Realistically we want to rely on the duration.
            // If duration is 0, we might NOT want to auto-complete, or use a reasonable default like 5 mins?
            // Let's rely on the instructor setting the duration correctly.
            const durationSec = currentLesson.duration || 0;

            if (durationSec > 10) { // Only auto-complete if duration is set and meaningful (>10s)
                console.log(`[Timer] Auto-complete scheduled for ${durationSec} seconds`);
                timer = setTimeout(() => {
                    console.log('[Timer] Video duration passed. Marking complete.');
                    handleComplete();
                }, durationSec * 1000);
            }
        }

        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [currentLesson, currentSection, progress]); // Re-run if lesson changes or progress updates (to stop if completed)

    // Check if lesson is started
    const isStarted = (lessonId: string) => {
        return progress?.lessonProgress?.some((lp: any) => lp.lessonId === lessonId);
    };

    // Reset seek flag when changing lessons
    const selectLesson = async (lesson: any, section: any) => {
        console.log('[DEBUG] Selected Lesson:', lesson);
        setCurrentLesson(lesson);
        setCurrentSection(section);

        if (window.innerWidth < 1024) setSidebarOpen(false);

        // Track Start
        if (!isStarted(lesson._id) && !isCompleted(lesson._id)) {
            try {
                // Call start API
                await fetch('/api/progress/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        courseId: course._id,
                        sectionId: section._id,
                        lessonId: lesson._id
                    })
                });

                // Optimistic update
                setProgress((prev: any) => ({
                    ...prev,
                    lessonProgress: [
                        ...(prev?.lessonProgress || []),
                        { lessonId: lesson._id, sectionId: section._id, completed: false }
                    ]
                }));
            } catch (err) {
                console.error('Failed to track lesson start', err);
            }
        }
    };

    // Handle Mark Complete
    const handleComplete = async () => {
        if (completing || !currentLesson || !currentSection) return;
        setCompleting(true);

        try {
            const res = await fetch('/api/progress/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courseId: course._id,
                    sectionId: currentSection._id,
                    lessonId: currentLesson._id
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setProgress((prev: any) => ({
                    ...prev,
                    completedLessons: data.progress.completedLessons,
                    percentage: data.progress.percentage
                }));
            }
        } catch (error) {
            console.error('Failed to mark complete:', error);
        } finally {
            setCompleting(false);
        }
    };



    const isCompleted = (lessonId: string) => {
        return progress?.completedLessons?.some((cl: any) => cl.lessonId === lessonId);
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-100">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-100">
                <p>Course not found or access denied</p>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            {/* Sidebar - Course Content */}
            <div className={`
                fixed inset-y-0 left-0 z-30 w-80 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:relative lg:translate-x-0
            `}>
                <div className="h-full flex flex-col">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-slate-50">
                        <h2 className="font-bold text-gray-800 truncate" title={course.title}>{course.title}</h2>
                        <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500">
                            <FaArrowLeft />
                        </button>
                    </div>

                    <div className="p-4 border-b border-gray-200">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Your Progress</span>
                            <span>{progress?.percentage || 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${progress?.percentage || 0}%` }}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {course.sections?.map((section: any, sIdx: number) => (
                            <div key={sIdx} className="border-b border-gray-100">
                                <div className="px-4 py-3 bg-gray-50 text-sm font-semibold text-gray-700">
                                    Section {sIdx + 1}: {section.title}
                                </div>
                                <div>
                                    {section.lessons?.map((lesson: any, lIdx: number) => {
                                        const active = currentLesson?._id === lesson._id;
                                        const completed = isCompleted(lesson._id);
                                        const started = isStarted(lesson._id);

                                        return (
                                            <div
                                                key={lIdx}
                                                onClick={() => selectLesson(lesson, section)}
                                                className={`px-4 py-3 flex items-start cursor-pointer border-l-4 transition-colors ${active
                                                    ? 'bg-blue-50 border-blue-600'
                                                    : 'bg-white border-transparent hover:bg-gray-50'
                                                    }`}
                                            >
                                                <div className="mt-1 mr-3 flex-shrink-0">
                                                    {completed ? (
                                                        <FaCheckCircle className="text-green-500" />
                                                    ) : (
                                                        active ? <FaPlayCircle className="text-blue-600" /> : <FaCircle className="text-gray-200 text-xs" />
                                                    )}
                                                </div>
                                                <div className="w-full">
                                                    <p className={`text-sm ${active ? 'font-medium text-blue-900' : 'text-gray-600'}`}>
                                                        {lIdx + 1}. {lesson.title}
                                                    </p>

                                                    <div className="flex justify-between items-center mt-1">
                                                        {lesson.duration && (
                                                            <span className="text-xs text-gray-400">
                                                                {Math.floor(lesson.duration / 60)} min
                                                            </span>
                                                        )}

                                                        {/* Status Text */}
                                                        <span className="text-[10px] uppercase font-bold tracking-wide">
                                                            {completed
                                                                ? <span className="text-green-600">Completed</span>
                                                                : active
                                                                    ? <span className="text-blue-600">Playing...</span>
                                                                    : started
                                                                        ? <span className="text-orange-500">Continue</span>
                                                                        : <span className="text-gray-400">Start</span>
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden w-full relative">
                {/* Mobile Header */}
                <div className="lg:hidden bg-white border-b border-gray-200 p-4 flex items-center">
                    <button onClick={() => setSidebarOpen(true)} className="mr-4 text-gray-600">
                        <FaBars />
                    </button>
                    <span className="font-medium truncate">{currentLesson?.title || 'Course'}</span>
                </div>

                {/* Video Player Container - with right-click prevention overlay optional */}
                <div
                    className="bg-black w-full aspect-video md:max-h-[70vh] flex items-center justify-center relative"
                    onContextMenu={(e) => e.preventDefault()}
                >
                    {currentLesson?.driveId ? (
                        <GoogleDrivePlayer
                            driveId={currentLesson.driveId}
                        />
                    ) : currentLesson?.youtubeUrl ? (
                        // Fallback for legacy YouTube videos if they still exist
                        <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${currentLesson.youtubeUrl}?autoplay=1`}
                            title="Legacy Video"
                            className="w-full h-full"
                            allowFullScreen
                        />
                    ) : (
                        <div className="text-white text-center">
                            <p>Select a lesson to start watching</p>
                        </div>
                    )}
                </div>

                {/* Lesson Controls & Content */}
                <div className="flex-1 overflow-y-auto bg-white">
                    <div className="max-w-4xl mx-auto px-4 py-6">
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-2xl font-bold text-gray-900">{currentLesson?.title}</h1>
                            <NeuButton
                                onClick={handleComplete}
                                disabled={completing || isCompleted(currentLesson?._id)}
                                isLoading={completing}
                                className={isCompleted(currentLesson?._id) ? 'opacity-80 cursor-default' : ''}
                            >
                                {isCompleted(currentLesson?._id) ? (
                                    <>
                                        <FaCheckCircle className="mr-2" /> Completed
                                    </>
                                ) : (
                                    'Mark Complete'
                                )}
                            </NeuButton>
                        </div>

                        {/* Tabs */}
                        <div className="border-b border-gray-200 mb-6">
                            <nav className="-mb-px flex space-x-8">
                                <button
                                    onClick={() => setActiveTab('notes')}
                                    className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'notes'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Lecture Notes
                                </button>
                                <button
                                    onClick={() => setActiveTab('resources')}
                                    className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'resources'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Resources / PDFs
                                </button>
                            </nav>
                        </div>

                        {/* Tab Content */}
                        <div className="prose max-w-none text-gray-700">
                            {activeTab === 'notes' && (
                                <div>
                                    {currentLesson?.notes ? (
                                        <div className="whitespace-pre-wrap">{currentLesson.notes}</div>
                                    ) : (
                                        <p className="text-gray-500 italic">No notes available for this lesson.</p>
                                    )}
                                </div>
                            )}

                            {activeTab === 'resources' && (
                                <div className="space-y-3">
                                    {currentLesson?.pdfs && currentLesson.pdfs.length > 0 ? (
                                        currentLesson.pdfs.map((pdf: any, idx: number) => (
                                            <a
                                                key={idx}
                                                href={pdf.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                            >
                                                <FaFilePdf className="text-red-500 text-xl mr-3" />
                                                <span className="font-medium text-gray-900">{pdf.title || `Resource ${idx + 1}`}</span>
                                            </a>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 italic">No resources available for this lesson.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
