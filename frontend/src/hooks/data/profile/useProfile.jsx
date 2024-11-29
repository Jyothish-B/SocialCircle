import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

const getProfile = async (userId) => {
  const { data } = await api.get(`/profile?user_id=${userId}`);
  return data;
};

export const useProfile = (userId) => {
  return useQuery({
    queryKey: ["profile", userId],
    queryFn: () => getProfile(userId),
    enabled: !!userId,
  });
};
