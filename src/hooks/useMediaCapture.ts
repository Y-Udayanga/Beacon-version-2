import { useState, useRef, useCallback } from 'react'

interface MediaCaptureState {
  isCapturing: boolean
  image: File | null
  audio: Blob | null
  imagePreview: string | null
  error: string | null
}

/**
 * Determine a supported mimeType for MediaRecorder.
 * The stream may contain video+audio tracks, so we must NOT use an
 * audio-only mimeType — that causes "Failed to execute 'start'" errors.
 * We try video containers first, then fall back to letting the browser choose.
 */
function getSupportedMimeType(stream: MediaStream): string | undefined {
  const hasVideo = stream.getVideoTracks().length > 0

  if (hasVideo) {
    // Prefer video containers when stream includes video tracks
    const videoCandidates = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4',
    ]
    for (const mime of videoCandidates) {
      if (MediaRecorder.isTypeSupported(mime)) return mime
    }
  } else {
    // Audio-only stream
    const audioCandidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
    ]
    for (const mime of audioCandidates) {
      if (MediaRecorder.isTypeSupported(mime)) return mime
    }
  }

  // Let the browser pick its default
  return undefined
}

/**
 * Capture a still frame from a video track.
 * Uses ImageCapture API when available, otherwise falls back to
 * drawing a <video> element onto a <canvas>.
 */
async function captureFrame(videoTrack: MediaStreamTrack): Promise<Blob> {
  // Prefer the ImageCapture API (Chrome, Edge, Android)
  if (typeof ImageCapture !== 'undefined') {
    try {
      const ic = new ImageCapture(videoTrack)
      // Give the camera a moment to warm up
      await new Promise(r => setTimeout(r, 400))
      return await ic.takePhoto()
    } catch {
      // Fall through to canvas approach
    }
  }

  // Canvas fallback (Firefox, Safari, older browsers)
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.srcObject = new MediaStream([videoTrack])
    video.muted = true
    video.playsInline = true

    video.onloadedmetadata = () => {
      video.play().then(() => {
        // Wait a frame so the video actually renders
        requestAnimationFrame(() => {
          const canvas = document.createElement('canvas')
          canvas.width = video.videoWidth || 640
          canvas.height = video.videoHeight || 480
          const ctx = canvas.getContext('2d')
          if (!ctx) return reject(new Error('Canvas 2D context unavailable'))
          ctx.drawImage(video, 0, 0)
          canvas.toBlob(
            blob => {
              video.srcObject = null
              blob ? resolve(blob) : reject(new Error('toBlob returned null'))
            },
            'image/jpeg',
            0.85,
          )
        })
      }).catch(reject)
    }

    video.onerror = () => reject(new Error('Video element error'))
  })
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
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  const startCapture = useCallback(async () => {
    try {
      setState(s => ({ ...s, isCapturing: true, error: null }))

      // Request camera + mic access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: true,
      })
      streamRef.current = stream

      // ── Start recording ────────────────────────────────────
      const mimeType = getSupportedMimeType(stream)
      const recorderOptions: MediaRecorderOptions = {}
      if (mimeType) recorderOptions.mimeType = mimeType

      const mediaRecorder = new MediaRecorder(stream, recorderOptions)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.start(250) // collect chunks every 250ms

      // ── Take a snapshot ────────────────────────────────────
      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack) {
        try {
          const blob = await captureFrame(videoTrack)
          const file = new File([blob], 'panic-snap.jpg', { type: 'image/jpeg' })
          const preview = URL.createObjectURL(blob)
          setState(s => ({ ...s, image: file, imagePreview: preview }))
        } catch {
          // Photo capture failed — not fatal, audio still recording
          console.warn('Image capture failed, continuing with audio only')
        }
      }
    } catch (err) {
      // Clean up on failure
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
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
        // Build the blob using the same mimeType the recorder was using
        const blobType = recorder.mimeType || 'audio/webm'
        const audioBlob = new Blob(chunksRef.current, { type: blobType })
        setState(s => ({ ...s, audio: audioBlob, isCapturing: false }))

        // Release hardware
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
