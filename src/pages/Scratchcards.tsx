import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ticket, ArrowLeft } from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { SEOHead } from "@/components/SEOHead";

const Scratchcards = () => {
    const navigate = useNavigate();

    return (
        <MainLayout>
            <SEOHead
                title="Scratchcards | LuckyWin"
                description="Scratch and win with our exciting digital scratchcard games!"
                url="https://luckywin.name.ng/scratchcards"
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
                            <Ticket className="w-8 h-8 text-purple-500" />
                            Scratchcards
                        </h1>
                        <p className="text-muted-foreground mt-1">Scratch to reveal your prizes</p>
                    </div>
                </div>

                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-foreground">Coming Soon</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Digital scratchcards are currently under development. Scratch your way to prizes soon!
                        </p>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
};

export default Scratchcards;
