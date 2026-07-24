-- Batched unread-message counts.
--
-- Previously the client fetched unread counts N+1 style: one
-- `get_unread_count_for_conversation` RPC per conversation (see ConversationList
-- and useUnreadMessagesCount). This single RPC returns the unread count for
-- every conversation the current user participates in, in one round trip.
--
-- Semantics match `get_unread_count_for_conversation`: a message is "unread"
-- when it was sent by someone other than the current user and has no
-- `message_status` row with a non-null `read_at` for this user. The LEFT JOIN
-- ensures conversations with zero unread messages are still returned (count 0),
-- so callers can rely on a row existing for each of the user's conversations.

CREATE FUNCTION public.get_unread_counts_for_user()
RETURNS TABLE (
  conversation_id uuid,
  unread_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    pa.conversation_id,
    COUNT(m.id) AS unread_count
  FROM public.participants pa
  LEFT JOIN public.messages m
    ON m.conversation_id = pa.conversation_id
    AND m.sender_id <> auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM public.message_status ms
      WHERE ms.message_id = m.id
        AND ms.user_id = auth.uid()
        AND ms.read_at IS NOT NULL
    )
  WHERE pa.user_id = auth.uid()
  GROUP BY pa.conversation_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_unread_counts_for_user() TO authenticated;
