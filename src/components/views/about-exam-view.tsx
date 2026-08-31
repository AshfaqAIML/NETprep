'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  GraduationCap, BookOpen, FileText, Clock, Award, Users, Target, CheckCircle2,
  Layers, Database, Cpu, Globe, Lightbulb, BarChart3, CalendarDays, FileCheck,
  HelpCircle, ChevronDown, ArrowRight, Sparkles, PenTool, Timer, TrendingUp,
  ShieldCheck, Info, Search, BookMarked, ClipboardList, Flag
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Breadcrumbs } from '@/components/shared/states'

export function AboutExamView() {
  const navigate = useAppStore((s) => s.navigate)
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumbs */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-6">
        <Breadcrumbs items={[{ label: 'Home', onClick: () => navigate('home') }, { label: 'About the Exam' }]} />
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-grid-pattern opacity-30 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-[400px] w-[800px] bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-violet-500/10 blur-3xl rounded-full pointer-events-none" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-3xl">
            <Badge variant="outline" className="mb-3 bg-background/60 backdrop-blur gap-1.5">
              <ShieldCheck className="h-3 w-3 text-emerald-600" /> National Eligibility Test
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">About UGC NET</h1>
            <p className="mt-3 text-base sm:text-lg text-muted-foreground max-w-2xl">
              UGC NET is India&apos;s national-level eligibility examination for <span className="font-medium text-foreground">Junior Research Fellowship (JRF), Assistant Professor eligibility</span> and applicable PhD-related categories as per current UGC/NTA rules.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button onClick={() => navigate('subjects')} className="gap-1.5">Explore Syllabus <ArrowRight className="h-4 w-4" /></Button>
              <Button variant="outline" onClick={() => scrollTo('exam-pattern')} className="gap-1.5"><ClipboardList className="h-4 w-4" />Check Exam Pattern</Button>
              <Button variant="secondary" onClick={() => navigate('onboarding')} className="gap-1.5"><Target className="h-4 w-4" />Start Preparation</Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Anchor nav */}
      <div className="sticky top-16 z-20 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-2 flex gap-1 overflow-x-auto scrollbar-none text-xs">
          {[
            ['glance', 'At a Glance'],
            ['what-is', 'What is NET'],
            ['papers', 'Papers'],
            ['cs087', 'CS 087'],
            ['exam-pattern', 'Pattern'],
            ['eligibility', 'Eligibility'],
            ['outcomes', 'Career'],
            ['process', 'Process'],
            ['dates', 'Dates'],
            ['paper1', 'Paper I'],
            ['paper2', 'Paper II'],
            ['faq', 'FAQ'],
          ].map(([id, label]) => (
            <button key={id} onClick={() => scrollTo(id)} className="shrink-0 rounded-full border border-border px-3 py-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">{label}</button>
          ))}
        </div>
      </div>

      {/* Exam at a Glance */}
      <section id="glance" className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <SectionTitle title="Exam at a Glance" subtitle="Quick facts — verified against latest NTA notification" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <GlanceCard icon={FileText} label="Exam Name" value="UGC NET" sub="National Eligibility Test" />
          <GlanceCard icon={Users} label="Conducting Authority" value="NTA" sub="on behalf of UGC" />
          <GlanceCard icon={CalendarDays} label="Frequency" value="Twice a year" sub="June & December" />
          <GlanceCard icon={Globe} label="Mode" value="CBT" sub="Computer Based Test" />
          <GlanceCard icon={Layers} label="Papers" value="2" sub="Paper I + Paper II" />
          <GlanceCard icon={FileCheck} label="Total Questions" value="150" sub="50 + 100" />
          <GlanceCard icon={Award} label="Total Marks" value="300" sub="100 + 200" />
          <GlanceCard icon={Clock} label="Duration" value="3 hours" sub="Single session, no break" />
          <GlanceCard icon={ShieldCheck} label="Negative Marking" value="None" sub="No deduction" />
          <GlanceCard icon={CheckCircle2} label="Question Type" value="MCQ" sub="4 options, 1 correct" />
          <GlanceCard icon={BookOpen} label="Medium" value="English / Hindi" sub="Bilingual (except language papers)" />
          <GlanceCard icon={Cpu} label="CS Subject Code" value="087" sub="Computer Science & Applications" highlight />
        </div>
        <p className="text-[11px] text-muted-foreground mt-3">Applies to June 2026 cycle — always verify the latest NTA notification for your cycle.</p>
      </section>

      {/* What is UGC NET? */}
      <section id="what-is" className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Info className="h-4 w-4 text-primary" />What is UGC NET?</CardTitle></CardHeader>
          <CardContent className="prose prose-sm max-w-none text-muted-foreground">
            <p>
              <strong className="text-foreground">UGC NET (University Grants Commission National Eligibility Test)</strong> is conducted by the <strong className="text-foreground">National Testing Agency (NTA)</strong> on behalf of UGC to determine eligibility for Assistant Professor and Junior Research Fellowship in Indian universities and colleges. It is the gateway for those who wish to pursue a teaching career in higher education and for research aspirants seeking JRF.
            </p>
            <p>
              Final-year Master&apos;s students, postgraduates and professionals from diverse disciplines appear for the exam. Qualifying NET opens eligibility for Assistant Professor, JRF (with fellowship for research), and PhD admission categories under current UGC regulations — eligibility does not automatically guarantee appointment, fellowship or admission; institutional conditions apply.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Two-Paper Structure */}
      <section id="papers" className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        <SectionTitle title="Paper I vs Paper II" subtitle="Two papers in one 3-hour session" />
        <div className="grid lg:grid-cols-2 gap-4">
          <Card className="border-emerald-500/20">
            <CardHeader><CardTitle className="text-base">Paper I — General Aptitude</CardTitle><p className="text-xs text-muted-foreground">Common for all candidates — tests teaching and research aptitude</p></CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <ul className="list-disc pl-5 space-y-1">
                <li>Teaching Aptitude, Research Aptitude, Comprehension, Communication</li>
                <li>Mathematical & Logical Reasoning, Data Interpretation</li>
                <li>ICT, People/Development/Environment, Higher Education System</li>
              </ul>
            </CardContent>
          </Card>
          <Card className="border-violet-500/20">
            <CardHeader><CardTitle className="text-base">Paper II — Subject Specific</CardTitle><p className="text-xs text-muted-foreground">Based on candidate&apos;s chosen subject — e.g. Computer Science 087</p></CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>For NETPrep Hub, <strong className="text-foreground">Paper II is Computer Science & Applications (087)</strong> covering discrete structures, architecture, programming, DBMS, OS, networks, software engineering, algorithms, TOC/compilers and AI.</p>
            </CardContent>
          </Card>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
            <thead className="bg-muted/50 text-xs"><tr><th className="p-2 text-left">Feature</th><th className="p-2">Paper I</th><th className="p-2">Paper II</th></tr></thead>
            <tbody className="text-xs">
              <tr className="border-t"><td className="p-2 font-medium">Focus</td><td className="p-2 text-center">General aptitude</td><td className="p-2 text-center">Subject knowledge</td></tr>
              <tr className="border-t"><td className="p-2 font-medium">Questions</td><td className="p-2 text-center">50</td><td className="p-2 text-center">100</td></tr>
              <tr className="border-t"><td className="p-2 font-medium">Marks</td><td className="p-2 text-center">100</td><td className="p-2 text-center">200</td></tr>
              <tr className="border-t"><td className="p-2 font-medium">Nature</td><td className="p-2 text-center">Common</td><td className="p-2 text-center">Subject-specific (087)</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* CS 087 */}
      <section id="cs087" className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        <Card className="border-violet-500/20 bg-violet-500/[0.03]">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Cpu className="h-4 w-4 text-violet-600" />Computer Science & Applications — Subject Code 087</CardTitle></CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
              {[
                'Discrete Structures & Optimization', 'Computer System Architecture', 'Programming Languages & Computer Graphics',
                'Database Management Systems', 'System Software & OS', 'Software Engineering',
                'Data Structures & Algorithms', 'Theory of Computation & Compilers', 'Data Communication & Computer Networks', 'Artificial Intelligence',
              ].map((u) => <div key={u} className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-violet-600 shrink-0" />{u}</div>)}
            </div>
            <Button variant="outline" size="sm" className="mt-4 gap-1.5" onClick={() => navigate('subjects')}>View Complete Computer Science Syllabus <ArrowRight className="h-3.5 w-3.5" /></Button>
          </CardContent>
        </Card>
      </section>

      {/* Exam Pattern */}
      <section id="exam-pattern" className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        <SectionTitle title="Exam Pattern" subtitle="150 Questions → 300 Marks in 3 Hours (single session)" />
        <div className="grid sm:grid-cols-3 gap-3 text-center">
          <Card><CardContent className="p-4"><div className="text-2xl font-bold">50 Q → 100 Marks</div><div className="text-xs text-muted-foreground">Paper I</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-2xl font-bold">100 Q → 200 Marks</div><div className="text-xs text-muted-foreground">Paper II (087)</div></CardContent></Card>
          <Card className="border-primary/30 bg-primary/5"><CardContent className="p-4"><div className="text-2xl font-bold">150 Q → 300 Marks</div><div className="text-xs text-muted-foreground">Total — 3 Hours</div></CardContent></Card>
        </div>
        <Card className="mt-3">
          <CardContent className="p-4 grid sm:grid-cols-3 gap-3 text-xs">
            <div><span className="font-semibold">Correct:</span> +2 marks</div>
            <div><span className="font-semibold">Negative:</span> None (0)</div>
            <div><span className="font-semibold">Unattempted:</span> 0</div>
            <div><span className="font-semibold">Navigation:</span> Mark for review, clear response</div>
            <div><span className="font-semibold">Session:</span> Both papers in one sitting, no break</div>
            <div><span className="font-semibold">Type:</span> MCQ, 4 options</div>
          </CardContent>
        </Card>
      </section>

      {/* Eligibility */}
      <section id="eligibility" className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        <SectionTitle title="Eligibility — Quick Overview" subtitle="Full rules on dedicated page" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <EligCard title="Master's Degree" desc="Master's or equivalent from UGC-recognized university." />
          <EligCard title="Minimum Marks" desc="55% General, 50% OBC/SC/ST/PwD/Third gender (as per latest notification)." />
          <EligCard title="JRF Age" desc="Up to 30 years (relaxation 5 years for OBC/SC/ST/PwD/women)." />
          <EligCard title="Assistant Professor" desc="No upper age limit." />
          <EligCard title="Final Year" desc="Awaiting-result/final-year candidates can apply, eligibility at admission." />
          <EligCard title="Subject Match" desc="Choose subject close to Master's discipline (see NTA subject mapping)." />
        </div>
        <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={() => navigate('exam-info')}>View Complete Eligibility Details <ArrowRight className="h-3.5 w-3.5" /></Button>
      </section>

      {/* Qualification & Career */}
      <section id="outcomes" className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        <SectionTitle title="Qualification & Career Opportunities" subtitle="Eligibility ≠ guarantee — conditions apply" />
        <div className="grid sm:grid-cols-3 gap-3">
          <OutcomeCard icon={Award} title="JRF" desc="Fellowship for full-time research (PhD). Stipend + contingency as per UGC. Requires high cut-off." color="from-amber-500 to-orange-600" />
          <OutcomeCard icon={Users} title="Assistant Professor" desc="Eligibility to apply for Assistant Professor posts in universities/colleges. No age limit, but recruitment per institution." color="from-emerald-500 to-teal-600" />
          <OutcomeCard icon={GraduationCap} title="PhD Admission" desc="NET score used for PhD admission categories (JRF, NET, etc.) under current UGC PhD regulations. Institutional criteria apply." color="from-violet-500 to-purple-600" />
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">Eligibility does not automatically guarantee appointment, fellowship, or admission; applicable institutional and regulatory conditions also apply.</p>
      </section>

      {/* Exam Process */}
      <section id="process" className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        <SectionTitle title="UGC NET Exam Process" subtitle="10 steps — as per current NTA flow" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {[
            'Check Eligibility', 'Register Online', 'Select Subject (087 for CS)', 'Submit Application', 'Download Admit Card',
            'Appear for Exam (3-hr CBT)', 'Check Answer Key (Provisional)', 'Challenge (if needed)', 'Check Result & Cut-off', 'Download Certificate/Score',
          ].map((step, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-3 text-center">
              <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold mb-1">{i + 1}</div>
              <div className="text-xs font-medium">{step}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Important Components */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <InfoCard icon={ClipboardList} title="Application Form" desc="Online at ugcnet.nta.ac.in — personal, academic, subject, center, fee, photo/signature." />
          <InfoCard icon={Flag} title="Admit Card" desc="Mandatory for entry — photo, center, shift, instructions. Download before exam." />
          <InfoCard icon={Globe} title="Exam City Intimation" desc="City slip issued days before admit card for travel planning." />
          <InfoCard icon={FileCheck} title="Answer Key" desc="Provisional → challenge window → Final. Used for result." />
          <InfoCard icon={BarChart3} title="Result" desc="Score + qualification status per category. Published on NTA site." />
          <InfoCard icon={TrendingUp} title="Cut-off" desc="Minimum qualifying criteria vs actual category/subject cut-off — latter varies by paper and cycle." />
        </div>
      </section>

      {/* Important Dates */}
      <section id="dates" className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        <Card className="border-amber-500/20">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><CalendarDays className="h-4 w-4 text-amber-600" />Important UGC NET Dates</CardTitle><p className="text-xs text-muted-foreground">Dynamically updated per NTA notification — not hard-coded</p></CardHeader>
          <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
            {['Notification', 'Application Start', 'Deadline', 'Correction Window', 'City Intimation', 'Admit Card', 'Examination Date', 'Provisional Answer Key', 'Final Answer Key', 'Result', 'Certificate'].map((k) => (
              <div key={k} className="rounded-md border border-border bg-muted/20 p-2.5 flex items-center justify-between">
                <span className="text-muted-foreground">{k}</span>
                <Badge variant="outline" className="text-[9px]">TBA</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <p className="text-[11px] text-muted-foreground mt-2">Dates are updated based on the latest official NTA notification. Always verify at <a href="https://ugcnet.nta.ac.in" target="_blank" rel="noreferrer" className="underline">ugcnet.nta.ac.in</a>.</p>
      </section>

      {/* Who Should Use */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Who Should Use NETPrep Hub?</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {['UGC NET beginners', 'Repeat aspirants', 'JRF aspirants', 'Assistant Professor aspirants', 'Computer Science 087 candidates', 'Paper I preparers', 'Paper II subject specialists'].map((t) => (
              <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* Why NETPrep */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        <SectionTitle title="Why NETPrep Hub?" subtitle="Learn → Practice → Track — without guarantee claims" />
        <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <WhyCard icon={BookOpen} title="Learn" desc="Structured syllabus, topic-wise notes" />
          <WhyCard icon={Target} title="Practice" desc="Topic-wise MCQs with explanations" />
          <WhyCard icon={FileText} title="PYQs" desc="107 verified PYQs with analysis" />
          <WhyCard icon={Timer} title="Mock Tests" desc="Full 3-hr simulation" />
          <WhyCard icon={BarChart3} title="Track" desc="Progress, accuracy, weak areas" />
          <WhyCard icon={Sparkles} title="Revise" desc="Cheat sheets, bookmarks, planner" />
        </div>
      </section>

      {/* Paper I Overview */}
      <section id="paper1" className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Paper I Overview — 10 Units</CardTitle></CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-2 text-xs">
            {[
              'Teaching Aptitude', 'Research Aptitude', 'Comprehension', 'Communication',
              'Mathematical Reasoning and Aptitude', 'Logical Reasoning', 'Data Interpretation',
              'Information and Communication Technology', 'People, Development and Environment', 'Higher Education System',
            ].map((u, i) => (
              <div key={u} className="flex items-center gap-2 rounded-md border border-border p-2.5">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-emerald-500/10 text-emerald-700 text-[10px] font-bold shrink-0">{i + 1}</span>
                <span>{u}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={() => navigate('subjects')}>Explore Paper I Syllabus <ArrowRight className="h-3.5 w-3.5" /></Button>
      </section>

      {/* Paper II CS Overview */}
      <section id="paper2" className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        <Card className="border-violet-500/20">
          <CardHeader><CardTitle className="text-base">Paper II Computer Science Overview — 10 Units (087)</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-xs">
            {[
              ['Discrete Structures and Optimization', 'Logic, sets, relations, graphs, combinatorics, optimization'],
              ['Computer System Architecture', 'Digital logic, CPU, memory, I/O, 8086, pipelining'],
              ['Programming Languages and Computer Graphics', 'C/C++, OOP, graphics primitives, transformations'],
              ['Database Management Systems', 'ER, relational, SQL, normalization, transactions'],
              ['System Software and Operating Systems', 'Assemblers, loaders, OS concepts, scheduling, deadlocks'],
              ['Software Engineering', 'SDLC, testing, metrics, quality'],
              ['Data Structures and Algorithms', 'Arrays, trees, graphs, sorting, complexity'],
              ['Theory of Computation and Compilers', 'Automata, grammars, parsing, code generation'],
              ['Data Communication and Computer Networks', 'OSI/TCP-IP, LAN/WAN, routing, security'],
              ['Artificial Intelligence', 'Search, knowledge, learning, neural networks'],
            ].map(([title, desc], i) => (
              <div key={title} className="rounded-md border border-border p-2.5">
                <div className="font-semibold">Unit {i + 1} — {title}</div>
                <div className="text-muted-foreground mt-0.5">{desc}</div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={() => navigate('subject-detail', { slug: 'computer-science' })}>Explore Complete Paper II Syllabus <ArrowRight className="h-3.5 w-3.5" /></Button>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        <SectionTitle title="Frequently Asked Questions" subtitle="Concise answers per current NTA rules" />
        <Card>
          <CardContent className="p-0">
            <Accordion type="single" collapsible className="w-full">
              <FaqItem value="1" q="What is UGC NET?" a="National eligibility test by NTA for Assistant Professor and JRF eligibility in Indian universities." />
              <FaqItem value="2" q="Difference between Paper I and Paper II?" a="Paper I (50 Q, common aptitude) vs Paper II (100 Q, subject-specific — e.g. CS 087)." />
              <FaqItem value="3" q="How many questions/marks? Duration?" a="150 Q → 300 marks in 3 hours (single session), +2 per correct, no negative marking." />
              <FaqItem value="4" q="Is there negative marking?" a="No — 0 deduction for wrong/unattempted." />
              <FaqItem value="5" q="CS subject code?" a="087 — Computer Science & Applications." />
              <FaqItem value="6" q="Difference between NET and JRF?" a="NET qualifies for Assistant Professor; JRF additionally qualifies for research fellowship (higher cut-off, age limit)." />
              <FaqItem value="7" q="Is NET required for Assistant Professor?" a="Yes, as per current UGC rules (with PhD exemptions per regulations)." />
              <FaqItem value="8" q="Can final-year students apply?" a="Yes, awaiting-result/final-year can apply, eligibility confirmed at appointment/admission." />
              <FaqItem value="9" q="How are cut-offs decided?" a="NTA publishes minimum qualifying % then subject/category cut-offs vary by paper and vacancies." />
              <FaqItem value="10" q="Does qualifying guarantee job/admission?" a="No — eligibility is required but appointments/admissions depend on institutional merit and vacancies." />
            </Accordion>
          </CardContent>
        </Card>
      </section>

      {/* Start Preparation */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
          <CardContent className="p-6 sm:p-8 text-center">
            <h2 className="text-2xl font-bold tracking-tight">Ready to Start Your UGC NET Preparation?</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl mx-auto">Move from understanding the exam to structured preparation — syllabus, PYQs, mocks and study plans in one place.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button onClick={() => navigate('subjects')} className="gap-1.5"><BookOpen className="h-4 w-4" />Explore Syllabus</Button>
              <Button variant="outline" onClick={() => navigate('pyq-dashboard')} className="gap-1.5"><FileText className="h-4 w-4" />Practice PYQs</Button>
              <Button variant="outline" onClick={() => navigate('mock-tests')} className="gap-1.5"><Timer className="h-4 w-4" />Take a Mock Test</Button>
              <Button variant="secondary" onClick={() => navigate('planner')} className="gap-1.5"><CalendarDays className="h-4 w-4" />Create Study Plan</Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  )
}

function GlanceCard({ icon: Icon, label, value, sub, highlight }: { icon: React.ElementType; label: string; value: string; sub: string; highlight?: boolean }) {
  return (
    <Card className={cn(highlight && 'border-violet-500/30 bg-violet-500/5')}>
      <CardContent className="p-3">
        <Icon className={cn('h-4 w-4 mb-1', highlight ? 'text-violet-600' : 'text-muted-foreground')} />
        <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</div>
        <div className={cn('text-sm font-bold leading-tight', highlight && 'text-violet-700 dark:text-violet-300')}>{value}</div>
        <div className="text-[11px] text-muted-foreground">{sub}</div>
      </CardContent>
    </Card>
  )
}

function EligCard({ title, desc }: { title: string; desc: string }) {
  return <Card><CardContent className="p-3"><div className="text-xs font-semibold">{title}</div><div className="text-xs text-muted-foreground mt-1">{desc}</div></CardContent></Card>
}

function OutcomeCard({ icon: Icon, title, desc, color }: { icon: React.ElementType; title: string; desc: string; color: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className={cn('inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br text-white mb-2', color)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="font-semibold text-sm">{title}</div>
        <div className="text-xs text-muted-foreground mt-1">{desc}</div>
      </CardContent>
    </Card>
  )
}

function InfoCard({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return <Card><CardContent className="p-3"><Icon className="h-4 w-4 text-primary mb-1" /><div className="text-xs font-semibold">{title}</div><div className="text-xs text-muted-foreground mt-1">{desc}</div></CardContent></Card>
}

function WhyCard({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return <Card><CardContent className="p-3 text-center"><Icon className="h-5 w-5 mx-auto text-primary mb-1" /><div className="text-xs font-semibold">{title}</div><div className="text-[11px] text-muted-foreground mt-0.5">{desc}</div></CardContent></Card>
}

function FaqItem({ value, q, a }: { value: string; q: string; a: string }) {
  return (
    <AccordionItem value={value} className="px-4">
      <AccordionTrigger className="text-sm text-left py-3"><span className="flex items-center gap-2"><HelpCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />{q}</span></AccordionTrigger>
      <AccordionContent className="text-sm text-muted-foreground pb-3">{a}</AccordionContent>
    </AccordionItem>
  )
}
