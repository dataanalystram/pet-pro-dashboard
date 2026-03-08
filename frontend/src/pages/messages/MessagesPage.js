import { useState, useEffect, useRef } from 'react';
import { messagesAPI } from '@/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Send, Search, User, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

export default function MessagesPage() {
  const [conversations, setConversations] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null);
  const [thread, setThread] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    messagesAPI.conversations().then(({ data }) => {
      setConversations(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const openThread = async (convo) => {
    setActiveConvo(convo);
    try {
      const { data } = await messagesAPI.thread(convo.customer_email);
      setThread(data);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      console.error(err);
    }
  };

  const sendMsg = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConvo) return;
    setSending(true);
    try {
      const { data } = await messagesAPI.send({
        customer_email: activeConvo.customer_email,
        content: newMessage.trim(),
      });
      setThread((prev) => [...prev, data]);
      setNewMessage('');
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const filtered = conversations.filter((c) => {
    if (!search) return true;
    return c.customer_name?.toLowerCase().includes(search.toLowerCase());
  });

  if (loading) return (
    <div className="space-y-4" data-testid="messages-skeleton">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-[500px] rounded-xl" />
    </div>
  );

  return (
    <div className="space-y-4" data-testid="messages-page">
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Messages</h1>

      <Card className="border-slate-200 overflow-hidden" data-testid="messages-container">
        <div className="flex h-[calc(100vh-220px)] min-h-[500px]">
          {/* Conversation list */}
          <div className={cn(
            "w-full md:w-80 border-r border-slate-200 flex flex-col flex-shrink-0",
            activeConvo ? "hidden md:flex" : "flex"
          )}>
            <div className="p-3 border-b border-slate-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Search conversations..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" data-testid="search-messages" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto" data-testid="conversation-list">
              {filtered.length === 0 ? (
                <div className="py-16 text-center text-sm text-slate-500">No conversations</div>
              ) : filtered.map((c) => (
                <button
                  key={c.customer_email}
                  onClick={() => openThread(c)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left border-b border-slate-100",
                    activeConvo?.customer_email === c.customer_email && "bg-blue-50"
                  )}
                  data-testid={`convo-${c.customer_email}`}
                >
                  <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold text-xs flex-shrink-0">
                    {c.customer_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-900 truncate">{c.customer_name}</p>
                      {c.last_message_at && (
                        <span className="text-[10px] text-slate-400 flex-shrink-0 ml-2">
                          {format(parseISO(c.last_message_at), 'HH:mm')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate">{c.last_message}</p>
                  </div>
                  {c.unread_count > 0 && (
                    <Badge className="bg-provider-primary text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full p-0">
                      {c.unread_count}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Thread view */}
          <div className={cn(
            "flex-1 flex flex-col",
            !activeConvo ? "hidden md:flex" : "flex"
          )}>
            {!activeConvo ? (
              <div className="flex-1 flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Select a conversation</p>
                </div>
              </div>
            ) : (
              <>
                {/* Thread header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white">
                  <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setActiveConvo(null)}>
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <div className="w-8 h-8 rounded-full bg-provider-primary flex items-center justify-center text-white font-semibold text-xs">
                    {activeConvo.customer_name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{activeConvo.customer_name}</p>
                    <p className="text-xs text-slate-500">{activeConvo.customer_email}</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50" data-testid="message-thread">
                  {thread.map((msg) => (
                    <div key={msg.id} className={cn("flex", msg.sender_type === 'provider' ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[75%] px-3 py-2 rounded-2xl text-sm",
                        msg.sender_type === 'provider'
                          ? "bg-provider-primary text-white rounded-br-md"
                          : "bg-white text-slate-900 border border-slate-200 rounded-bl-md"
                      )}>
                        <p>{msg.content}</p>
                        <p className={cn("text-[10px] mt-1", msg.sender_type === 'provider' ? "text-blue-200" : "text-slate-400")}>
                          {msg.created_at ? format(parseISO(msg.created_at), 'HH:mm') : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={endRef} />
                </div>

                {/* Input */}
                <form onSubmit={sendMsg} className="flex items-center gap-2 p-3 border-t border-slate-200 bg-white">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1"
                    data-testid="message-input"
                  />
                  <Button type="submit" size="icon" disabled={!newMessage.trim() || sending} className="bg-provider-primary hover:bg-blue-700" data-testid="send-message-btn">
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
