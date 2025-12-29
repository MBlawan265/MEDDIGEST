'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    FaSave,
    FaArrowLeft,
    FaPlus,
    FaTrash,
    FaGripLines,
    FaChevronDown,
    FaChevronUp,
    FaVideo,
    FaFilePdf
} from 'react-icons/fa';
import Link from 'next/link';
import { NeuButton } from '@/components/ui/NeuButton';

interface Lesson {
    _id?: string;
    title: string;
    youtubeUrl?: string; // deprecated
    driveId?: string;
    notes: string;
    pdfs: { filename: string; url: string; title: string }[];
    order: number;
    isPreview: boolean;
}

interface Section {
    _id?: string;
    title: string;
    order: number;
    lessons: Lesson[];
    collapsed?: boolean;
}

interface Course {
    _id: string;
    title: string;
    description: string;
    price: number;
    thumbnail: string;
    isPublished: boolean;
    sections: Section[];
}

export default function CourseBuilderPage({ params }: { params: { courseId: string } }) {
    const router = useRouter();
    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Fetch course data on mount
    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const res = await fetch(`/api/admin/courses/${params.courseId}`);
                if (!res.ok) throw new Error('Failed to load course');
                const data = await res.json();

                // Ensure sections valid array
                const processedCourse = {
                    ...data,
                    sections: data.sections || []
                };

                setCourse(processedCourse);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchCourse();
    }, [params.courseId]);

    // Save changes
    const saveCourse = async () => {
        if (!course) return;
        setSaving(true);
        setSuccess('');
        setError('');

        try {
            const res = await fetch(`/api/admin/courses/${course._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(course),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to save');
            }

            setSuccess('Course saved successfully');
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const togglePublish = async () => {
        if (!course) return;
        const newStatus = !course.isPublished;
        const updatedCourse = { ...course, isPublished: newStatus };
        setCourse(updatedCourse); // Optimistic UI update
        setSuccess('');
        setError('');

        try {
            const res = await fetch(`/api/admin/courses/${course._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isPublished: newStatus }),
            });

            if (!res.ok) {
                throw new Error('Failed to update status');
            }

            setSuccess(`Course ${newStatus ? 'published' : 'unpublished'} successfully`);
            router.refresh();
        } catch (err) {
            setCourse(course); // Revert
            setError('Failed to update publish status');
        }
    };

    // --- Section Management ---
    const addSection = () => {
        if (!course) return;
        const newSection: Section = {
            title: 'New Section',
            order: course.sections.length,
            lessons: [],
            collapsed: false
        };
        setCourse({ ...course, sections: [...course.sections, newSection] });
    };

    const updateSection = (index: number, field: string, value: any) => {
        if (!course) return;
        const updatedSections = [...course.sections];
        updatedSections[index] = { ...updatedSections[index], [field]: value };
        setCourse({ ...course, sections: updatedSections });
    };

    const removeSection = (index: number) => {
        if (!course) return;
        if (!confirm('Are you sure? This will delete all lessons in this section.')) return;
        const updatedSections = course.sections.filter((_, i) => i !== index);
        setCourse({ ...course, sections: updatedSections });
    };

    const toggleSection = (index: number) => {
        if (!course) return;
        const updatedSections = [...course.sections];
        updatedSections[index].collapsed = !updatedSections[index].collapsed;
        setCourse({ ...course, sections: updatedSections });
    };

    // --- Lesson Management ---
    const addLesson = (sectionIndex: number) => {
        if (!course) return;
        const section = course.sections[sectionIndex];
        const newLesson: Lesson = {
            title: 'New Lesson',
            driveId: '',
            notes: '',
            pdfs: [],
            order: section.lessons.length,
            isPreview: false
        };

        const updatedSections = [...course.sections];
        updatedSections[sectionIndex].lessons.push(newLesson);
        updatedSections[sectionIndex].collapsed = false; // Ensure open
        setCourse({ ...course, sections: updatedSections });
    };

    const updateLesson = (sectionIndex: number, lessonIndex: number, field: keyof Lesson, value: any) => {
        if (!course) return;

        // Validate preview limit if toggling preview
        if (field === 'isPreview' && value === true) {
            let previewCount = 0;
            course.sections.forEach(s => s.lessons.forEach(l => { if (l.isPreview) previewCount++; }));
            if (previewCount >= 3) {
                alert('You can only have up to 3 preview videos per course.');
                return;
            }
        }

        const updatedSections = [...course.sections];
        updatedSections[sectionIndex].lessons[lessonIndex] = {
            ...updatedSections[sectionIndex].lessons[lessonIndex],
            [field]: value
        };
        setCourse({ ...course, sections: updatedSections });
    };

    const removeLesson = (sectionIndex: number, lessonIndex: number) => {
        if (!course) return;
        if (!confirm('Delete this lesson?')) return;
        const updatedSections = [...course.sections];
        updatedSections[sectionIndex].lessons = updatedSections[sectionIndex].lessons.filter((_, i) => i !== lessonIndex);
        setCourse({ ...course, sections: updatedSections });
    };

    // --- PDF Management (Minimal Implementation) ---
    const handlePdfUpload = async (sectionIndex: number, lessonIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        const file = e.target.files[0];

        const formData = new FormData();
        formData.set('file', file);

        try {
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            if (!res.ok) throw new Error('Upload failed');
            const data = await res.json();

            const newPdf = { title: file.name, filename: data.filename, url: data.url };

            if (!course) return;
            const updatedSections = [...course.sections];
            updatedSections[sectionIndex].lessons[lessonIndex].pdfs.push(newPdf);
            setCourse({ ...course, sections: updatedSections });

        } catch (err) {
            alert('Failed to upload PDF');
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!course) return <div>Course not found</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center space-x-4">
                    <Link href="/admin/courses" className="text-gray-500 hover:text-gray-700">
                        <FaArrowLeft />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${course.isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {course.isPublished ? 'Published' : 'Draft'}
                        </span>
                    </div>
                </div>
                <div className="flex space-x-3">
                    <NeuButton
                        onClick={togglePublish}
                        className={`text-sm ${course.isPublished ? 'bg-green-600' : ''}`}
                    >
                        {course.isPublished ? 'Unpublish' : 'Publish'}
                    </NeuButton>
                    <NeuButton
                        onClick={saveCourse}
                        isLoading={saving}
                    >
                        <FaSave className="mr-2" />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </NeuButton>
                </div>
            </div>

            {success && (
                <div className="bg-green-50 border-l-4 border-green-500 p-4 text-green-700">
                    {success}
                </div>
            )}
            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
                    {error}
                </div>
            )}

            {/* Main Content Details */}
            <div className="bg-white shadow p-6 rounded-lg space-y-4">
                <h2 className="text-lg font-medium text-gray-900 border-b pb-2">Course Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Title</label>
                        <input
                            value={course.title}
                            onChange={(e) => setCourse({ ...course, title: e.target.value })}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Price (₦)</label>
                        <input
                            type="number"
                            value={course.price}
                            onChange={(e) => setCourse({ ...course, price: Number(e.target.value) })}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border p-2"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            rows={3}
                            value={course.description}
                            onChange={(e) => setCourse({ ...course, description: e.target.value })}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border p-2"
                        />
                    </div>
                </div>
            </div>

            {/* Curriculum Builder */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">Curriculum</h2>
                    <NeuButton
                        onClick={addSection}
                        className="text-sm px-4 py-2"
                    >
                        <FaPlus className="mr-1" /> Add Section
                    </NeuButton>
                </div>

                {course.sections.map((section, sIndex) => (
                    <div key={sIndex} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                        {/* Section Header */}
                        <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-b border-gray-200">
                            <div className="flex items-center flex-1 space-x-3">
                                <button onClick={() => toggleSection(sIndex)} className="text-gray-500">
                                    {section.collapsed ? <FaChevronDown /> : <FaChevronUp />}
                                </button>
                                <span className="font-bold text-gray-500">Section {sIndex + 1}:</span>
                                <input
                                    value={section.title}
                                    onChange={(e) => updateSection(sIndex, 'title', e.target.value)}
                                    className="bg-transparent border-none focus:ring-0 font-medium text-gray-900 flex-1"
                                    placeholder="Section Title"
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <button onClick={() => removeSection(sIndex)} className="text-red-500 hover:text-red-700 p-1">
                                    <FaTrash size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Lessons List */}
                        {!section.collapsed && (
                            <div className="p-4 bg-white space-y-4">
                                {section.lessons.length === 0 && (
                                    <p className="text-sm text-gray-400 italic text-center py-2">No lessons in this section</p>
                                )}

                                {section.lessons.map((lesson, lIndex) => (
                                    <div key={lIndex} className="border border-gray-200 rounded-md p-4 bg-gray-50">
                                        <div className="flex items-start gap-4">
                                            <div className="mt-2 text-gray-400 cursor-move">
                                                <FaGripLines />
                                            </div>

                                            <div className="flex-1 space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <input
                                                        value={lesson.title}
                                                        onChange={(e) => updateLesson(sIndex, lIndex, 'title', e.target.value)}
                                                        className="block w-full border-gray-300 rounded-md shadow-sm sm:text-sm border p-1"
                                                        placeholder="Lesson Title"
                                                    />
                                                    <button onClick={() => removeLesson(sIndex, lIndex)} className="ml-2 text-red-500 hover:text-red-700">
                                                        <FaTrash />
                                                    </button>
                                                </div>

                                                <div className="flex gap-4">
                                                    <div className="flex-1">
                                                        <label className="block text-xs font-medium text-gray-500">Google Drive Video Link</label>
                                                        <div className="mt-1 flex rounded-md shadow-sm">
                                                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                                                                <FaVideo />
                                                            </span>
                                                            <input
                                                                value={lesson.driveId || ''}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    let id = val;
                                                                    // Extract ID from common Drive URL formats
                                                                    const match = val.match(/(?:file\/d\/|id=|open\?id=)([a-zA-Z0-9_-]+)/);
                                                                    if (match) {
                                                                        id = match[1];
                                                                    }
                                                                    updateLesson(sIndex, lIndex, 'driveId', id);
                                                                }}
                                                                className="flex-1 min-w-0 block w-full px-3 py-1 rounded-none rounded-r-md sm:text-sm border-gray-300 border"
                                                                placeholder="Paste Drive Link or ID"
                                                            />
                                                        </div>
                                                        <div className="flex justify-between items-start mt-1">
                                                            <p className="text-xs text-gray-400">ID: {lesson.driveId}</p>
                                                            {lesson.driveId && (
                                                                <a
                                                                    href={`https://drive.google.com/file/d/${lesson.driveId}/preview`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                                                                >
                                                                    Test Play
                                                                </a>
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] text-amber-600 mt-0.5">⚠️ Ensure file permission is "Anyone with the link"</p>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500">Lecture Notes</label>
                                                    <textarea
                                                        rows={2}
                                                        value={lesson.notes}
                                                        onChange={(e) => updateLesson(sIndex, lIndex, 'notes', e.target.value)}
                                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm sm:text-sm border p-1"
                                                        placeholder="Add notes for students..."
                                                    />
                                                </div>

                                                <div className="flex items-center justify-between pt-2">
                                                    <div className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={lesson.isPreview}
                                                            onChange={(e) => updateLesson(sIndex, lIndex, 'isPreview', e.target.checked)}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                        />
                                                        <label className="ml-2 block text-sm text-gray-900">
                                                            Free Preview
                                                        </label>
                                                    </div>

                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-xs text-gray-500">PDFs: {lesson.pdfs.length}</span>
                                                        <label className="cursor-pointer inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50">
                                                            <FaFilePdf className="mr-1 text-red-500" /> Upload PDF
                                                            <input type="file" className="hidden" accept=".pdf" onChange={(e) => handlePdfUpload(sIndex, lIndex, e)} />
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <NeuButton
                                    onClick={() => addLesson(sIndex)}
                                    className="w-full flex justify-center items-center mt-2"
                                >
                                    <FaPlus className="mr-2" /> Add Lesson
                                </NeuButton>
                            </div>
                        )}
                    </div>
                ))}

                {course.sections.length === 0 && (
                    <div className="text-center py-10 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <p className="text-gray-500">Start by adding a section to your course.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
