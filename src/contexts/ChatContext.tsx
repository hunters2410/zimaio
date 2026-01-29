import { createContext, useContext, useState, ReactNode } from 'react';

interface ChatSession {
    vendorId: string;
    vendorName: string;
}

interface ChatContextType {
    isOpen: boolean;
    activeSession: ChatSession | null;
    openChat: (vendorId: string, vendorName: string) => void;
    closeChat: () => void;
    toggleChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeSession, setActiveSession] = useState<ChatSession | null>(null);

    const openChat = (vendorId: string, vendorName: string) => {
        setActiveSession({ vendorId, vendorName });
        setIsOpen(true);
    };

    const closeChat = () => {
        setIsOpen(false);
    };

    const toggleChat = () => {
        setIsOpen(prev => !prev);
    };

    return (
        <ChatContext.Provider value={{ isOpen, activeSession, openChat, closeChat, toggleChat }}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChat() {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
}
