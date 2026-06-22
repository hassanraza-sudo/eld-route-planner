from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import traceback

from .route_service import get_full_route
from hos.engine import build_trip_schedule, calculate_remaining_cycle


def build_trip_segments_inline(route):
    """Build trip segments from route data (inline to avoid circular import issues)."""
    TRUCK_SPEED_MPH = 55.0
    FUEL_STOP_MILES = 1000.0
    FUEL_STOP_DURATION_HOURS = 0.5

    def miles_to_hours(m):
        return m / TRUCK_SPEED_MPH

    segments = []
    d_to_pickup = route["distance_to_pickup_miles"]
    d_to_dropoff = route["distance_to_dropoff_miles"]

    def add_driving_leg(leg_miles, leg_label_prefix, mile_offset=0):
        fuel_stops = []
        m = 0
        while m + FUEL_STOP_MILES <= leg_miles:
            m += FUEL_STOP_MILES
            fuel_stops.append(m)

        prev = 0
        for fs in fuel_stops:
            chunk = fs - prev
            abs_start = mile_offset + prev
            abs_end = mile_offset + fs
            segments.append({
                "type": "driving",
                "label": f"{leg_label_prefix} ({abs_start:.0f}–{abs_end:.0f} mi)",
                "distance_miles": chunk,
                "duration_hours": miles_to_hours(chunk),
            })
            segments.append({
                "type": "fuel_stop",
                "label": f"Fuel Stop at Mile {abs_end:.0f}",
                "distance_miles": 0,
                "duration_hours": FUEL_STOP_DURATION_HOURS,
            })
            prev = fs

        remaining = leg_miles - prev
        if remaining > 0.5:
            abs_start = mile_offset + prev
            abs_end = mile_offset + leg_miles
            segments.append({
                "type": "driving",
                "label": f"{leg_label_prefix} ({abs_start:.0f}–{abs_end:.0f} mi)",
                "distance_miles": remaining,
                "duration_hours": miles_to_hours(remaining),
            })

    add_driving_leg(d_to_pickup, "Drive to Pickup", 0)
    segments.append({
        "type": "pickup",
        "label": "Pickup — On Duty Not Driving",
        "distance_miles": 0,
        "duration_hours": 1.0,
    })
    add_driving_leg(d_to_dropoff, "Drive to Dropoff", d_to_pickup)
    segments.append({
        "type": "dropoff",
        "label": "Dropoff — On Duty Not Driving",
        "distance_miles": 0,
        "duration_hours": 1.0,
    })

    return segments


def format_hours(h):
    hrs = int(h)
    mins = int(round((h - hrs) * 60))
    return f"{hrs}h {mins:02d}m"


def hour_to_clock(h):
    """Convert fractional hours (0-24 range) to HH:MM string."""
    h = h % 24
    hrs = int(h)
    mins = int(round((h - hrs) * 60))
    if mins == 60:
        hrs += 1
        mins = 0
    return f"{hrs:02d}:{mins:02d}"


