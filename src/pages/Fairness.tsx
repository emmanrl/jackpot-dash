import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ArrowLeft, Lock, Eye, CheckCircle } from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { SEOHead } from "@/components/SEOHead";

const Fairness = () => {
    const navigate = useNavigate();

    return (
        <MainLayout>
            <SEOHead
                title="Provably Fair | LuckyWin"
                description="Learn about our provably fair system and how we ensure transparency"
                url="https://luckywin.name.ng/fairness"
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
                            <ShieldCheck className="w-8 h-8 text-green-500" />
                            Provably Fair
                        </h1>
                        <p className="text-muted-foreground mt-1">Transparency and fairness you can verify</p>
                    </div>
                </div>

                <Card className="bg-gradient-to-br from-green-500/10 to-blue-500/10 border-green-500/20">
                    <CardHeader>
                        <CardTitle className="text-foreground">Our Commitment to Fairness</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            At LuckyWin, we use cryptographic algorithms to ensure that every draw is completely random and cannot be manipulated.
                            Our provably fair system allows you to verify the fairness of each draw independently.
                        </p>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-card border-border">
                        <CardHeader>
                            <CardTitle className="text-foreground flex items-center gap-2">
                                <Lock className="w-5 h-5 text-blue-500" />
                                Cryptographic Security
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground text-sm">
                                We use industry-standard cryptographic hashing to ensure draw results cannot be predicted or manipulated.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-border">
                        <CardHeader>
                            <CardTitle className="text-foreground flex items-center gap-2">
                                <Eye className="w-5 h-5 text-purple-500" />
                                Full Transparency
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground text-sm">
                                All draw results and seeds are publicly available for verification by anyone.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-border">
                        <CardHeader>
                            <CardTitle className="text-foreground flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                Independent Verification
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground text-sm">
                                You can independently verify the fairness of any draw using our verification tools.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-foreground">How It Works</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                                <span className="text-green-500 font-bold">1</span>
                            </div>
                            <div>
                                <p className="text-foreground font-medium">Server Seed Generation</p>
                                <p className="text-muted-foreground text-sm">
                                    Before each draw, we generate a random server seed that is hashed and published.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                                <span className="text-blue-500 font-bold">2</span>
                            </div>
                            <div>
                                <p className="text-foreground font-medium">Client Seed Input</p>
                                <p className="text-muted-foreground text-sm">
                                    Players can provide their own client seed or use a randomly generated one.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                                <span className="text-purple-500 font-bold">3</span>
                            </div>
                            <div>
                                <p className="text-foreground font-medium">Result Calculation</p>
                                <p className="text-muted-foreground text-sm">
                                    The draw result is calculated using both seeds, ensuring neither party can manipulate the outcome.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                                <span className="text-yellow-500 font-bold">4</span>
                            </div>
                            <div>
                                <p className="text-foreground font-medium">Verification</p>
                                <p className="text-muted-foreground text-sm">
                                    After the draw, the server seed is revealed, allowing you to verify the result was fair.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
};

export default Fairness;
