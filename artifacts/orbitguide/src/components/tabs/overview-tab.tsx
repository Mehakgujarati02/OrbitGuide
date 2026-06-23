import { 
  useGetRepositorySummary, 
  useGetRepositoryStats, 
  getGetRepositorySummaryQueryKey, 
  getGetRepositoryStatsQueryKey 
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers, FileCode, Users, Clock, Code2, AlertCircle } from "lucide-react";

export function OverviewTab({ repositoryId }: { repositoryId: number }) {
  const { data: summary, isLoading: isLoadingSummary } = useGetRepositorySummary(repositoryId, {
    query: { enabled: !!repositoryId, queryKey: getGetRepositorySummaryQueryKey(repositoryId) }
  });
  
  const { data: stats, isLoading: isLoadingStats } = useGetRepositoryStats(repositoryId, {
    query: { enabled: !!repositoryId, queryKey: getGetRepositoryStatsQueryKey(repositoryId) }
  });

  if (isLoadingSummary || isLoadingStats) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-8">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Files</p>
              <p className="text-2xl font-bold">{stats?.totalFiles?.toLocaleString() || 0}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Lines</p>
              <p className="text-2xl font-bold">{stats?.totalLines?.toLocaleString() || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Contributors</p>
              <p className="text-2xl font-bold">{stats?.contributors || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Commit</p>
              <p className="text-sm font-medium mt-1">
                {stats?.lastCommit ? new Date(stats.lastCommit).toLocaleDateString() : "Unknown"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {summary ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Architecture Overview</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap">
                  {summary.overview}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Main Modules</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {summary.mainModules?.map((module, i) => (
                      <div key={i} className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 border border-border/50">
                        <div className="mt-1">
                          <Code2 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-foreground">{module.name}</h4>
                            <Badge variant={module.importance === 'high' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">
                              {module.importance}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{module.description}</p>
                          <p className="text-xs font-mono text-muted-foreground bg-background px-2 py-1 rounded inline-block border border-border/50">
                            {module.path}
                          </p>
                        </div>
                      </div>
                    ))}
                    {(!summary.mainModules || summary.mainModules.length === 0) && (
                      <div className="text-center p-8 text-muted-foreground">No modules found</div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Key Services</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {summary.keyServices?.map((service, i) => (
                      <div key={i} className="p-4 rounded-lg border border-border bg-card">
                        <h4 className="font-medium text-foreground mb-2">{service.name}</h4>
                        <p className="text-sm text-muted-foreground mb-3">{service.description}</p>
                        {service.dependencies && service.dependencies.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {service.dependencies.map((dep, j) => (
                              <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                                {dep}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {(!summary.keyServices || summary.keyServices.length === 0) && (
                      <div className="text-center p-8 text-muted-foreground md:col-span-2">No key services found</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
             <div className="border border-dashed border-border rounded-xl p-12 text-center bg-card/30">
               <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
               <h3 className="text-lg font-medium mb-1">No summary available</h3>
               <p className="text-muted-foreground text-sm">The repository analysis might still be processing or failed.</p>
             </div>
          )}
        </div>

        <div className="space-y-6">
          {summary?.techStack && summary.techStack.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tech Stack</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {summary.techStack.map((tech, i) => (
                    <Badge key={i} variant="secondary" className="px-2.5 py-1 text-xs">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {stats?.languages && stats.languages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Languages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.languages.map((lang, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{lang.language}</span>
                        <span className="text-muted-foreground">{lang.percentage}%</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full" 
                          style={{ width: `${lang.percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-right">{lang.fileCount} files</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
