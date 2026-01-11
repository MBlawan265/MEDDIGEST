'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import YouTubePlayer from '@/components/YouTubePlayer';
import {
    FaCheckCircle,
    FaCircle,
    FaPlayCircle,
    FaBars,
    FaArrowLeft,
    FaFilePdf,
} from 'react-icons/fa';
import { NeuButton } from '@/components/ui/NeuButton';

interface LessonProgress {
    lessonId: string;
    watchedSeconds: number;
    totalDuration: number;
    completed: boolean;
}

export default function LearningPage({ params }: { params: { courseId: string } }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const playerRef = useRef<any>(null);

    const [course, setCourse] = useState<any>(null);
    const [progress, setProgress] = useState<any>(null);
    const [currentLesson, setCurrentLesson] = useState<any>(null);
    const [currentSection, setCurrentSection] = useState<any>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [loading, setLoading] = useState(true);
    const [completing, setCompleting] = useState(false);
    const [activeTab, setActiveTab] = useState('notes');
    const [initialSeekTime, setInitialSeekTime] = useState(0);
    const [hasSeekToResume, setHasSeekToResume] = useState(false);
    const [videoDuration, setVideoDuration] = useState(0);
    const lastSaveTime = useRef(0);

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
                    router.push(`/courses/${params.courseId}`);
                    return;
                }

                const courseData = await courseRes.json();
                const progressData = progressRes.ok ? await progressRes.json() : null;

                if (!courseData.isEnrolled) {
                    router.push(`/courses/${params.courseId}`);
                    return;
                }

                setCourse(courseData);
                setProgress(progressData);

                // Resume from last position
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

                    if (foundLesson && foundSection) {
                        setCurrentLesson(foundLesson);
                        setCurrentSection(foundSection);
                        setInitialSeekTime(progressData.lastPlaybackTime || 0);
                    } else {
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

    // Save progress to backend
    const saveProgress = useCallback(async (watchedSeconds: number, duration?: number) => {
        if (!currentLesson || !currentSection || !course) return;

        try {
            const res = await fetch('/api/progress/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courseId: course._id,
                    lessonId: currentLesson._id,
                    sectionId: currentSection._id,
                    watchedSeconds: Math.floor(watchedSeconds),
                    totalDuration: duration || videoDuration || currentLesson.duration || 0
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setProgress((prev: any) => ({
                    ...prev,
                    completedLessons: data.completedLessons,
                    lessonProgress: data.lessonProgress,
                    percentage: data.percentage,
                    isCompleted: data.isCompleted
                }));
            }
        } catch (error) {
            console.error('Failed to save progress:', error);
        }
    }, [currentLesson, currentSection, course, videoDuration]);

    // Video event handlers
    const handleDuration = (duration: number) => {
        setVideoDuration(duration);
    };

    const handleProgress = useCallback((currentTime: number, duration: number) => {
        setVideoDuration(duration);

        // Save every 5 seconds
        if (currentTime - lastSaveTime.current >= 5 && currentTime > 0) {
            lastSaveTime.current = currentTime;
            saveProgress(currentTime, duration);
        }
    }, [saveProgress]);

    const handlePlayerStateChange = (state: number) => {
        // state 0 = ended
        if (state === 0) {
            saveProgress(videoDuration, videoDuration); // Complete
        }
    };


    const selectLesson = (lesson: any, section: any) => {
        // Save current progress before switching
        if (playerRef.current && currentLesson) {
            saveProgress(playerRef.current.getCurrentTime());
        }

        setCurrentLesson(lesson);
        setCurrentSection(section);
        setInitialSeekTime(0);
        setHasSeekToResume(true);
        lastSaveTime.current = 0;
        setVideoDuration(0);
        if (window.innerWidth < 1024) setSidebarOpen(false);
    };

    // Mark Complete button handler
    const handleMarkComplete = async () => {
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
        return progress?.completedLessons?.some((cl: any) =>
            cl.lessonId === lessonId || cl.lessonId?.toString() === lessonId
        );
    };

    const getLessonProgress = (lessonId: string): number => {
        const lp = progress?.lessonProgress?.find((p: any) =>
            p.lessonId === lessonId || p.lessonId?.toString() === lessonId
        );
        if (!lp || !lp.totalDuration) return 0;
        return Math.round((lp.watchedSeconds / lp.totalDuration) * 100);
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
        <div className="flex h-screen bg-neu-bg overflow-hidden">
            {/* Mobile Sidebar Backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-gray-900/20 backdrop-blur-sm lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-30 w-80 bg-neu-bg shadow-xl transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 z-40 border-r border-white/50`}>
                <div className="h-full flex flex-col">
                    <div className="p-6 flex justify-between items-center">
                        <h2 className="font-bold text-gray-800 truncate text-lg">{course.title}</h2>
                        <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500">
                            <FaArrowLeft />
                        </button>
                    </div>

                    <div className="px-6 pb-6">
                        <div className="flex justify-between text-xs text-gray-500 mb-2 font-bold uppercase tracking-wider">
                            <span>Progress</span>
                            <span>{progress?.percentage || 0}%</span>
                        </div>
                        <div className="w-full bg-neu-bg shadow-neumorphism-inset rounded-full h-4 p-0.5 border border-white/20">
                            <div
                                className="bg-blue-500 h-full rounded-full transition-all duration-500 shadow-md flex items-center justify-end"
                                style={{ width: `${progress?.percentage || 0}%` }}
                            >
                                <div className="h-1.5 w-1.5 bg-white/50 rounded-full mr-1" />
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {course.sections?.map((section: any, sIdx: number) => (
                            <div key={sIdx}>
                                <div className="px-2 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                    Section {sIdx + 1}: {section.title}
                                </div>
                                <div className="space-y-3">
                                    {section.lessons?.map((lesson: any, lIdx: number) => {
                                        const active = currentLesson?._id === lesson._id;
                                        const completed = isCompleted(lesson._id);
                                        const lessonPct = getLessonProgress(lesson._id);

                                        return (
                                            <div
                                                key={lIdx}
                                                onClick={() => selectLesson(lesson, section)}
                                                className={`px-4 py-3 cursor-pointer rounded-xl flex items-center transition-all duration-300 mb-3 border border-white/20 ${active ? 'bg-neu-bg shadow-neumorphism-inset text-blue-600' : 'bg-neu-bg shadow-neumorphism hover:shadow-neumorphism-sm hover:-translate-y-0.5'}`}
                                            >
                                                <div className="flex items-start w-full">
                                                    <div className="mt-1 mr-3 flex-shrink-0">
                                                        {completed ? (
                                                            <FaCheckCircle className="text-green-500" />
                                                        ) : active ? (
                                                            <FaPlayCircle className="text-blue-600" />
                                                        ) : (
                                                            <FaCircle className="text-gray-300 text-xs" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-sm ${active ? 'font-bold' : 'text-gray-700'}`}>
                                                            {lIdx + 1}. {lesson.title}
                                                        </p>
                                                        {!completed && lessonPct > 0 && (
                                                            <div className="mt-2 w-full bg-neu-bg shadow-neumorphism-inset rounded-full h-1.5">
                                                                <div
                                                                    className="bg-blue-400 h-1.5 rounded-full"
                                                                    style={{ width: `${lessonPct}%` }}
                                                                />
                                                            </div>
                                                        )}
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

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-neu-bg relative z-0">
                <div className="lg:hidden bg-neu-bg shadow-neumorphism p-4 flex items-center mb-4 relative z-20">
                    <button onClick={() => setSidebarOpen(true)} className="mr-4 text-gray-600"><FaBars /></button>
                    <span className="font-medium truncate">{currentLesson?.title || 'Course'}</span>
                </div>

                {/* Video Player Container */}
                <div className="w-full flex justify-center p-4 lg:p-8 shrink-0">
                    <div
                        className="bg-neu-bg p-3 rounded-[30px] shadow-neumorphism w-full max-w-5xl"
                        onContextMenu={(e) => e.preventDefault()}
                    >
                        <div className="w-full aspect-video rounded-[24px] overflow-hidden bg-black shadow-inner relative">
                            {currentLesson?.youtubeUrl ? (
                                <YouTubePlayer
                                    videoId={currentLesson.youtubeUrl}
                                    onEnded={() => saveProgress(videoDuration, videoDuration)}
                                    className="absolute inset-0 w-full h-full"
                                />
                            ) : (
                                <div className="text-white text-center flex items-center justify-center h-full">Select a lesson to start</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Lesson Info */}
                <div className="flex-1 overflow-y-auto bg-neu-bg">
                    <div className="max-w-4xl mx-auto px-4 py-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <h1 className="text-2xl font-bold text-gray-900">{currentLesson?.title}</h1>
                            <NeuButton
                                onClick={handleMarkComplete}
                                disabled={completing || isCompleted(currentLesson?._id)}
                                isLoading={completing}
                                variant={isCompleted(currentLesson?._id) ? 'secondary' : 'primary'}
                            >
                                {isCompleted(currentLesson?._id) ? (
                                    <><FaCheckCircle className="mr-2" /> Completed</>
                                ) : (
                                    'Mark Complete'
                                )}
                            </NeuButton>
                        </div>

                        <div className="border-b mb-6">
                            <nav className="-mb-px flex space-x-8">
                                <button
                                    onClick={() => setActiveTab('notes')}
                                    className={`pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'notes' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}
                                >
                                    Notes
                                </button>
                                <button
                                    onClick={() => setActiveTab('resources')}
                                    className={`pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'resources' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}
                                >
                                    Resources
                                </button>
                            </nav>
                        </div>

                        <div className="prose max-w-none text-gray-700">
                            {activeTab === 'notes' && (
                                currentLesson?.notes
                                    ? <div className="whitespace-pre-wrap">{currentLesson.notes}</div>
                                    : <p className="text-gray-500 italic">No notes available for this lesson.</p>
                            )}
                            {activeTab === 'resources' && (
                                currentLesson?.pdfs?.length > 0 ? (
                                    currentLesson.pdfs.map((pdf: any, idx: number) => (
                                        <a
                                            key={idx}
                                            href={pdf.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center p-3 border rounded-lg hover:bg-gray-50 mb-2 no-underline"
                                        >
                                            <FaFilePdf className="text-red-500 text-xl mr-3" />
                                            <span className="text-gray-800">{pdf.title || `Resource ${idx + 1}`}</span>
                                        </a>
                                    ))
                                ) : <p className="text-gray-500 italic">No resources available for this lesson.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
