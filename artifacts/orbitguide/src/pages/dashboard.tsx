import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  useListRepositories, 
  useAnalyzeRepository,
  useReanalyzeRepository,
  getListRepositoriesQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  GitBranch, 
  Star, 
  Clock, 
  AlertCircle,
  Loader2,
  CheckCircle2,
  FolderGit2,
  Search,
  Plus,
  RefreshCw,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const { data: repositories, isLoading } = useListRepositories();
  
  const filteredRepos = repositories?.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) || 
    r.namespace.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <Link href="/" className="font-semibold text-lg font-mono tracking-tight">OrbitGuide</Link>
          </div>
          <AddRepositoryDialog />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Repositories</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage and analyze your GitLab codebases.</p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search repositories..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : filteredRepos?.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl p-12 text-center bg-card/30 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
              <FolderGit2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-medium mb-2">No repositories found</h3>
            <p className="text-muted-foreground text-sm max-w-sm mb-6">
              {search ? "No repositories match your search query." : "You haven't added any repositories yet. Add your first GitLab repository to start analyzing."}
            </p>
            {!search && <AddRepositoryDialog />}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRepos?.map(repo => (
              <RepositoryCard key={repo.id} repo={repo} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function RepositoryCard({ repo }: { repo: any }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const reanalyzeMutation = useReanalyzeRepository();

  const handleRetry = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    reanalyzeMutation.mutate({ id: repo.id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRepositoriesQueryKey() });
        toast({ title: "Re-analysis started", description: "Analysis is running in the background." });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to start re-analysis.", variant: "destructive" });
      },
    });
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
    <Link href={`/repositories/${repo.id}`} className="block group">
      <div className="border border-border bg-card rounded-xl p-5 hover:border-primary/50 transition-colors h-full flex flex-col relative overflow-hidden">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
            {repo.namespace}
          </div>
          {getStatusBadge(repo.status)}
        </div>

        <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">{repo.name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 flex-grow mb-4">
          {repo.description || "No description provided."}
        </p>

        {repo.status === 'error' && (
          <div className="mb-4 rounded-lg bg-red-500/8 border border-red-500/20 p-3 space-y-2">
            <p className="text-xs text-red-400 leading-relaxed">
              {repo.errorMessage || "Analysis failed. Try again."}
            </p>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
              onClick={handleRetry}
              disabled={reanalyzeMutation.isPending}
            >
              {reanalyzeMutation.isPending
                ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                : <RefreshCw className="w-3 h-3 mr-1.5" />}
              Retry Analysis
            </Button>
          </div>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-auto pt-4 border-t border-border/50">
          {repo.language && (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary" />
              {repo.language}
            </div>
          )}
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5" />
            {repo.starCount}
          </div>
          <div className="flex items-center gap-1">
            <GitBranch className="w-3.5 h-3.5" />
            {repo.forksCount}
          </div>
        </div>
      </div>
    </Link>
  );
}

function AddRepositoryDialog() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const analyzeMutation = useAnalyzeRepository();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    analyzeMutation.mutate({ data: { url } }, {
      onSuccess: () => {
        toast({
          title: "Repository Added",
          description: "Analysis has started. This may take a few minutes.",
        });
        queryClient.invalidateQueries({ queryKey: getListRepositoriesQueryKey() });
        setOpen(false);
        setUrl("");
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to add repository. Please check the URL and try again.",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Repository
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add GitLab Repository</DialogTitle>
          <DialogDescription>
            Enter the URL of a public GitLab repository to start analysis.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="url" className="text-sm font-medium">Repository URL</label>
              <Input
                id="url"
                placeholder="https://gitlab.com/group/project"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={analyzeMutation.isPending || !url.trim()} className="w-full">
                {analyzeMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {analyzeMutation.isPending ? "Starting Analysis..." : "Analyze Repository"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
