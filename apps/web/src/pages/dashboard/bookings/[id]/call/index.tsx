import { useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DailyIframe from '@daily-co/daily-js';
import { DailyProvider, DailyVideo, useLocalSessionId, useParticipantIds, useDailyEvent, useDaily } from '@daily-co/daily-react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { useBooking } from '@/api/booking';
import { useAuth } from '@/hooks';
import { routes } from '@/config/routes';

const CallUI = ({ bookingId, otherPartyName }: { bookingId: string; otherPartyName: string }) => {
  const navigate = useNavigate();
  const daily = useDaily();
  const localSessionId = useLocalSessionId();
  const remoteParticipantIds = useParticipantIds({ filter: 'remote' });

  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);

  useDailyEvent('left-meeting', useCallback(() => {
    navigate(routes.dashboardBookingDetail(bookingId));
  }, [navigate, bookingId]));

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
    <div className="fixed inset-0 bg-black flex flex-col z-50">
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

export const BookingCallPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isTrainer } = useAuth();
  const { data: booking, isLoading } = useBooking(id ?? '');

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (!booking || booking.sessionType !== 'VIDEO_CALL' || !booking.dailyRoomUrl) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-4 z-50">
        <p className="text-white text-lg">Video call not available for this booking.</p>
        <Button variant="secondary" onClick={() => navigate(routes.dashboardBookings)}>
          Back to Bookings
        </Button>
      </div>
    );
  }

  const clientName = booking.clientRoster?.connection?.sender?.name ?? 'Client';
  const trainerName = booking.trainer?.displayName ?? 'Trainer';
  const otherPartyName = isTrainer ? clientName : trainerName;

  return (
    <DailyProvider
      callObject={DailyIframe.createCallObject({
        url: booking.dailyRoomUrl,
        startVideoOff: false,
        startAudioOff: false,
      })}
    >
      <CallRoom bookingId={booking.id} otherPartyName={otherPartyName} roomUrl={booking.dailyRoomUrl} />
    </DailyProvider>
  );
};

const CallRoom = ({ bookingId, otherPartyName, roomUrl }: { bookingId: string; otherPartyName: string; roomUrl: string }) => {
  const daily = useDaily();
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const navigate = useNavigate();

  const joinCall = useCallback(async () => {
    if (!daily) return;
    setJoining(true);
    try {
      await daily.join({ url: roomUrl });
      setJoined(true);
    } catch (err) {
      console.error('[VideoCall] Failed to join:', err);
    } finally {
      setJoining(false);
    }
  }, [daily, roomUrl]);

  if (!joined) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-6 z-50">
        <div className="text-center text-white">
          <Video className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-semibold mb-1">Ready to join?</h2>
          <p className="text-white/60">Session with {otherPartyName}</p>
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
