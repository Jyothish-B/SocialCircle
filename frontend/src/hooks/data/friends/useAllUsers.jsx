import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

const getAllUsers = async (currentUserId) => {
  const { data } = await api.get(
    `/friends/users?current_user_id=${currentUserId}`
  );
  return data;
};

export const useAllUsers = (currentUserId) => {
  return useQuery({
    queryKey: ["users", currentUserId],
    queryFn: () => getAllUsers(currentUserId),
    enabled: !!currentUserId,
  });
};
