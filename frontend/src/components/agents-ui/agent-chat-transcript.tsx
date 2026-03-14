'use client';

import { type ComponentProps, useEffect, useRef, useCallback } from 'react';
import { type AgentState, type ReceivedMessage } from '@livekit/components-react';
import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ai-elements/conversation';
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message';
import { AgentChatIndicator } from '@/components/agents-ui/agent-chat-indicator';
import { AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { AudioWaveform, User } from 'lucide-react';

export interface AgentChatTranscriptProps extends ComponentProps<'div'> {
  agentState?: AgentState;
  messages?: ReceivedMessage[];
  className?: string;
  highlightMessageId?: string | null;
  onHighlightComplete?: () => void;
}

export function AgentChatTranscript({
  agentState, messages = [], className, highlightMessageId, onHighlightComplete, ...props
}: AgentChatTranscriptProps) {
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const setMessageRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) messageRefs.current.set(id, el);
    else messageRefs.current.delete(id);
  }, []);

  useEffect(() => {
    if (!highlightMessageId) return;
    const el = messageRefs.current.get(highlightMessageId);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('ring-2', 'ring-amber-400/60', 'rounded-lg');
    const timer = setTimeout(() => {
      el.classList.remove('ring-2', 'ring-amber-400/60', 'rounded-lg');
      onHighlightComplete?.();
    }, 2000);
    return () => { clearTimeout(timer); el.classList.remove('ring-2', 'ring-amber-400/60', 'rounded-lg'); };
  }, [highlightMessageId, onHighlightComplete]);

  return (
    <Conversation className={cn('rounded-xl border border-border/30 bg-muted/20', className)} {...props}>
      <ConversationContent className="gap-5 px-5 py-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <AudioWaveform className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground/50">Conversation will appear here...</p>
          </div>
        )}
        {messages.map((receivedMessage) => {
          const { id, timestamp, from, message } = receivedMessage;
          const locale = navigator?.language ?? 'en-US';
          const messageOrigin = from?.isLocal ? 'user' : 'assistant';
          const time = new Date(timestamp);
          const title = time.toLocaleTimeString(locale, { timeStyle: 'full' });
          const isUser = messageOrigin === 'user';

          return (
            <div key={id} ref={(el) => setMessageRef(id, el)} className={cn('flex gap-3 transition-all duration-300', isUser && 'flex-row-reverse')}>
              <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full mt-0.5',
                isUser ? 'bg-primary/10 text-primary' : 'bg-[var(--dv-wine)]/10 text-[var(--dv-wine)]')}>
                {isUser ? <User className="h-3.5 w-3.5" /> : <AudioWaveform className="h-3.5 w-3.5" />}
              </div>
              <Message title={title} from={messageOrigin} className="max-w-[85%]">
                <span className={cn('text-[10px] font-medium uppercase tracking-widest', isUser ? 'text-primary/60 text-right' : 'text-[var(--dv-wine)]/60')}>
                  {isUser ? 'You' : 'DocuVoice'}
                </span>
                <MessageContent>
                  <MessageResponse>{message}</MessageResponse>
                </MessageContent>
              </Message>
            </div>
          );
        })}
        <AnimatePresence>
          {agentState === 'thinking' && (
            <div className="flex gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--dv-wine)]/10 text-[var(--dv-wine)] mt-0.5">
                <AudioWaveform className="h-3.5 w-3.5" />
              </div>
              <AgentChatIndicator size="sm" />
            </div>
          )}
        </AnimatePresence>
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}
