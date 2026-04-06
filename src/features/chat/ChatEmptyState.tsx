import { MessageSquareDashed } from "lucide-react";

type ChatEmptyStateProps = {
  title: string;
  description: string;
};

function ChatEmptyState({ title, description }: ChatEmptyStateProps) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-lg border border-dashed px-6 py-10 text-center">
      <MessageSquareDashed className="mb-4 h-10 w-10 text-muted-foreground" />
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="max-w-xl text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export { ChatEmptyState };
