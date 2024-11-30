import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

const getMyGroups = async (userId) => {
  const { data } = await api.get(`/groups/my-groups`, {
    params: { user_id: userId },
  });
  return data;
};

export const useMyGroups = (userId) => {
  return useQuery({
    queryKey: ["myGroups", userId],
    queryFn: () => getMyGroups(userId),
    enabled: !!userId,
  });
};
