import { useState, useRef, useEffect } from "react";
import { 
  useListChatMessages, 
  getListChatMessagesQueryKey, 
  useClearChatHistory 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Trash2, Loader2 } from "lucide-react";

export function ChatTab({ repositoryId }: { repositoryId: number }) {
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  
  const { data: history, isLoading } = useListChatMessages(repositoryId, {
    query: { enabled: !!repositoryId, queryKey: getListChatMessagesQueryKey(repositoryId) }
  });

  const clearMutation = useClearChatHistory();

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [history, streamingContent]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    
    const message = input;
    setInput("");
    setIsStreaming(true);
    setStreamingContent("");
    
    // Optimistic user message (UI only, real one comes from API next refetch)
    const optimisticUserMsg = {
      id: Date.now(),
      repositoryId,
      role: 'user' as const,
      content: message,
      createdAt: new Date().toISOString()
    };
    
    queryClient.setQueryData(getListChatMessagesQueryKey(repositoryId), (old: any) => {
      return [...(old || []), optimisticUserMsg];
    });

    try {
      const response = await fetch(`/api/repositories/${repositoryId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message })
      });

      if (!response.ok) throw new Error("Network response was not ok");
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const text = decoder.decode(value);
        const lines = text.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                setStreamingContent(prev => prev + data.content);
              }
              if (data.done) {
                break;
              }
            } catch (err) {
              console.error("Error parsing SSE data", err);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error in chat streaming", error);
      setStreamingContent("Error: Failed to get response.");
    } finally {
      setIsStreaming(false);
      queryClient.invalidateQueries({ queryKey: getListChatMessagesQueryKey(repositoryId) });
      setStreamingContent("");
    }
  };

  const handleClear = () => {
    clearMutation.mutate({ id: repositoryId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListChatMessagesQueryKey(repositoryId) });
      }
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-16rem)] border border-border rounded-xl bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <h3 className="font-medium text-sm flex items-center gap-2">
          <Bot className="w-4 h-4 text-primary" /> OrbitGuide Assistant
        </h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleClear} 
          disabled={!history?.length || clearMutation.isPending}
          className="text-xs text-muted-foreground hover:text-destructive h-8"
        >
          {clearMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Trash2 className="w-3 h-3 mr-1" />}
          Clear
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-6 pb-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground py-12">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : history?.length === 0 && !streamingContent && !isStreaming ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-16 space-y-4">
              <Bot className="w-12 h-12 text-muted" />
              <div className="text-center">
                <p className="font-medium text-foreground">How can I help?</p>
                <p className="text-sm max-w-sm mt-1">Ask me about the architecture, specific functions, where to find things, or how components interact.</p>
              </div>
            </div>
          ) : (
            <>
              {history?.map((msg) => (
                <ChatMessage key={msg.id} role={msg.role} content={msg.content} />
              ))}
              
              {isStreaming && (
                <ChatMessage 
                  role="assistant" 
                  content={streamingContent || "..."} 
                  isStreaming={true}
                />
              )}
            </>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 bg-background border-t border-border">
        <form onSubmit={handleSend} className="relative flex items-center">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about the codebase..."
            className="pr-12 bg-card border-muted focus-visible:ring-primary/50 py-6"
            disabled={isStreaming}
          />
          <Button 
            type="submit" 
            size="icon" 
            variant="ghost" 
            className="absolute right-2 text-muted-foreground hover:text-primary hover:bg-primary/10"
            disabled={!input.trim() || isStreaming}
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}

function ChatMessage({ role, content, isStreaming }: { role: string; content: string; isStreaming?: boolean }) {
  const isUser = role === "user";
  
  // Simple markdown renderer for basic formatting
  const renderContent = () => {
    if (!content) return null;
    
    // Very basic markdown handling for code blocks
    const parts = content.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const match = part.match(/```(\w*)\n([\s\S]*?)```/);
        const code = match ? match[2] : part.replace(/```/g, '');
        return (
          <pre key={index} className="bg-background border border-border p-3 rounded-md text-xs font-mono my-2 overflow-x-auto text-foreground">
            <code>{code}</code>
          </pre>
        );
      }
      
      // Inline code and basic bold
      let formattedText = part;
      // Handle bold
      const boldParts = formattedText.split(/(\*\*[\s\S]*?\*\*)/g);
      
      return (
        <span key={index} className="whitespace-pre-wrap">
          {boldParts.map((bp, i) => {
            if (bp.startsWith('**') && bp.endsWith('**')) {
              return <strong key={i} className="font-semibold text-foreground">{bp.slice(2, -2)}</strong>;
            }
            if (bp.startsWith('`') && bp.endsWith('`')) {
              return <code key={i} className="bg-background border border-border px-1 py-0.5 rounded text-[0.8em] font-mono">{bp.slice(1, -1)}</code>;
            }
            return bp;
          })}
        </span>
      );
    });
  };

  return (
    <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center mt-1
        ${isUser ? 'bg-secondary text-secondary-foreground' : 'bg-primary/20 text-primary border border-primary/20'}`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      <div className={`flex flex-col max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`rounded-xl px-4 py-3 text-sm
          ${isUser 
            ? 'bg-secondary text-secondary-foreground rounded-tr-sm' 
            : 'bg-muted/50 border border-border rounded-tl-sm text-muted-foreground'
          }`}
        >
          {isStreaming ? (
            <div className="flex gap-1.5 items-center">
              <span className="whitespace-pre-wrap">{content}</span>
              <span className="w-1.5 h-4 bg-primary animate-pulse inline-block" />
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed">
              {renderContent()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
