import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Star, Pencil, Plus, X, Trash2, Check, StickyNote } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface StickyNote {
  id: string;
  title: string;
  content: string;
  color: string;
  isFav: boolean;
  updatedAt: Date;
}

// ── Color palette matching the reference image ────────────────────────────────
const COLORS = [
  { id: 'yellow',  bg: '#FBBF24', dark: '#B45309' },
  { id: 'coral',   bg: '#FB923C', dark: '#C2410C' },
  { id: 'lime',    bg: '#A3E635', dark: '#3F6212' },
  { id: 'purple',  bg: '#C084FC', dark: '#6B21A8' },
  { id: 'cyan',    bg: '#22D3EE', dark: '#0E7490' },
  { id: 'pink',    bg: '#F472B6', dark: '#9D174D' },
  { id: 'green',   bg: '#4ADE80', dark: '#166534' },
];

const getColor = (id: string) => COLORS.find(c => c.id === id) ?? COLORS[0];

const fmt = (d: Date) =>
  new Date(d).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

// ── Seed notes ────────────────────────────────────────────────────────────────
const SEEDS: StickyNote[] = [
  { id: 's1', title: 'GitHub webhook sync', content: 'Verify the webhook fires on every PR merge to staging branch.', color: 'yellow', isFav: true,  updatedAt: new Date() },
  { id: 's2', title: 'Sprint checklist',     content: '- Review subtask blockers\n- Push evidence commits\n- Update progress score', color: 'coral', isFav: false, updatedAt: new Date(Date.now() - 3600000) },
  { id: 's3', title: 'DB migration note',    content: 'Flush WAL logs before running EF migrations in staging.', color: 'lime',   isFav: false, updatedAt: new Date(Date.now() - 7200000) },
  { id: 's4', title: 'ML latency target',    content: 'Random forest inference must stay under 80 ms p95.', color: 'purple', isFav: false, updatedAt: new Date(Date.now() - 86400000) },
  { id: 's5', title: 'Standup talking pts',  content: 'Ship auth refactor today. Blocked on design review for dashboard v2.', color: 'cyan',   isFav: true,  updatedAt: new Date(Date.now() - 10800000) },
];

function load(): StickyNote[] {
  try {
    const raw = localStorage.getItem('vrd_sticky_v2');
    if (raw) {
      const parsed = JSON.parse(raw) as any[];
      if (Array.isArray(parsed) && parsed.length)
        return parsed.map(n => ({ ...n, updatedAt: new Date(n.updatedAt) }));
    }
  } catch {}
  return SEEDS;
}

function save(notes: StickyNote[]) {
  try { localStorage.setItem('vrd_sticky_v2', JSON.stringify(notes)); } catch {}
}

