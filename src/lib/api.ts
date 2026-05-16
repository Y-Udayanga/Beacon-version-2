const API_BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...options?.headers,
    },
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.message || `HTTP ${res.status}`)
  }
  return res.json()
}

export interface EmergencyReport {
  image?: File
  audio?: Blob
  description?: string
  location_lat?: number
  location_lng?: number
  reporter_phone?: string
}

export interface TriageResult {
  id: string
  severity: number
  category: string
  threats_detected: string[]
  translated_text: string
  detected_language: string
  recommended_actions: string[]
  first_aid_instructions: string
  dispatched_units?: Array<{
    unit_type: string
    eta_minutes: number
  }>
}

export interface Emergency {
  id: string
  created_at: string
  status: string
  severity: number
  category: string
  description: string
  location_lat: number
  location_lng: number
  location_address: string
  audio_url: string
  image_url: string
  translated_text: string
  threat_assessment: Record<string, unknown>
  first_aid_instructions: string
  reporter_phone: string
  reporter_language: string
  tags: Record<string, unknown>
}

export interface MissingPersonReport {
  name: string
  estimated_age: string
  gender: string
  description: string
  clothing_description: string
  last_seen_location: string
  last_seen_time: string
  image?: File
  reporter_name: string
  reporter_contact: string
}

export interface ExtractedTags {
  estimated_age: string
  gender: string
  hair_color: string
  clothing: Array<{ type: string; color: string }>
  distinguishing_features: string[]
  build: string
}

export const api = {
  async submitEmergency(report: EmergencyReport): Promise<TriageResult> {
    const formData = new FormData()
    if (report.image) formData.append('image', report.image)
    if (report.audio) formData.append('audio', report.audio, 'recording.webm')
    if (report.description) formData.append('description', report.description)
    if (report.location_lat) formData.append('location_lat', String(report.location_lat))
    if (report.location_lng) formData.append('location_lng', String(report.location_lng))
    if (report.reporter_phone) formData.append('reporter_phone', report.reporter_phone)

    const res = await fetch(`${API_BASE}/emergency/report`, {
      method: 'POST',
      body: formData,
    })
    if (!res.ok) throw new Error('Failed to submit emergency')
    return res.json()
  },

  async getEmergencies(status?: string): Promise<Emergency[]> {
    const params = status ? `?status=${status}` : ''
    return request(`/emergencies${params}`)
  },

  async updateEmergency(id: string, data: Partial<Emergency>): Promise<Emergency> {
    return request(`/emergencies/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  },

  async submitMissingPerson(report: MissingPersonReport): Promise<{ id: string; extracted_tags: ExtractedTags }> {
    const formData = new FormData()
    Object.entries(report).forEach(([key, value]) => {
      if (value instanceof File) formData.append(key, value)
      else if (value) formData.append(key, String(value))
    })

    const res = await fetch(`${API_BASE}/missing-person`, {
      method: 'POST',
      body: formData,
    })
    if (!res.ok) throw new Error('Failed to submit missing person report')
    return res.json()
  },

  async extractPersonTags(image: File): Promise<ExtractedTags> {
    const formData = new FormData()
    formData.append('image', image)
    const res = await fetch(`${API_BASE}/missing-person/extract`, {
      method: 'POST',
      body: formData,
    })
    if (!res.ok) throw new Error('Failed to extract tags')
    return res.json()
  },

  async dispatch(emergencyId: string, unitType: string): Promise<{ id: string }> {
    return request('/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emergency_id: emergencyId, unit_type: unitType }),
    })
  },
}
