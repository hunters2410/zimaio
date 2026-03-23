import { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

interface Category {
    id: string;
    name: string;
    slug: string;
}

interface SearchableCategoryDropdownProps {
    categories: Category[];
    onSelect: (slug: string) => void;
    isDark?: boolean;
}

export function SearchableCategoryDropdown({ categories, onSelect, isDark }: SearchableCategoryDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSlug, setSelectedSlug] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const filteredCategories = categories.filter(cat =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (slug: string) => {
        setSelectedSlug(slug);
        onSelect(slug);
        setIsOpen(false);
        setSearchTerm('');
    };

    const selectedCategory = categories.find(cat => cat.slug === selectedSlug);

    return (
        <div className="relative h-full flex items-center" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="h-full px-5 flex items-center justify-between min-w-[160px] bg-transparent text-gray-500 dark:text-gray-400 text-[11px] font-bold uppercase tracking-widest focus:outline-none cursor-pointer border-r border-gray-200 dark:border-slate-800 transition-colors hover:text-green-600 dark:hover:text-green-400 group"
            >
                <span className="truncate mr-3">
                    {selectedCategory ? selectedCategory.name : 'ALL CATEGORIES'}
                </span>
                <ChevronDown className={`h-3 w-3 text-gray-400 group-hover:text-green-600 transition-all duration-300 ${isOpen ? 'rotate-180 text-green-600' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-[calc(100%+8px)] left-0 w-72 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                autoFocus
                                type="text"
                                placeholder="Search categories..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500/20 focus:border-green-500/50 outline-none font-medium transition-all"
                            />
                        </div>
                    </div>

                    <div className="max-h-[320px] overflow-y-auto py-2 custom-scrollbar">
                        <button
                            onClick={() => handleSelect('')}
                            className={`w-full flex items-center justify-between px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest transition-colors hover:bg-green-50 dark:hover:bg-slate-800 ${selectedSlug === '' ? 'text-green-600 bg-green-50/50 dark:bg-green-900/10' : 'text-gray-500 dark:text-gray-400'}`}
                        >
                            All Categories
                            {selectedSlug === '' && <Check className="h-3.5 w-3.5" />}
                        </button>

                        <div className="h-px bg-gray-50 dark:bg-slate-800 my-1 mx-2" />

                        {filteredCategories.length > 0 ? (
                            filteredCategories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => handleSelect(cat.slug)}
                                    className={`w-full flex items-center justify-between px-5 py-3 text-left text-[11px] font-bold uppercase tracking-widest transition-colors hover:bg-green-50 dark:hover:bg-slate-800 ${selectedSlug === cat.slug ? 'text-green-600 bg-green-50/50 dark:bg-green-900/10' : 'text-gray-500 dark:text-gray-400'}`}
                                >
                                    {cat.name}
                                    {selectedSlug === cat.slug && <Check className="h-3.5 w-3.5" />}
                                </button>
                            ))
                        ) : (
                            <div className="px-5 py-10 text-center">
                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest opacity-60">No results found</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
