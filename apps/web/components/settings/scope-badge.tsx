import { Badge } from "@workspace/ui/components/badge"

interface ScopeBadgeProps {
  scope: string
}

export function ScopeBadge({ scope }: ScopeBadgeProps) {
  // Determine variant based on scope type
  const getVariant = (scope: string) => {
    if (scope.endsWith(":read")) {
      return "secondary"
    }
    if (scope.endsWith(":write")) {
      return "default"
    }
    return "outline"
  }

  // Format scope for display
  const formatScope = (scope: string) => {
    return scope.replace(":", ": ")
  }

  return (
    <Badge variant={getVariant(scope)} className="text-xs">
      {formatScope(scope)}
    </Badge>
  )
}
