'use client';

import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { useChat } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { Loader, MessageSquareTextIcon, SendHorizontal } from 'lucide-react';
import { motion, type MotionProps } from 'motion/react';
import { cn } from '@/lib/utils';
import { AgentDisconnectButton } from '@/components/agents-ui/agent-disconnect-button';
import { AgentTrackControl } from '@/components/agents-ui/agent-track-control';
import { AgentTrackToggle, agentTrackToggleVariants } from '@/components/agents-ui/agent-track-toggle';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { useInputControls, usePublishPermissions, type UseInputControlsProps } from '@/hooks/agents-ui/use-agent-control-bar';

const MOTION_PROPS: MotionProps = {
  variants: { hidden: { height: 0, opacity: 0, marginBottom: 0 }, visible: { height: 'auto', opacity: 1, marginBottom: 12 } },
  initial: 'hidden',
  transition: { duration: 0.3, ease: 'easeOut' },
};

interface AgentChatInputProps { chatOpen: boolean; onSend?: (message: string) => void; className?: string; }

function AgentChatInput({ chatOpen, onSend = async () => {}, className }: AgentChatInputProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState('');
  const isDisabled = isSending || message.trim().length === 0;

  const handleSend = async () => {
    if (isDisabled) return;
    try { setIsSending(true); await onSend(message.trim()); setMessage(''); }
    catch (error) { console.error(error); }
    finally { setIsSending(false); }
  };
  const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  useEffect(() => { if (!chatOpen) return; inputRef.current?.focus(); }, [chatOpen]);

  return (
    <div className={cn('mb-3 flex grow items-end gap-2 rounded-md pl-1 text-sm', className)}>
      <textarea autoFocus ref={inputRef} value={message} disabled={!chatOpen || isSending} placeholder="Type something..."
        onKeyDown={handleKeyDown} onChange={(e) => setMessage(e.target.value)}
        className="field-sizing-content max-h-16 min-h-8 flex-1 resize-none py-2 [scrollbar-width:thin] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50" />
      <Button size="icon" type="button" disabled={isDisabled} variant={isDisabled ? 'secondary' : 'default'} title={isSending ? 'Sending...' : 'Send'} onClick={() => handleSend()} className="self-end disabled:cursor-not-allowed">
        {isSending ? <Loader className="animate-spin" /> : <SendHorizontal />}
      </Button>
    </div>
  );
}

export interface AgentControlBarControls { leave?: boolean; camera?: boolean; microphone?: boolean; screenShare?: boolean; chat?: boolean; }

export interface AgentControlBarProps extends UseInputControlsProps {
  variant?: 'default' | 'outline' | 'livekit';
  controls?: AgentControlBarControls;
  saveUserChoices?: boolean;
  isConnected?: boolean;
  isChatOpen?: boolean;
  onDisconnect?: () => void;
  onIsChatOpenChange?: (open: boolean) => void;
  onDeviceError?: (error: { source: Track.Source; error: Error }) => void;
}

