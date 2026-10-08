import { Button } from "@/components/ui/button";
import { Check, Clock, Loader2, UserPlus, X } from "lucide-react";
import useAuth from "@/hooks/auth/use-auth";
import {
  useAcceptRequest,
  useCancelRequest,
  useDeclineRequest,
  useSendRequest,
} from "@/hooks/data/friends/useFriendRequests";

// One control for every state between the viewer and another person:
// none -> Add friend, requested -> Requested (click to cancel),
// incoming -> Accept / Decline, friends -> Friends
export default function RelationshipButton({ person, size = "sm", className, onStatusChange }) {
  const { user } = useAuth();
  const send = useSendRequest();
  const accept = useAcceptRequest();
  const decline = useDeclineRequest();
  const cancel = useCancelRequest();
  const busy = send.isPending || accept.isPending || decline.isPending || cancel.isPending;

  const run = (mutation) => async (event) => {
    event.preventDefault();
    event.stopPropagation();
    const result = await mutation.mutateAsync({ userId: user.id, personId: person.id });
    onStatusChange?.(result.status);
  };

  const spinner = <Loader2 className="h-4 w-4 animate-spin" />;

  switch (person.status) {
    case "self":
      return null;
    case "friends":
      return (
        <Button size={size} variant="secondary" className={className} disabled>
          <Check className="h-4 w-4 mr-1" /> Friends
        </Button>
      );
    case "requested":
      return (
        <Button
          size={size}
          variant="outline"
          className={`group ${className ?? ""}`}
          onClick={run(cancel)}
          disabled={busy}
          title="Cancel request"
        >
          {busy ? spinner : <Clock className="h-4 w-4 mr-1 group-hover:hidden" />}
          {!busy && <X className="h-4 w-4 mr-1 hidden group-hover:block" />}
          <span className="group-hover:hidden">Requested</span>
          <span className="hidden group-hover:inline">Cancel</span>
        </Button>
      );
    case "incoming":
      return (
        <div className={`flex gap-2 ${className ?? ""}`}>
          <Button size={size} className="flex-1" onClick={run(accept)} disabled={busy}>
            {busy ? spinner : <Check className="h-4 w-4 mr-1" />} Accept
          </Button>
          <Button size={size} variant="outline" onClick={run(decline)} disabled={busy} aria-label="Decline request">
            <X className="h-4 w-4" />
          </Button>
        </div>
      );
    default:
      return (
        <Button size={size} className={className} onClick={run(send)} disabled={busy}>
          {busy ? spinner : <UserPlus className="h-4 w-4 mr-1" />} Add friend
        </Button>
      );
  }
}
