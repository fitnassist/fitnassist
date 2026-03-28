import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DailyIframe, { DailyCall } from '@daily-co/daily-js';
import { DailyProvider, DailyVideo, DailyAudio, useLocalSessionId, useParticipantIds, useDailyEvent, useDaily } from '@daily-co/daily-react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui';
import { useBooking } from '@/api/booking';
import { useAuth } from '@/hooks';
import { routes } from '@/config/routes';

/** Check if an error is a config/billing issue that shouldn't be shown to users */
const isConfigError = (err: unknown): boolean => {
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return (
    msg.includes('payment') ||
    msg.includes('billing') ||
    msg.includes('api key') ||
    msg.includes('not configured') ||
    msg.includes('unauthorized') ||
    msg.includes('401') ||
    msg.includes('402') ||
    msg.includes('403')
  );
};

const CallUI = ({ bookingId, otherPartyName }: { bookingId: string; otherPartyName: string }) => {
  const navigate = useNavigate();
  const daily = useDaily();
  const localSessionId = useLocalSessionId();
  const remoteParticipantIds = useParticipantIds({ filter: 'remote' });

  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [callError, setCallError] = useState<string | null>(null);

  useDailyEvent('left-meeting', useCallback(() => {
    navigate(routes.dashboardBookingDetail(bookingId));
  }, [navigate, bookingId]));

  useDailyEvent('error', useCallback((ev?: { errorMsg?: string }) => {
    console.error('[VideoCall] Daily error event:', ev);
    if (ev?.errorMsg && !isConfigError(ev.errorMsg)) {
      setCallError(ev.errorMsg);
    }
  }, []));

  const toggleCamera = useCallback(() => {
    daily?.setLocalVideo(!isCameraOn);
    setIsCameraOn(!isCameraOn);
  }, [daily, isCameraOn]);

  const toggleMic = useCallback(() => {
    daily?.setLocalAudio(!isMicOn);
    setIsMicOn(!isMicOn);
  }, [daily, isMicOn]);

  const leaveCall = useCallback(() => {
    daily?.leave();
    navigate(routes.dashboardBookingDetail(bookingId));
  }, [daily, navigate, bookingId]);

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-[60]">
      {/* Mid-call error banner */}
      {callError && (
        <div className="bg-destructive/90 text-white text-center py-2 px-4 text-sm">
          Connection issue: {callError}
        </div>
      )}
      {/* Video grid */}
      <div className="flex-1 flex items-center justify-center gap-4 p-4">
        {/* Remote participant (large) */}
        <div className="relative flex-1 max-w-4xl h-full flex items-center justify-center">
          {remoteParticipantIds.length > 0 ? (
            <DailyVideo
              sessionId={remoteParticipantIds[0]!}
              type="video"
              fit="cover"
              className="w-full h-full rounded-xl object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-white/60">
              <div className="h-24 w-24 rounded-full bg-white/10 flex items-center justify-center">
                <Video className="h-10 w-10" />
              </div>
              <p className="text-lg">Waiting for {otherPartyName} to join...</p>
            </div>
          )}
        </div>

        {/* Local participant (small overlay) */}
        {localSessionId && (
          <div className="absolute bottom-24 right-6 w-48 h-36 rounded-lg overflow-hidden shadow-lg border-2 border-white/20">
            <DailyVideo
              sessionId={localSessionId}
              type="video"
              fit="cover"
              mirror
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      {/* DailyAudio handles all audio tracks automatically */}
      <DailyAudio />

      {/* Controls bar */}
      <div className="flex items-center justify-center gap-4 py-6 bg-black/80">
        <Button
          variant={isMicOn ? 'secondary' : 'destructive'}
          size="lg"
          className="rounded-full h-14 w-14 p-0"
          onClick={toggleMic}
        >
          {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </Button>
        <Button
          variant={isCameraOn ? 'secondary' : 'destructive'}
          size="lg"
          className="rounded-full h-14 w-14 p-0"
          onClick={toggleCamera}
        >
          {isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </Button>
        <Button
          variant="destructive"
          size="lg"
          className="rounded-full h-14 w-14 p-0"
          onClick={leaveCall}
        >
          <PhoneOff className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

/** Hook to create a single DailyCall instance and clean it up on unmount */
const useCallObject = (url: string) => {
  const [callObject, setCallObject] = useState<DailyCall | null>(null);
  const createdRef = useRef(false);

  useEffect(() => {
    if (createdRef.current) return;
    createdRef.current = true;

    const co = DailyIframe.createCallObject({
      url,
      startVideoOff: false,
      startAudioOff: false,
    });
    setCallObject(co);

    return () => {
      co.destroy().catch(console.error);
      createdRef.current = false;
    };
  }, [url]);

  return callObject;
};

export const BookingCallPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isTrainer } = useAuth();
  const { data: booking, isLoading } = useBooking(id ?? '');

  const roomUrl = booking?.dailyRoomUrl ?? '';
  const callObject = useCallObject(roomUrl);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-[60]">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (!booking || booking.sessionType !== 'VIDEO_CALL' || !booking.dailyRoomUrl) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-4 z-[60]">
        <p className="text-white text-lg">Video call not available for this booking.</p>
        <Button variant="secondary" onClick={() => navigate(routes.dashboardBookings)}>
          Back to Bookings
        </Button>
      </div>
    );
  }

  // Check if the session time has passed
  const bookingDateStr = new Date(booking.date).toISOString().split('T')[0];
  const sessionEnd = new Date(`${bookingDateStr}T${booking.endTime}:00`);
  const isExpired = sessionEnd.getTime() < Date.now();

  if (isExpired) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-4 z-[60]">
        <AlertCircle className="h-12 w-12 text-white/60" />
        <p className="text-white text-lg">This session has ended.</p>
        <p className="text-white/60 text-sm">The video call is no longer available.</p>
        <Button variant="secondary" onClick={() => navigate(routes.dashboardBookingDetail(booking.id))}>
          Back to Booking
        </Button>
      </div>
    );
  }

  // Only allow joining 5 minutes before start time
  const sessionStart = new Date(`${bookingDateStr}T${booking.startTime}:00`);
  const isTooEarly = sessionStart.getTime() - 5 * 60_000 > Date.now();

  if (isTooEarly) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-4 z-[60]">
        <Video className="h-12 w-12 text-white/60" />
        <p className="text-white text-lg">Call not available yet</p>
        <p className="text-white/60 text-sm">
          You can join 5 minutes before the session starts at {booking.startTime}.
        </p>
        <Button variant="secondary" onClick={() => navigate(routes.dashboardBookingDetail(booking.id))}>
          Back to Booking
        </Button>
      </div>
    );
  }

  if (!callObject) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-[60]">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  const clientName = booking.clientRoster?.connection?.sender?.name ?? 'Client';
  const trainerName = booking.trainer?.displayName ?? 'Trainer';
  const otherPartyName = isTrainer ? clientName : trainerName;

  return (
    <DailyProvider callObject={callObject}>
      <CallRoom bookingId={booking.id} otherPartyName={otherPartyName} roomUrl={booking.dailyRoomUrl} />
    </DailyProvider>
  );
};

