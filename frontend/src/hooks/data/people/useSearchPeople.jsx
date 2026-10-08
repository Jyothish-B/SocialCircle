import { keepPreviousData, useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export const useSearchPeople = (viewerId, q, limit = 24) =>
  useQuery({
    queryKey: ["people", viewerId, q, limit],
    queryFn: async () =>
      (await api.get("/people/search", { params: { viewer_id: viewerId, q, limit } })).data,
    enabled: !!viewerId,
    placeholderData: keepPreviousData,
  });
