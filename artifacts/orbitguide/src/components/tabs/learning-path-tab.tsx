import { useState } from "react";
import { 
  useGetLearningPath, 
  useGenerateLearningPath, 
  getGetLearningPathQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Loader2, Sparkles, Clock, FileCode2, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function LearningPathTab({ repositoryId }: { repositoryId: number }) {
  const [topic, setTopic] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: path, isLoading } = useGetLearningPath(repositoryId, {
    query: { enabled: !!repositoryId, queryKey: getGetLearningPathQueryKey(repositoryId) }
  });

  const generateMutation = useGenerateLearningPath();

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    generateMutation.mutate(
      { id: repositoryId, data: { topic } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetLearningPathQueryKey(repositoryId) });
          setTopic("");
          toast({
            title: "Learning Path Generated",
            description: "Your personalized learning path is ready.",
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to generate learning path. Try another topic.",
            variant: "destructive"
          });
        }
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <Card className="bg-card border-primary/20 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 pointer-events-none opacity-10">
          <BookOpen className="w-32 h-32 text-primary" />
        </div>
        <CardHeader className="relative z-10 pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-5 h-5 text-primary" /> Generate New Path
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <form onSubmit={handleGenerate} className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="e.g. Authentication Flow, Payment Processing, Database Models..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="bg-background"
                disabled={generateMutation.isPending}
              />
            </div>
            <Button type="submit" disabled={!topic.trim() || generateMutation.isPending}>
              {generateMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Generate
            </Button>
          </form>
        </CardContent>
      </Card>

      {!path ? (
        <div className="border border-dashed border-border rounded-xl p-12 text-center bg-card/30">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No active learning path</h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Generate a custom learning path to understand specific features, flows, or architectural concepts step by step.
          </p>
        </div>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-1">{path.topic || "Complete Codebase Tour"}</h2>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" /> {path.totalEstimatedMinutes} mins
                </span>
                <Badge variant="outline" className="uppercase text-[10px] tracking-wider">
                  {path.difficulty}
                </Badge>
              </div>
            </div>
          </div>

          <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
            {path.steps.map((step, index) => (
              <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                
                {/* Timeline dot */}
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-primary text-primary-foreground shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 font-bold font-mono text-sm">
                  {step.stepNumber}
                </div>
                
                {/* Card */}
                <Card className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] bg-card border-border hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start mb-1">
                      <CardTitle className="text-lg leading-tight">{step.title}</CardTitle>
                      <Badge variant="secondary" className="text-xs bg-muted whitespace-nowrap">
                        ~{step.estimatedMinutes}m
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                    
                    {step.files && step.files.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1">
                          <FileCode2 className="w-3 h-3" /> Files to review
                        </div>
                        <div className="flex flex-col gap-1.5">
                          {step.files.map((file, i) => (
                            <div key={i} className="text-xs font-mono bg-muted text-muted-foreground px-2 py-1 rounded border border-border/50 break-all">
                              {file}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {step.concepts && step.concepts.length > 0 && (
                      <div className="pt-2 border-t border-border/50 flex flex-wrap gap-1.5">
                        {step.concepts.map((concept, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                            {concept}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
