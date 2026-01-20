import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, ChevronRight, Zap } from 'lucide-react';

interface NavItem {
    path: string;
    label: string;
    icon: React.ReactNode;
    section: string;
}

interface QuickActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    navItems: NavItem[];
}

export function QuickActionModal({ isOpen, onClose, navItems }: QuickActionModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 100);
        } else {
            setSearchQuery('');
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    const filteredItems = navItems.filter(item =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.section.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Group items by section
    const groupedItems = filteredItems.reduce((acc, item) => {
        if (!acc[item.section]) {
            acc[item.section] = [];
        }
        acc[item.section].push(item);
        return acc;
    }, {} as Record<string, NavItem[]>);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-24 px-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-200">
            <div
                ref={modalRef}
                className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden ring-1 ring-slate-900/5 transition-all duration-200 animate-slideDown"
            >
                {/* Header with Search */}
                <div className="relative border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center px-4 py-4">
                        <Search className="h-5 w-5 text-slate-400 mr-3" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Quick search for modules, settings, or reports..."
                            className="flex-1 bg-transparent border-none outline-none text-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="flex items-center gap-2">
                            <span className="hidden sm:inline-flex items-center px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-xs font-medium text-slate-500">
                                ESC
                            </span>
                            <button
                                onClick={onClose}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <X className="h-5 w-5 text-slate-400" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Results */}
                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-900/50 p-4">
                    {Object.keys(groupedItems).length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="h-8 w-8 text-slate-400" />
                            </div>
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">No matching modules found</h3>
                            <p className="text-sm text-slate-500 mt-1">Try a different search term.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {Object.entries(groupedItems).map(([section, items]) => (
                                <div key={section}>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">
                                        {section}
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {items.map((item) => (
                                            <Link
                                                key={item.path}
                                                to={item.path}
                                                onClick={onClose}
                                                className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-cyan-500 dark:hover:border-cyan-500 hover:shadow-md transition-all group"
                                            >
                                                <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-700 group-hover:bg-cyan-50 dark:group-hover:bg-cyan-900/30 flex items-center justify-center transition-colors">
                                                    <div className="text-slate-500 group-hover:text-cyan-600 dark:text-slate-400 dark:group-hover:text-cyan-400">
                                                        {item.icon}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-900 dark:text-slate-100 group-hover:text-cyan-700 dark:group-hover:text-cyan-400 transition-colors">
                                                        {item.label}
                                                    </div>
                                                    <div className="text-xs text-slate-500 truncate">
                                                        {item.path}
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-4 h-4 ml-auto text-slate-300 group-hover:text-cyan-500 opacity-0 group-hover:opacity-100 transition-all" />
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer actions */}
                <div className="px-4 py-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                            <Zap className="w-3 h-3" /> Quick Access
                        </span>
                    </div>
                    <div>
                        Press <span className="font-mono bg-slate-100 dark:bg-slate-700 px-1 rounded">ESC</span> to close
                    </div>
                </div>
            </div>
        </div>
    );
}
