import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, title, description, action, testId }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center" data-testid={testId}>
      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-muted-foreground" strokeWidth={1.8} />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
      {description && <p className="text-sm text-muted-foreground max-w-md mb-5">{description}</p>}
      {action}
    </div>
  );
}
