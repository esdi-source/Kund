import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

export default function ProfilePage() {
  const { user, signOut } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  
  // Profile State
  const [fullName, setFullName] = useState('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('male')
  const [activityLevel, setActivityLevel] = useState('1.2')
  const [goal, setGoal] = useState('maintain')
  const [dailyCalories, setDailyCalories] = useState<number>(0)

  useEffect(() => {
    if (user) {
        fetchProfile()
    }
  }, [user])

  const fetchProfile = async () => {
    if (!user) return
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
    
    if (data) {
        setFullName(data.full_name || '')
        setHeight(data.height?.toString() || '')
        setWeight(data.weight?.toString() || '')
        // Calculate age from birthdate if stored, or simple age field. 
        // Schema had birth_date, let's just stick to manual age input for simplicity if not strictly enforcing date math.
        // Actually schema has birth_date. Let's strictly use age as a number for the formula for now in UI state, 
        // but maybe saving it as birthdate is annoying if we just want "Age". 
        // Let's assume user just inputs Age for the calculator in this MVP efficiency mode.
        // If schema forces birth_date, we might need to convert.
        // Schema: `birth_date date`. Let's just store a dummy birth date year based on age? 
        // Or simpler: Just update schema later or ignore birth_date and use a jsonb/meta field?
        // Let's just use the `daily_calorie_target` from DB.
        
        // Wait, I need to fetch the BMR inputs to show them.
        // The schema has height, weight, gender, activity_level. Good.
        // It DOES NOT have "age" column directly, it has "birth_date".
        // Use a simple workaround -> calculate approximate birth year from age input.
        if (data.birth_date) {
            const birthYear = new Date(data.birth_date).getFullYear()
            const currentYear = new Date().getFullYear()
            setAge((currentYear - birthYear).toString())
        }
        
        setGender(data.gender || 'male')
        setActivityLevel(data.activity_level?.toString() || '1.2')
        setGoal(data.goal || 'maintain')
        setDailyCalories(data.daily_calorie_target || 0)
    }
  }

  const calculateCalories = () => {
    const w = parseFloat(weight)
    const h = parseFloat(height)
    const a = parseFloat(age)
    
    if (!w || !h || !a) return 0

    // Mifflin-St Jeor Equation
    let bmr = (10 * w) + (6.25 * h) - (5 * a)
    if (gender === 'male') {
        bmr += 5
    } else {
        bmr -= 161
    }

    const tdee = bmr * parseFloat(activityLevel)
    
    let target = tdee
    if (goal === 'lose') target -= 500
    if (goal === 'gain') target += 300

    return Math.round(target)
  }

  const handleSave = async () => {
    if (!user) return
    setLoading(true)
    setMessage('')

    const calculatedTarget = calculateCalories()
    // Approx birth date
    const birthYear = new Date().getFullYear() - (parseInt(age) || 25)
    const birthDate = `${birthYear}-01-01`

    try {
        const { error } = await supabase
            .from('profiles')
            .update({
                full_name: fullName,
                height: parseFloat(height),
                weight: parseFloat(weight),
                gender,
                activity_level: parseFloat(activityLevel),
                goal,
                birth_date: birthDate,
                daily_calorie_target: calculatedTarget
            })
            .eq('id', user.id)

        if (error) throw error
        setDailyCalories(calculatedTarget)
        setMessage('Profile updated! New calorie target calculated.')
    } catch (e) {
        console.error(e)
        setMessage('Error saving profile')
    } finally {
        setLoading(false)
    }
  }

  return (
    <div className="p-4 space-y-4 pb-24">
      <h1 className="text-2xl font-bold">Profile & Settings</h1>
      
      <Card>
        <CardHeader>
            <CardTitle>Physical Stats</CardTitle>
            <CardDescription>Required to calculate your calorie needs.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Height (cm)</Label>
                    <Input type="number" value={height} onChange={e => setHeight(e.target.value)} placeholder="180" />
                </div>
                <div className="space-y-2">
                    <Label>Weight (kg)</Label>
                    <Input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="80" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Age</Label>
                    <Input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="30" />
                </div>
                <div className="space-y-2">
                    <Label>Gender</Label>
                    <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                    >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                    </select>
                </div>
            </div>
            
            <div className="space-y-2">
                <Label>Activity Level</Label>
                <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={activityLevel}
                    onChange={(e) => setActivityLevel(e.target.value)}
                >
                    <option value="1.2">Sedentary (Office job, little exercise)</option>
                    <option value="1.375">Light Activity (1-3 days/week)</option>
                    <option value="1.55">Moderate Activity (3-5 days/week)</option>
                    <option value="1.725">Very Active (6-7 days/week)</option>
                </select>
            </div>

            <div className="space-y-2">
                <Label>Main Goal</Label>
                <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                >
                    <option value="lose">Lose Weight (-500 kcal)</option>
                    <option value="maintain">Maintain Weight</option>
                    <option value="gain">Build Muscle (+300 kcal)</option>
                </select>
            </div>

            <Button onClick={handleSave} className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Calculate & Save Entry
            </Button>

            {message && <div className="text-sm text-green-500 text-center">{message}</div>}
        </CardContent>
      </Card>

      <Card className="border-primary/50 bg-primary/5">
        <CardHeader>
            <CardTitle>Your Target</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="text-center">
                <span className="text-5xl font-bold text-primary">{dailyCalories}</span>
                <div className="text-muted-foreground">Calories / Day</div>
            </div>
        </CardContent>
      </Card>

      <Button variant="destructive" variant="outline" className="w-full mt-8" onClick={() => signOut()}>
        Sign Out
      </Button>
    </div>
  )
}
