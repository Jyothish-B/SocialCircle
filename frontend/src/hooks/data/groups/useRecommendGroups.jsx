import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

const getRecommendGroups = async (userId) => {
  const { data } = await api.get("/groups/suggested", {
    params: { user_id: userId },
  });
  return data;
};

export const useRecommendGroups = (userId) => {
  return useQuery({
    queryKey: ["recommendGroups", userId],
    queryFn: () => getRecommendGroups(userId),
    enabled: !!userId,
  });
};
