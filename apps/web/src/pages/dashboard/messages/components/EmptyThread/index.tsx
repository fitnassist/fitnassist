import { MessageCircle } from 'lucide-react';

export const EmptyThread = () => (
  <div className="flex-1 flex items-center justify-center">
    <div className="text-center text-muted-foreground">
      <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
      <p>Select a conversation to start messaging</p>
    </div>
  </div>
);
