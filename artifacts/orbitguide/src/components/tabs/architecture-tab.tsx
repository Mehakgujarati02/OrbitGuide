import { 
  useGetArchitecture, 
  getGetArchitectureQueryKey 
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Box, Network, Layers, GitMerge } from "lucide-react";

export function ArchitectureTab({ repositoryId }: { repositoryId: number }) {
  const { data: arch, isLoading } = useGetArchitecture(repositoryId, {
    query: { enabled: !!repositoryId, queryKey: getGetArchitectureQueryKey(repositoryId) }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-96 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-xl col-span-2" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!arch) {
    return (
      <div className="border border-dashed border-border rounded-xl p-12 text-center bg-card/30">
        <Network className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-medium mb-2">Architecture not available</h3>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          The architecture diagram and components could not be generated for this repository.
        </p>
      </div>
    );
  }

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'controller': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'service': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'repository': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'model': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'middleware': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'config': return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      
      {arch.diagramText && (
        <Card className="border-primary/20 bg-card/50 overflow-hidden shadow-md">
          <CardHeader className="bg-card border-b border-border pb-4">
            <CardTitle className="flex items-center gap-2">
              <Network className="w-5 h-5 text-primary" /> Dependency Graph
            </CardTitle>
            <CardDescription>Visual representation of component relationships</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <pre className="p-6 overflow-x-auto text-sm font-mono text-muted-foreground bg-zinc-950 text-emerald-400">
              <code>{arch.diagramText}</code>
            </pre>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <h3 className="text-xl font-bold tracking-tight flex items-center gap-2 border-b border-border pb-2">
            <Box className="w-5 h-5 text-muted-foreground" /> Core Components
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {arch.components.map((comp) => (
              <Card key={comp.id} className="bg-card hover:border-primary/40 transition-colors">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-semibold text-foreground truncate pr-2" title={comp.name}>{comp.name}</h4>
                    <Badge variant="outline" className={getTypeColor(comp.type) + " capitalize text-[10px]"}>
                      {comp.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3 min-h-[3rem]">
                    {comp.description}
                  </p>
                  <div className="flex items-center justify-between text-xs mt-auto pt-4 border-t border-border/50">
                    <span className="font-mono text-muted-foreground truncate max-w-[150px]" title={comp.filePath}>
                      {comp.filePath.split('/').pop()}
                    </span>
                    <span className="text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      Layer: {comp.layer}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold tracking-tight flex items-center gap-2 border-b border-border pb-2">
            <Layers className="w-5 h-5 text-muted-foreground" /> Architecture Layers
          </h3>
          
          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-0.5 before:bg-border">
            {arch.layers.map((layer, idx) => (
              <div key={idx} className="relative pl-10 group">
                <div className="absolute left-0 w-8 h-8 rounded-full bg-background border-2 border-border flex items-center justify-center group-hover:border-primary transition-colors z-10">
                  <span className="text-xs font-bold text-muted-foreground group-hover:text-primary">{idx + 1}</span>
                </div>
                <Card className="bg-card">
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-base">{layer.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 pt-0 space-y-3">
                    <p className="text-sm text-muted-foreground">{layer.description}</p>
                    {layer.components.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {layer.components.slice(0, 5).map((c, i) => (
                          <span key={i} className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded border border-border/50">
                            {c}
                          </span>
                        ))}
                        {layer.components.length > 5 && (
                          <span className="text-[10px] text-muted-foreground px-1.5 py-0.5">
                            +{layer.components.length - 5} more
                          </span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
