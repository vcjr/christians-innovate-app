// Calendar integration utilities for accountability groups

interface RhythmConfig {
  frequency: 'weekly' | 'biweekly';
  day: string;
  time: string;
}

/**
 * Generates a Google Calendar URL for adding a recurring meeting
 */
export function generateGoogleCalendarUrl(
  groupName: string,
  rhythmConfig: RhythmConfig,
  attendeeEmails: string[] = []
): string {
  const { frequency, day, time } = rhythmConfig;
  
  // Parse time (format: "HH:00")
  const [hours, minutes] = time.split(':');
  
  // Get next occurrence of the specified day
  const nextDate = getNextOccurrence(day);
  
  // Set the time
  nextDate.setHours(parseInt(hours), parseInt(minutes || '0'), 0, 0);
  
  // Format dates for Google Calendar (YYYYMMDDTHHMMSS)
  const startDateTime = formatDateForGoogle(nextDate);
  
  // End time (1 hour later)
  const endDate = new Date(nextDate.getTime() + 60 * 60 * 1000);
  const endDateTime = formatDateForGoogle(endDate);
  
  // Build recurrence rule (RRULE)
  const interval = frequency === 'weekly' ? 1 : 2;
  const dayOfWeek = getDayAbbreviation(day);
  const recurrence = `RRULE:FREQ=WEEKLY;INTERVAL=${interval};BYDAY=${dayOfWeek}`;
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${groupName} - Accountability Meeting`,
    dates: `${startDateTime}/${endDateTime}`,
    details: 'Regular accountability group meeting to review commitments and support each other.',
    recur: recurrence,
  });

  // Add group members as attendees
  if (attendeeEmails.length > 0) {
    params.set('add', attendeeEmails.join(','));
  }
  
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generates an .ics file content for calendar import
 */
export function generateICSFile(
  groupName: string,
  rhythmConfig: RhythmConfig,
  attendees: { name: string; email: string }[] = []
): string {
  const { frequency, day, time } = rhythmConfig;
  
  // Parse time
  const [hours, minutes] = time.split(':');
  
  // Get next occurrence
  const nextDate = getNextOccurrence(day);
  nextDate.setHours(parseInt(hours), parseInt(minutes || '0'), 0, 0);
  
  // Format dates for ICS (YYYYMMDDTHHMMSS)
  const startDateTime = formatDateForICS(nextDate);
  
  // End time (1 hour later)
  const endDate = new Date(nextDate.getTime() + 60 * 60 * 1000);
  const endDateTime = formatDateForICS(endDate);
  
  // Build recurrence rule
  const interval = frequency === 'weekly' ? 1 : 2;
  const dayOfWeek = getDayAbbreviation(day);
  const rrule = `FREQ=WEEKLY;INTERVAL=${interval};BYDAY=${dayOfWeek}`;
  
  // Generate unique ID
  const uid = `accountability-${groupName.replace(/\s+/g, '-')}-${Date.now()}@christians-innovate.app`;
  
  // ICS file content
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Christians Innovate//Accountability Hub//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatDateForICS(new Date())}`,
    `DTSTART:${startDateTime}`,
    `DTEND:${endDateTime}`,
    `RRULE:${rrule}`,
    `SUMMARY:${groupName} - Accountability Meeting`,
    'DESCRIPTION:Regular accountability group meeting to review commitments and support each other.',
    ...attendees.map(a => `ATTENDEE;CN=${a.name};RSVP=TRUE:mailto:${a.email}`),
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  
  return ics;
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
  
  let daysUntilTarget = targetDay - currentDay;
  if (daysUntilTarget <= 0) {
    daysUntilTarget += 7;
  }
  
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
  return formatDateForGoogle(date) + 'Z';
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
