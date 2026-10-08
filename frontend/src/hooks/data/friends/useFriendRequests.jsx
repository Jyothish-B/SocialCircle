import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export const useFriendRequests = (userId) =>
  useQuery({
    queryKey: ["requests", userId],
    queryFn: async () => (await api.get("/friends/requests", { params: { user_id: userId } })).data,
    enabled: !!userId,
    refetchInterval: 15000,
  });

// Every request action changes who is a friend, who is pending, and what
// search results and profiles should show, so they share one invalidation
const useRequestAction = (path, toBody, { refreshSuggestions = true } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars) => (await api.post(path, toBody(vars))).data,
    onSuccess: () => {
      for (const key of ["requests", "friends", "people", "person"]) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
      if (refreshSuggestions) queryClient.invalidateQueries({ queryKey: ["recommendFriends"] });
    },
  });
};

// Sending keeps the suggestion list as it is, so the card can show "Requested"
export const useSendRequest = () =>
  useRequestAction("/friends/request", ({ userId, personId }) => ({ user_id: userId, friend_id: personId }), {
    refreshSuggestions: false,
  });

export const useAcceptRequest = () =>
  useRequestAction("/friends/requests/accept", ({ userId, personId }) => ({ user_id: userId, requester_id: personId }));

export const useDeclineRequest = () =>
  useRequestAction("/friends/requests/decline", ({ userId, personId }) => ({ user_id: userId, requester_id: personId }));

export const useCancelRequest = () =>
  useRequestAction("/friends/requests/cancel", ({ userId, personId }) => ({ user_id: userId, target_id: personId }));
