interface LoadingBarProps {
  isLoading: boolean;
}

export function LoadingBar({ isLoading }: LoadingBarProps) {
  if (!isLoading) return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-0.5 overflow-hidden bg-border">
      <div className="loading-bar h-full w-1/4 bg-primary rounded-full" />
    </div>
  );
}
