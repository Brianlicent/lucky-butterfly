import { useState, useEffect, useRef } from 'react';
import { Plane } from 'lucide-react';

interface Particle {
  id: number;
  x: number;
  y: number;
  opacity: number;
}

interface Bet {
  amount: number;
  multiplier: number;
  status: 'pending' | 'won' | 'lost';
}

export default function AviatorGame() {
  const [balance, setBalance] = useState(1000);
  const [betAmount, setBetAmount] = useState(10);
  const [gameState, setGameState] = useState<'idle' | 'flying' | 'crashed'>('idle');
  const [multiplier, setMultiplier] = useState(1.0);
  const [bets, setBets] = useState<Bet[]>([]);
  const [crashPoint, setCrashPoint] = useState(0);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const planePositionRef = useRef(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const particleIdRef = useRef(0);

  // Generate random crash point
  const generateCrashPoint = () => {
    return Math.random() * 0.08 + 0.02; // Crash between 1.02x and 1.08x
  };

  // Start game
  const startGame = () => {
    if (betAmount > balance || betAmount <= 0) return;

    setGameState('flying');
    setMultiplier(1.0);
    planePositionRef.current = 0;
    setCrashPoint(generateCrashPoint());
    setBalance(balance - betAmount);

    const newBet: Bet = {
      amount: betAmount,
      multiplier: 1.0,
      status: 'pending',
    };
    setBets([newBet, ...bets]);

    // Game loop
    let currentMultiplier = 1.0;
    gameLoopRef.current = setInterval(() => {
      currentMultiplier += crashPoint;
      setMultiplier(currentMultiplier);
      planePositionRef.current = Math.min(currentMultiplier * 20, 90);

      // Create particles for dust trail
      const butterflyX = planePositionRef.current;
      const butterflyY = 100 - currentMultiplier * 12; // Start from bottom, move up
      
      setParticles((prev) => {
        const newParticles = [
          ...prev.map((p) => ({ ...p, opacity: p.opacity - 0.05 })),
          {
            id: particleIdRef.current++,
            x: butterflyX,
            y: butterflyY,
            opacity: 1,
          },
        ].filter((p) => p.opacity > 0);
        return newParticles;
      });

      // Check if crashed
      if (currentMultiplier >= 1 + crashPoint) {
        setGameState('crashed');
        setBets((prev) => [
          { ...prev[0], status: 'lost', multiplier: currentMultiplier },
          ...prev.slice(1),
        ]);
        setParticles([]);
        if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      }
    }, 50);
  };

  // Cash out
  const cashOut = () => {
    if (gameState !== 'flying') return;

    const winAmount = betAmount * multiplier;
    setBalance((prev) => prev + winAmount);
    setGameState('idle');
    setBets((prev) => [
      { ...prev[0], status: 'won', multiplier },
      ...prev.slice(1),
    ]);

    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
  };

  // Reset game
  const resetGame = () => {
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    setGameState('idle');
    setMultiplier(1.0);
    planePositionRef.current = 0;
    setParticles([]);
  };

  useEffect(() => {
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Plane className="w-8 h-8 text-yellow-400" />
            <h1 className="text-4xl font-bold text-white">Aviator</h1>
          </div>
          <p className="text-blue-200">Cash out before the plane crashes!</p>
        </div>

        {/* Game Arena */}
        <div className="relative h-80 flex items-center justify-center mb-8 overflow-hidden">
          {/* Dust Trail Particles */}
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="absolute pointer-events-none"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                opacity: particle.opacity,
              }}
            >
              <div className="w-3 h-3 bg-gradient-to-r from-yellow-300 to-yellow-100 rounded-full blur-sm shadow-lg" />
            </div>
          ))}

          {/* Butterfly */}
          <div
            className="absolute transition-all duration-100 z-10"
            style={{
              left: `${planePositionRef.current}%`,
              top: `${100 - multiplier * 12}%`,
            }}
          >
            <div className="text-5xl animate-pulse">🦋</div>
          </div>

          {/* Multiplier Display */}
          <div className="text-center absolute">
            <div className="text-6xl font-bold text-white drop-shadow-lg rounded-lg">
              {multiplier.toFixed(2)}x
            </div>
            {gameState === 'crashed' && (
              <div className="text-5xl font-black text-red-500 mt-4 animate-bounce">
                EXPLODED
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8 shadow-xl">
          <div className="mb-6">
            <label className="block text-white mb-2 font-semibold">Bet Amount</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(1, Number(e.target.value)))}
                disabled={gameState !== 'idle'}
                className="flex-1 bg-gray-700 text-white px-4 py-2 rounded border border-gray-600 disabled:opacity-50"
                min="1"
              />
              <span className="text-white font-semibold px-4 py-2">Balance: ${balance}</span>
            </div>
          </div>

          <div className="flex gap-4">
            {gameState === 'idle' && (
              <button
                onClick={startGame}
                disabled={betAmount > balance}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-3 rounded-lg transition"
              >
                Start Game
              </button>
            )}
            {gameState === 'flying' && (
              <button
                onClick={cashOut}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 rounded-lg transition text-lg"
              >
                Cash Out @ {multiplier.toFixed(2)}x
              </button>
            )}
            {gameState === 'crashed' && (
              <button
                onClick={resetGame}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition"
              >
                Play Again
              </button>
            )}
          </div>
        </div>

        {/* Bet History */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
          <h2 className="text-white font-bold text-lg mb-4">Recent Bets</h2>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {bets.length === 0 ? (
              <p className="text-gray-400">No bets yet</p>
            ) : (
              bets.map((bet, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded flex justify-between items-center ${
                    bet.status === 'won'
                      ? 'bg-green-900 text-green-200'
                      : bet.status === 'lost'
                        ? 'bg-red-900 text-red-200'
                        : 'bg-yellow-900 text-yellow-200'
                  }`}
                >
                  <span>${bet.amount}</span>
                  <span className="font-bold">{bet.multiplier.toFixed(2)}x</span>
                  <span className="text-sm font-semibold">
                    {bet.status === 'won' && `+$${(bet.amount * bet.multiplier).toFixed(0)}`}
                    {bet.status === 'lost' && `-$${bet.amount}`}
                    {bet.status === 'pending' && 'Pending'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
