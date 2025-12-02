import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Zap, Trophy, ArrowLeft } from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { SEOHead } from "@/components/SEOHead";

const HourlyDraw = () => {
    const navigate = useNavigate();

    return (
        <MainLayout>
            <SEOHead
                title="Hourly Draw | LuckyWin"
                description="Participate in hourly jackpot draws with instant results. Win big every hour!"
                url="https://luckywin.name.ng/hourly"
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
                            <Clock className="w-8 h-8 text-blue-400" />
                            Hourly Draw
                        </h1>
                        <p className="text-muted-foreground mt-1">Fast-paced hourly jackpots with instant results</p>
                    </div>
                </div>

                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-foreground">Coming Soon</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Hourly draws are currently under development. Check back soon for exciting hourly jackpot opportunities!
                        </p>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
};

export default HourlyDraw;
