"""
HOS (Hours of Service) Rules Engine
Property Carrying Driver - 70 Hours / 8 Days Rule
"""

MAX_DRIVING_HOURS_PER_DAY = 11.0
MAX_DUTY_WINDOW_HOURS = 14.0
BREAK_REQUIRED_AFTER_DRIVING = 8.0
BREAK_DURATION_HOURS = 0.5
OFF_DUTY_REQUIRED_HOURS = 10.0
CYCLE_LIMIT_HOURS = 70.0
CYCLE_DAYS = 8
RESTART_HOURS = 34.0
PICKUP_DURATION_HOURS = 1.0
DROPOFF_DURATION_HOURS = 1.0
FUEL_STOP_MILES = 1000.0
FUEL_STOP_DURATION_HOURS = 0.5


def calculate_remaining_cycle(current_cycle_used):
    remaining = CYCLE_LIMIT_HOURS - current_cycle_used
    return max(0.0, remaining)


def build_trip_schedule(segments, current_cycle_used):
    """
    Build a full HOS-compliant trip schedule from route segments.
    segments: list of dicts with keys: type, duration_hours, distance_miles, label
    Returns list of schedule events and daily logs.
    """
    schedule = []
    remaining_cycle = calculate_remaining_cycle(current_cycle_used)
    
    # State tracking
    day_number = 1
    day_start_clock = 0.0       # hours since trip start for this day
    trip_clock = 0.0            # total hours since trip start
    day_driving = 0.0           # driving hours this duty window
    day_duty = 0.0              # total duty hours this duty window
    cumulative_driving_since_break = 0.0
    cycle_hours_used = current_cycle_used
    
    # Daily log tracking
    daily_logs = []
    current_day_events = []
    day_start_trip_clock = 0.0
    current_day_miles = 0.0

    def flush_day():
        nonlocal day_number, day_driving, day_duty, day_start_trip_clock, current_day_events, current_day_miles
        if current_day_events:
            daily_logs.append({
                "day": day_number,
                "date_offset": day_number - 1,
                "events": list(current_day_events),
                "total_miles": round(current_day_miles, 1),
                "total_driving_hours": round(day_driving, 2),
            })
        day_number += 1
        current_day_events = []
        current_day_miles = 0.0

    def add_event(status, duration, label, miles=0.0):
        nonlocal trip_clock, day_duty, day_driving, cumulative_driving_since_break
        nonlocal cycle_hours_used, current_day_miles

        start_hour = trip_clock % 24
        end_hour = (trip_clock + duration) % 24

        event = {
            "status": status,
            "label": label,
            "start_time": round(trip_clock, 2),
            "end_time": round(trip_clock + duration, 2),
            "duration_hours": round(duration, 2),
            "day": day_number,
            "start_hour_of_day": round(start_hour, 2),
            "end_hour_of_day": round(end_hour, 2),
            "miles": round(miles, 1),
        }
        current_day_events.append(event)
        schedule.append(event)

        trip_clock += duration
        current_day_miles += miles

        if status == "driving":
            day_driving += duration
            day_duty += duration
            cumulative_driving_since_break += duration
            cycle_hours_used += duration
        elif status in ("on_duty_not_driving", "pickup", "dropoff", "fuel_stop"):
            day_duty += duration
            cycle_hours_used += duration

    def take_30min_break():
        nonlocal cumulative_driving_since_break
        add_event("off_duty", BREAK_DURATION_HOURS, "30-Min Break (HOS Required)")
        cumulative_driving_since_break = 0.0

    def take_10hr_rest():
        nonlocal day_driving, day_duty, cumulative_driving_since_break, day_start_trip_clock
        flush_day()
        add_event("off_duty", OFF_DUTY_REQUIRED_HOURS, "10-Hour Off Duty Rest")
        day_driving = 0.0
        day_duty = 0.0
        day_start_trip_clock = trip_clock

    def take_34hr_restart():
        nonlocal day_driving, day_duty, cumulative_driving_since_break, cycle_hours_used
        flush_day()
        add_event("off_duty", RESTART_HOURS, "34-Hour Cycle Restart")
        day_driving = 0.0
        day_duty = 0.0
        cycle_hours_used = 0.0
        cumulative_driving_since_break = 0.0

    def drive_segment(hours_needed, miles_needed, label):
        """Drive a chunk, inserting breaks/rests as needed."""
        nonlocal remaining_cycle, cycle_hours_used
        hours_remaining = hours_needed
        miles_remaining = miles_needed

        while hours_remaining > 0.001:
            remaining_cycle = max(0, CYCLE_LIMIT_HOURS - cycle_hours_used)

            # Check cycle exhaustion
            if remaining_cycle <= 0:
                take_34hr_restart()
                remaining_cycle = CYCLE_LIMIT_HOURS

            # How much can we drive right now?
            can_drive_before_break = max(0, BREAK_REQUIRED_AFTER_DRIVING - cumulative_driving_since_break)
            can_drive_in_window = max(0, MAX_DRIVING_HOURS_PER_DAY - day_driving)
            can_drive_in_duty = max(0, MAX_DUTY_WINDOW_HOURS - day_duty)
            can_drive_in_cycle = max(0, remaining_cycle)

            can_drive = min(
                can_drive_before_break if can_drive_before_break > 0 else hours_remaining,
                can_drive_in_window,
                can_drive_in_duty,
                can_drive_in_cycle,
                hours_remaining
            )

            # If we can't drive due to break
            if can_drive_before_break == 0 and cumulative_driving_since_break >= BREAK_REQUIRED_AFTER_DRIVING:
                take_30min_break()
                continue

            # If window is exhausted
            if can_drive_in_window <= 0.001 or can_drive_in_duty <= 0.001:
                take_10hr_rest()
                continue

            if can_drive <= 0.001:
                take_10hr_rest()
                continue

            drive_hours = min(can_drive, hours_remaining)
            if drive_hours <= 0.001:
                break

            proportion = drive_hours / hours_needed if hours_needed > 0 else 0
            drive_miles = miles_remaining * (drive_hours / hours_remaining) if hours_remaining > 0 else 0

            add_event("driving", drive_hours, label, miles=drive_miles)
            hours_remaining -= drive_hours
            miles_remaining -= drive_miles

            # After segment driving: check if break needed
            if cumulative_driving_since_break >= BREAK_REQUIRED_AFTER_DRIVING and hours_remaining > 0.001:
                take_30min_break()

            # After segment driving: check if daily limits hit
            if (day_driving >= MAX_DRIVING_HOURS_PER_DAY - 0.001 or
                    day_duty >= MAX_DUTY_WINDOW_HOURS - 0.001) and hours_remaining > 0.001:
                take_10hr_rest()

    # Process each segment
    for seg in segments:
        seg_type = seg["type"]
        duration = seg["duration_hours"]
        miles = seg.get("distance_miles", 0.0)
        label = seg["label"]

        if seg_type == "driving":
            drive_segment(duration, miles, label)
        elif seg_type == "pickup":
            add_event("on_duty_not_driving", PICKUP_DURATION_HOURS, label)
        elif seg_type == "dropoff":
            add_event("on_duty_not_driving", DROPOFF_DURATION_HOURS, label)
        elif seg_type == "fuel_stop":
            add_event("on_duty_not_driving", FUEL_STOP_DURATION_HOURS, label)

    # Flush last day
    if current_day_events:
        flush_day()

    return schedule, daily_logs
