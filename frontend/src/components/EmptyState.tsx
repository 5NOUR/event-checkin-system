interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({
  title,
  description,
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">{icon || "📭"}</div>
      <h3 className="text-xl font-bold text-[#171717] mb-2">{title}</h3>
      {description && <p className="text-[#6B6B68] mb-6">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 bg-[#171717] text-white rounded-md hover:bg-[#2a2a2a] transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
