'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Lock } from 'lucide-react';

import { TRACKS, lessonsByTrack, firstLessonId, type TrackId } from '@/lib/curriculum';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { trackStyle } from '@/components/ui/trackStyle';

export default function TrackPage() {
  const params = useParams<{ track: string }>();
  const router = useRouter();
  const track = params.track as TrackId;

  const t = TRACKS.find((x) => x.id === track);
  const lessons = lessonsByTrack(track);
  const st = trackStyle(track);

  if (!t) {
    return <div className="text-center py-20 text-slate-400">Track not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" /> DSUC - Academy
      </Link>

      <header>
        <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase mb-3 border ${st.badge} bg-transparent`}>
          {t.title} Track
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold font-display text-white mb-2">{t.subtitle}</h1>
        <p className="text-slate-400 text-lg">{t.subtitle}</p>
      </header>

      <div className="space-y-4">
        {lessons.length > 0 ? (
          lessons.map((l, index) => (
            <Card key={l.id} hoverEffect={false} className="group hover:border-white/20 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 border border-slate-700 flex items-center justify-center font-bold text-lg group-hover:bg-indigo-500/20 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-colors font-display">
                    {index + 1}
                  </div>
                </div>

                <div className="flex-grow">
                  <h3 className="text-xl font-bold text-white mb-1">{l.title}</h3>
                  <p className="text-slate-400 text-sm">~{l.minutes} min · quiz included</p>
                </div>

                <div className="flex-shrink-0 pt-2 sm:pt-0">
                  <Button onClick={() => router.push(`/learn/${track}/${l.id}`)} variant="secondary" size="sm" className="group-hover:bg-white group-hover:text-slate-900">
                    Start <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-12 text-slate-500 bg-slate-800/30 rounded-3xl border border-dashed border-slate-700">
            No modules available yet for this track.
          </div>
        )}

        <div className="pt-4">
          {lessons.length ? (
            <Button onClick={() => router.push(`/learn/${track}/${firstLessonId(track)}`)} variant="primary" size="md">
              Start track <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button disabled variant="ghost" size="md">
              <Lock className="w-4 h-4 mr-2" /> Locked
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
