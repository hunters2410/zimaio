import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { GlobalChatModal } from './GlobalChatModal';

export function FloatingChat() {
    const { user } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);

    if (!user) return null;

    return (
        <>
            {/* Chat Toggle Button - Always Visible */}
            <button
                onClick={() => setIsModalOpen(true)}
                className="fixed bottom-6 right-6 z-[90] w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-emerald-700 transition-all hover:scale-110 active:scale-90 group"
            >
                <div className="absolute inset-0 bg-emerald-600 rounded-full animate-ping opacity-20 group-hover:hidden" />
                <MessageCircle className="w-6 h-6" />
            </button>

            {/* Global Chat Modal */}
            <GlobalChatModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
}
