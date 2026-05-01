import React, { useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, ExternalLink, MapPin, Plus, Ticket, Users, X } from 'lucide-react';

import { useUiPreview } from '@/components/Layout';
import { ActionButton, EmptyState, PageHeader, StatusBadge, SurfaceCard } from '@/components/ui/Primitives';
import { useStore } from '@/store/useStore';
import type { Event } from '@/types';

export function Events() {
  const { events, addEvent, currentUser, addToast } = useStore();
  const uiPreview = useUiPreview();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const canManage = uiPreview.canManageEvents;

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [events]
  );

  const handleAddClick = () => {
    if (!canManage) {
      addToast('Event publishing is locked for this role preview.', 'info');
      return;
    }
    if (!currentUser && uiPreview.previewOnly) {
      addToast('Preview unlocked. Real authentication is still required to submit.', 'info');
    }
    setIsModalOpen(true);
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <PageHeader
        eyebrow="Events"
        title="Ticket-style event cards with real links."
        subtitle="This board keeps date, status, location, and registration behavior obvious so every event card feels actionable."
        actions={
          <>
            <StatusBadge tone="info">{events.length} scheduled</StatusBadge>
            <ActionButton variant={canManage ? 'primary' : 'ghost'} onClick={handleAddClick}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Event
            </ActionButton>
          </>
        }
      />

      {sortedEvents.length === 0 ? (
        <EmptyState
          title="No events scheduled"
          message="The calendar is empty right now. When events are published, they will appear here as compact ticket-style cards."
        />
      ) : (
        <div className="grid gap-5">
          {sortedEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      <AddEventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={addEvent}
      />
    </div>
  );
}

function EventCard({ event }: { event: Event }) {
  const lumaLink = String((event as any).luma_link || (event as any).lumaLink || '').trim();
  const date = event.date ? new Date(event.date) : null;
  const day = date ? String(date.getDate()).padStart(2, '0') : '--';
  const month = date ? date.toLocaleString('en-US', { month: 'short' }) : '---';

  return (
    <SurfaceCard className="overflow-hidden p-0">
      <div className="grid gap-0 md:grid-cols-[110px_minmax(0,1fr)]">
        <div className="flex flex-col items-center justify-center border-b border-border-main bg-main-bg px-4 py-6 text-center md:border-b-0 md:border-r">
          <p className="font-heading text-4xl font-semibold tracking-tight text-text-main">{day}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.22em] text-text-muted">{month}</p>
        </div>

        <div className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge>{event.type}</StatusBadge>
                <StatusBadge tone="info">{event.status || 'Published'}</StatusBadge>
              </div>
              <h3 className="font-heading text-2xl font-semibold tracking-tight text-text-main">
                {event.title}
              </h3>
              <p className="text-sm leading-7 text-text-muted">
                {event.time ? `${event.time}` : 'Time to be announced'}
              </p>
            </div>

            <div className="rounded-[22px] border border-border-main bg-main-bg p-4 text-sm text-text-muted">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" aria-hidden="true" />
                <span>{event.attendees} expected</span>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-border-main pt-5 text-sm text-text-muted">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>{event.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>{event.location}</span>
            </div>
            {lumaLink ? (
              <a href={lumaLink} target="_blank" rel="noopener noreferrer" className="ml-auto">
                <ActionButton variant="secondary">
                  <Ticket className="h-4 w-4" aria-hidden="true" />
                  Register
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </ActionButton>
              </a>
            ) : (
              <span className="ml-auto text-sm text-text-muted">Registration link pending</span>
            )}
          </div>
        </div>
      </div>
    </SurfaceCard>
  );
}

function AddEventModal({
  isOpen,
  onClose,
  onAdd,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (event: Event) => void;
}) {
  if (!isOpen) {
    return null;
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    onAdd({
      id: Math.random().toString(),
      title: String(formData.get('title') || ''),
      date: String(formData.get('date') || ''),
      time: String(formData.get('time') || ''),
      location: String(formData.get('location') || ''),
      luma_link: String(formData.get('luma_link') || ''),
      type: 'Workshop',
      attendees: 0,
    });
    onClose();
  };

  return ReactDOM.createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, y: 14, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 14, scale: 0.96 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-2xl rounded-[32px] border border-border-main bg-surface-elevated p-7 shadow-soft-xl"
          onClick={(innerEvent) => innerEvent.stopPropagation()}
        >
          <button type="button" onClick={onClose} className="icon-button absolute right-5 top-5">
            <X className="h-4 w-4" />
          </button>

          <div className="space-y-2">
            <p className="section-eyebrow">Event Intake</p>
            <h2 className="font-heading text-3xl font-semibold tracking-tight text-text-main">
              Publish an event
            </h2>
            <p className="text-sm leading-6 text-text-muted">
              This keeps the real event creation logic intact while giving the modal a cleaner production surface.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
            <Field label="Event title">
              <input name="title" required className="input-shell" placeholder="DSUC Builder Session #01" />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Date">
                <input name="date" type="date" required className="input-shell" />
              </Field>
              <Field label="Time">
                <input name="time" type="time" required className="input-shell" />
              </Field>
            </div>
            <Field label="Location">
              <input name="location" required className="input-shell" placeholder="Da Nang, Vietnam" />
            </Field>
            <Field label="Registration URL">
              <input name="luma_link" type="url" required className="input-shell" placeholder="https://lu.ma/..." />
            </Field>
            <div className="mt-2 flex justify-end gap-3">
              <ActionButton type="button" variant="ghost" onClick={onClose}>
                Cancel
              </ActionButton>
              <ActionButton type="submit">Create Event</ActionButton>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-[11px] uppercase tracking-[0.18em] text-text-muted">{label}</span>
      {children}
    </label>
  );
}