class TripPlanView(APIView):
    def post(self, request):
        data = request.data

        # Validate input
        required = ["current_location", "pickup_location", "dropoff_location", "current_cycle_used"]
        for field in required:
            if not data.get(field) and data.get(field) != 0:
                return Response(
                    {"error": f"Missing required field: {field}"},
                    status=status.HTTP_400_BAD_REQUEST
                )

        current_location = str(data["current_location"]).strip()
        pickup_location = str(data["pickup_location"]).strip()
        dropoff_location = str(data["dropoff_location"]).strip()

        try:
            current_cycle_used = float(data["current_cycle_used"])
        except (ValueError, TypeError):
            return Response({"error": "current_cycle_used must be a number"}, status=400)

        if current_cycle_used < 0 or current_cycle_used > 70:
            return Response({"error": "current_cycle_used must be between 0 and 70"}, status=400)

        if not current_location or not pickup_location or not dropoff_location:
            return Response({"error": "All location fields must be non-empty"}, status=400)

        try:
            # 1. Get route
            route = get_full_route(current_location, pickup_location, dropoff_location)

            # 2. Build segments
            segments = build_trip_segments_inline(route)

            # 3. Run HOS engine
            schedule, daily_logs = build_trip_schedule(segments, current_cycle_used)

            # 4. Extract stops
            fuel_stops = []
            rest_stops = []
            cumulative_miles = 0

            for event in schedule:
                cumulative_miles += event.get("miles", 0)
                if "Fuel Stop" in event["label"]:
                    fuel_stops.append({
                        "label": event["label"],
                        "at_mile": round(cumulative_miles, 1),
                        "day": event["day"],
                        "duration_hours": event["duration_hours"],
                        "clock_time": hour_to_clock(event["start_hour_of_day"]),
                    })
                elif event["status"] == "off_duty" and (
                    "Rest" in event["label"] or "Restart" in event["label"]
                ):
                    rest_stops.append({
                        "label": event["label"],
                        "at_mile": round(cumulative_miles, 1),
                        "day": event["day"],
                        "duration_hours": event["duration_hours"],
                        "clock_time": hour_to_clock(event["start_hour_of_day"]),
                    })

            # 5. Compute summary
            total_driving = sum(e["duration_hours"] for e in schedule if e["status"] == "driving")
            total_on_duty = sum(e["duration_hours"] for e in schedule if e["status"] == "on_duty_not_driving")
            total_off_duty = sum(e["duration_hours"] for e in schedule if e["status"] == "off_duty")
            total_trip_hours = sum(e["duration_hours"] for e in schedule)
            total_days = max(e["day"] for e in schedule) if schedule else 1

            remaining_cycle = calculate_remaining_cycle(current_cycle_used)

            summary = {
                "total_distance_miles": route["distance_miles"],
                "distance_to_pickup_miles": route["distance_to_pickup_miles"],
                "distance_to_dropoff_miles": route["distance_to_dropoff_miles"],
                "total_driving_hours": round(total_driving, 2),
                "total_on_duty_hours": round(total_on_duty, 2),
                "total_off_duty_hours": round(total_off_duty, 2),
                "total_trip_hours": round(total_trip_hours, 2),
                "total_days": total_days,
                "total_log_sheets": len(daily_logs),
                "fuel_stop_count": len(fuel_stops),
                "rest_stop_count": len(rest_stops),
                "current_cycle_used": current_cycle_used,
                "remaining_cycle_hours": round(remaining_cycle, 2),
                "using_mock_route": route.get("using_mock", False),
                "api_error": route.get("api_error"),
            }

            # 6. Enrich schedule with clock times
            for event in schedule:
                event["start_clock"] = hour_to_clock(event["start_hour_of_day"])
                event["end_clock"] = hour_to_clock(event["end_hour_of_day"])
                event["duration_formatted"] = format_hours(event["duration_hours"])

            # 7. Enrich daily logs
            for log in daily_logs:
                log["log_entries"] = []
                for ev in log["events"]:
                    log["log_entries"].append({
                        "status": ev["status"],
                        "label": ev["label"],
                        "start_clock": hour_to_clock(ev["start_hour_of_day"]),
                        "end_clock": hour_to_clock(ev["end_hour_of_day"]),
                        "start_hour": round(ev["start_hour_of_day"], 4),
                        "end_hour": round(ev["end_hour_of_day"], 4),
                        "duration_hours": ev["duration_hours"],
                        "duration_formatted": format_hours(ev["duration_hours"]),
                        "miles": ev.get("miles", 0),
                    })

                # Compute totals per day
                log["driving_hours"] = round(
                    sum(e["duration_hours"] for e in log["log_entries"] if e["status"] == "driving"), 2
                )
                log["on_duty_hours"] = round(
                    sum(e["duration_hours"] for e in log["log_entries"] if e["status"] == "on_duty_not_driving"), 2
                )
                log["off_duty_hours"] = round(
                    sum(e["duration_hours"] for e in log["log_entries"] if e["status"] == "off_duty"), 2
                )
                log["sleeper_hours"] = 0
                log["total_hours"] = round(
                    log["driving_hours"] + log["on_duty_hours"] + log["off_duty_hours"], 2
                )

            return Response({
                "route": {
                    "origin": route["origin"],
                    "pickup": route["pickup"],
                    "dropoff": route["dropoff"],
                    "polyline": route["polyline"],
                    "distance_miles": route["distance_miles"],
                    "duration_hours": route["duration_hours"],
                },
                "summary": summary,
                "stops": {
                    "fuel_stops": fuel_stops,
                    "rest_stops": rest_stops,
                },
                "schedule": schedule,
                "daily_logs": daily_logs,
            })

        except Exception as e:
            traceback.print_exc()
            return Response(
                {"error": f"Trip planning failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
