import moment from "moment";

// If you haven’t already declared DateString, you can alias it as:
type DateString = string;
// (or a more precise template‑literal type if you like)

type DateQueryArg = {
  arg?: '<' | '>';
  date: DateString;
  year: number;
  month?: number;
  day?: number;
};

/**
 * Parses a string like "2024", "2024/01", "2024/01/15",
 * or with a leading "<" or ">", e.g. "<2024/01" or ">2024/01/15".
 *
 * @param input the raw query string
 * @returns an object with arg, date, year, month?, day?
 * @throws if the format is invalid
 */
export function parseDateQueryArg(input: string): DateQueryArg {
  console.log('parse', input);

  // allow 1 or 2 digits for month/day
  const regex = /^(?<arg>[<>])?(?<year>\d{4})(?:\/(?<month>\d{1,2})(?:\/(?<day>\d{1,2}))?)?$/;

  const match = input.match(regex);
  if (!match?.groups) {
    throw new Error(`Invalid date format: "${input}"`);
  }

  const { arg, year, month, day } = match.groups;
  const y = parseInt(year, 10);
  const m = month ? parseInt(month, 10) : undefined;
  const d = day   ? parseInt(day,   10) : undefined;

  const pad2 = (n: number) => n.toString().padStart(2, '0');

  // build a normalized date string in YYYY, YYYY/MM or YYYY/MM/DD form
  let dateString = year;
  if (m !== undefined) {
    dateString += `/${pad2(m)}`;
    if (d !== undefined) {
      dateString += `/${pad2(d)}`;
    }
  }

  return {
    ...(arg ? { arg: arg as '<' | '>' } : {}),
    date: dateString as DateString,
    year:  y,
    month: m,
    day:   d,
  };
}

export function dateQueryToInterval(date: DateQueryArg, date2?: DateQueryArg): [number, number] {
  if (date && date2) {
    // Can't have two dates like 2024/02 or 2024/03
    // Or both of them <2023 <2043
    if ((!date.arg && !date2.arg || date.arg == date2.arg)) {
      throw new Error('invalid date query')
    }
  }
  const parse = (d: DateQueryArg) => {
    return moment(d.date, ['YYYY/MM/DD', 'YYYY/MM', 'YYYY'], true)
  }
  const getUnit = (d: DateQueryArg) => d.day !== undefined ? 'day' : d.month !== undefined ? 'month' : 'year'

  // parse the raw date string in one of the three formats
  const m = parse(date)
  if (!m.isValid()) {
    throw new Error('invalid date')
  }

  let created_at: [number | moment.Moment, number | moment.Moment]
  const unit = getUnit(date)

  if (!date.arg) {
    created_at = [m.clone().startOf(unit), m.clone().endOf(unit)]
  } else if (date.arg == '>') {
    created_at = [m.clone().startOf(unit), Infinity]
  } else {
    // <2024 means we want up until 2024, so the last ms of the 2023
    created_at = [0, m.clone().startOf(unit).subtract(1, 'ms')]
  }

  // If second date is passed and the `< >` is specified
  //  date >2024  followed by date2 <2025 means [2024, 2025]
  //  date <2025 followed by date >2024 means [2024, 2025]
  // even just 2024 followed by <2024/3 should work [2024, 2024/03]
  if (date2) {
    const m = parse(date2)

    if (m.isValid()) {
      const unit = getUnit(date2)

      if (date2.arg == '>') {
        // >2024 actually means start of 2024 — [2024, 2025]
        created_at[0] = m.clone().startOf(unit)
      } else if (date2.arg == '<') {
        // <2024 means end of 2023
        // <2024/02 means end of 2024/01. We can subtract one ms/second from the date
        created_at[1] = m.clone().startOf(unit).subtract(1, 'ms')
      }
    }
  }

  const convert = (arg: number | moment.Moment): number => typeof arg === 'number' ? arg : arg.unix()
  const format = (arg: number | moment.Moment): string => typeof arg === 'number' ? arg + '' : arg.toISOString()
  console.log(format(created_at[0]) + ' - ' + format(created_at[1]))
  return [convert(created_at[0]), convert(created_at[1])]

}


export function keywordToInterval(raw: string): [number,number] {
  const now = moment()
  // today / yesterday
  if (raw === 'today' || raw === 'yesterday') {
    const base = raw === 'today' ? now : now.clone().subtract(1, 'day')
    return [
      base.clone().startOf('day').unix(),
      base.clone().endOf('day').unix()
    ]
  }

  // lastNDays | lastNWeeks | lastNMonths
  const m = raw.match(/^last(\d+)(days?|weeks?|months?)$/i)
  if (m) {
    const n = parseInt(m[1], 10)
    const unitRaw = m[2].toLowerCase()
    // normalize to singular unit for moment
    const unit = unitRaw.startsWith('day')   ? 'day'
               : unitRaw.startsWith('week')  ? 'week'
               : /* months */                 'month'

    const start = now.clone().subtract(n, unit).startOf(unit)
    const end   = now.clone().endOf('day')
    return [ start.unix(), end.unix() ]
  }

  throw new Error(`Unrecognized date keyword: ${raw}`)
}

