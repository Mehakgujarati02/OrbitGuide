import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { FolderGit2, Cpu, MessageSquareCode, BookOpen, Share2, ArrowRight, Code2 } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background selection:bg-primary/30">
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg font-mono tracking-tight">OrbitGuide</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <Link href="/dashboard">
              <Button size="sm" className="font-mono">Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl -z-10" />
          
          <div className="container mx-auto px-4 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary text-xs font-mono mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              v1.0 Now Available for GitLab
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 max-w-4xl mx-auto leading-tight">
              Master complex codebases <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">in hours, not months.</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              OrbitGuide is your AI-powered tech lead. It analyzes your GitLab repositories, explains architecture, builds custom learning paths, and answers questions with surgical precision.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/dashboard">
                <Button size="lg" className="h-12 px-8 text-base font-medium gap-2">
                  Launch OrbitGuide <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="h-12 px-8 text-base font-medium font-mono">
                npm i -g @orbitguide/cli
              </Button>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24 bg-card/30 border-y border-border/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight mb-4">Deep Codebase Intelligence</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Stop grepping through thousands of files. OrbitGuide understands the intent, architecture, and dependencies of your entire system.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <FeatureCard 
                icon={<Cpu className="w-6 h-6 text-blue-400" />}
                title="Architecture Explorer"
                description="Visualizes dependencies, layers, and service boundaries automatically."
              />
              <FeatureCard 
                icon={<MessageSquareCode className="w-6 h-6 text-green-400" />}
                title="Context-Aware AI Chat"
                description="Ask complex questions about business logic and implementation details."
              />
              <FeatureCard 
                icon={<BookOpen className="w-6 h-6 text-purple-400" />}
                title="Custom Learning Paths"
                description="Generates step-by-step guides for any topic to onboard engineers faster."
              />
              <FeatureCard 
                icon={<Code2 className="w-6 h-6 text-orange-400" />}
                title="GitLab Native"
                description="Seamlessly analyzes public and private GitLab repositories with OAuth."
              />
            </div>
          </div>
        </section>

      </main>

      <footer className="py-12 border-t border-border bg-card/50">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-primary" />
            <span className="font-semibold font-mono">OrbitGuide</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} OrbitGuide. Built for engineers.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-6 rounded-2xl border border-border bg-card hover:border-primary/50 transition-colors">
      <div className="w-12 h-12 rounded-lg bg-background border border-border flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
