import React, { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useSearchParams, Navigate } from 'react-router-dom'
import {
  useAttendanceQuery,
  useLeavesQuery,
  useEmployeesQuery,
  useAnnouncementsQuery,
  useRequestLeaveMutation,
  useSummarizeAnnouncementMutation,
} from '@/api/queries'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Megaphone,
  Clock,
  Search,
  Plus,
  Loader2,
  Sparkles,
  User,
  Sun,
  Moon,
} from 'lucide-react'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function DashboardContent() {
  const location = useLocation()
  
  // Determine active tab based on route
  const activeTab = location.pathname === '/' ? 'overview' : location.pathname.substring(1)

  // Theme state synced with localStorage and system preferences
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
      if (savedTheme) return savedTheme
      
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      return systemPrefersDark ? 'dark' : 'light'
    }
    return 'light'
  })

  React.useEffect(() => {
    const root = window.document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  // Queries
  const attendance = useAttendanceQuery()
  const leaves = useLeavesQuery()
  const employees = useEmployeesQuery()
  const announcements = useAnnouncementsQuery()

  // Form State for Leave Request
  const [leaveForm, setLeaveForm] = useState({
    startDate: '',
    endDate: '',
    type: 'Annual',
    reason: '',
  })
  const requestLeaveMutation = useRequestLeaveMutation()

  // Search & Filter State for Team Directory synced with URL params
  const [searchParams, setSearchParams] = useSearchParams()
  const searchQuery = searchParams.get('q') || ''
  const selectedDept = searchParams.get('dept') || 'All'

  const handleSearchChange = (val: string) => {
    setSearchParams(
      (prev) => {
        if (val) {
          prev.set('q', val)
        } else {
          prev.delete('q')
        }
        return prev
      },
      { replace: true }
    )
  }

  const handleDeptChange = (val: string) => {
    setSearchParams(
      (prev) => {
        if (val && val !== 'All') {
          prev.set('dept', val)
        } else {
          prev.delete('dept')
        }
        return prev
      },
      { replace: true }
    )
  }

  // Summarize state mapping: announcementId -> list of bullet points
  const [summaries, setSummaries] = useState<Record<string, string[]>>({})
  const summarizeMutation = useSummarizeAnnouncementMutation()

  // Leave Modal State for Mobile View
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false)

  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason) {
      alert('Please fill out all fields')
      return
    }
    requestLeaveMutation.mutate(leaveForm, {
      onSuccess: () => {
        setLeaveForm({ startDate: '', endDate: '', type: 'Annual', reason: '' })
        setIsLeaveModalOpen(false)
        alert('Leave request submitted successfully!')
      },
    })
  }

  const handleSummarize = (id: string) => {
    summarizeMutation.mutate(id, {
      onSuccess: (bullets) => {
        setSummaries((prev) => ({ ...prev, [id]: bullets }))
      },
      onError: () => {
        alert('Failed to generate summary.')
      },
    })
  }

  // Helper stats
  const presentCount = attendance.data?.filter((r) => r.status === 'Present').length ?? 0
  const lateCount = attendance.data?.filter((r) => r.status === 'Late').length ?? 0
  const absentCount = attendance.data?.filter((r) => r.status === 'Absent').length ?? 0
  const leaveCount = attendance.data?.filter((r) => r.status === 'On Leave').length ?? 0

  const filteredEmployees = employees.data?.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDept = selectedDept === 'All' || emp.department === selectedDept
    return matchesSearch && matchesDept
  }) ?? []

  const departments = ['All', ...Array.from(new Set(employees.data?.map((emp) => emp.department) ?? []))]

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background text-foreground">
      {/* Sidebar / Bottom Nav on Mobile */}
      <aside className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t md:border-t-0 md:border-r border-border bg-card flex flex-col md:relative md:h-auto md:w-64">
        <div className="hidden md:flex h-16 items-center px-6 border-b border-border">
          <span className="font-semibold text-lg tracking-tight">Employee Dashboard</span>
        </div>
        <nav className="flex flex-row md:flex-col justify-around md:justify-start h-full md:h-auto p-2 md:p-4 gap-1">
          <Link
            to="/overview"
            className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 px-3 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium transition-colors w-full ${
              activeTab === 'overview' ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
            }`}
          >
            <LayoutDashboard className="h-5 w-5 md:h-4 md:w-4" />
            <span className="hidden md:inline">Overview</span>
          </Link>
          <Link
            to="/attendance"
            className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 px-3 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium transition-colors w-full ${
              activeTab === 'attendance' ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
            }`}
          >
            <Clock className="h-5 w-5 md:h-4 md:w-4" />
            <span className="hidden md:inline">Attendance</span>
          </Link>
          <Link
            to="/leaves"
            className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 px-3 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium transition-colors w-full ${
              activeTab === 'leaves' ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
            }`}
          >
            <CalendarDays className="h-5 w-5 md:h-4 md:w-4" />
            <span className="hidden md:inline">Leaves Request</span>
          </Link>
          <Link
            to="/directory"
            className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 px-3 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium transition-colors w-full ${
              activeTab === 'directory' ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
            }`}
          >
            <Users className="h-5 w-5 md:h-4 md:w-4" />
            <span className="hidden md:inline">Team Directory</span>
          </Link>
          <Link
            to="/announcements"
            className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 px-3 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium transition-colors w-full ${
              activeTab === 'announcements' ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
            }`}
          >
            <Megaphone className="h-5 w-5 md:h-4 md:w-4" />
            <span className="hidden md:inline">Announcements</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <header className="h-16 border-b border-border flex items-center justify-between px-4 md:px-8 bg-card">
          <h1 className="text-xl font-semibold capitalize">{activeTab === 'overview' ? 'Overview' : activeTab.replace('-', ' ')}</h1>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={toggleTheme}
              title="Toggle Theme"
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground border-l border-border pl-4">
              <User className="h-4 w-4" />
              <span>Admin Portal</span>
            </div>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          <Routes>
            {/* Redirect / to /overview */}
            <Route path="/" element={<Navigate to="/overview" replace />} />

            {/* ROUTE 1: OVERVIEW */}
            <Route
              path="/overview"
              element={
                <div className="space-y-6">
                  {/* Quick Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Present Today</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{presentCount}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Late Arrivals</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-amber-600">{lateCount}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Absent</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-destructive">{absentCount}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Remaining Leaves</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{leaves.data?.summary.remaining ?? '-'}</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Quick Overview Sections */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Announcements */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Recent Announcement</CardTitle>
                        <CardDescription>Latest updates from the company management.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {announcements.isLoading ? (
                          <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <Loader2 className="animate-spin h-4 w-4" /> Loading...
                          </div>
                        ) : announcements.data && announcements.data.length > 0 ? (
                          <div className="space-y-2">
                            <h4 className="font-semibold text-sm">{announcements.data[0].title}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-3">{announcements.data[0].content}</p>
                            <Link to="/announcements" className="text-sm text-primary underline-offset-4 hover:underline block mt-2">
                              View all announcements
                            </Link>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No announcements found.</p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Team Directory Quick view */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Team Members</CardTitle>
                        <CardDescription>Quick view of the team members directory.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {employees.isLoading ? (
                          <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <Loader2 className="animate-spin h-4 w-4" /> Loading...
                          </div>
                        ) : employees.data ? (
                          <div className="space-y-3">
                            {employees.data.slice(0, 3).map((emp) => (
                              <div key={emp.id} className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0">
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center font-bold text-xs">
                                    {emp.avatar}
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-medium">{emp.name}</h4>
                                    <p className="text-xs text-muted-foreground">{emp.role}</p>
                                  </div>
                                </div>
                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground whitespace-nowrap">
                                  {emp.department}
                                </span>
                              </div>
                            ))}
                            <Link to="/directory" className="text-sm text-primary underline-offset-4 hover:underline block mt-2">
                              View full directory
                            </Link>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No members found.</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              }
            />

            {/* ROUTE 2: ATTENDANCE */}
            <Route
              path="/attendance"
              element={
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="text-center p-4">
                      <div className="text-sm font-medium text-muted-foreground">Present</div>
                      <div className="text-2xl font-bold mt-1">{presentCount}</div>
                    </Card>
                    <Card className="text-center p-4">
                      <div className="text-sm font-medium text-muted-foreground">Late</div>
                      <div className="text-2xl font-bold mt-1 text-amber-600">{lateCount}</div>
                    </Card>
                    <Card className="text-center p-4">
                      <div className="text-sm font-medium text-muted-foreground">Absent</div>
                      <div className="text-2xl font-bold mt-1 text-destructive">{absentCount}</div>
                    </Card>
                    <Card className="text-center p-4">
                      <div className="text-sm font-medium text-muted-foreground">On Leave</div>
                      <div className="text-2xl font-bold mt-1 text-blue-600">{leaveCount}</div>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Daily Attendance Records</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {attendance.isLoading ? (
                        <div className="flex items-center justify-center p-8 text-muted-foreground gap-2">
                          <Loader2 className="animate-spin h-5 w-5" /> Loading records...
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Employee Name</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Check-in</TableHead>
                              <TableHead>Check-out</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {attendance.data?.map((record) => (
                              <TableRow key={record.id}>
                                <TableCell className="font-medium">{record.employeeName}</TableCell>
                                <TableCell>{record.date}</TableCell>
                                <TableCell>
                                  <span
                                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap ${
                                      record.status === 'Present'
                                        ? 'bg-green-100 text-green-800'
                                        : record.status === 'Late'
                                        ? 'bg-amber-100 text-amber-800'
                                        : record.status === 'Absent'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-blue-100 text-blue-800'
                                    }`}
                                  >
                                    {record.status}
                                  </span>
                                </TableCell>
                                <TableCell>{record.checkIn}</TableCell>
                                <TableCell>{record.checkOut}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </div>
              }
            />

            {/* ROUTE 3: LEAVES */}
            <Route
              path="/leaves"
              element={
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left columns: Summary & List */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="grid grid-cols-3 gap-2 md:gap-4">
                        <Card className="p-2 md:p-4 text-center">
                          <div className="text-xs text-muted-foreground uppercase font-bold tracking-tight">Total</div>
                          <div className="text-lg md:text-xl font-bold mt-1">{leaves.data?.summary.total ?? '-'}</div>
                        </Card>
                        <Card className="p-2 md:p-4 text-center">
                          <div className="text-xs text-muted-foreground uppercase font-bold tracking-tight">Used</div>
                          <div className="text-lg md:text-xl font-bold mt-1">{leaves.data?.summary.used ?? '-'}</div>
                        </Card>
                        <Card className="p-2 md:p-4 text-center">
                          <div className="text-xs text-muted-foreground uppercase font-bold tracking-tight">Remaining</div>
                          <div className="text-lg md:text-xl font-bold mt-1 text-green-600">{leaves.data?.summary.remaining ?? '-'}</div>
                        </Card>
                      </div>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                          <CardTitle className="text-base">Leave Request History</CardTitle>
                          <Button
                            variant="outline"
                            size="sm"
                            className="lg:hidden"
                            onClick={() => setIsLeaveModalOpen(true)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Request Leave
                          </Button>
                        </CardHeader>
                        <CardContent>
                          {leaves.isLoading ? (
                            <div className="flex items-center justify-center p-8 text-muted-foreground gap-2">
                              <Loader2 className="animate-spin h-5 w-5" /> Loading requests...
                            </div>
                          ) : (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Type</TableHead>
                                  <TableHead>Dates</TableHead>
                                  <TableHead>Reason</TableHead>
                                  <TableHead>Status</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {leaves.data?.requests.map((req) => (
                                  <TableRow key={req.id}>
                                    <TableCell className="font-medium">{req.type}</TableCell>
                                    <TableCell>
                                      {req.startDate} to {req.endDate}
                                    </TableCell>
                                    <TableCell className="max-w-48 truncate" title={req.reason}>
                                      {req.reason}
                                    </TableCell>
                                    <TableCell>
                                      <span
                                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap ${
                                          req.status === 'Approved'
                                            ? 'bg-green-100 text-green-800'
                                            : req.status === 'Pending'
                                            ? 'bg-amber-100 text-amber-800'
                                            : 'bg-red-100 text-red-800'
                                        }`}
                                      >
                                        {req.status}
                                      </span>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Right column: Form (Hidden on mobile, inline on desktop) */}
                    <div className="hidden lg:block space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Request New Leave</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <form onSubmit={handleLeaveSubmit} className="space-y-4">
                            <div>
                              <label className="text-xs font-medium block mb-1">Start Date</label>
                              <Input
                                type="date"
                                required
                                value={leaveForm.startDate}
                                onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium block mb-1">End Date</label>
                              <Input
                                type="date"
                                required
                                value={leaveForm.endDate}
                                onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium block mb-1">Leave Type</label>
                              <select
                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
                                value={leaveForm.type}
                                onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value })}
                              >
                                <option value="Annual">Annual</option>
                                <option value="Sick">Sick</option>
                                <option value="Unpaid">Unpaid</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-xs font-medium block mb-1">Reason</label>
                              <textarea
                                className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                required
                                placeholder="Reason for requesting leave"
                                value={leaveForm.reason}
                                onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                              />
                            </div>
                            <Button type="submit" className="w-full" disabled={requestLeaveMutation.isPending}>
                              {requestLeaveMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Submitting...
                                </>
                              ) : (
                                <>
                                  <Plus className="mr-2 h-4 w-4" />
                                  Submit Request
                                </>
                              )}
                            </Button>
                          </form>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Leave Request Modal for Mobile view */}
                  {isLeaveModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                      <Card className="w-full max-w-md bg-card border border-border shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between pb-4">
                          <CardTitle className="text-base">Request New Leave</CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => setIsLeaveModalOpen(false)}
                          >
                            ✕
                          </Button>
                        </CardHeader>
                        <CardContent>
                          <form onSubmit={handleLeaveSubmit} className="space-y-4">
                            <div>
                              <label className="text-xs font-medium block mb-1">Start Date</label>
                              <Input
                                type="date"
                                required
                                value={leaveForm.startDate}
                                onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium block mb-1">End Date</label>
                              <Input
                                type="date"
                                required
                                value={leaveForm.endDate}
                                onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium block mb-1">Leave Type</label>
                              <select
                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
                                value={leaveForm.type}
                                onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value })}
                              >
                                <option value="Annual">Annual</option>
                                <option value="Sick">Sick</option>
                                <option value="Unpaid">Unpaid</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-xs font-medium block mb-1">Reason</label>
                              <textarea
                                className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                required
                                placeholder="Reason for requesting leave"
                                value={leaveForm.reason}
                                onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                              />
                            </div>
                            <Button type="submit" className="w-full" disabled={requestLeaveMutation.isPending}>
                              {requestLeaveMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Submitting...
                                </>
                              ) : (
                                <>
                                  <Plus className="mr-2 h-4 w-4" />
                                  Submit Request
                                </>
                              )}
                            </Button>
                          </form>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              }
            />

            {/* ROUTE 4: DIRECTORY */}
            <Route
              path="/directory"
              element={
                <div className="space-y-6">
                  {/* Controls */}
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full sm:w-80">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search name or role..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2 items-center w-full sm:w-auto">
                      <span className="text-sm font-medium text-foreground whitespace-nowrap">Filter Dept:</span>
                      <select
                        className="flex h-9 w-full sm:w-40 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
                        value={selectedDept}
                        onChange={(e) => handleDeptChange(e.target.value)}
                      >
                        {departments.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Grid */}
                  {employees.isLoading ? (
                    <div className="flex items-center justify-center p-8 text-muted-foreground gap-2">
                      <Loader2 className="animate-spin h-5 w-5" /> Loading team directory...
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredEmployees.map((emp) => (
                        <Card key={emp.id} className="flex flex-col justify-between">
                          <CardHeader className="flex flex-row items-center gap-4 pb-4">
                            <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center font-bold text-sm">
                              {emp.avatar}
                            </div>
                            <div>
                              <CardTitle className="text-base">{emp.name}</CardTitle>
                              <CardDescription className="text-xs">{emp.role}</CardDescription>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0 border-t border-border mt-2 p-4">
                            <div className="space-y-1 text-xs text-muted-foreground">
                              <div className="flex justify-between">
                                <span>Department:</span>
                                <span className="font-medium text-foreground">{emp.department}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Email:</span>
                                <span className="font-medium text-foreground">{emp.email}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {filteredEmployees.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center col-span-full">
                          No team members match your search criteria.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              }
            />

            {/* ROUTE 5: ANNOUNCEMENTS */}
            <Route
              path="/announcements"
              element={
                <div className="space-y-6 w-full">
                  {announcements.isLoading ? (
                    <div className="flex items-center justify-center p-8 text-muted-foreground gap-2">
                      <Loader2 className="animate-spin h-5 w-5" /> Loading announcements...
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {announcements.data?.map((ann) => (
                        <Card key={ann.id}>
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-lg">{ann.title}</CardTitle>
                                <CardDescription className="text-xs mt-1">{ann.date}</CardDescription>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSummarize(ann.id)}
                                disabled={summarizeMutation.isPending}
                                className="flex items-center gap-1.5"
                              >
                                <Sparkles className="h-3.5 w-3.5" />
                                <span className="hidden md:inline">Summarize with AI</span>
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <p className="text-sm leading-relaxed text-muted-foreground">{ann.content}</p>

                            {/* Bulleted AI Summary Section */}
                            {summaries[ann.id] && (
                              <div className="mt-4 p-4 rounded-md bg-secondary/40 border border-border">
                                <h5 className="text-xs font-semibold flex items-center gap-1.5 mb-2">
                                  <Sparkles className="h-3 w-3 text-amber-500" />
                                  AI Generated Summary
                                </h5>
                                <ul className="list-disc list-inside text-xs space-y-1 text-foreground">
                                  {summaries[ann.id].map((bullet, idx) => (
                                    <li key={idx}>{bullet}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                      {announcements.data?.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center">No announcements published.</p>
                      )}
                    </div>
                  )}
                </div>
              }
            />
            {/* Wildcard Fallback / Not Found Redirect */}
            <Route path="*" element={<Navigate to="/overview" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <DashboardContent />
      </Router>
    </QueryClientProvider>
  )
}
