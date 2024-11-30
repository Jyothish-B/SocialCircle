import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

const quitGroup = async ({ userId, groupId }) => {
  const { data } = await api.delete("/groups/quit", {
    data: {
      user_id: userId,
      group_id: groupId,
    },
  });
  return data;
};

export const useQuitGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: quitGroup,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(["groups", variables.userId]);
    },
  });
};
