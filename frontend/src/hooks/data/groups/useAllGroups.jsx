import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

const getAllGroups = async () => {
  const { data } = await api.get(`/groups/all`);
  return data;
};

export const useAllGroups = () => {
  return useQuery({
    queryKey: ["groups"],
    queryFn: getAllGroups,
  });
};
