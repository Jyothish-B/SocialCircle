import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

const joinGroup = async ({ userId, groupId }) => {
  const { data } = await api.post("/groups/join", {
    user_id: userId,
    group_id: groupId,
  });
  return data;
};

export const useJoinGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: joinGroup,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(["groups", variables.userId]);
      queryClient.invalidateQueries(["myGroups", variables.userId]);
    },
  });
};
