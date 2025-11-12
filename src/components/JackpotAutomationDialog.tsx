import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Upload } from "lucide-react";

interface JackpotAutomationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function JackpotAutomationDialog({
  open,
  onOpenChange,
  onSuccess,
}: JackpotAutomationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    frequency: "5mins",
    ticketPrice: "",
    expiryHours: "",
    category: "hourly",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let backgroundImageUrl = null;

      // Upload background image if provided
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError, data } = await supabase.storage
          .from('jackpot-images')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('jackpot-images')
          .getPublicUrl(fileName);

        backgroundImageUrl = publicUrl;
      }

      // Calculate next draw time
      const now = new Date();
      let nextDraw = new Date(now);
      
      if (formData.frequency === '5mins') {
        nextDraw.setMinutes(now.getMinutes() + 72, 0, 0);
      } else if (formData.frequency === '30mins') {
        nextDraw.setHours(now.getHours() + 2);
        nextDraw.setMinutes(now.getMinutes() + 24, 0, 0);
      } else if (formData.frequency === '1hour') {
        nextDraw.setHours(now.getHours() + 4, 0, 0, 0);
      } else if (formData.frequency === '12hours') {
        nextDraw.setHours(18, 0, 0, 0);
        if (nextDraw.getTime() <= now.getTime()) {
          nextDraw.setDate(nextDraw.getDate() + 1);
        }
      } else if (formData.frequency === '24hours') {
        nextDraw.setHours(24, 0, 0, 0);
        if (nextDraw.getTime() <= now.getTime()) {
          nextDraw.setDate(nextDraw.getDate() + 1);
        }
      }

      // Calculate expiry time
      let expiresAt = null;
      if (formData.expiryHours) {
        expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + parseInt(formData.expiryHours));
      }

      // Get next jackpot number
      const { data: maxJackpot } = await supabase
        .from('jackpots')
        .select('jackpot_number')
        .order('jackpot_number', { ascending: false })
        .limit(1)
        .single();

      const nextJackpotNumber = (maxJackpot?.jackpot_number || 0) + 1;

      // Create jackpot
      const { error } = await supabase.from('jackpots').insert({
        name: formData.name,
        description: formData.description,
        frequency: formData.frequency,
        ticket_price: parseFloat(formData.ticketPrice),
        prize_pool: 0,
        next_draw: nextDraw.toISOString(),
        expires_at: expiresAt?.toISOString(),
        status: 'active',
        jackpot_number: nextJackpotNumber,
        background_image_url: backgroundImageUrl,
        category: formData.category,
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Automated jackpot created successfully",
      });

      setFormData({
        name: "",
        description: "",
        frequency: "5mins",
        ticketPrice: "",
        expiryHours: "",
        category: "hourly",
      });
      setImageFile(null);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Automated Jackpot</DialogTitle>
          <DialogDescription>
            Set up an automated jackpot with scheduled draws
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Jackpot Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Express Draw"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the jackpot..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="frequency">Draw Frequency</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value) => setFormData({ ...formData, frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5mins">Every 1.2 hours (20x daily)</SelectItem>
                  <SelectItem value="30mins">Every 2.4 hours (10x daily)</SelectItem>
                  <SelectItem value="1hour">Every 4 hours (6x daily)</SelectItem>
                  <SelectItem value="12hours">Every 12 hours (2x daily)</SelectItem>
                  <SelectItem value="24hours">Daily at midnight</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticketPrice">Ticket Price (₦)</Label>
              <Input
                id="ticketPrice"
                type="number"
                step="0.01"
                value={formData.ticketPrice}
                onChange={(e) => setFormData({ ...formData, ticketPrice: e.target.value })}
                placeholder="100.00"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="3hours">3 Hours</SelectItem>
                <SelectItem value="1hour">1 Hour</SelectItem>
                <SelectItem value="quick">Quick</SelectItem>
                <SelectItem value="long">Long</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiryHours">Expiry Duration (hours - optional)</Label>
            <Input
              id="expiryHours"
              type="number"
              value={formData.expiryHours}
              onChange={(e) => setFormData({ ...formData, expiryHours: e.target.value })}
              placeholder="e.g., 24 for 24 hours"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty for no expiry
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="backgroundImage">Background Image (optional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="backgroundImage"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setImageFile(file);
                }}
                className="flex-1"
              />
              <Button type="button" variant="outline" size="icon">
                <Upload className="w-4 h-4" />
              </Button>
            </div>
            {imageFile && (
              <p className="text-xs text-muted-foreground">
                Selected: {imageFile.name}
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Creating..." : "Create Jackpot"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
