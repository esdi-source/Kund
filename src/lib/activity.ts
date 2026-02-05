// Source: Compendium of Physical Activities (Approximate METs)
export const ACTIVITY_METS: Record<string, number> = {
  'weightlifting_light': 3.5,
  'weightlifting_vigorous': 6.0,
  'running_slow': 8.0, // 8 km/h
  'running_fast': 11.5, // 10-12 km/h
  'cycling_leisure': 4.0,
  'cycling_vigorous': 10.0,
  'yoga': 2.5,
  'walking': 3.5,
  'hiit': 8.0,
  'swimming': 7.0
}

export const ACTIVITY_LABELS: Record<string, string> = {
  'weightlifting_light': 'Weightlifting (Light/Moderate)',
  'weightlifting_vigorous': 'Weightlifting (Heavy/Vigorous)',
  'running_slow': 'Running (Jogging)',
  'running_fast': 'Running (Fast)',
  'cycling_leisure': 'Cycling (Leisure)',
  'cycling_vigorous': 'Cycling (Vigorous)',
  'yoga': 'Yoga / Stretching',
  'walking': 'Walking',
  'hiit': 'HIIT / Circuit',
  'swimming': 'Swimming'
}

export function calculateCaloriesBurned(
  met: number, 
  weightKg: number, 
  durationMinutes: number
): number {
  // Formula: Calories = MET * Weight(kg) * Duration(hours)
  const durationHours = durationMinutes / 60
  return met * weightKg * durationHours
}
