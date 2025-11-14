import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Lock, Palette } from "lucide-react";
import { useTheme, themes, ThemeType } from "@/hooks/useTheme";

interface ThemeSelectorProps {
  userId: string | undefined;
}

export const ThemeSelector = ({ userId }: ThemeSelectorProps) => {
  const { currentTheme, xp, updateTheme, unlockedThemes } = useTheme(userId);

  const getThemeGradient = (theme: ThemeType) => {
    const config = themes[theme];
    return `linear-gradient(135deg, hsl(${config.colors.primary}), hsl(${config.colors.secondary}))`;
  };

  const isUnlocked = (theme: ThemeType) => unlockedThemes.includes(theme);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" />
          <CardTitle>Theme Customization</CardTitle>
        </div>
        <CardDescription>
          Unlock new themes by earning XP. Current XP: <span className="font-bold text-primary">{xp}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {(Object.keys(themes) as ThemeType[]).map((themeKey) => {
            const theme = themes[themeKey];
            const unlocked = isUnlocked(themeKey);
            const active = currentTheme === themeKey;

            return (
              <div
                key={themeKey}
                className={`relative rounded-lg border-2 p-4 transition-all cursor-pointer ${
                  active
                    ? 'border-primary shadow-lg'
                    : unlocked
                    ? 'border-border hover:border-primary/50'
                    : 'border-border opacity-50 cursor-not-allowed'
                }`}
                onClick={() => unlocked && updateTheme(themeKey)}
              >
                {/* Theme Color Preview */}
                <div
                  className="w-full h-20 rounded-md mb-3"
                  style={{
                    background: getThemeGradient(themeKey),
                  }}
                />

                {/* Theme Info */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold capitalize">{theme.name}</h3>
                    {active && <Check className="w-4 h-4 text-primary" />}
                    {!unlocked && <Lock className="w-4 h-4 text-muted-foreground" />}
                  </div>

                  <Badge variant={unlocked ? "secondary" : "outline"} className="text-xs">
                    {unlocked ? 'Unlocked' : `${theme.minXP} XP Required`}
                  </Badge>
                </div>

                {/* Unlock Overlay */}
                {!unlocked && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Lock className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm font-medium">{theme.minXP - xp} XP to unlock</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground">
            💡 <span className="font-semibold">Tip:</span> Earn XP by purchasing tickets (1 XP each) and winning jackpots (10 XP each) to unlock more themes!
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
