// Calendar integration utilities for accountability groups

interface RhythmConfig {
  frequency: 'weekly' | 'biweekly';
  day: string;
  day2?: string;  // second meeting day for bi-weekly (twice per week)
  time: string;
  time2?: string; // separate time for the second day
}

/**
 * Generates a Google Calendar URL for adding a recurring meeting
 */
// Returns one URL for weekly/single-day, or two URLs for bi-weekly (twice per week).
export function generateGoogleCalendarUrls(
  groupName: string,
  rhythmConfig: RhythmConfig,
  attendeeEmails: string[] = []
): string[] {
  const { day, day2, time, time2 } = rhythmConfig;

  const makeUrl = (meetingDay: string, meetingTime: string) => {
    const [hours, minutes] = meetingTime.split(':');
    const nextDate = getNextOccurrence(meetingDay);
    nextDate.setHours(parseInt(hours), parseInt(minutes || '0'), 0, 0);
    const startDateTime = formatDateForGoogle(nextDate);
    const endDate = new Date(nextDate.getTime() + 60 * 60 * 1000);
    const endDateTime = formatDateForGoogle(endDate);
    const recurrence = `RRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=${getDayAbbreviation(meetingDay)}`;

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `${groupName} - Accountability Meeting`,
      dates: `${startDateTime}/${endDateTime}`,
      details: 'Regular accountability group meeting to review commitments and support each other.',
      recur: recurrence,
    });
    if (attendeeEmails.length > 0) params.set('add', attendeeEmails.join(','));
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  return day2 ? [makeUrl(day, time), makeUrl(day2, time2 || time)] : [makeUrl(day, time)];
}

/** @deprecated use generateGoogleCalendarUrls */
export function generateGoogleCalendarUrl(
  groupName: string,
  rhythmConfig: RhythmConfig,
  attendeeEmails: string[] = []
): string {
  return generateGoogleCalendarUrls(groupName, rhythmConfig, attendeeEmails)[0];
}

/**
 * Generates an .ics file content for calendar import
 */
export function generateICSFile(
  groupName: string,
  rhythmConfig: RhythmConfig,
  attendees: { name: string; email: string }[] = []
): string {
  const { day, day2, time, time2 } = rhythmConfig;

  const now = formatDateForICS(new Date());
  const attendeeLines = attendees.map(a => `ATTENDEE;CN=${a.name};RSVP=TRUE:mailto:${a.email}`);

  const makeVEvent = (meetingDay: string, meetingTime: string, index: number) => {
    const [hours, minutes] = meetingTime.split(':');
    const nextDate = getNextOccurrence(meetingDay);
    nextDate.setHours(parseInt(hours), parseInt(minutes || '0'), 0, 0);
    const startDateTime = formatDateForICS(nextDate);
    const endDate = new Date(nextDate.getTime() + 60 * 60 * 1000);
    const endDateTime = formatDateForICS(endDate);
    const rrule = `FREQ=WEEKLY;INTERVAL=1;BYDAY=${getDayAbbreviation(meetingDay)}`;
    const uid = `accountability-${groupName.replace(/\s+/g, '-')}-${meetingDay.toLowerCase()}-${index}@christians-innovate.app`;

    return [
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART:${startDateTime}`,
      `DTEND:${endDateTime}`,
      `RRULE:${rrule}`,
      `SUMMARY:${groupName} - Accountability Meeting (${meetingDay})`,
      'DESCRIPTION:Regular accountability group meeting to review commitments and support each other.',
      ...attendeeLines,
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'END:VEVENT',
    ].join('\r\n');
  };

  const vevents = day2
    ? [makeVEvent(day, time, 1), makeVEvent(day2, time2 || time, 2)]
    : [makeVEvent(day, time, 1)];

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Christians Innovate//Accountability Hub//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...vevents,
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Downloads an .ics file to the user's device
 */
export function downloadICSFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

// Helper functions

function getNextOccurrence(dayName: string): Date {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const targetDay = days.indexOf(dayName);
  
  const today = new Date();
  const currentDay = today.getDay();
  
  if (targetDay === -1) {
    // Unknown day name — fall back to next Monday rather than silently producing a wrong date
    return getNextOccurrence('Monday');
  }

  let daysUntilTarget = targetDay - currentDay;
  if (daysUntilTarget < 0) {
    daysUntilTarget += 7;
  }
  // daysUntilTarget === 0 means today is the target day; leave it as 0 so we
  // return today's date and let the caller decide whether the time has passed.
  
  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + daysUntilTarget);
  
  return nextDate;
}

function formatDateForGoogle(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

function formatDateForICS(date: Date): string {
  // Use UTC getters so the trailing 'Z' (UTC designator) is correct
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

function getDayAbbreviation(dayName: string): string {
  const abbreviations: { [key: string]: string } = {
    'Sunday': 'SU',
    'Monday': 'MO',
    'Tuesday': 'TU',
    'Wednesday': 'WE',
    'Thursday': 'TH',
    'Friday': 'FR',
    'Saturday': 'SA',
  };
  
  return abbreviations[dayName] || 'MO';
}
