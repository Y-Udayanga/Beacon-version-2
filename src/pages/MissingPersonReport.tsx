import { useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, X, User, Search, MapPin, Clock, Camera,
  ArrowLeft, Loader2, Check, Tag
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { api, type ExtractedTags } from '@/lib/api'

type PageState = 'form' | 'extracting' | 'preview'

export default function MissingPersonReport() {
  const [state, setState] = useState<PageState>('form')
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [extractedTags, setExtractedTags] = useState<ExtractedTags | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const [form, setForm] = useState({
    name: '',
    estimated_age: '',
    gender: '',
    description: '',
    clothing_description: '',
    last_seen_location: '',
    last_seen_time: '',
    reporter_name: '',
    reporter_contact: '',
  })

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }
    setImage(file)
    setImagePreview(URL.createObjectURL(file))
    setError(null)

    setState('extracting')
    try {
      const tags = await api.extractPersonTags(file)
      setExtractedTags(tags)
      setForm(f => ({
        ...f,
        estimated_age: tags.estimated_age || f.estimated_age,
        gender: tags.gender || f.gender,
        clothing_description: tags.clothing?.map(c => `${c.color} ${c.type}`).join(', ') || f.clothing_description,
      }))
      setState('form')
    } catch {
      setState('form')
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError('Please enter the person\'s name')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await api.submitMissingPerson({
        ...form,
        image: image || undefined,
      })
      setSubmitted(true)
    } catch {
      setError('Failed to submit report. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6"
          >
            <Check className="w-10 h-10 text-green-500" />
          </motion.div>
          <h1 className="text-2xl font-bold text-foreground mb-3">Report Submitted</h1>
          <p className="text-muted-foreground mb-8">
            Your missing person report has been submitted and is being processed by our AI system.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              to="/victim"
              className="px-6 py-3 rounded-xl bg-destructive text-white font-medium hover:bg-destructive/90 transition-colors"
            >
              Report Emergency
            </Link>
            <Link
              to="/"
              className="px-6 py-3 rounded-xl bg-secondary text-foreground font-medium hover:bg-secondary/80 transition-colors"
            >
              Go Home
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/victim" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-amber-500" />
            <h1 className="text-lg font-semibold text-foreground">Missing Person Report</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left: Photo upload + extracted tags */}
          <div className="space-y-4">
            {/* Upload Area */}
            <motion.div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all",
                dragOver ? "border-primary bg-primary/10" : "border-border hover:border-muted-foreground",
                imagePreview && "p-2"
              )}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFile(file)
                }}
              />

              <AnimatePresence mode="wait">
                {state === 'extracting' ? (
                  <motion.div
                    key="extracting"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-8"
                  >
                    <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-3" />
                    <p className="text-foreground font-medium">AI is analyzing the photo...</p>
                    <p className="text-sm text-muted-foreground mt-1">Extracting identifying features</p>
                  </motion.div>
                ) : imagePreview ? (
                  <motion.div
                    key="preview"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="relative"
                  >
                    <img
                      src={imagePreview}
                      alt="Uploaded"
                      className="w-full h-64 object-cover rounded-xl"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setImage(null)
                        setImagePreview(null)
                        setExtractedTags(null)
                      }}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                    <div className="absolute bottom-2 left-2 px-3 py-1 rounded-full bg-black/60 text-xs text-white flex items-center gap-1">
                      <Camera className="w-3 h-3" />
                      Click to replace
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="upload"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-foreground font-medium">Upload a photo</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Drag & drop or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground mt-3">
                      AI will automatically extract identifying features
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Extracted Tags */}
            <AnimatePresence>
              {extractedTags && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-card rounded-2xl border border-border p-4"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">AI-Extracted Features</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {extractedTags.estimated_age && (
                      <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium">
                        Age: {extractedTags.estimated_age}
                      </span>
                    )}
                    {extractedTags.gender && (
                      <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-medium">
                        {extractedTags.gender}
                      </span>
                    )}
                    {extractedTags.hair_color && (
                      <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
                        Hair: {extractedTags.hair_color}
                      </span>
                    )}
                    {extractedTags.build && (
                      <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                        Build: {extractedTags.build}
                      </span>
                    )}
                    {extractedTags.clothing?.map((item, i) => (
                      <span key={i} className="px-3 py-1 rounded-full bg-pink-500/20 text-pink-400 text-xs font-medium">
                        {item.color} {item.type}
                      </span>
                    ))}
                    {extractedTags.distinguishing_features?.map((feat, i) => (
                      <span key={i} className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-medium">
                        {feat}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Preview Card */}
            <AnimatePresence>
              {form.name && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-2xl border border-amber-500/30 p-4"
                >
                  <p className="text-xs text-amber-500 font-medium mb-3 uppercase tracking-wider">Report Preview</p>
                  <div className="flex gap-3">
                    {imagePreview && (
                      <img src={imagePreview} alt="" className="w-16 h-16 rounded-xl object-cover" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">{form.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {[form.estimated_age, form.gender].filter(Boolean).join(' · ')}
                      </p>
                      {form.last_seen_location && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {form.last_seen_location}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: Form */}
          <div className="space-y-4">
            <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
              <h2 className="text-foreground font-semibold flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                Person Details
              </h2>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Full Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="Enter the person's full name"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Estimated Age</label>
                  <input
                    type="text"
                    value={form.estimated_age}
                    onChange={e => setForm(f => ({ ...f, estimated_age: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="e.g., 25-30"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Gender</label>
                  <select
                    value={form.gender}
                    onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                  placeholder="Physical description, distinguishing features..."
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Clothing Description</label>
                <input
                  type="text"
                  value={form.clothing_description}
                  onChange={e => setForm(f => ({ ...f, clothing_description: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="What were they wearing?"
                />
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
              <h2 className="text-foreground font-semibold flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Last Seen
              </h2>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Location</label>
                <input
                  type="text"
                  value={form.last_seen_location}
                  onChange={e => setForm(f => ({ ...f, last_seen_location: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="Where were they last seen?"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Date & Time</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="datetime-local"
                    value={form.last_seen_time}
                    onChange={e => setForm(f => ({ ...f, last_seen_time: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
              <h2 className="text-foreground font-semibold flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                Your Contact Info
              </h2>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Your Name</label>
                <input
                  type="text"
                  value={form.reporter_name}
                  onChange={e => setForm(f => ({ ...f, reporter_name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Phone / Email</label>
                <input
                  type="text"
                  value={form.reporter_contact}
                  onChange={e => setForm(f => ({ ...f, reporter_contact: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="How can we reach you?"
                />
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-destructive text-sm text-center"
              >
                {error}
              </motion.p>
            )}

            <motion.button
              onClick={handleSubmit}
              disabled={submitting || !form.name.trim()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "w-full py-4 rounded-2xl font-semibold text-white transition-all",
                submitting || !form.name.trim()
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25"
              )}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting Report...
                </span>
              ) : (
                'Submit Missing Person Report'
              )}
            </motion.button>
          </div>
        </div>
      </main>
    </div>
  )
}
