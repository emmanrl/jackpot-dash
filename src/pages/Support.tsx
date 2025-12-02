import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, ArrowLeft, Mail, MessageCircle, Phone } from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { SEOHead } from "@/components/SEOHead";

const Support = () => {
    const navigate = useNavigate();

    return (
        <MainLayout>
            <SEOHead
                title="Support | LuckyWin"
                description="Get help and support for your LuckyWin account"
                url="https://luckywin.name.ng/support"
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
                            <MessageSquare className="w-8 h-8 text-blue-500" />
                            Support
                        </h1>
                        <p className="text-muted-foreground mt-1">We're here to help you</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-card border-border hover:border-blue-500/30 transition-all">
                        <CardHeader>
                            <CardTitle className="text-foreground flex items-center gap-2">
                                <MessageCircle className="w-5 h-5 text-blue-500" />
                                Live Chat
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground text-sm mb-4">
                                Chat with our support team in real-time
                            </p>
                            <Button className="w-full bg-blue-500 hover:bg-blue-600">
                                Start Chat
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-border hover:border-green-500/30 transition-all">
                        <CardHeader>
                            <CardTitle className="text-foreground flex items-center gap-2">
                                <Mail className="w-5 h-5 text-green-500" />
                                Email Support
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground text-sm mb-4">
                                Send us an email and we'll respond within 24 hours
                            </p>
                            <Button variant="outline" className="w-full border-green-500 text-green-400 hover:bg-green-500/10">
                                Send Email
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-border hover:border-purple-500/30 transition-all">
                        <CardHeader>
                            <CardTitle className="text-foreground flex items-center gap-2">
                                <Phone className="w-5 h-5 text-purple-500" />
                                Phone Support
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground text-sm mb-4">
                                Call us for immediate assistance
                            </p>
                            <Button variant="outline" className="w-full border-purple-500 text-purple-400 hover:bg-purple-500/10">
                                View Number
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-foreground">Frequently Asked Questions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-foreground font-medium mb-1">How do I deposit funds?</p>
                            <p className="text-muted-foreground text-sm">
                                Go to your dashboard and click the "Deposit Funds" button. Follow the instructions to complete your deposit.
                            </p>
                        </div>
                        <div>
                            <p className="text-foreground font-medium mb-1">How long do withdrawals take?</p>
                            <p className="text-muted-foreground text-sm">
                                Withdrawals are typically processed within 24-48 hours after approval.
                            </p>
                        </div>
                        <div>
                            <p className="text-foreground font-medium mb-1">How do I check my tickets?</p>
                            <p className="text-muted-foreground text-sm">
                                Visit your dashboard to see all your recent tickets and their status.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
};

export default Support;
