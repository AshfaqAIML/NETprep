'use client'

import * as React from 'react'
import {
  CalendarDays,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Clock,
  Flag,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const CATEGORY_COLORS: Record<string, string> = {
  study: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  practice: 'bg-violet-500/15 text-violet-700 dark:text-violet-300',
  revise: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  test: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
}

export function PlannerView() {
  const [tasks, setTasks] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedDate, setSelectedDate] = React.useState<string>(new Date().toISOString().split('T')[0])
  const [open, setOpen] = React.useState(false)

  const load = React.useCallback(() => {
    setLoading(true)
    api.planner()
      .then((r) => setTasks(r.tasks))
      .finally(() => setLoading(false))
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const todaysTasks = tasks.filter((t) => t.scheduledDate === selectedDate)
  const completed = todaysTasks.filter((t) => t.completed).length
  const total = todaysTasks.length
  const totalMinutes = todaysTasks.reduce((s, t) => s + (t.completed ? 0 : t.duration), 0)

  // build week view
  const today = new Date(selectedDate)
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay())
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d.toISOString().split('T')[0]
  })

  const tasksByDate = weekDays.map((d) => ({
    date: d,
    tasks: tasks.filter((t) => t.scheduledDate === d),
    completed: tasks.filter((t) => t.scheduledDate === d && t.completed).length,
    total: tasks.filter((t) => t.scheduledDate === d).length,
  }))

  const handleToggle = async (task: any) => {
    // optimistic
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, completed: !t.completed } : t))
    try {
      await api.updateTask({ id: task.id, completed: !task.completed })
      toast.success(task.completed ? 'Marked incomplete' : 'Task completed! 🎉')
    } catch (e) {
      setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, completed: task.completed } : t))
      toast.error('Failed to update task')
    }
  }

  const handleDelete = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
    try {
      await api.deleteTask(id)
      toast.success('Task deleted')
    } catch (e) {
      load()
      toast.error('Failed to delete task')
    }
  }

  const handleCreate = async (data: any) => {
    try {
      await api.createTask(data)
      toast.success('Task added')
      setOpen(false)
      load()
    } catch (e: any) {
      toast.error(e.message || 'Failed to create task')
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <div className="mb-6 flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
              <CalendarDays className="h-4 w-4" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Study Planner</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Plan your day, week, and entire preparation journey. Stay consistent — small daily progress compounds.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1.5">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Task</span>
            </Button>
          </DialogTrigger>
          <AddTaskDialog defaultDate={selectedDate} onSubmit={handleCreate} />
        </Dialog>
      </div>

      {/* Week overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            Week of {new Date(weekStart).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1.5">
            {tasksByDate.map((d) => {
              const date = new Date(d.date)
              const isToday = d.date === new Date().toISOString().split('T')[0]
              const isSelected = d.date === selectedDate
              return (
                <button
                  key={d.date}
                  onClick={() => setSelectedDate(d.date)}
                  className={cn(
                    'flex flex-col items-center justify-center rounded-lg border p-2 transition-all aspect-square',
                    isSelected ? 'border-primary bg-primary/5 ring-2 ring-primary/30' : 'border-border hover:border-primary/40 hover:bg-muted/30',
                    isToday && !isSelected && 'border-primary/40 bg-primary/5',
                  )}
                >
                  <div className="text-[9px] text-muted-foreground uppercase">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                  <div className="text-sm font-bold">{date.getDate()}</div>
                  <div className="text-[9px] mt-0.5">
                    {d.total > 0 ? (
                      <span className={cn(
                        'inline-block rounded-full px-1.5 py-0.5 font-semibold',
                        d.completed === d.total ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-muted text-muted-foreground',
                      )}>
                        {d.completed}/{d.total}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/40">—</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Day view */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
              <Badge variant="outline" className="text-[10px]">{completed}/{total} done</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : todaysTasks.length === 0 ? (
              <div className="text-center py-10">
                <CalendarDays className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                <p className="font-medium">No tasks for this day</p>
                <p className="text-sm text-muted-foreground mb-4">Add a study task to plan your day.</p>
                <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Add Task
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {todaysTasks
                  .sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''))
                  .map((task) => (
                    <div
                      key={task.id}
                      className={cn(
                        'flex items-start gap-3 rounded-lg border p-3 transition-colors',
                        task.completed ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border hover:bg-muted/30',
                      )}
                    >
                      <button
                        onClick={() => handleToggle(task)}
                        className={cn(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full mt-0.5 transition-colors',
                          task.completed ? 'bg-emerald-500 text-white' : 'border-2 border-muted-foreground/40 hover:border-primary',
                        )}
                        aria-label="Toggle complete"
                      >
                        {task.completed && <CheckCircle2 className="h-3 w-3" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className={cn('text-sm font-medium', task.completed && 'line-through text-muted-foreground')}>
                          {task.title}
                        </div>
                        {task.description && (
                          <div className="text-xs text-muted-foreground mt-0.5">{task.description}</div>
                        )}
                        <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                          {task.startTime && (
                            <Badge variant="outline" className="text-[10px] gap-0.5">
                              <Clock className="h-2.5 w-2.5" />
                              {task.startTime}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-[10px]">{task.duration} min</Badge>
                          <Badge variant="outline" className={cn('text-[10px] capitalize', task.priority === 'high' && 'border-rose-500/40 text-rose-600')}>
                            <Flag className="h-2.5 w-2.5 mr-0.5" />
                            {task.priority}
                          </Badge>
                          <Badge variant="secondary" className={cn('text-[10px] capitalize', CATEGORY_COLORS[task.category])}>
                            {task.category}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-rose-500"
                        onClick={() => handleDelete(task.id)}
                        aria-label="Delete task"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Day Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-border p-3">
              <div className="text-xs text-muted-foreground">Completion</div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-bold">{completed}</span>
                <span className="text-sm text-muted-foreground">/ {total} tasks</span>
              </div>
            </div>
            <div className="rounded-lg border border-border p-3">
              <div className="text-xs text-muted-foreground">Planned Study Time</div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-bold">{Math.floor(totalMinutes / 60)}</span>
                <span className="text-sm text-muted-foreground">h {totalMinutes % 60}m</span>
              </div>
            </div>
            <div className="rounded-lg border border-border p-3">
              <div className="text-xs text-muted-foreground mb-2">By Category</div>
              <div className="space-y-1">
                {Object.keys(CATEGORY_COLORS).map((cat) => {
                  const count = todaysTasks.filter((t) => t.category === cat).length
                  if (count === 0) return null
                  return (
                    <div key={cat} className="flex items-center justify-between text-xs">
                      <span className="capitalize text-muted-foreground">{cat}</span>
                      <Badge variant="secondary" className={cn('text-[10px] capitalize', CATEGORY_COLORS[cat])}>{count}</Badge>
                    </div>
                  )
                })}
                {todaysTasks.length === 0 && (
                  <div className="text-xs text-muted-foreground">No tasks today</div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5"
                onClick={() => {
                  const d = new Date(selectedDate)
                  d.setDate(d.getDate() - 1)
                  setSelectedDate(d.toISOString().split('T')[0])
                }}
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5"
                onClick={() => {
                  const d = new Date(selectedDate)
                  d.setDate(d.getDate() + 1)
                  setSelectedDate(d.toISOString().split('T')[0])
                }}
              >
                Next <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function AddTaskDialog({ defaultDate, onSubmit }: { defaultDate: string; onSubmit: (data: any) => void }) {
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [date, setDate] = React.useState(defaultDate)
  const [startTime, setStartTime] = React.useState('09:00')
  const [duration, setDuration] = React.useState('60')
  const [priority, setPriority] = React.useState('medium')
  const [category, setCategory] = React.useState('study')

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Add Study Task</DialogTitle>
        <DialogDescription>Schedule a new task on your study planner.</DialogDescription>
      </DialogHeader>
      <div className="space-y-3 py-2">
        <div>
          <Label className="text-xs">Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Revise Research Aptitude Unit 2" />
        </div>
        <div>
          <Label className="text-xs">Description (optional)</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief details about the task" rows={2} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Start Time</Label>
            <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">Duration (min)</Label>
            <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="study">Study</SelectItem>
                <SelectItem value="practice">Practice</SelectItem>
                <SelectItem value="revise">Revise</SelectItem>
                <SelectItem value="test">Test</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button
          onClick={() => onSubmit({ title, description, scheduledDate: date, startTime, duration: parseInt(duration, 10), priority, category })}
          disabled={!title.trim()}
        >
          Add Task
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
