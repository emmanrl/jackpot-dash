import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useFavoriteJackpots = (userId: string | undefined) => {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    fetchFavorites();
  }, [userId]);

  const fetchFavorites = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from("favorite_jackpots")
        .select("jackpot_id")
        .eq("user_id", userId);

      if (error) throw error;

      const ids = new Set(data?.map((f) => f.jackpot_id) || []);
      setFavoriteIds(ids);
    } catch (error) {
      console.error("Error fetching favorites:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (jackpotId: string) => {
    if (!userId) {
      toast.error("Please log in to bookmark jackpots");
      return;
    }

    const isFavorite = favoriteIds.has(jackpotId);

    try {
      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from("favorite_jackpots")
          .delete()
          .eq("user_id", userId)
          .eq("jackpot_id", jackpotId);

        if (error) throw error;

        setFavoriteIds((prev) => {
          const next = new Set(prev);
          next.delete(jackpotId);
          return next;
        });

        toast.success("Removed from favorites");
      } else {
        // Add to favorites
        const { error } = await supabase
          .from("favorite_jackpots")
          .insert({ user_id: userId, jackpot_id: jackpotId });

        if (error) throw error;

        setFavoriteIds((prev) => new Set(prev).add(jackpotId));
        toast.success("Added to favorites! You'll be notified before the draw.");
      }
    } catch (error: any) {
      console.error("Error toggling favorite:", error);
      toast.error(error.message || "Failed to update favorites");
    }
  };

  const isFavorite = (jackpotId: string) => favoriteIds.has(jackpotId);

  return { favoriteIds, isFavorite, toggleFavorite, loading };
};
