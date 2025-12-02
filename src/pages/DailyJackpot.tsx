import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, ArrowLeft } from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { SEOHead } from "@/components/SEOHead";

const DailyJackpot = () => {
    const navigate = useNavigate();

    return (
        <MainLayout>
            <SEOHead
                title="Daily Jackpot | LuckyWin"
                description="Play daily jackpot draws and win amazing prizes every day!"
                url="https://luckywin.name.ng/daily"
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
                            <Trophy className="w-8 h-8 text-yellow-500" />
                            Daily Jackpot
                        </h1>
                        <p className="text-muted-foreground mt-1">Win big with our daily jackpot draws</p>
                    </div>
                </div>

                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-foreground">Coming Soon</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Daily jackpot draws are currently under development. Stay tuned for daily winning opportunities!
                        </p>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
};

export default DailyJackpot;
