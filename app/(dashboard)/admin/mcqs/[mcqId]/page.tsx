'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaSave, FaArrowLeft, FaImage, FaPlus, FaTrash, FaLink } from 'react-icons/fa';
import { NeuButton } from '@/components/ui/NeuButton';
import Link from 'next/link';

interface McqLink {
    buttonTitle: string;
    scriptUrl: string;
}

export default function EditMcqPage({ params }: { params: { mcqId: string } }) {
    const router = useRouter();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        thumbnail: '',
        isPublished: false,
    });
    const [links, setLinks] = useState<McqLink[]>([]);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchMcq();
    }, []);

    const fetchMcq = async () => {
        try {
            const res = await fetch(`/api/admin/mcqs/${params.mcqId}`);
            if (!res.ok) throw new Error('Failed to fetch MCQ');
            const data = await res.json();
            setFormData({
                title: data.title,
                description: data.description || '',
                thumbnail: data.thumbnail || '',
                isPublished: data.isPublished,
            });
            setLinks(data.links || []);
        } catch (err) {
            console.error(err);
            setError('Failed to load MCQ data');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const uploadThumbnail = async (): Promise<string | null> => {
        if (!file) return null;

        const data = new FormData();
        data.set('file', file);

        try {
            setUploading(true);
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: data,
            });

            if (!res.ok) throw new Error('Upload failed');

            const json = await res.json();
            return json.url;
        } catch (err) {
            console.error(err);
            setError('Failed to upload thumbnail');
            return null;
        } finally {
            setUploading(false);
        }
    };

    const addLink = () => {
        setLinks([...links, { buttonTitle: '', scriptUrl: '' }]);
    };

    const removeLink = (index: number) => {
        const newLinks = [...links];
        newLinks.splice(index, 1);
        setLinks(newLinks);
    };

    const updateLink = (index: number, field: keyof McqLink, value: string) => {
        const newLinks = [...links];
        newLinks[index][field] = value;
        setLinks(newLinks);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            for (const link of links) {
                if (!link.buttonTitle.trim() || !link.scriptUrl.trim()) {
                    throw new Error('All links must have a title and URL');
                }
            }

            let thumbnailUrl = formData.thumbnail;

            if (file) {
                const uploadedUrl = await uploadThumbnail();
                if (!uploadedUrl) return;
                thumbnailUrl = uploadedUrl;
            }

            const payload = {
                ...formData,
                thumbnail: thumbnailUrl,
                links,
            };

            const res = await fetch(`/api/admin/mcqs/${params.mcqId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to update MCQ');
            }

            router.push('/admin/courses'); // Redirect back to list
            router.refresh();
        } catch (err: any) {
            setError(err.message);
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center space-x-4">
                <Link href="/admin/courses" className="text-gray-500 hover:text-gray-700">
                    <FaArrowLeft />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Edit MCQ</h1>
            </div>

            <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
                {error && (
                    <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <div className="flex justify-between items-center">
                            <label className="block text-sm font-medium text-gray-700">MCQ Title</label>
                            <div className="flex items-center">
                                <label className="text-sm text-gray-600 mr-2">Published</label>
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 h-5 w-5"
                                    checked={formData.isPublished}
                                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                                />
                            </div>
                        </div>
                        <input
                            type="text"
                            required
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border p-2"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            rows={3}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border p-2"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Thumbnail</label>
                        <div className="mt-1 flex items-center space-x-4">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                            {uploading && <span className="text-sm text-gray-500">Uploading...</span>}
                        </div>
                        {(file || formData.thumbnail) && (
                            <div className="mt-2 text-sm text-green-600 flex items-center">
                                <FaImage className="mr-2" />
                                {file ? file.name : (
                                    <div className="flex gap-2">
                                        <span>Current Thumbnail</span>
                                        {formData.thumbnail && (
                                            <a href={formData.thumbnail} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline ml-2">View</a>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="border-t pt-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900">Quiz Links</h3>
                            <button
                                type="button"
                                onClick={addLink}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                            >
                                <FaPlus className="mr-1" /> Add Link
                            </button>
                        </div>

                        {links.length === 0 && (
                            <p className="text-sm text-gray-500 italic">No links added</p>
                        )}

                        <div className="space-y-4">
                            {links.map((link, index) => (
                                <div key={index} className="flex gap-4 items-start bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <div className="flex-1 space-y-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500">Button Title</label>
                                            <input
                                                type="text"
                                                required
                                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border p-2"
                                                value={link.buttonTitle}
                                                onChange={(e) => updateLink(index, 'buttonTitle', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 flex items-center gap-1">
                                                <FaLink size={10} /> Script URL
                                            </label>
                                            <input
                                                type="url"
                                                required
                                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border p-2"
                                                value={link.scriptUrl}
                                                onChange={(e) => updateLink(index, 'scriptUrl', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeLink(index)}
                                        className="text-red-500 hover:text-red-700 p-2 mt-6"
                                        title="Remove Link"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <NeuButton
                            type="submit"
                            isLoading={submitting || uploading}
                        >
                            <FaSave className="mr-2" />
                            {submitting ? 'Saving...' : 'Save Changes'}
                        </NeuButton>
                    </div>
                </form>
            </div>
        </div>
    );
}
