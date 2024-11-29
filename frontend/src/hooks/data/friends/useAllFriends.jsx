import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

const getAllFriends = async (userId) => {
  const { data } = await api.get(`/friends?user_id=${userId}`);
  return data;
};

export const useAllFriends = (userId) => {
  return useQuery({
    queryKey: ["friends", userId],
    queryFn: () => getAllFriends(userId),
    enabled: !!userId,
  });
};
