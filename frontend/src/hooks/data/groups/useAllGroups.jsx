import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

const getAllGroups = async (userId) => {
  const { data } = await api.get(`/groups/all`, {
    params: { user_id: userId },
  });
  return data;
};

export const useAllGroups = (userId) => {
  return useQuery({
    queryKey: ["groups", userId],
    queryFn: () => getAllGroups(userId),
    enabled: !!userId,
  });
};
