import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export const usePerson = (personId, viewerId) =>
  useQuery({
    queryKey: ["person", personId, viewerId],
    queryFn: async () => (await api.get(`/people/${personId}`, { params: { viewer_id: viewerId } })).data,
    enabled: personId != null && !!viewerId,
  });
