import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { AdminLayout } from '../../components/AdminLayout';
import { Image as ImageIcon, Plus, Trash2, Edit2, X, MoveUp, MoveDown, Eye, EyeOff, Upload } from 'lucide-react';

interface HomeSlide {
    id: string;
    title: string;
    subtitle: string;
    image_url: string;
    link_url: string;
    button_text: string;
    is_active: boolean;
    sort_order: number;
}

export function SliderManagement() {
    const [slides, setSlides] = useState<HomeSlide[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSlide, setEditingSlide] = useState<HomeSlide | null>(null);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        image_url: '',
        link_url: '',
        button_text: 'Shop Now',
        is_active: true,
        sort_order: 0
    });

    useEffect(() => {
        fetchSlides();
    }, []);

    const fetchSlides = async () => {
        const { data, error } = await supabase.from('home_slides').select('*').order('sort_order', { ascending: true });
        if (!error && data) setSlides(data);
        setLoading(false);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('Image size must be less than 5MB');
            return;
        }

        setUploading(true);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `slide-${Date.now()}.${fileExt}`;
            const filePath = `slides/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('public')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('public')
                .getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, image_url: publicUrl }));

            // Record upload
            await supabase.from('uploads').insert({
                file_name: fileName,
                file_path: publicUrl,
                file_type: file.type,
                file_size: file.size,
                upload_type: 'slider'
            });

        } catch (e: any) {
            alert(`Upload failed: ${e.message}`);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const slideData = { ...formData, sort_order: editingSlide ? formData.sort_order : slides.length + 1 };
        if (editingSlide) {
            await supabase.from('home_slides').update(slideData).eq('id', editingSlide.id);
        } else {
            await supabase.from('home_slides').insert(slideData);
        }
        setShowModal(false);
        setEditingSlide(null);
        fetchSlides();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this slide?')) return;
        await supabase.from('home_slides').delete().eq('id', id);
        fetchSlides();
    };

    const toggleStatus = async (slide: HomeSlide) => {
        await supabase.from('home_slides').update({ is_active: !slide.is_active }).eq('id', slide.id);
        fetchSlides();
    };

    const moveSlide = async (index: number, direction: 'up' | 'down') => {
        const newSlides = [...slides];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= slides.length) return;
        const temp = newSlides[index].sort_order;
        newSlides[index].sort_order = newSlides[targetIndex].sort_order;
        newSlides[targetIndex].sort_order = temp;
        await Promise.all([
            supabase.from('home_slides').update({ sort_order: newSlides[index].sort_order }).eq('id', newSlides[index].id),
            supabase.from('home_slides').update({ sort_order: newSlides[targetIndex].sort_order }).eq('id', newSlides[targetIndex].id)
        ]);
        fetchSlides();
    };

    return (
        <AdminLayout>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Slider Management</h1>
                        <p className="text-gray-600 text-sm mt-1">Manage the main slideshow on the homepage</p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingSlide(null);
                            setFormData({ title: '', subtitle: '', image_url: '', link_url: '', button_text: 'Shop Now', is_active: true, sort_order: 0 });
                            setShowModal(true);
                        }}
                        className="bg-purple-600 text-white px-3 py-1 rounded font-medium flex items-center gap-1 hover:bg-purple-700 transition text-sm"
                    >
                        <Plus className="w-4 h-4" /> Add
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {slides.map((slide, index) => (
                        <div key={slide.id} className={`bg-gray-50 rounded-lg border p-4 flex flex-col md:flex-row gap-4 items-center transition ${slide.is_active ? 'border-gray-200' : 'border-dashed border-gray-300 opacity-60'}`}>
                            <div className="w-full md:w-64 aspect-video rounded overflow-hidden bg-gray-100 flex-shrink-0">
                                <img src={slide.image_url} alt={slide.title} className="w-full h-full object-cover" />
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full text-xs font-medium">Slide #{slide.sort_order}</span>
                                    {!slide.is_active && <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-xs font-medium">Disabled</span>}
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-1">{slide.title}</h3>
                                <p className="text-gray-500 text-sm line-clamp-2">{slide.subtitle}</p>
                                <div className="mt-2 flex flex-wrap gap-3 text-xs">
                                    <div className="text-purple-600">Link: <span className="text-gray-900 underline">{slide.link_url}</span></div>
                                    <div className="text-purple-600">Button: <span className="text-gray-900">{slide.button_text}</span></div>
                                </div>
                            </div>

                            <div className="flex flex-row md:flex-col gap-1">
                                <button onClick={() => toggleStatus(slide)} className={`p-2 rounded transition ${slide.is_active ? 'bg-amber-100 text-amber-600 hover:bg-amber-600 hover:text-white' : 'bg-green-100 text-green-600 hover:bg-green-600 hover:text-white'}`}>
                                    {slide.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                                <button onClick={() => { setEditingSlide(slide); setFormData(slide); setShowModal(true); }} className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-600 hover:text-white transition">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => moveSlide(index, 'up')} disabled={index === 0} className="p-2 bg-gray-100 text-gray-400 rounded hover:bg-gray-900 hover:text-white transition disabled:opacity-30">
                                    <MoveUp className="w-4 h-4" />
                                </button>
                                <button onClick={() => moveSlide(index, 'down')} disabled={index === slides.length - 1} className="p-2 bg-gray-100 text-gray-400 rounded hover:bg-gray-900 hover:text-white transition disabled:opacity-30">
                                    <MoveDown className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(slide.id)} className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-600 hover:text-white transition">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
                        <div className="bg-white rounded-lg w-full max-w-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-gray-900">{editingSlide ? 'Edit Slide' : 'New Slide'}</h3>
                                <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded transition">
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Heading Title</label>
                                        <input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-2 py-1 bg-gray-50 rounded border border-gray-300 focus:ring-2 focus:ring-purple-500 text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Button Label</label>
                                        <input value={formData.button_text} onChange={e => setFormData({ ...formData, button_text: e.target.value })} className="w-full px-2 py-1 bg-gray-50 rounded border border-gray-300 focus:ring-2 focus:ring-purple-500 text-sm" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Sub-heading Description</label>
                                    <textarea required value={formData.subtitle} onChange={e => setFormData({ ...formData, subtitle: e.target.value })} className="w-full px-2 py-1 bg-gray-50 rounded border border-gray-300 focus:ring-2 focus:ring-purple-500 text-sm min-h-[80px]" />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Background Image</label>
                                    <div className="space-y-2">
                                        {formData.image_url && (
                                            <div className="w-full aspect-video rounded overflow-hidden border border-gray-300">
                                                <img src={formData.image_url} className="w-full h-full object-cover" alt="Preview" />
                                            </div>
                                        )}
                                        <div className="flex gap-2">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                disabled={uploading}
                                                className="hidden"
                                                id="image-upload"
                                            />
                                            <label
                                                htmlFor="image-upload"
                                                className={`inline-flex items-center gap-2 px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 transition cursor-pointer text-sm ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                <Upload className="w-4 h-4" />
                                                {uploading ? 'Uploading...' : 'Upload Image'}
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.image_url}
                                                onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                                                placeholder="Or paste image URL"
                                                className="flex-1 px-2 py-1 bg-gray-50 rounded border border-gray-300 focus:ring-2 focus:ring-purple-500 text-sm"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500">Upload an image or paste a URL. Recommended: 1920x600px</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Destination URL Link</label>
                                    <input required value={formData.link_url} onChange={e => setFormData({ ...formData, link_url: e.target.value })} className="w-full px-2 py-1 bg-gray-50 rounded border border-gray-300 focus:ring-2 focus:ring-purple-500 text-sm" />
                                </div>

                                <button type="submit" className="w-full bg-gray-900 text-white rounded py-2 font-medium hover:bg-black transition text-sm">
                                    Save Slide
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
