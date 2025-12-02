import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, ArrowLeft, Percent, Clock, Trophy } from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { SEOHead } from "@/components/SEOHead";

const Promotions = () => {
    const navigate = useNavigate();

    return (
        <MainLayout>
            <SEOHead
                title="Promotions | LuckyWin"
                description="Check out our latest promotions and special offers!"
                url="https://luckywin.name.ng/promotions"
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
                            <Gift className="w-8 h-8 text-green-500" />
                            Promotions
                        </h1>
                        <p className="text-muted-foreground mt-1">Exclusive offers and bonuses</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
                        <CardHeader>
                            <CardTitle className="text-foreground flex items-center gap-2">
                                <Percent className="w-5 h-5 text-yellow-500" />
                                Welcome Bonus
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground text-sm mb-2">
                                Get 100% bonus on your first deposit!
                            </p>
                            <Button className="bg-yellow-500 text-black hover:bg-yellow-400">
                                Claim Now
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
                        <CardHeader>
                            <CardTitle className="text-foreground flex items-center gap-2">
                                <Clock className="w-5 h-5 text-purple-500" />
                                Happy Hour
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground text-sm mb-2">
                                Double XP during happy hours!
                            </p>
                            <Button variant="outline" className="border-purple-500 text-purple-400 hover:bg-purple-500/10">
                                Learn More
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-foreground">More Promotions Coming Soon</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            We're working on exciting new promotions. Check back regularly for updates!
                        </p>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
};

export default Promotions;
