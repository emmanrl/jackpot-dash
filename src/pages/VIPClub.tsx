import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, ArrowLeft, Star, Trophy, Zap, Gift } from "lucide-react";
import Mascot from "@/components/Mascot";
import MainLayout from "@/components/MainLayout";
import { SEOHead } from "@/components/SEOHead";

const VIPClub = () => {
    const navigate = useNavigate();

    const vipTiers = [
        { name: "Bronze", color: "text-orange-600", minXP: 0, benefits: ["5% cashback", "Priority support"] },
        { name: "Silver", color: "text-gray-400", minXP: 1000, benefits: ["10% cashback", "Exclusive draws", "Birthday bonus"] },
        { name: "Gold", color: "text-yellow-500", minXP: 5000, benefits: ["15% cashback", "VIP events", "Personal account manager"] },
        { name: "Platinum", color: "text-purple-500", minXP: 15000, benefits: ["20% cashback", "Premium rewards", "Luxury gifts"] },
    ];

    return (
        <MainLayout>
            <SEOHead
                title="VIP Club | LuckyWin"
                description="Join our exclusive VIP Club and enjoy premium benefits and rewards!"
                url="https://luckywin.name.ng/vip"
            />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(-1)}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex items-center gap-6">
                        <div className="hidden md:block w-24 h-24 -my-4">
                            <Mascot variant="logo" size="100%" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                                <Crown className="w-8 h-8 text-yellow-500" />
                                VIP Club
                            </h1>
                            <p className="text-muted-foreground mt-1">Exclusive benefits for our valued members</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {vipTiers.map((tier, index) => (
                            <Card key={index} className="bg-card border-border hover:border-yellow-500/30 transition-all">
                                <CardHeader>
                                    <CardTitle className={`${tier.color} flex items-center gap-2`}>
                                        <Crown className="w-5 h-5" />
                                        {tier.name}
                                    </CardTitle>
                                    <p className="text-xs text-muted-foreground">{tier.minXP}+ XP</p>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2">
                                        {tier.benefits.map((benefit, i) => (
                                            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                                <Star className="w-3 h-3 text-yellow-500 mt-1 flex-shrink-0" />
                                                {benefit}
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <Card className="bg-gradient-to-br from-yellow-500/10 to-purple-500/10 border-yellow-500/20">
                        <CardHeader>
                            <CardTitle className="text-foreground">How to Level Up</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-start gap-3">
                                <Trophy className="w-5 h-5 text-yellow-500 mt-1" />
                                <div>
                                    <p className="text-foreground font-medium">Play and Win</p>
                                    <p className="text-muted-foreground text-sm">Earn XP by participating in jackpots and winning prizes</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Zap className="w-5 h-5 text-blue-500 mt-1" />
                                <div>
                                    <p className="text-foreground font-medium">Daily Login</p>
                                    <p className="text-muted-foreground text-sm">Get bonus XP for logging in daily</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Gift className="w-5 h-5 text-pink-500 mt-1" />
                                <div>
                                    <p className="text-foreground font-medium">Refer Friends</p>
                                    <p className="text-muted-foreground text-sm">Earn XP when your friends join and play</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </MainLayout>
    );
};

export default VIPClub;
