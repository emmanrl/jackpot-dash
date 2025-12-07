import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Shield, Save, RefreshCw, AlertTriangle, Info } from 'lucide-react';

const AdminScratchSettings = () => {
    // Default to 1000 (1/1000 = 0.1%) win rate base if not set
    const [winRate, setWinRate] = useState<number>(30); // Default 30%
    const [maxWinChance, setMaxWinChance] = useState<number>(1); // Default 1% for Jackpot
    const [fairnessEnabled, setFairnessEnabled] = useState(true);

    useEffect(() => {
        // Load settings from localStorage (mocking DB for now)
        const savedWinRate = localStorage.getItem('SCRATCH_WIN_RATE');
        const savedMaxWin = localStorage.getItem('SCRATCH_MAX_WIN_CHANCE');
        const savedFairness = localStorage.getItem('SCRATCH_FAIRNESS_ENABLED');

        if (savedWinRate) setWinRate(parseInt(savedWinRate));
        if (savedMaxWin) setMaxWinChance(parseFloat(savedMaxWin));
        if (savedFairness) setFairnessEnabled(savedFairness === 'true');
    }, []);

    const handleSave = () => {
        localStorage.setItem('SCRATCH_WIN_RATE', winRate.toString());
        localStorage.setItem('SCRATCH_MAX_WIN_CHANCE', maxWinChance.toString());
        localStorage.setItem('SCRATCH_FAIRNESS_ENABLED', fairnessEnabled.toString());

        toast.success("Settings saved successfully!");

        // Dispatch event so other tabs/components update immediately
        window.dispatchEvent(new Event('storage'));
    };

    return (
        <AdminLayout>
            <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-500">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500">
                            Scratchcard Administration
                        </h1>
                        <p className="text-slate-400 mt-1">Configure global win rates and fairness settings.</p>
                    </div>
                    <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                        <Save className="mr-2 h-4 w-4" /> Save Changes
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Win Rate Control */}
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <RefreshCw className="h-5 w-5 text-blue-500" />
                                Global Win Probability
                            </CardTitle>
                            <CardDescription>
                                Set the base probability for a user to win ANY prize.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label className="text-slate-200">Win Rate ({winRate}%)</Label>
                                    <span className={`text-sm font-bold ${winRate > 50 ? 'text-green-500' : 'text-orange-500'}`}>
                                        {winRate > 50 ? 'Very High' : winRate < 10 ? 'Very Low' : 'Balanced'}
                                    </span>
                                </div>
                                <Slider
                                    value={[winRate]}
                                    max={100}
                                    step={1}
                                    onValueChange={(vals) => setWinRate(vals[0])}
                                    className="py-4"
                                />
                                <p className="text-xs text-slate-500">
                                    At {winRate}%, approximately {Math.round(winRate * 10)} out of every 1000 tickets will be winners.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Jackpot Chance */}
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <Shield className="h-5 w-5 text-yellow-500" />
                                Jackpot Probability
                            </CardTitle>
                            <CardDescription>
                                Chance for a winning ticket to be a JACKPOT.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label className="text-slate-200">Jackpot Chance ({maxWinChance}%)</Label>
                                    <span className="text-xs text-red-400 font-mono">1 in {Math.round(100 / maxWinChance)} wins</span>
                                </div>
                                <Slider
                                    value={[maxWinChance]}
                                    max={10}
                                    step={0.1}
                                    onValueChange={(vals) => setMaxWinChance(vals[0])}
                                    className="py-4"
                                />
                                <div className="bg-yellow-900/20 border border-yellow-500/20 p-3 rounded-lg flex items-start gap-2">
                                    <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                                    <p className="text-xs text-yellow-200/80">
                                        Warning: Increasing this value significantly affects the economy. Keep below 1% for sustainability.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Fairness Settings */}
                    <Card className="bg-slate-900 border-slate-800 md:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <Info className="h-5 w-5 text-purple-500" />
                                Transparency & Display
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-950 border border-slate-800">
                                <div className="space-y-0.5">
                                    <Label className="text-base text-slate-200">Show "Provably Fair" Badge</Label>
                                    <p className="text-sm text-slate-500">
                                        Display randomness certification information to users.
                                    </p>
                                </div>
                                <Switch
                                    checked={fairnessEnabled}
                                    onCheckedChange={setFairnessEnabled}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminScratchSettings;
