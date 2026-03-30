import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg, EventContentArg, DatesSetArg } from '@fullcalendar/core';
import { User, Video } from 'lucide-react';
import { useTrainerBookings } from '@/api/booking';
import { routes } from '@/config/routes';
import './booking-calendar.css';

interface BookingCalendarProps {
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
  const { name, status, isTimeGrid, sessionType } = event.extendedProps as {
    name: string;
    status: string;
    isTimeGrid: boolean;
    sessionType?: string;
  };

  if (isTimeGrid) {
    return (
      <div className="flex flex-col gap-0.5 overflow-hidden">
        <div className="flex items-center gap-1 font-medium truncate">
          {sessionType === 'VIDEO_CALL' ? <Video className="h-3 w-3 shrink-0" /> : <User className="h-3 w-3 shrink-0" />}
          <span className="truncate">{name}</span>
        </div>
        <span className="text-[0.65rem] text-white/80">
          {event.start?.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          {' - '}
          {event.end?.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
        </span>
        <span className="text-[0.65rem] text-white/80">{STATUS_LABEL[status] ?? status}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 truncate">
      <span className="font-medium truncate">{name}</span>
    </div>
  );
};

export const BookingCalendar = ({ isTrainer, view }: BookingCalendarProps) => {
  const navigate = useNavigate();
  const calendarRef = useRef<FullCalendar>(null);

  // Track the visible date range — updated by datesSet but only used
  // for the query, never fed back into FullCalendar props.
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - start.getDay() + 1); // Monday of current week
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return {
      startDate: start.toISOString().split('T')[0]!,
      endDate: end.toISOString().split('T')[0]!,
    };
  });

  // Fetch bookings for the visible range — this is the ONLY query
  const { data: bookings } = useTrainerBookings(dateRange.startDate, dateRange.endDate);

  const calendarView = view === 'week' ? 'timeGridWeek' : 'dayGridMonth';

  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (api) {
      api.changeView(calendarView);
    }
  }, [calendarView]);

  // Convert bookings to FullCalendar events. This is derived from query
  // data which updates independently of the calendar's internal state.
  const events = useMemo(() => {
    if (!bookings) return [];
    return bookings.map((booking) => {
      const d = booking.date instanceof Date ? booking.date : new Date(booking.date);
      const dateStr = d.toISOString().split('T')[0];

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
          sessionType: booking.sessionType,
          isTimeGrid: view === 'week',
        },
      };
    });
  }, [bookings, isTrainer, view]);

  const handleEventClick = useCallback((info: EventClickArg) => {
    navigate(routes.dashboardBookingDetail(info.event.id));
  }, [navigate]);

  // When FullCalendar navigates (prev/next/today), update the query range.
  // This does NOT cause FullCalendar to remount or reset — the calendar
  // manages its own position internally. We just update the data query.
  const handleDatesSet = useCallback((dateInfo: DatesSetArg) => {
    const start = dateInfo.start.toISOString().split('T')[0]!;
    const end = dateInfo.end.toISOString().split('T')[0]!;
    setDateRange((prev) => {
      // Only update if actually changed to avoid unnecessary re-renders
      if (prev.startDate === start && prev.endDate === end) return prev;
      return { startDate: start, endDate: end };
    });
  }, []);

  return (
    <FullCalendar
      ref={calendarRef}
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView={calendarView}
      events={events}
      eventClick={handleEventClick}
      datesSet={handleDatesSet}
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
