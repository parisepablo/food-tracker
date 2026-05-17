"use client";

interface GoalProgressBarProps {
  label: string;
  value: number;
  total: number;
  caloriesPerGram: number;
  goal?: number;
  color: string;
}

export function GoalProgressBar({
  label,
  value,
  total,
  caloriesPerGram,
  goal,
  color,
}: GoalProgressBarProps) {
  const caloriesFromMacro = value * caloriesPerGram;
  const percentage = total > 0 ? (caloriesFromMacro / total) * 100 : 0;
  const hasGoal = goal !== undefined && goal !== null;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <div className="flex items-center gap-2">
          <span className="font-medium">{Math.round(value * 10) / 10}g</span>
          <span className="text-xs text-muted-foreground">
            ({Math.round(percentage)}%)
          </span>
          {hasGoal && (
            <span className="text-xs text-muted-foreground">
              / {goal}g
            </span>
          )}
        </div>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full ${color} transition-all`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      {hasGoal && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {Math.round(value)} / {goal}g objetivo
          </span>
          {value >= (goal || 0) && (
            <span className="text-green-600">✓ Completado</span>
          )}
        </div>
      )}
    </div>
  );
}
