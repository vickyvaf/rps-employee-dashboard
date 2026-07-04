import { http, HttpResponse } from 'msw'

// Mock Data
let attendanceData = [
  { id: '1', date: '2026-07-04', employeeName: 'Alice Vance', status: 'Present', checkIn: '08:45 AM', checkOut: '05:00 PM' },
  { id: '2', date: '2026-07-04', employeeName: 'Bob Vance', status: 'Late', checkIn: '09:30 AM', checkOut: '05:00 PM' },
  { id: '3', date: '2026-07-04', employeeName: 'Charlie Smith', status: 'Absent', checkIn: '-', checkOut: '-' },
  { id: '4', date: '2026-07-04', employeeName: 'Diana Prince', status: 'On Leave', checkIn: '-', checkOut: '-' },
  { id: '5', date: '2026-07-04', employeeName: 'Evan Wright', status: 'Present', checkIn: '08:55 AM', checkOut: '05:00 PM' },
]

let leaveSummary = {
  total: 12,
  used: 4,
  remaining: 8,
}

let leaveRequests = [
  { id: '1', startDate: '2026-07-10', endDate: '2026-07-12', type: 'Annual', reason: 'Family trip to Japan', status: 'Approved' },
  { id: '2', startDate: '2026-07-20', endDate: '2026-07-21', type: 'Sick', reason: 'Dental surgery', status: 'Pending' },
]

let employees = [
  { id: '1', name: 'Alice Vance', role: 'Senior Frontend Developer', department: 'Engineering', email: 'alice.vance@company.com', avatar: 'AV' },
  { id: '2', name: 'Bob Vance', role: 'Product Manager', department: 'Product', email: 'bob.vance@company.com', avatar: 'BV' },
  { id: '3', name: 'Charlie Smith', role: 'UI/UX Designer', department: 'Design', email: 'charlie.smith@company.com', avatar: 'CS' },
  { id: '4', name: 'Diana Prince', role: 'QA Lead', department: 'Engineering', email: 'diana.prince@company.com', avatar: 'DP' },
  { id: '5', name: 'Evan Wright', role: 'DevOps Engineer', department: 'Engineering', email: 'evan.wright@company.com', avatar: 'EW' },
]

let announcements = [
  {
    id: '1',
    title: 'New Health Insurance Policy 2026',
    date: '2026-07-01',
    content: 'We are thrilled to announce a partnership with a new health insurance provider starting August 1st. This new plan will cover comprehensive dental, vision, mental health counseling sessions up to 10 per year, and an enhanced wellness stipend for gym memberships or fitness classes. Please attend the All-Hands meeting this Friday at 10 AM to learn how to register and review the detailed benefits document.'
  },
  {
    id: '2',
    title: 'Office Renovation Updates',
    date: '2026-06-28',
    content: 'Starting next week, the 3rd-floor layout will undergo renovation to set up new collaborative work pods and quiet focus zones. Work on the floor will take place mostly after hours to minimize disruption. However, please be prepared for occasional noise during the day. The project is expected to finish in 3 weeks, and we appreciate your patience.'
  }
]

export const handlers = [
  // Attendance Endpoints
  http.get('/api/attendance', () => {
    return HttpResponse.json(attendanceData)
  }),

  // Leave Endpoints
  http.get('/api/leaves', () => {
    return HttpResponse.json({
      summary: leaveSummary,
      requests: leaveRequests,
    })
  }),

  http.post('/api/leaves', async ({ request }) => {
    const body = (await request.json()) as { startDate: string; endDate: string; type: string; reason: string }
    const newRequest = {
      id: String(leaveRequests.length + 1),
      startDate: body.startDate,
      endDate: body.endDate,
      type: body.type,
      reason: body.reason,
      status: 'Pending',
    }

    leaveRequests = [newRequest, ...leaveRequests]
    // Calculate leave days (simplified diff calculation)
    const start = new Date(body.startDate)
    const end = new Date(body.endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

    leaveSummary.used += diffDays
    leaveSummary.remaining = Math.max(0, leaveSummary.total - leaveSummary.used)

    return HttpResponse.json(newRequest, { status: 201 })
  }),

  // Employees Directory Endpoints
  http.get('/api/employees', () => {
    return HttpResponse.json(employees)
  }),

  // Announcements Endpoints
  http.get('/api/announcements', () => {
    return HttpResponse.json(announcements)
  }),

  // AI Announcement Summarizer (mocking a smart summary generated on the server)
  http.post('/api/announcements/:id/summarize', ({ params }) => {
    const { id } = params
    const announcement = announcements.find((a) => a.id === id)
    if (!announcement) {
      return new HttpResponse('Not Found', { status: 404 })
    }

    // Generate a bullet summary based on the announcement's text content
    let summaryBullets: string[] = []
    if (id === '1') {
      summaryBullets = [
        'New health insurance partnership starting August 1st.',
        'Covers comprehensive dental, vision, and mental health (10 sessions/year).',
        'Includes a new wellness stipend for gym or fitness classes.',
        'Registration details will be discussed at the All-Hands on Friday at 10 AM.'
      ]
    } else if (id === '2') {
      summaryBullets = [
        '3rd-floor layout will undergo renovation starting next week.',
        'Adding collaborative work pods and quiet focus zones.',
        'Renovation mostly occurs after hours, project timeline is 3 weeks.',
        'Expect minor noise during daytime hours.'
      ]
    } else {
      summaryBullets = [
        `Summary for ${announcement.title}:`,
        announcement.content.substring(0, 100) + '...'
      ]
    }

    return HttpResponse.json({ summaryBullets })
  }),
]
