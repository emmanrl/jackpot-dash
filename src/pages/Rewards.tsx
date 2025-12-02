import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, ArrowLeft, Star, Trophy, Zap } from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { SEOHead } from "@/components/SEOHead";

const Rewards = () => {
    const navigate = useNavigate();

    return (
        <MainLayout>
            <SEOHead
                title="Rewards | LuckyWin"
                description="Earn rewards and unlock achievements as you play!"
                url="https://luckywin.name.ng/rewards"
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
                    <div>
                        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                            <Gift className="w-8 h-8 text-pink-500" />
                            Rewards
                        </h1>
                        <p className="text-muted-foreground mt-1">Earn rewards and unlock achievements</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-card border-border">
                        <CardHeader>
                            <CardTitle className="text-foreground flex items-center gap-2">
                                <Star className="w-5 h-5 text-yellow-500" />
                                Daily Bonuses
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground text-sm">
                                Log in daily to claim your bonus rewards
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-border">
                        <CardHeader>
                            <CardTitle className="text-foreground flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-purple-500" />
                                Achievements
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground text-sm">
                                Complete challenges to unlock achievements
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-border">
                        <CardHeader>
                            <CardTitle className="text-foreground flex items-center gap-2">
                                <Zap className="w-5 h-5 text-blue-500" />
                                XP Boosts
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground text-sm">
                                Earn XP faster with special boosts
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-foreground">Coming Soon</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Our rewards system is currently under development. Start earning rewards soon!
                        </p>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
};

export default Rewards;