// ── NoteCard ─────────────────────────────────────────────────────────────────
const NoteCard: React.FC<{
  note: StickyNote;
  onToggleFav: () => void;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ note, onToggleFav, onEdit, onDelete }) => {
  const col = getColor(note.color);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      className="relative rounded-2xl p-4 cursor-pointer select-none group"
      style={{ backgroundColor: col.bg, minHeight: 160 }}
    >
      {/* Dog-ear fold */}
      <div
        className="absolute bottom-0 right-0 w-7 h-7 pointer-events-none"
        style={{
          backgroundColor: col.dark,
          clipPath: 'polygon(100% 0, 0 100%, 100% 100%)',
          borderBottomRightRadius: 12,
          filter: 'drop-shadow(-2px -2px 3px rgba(0,0,0,0.18))',
        }}
      />

      {/* Fav star — top right */}
      <button
        onClick={e => { e.stopPropagation(); onToggleFav(); }}
        className="absolute top-3 right-3 p-1 rounded-full z-10 transition-transform hover:scale-110"
        style={{ backgroundColor: '#000' }}
      >
        <Star
          size={13}
          fill={note.isFav ? '#FBBF24' : 'transparent'}
          stroke={note.isFav ? '#FBBF24' : '#fff'}
        />
      </button>

      {/* Title */}
      <p className="font-bold text-sm leading-snug text-gray-900 pr-8 mb-2 line-clamp-3">
        {note.title || <span className="opacity-40 italic">Untitled</span>}
      </p>

      {/* Content preview */}
      {note.content && (
        <p className="text-xs text-gray-800/80 leading-relaxed line-clamp-3">
          {note.content}
        </p>
      )}

      {/* Bottom row: date + edit */}
      <div className="absolute bottom-3 left-4 right-10 flex items-center justify-between">
        <span className="text-[10px] font-semibold text-gray-700/80">
          {new Date(note.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
        <button
          onClick={e => { e.stopPropagation(); onEdit(); }}
          className="p-1.5 rounded-full transition-transform hover:scale-110"
          style={{ backgroundColor: '#000' }}
          title="Edit note"
        >
          <Pencil size={11} stroke="#fff" />
        </button>
      </div>

      {/* Delete on hover */}
      <button
        onClick={e => { e.stopPropagation(); onDelete(); }}
        className="absolute top-3 left-3 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
        style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
        title="Delete note"
      >
        <Trash2 size={11} stroke="#fff" />
      </button>
    </motion.div>
  );
};

// ── EditModal ─────────────────────────────────────────────────────────────────
const EditModal: React.FC<{
  note: StickyNote;
  isDark: boolean;
  onChange: (updates: Partial<StickyNote>) => void;
  onClose: () => void;
}> = ({ note, isDark, onChange, onClose }) => {
  const col = getColor(note.color);
  const titleRef = useRef<HTMLInputElement>(null);
  useEffect(() => { titleRef.current?.focus(); }, []);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl p-6 shadow-2xl"
        style={{ backgroundColor: col.bg }}
      >
        {/* Color picker row */}
        <div className="flex items-center gap-2 mb-4">
          {COLORS.map(c => (
            <button
              key={c.id}
              onClick={() => onChange({ color: c.id })}
              className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${note.color === c.id ? 'border-black scale-110' : 'border-transparent'}`}
              style={{ backgroundColor: c.bg }}
            />
          ))}
          <button onClick={onClose} className="ml-auto p-1.5 rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <X size={14} stroke="#fff" />
          </button>
        </div>

        {/* Title */}
        <input
          ref={titleRef}
          value={note.title}
          onChange={e => onChange({ title: e.target.value })}
          placeholder="Title…"
          className="w-full bg-transparent font-bold text-lg text-gray-900 placeholder:text-gray-600/50 outline-none border-none mb-3"
        />

        {/* Content */}
        <textarea
          value={note.content}
          onChange={e => onChange({ content: e.target.value })}
          placeholder="Write something…"
          rows={6}
          className="w-full bg-transparent text-sm text-gray-800 placeholder:text-gray-600/50 outline-none border-none resize-none leading-relaxed"
        />

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-black/10">
          <span className="text-[10px] font-semibold text-gray-700/70">{fmt(note.updatedAt)}</span>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: col.dark }}
          >
            <Check size={12} /> Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ── Main Panel ────────────────────────────────────────────────────────────────
interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const DeveloperStickyNotes: React.FC<Props> = ({ isOpen, onClose }) => {
  const { isDark } = useTheme();
  const [notes, setNotes] = useState<StickyNote[]>(load);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<StickyNote | null>(null);

  // Persist on every change
  useEffect(() => { save(notes); }, [notes]);

  const updateNote = (id: string, updates: Partial<StickyNote>) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates, updatedAt: new Date() } : n));
    if (editing?.id === id) setEditing(prev => prev ? { ...prev, ...updates, updatedAt: new Date() } : null);
  };

  const addNote = () => {
    const newNote: StickyNote = {
      id: `note-${Date.now()}`,
      title: '',
      content: '',
      color: COLORS[Math.floor(Math.random() * COLORS.length)].id,
      isFav: false,
      updatedAt: new Date(),
    };
    setNotes(prev => [newNote, ...prev]);
    setEditing(newNote);
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (editing?.id === id) setEditing(null);
  };

  // Sorted: favs first, then by updatedAt desc
  const filtered = notes
    .filter(n => !query || `${n.title} ${n.content}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => {
      if (a.isFav !== b.isFav) return a.isFav ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  return (
    <>
      {/* Edit modal */}
      <AnimatePresence>
        {editing && (
          <EditModal
            note={editing}
            isDark={isDark}
            onChange={updates => {
              updateNote(editing.id, updates);
              setEditing(prev => prev ? { ...prev, ...updates, updatedAt: new Date() } : null);
            }}
            onClose={() => setEditing(null)}
          />
        )}
      </AnimatePresence>

      {/* Side Drawer Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="sticky-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className={`fixed top-0 right-0 bottom-0 z-[100] w-[380px] flex flex-col shadow-2xl ${
              isDark ? 'bg-[#111827]' : 'bg-[#FAFAFA]'
            }`}
            style={{ top: 0 }}
          >
            {/* ── Header ── */}
            <div className={`px-6 pt-6 pb-4 ${isDark ? 'bg-[#111827]' : 'bg-[#FAFAFA]'}`}>
              {/* Search bar */}
              <div className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 mb-5 ${
                isDark ? 'bg-[#1E293B] text-slate-300' : 'bg-white shadow-sm border border-slate-200 text-slate-500'
              }`}>
                <Search size={15} className="flex-shrink-0 opacity-50" />
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search"
                  className={`bg-transparent border-none outline-none text-sm w-full ${
                    isDark ? 'text-slate-200 placeholder:text-slate-500' : 'text-slate-700 placeholder:text-slate-400'
                  }`}
                />
                {query && (
                  <button onClick={() => setQuery('')}>
                    <X size={13} className="opacity-50 hover:opacity-100" />
                  </button>
                )}
              </div>

              {/* Title row */}
              <div className="flex items-end justify-between">
                <h2 className={`text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Notes
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={addNote}
                    className="w-9 h-9 rounded-full bg-black flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
                    title="New note"
                  >
                    <Plus size={18} stroke="#fff" />
                  </button>
                  <button
                    onClick={onClose}
                    className={`w-9 h-9 rounded-full flex items-center justify-center hover:scale-105 transition-transform ${
                      isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-600'
                    }`}
                    title="Close"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Count */}
              <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {filtered.length} note{filtered.length !== 1 ? 's' : ''}
                {notes.some(n => n.isFav) ? ` · ${notes.filter(n => n.isFav).length} starred` : ''}
              </p>
            </div>

            {/* ── Notes grid ── */}
            <div className="flex-1 overflow-y-auto px-5 pb-6">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                  <StickyNote size={36} className="opacity-20" />
                  <p className={`text-sm font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {query ? 'No notes match your search' : 'No notes yet'}
                  </p>
                  {!query && (
                    <button
                      onClick={addNote}
                      className="mt-1 px-4 py-2 bg-black text-white text-xs font-bold rounded-full hover:scale-105 transition-transform"
                    >
                      + Create first note
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <AnimatePresence>
                    {filtered.map(note => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        onToggleFav={() => updateNote(note.id, { isFav: !note.isFav })}
                        onEdit={() => setEditing(note)}
                        onDelete={() => deleteNote(note.id)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DeveloperStickyNotes;
