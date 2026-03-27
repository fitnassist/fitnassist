import { useMemo, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg, EventContentArg } from '@fullcalendar/core';
import { User } from 'lucide-react';
import { routes } from '@/config/routes';
import './booking-calendar.css';

interface Booking {
  id: string;
  date: string | Date;
  startTime: string;
  endTime: string;
  durationMin: number;
  status: string;
  clientRoster?: {
    connection?: {
      sender?: { id: string; name: string; image?: string | null } | null;
      senderId?: string | null;
    } | null;
  } | null;
  trainer?: {
    displayName: string;
    profileImageUrl?: string | null;
  } | null;
}

interface BookingCalendarProps {
  bookings: Booking[];
  isTrainer: boolean;
  view: 'week' | 'month';
}

const STATUS_CLASS: Record<string, string> = {
  PENDING: 'fc-event--pending',
  CONFIRMED: 'fc-event--confirmed',
  COMPLETED: 'fc-event--completed',
  NO_SHOW: 'fc-event--no-show',
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  NO_SHOW: 'No Show',
};

const EventContent = ({ event }: EventContentArg) => {
  const { name, status, isTimeGrid } = event.extendedProps as {
    name: string;
    status: string;
    isTimeGrid: boolean;
  };

  if (isTimeGrid) {
    return (
      <div className="flex flex-col gap-0.5 overflow-hidden">
        <div className="flex items-center gap-1 font-medium truncate">
          <User className="h-3 w-3 shrink-0" />
          <span className="truncate">{name}</span>
        </div>
        <span className="text-[0.65rem] opacity-75">
          {event.start?.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          {' - '}
          {event.end?.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
        </span>
        <span className="text-[0.65rem] opacity-75">{STATUS_LABEL[status] ?? status}</span>
      </div>
    );
  }

  // Month/daygrid: compact
  return (
    <div className="flex items-center gap-1 truncate">
      <span className="font-medium truncate">{name}</span>
    </div>
  );
};

export const BookingCalendar = ({
  bookings, isTrainer, view,
}: BookingCalendarProps) => {
  const navigate = useNavigate();
  const calendarRef = useRef<FullCalendar>(null);

  const calendarView = view === 'week' ? 'timeGridWeek' : 'dayGridMonth';

  // Switch view without remounting
  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (api) {
      api.changeView(calendarView);
    }
  }, [calendarView]);

  const events = useMemo(() => {
    return bookings.map((booking) => {
      const dateStr = typeof booking.date === 'string'
        ? booking.date.split('T')[0]
        : booking.date.toISOString().split('T')[0];

      const name = isTrainer
        ? (booking.clientRoster?.connection?.sender?.name ?? 'Client')
        : (booking.trainer?.displayName ?? 'Trainer');

      return {
        id: booking.id,
        start: `${dateStr}T${booking.startTime}`,
        end: `${dateStr}T${booking.endTime}`,
        title: name,
        classNames: [STATUS_CLASS[booking.status] ?? 'fc-event--confirmed'],
        extendedProps: {
          name,
          status: booking.status,
          isTimeGrid: view === 'week',
        },
      };
    });
  }, [bookings, isTrainer, view]);

  const handleEventClick = useCallback((info: EventClickArg) => {
    navigate(routes.dashboardBookingDetail(info.event.id));
  }, [navigate]);

  return (
    <FullCalendar
      ref={calendarRef}
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView={calendarView}
      events={events}
      eventClick={handleEventClick}
      eventContent={EventContent}
      headerToolbar={{
        left: 'prev,next today',
        center: 'title',
        right: '',
      }}
      firstDay={1}
      allDaySlot={false}
      slotMinTime="06:00:00"
      slotMaxTime="22:00:00"
      slotDuration="00:30:00"
      slotLabelInterval="01:00:00"
      nowIndicator
      dayMaxEvents={3}
      height="calc(100vh - 220px)"
      expandRows
      eventDisplay="block"
      stickyHeaderDates
    />
  );
};
