import { keepPreviousData, useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export const useEgoGraph = (viewerId, centerId, depth) =>
  useQuery({
    queryKey: ["egoGraph", viewerId, centerId, depth],
    queryFn: async () =>
      (
        await api.get("/graph/ego", {
          params: { viewer_id: viewerId, center_id: centerId ?? viewerId, depth },
        })
      ).data,
    enabled: !!viewerId,
    placeholderData: keepPreviousData,
  });
