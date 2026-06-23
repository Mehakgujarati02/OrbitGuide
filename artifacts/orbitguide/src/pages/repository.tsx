import { useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { 
  useGetRepository, 
  getGetRepositoryQueryKey,
  useDeleteRepository,
  getListRepositoriesQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { FolderGit2, ArrowLeft, Loader2, GitBranch, Star, Clock, AlertCircle, CheckCircle2, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

import { OverviewTab } from "@/components/tabs/overview-tab";
import { ChatTab } from "@/components/tabs/chat-tab";
import { LearningPathTab } from "@/components/tabs/learning-path-tab";
import { ArchitectureTab } from "@/components/tabs/architecture-tab";
import { HealthTab } from "@/components/tabs/health-tab";

export default function RepositoryDetail() {
  const [match, params] = useRoute("/repositories/:id");
  const [, setLocation] = useLocation();
  const id = params?.id ? parseInt(params.id, 10) : 0;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: repo, isLoading } = useGetRepository(id, { 
    query: { enabled: !!id, queryKey: getGetRepositoryQueryKey(id) } 
  });

  const deleteMutation = useDeleteRepository();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border bg-card/50 h-16 flex items-center px-4 animate-pulse">
          <div className="w-8 h-8 bg-muted rounded mr-4"></div>
          <div className="h-6 w-48 bg-muted rounded"></div>
        </header>
        <div className="flex-1 p-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!repo) {
    return <div className="p-8 text-center text-muted-foreground">Repository not found</div>;
  }

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this repository analysis?")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListRepositoriesQueryKey() });
          toast({
            title: "Repository Deleted",
            description: "The repository has been removed.",
          });
          setLocation("/dashboard");
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to delete repository.",
            variant: "destructive"
          });
        }
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20"><CheckCircle2 className="w-3 h-3 mr-1" /> Ready</Badge>;
      case 'analyzing':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 animate-pulse"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Analyzing</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'error':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20"><AlertCircle className="w-3 h-3 mr-1" /> Error</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-primary/30">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground p-2 -ml-2 rounded-md hover:bg-muted transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3 border-l border-border pl-4">
              <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                <FolderGit2 className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="font-semibold text-lg leading-none">{repo.name}</h1>
                  {getStatusBadge(repo.status)}
                </div>
                <p className="text-xs text-muted-foreground font-mono mt-1">{repo.namespace}</p>
              </div>
            </div>
          </div>
          <div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 flex flex-col h-[calc(100vh-64px)]">
        <Tabs defaultValue="overview" className="flex-1 flex flex-col">
          <TabsList className="w-full justify-start border-b border-border rounded-none h-auto p-0 bg-transparent mb-6">
            <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3 data-[state=active]:text-foreground text-muted-foreground font-medium">
              Overview
            </TabsTrigger>
            <TabsTrigger value="chat" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3 data-[state=active]:text-foreground text-muted-foreground font-medium">
              AI Chat
            </TabsTrigger>
            <TabsTrigger value="learning" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3 data-[state=active]:text-foreground text-muted-foreground font-medium">
              Learning Path
            </TabsTrigger>
            <TabsTrigger value="architecture" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3 data-[state=active]:text-foreground text-muted-foreground font-medium">
              Architecture
            </TabsTrigger>
            <TabsTrigger value="health" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3 data-[state=active]:text-foreground text-muted-foreground font-medium">
              Health Score
            </TabsTrigger>
          </TabsList>
          
          <div className="flex-1 relative overflow-hidden">
            <TabsContent value="overview" className="h-full m-0 data-[state=inactive]:hidden overflow-y-auto pr-2">
              <OverviewTab repositoryId={repo.id} />
            </TabsContent>
            
            <TabsContent value="chat" className="h-full m-0 data-[state=inactive]:hidden flex flex-col">
              <ChatTab repositoryId={repo.id} />
            </TabsContent>
            
            <TabsContent value="learning" className="h-full m-0 data-[state=inactive]:hidden overflow-y-auto pr-2">
              <LearningPathTab repositoryId={repo.id} />
            </TabsContent>
            
            <TabsContent value="architecture" className="h-full m-0 data-[state=inactive]:hidden overflow-y-auto pr-2">
              <ArchitectureTab repositoryId={repo.id} />
            </TabsContent>

            <TabsContent value="health" className="h-full m-0 data-[state=inactive]:hidden overflow-y-auto pr-2">
              <HealthTab repositoryId={repo.id} />
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
}
