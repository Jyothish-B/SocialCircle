export const LoadingState = () => (
  <p className="text-lg text-center">Loading groups...</p>
);

export const ErrorState = ({ error }) => (
  <p className="text-lg text-center text-destructive">Error: {error.message}</p>
);

export const EmptyState = () => (
  <p className="text-lg text-center">
    You&apos;re not a member of any groups yet. Join or create a group to get
    started!
  </p>
);
