import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export function BackToTopButton() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);

        return () => {
            window.removeEventListener('scroll', toggleVisibility);
        };
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    return (
        <>
            <button
                onClick={scrollToTop}
                className={`fixed bottom-8 right-8 z-[100] p-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl shadow-2xl shadow-emerald-900/40 transition-all duration-500 transform hover:scale-110 animate-float group ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
                    }`}
                aria-label="Back to top"
            >
                <ArrowUp className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
            </button>
        </>
    );
}
