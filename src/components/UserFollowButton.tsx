import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface UserFollowButtonProps {
  userId: string;
  currentUserId: string | undefined;
  onFollowChange?: () => void;
}

export const UserFollowButton = ({ userId, currentUserId, onFollowChange }: UserFollowButtonProps) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (currentUserId && currentUserId !== userId) {
      checkFollowStatus();
    } else {
      setChecking(false);
    }
  }, [currentUserId, userId]);

  const checkFollowStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('user_follows' as any)
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', userId)
        .maybeSingle();

      if (error) throw error;
      setIsFollowing(!!data);
    } catch (error) {
      console.error('Error checking follow status:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUserId) {
      toast.error('Please login to follow users');
      return;
    }

    setLoading(true);
    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('user_follows' as any)
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', userId);

        if (error) throw error;
        setIsFollowing(false);
        toast.success('Unfollowed successfully');
      } else {
        const { error } = await supabase
          .from('user_follows' as any)
          .insert({
            follower_id: currentUserId,
            following_id: userId,
          });

        if (error) throw error;
        setIsFollowing(true);
        toast.success('Following successfully');
      }
      
      onFollowChange?.();
    } catch (error: any) {
      console.error('Error toggling follow:', error);
      toast.error(error.message || 'Failed to update follow status');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUserId || currentUserId === userId || checking) {
    return null;
  }

  return (
    <Button
      onClick={handleFollow}
      disabled={loading}
      variant={isFollowing ? "outline" : "default"}
      size="sm"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : isFollowing ? (
        <UserMinus className="w-4 h-4 mr-2" />
      ) : (
        <UserPlus className="w-4 h-4 mr-2" />
      )}
      {isFollowing ? 'Unfollow' : 'Follow'}
    </Button>
  );
};
