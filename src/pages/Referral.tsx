import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, ArrowLeft } from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { SEOHead } from "@/components/SEOHead";
import { ReferralCard } from "@/components/ReferralCard";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

const Referral = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });
    }, []);

    return (
        <MainLayout>
            <SEOHead
                title="Referral Program | LuckyWin"
                description="Refer friends and earn rewards together!"
                url="https://luckywin.name.ng/referral"
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
                            <Users className="w-8 h-8 text-blue-500" />
                            Referral Program
                        </h1>
                        <p className="text-muted-foreground mt-1">Invite friends and earn rewards together</p>
                    </div>
                </div>

                {user ? (
                    <ReferralCard userId={user.id} />
                ) : (
                    <Card className="bg-card border-border">
                        <CardHeader>
                            <CardTitle className="text-foreground">Sign In Required</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground mb-4">
                                Please sign in to access your referral program.
                            </p>
                            <Button onClick={() => navigate("/auth")} className="bg-primary text-primary-foreground">
                                Sign In
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </MainLayout>
    );
};

export default Referral;
