'use client'

import * as React from 'react'
import {
  LayoutDashboard,
  FileQuestion,
  FileText,
  Flag,
  BarChart3,
  Plus,
  Search,
  Trash2,
  Edit3,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Database,
  Users,
  BookOpen,
  Layers,
  Eye,
  EyeOff,
  Save,
  X,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { SourceBadge } from '@/components/shared/source-badge'
import { Breadcrumbs } from '@/components/shared/states'
import { toast } from 'sonner'

export function AdminView() {
  const navigate = useAppStore((s) => s.navigate)
  const [stats, setStats] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    api.adminStats()
      .then((s) => setStats(s))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <Skeleton className="h-10 w-1/3 mb-6" />
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (!stats) return <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">Failed to load admin stats.</div>

  const { totals } = stats

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <Breadcrumbs items={[{ label: 'Home', onClick: () => navigate('home') }, { label: 'Admin CMS' }]} />

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-slate-600 to-slate-800 text-white">
            <LayoutDashboard className="h-4 w-4" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Admin CMS</h1>
          <Badge variant="secondary" className="ml-2">Content Management</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage questions, notes, articles, reports, and platform content. No source-code editing required.
        </p>
      </div>

      {/* Stats grid */}
      <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        <AdminStat icon={FileQuestion} label="Questions" value={totals.questions} color="text-blue-600" />
        <AdminStat icon={ShieldCheck} label="Official PYQs" value={totals.officialPyqs} color="text-emerald-600" />
        <AdminStat icon={FileText} label="Practice Qs" value={totals.practiceQuestions} color="text-violet-600" />
        <AdminStat icon={BookOpen} label="Notes" value={totals.notes} color="text-rose-600" />
        <AdminStat icon={FileText} label="Articles" value={totals.articles} color="text-amber-600" />
        <AdminStat icon={Layers} label="Sources" value={totals.sources} color="text-cyan-600" />
        <AdminStat icon={Flag} label="Reports" value={totals.openReports} color="text-rose-600" sub="open" />
        <AdminStat icon={Users} label="Users" value={totals.users} color="text-indigo-600" />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="questions" className="w-full">
        <TabsList className="mb-4 flex-wrap h-auto">
          <TabsTrigger value="questions" className="gap-1.5">
            <FileQuestion className="h-3.5 w-3.5" /> Questions
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-1.5">
            <Flag className="h-3.5 w-3.5" /> Reports ({totals.openReports})
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" /> Analytics
          </TabsTrigger>
        </TabsList>

        {/* Questions management */}
        <TabsContent value="questions">
          <QuestionManager />
        </TabsContent>

        {/* Reports management */}
        <TabsContent value="reports">
          <ReportManager />
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics">
          <AdminAnalytics stats={stats} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function AdminStat({ icon: Icon, label, value, color, sub }: { icon: React.ElementType; label: string; value: number; color: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="p-3">
        <Icon className={cn('h-3.5 w-3.5 mb-1', color)} />
        <div className={cn('text-lg font-bold leading-none', color)}>{value}</div>
        <div className="text-[9px] text-muted-foreground mt-0.5">{label}{sub && ` (${sub})`}</div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Question Manager
// ---------------------------------------------------------------------------

function QuestionManager() {
  const [questions, setQuestions] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [sourceFilter, setSourceFilter] = React.useState('all')
  const [paperFilter, setPaperFilter] = React.useState('all')
  const [showCreate, setShowCreate] = React.useState(false)
  const [editingQ, setEditingQ] = React.useState<any>(null)

  const load = React.useCallback(() => {
    setLoading(true)
    const params: any = { limit: 200 }
    if (sourceFilter !== 'all') params.sourceType = sourceFilter
    if (paperFilter !== 'all') params.paper = paperFilter
    if (search.trim()) params.search = search.trim()
    api.adminQuestions(params)
      .then((r) => setQuestions(r.questions))
      .finally(() => setLoading(false))
  }, [sourceFilter, paperFilter, search])

  React.useEffect(() => { load() }, [load])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this question? This cannot be undone.')) return
    try {
      await api.adminDeleteQuestion(id)
      toast.success('Question deleted')
      load()
    } catch (e: any) {
      toast.error('Failed to delete')
    }
  }

  const handleTogglePublish = async (q: any) => {
    const newStatus = q.status === 'published' ? 'archived' : 'published'
    try {
      await api.adminUpdateQuestion(q.id, { status: newStatus })
      toast.success(newStatus === 'published' ? 'Published' : 'Archived')
      load()
    } catch (e: any) {
      toast.error('Failed to update')
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <FileQuestion className="h-4 w-4" /> Question Bank
            <Badge variant="outline" className="text-[10px]">{questions.length}</Badge>
          </CardTitle>
          <Button size="sm" onClick={() => { setEditingQ(null); setShowCreate(true) }} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Add Question
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="mb-4 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions..."
              className="pl-9"
            />
          </div>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="sm:w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              <SelectItem value="official_pyq">Official PYQ</SelectItem>
              <SelectItem value="verified_pyq">Verified PYQ</SelectItem>
              <SelectItem value="practice">Practice</SelectItem>
              <SelectItem value="mock">Mock</SelectItem>
            </SelectContent>
          </Select>
          <Select value={paperFilter} onValueChange={setPaperFilter}>
            <SelectTrigger className="sm:w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All papers</SelectItem>
              <SelectItem value="I">Paper I</SelectItem>
              <SelectItem value="II">Paper II</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Questions table */}
        {loading ? (
          <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto scrollbar-thin">
            {questions.map((q) => (
              <div key={q.id} className="rounded-lg border border-border p-3 hover:bg-muted/20">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <SourceBadge sourceType={q.sourceType} />
                      <Badge variant="outline" className="text-[9px]">{q.paper === 'I' ? 'Paper I' : 'Paper II'}</Badge>
                      {q.pyqYear && q.pyqYear > 0 && (
                        <Badge variant="secondary" className="text-[9px]">{q.pyqYear} {q.pyqSession}</Badge>
                      )}
                      <Badge variant="outline" className="text-[9px] capitalize">{q.difficulty}</Badge>
                      {q.status === 'archived' && (
                        <Badge variant="destructive" className="text-[9px]">Archived</Badge>
                      )}
                      {q.topic?.unit?.subject && (
                        <span className="text-[10px] text-muted-foreground">{q.topic.unit.subject.name}</span>
                      )}
                    </div>
                    <div className="text-sm font-medium line-clamp-2">{q.questionText}</div>
                    <div className="mt-1 text-[10px] text-muted-foreground">
                      Answer: <span className="font-semibold text-foreground">{q.correctAnswer}</span>
                      {' · '}
                      <span className={q.verified ? 'text-emerald-600' : 'text-muted-foreground'}>
                        {q.verified ? '✓ Verified' : 'Unverified'}
                      </span>
                      {q.fingerprint && <span> · FP: {q.fingerprint.substring(0, 8)}...</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => { setEditingQ(q); setShowCreate(true) }}
                      aria-label="Edit question"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleTogglePublish(q)}
                      aria-label={q.status === 'published' ? 'Archive' : 'Publish'}
                    >
                      {q.status === 'published' ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-rose-500"
                      onClick={() => handleDelete(q.id)}
                      aria-label="Delete question"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {questions.length === 0 && (
              <div className="text-center py-12">
                <FileQuestion className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                <p className="font-medium">No questions found</p>
                <p className="text-sm text-muted-foreground">Try different filters or add a new question.</p>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Create/Edit dialog */}
      <QuestionDialog
        open={showCreate}
        onOpenChange={(o) => { setShowCreate(o); if (!o) setEditingQ(null) }}
        question={editingQ}
        onSaved={() => { load(); setShowCreate(false); setEditingQ(null) }}
      />
    </Card>
  )
}

function QuestionDialog({ open, onOpenChange, question, onSaved }: {
  open: boolean
  onOpenChange: (o: boolean) => void
  question: any
  onSaved: () => void
}) {
  const [form, setForm] = React.useState<any>({
    questionText: '', optionA: '', optionB: '', optionC: '', optionD: '',
    correctAnswer: 'A', explanation: '', difficulty: 'medium', questionType: 'mcq',
    paper: 'II', sourceType: 'practice', topicId: '',
    pyqYear: '', pyqSession: '', pyqShift: '', pyqQuestionNumber: '', pyqExamDate: '', pyqPaperId: '',
    source: '', sourceUrl: '', sourceReference: '', answerKeyRef: '',
    learningObjective: '', tags: '',
  })
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (question) {
      setForm({
        ...question,
        pyqYear: question.pyqYear ?? '',
        pyqQuestionNumber: question.pyqQuestionNumber ?? '',
        topicId: question.topicId ?? '',
      })
    } else {
      setForm({
        questionText: '', optionA: '', optionB: '', optionC: '', optionD: '',
        correctAnswer: 'A', explanation: '', difficulty: 'medium', questionType: 'mcq',
        paper: 'II', sourceType: 'practice', topicId: '',
        pyqYear: '', pyqSession: '', pyqShift: '', pyqQuestionNumber: '', pyqExamDate: '', pyqPaperId: '',
        source: '', sourceUrl: '', sourceReference: '', answerKeyRef: '',
        learningObjective: '', tags: '',
      })
    }
  }, [question, open])

  const handleSave = async () => {
    if (!form.questionText?.trim()) {
      toast.error('Question text is required')
      return
    }
    setSaving(true)
    try {
      const data = {
        ...form,
        pyqYear: form.pyqYear ? parseInt(form.pyqYear, 10) : null,
        pyqQuestionNumber: form.pyqQuestionNumber ? parseInt(form.pyqQuestionNumber, 10) : null,
      }
      if (question?.id) {
        await api.adminUpdateQuestion(question.id, data)
        toast.success('Question updated')
      } else {
        await api.adminCreateQuestion(data)
        toast.success('Question created')
      }
      onSaved()
    } catch (e: any) {
      toast.error(e.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{question ? 'Edit Question' : 'Create Question'}</DialogTitle>
          <DialogDescription>Add or modify a question. All fields are editable without code changes.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2 flex-1 overflow-y-auto scrollbar-thin">
          <div>
            <Label className="text-xs mb-1 block">Question Text *</Label>
            <Textarea
              value={form.questionText}
              onChange={(e) => setForm({ ...form, questionText: e.target.value })}
              placeholder="Enter the question..."
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs mb-1 block">Option A *</Label>
              <Input value={form.optionA} onChange={(e) => setForm({ ...form, optionA: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Option B *</Label>
              <Input value={form.optionB} onChange={(e) => setForm({ ...form, optionB: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Option C</Label>
              <Input value={form.optionC} onChange={(e) => setForm({ ...form, optionC: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Option D</Label>
              <Input value={form.optionD} onChange={(e) => setForm({ ...form, optionD: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs mb-1 block">Correct Answer</Label>
              <Select value={form.correctAnswer} onValueChange={(v) => setForm({ ...form, correctAnswer: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="C">C</SelectItem>
                  <SelectItem value="D">D</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Difficulty</Label>
              <Select value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Paper</Label>
              <Select value={form.paper} onValueChange={(v) => setForm({ ...form, paper: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="I">Paper I</SelectItem>
                  <SelectItem value="II">Paper II</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs mb-1 block">Source Type</Label>
              <Select value={form.sourceType} onValueChange={(v) => setForm({ ...form, sourceType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="official_pyq">Official PYQ</SelectItem>
                  <SelectItem value="verified_pyq">Verified PYQ</SelectItem>
                  <SelectItem value="practice">Practice</SelectItem>
                  <SelectItem value="mock">Mock</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Question Type</Label>
              <Select value={form.questionType} onValueChange={(v) => setForm({ ...form, questionType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mcq">MCQ</SelectItem>
                  <SelectItem value="assertion-reason">Assertion & Reason</SelectItem>
                  <SelectItem value="match">Match the Following</SelectItem>
                  <SelectItem value="sequence">Sequence</SelectItem>
                  <SelectItem value="case-based">Case-Based</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs mb-1 block">Explanation</Label>
            <Textarea
              value={form.explanation}
              onChange={(e) => setForm({ ...form, explanation: e.target.value })}
              placeholder="Explain why the correct answer is correct..."
              rows={3}
            />
          </div>
          {/* PYQ metadata */}
          <details className="rounded-md border border-border p-3">
            <summary className="text-xs font-semibold cursor-pointer">PYQ Metadata (for official/verified PYQs)</summary>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <div>
                <Label className="text-xs mb-1 block">Year</Label>
                <Input type="number" value={form.pyqYear} onChange={(e) => setForm({ ...form, pyqYear: e.target.value })} placeholder="2024" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Session</Label>
                <Input value={form.pyqSession} onChange={(e) => setForm({ ...form, pyqSession: e.target.value })} placeholder="June" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Shift</Label>
                <Input value={form.pyqShift} onChange={(e) => setForm({ ...form, pyqShift: e.target.value })} placeholder="Shift 1" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Q Number</Label>
                <Input type="number" value={form.pyqQuestionNumber} onChange={(e) => setForm({ ...form, pyqQuestionNumber: e.target.value })} placeholder="42" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Exam Date</Label>
                <Input value={form.pyqExamDate} onChange={(e) => setForm({ ...form, pyqExamDate: e.target.value })} placeholder="2024-08-21" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Paper ID</Label>
                <Input value={form.pyqPaperId} onChange={(e) => setForm({ ...form, pyqPaperId: e.target.value })} placeholder="2024-06-cs-p2-s1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <Label className="text-xs mb-1 block">Source Name</Label>
                <Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="NTA UGC NET June 2024" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Source URL</Label>
                <Input value={form.sourceUrl} onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })} placeholder="https://ugcnet.nta.ac.in/" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Source Reference</Label>
                <Input value={form.sourceReference} onChange={(e) => setForm({ ...form, sourceReference: e.target.value })} placeholder="UGC-NET-Jun-2024-CS-Q01" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Answer Key Ref</Label>
                <Input value={form.answerKeyRef} onChange={(e) => setForm({ ...form, answerKeyRef: e.target.value })} placeholder="NTA-AK-Jun-2024" />
              </div>
            </div>
          </details>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs mb-1 block">Learning Objective</Label>
              <Input value={form.learningObjective} onChange={(e) => setForm({ ...form, learningObjective: e.target.value })} placeholder="Understand..." />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Tags (comma-separated)</Label>
              <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="dbms, normalization" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="gap-1.5">
            <X className="h-3.5 w-3.5" /> Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-1.5">
            <Save className="h-3.5 w-3.5" /> {saving ? 'Saving...' : 'Save Question'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Report Manager
// ---------------------------------------------------------------------------

function ReportManager() {
  const [reports, setReports] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  const load = React.useCallback(() => {
    setLoading(true)
    api.adminReports()
      .then((r) => setReports(r.reports))
      .finally(() => setLoading(false))
  }, [])

  React.useEffect(() => { load() }, [load])

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.adminUpdateReport(id, status)
      toast.success(`Report marked as ${status}`)
      load()
    } catch (e: any) {
      toast.error('Failed to update')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Flag className="h-4 w-4 text-rose-500" /> Content Reports
          <Badge variant="outline" className="text-[10px]">{reports.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-500/40 mb-3" />
            <p className="font-medium">No reports</p>
            <p className="text-sm text-muted-foreground">All clear — no content issues reported.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {reports.map((r) => (
              <div key={r.id} className="rounded-lg border border-border p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className={cn('h-4 w-4 mt-0.5 shrink-0', r.status === 'open' ? 'text-rose-500' : 'text-muted-foreground')} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant="secondary" className="text-[9px] capitalize">{r.issueType.replace('-', ' ')}</Badge>
                      <Badge variant="outline" className="text-[9px] capitalize">{r.itemType}</Badge>
                      <Badge variant={r.status === 'open' ? 'destructive' : 'outline'} className="text-[9px] capitalize">{r.status}</Badge>
                      <span className="text-[10px] text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                    {r.description && <p className="text-sm text-muted-foreground">{r.description}</p>}
                    {r.item && (
                      <div className="mt-1 text-xs text-muted-foreground bg-muted/30 rounded p-2">
                        Question: {r.item.questionText?.substring(0, 100)}...
                      </div>
                    )}
                  </div>
                  {r.status === 'open' && (
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" variant="outline" onClick={() => handleStatusChange(r.id, 'resolved')} className="h-7 gap-1 text-xs">
                        <CheckCircle2 className="h-3 w-3" /> Resolve
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleStatusChange(r.id, 'rejected')} className="h-7 text-xs">
                        <XCircle className="h-3 w-3" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Admin Analytics
// ---------------------------------------------------------------------------

function AdminAnalytics({ stats }: { stats: any }) {
  const { byPaper = [], bySourceType = [], pyqsByYear = [] } = stats

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Questions by Paper</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {byPaper.map((p: any) => (
                <div key={p.paper} className="flex items-center justify-between">
                  <span className="text-sm">Paper {p.paper}</span>
                  <Badge variant="secondary">{p._count} questions</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Questions by Source Type</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {bySourceType.map((s: any) => (
                <div key={s.sourceType} className="flex items-center justify-between">
                  <SourceBadge sourceType={s.sourceType} />
                  <Badge variant="secondary">{s._count} questions</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">PYQs by Year</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-1">
            {pyqsByYear.map((y: any) => (
              <div key={y.pyqYear} className="flex items-center gap-3">
                <span className="text-sm font-medium w-12">{y.pyqYear}</span>
                <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full"
                    style={{ width: `${Math.min(100, y._count * 5)}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-8">{y._count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
