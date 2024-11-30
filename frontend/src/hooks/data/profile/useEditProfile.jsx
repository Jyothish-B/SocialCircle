import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

const editProfile = async ({ userId, companyId, placeId }) => {
  const { data } = await api.put("/profile", {
    user_id: userId,
    company_id: companyId,
    place_id: placeId,
  });
  return data;
};

export const useEditProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: editProfile,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(["profile", variables.userId]);
    },
  });
};
