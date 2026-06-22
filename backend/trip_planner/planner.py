"""
Trip planning logic: generates fuel stops, rest stops, and trip segments.
"""
from hos.engine import (
    FUEL_STOP_MILES, FUEL_STOP_DURATION_HOURS,
    TRUCK_SPEED_MPH if hasattr(__import__('hos.engine', fromlist=['TRUCK_SPEED_MPH']), 'TRUCK_SPEED_MPH') else None
)

TRUCK_SPEED_MPH = 55.0


def miles_to_hours(miles):
    return miles / TRUCK_SPEED_MPH


def generate_fuel_stops(total_miles, start_miles=0):
    """Generate fuel stop mile markers."""
    stops = []
    next_stop = FUEL_STOP_MILES - (start_miles % FUEL_STOP_MILES)
    if next_stop == FUEL_STOP_MILES:
        next_stop = FUEL_STOP_MILES
    cumulative = start_miles
    while cumulative + next_stop <= total_miles:
        cumulative += next_stop
        stops.append(round(cumulative, 1))
        next_stop = FUEL_STOP_MILES
    return stops


def build_trip_segments(route):
    """
    Build ordered list of driving/stop segments for HOS engine.
    Fuel stops are inserted every 1000 miles.
    """
    segments = []
    
    d_to_pickup = route["distance_to_pickup_miles"]
    d_to_dropoff = route["distance_to_dropoff_miles"]
    
    # --- Leg 1: Current → Pickup ---
    leg1_miles = d_to_pickup
    leg1_fuel_stops = []
    miles_driven = 0
    
    while miles_driven + FUEL_STOP_MILES <= leg1_miles:
        miles_driven += FUEL_STOP_MILES
        leg1_fuel_stops.append(miles_driven)
    
    # Build leg1 sub-segments
    prev_mile = 0
    for fuel_mile in leg1_fuel_stops:
        chunk = fuel_mile - prev_mile
        segments.append({
            "type": "driving",
            "label": f"Drive to Pickup ({prev_mile:.0f}–{fuel_mile:.0f} mi)",
            "distance_miles": chunk,
            "duration_hours": miles_to_hours(chunk),
        })
        segments.append({
            "type": "fuel_stop",
            "label": f"Fuel Stop at Mile {fuel_mile:.0f}",
            "distance_miles": 0,
            "duration_hours": FUEL_STOP_DURATION_HOURS,
        })
        prev_mile = fuel_mile
    
    # Remaining driving to pickup
    remaining = leg1_miles - prev_mile
    if remaining > 0.5:
        segments.append({
            "type": "driving",
            "label": f"Drive to Pickup ({prev_mile:.0f}–{leg1_miles:.0f} mi)",
            "distance_miles": remaining,
            "duration_hours": miles_to_hours(remaining),
        })
    
    # Pickup service
    segments.append({
        "type": "pickup",
        "label": "Pickup (On Duty Not Driving)",
        "distance_miles": 0,
        "duration_hours": 1.0,
    })
    
    # --- Leg 2: Pickup → Dropoff ---
    leg2_miles = d_to_dropoff
    mile_offset = leg1_miles  # cumulative miles for labeling
    leg2_fuel_stops = []
    miles_driven_leg2 = 0
    
    while miles_driven_leg2 + FUEL_STOP_MILES <= leg2_miles:
        miles_driven_leg2 += FUEL_STOP_MILES
        leg2_fuel_stops.append(miles_driven_leg2)
    
    prev_mile2 = 0
    for fuel_mile in leg2_fuel_stops:
        chunk = fuel_mile - prev_mile2
        abs_mile = mile_offset + fuel_mile
        segments.append({
            "type": "driving",
            "label": f"Drive to Dropoff ({mile_offset + prev_mile2:.0f}–{abs_mile:.0f} mi)",
            "distance_miles": chunk,
            "duration_hours": miles_to_hours(chunk),
        })
        segments.append({
            "type": "fuel_stop",
            "label": f"Fuel Stop at Mile {abs_mile:.0f}",
            "distance_miles": 0,
            "duration_hours": FUEL_STOP_DURATION_HOURS,
        })
        prev_mile2 = fuel_mile
    
    remaining2 = leg2_miles - prev_mile2
    if remaining2 > 0.5:
        segments.append({
            "type": "driving",
            "label": f"Drive to Dropoff ({mile_offset + prev_mile2:.0f}–{mile_offset + leg2_miles:.0f} mi)",
            "distance_miles": remaining2,
            "duration_hours": miles_to_hours(remaining2),
        })
    
    # Dropoff service
    segments.append({
        "type": "dropoff",
        "label": "Dropoff (On Duty Not Driving)",
        "distance_miles": 0,
        "duration_hours": 1.0,
    })
    
    return segments


def extract_stops_summary(schedule, route):
    """Extract fuel and rest stop info from schedule for summary display."""
    fuel_stops = []
    rest_stops = []
    
    cumulative_miles = 0
    prev_status = None
    
    for event in schedule:
        cumulative_miles += event.get("miles", 0)
        label = event["label"]
        
        if "Fuel Stop" in label:
            fuel_stops.append({
                "label": label,
                "at_mile": round(cumulative_miles, 1),
                "day": event["day"],
                "start_time": event["start_time"],
                "duration_hours": event["duration_hours"],
            })
        elif event["status"] == "off_duty" and "Rest" in label:
            rest_stops.append({
                "label": label,
                "at_mile": round(cumulative_miles, 1),
                "day": event["day"],
                "start_time": event["start_time"],
                "duration_hours": event["duration_hours"],
            })
    
    return fuel_stops, rest_stops
