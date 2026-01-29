import { MessageCircle } from 'lucide-react';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import { ChatWindow } from './ChatWindow';

export function FloatingChat() {
    const { isOpen, activeSession, closeChat, toggleChat } = useChat();
    const { user } = useAuth();

    if (!user) return null;

    return (
        <>
            {/* Chat Toggle Button */}
            {!isOpen && (
                <button
                    onClick={toggleChat}
                    className="fixed bottom-6 right-6 z-[90] w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-emerald-700 transition-all hover:scale-110 active:scale-90 group"
                >
                    <div className="absolute inset-0 bg-emerald-600 rounded-full animate-ping opacity-20 group-hover:hidden" />
                    <MessageCircle className="w-6 h-6" />
                </button>
            )}

            {/* Chat Window Container */}
            {isOpen && activeSession && (
                <ChatWindow
                    vendorId={activeSession.vendorId}
                    vendorName={activeSession.vendorName}
                    customerId={user.id}
                    onClose={closeChat}
                />
            )}
        </>
    );
}
