import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Upload, GripVertical } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SliderImage {
  id: string;
  image_url: string;
  title: string | null;
  description: string | null;
  order_index: number;
  is_active: boolean;
}

export default function AdminSliderManagement() {
  const [images, setImages] = useState<SliderImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    order_index: 0,
    is_active: true,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const { data, error } = await supabase
        .from("slider_images")
        .select("*")
        .order("order_index", { ascending: true });

      if (!error && data) {
        setImages(data);
      }
    } catch (err) {
      console.error("Error fetching slider images:", err);
      toast.error("Failed to load slider images");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast.error("Please select an image");
      return;
    }

    setUploading(true);
    try {
      // Upload image to storage
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("slider-images")
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("slider-images")
        .getPublicUrl(fileName);

      // Insert slider image record
      const { error: insertError } = await supabase
        .from("slider_images")
        .insert({
          image_url: publicUrl,
          title: formData.title || null,
          description: formData.description || null,
          order_index: formData.order_index,
          is_active: formData.is_active,
        });

      if (insertError) throw insertError;

      toast.success("Slider image added successfully");
      setDialogOpen(false);
      resetForm();
      fetchImages();
    } catch (error: any) {
      console.error("Error adding slider image:", error);
      toast.error(error.message || "Failed to add slider image");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, imageUrl: string) => {
    try {
      // Extract filename from URL and delete from storage
      const fileName = imageUrl.split("/").pop();
      if (fileName) {
        await supabase.storage.from("slider-images").remove([fileName]);
      }

      // Delete record
      const { error } = await supabase
        .from("slider_images")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Slider image deleted");
      fetchImages();
    } catch (error: any) {
      console.error("Error deleting slider image:", error);
      toast.error("Failed to delete slider image");
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("slider_images")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      toast.success(`Slider image ${!currentStatus ? "activated" : "deactivated"}`);
      fetchImages();
    } catch (error: any) {
      console.error("Error updating slider image:", error);
      toast.error("Failed to update slider image");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      order_index: 0,
      is_active: true,
    });
    setSelectedFile(null);
    setImagePreview(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Homepage Slider Management</CardTitle>
            <CardDescription>Manage images displayed in the homepage carousel</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Image
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>Add Slider Image</DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-[70vh] pr-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="image">Image *</Label>
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="mt-2"
                    />
                    {imagePreview && (
                      <div className="mt-4 rounded-lg overflow-hidden border">
                        <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover" />
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="title">Title (Optional)</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Slider title"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Slider description"
                      className="mt-2"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="order">Display Order</Label>
                    <Input
                      id="order"
                      type="number"
                      value={formData.order_index}
                      onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                      className="mt-2"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="active">Active</Label>
                  </div>
                </div>
              </ScrollArea>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={uploading || !selectedFile}>
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Order</TableHead>
                <TableHead className="min-w-[200px]">Image</TableHead>
                <TableHead className="min-w-[150px]">Title</TableHead>
                <TableHead className="hidden md:table-cell min-w-[200px]">Description</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {images.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No slider images yet. Add your first image!
                  </TableCell>
                </TableRow>
              ) : (
                images.map((image) => (
                  <TableRow key={image.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                        {image.order_index}
                      </div>
                    </TableCell>
                    <TableCell>
                      <img
                        src={image.image_url}
                        alt={image.title || "Slider"}
                        className="h-16 w-28 object-cover rounded"
                      />
                    </TableCell>
                    <TableCell>{image.title || "-"}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {image.description ? (
                        <div className="max-w-xs truncate">{image.description}</div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={image.is_active}
                        onCheckedChange={() => toggleActive(image.id, image.is_active)}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(image.id, image.image_url)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
