import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

const removeFriend = async ({ userId, friendId }) => {
  const { data } = await api.post("/friends/remove", {
    user_id: userId,
    friend_id: friendId,
  });
  return data;
};

export const useRemoveFriend = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeFriend,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(["users", variables.userId]);
      queryClient.invalidateQueries(["friends", variables.userId]);
    },
  });
};