const CallRoom = ({ bookingId, otherPartyName, roomUrl }: { bookingId: string; otherPartyName: string; roomUrl: string }) => {
  const daily = useDaily();
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const joinCall = useCallback(async () => {
    if (!daily) return;
    setJoining(true);
    setError(null);
    try {
      await daily.join({ url: roomUrl });
      setJoined(true);
    } catch (err) {
      console.error('[VideoCall] Failed to join:', err);
      if (isConfigError(err)) {
        setError('Video calls are temporarily unavailable. Please try again later.');
      } else {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        if (msg.includes('expired') || msg.includes('not found')) {
          setError('This video call room has expired or is no longer available.');
        } else if (msg.includes('network') || msg.includes('fetch')) {
          setError('Could not connect to the video call. Please check your internet connection and try again.');
        } else {
          setError('Something went wrong joining the call. Please try again.');
        }
      }
    } finally {
      setJoining(false);
    }
  }, [daily, roomUrl]);

  if (!joined) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-6 z-[60]">
        <div className="text-center text-white">
          {error ? (
            <>
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <h2 className="text-xl font-semibold mb-1">Unable to join call</h2>
              <p className="text-white/60 max-w-sm">{error}</p>
            </>
          ) : (
            <>
              <Video className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h2 className="text-xl font-semibold mb-1">Ready to join?</h2>
              <p className="text-white/60">Session with {otherPartyName}</p>
            </>
          )}
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => navigate(routes.dashboardBookingDetail(bookingId))}
          >
            Go Back
          </Button>
          <Button onClick={joinCall} disabled={joining}>
            {joining ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Joining...
              </>
            ) : error ? (
              'Try Again'
            ) : (
              <>
                <Phone className="h-4 w-4 mr-2" />
                Join Call
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return <CallUI bookingId={bookingId} otherPartyName={otherPartyName} />;
};

export default BookingCallPage;
