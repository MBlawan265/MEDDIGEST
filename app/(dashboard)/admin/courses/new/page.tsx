'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaSave, FaArrowLeft, FaImage } from 'react-icons/fa';
import { NeuButton } from '@/components/ui/NeuButton';
import Link from 'next/link';

export default function NewCoursePage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: 0,
        thumbnail: '',
    });
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            let thumbnailUrl = formData.thumbnail;

            if (file) {
                const uploadedUrl = await uploadThumbnail();
                if (!uploadedUrl) return; // Error already set
                thumbnailUrl = uploadedUrl;
            } else if (!thumbnailUrl) {
                setError('Please upload a thumbnail');
                setSubmitting(false);
                return;
            }

            const res = await fetch('/api/admin/courses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, thumbnail: thumbnailUrl }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to create course');
            }

            const course = await res.json();
            router.push(`/admin/courses/${course._id}`);
            router.refresh();
        } catch (err: any) {
            setError(err.message);
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center space-x-4">
                <Link href="/admin/courses" className="text-gray-500 hover:text-gray-700">
                    <FaArrowLeft />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Create New Course</h1>
            </div>

            <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
                {error && (
                    <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Course Title</label>
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
                            required
                            rows={3}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border p-2"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Price (₦)</label>
                        <input
                            type="number"
                            required
                            min="0"
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border p-2"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
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
                                {file ? file.name : 'Thumbnail selected'}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end">
                        <NeuButton
                            type="submit"
                            isLoading={submitting || uploading}
                        >
                            <FaSave className="mr-2" />
                            {submitting ? 'Creating...' : 'Create Course'}
                        </NeuButton>
                    </div>
                </form>
            </div>
        </div>
    );
}
