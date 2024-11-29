import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

const addFriend = async ({ userId, friendId }) => {
  const { data } = await api.post("/friends/add", {
    user_id: userId,
    friend_id: friendId,
  });
  return data;
};

export const useAddFriend = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addFriend,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(["users", variables.userId]);
      queryClient.invalidateQueries(["friends", variables.userId]);
    },
  });
};
