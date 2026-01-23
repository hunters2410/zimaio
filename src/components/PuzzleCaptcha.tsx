import { useState, useEffect, useRef } from 'react';
import { Puzzle, CheckCircle, RefreshCw } from 'lucide-react';

interface PuzzleCaptchaProps {
    onVerify: (isValid: boolean) => void;
}

export function PuzzleCaptcha({ onVerify }: PuzzleCaptchaProps) {
    const [isVerified, setIsVerified] = useState(false);
    const [sliderValue, setSliderValue] = useState(0);
    const [targetPosition, setTargetPosition] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    // Randomize target position on mount
    useEffect(() => {
        generatePuzzle();
    }, []);

    const generatePuzzle = () => {
        // Random position between 20% and 80%
        const randomPos = Math.floor(Math.random() * 60) + 20;
        setTargetPosition(randomPos);
        setSliderValue(0);
        setIsVerified(false);
        onVerify(false);
    };

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isVerified) return;
        setSliderValue(Number(e.target.value));
    };

    const handleDragEnd = () => {
        if (isVerified) return;

        // Check if within 5% tolerance
        const tolerance = 5;
        if (Math.abs(sliderValue - targetPosition) < tolerance) {
            setIsVerified(true);
            onVerify(true);
        } else {
            // Snap back if failed
            setSliderValue(0);
        }
        setIsDragging(false);
    };

    return (
        <div className="w-full select-none">
            <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Puzzle className="w-4 h-4 text-emerald-500" />
                    Security Check
                </label>
                {!isVerified && (
                    <button
                        type="button"
                        onClick={generatePuzzle}
                        className="text-xs text-slate-400 hover:text-emerald-600 transition-colors flex items-center gap-1"
                    >
                        <RefreshCw className="w-3 h-3" /> Refresh
                    </button>
                )}
            </div>

            <div className="relative w-full h-12 bg-slate-100 rounded-xl border border-slate-200 overflow-hidden shadow-inner">
                {isVerified ? (
                    <div className="absolute inset-0 bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold gap-2 animate-in fade-in duration-300">
                        <CheckCircle className="w-5 h-5" />
                        Verified Human
                    </div>
                ) : (
                    <>
                        {/* Target Zone */}
                        <div
                            className="absolute top-1 bottom-1 w-10 bg-slate-200/50 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center"
                            style={{ left: `${targetPosition}%` }}
                        >
                            <div className="w-2 h-2 bg-slate-300 rounded-full opacity-50"></div>
                        </div>

                        {/* Text Hint */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-xs font-medium text-slate-400 opacity-50">
                                {sliderValue === 0 ? "Slide to complete the puzzle" : ""}
                            </span>
                        </div>

                        {/* Moving Piece */}
                        <div
                            className="absolute top-1 bottom-1 w-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg shadow-md cursor-grab active:cursor-grabbing flex items-center justify-center z-10 transition-all duration-75"
                            style={{ left: `${sliderValue}%` }}
                        >
                            <Puzzle className="w-5 h-5 text-white drop-shadow-sm" />
                        </div>

                        {/* Invisible Slider Input for Interaction */}
                        <input
                            type="range"
                            min="0"
                            max="90" // 100 - width of piece roughly
                            value={sliderValue}
                            onChange={handleSliderChange}
                            onMouseUp={handleDragEnd}
                            onTouchEnd={handleDragEnd}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                        />
                    </>
                )}
            </div>
        </div>
    );
}
