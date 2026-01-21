import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { AdminLayout } from '../../components/AdminLayout';
import {
    Image as ImageIcon,
    Plus,
    Trash2,
    Edit2,
    Check,
    X,
    MoveUp,
    MoveDown,
    Eye,
    EyeOff
} from 'lucide-react';

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
        const { data, error } = await supabase
            .from('home_slides')
            .select('*')
            .order('sort_order', { ascending: true });

        if (!error && data) setSlides(data);
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const slideData = {
            ...formData,
            sort_order: editingSlide ? formData.sort_order : slides.length + 1
        };

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
            <div className="mb-10 flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Slider Management</h1>
                    <p className="text-gray-500 mt-2">Manage the main slideshow on the homepage.</p>
                </div>
                <button
                    onClick={() => {
                        setEditingSlide(null);
                        setFormData({ title: '', subtitle: '', image_url: '', link_url: '', button_text: 'Shop Now', is_active: true, sort_order: 0 });
                        setShowModal(true);
                    }}
                    className="bg-purple-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-purple-700 transition shadow-lg shadow-purple-200"
                >
                    <Plus className="w-5 h-5" /> Add Slide
                </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {slides.map((slide, index) => (
                    <div key={slide.id} className={`bg-white rounded-[2.5rem] border-2 p-6 flex flex-col md:flex-row gap-8 items-center transition-all ${slide.is_active ? 'border-gray-50 shadow-xl' : 'border-dashed border-gray-200 opacity-60'}`}>
                        <div className="w-full md:w-80 aspect-video rounded-3xl overflow-hidden shadow-inner bg-gray-100 flex-shrink-0">
                            <img src={slide.image_url} alt={slide.title} className="w-full h-full object-cover" />
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Slide #{slide.sort_order}</span>
                                {!slide.is_active && <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Disabled</span>}
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-2">{slide.title}</h3>
                            <p className="text-gray-500 font-medium line-clamp-2">{slide.subtitle}</p>
                            <div className="mt-4 flex flex-wrap gap-4 text-xs font-bold uppercase tracking-widest">
                                <div className="text-purple-600">Link: <span className="text-gray-900 underline">{slide.link_url}</span></div>
                                <div className="text-purple-600">Button: <span className="text-gray-900">{slide.button_text}</span></div>
                            </div>
                        </div>

                        <div className="flex flex-row md:flex-col gap-2">
                            <button onClick={() => toggleStatus(slide)} className={`p-3 rounded-xl transition-all ${slide.is_active ? 'bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white' : 'bg-green-50 text-green-600 hover:bg-green-600 hover:text-white'}`}>
                                {slide.is_active ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                            <button onClick={() => { setEditingSlide(slide); setFormData(slide); setShowModal(true); }} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Edit2 className="w-5 h-5" /></button>
                            <button onClick={() => moveSlide(index, 'up')} disabled={index === 0} className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-900 hover:text-white transition-all disabled:opacity-30"><MoveUp className="w-5 h-5" /></button>
                            <button onClick={() => moveSlide(index, 'down')} disabled={index === slides.length - 1} className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-900 hover:text-white transition-all disabled:opacity-30"><MoveDown className="w-5 h-5" /></button>
                            <button onClick={() => handleDelete(slide.id)} className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"><Trash2 className="w-5 h-5" /></button>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[3rem] w-full max-w-2xl p-10 shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">{editingSlide ? 'Edit Slide' : 'New Slide'}</h3>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-8 h-8 text-gray-400" /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Heading Title</label>
                                    <input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-purple-500 font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Button Label</label>
                                    <input value={formData.button_text} onChange={e => setFormData({ ...formData, button_text: e.target.value })} className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-purple-500 font-bold" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Sub-heading Description</label>
                                <textarea required value={formData.subtitle} onChange={e => setFormData({ ...formData, subtitle: e.target.value })} className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-purple-500 font-bold min-h-[100px]" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Background Image URL</label>
                                <div className="flex gap-4">
                                    <input required value={formData.image_url} onChange={e => setFormData({ ...formData, image_url: e.target.value })} className="flex-1 px-5 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-purple-500 font-bold" />
                                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden border">
                                        {formData.image_url ? <img src={formData.image_url} className="w-full h-full object-cover" /> : <ImageIcon className="text-gray-300" />}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Destination URL Link</label>
                                <input required value={formData.link_url} onChange={e => setFormData({ ...formData, link_url: e.target.value })} className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-purple-500 font-bold" />
                            </div>

                            <button type="submit" className="w-full bg-gray-900 text-white rounded-[2rem] py-6 font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all active:scale-95">
                                Save Slide Configuration
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
