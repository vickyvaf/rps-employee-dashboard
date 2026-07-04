import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'

export interface AttendanceRecord {
  id: string
  date: string
  employeeName: string
  status: string
  checkIn: string
  checkOut: string
}

export interface LeaveRequest {
  id: string
  startDate: string
  endDate: string
  type: string
  reason: string
  status: string
}

export interface LeaveSummary {
  total: number
  used: number
  remaining: number
}

export interface LeaveData {
  summary: LeaveSummary
  requests: LeaveRequest[]
}

export interface Employee {
  id: string
  name: string
  role: string
  department: string
  email: string
  avatar: string
}

export interface Announcement {
  id: string
  title: string
  date: string
  content: string
}

// Queries
export function useAttendanceQuery() {
  return useQuery<AttendanceRecord[]>({
    queryKey: ['attendance'],
    queryFn: async () => {
      const response = await apiClient.get('/api/attendance')
      return response.data
    },
  })
}

export function useLeavesQuery() {
  return useQuery<LeaveData>({
    queryKey: ['leaves'],
    queryFn: async () => {
      const response = await apiClient.get('/api/leaves')
      return response.data
    },
  })
}

export function useEmployeesQuery() {
  return useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await apiClient.get('/api/employees')
      return response.data
    },
  })
}

export function useAnnouncementsQuery() {
  return useQuery<Announcement[]>({
    queryKey: ['announcements'],
    queryFn: async () => {
      const response = await apiClient.get('/api/announcements')
      return response.data
    },
  })
}

// Mutations
export function useRequestLeaveMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (newLeave: Omit<LeaveRequest, 'id' | 'status'>) => {
      const response = await apiClient.post('/api/leaves', newLeave)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] })
    },
  })
}

export function useSummarizeAnnouncementMutation() {
  return useMutation<string[], Error, string>({
    mutationFn: async (announcementId: string) => {
      const response = await apiClient.post(`/api/announcements/${announcementId}/summarize`)
      return response.data.summaryBullets
    },
  })
}
