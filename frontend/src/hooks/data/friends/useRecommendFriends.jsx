import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

const getRecommendFriends = async (userId) => {
  const { data } = await api.get("/friends/suggested", {
    params: { user_id: userId },
  });
  return data;
};

export const useRecommendFriends = (userId) => {
  return useQuery({
    queryKey: ["recommendFriends", userId],
    queryFn: () => getRecommendFriends(userId),
    enabled: !!userId,
  });
};
