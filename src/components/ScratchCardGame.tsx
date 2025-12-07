import React, { useRef, useEffect, useState } from 'react';
import { X, Trophy, RefreshCw, Sparkles, DollarSign } from 'lucide-react';
import Mascot from './Mascot';

interface ScratchCardGameProps {
    game: {
        id: string;
        name: string;
        price: number;
        maxPrize: string;
        color: string;
    };
    onClose: () => void;
    onPlayAgain: () => void;
    result: {
        won: boolean;
        amount: number;
    };
}

const SYMBOLS = [
    { icon: '💰', value: 5000 },
    { icon: '💎', value: 10000 },
    { icon: '👑', value: 50000 },
    { icon: '🍀', value: 1000 },
    { icon: '7️⃣', value: 2500 },
    { icon: '🍒', value: 500 },
];

const ScratchCardGame: React.FC<ScratchCardGameProps> = ({ game, onClose, onPlayAgain, result }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isRevealed, setIsRevealed] = useState(false);
    const [grid, setGrid] = useState<any[]>([]);

    // New state for winning visuals
    const [winningPattern, setWinningPattern] = useState<number[]>([]);
    const [winType, setWinType] = useState<string>('');

    // Initialize Game Logic
    useEffect(() => {
        // Generate random grid base
        const newGrid = Array(9).fill(null).map(() => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);

        if (result.won) {
            // Force 3 matching symbols corresponding to the win amount
            const winningSymbol = SYMBOLS.find(s => s.value === result.amount) || SYMBOLS[0];

            // Define all possible win patterns
            const patterns = [
                { indices: [0, 1, 2], type: 'Horizontal Row!' },
                { indices: [3, 4, 5], type: 'Horizontal Row!' },
                { indices: [6, 7, 8], type: 'Horizontal Row!' },
                { indices: [0, 3, 6], type: 'Vertical Column!' },
                { indices: [1, 4, 7], type: 'Vertical Column!' },
                { indices: [2, 5, 8], type: 'Vertical Column!' },
                { indices: [0, 4, 8], type: 'Diagonal Line!' },
                { indices: [2, 4, 6], type: 'Diagonal Line!' }
            ];

            // Select a random pattern to be the winner
            const selectedPattern = patterns[Math.floor(Math.random() * patterns.length)];

            // Set the winning symbols in the grid
            selectedPattern.indices.forEach(i => newGrid[i] = winningSymbol);

            setWinningPattern(selectedPattern.indices);
            setWinType(selectedPattern.type);
        } else {
            setWinningPattern([]);
            setWinType('');
        }

        setGrid(newGrid);

        // Wait for render
        setTimeout(initCanvas, 50);
    }, [game, result]);

    const initCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        // Set canvas size to match container
        const size = 320; // Fixed size for game area
        canvas.width = size;
        canvas.height = size;

        // Draw the "Foil"
        const gradient = ctx.createLinearGradient(0, 0, size, size);
        if (game.id === 'gold') {
            gradient.addColorStop(0, '#FCD34D');
            gradient.addColorStop(0.5, '#F59E0B');
            gradient.addColorStop(1, '#B45309');
        } else if (game.id === 'silver') {
            gradient.addColorStop(0, '#E2E8F0');
            gradient.addColorStop(0.5, '#94A3B8');
            gradient.addColorStop(1, '#475569');
        } else {
            gradient.addColorStop(0, '#FBCFE8');
            gradient.addColorStop(0.5, '#DB2777');
            gradient.addColorStop(1, '#831843');
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);

        // Add Pattern/Text to Foil
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.font = 'bold 24px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                ctx.fillText('LUCKY', 50 + (i * 100), 50 + (j * 100));
            }
        }

        ctx.font = 'bold 16px Inter';
        ctx.fillText('SCRATCH HERE', size / 2, size / 2);
    };

    const handleScratch = (e: React.MouseEvent | React.TouchEvent) => {
        if (isRevealed) return;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;

        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        const x = clientX - rect.left;
        const y = clientY - rect.top;

        // Scratch Effect
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, 25, 0, Math.PI * 2);
        ctx.fill();

        checkProgress();
    };

    const checkProgress = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        // Sample pixels to check how much is cleared
        // Optimization: Check fewer pixels for performance
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        let transparent = 0;

        for (let i = 3; i < pixels.length; i += 4 * 20) { // Check every 20th pixel
            if (pixels[i] === 0) transparent++;
        }

        const totalPixelsChecked = pixels.length / (4 * 20);

        if (transparent > totalPixelsChecked * 0.4) { // 40% cleared
            revealAll();
        }
    };

    const revealAll = () => {
        if (isRevealed) return;
        setIsRevealed(true);
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.style.opacity = '0';
            canvas.style.pointerEvents = 'none'; // Ensure clicks pass through to the result layer if needed, or just stop scratching
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">

                {/* Header */}
                <div className="bg-slate-800 p-4 flex justify-between items-center border-b border-slate-700">
                    <h3 className="text-white font-bold flex items-center gap-2">
                        <Sparkles size={18} className="text-yellow-500" />
                        {game.name}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Game Area */}
                <div className="p-8 flex flex-col items-center bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                    <div className="mb-6 text-center">
                        <div className="text-slate-400 text-sm font-medium uppercase tracking-widest mb-1">Match 3 Symbols to Win</div>
                        <div className="text-2xl font-black text-white">{game.maxPrize} Jackpot</div>
                    </div>

                    <div className="relative w-[320px] h-[320px] bg-slate-800 rounded-xl shadow-inner border-4 border-slate-700 overflow-hidden select-none touch-none">

                        {/* Underlying Grid (The Prize) */}
                        <div className="absolute inset-0 grid grid-cols-3 gap-2 p-2">
                            {grid.map((item, idx) => {
                                // Determine if this cell is part of the winning pattern and should be highlighted
                                const isWinningCell = isRevealed && result?.won && winningPattern.includes(idx);

                                return (
                                    <div
                                        key={idx}
                                        className={`
                                            relative rounded-lg flex items-center justify-center text-4xl shadow-inner border transition-all duration-500
                                            ${isWinningCell
                                                ? 'bg-yellow-500/20 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)] scale-[1.05] z-10'
                                                : 'bg-slate-900 border-slate-800'
                                            }
                                        `}
                                    >
                                        {item.icon}
                                        {isWinningCell && (
                                            <div className="absolute inset-0 bg-yellow-400/10 animate-pulse rounded-lg"></div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* The Overlay Canvas (The Foil) */}
                        <canvas
                            ref={canvasRef}
                            className="absolute inset-0 cursor-crosshair transition-opacity duration-700"
                            onMouseDown={handleScratch}
                            onMouseMove={(e) => {
                                // Only scratch if mouse is down
                                if (e.buttons === 1) handleScratch(e);
                            }}
                            onTouchMove={handleScratch}
                        />

                        {/* Result Overlay */}
                        {isRevealed && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none animate-in zoom-in duration-500">
                                {result?.won ? (
                                    <div className="bg-green-500/90 backdrop-blur-md p-6 rounded-2xl text-center shadow-xl border border-green-400 animate-bounce-subtle">
                                        <div className="text-4xl mb-2">🎉</div>
                                        <div className="text-2xl font-black text-white uppercase italic">You Won!</div>
                                        <div className="text-3xl font-bold text-yellow-300 drop-shadow-md">₦{result.amount.toLocaleString()}</div>
                                        {winType && (
                                            <div className="mt-2 inline-block px-3 py-1 bg-white/20 rounded-full text-white text-sm font-bold animate-pulse">
                                                {winType}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl text-center border border-slate-600">
                                        <div className="text-4xl mb-2">😢</div>
                                        <div className="text-xl font-bold text-white">No Luck Today</div>
                                        <div className="text-slate-400 text-sm">Try again for the jackpot!</div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-slate-800 p-6 border-t border-slate-700 flex flex-col gap-3">
                    {isRevealed ? (
                        <div className="flex gap-3">
                            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700 font-bold transition-all">
                                Exit Game
                            </button>
                            <button onClick={onPlayAgain} className="flex-1 py-3 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:scale-[1.02]">
                                <RefreshCw size={18} /> Play Again (₦{game.price})
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between text-slate-400 text-sm">
                            <span className="flex items-center gap-2"><Trophy size={16} /> Win up to {game.maxPrize}</span>
                            <span className="flex items-center gap-2"><DollarSign size={16} /> Cost: ₦{game.price}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ScratchCardGame;
