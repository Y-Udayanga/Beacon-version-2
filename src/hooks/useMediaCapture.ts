import { useState, useRef, useCallback } from 'react'

interface MediaCaptureState {
  isCapturing: boolean
  image: File | null
  audio: Blob | null
  imagePreview: string | null
  error: string | null
}

export function useMediaCapture() {
  const [state, setState] = useState<MediaCaptureState>({
    isCapturing: false,
    image: null,
    audio: null,
    imagePreview: null,
    error: null,
  })

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  const startCapture = useCallback(async () => {
    try {
      setState(s => ({ ...s, isCapturing: true, error: null }))

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: true,
      })
      streamRef.current = stream

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      mediaRecorder.start(100)

      const videoTrack = stream.getVideoTracks()[0]
      const imageCapture = new ImageCapture(videoTrack)

      await new Promise(resolve => setTimeout(resolve, 500))
      const blob = await imageCapture.takePhoto()
      const file = new File([blob], 'panic-snap.jpg', { type: 'image/jpeg' })
      const preview = URL.createObjectURL(blob)

      setState(s => ({ ...s, image: file, imagePreview: preview }))
    } catch (err) {
      setState(s => ({
        ...s,
        isCapturing: false,
        error: err instanceof Error ? err.message : 'Failed to access camera/microphone',
      }))
    }
  }, [])

  const stopCapture = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current
      if (!recorder || recorder.state === 'inactive') {
        setState(s => ({ ...s, isCapturing: false }))
        resolve(null)
        return
      }

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
        })
        setState(s => ({ ...s, audio: audioBlob, isCapturing: false }))

        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop())
          streamRef.current = null
        }

        resolve(audioBlob)
      }

      recorder.stop()
    })
  }, [])

  const reset = useCallback(() => {
    if (state.imagePreview) URL.revokeObjectURL(state.imagePreview)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setState({
      isCapturing: false,
      image: null,
      audio: null,
      imagePreview: null,
      error: null,
    })
  }, [state.imagePreview])

  return { ...state, startCapture, stopCapture, reset }
}
