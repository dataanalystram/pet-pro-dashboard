import { useState, useRef, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Send, Search, User, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMessages, useInsert } from '@/hooks/use-supabase-data';

export default function MessagesPage() {
  const { data: allMessages = [], isLoading } = useMessages();
  const insertMessage = useInsert('messages');
  const [activeConvo, setActiveConvo] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [search, setSearch] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  // Derive conversations from messages
  const conversations = useMemo(() => {
    const map = new Map<string, { customer_email: string; customer_name: string; last_message: string; last_message_time: string; unread_count: number }>();
    allMessages.forEach(m => {
      const existing = map.get(m.customer_email);
      if (!existing || m.created_at > existing.last_message_time) {
        map.set(m.customer_email, {
          customer_email: m.customer_email,
          customer_name: m.customer_name,
          last_message: m.content,
          last_message_time: m.created_at,
          unread_count: 0,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.last_message_time.localeCompare(a.last_message_time));
  }, [allMessages]);

  // Thread for active conversation
  const thread = useMemo(() => {
    if (!activeConvo) return [];
    return allMessages.filter(m => m.customer_email === activeConvo.customer_email);
  }, [allMessages, activeConvo]);

  useEffect(() => {
    if (activeConvo) {
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [activeConvo, thread]);

  const sendMsg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConvo) return;
    insertMessage.mutate({
      customer_email: activeConvo.customer_email,
      customer_name: activeConvo.customer_name,
      content: newMessage.trim(),
      sender: 'provider',
    });
    setNewMessage('');
  };

  const filtered = conversations.filter(c => {
    if (!search) return true;
    return c.customer_name.toLowerCase().includes(search.toLowerCase());
  });

  if (isLoading) return <div className="flex items-center justify-center py-20 text-muted-foreground">Loading messages...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-bold">Messages</h1>

      <div className="grid lg:grid-cols-3 gap-4 h-[600px]">
        <Card className={cn("lg:col-span-1", activeConvo && "hidden lg:block")}>
          <CardContent className="p-0 h-full flex flex-col">
            <div className="p-3 border-b">
              <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" /></div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y">
              {filtered.map((convo) => (
                <button key={convo.customer_email} onClick={() => setActiveConvo(convo)}
                  className={cn("w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left",
                    activeConvo?.customer_email === convo.customer_email && "bg-accent")}>
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-semibold text-sm flex-shrink-0">{convo.customer_name[0]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold truncate">{convo.customer_name}</p>
                      {convo.unread_count > 0 && <Badge className="bg-primary text-primary-foreground text-[10px] h-5 w-5 rounded-full flex items-center justify-center p-0">{convo.unread_count}</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{convo.last_message}</p>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className={cn("lg:col-span-2", !activeConvo && "hidden lg:flex lg:items-center lg:justify-center")}>
          {!activeConvo ? (
            <div className="text-center text-muted-foreground"><User className="w-12 h-12 mx-auto mb-3 opacity-40" /><p className="text-sm">Select a conversation</p></div>
          ) : (
            <CardContent className="p-0 h-full flex flex-col">
              <div className="flex items-center gap-3 px-4 py-3 border-b">
                <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setActiveConvo(null)}><ArrowLeft className="w-4 h-4" /></Button>
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">{activeConvo.customer_name[0]}</div>
                <p className="font-semibold text-sm">{activeConvo.customer_name}</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {thread.map((msg) => (
                  <div key={msg.id} className={cn("flex", msg.sender === 'provider' ? 'justify-end' : 'justify-start')}>
                    <div className={cn("max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
                      msg.sender === 'provider' ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted rounded-bl-md")}>
                      {msg.content}
                      <p className={cn("text-[10px] mt-1", msg.sender === 'provider' ? "text-primary-foreground/60" : "text-muted-foreground")}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={endRef} />
              </div>
              <form onSubmit={sendMsg} className="flex items-center gap-2 p-3 border-t">
                <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-1" />
                <Button type="submit" size="icon" disabled={!newMessage.trim()}><Send className="w-4 h-4" /></Button>
              </form>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