export function AgentControlBar({
  variant = 'default', controls, isChatOpen = false, isConnected = false, saveUserChoices = true,
  onDisconnect, onDeviceError, onIsChatOpenChange, className, ...props
}: AgentControlBarProps & ComponentProps<'div'>) {
  const { send } = useChat();
  const publishPermissions = usePublishPermissions();
  const [isChatOpenUncontrolled, setIsChatOpenUncontrolled] = useState(isChatOpen);
  const { microphoneTrack, cameraToggle, microphoneToggle, screenShareToggle, handleAudioDeviceChange, handleVideoDeviceChange, handleMicrophoneDeviceSelectError, handleCameraDeviceSelectError } =
    useInputControls({ onDeviceError, saveUserChoices });

  const handleSendMessage = async (message: string) => { await send(message); };

  const visibleControls = {
    leave: controls?.leave ?? true,
    microphone: controls?.microphone ?? publishPermissions.microphone,
    screenShare: controls?.screenShare ?? false,
    camera: controls?.camera ?? false,
    chat: controls?.chat ?? publishPermissions.data,
  };

  const isEmpty = Object.values(visibleControls).every((value) => !value);
  if (isEmpty) return null;

  return (
    <div aria-label="Voice assistant controls" className={cn('bg-background border-input/50 dark:border-muted flex flex-col border p-3 drop-shadow-md/3', variant === 'livekit' ? 'rounded-[31px]' : 'rounded-lg', className)} {...props}>
      <motion.div {...MOTION_PROPS} inert={!(isChatOpen || isChatOpenUncontrolled)} animate={isChatOpen || isChatOpenUncontrolled ? 'visible' : 'hidden'} className="border-input/50 flex w-full items-start overflow-hidden border-b">
        <AgentChatInput chatOpen={isChatOpen || isChatOpenUncontrolled} onSend={handleSendMessage} className={cn(variant === 'livekit' && '[&_button]:rounded-full')} />
      </motion.div>
      <div className="flex gap-1">
        <div className="flex grow gap-1">
          {visibleControls.microphone && (
            <AgentTrackControl variant={variant === 'outline' ? 'outline' : 'default'} kind="audioinput" aria-label="Toggle microphone" source={Track.Source.Microphone}
              pressed={microphoneToggle.enabled} disabled={microphoneToggle.pending} audioTrack={microphoneTrack}
              onPressedChange={microphoneToggle.toggle} onActiveDeviceChange={handleAudioDeviceChange} onMediaDeviceError={handleMicrophoneDeviceSelectError}
              className={cn(variant === 'livekit' && ['rounded-full [&_button:first-child]:rounded-l-full [&_button:last-child]:rounded-r-full'])} />
          )}
          {visibleControls.camera && (
            <AgentTrackControl variant={variant === 'outline' ? 'outline' : 'default'} kind="videoinput" aria-label="Toggle camera" source={Track.Source.Camera}
              pressed={cameraToggle.enabled} pending={cameraToggle.pending} disabled={cameraToggle.pending}
              onPressedChange={cameraToggle.toggle} onMediaDeviceError={handleCameraDeviceSelectError} onActiveDeviceChange={handleVideoDeviceChange}
              className={cn(variant === 'livekit' && ['rounded-full [&_button:first-child]:rounded-l-full [&_button:last-child]:rounded-r-full'])} />
          )}
          {visibleControls.screenShare && (
            <AgentTrackToggle variant={variant === 'outline' ? 'outline' : 'default'} aria-label="Toggle screen share" source={Track.Source.ScreenShare}
              pressed={screenShareToggle.enabled} disabled={screenShareToggle.pending} onPressedChange={screenShareToggle.toggle}
              className={cn(variant === 'livekit' && ['rounded-full'])} />
          )}
          {visibleControls.chat && (
            <Toggle variant={variant === 'outline' ? 'outline' : 'default'} pressed={isChatOpen || isChatOpenUncontrolled} aria-label="Toggle chat"
              onPressedChange={(state) => { if (!onIsChatOpenChange) setIsChatOpenUncontrolled(state); else onIsChatOpenChange(state); }}
              className={agentTrackToggleVariants({ variant: variant === 'outline' ? 'outline' : 'default', className: cn(variant === 'livekit' && ['rounded-full']) })}>
              <MessageSquareTextIcon />
            </Toggle>
          )}
        </div>
        {visibleControls.leave && (
          <AgentDisconnectButton onClick={onDisconnect} disabled={!isConnected}
            className={cn(variant === 'livekit' && 'bg-destructive/10 dark:bg-destructive/10 text-destructive hover:bg-destructive/20 dark:hover:bg-destructive/20 focus:bg-destructive/20 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/4 rounded-full font-mono text-xs font-bold tracking-wider')}>
            <span className="hidden md:inline">END SESSION</span>
            <span className="inline md:hidden">END</span>
          </AgentDisconnectButton>
        )}
      </div>
    </div>
  );
}
