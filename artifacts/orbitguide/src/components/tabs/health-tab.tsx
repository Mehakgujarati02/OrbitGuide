import { useGetHealthScore } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { getGetHealthScoreQueryKey } from "@workspace/api-client-react";
import {
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Shield,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Info,
  TrendingUp,
} from "lucide-react";

interface Props {
  repositoryId: number;
}

function scoreColor(score: number) {
  if (score >= 75) return "text-green-400";
  if (score >= 50) return "text-yellow-400";
  if (score >= 30) return "text-orange-400";
  return "text-red-400";
}

function scoreBg(score: number) {
  if (score >= 75) return "bg-green-500/10 border-green-500/20";
  if (score >= 50) return "bg-yellow-500/10 border-yellow-500/20";
  if (score >= 30) return "bg-orange-500/10 border-orange-500/20";
  return "bg-red-500/10 border-red-500/20";
}

function scoreBarColor(score: number) {
  if (score >= 75) return "bg-green-500";
  if (score >= 50) return "bg-yellow-500";
  if (score >= 30) return "bg-orange-500";
  return "bg-red-500";
}

function RiskBadge({ level }: { level: string }) {
  const map: Record<string, { label: string; variant: string; icon: React.ReactNode }> = {
    low:      { label: "Low Risk",      variant: "bg-green-500/15 text-green-400 border-green-500/30",   icon: <ShieldCheck className="w-3 h-3" /> },
    medium:   { label: "Medium Risk",   variant: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", icon: <Shield className="w-3 h-3" /> },
    high:     { label: "High Risk",     variant: "bg-orange-500/15 text-orange-400 border-orange-500/30", icon: <ShieldAlert className="w-3 h-3" /> },
    critical: { label: "Critical Risk", variant: "bg-red-500/15 text-red-400 border-red-500/30",         icon: <ShieldOff className="w-3 h-3" /> },
  };
  const entry = map[level] ?? map.medium;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${entry.variant}`}>
      {entry.icon}
      {entry.label}
    </span>
  );
}

function ScoreRing({ score }: { score: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 75 ? "#22c55e" : score >= 50 ? "#eab308" : score >= 30 ? "#f97316" : "#ef4444";

  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="144" height="144" viewBox="0 0 144 144">
        <circle cx="72" cy="72" r={radius} fill="none" stroke="currentColor" strokeWidth="10" className="text-muted/30" />
        <circle
          cx="72" cy="72" r={radius} fill="none"
          stroke={color} strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="text-center">
        <span className={`text-3xl font-bold tabular-nums ${scoreColor(score)}`}>{score}</span>
        <span className="block text-xs text-muted-foreground">/100</span>
      </div>
    </div>
  );
}

export function HealthTab({ repositoryId }: Props) {
  const queryClient = useQueryClient();
  const { data, isLoading, isFetching } = useGetHealthScore(repositoryId, undefined, {
    query: { enabled: !!repositoryId, queryKey: getGetHealthScoreQueryKey(repositoryId) },
  });

  const handleRefresh = () => {
    queryClient.removeQueries({ queryKey: getGetHealthScoreQueryKey(repositoryId) });
    queryClient.invalidateQueries({ queryKey: getGetHealthScoreQueryKey(repositoryId) });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-44 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
        <ShieldAlert className="w-10 h-10" />
        <p className="text-sm">Health score not available. Repository may still be analyzing.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-8">
      {/* Header card */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <ScoreRing score={data.overallScore} />
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-semibold">Overall Health Score</h2>
                <RiskBadge level={data.riskLevel} />
              </div>
              <p className="text-sm text-muted-foreground">
                AI-assessed across {data.categories.length} dimensions: code organization, test coverage,
                documentation, technical debt, and CI/CD maturity.
              </p>
              <p className="text-xs text-muted-foreground/60">
                Generated {new Date(data.generatedAt).toLocaleString()}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={handleRefresh}
              disabled={isFetching}
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Category breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.categories.map((cat) => (
          <Card key={cat.name} className={`border ${scoreBg(cat.score)}`}>
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{cat.name}</CardTitle>
                <span className={`text-lg font-bold tabular-nums ${scoreColor(cat.score)}`}>
                  {cat.score}
                </span>
              </div>
              {/* Score bar */}
              <div className="h-1.5 bg-muted/40 rounded-full mt-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${scoreBarColor(cat.score)}`}
                  style={{ width: `${cat.score}%`, transition: "width 1s ease" }}
                />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <ul className="space-y-1.5">
                {cat.signals.map((signal, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Info className="w-3 h-3 mt-0.5 shrink-0 text-muted-foreground/60" />
                    {signal}
                  </li>
                ))}
              </ul>
              <div className="pt-1 border-t border-border/40">
                <p className="text-xs text-foreground/70">
                  <AlertTriangle className="w-3 h-3 inline mr-1 text-yellow-400/80" />
                  {cat.recommendation}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Insights */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.insights.map((insight, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground py-1 border-b border-border/30 last:border-0">
                <span className="text-xs text-primary/60 font-mono mt-0.5 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                {insight}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              Action Items
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-2 text-sm py-1 border-b border-border/30 last:border-0">
                <Badge
                  variant="outline"
                  className="text-xs px-1.5 py-0 shrink-0 font-mono border-primary/30 text-primary"
                >
                  P{i + 1}
                </Badge>
                <span className="text-muted-foreground">{rec}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
