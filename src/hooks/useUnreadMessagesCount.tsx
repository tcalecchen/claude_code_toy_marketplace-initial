import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useUnreadMessagesCount = () => {
  const { user, loading: authLoading } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Single batched RPC returns per-conversation unread counts; sum them.
      const { data, error } = await supabase.rpc('get_unread_counts_for_user');

      if (error) throw error;

      const totalUnread = (data || []).reduce(
        (sum, row) => sum + (row.unread_count || 0),
        0
      );

      setUnreadCount(totalUnread);
    } catch (error) {
      console.error('Error fetching unread messages count:', error);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      fetchUnreadCount();
    }
  }, [authLoading, fetchUnreadCount]);

  return { 
    unreadCount, 
    loading: loading || authLoading, 
    refetch: fetchUnreadCount 
  };
};