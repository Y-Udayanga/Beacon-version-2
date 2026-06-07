import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Search, UserSearch, Calendar, MapPin, Loader2 } from 'lucide-react'
import { useMissingPersons } from '@/hooks/useMissingPersons'
import { timeAgo } from '@/lib/utils'

export default function MissingPersonsDashboard() {
  const { missingPersons, loading } = useMissingPersons()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredPersons = missingPersons.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.last_seen_location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.extracted_tags?.distinguishing_features?.some(f => f.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/dispatcher"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={16} />
              Dispatcher Dashboard
            </Link>
            <div className="w-px h-5 bg-border" />
            <h1 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
              <UserSearch size={18} className="text-amber-500" />
              Missing Persons Database
            </h1>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-border/30 bg-muted/20">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, location, or features..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          </div>
        ) : filteredPersons.length === 0 ? (
          <div className="text-center py-20">
            <UserSearch size={48} className="mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium text-foreground">No records found</h3>
            <p className="text-muted-foreground">Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {filteredPersons.map(person => (
                <motion.div
                  key={person.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Image Section */}
                  <div className="aspect-[4/3] bg-muted relative border-b border-border">
                    {person.image_url ? (
                      <img 
                        src={person.image_url} 
                        alt={person.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/50">
                        <UserSearch size={32} className="mb-2" />
                        <span className="text-xs font-medium">No Image</span>
                      </div>
                    )}
                    <div className="absolute top-3 right-3 px-2 py-1 bg-background/80 backdrop-blur text-xs font-semibold rounded text-amber-500 uppercase tracking-wider border border-amber-500/20 shadow-sm">
                      {person.status}
                    </div>
                  </div>

                  {/* Details Section */}
                  <div className="p-4">
                    <h2 className="text-lg font-bold text-foreground truncate mb-1">
                      {person.name || 'Unknown Identity'}
                    </h2>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {person.estimated_age && (
                        <span className="px-2 py-0.5 bg-muted text-xs rounded font-medium">
                          Age: {person.estimated_age}
                        </span>
                      )}
                      {person.gender && (
                        <span className="px-2 py-0.5 bg-muted text-xs rounded font-medium capitalize">
                          {person.gender}
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 mb-4">
                      {person.last_seen_location && (
                        <div className="flex items-start gap-2 text-sm text-muted-foreground">
                          <MapPin size={14} className="mt-0.5 shrink-0" />
                          <span className="line-clamp-2">{person.last_seen_location}</span>
                        </div>
                      )}
                      {person.last_seen_time && (
                        <div className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Calendar size={14} className="mt-0.5 shrink-0" />
                          <span>{new Date(person.last_seen_time).toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    {/* AI Tags Section */}
                    {person.extracted_tags && (
                      <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-3">
                        <p className="text-xs font-semibold text-amber-600 mb-2 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                          AI Extracted Features
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {person.extracted_tags.hair_color && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-background border border-border rounded text-muted-foreground">
                              {person.extracted_tags.hair_color} hair
                            </span>
                          )}
                          {person.extracted_tags.build && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-background border border-border rounded text-muted-foreground">
                              {person.extracted_tags.build} build
                            </span>
                          )}
                          {person.extracted_tags.clothing?.map((item: any, i: number) => (
                            <span key={i} className="text-[10px] px-1.5 py-0.5 bg-background border border-border rounded text-muted-foreground">
                              {item.color} {item.type}
                            </span>
                          ))}
                          {person.extracted_tags.distinguishing_features?.map((feature: string, i: number) => (
                            <span key={i} className="text-[10px] px-1.5 py-0.5 bg-background border border-border rounded text-muted-foreground max-w-[150px] truncate">
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 pt-3 border-t border-border flex justify-between items-center text-xs text-muted-foreground">
                      <span>Reported: {timeAgo(person.created_at)}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  )
}
