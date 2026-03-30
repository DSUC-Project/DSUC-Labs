import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Lock } from 'lucide-react';

import { TRACKS, lessonsByTrack, firstLessonId, type TrackId } from '@/lib/academy/curriculum';
import { Card } from '@/components/academy/ui/Card';
import { Button } from '@/components/academy/ui/Button';
import { trackStyle } from '@/components/academy/ui/trackStyle';

function isTrackId(value: string | undefined): value is TrackId {
  return value === 'genin' || value === 'chunin' || value === 'jonin';
}

export function AcademyTrack() {
  const params = useParams<{ track: string }>();
  const navigate = useNavigate();

  if (!isTrackId(params.track)) {
    return <div className="text-center py-20 text-slate-400">Track not found</div>;
  }

  const track = params.track;
  const trackInfo = TRACKS.find((item) => item.id === track);
  const lessons = lessonsByTrack(track);
  const style = trackStyle(track);

  if (!trackInfo) {
    return <div className="text-center py-20 text-slate-400">Track not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 academy-scope">
      <Link to="/academy" className="inline-flex items-center text-sm font-medium text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" /> DSUC - Academy
      </Link>

      <header>
        <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase mb-3 border ${style.badge} bg-transparent`}>
          {trackInfo.title} Track
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold font-display text-white mb-2">{trackInfo.title}</h1>
        <p className="text-slate-400 text-lg">{trackInfo.subtitle}</p>
      </header>

      <div className="space-y-4">
        {lessons.length > 0 ? (
          lessons.map((lesson, index) => (
            <Card key={lesson.id} hoverEffect={false} className="group hover:border-white/20 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 border border-slate-700 flex items-center justify-center font-bold text-lg group-hover:bg-indigo-500/20 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-colors font-display">
                    {index + 1}
                  </div>
                </div>

                <div className="flex-grow">
                  <h3 className="text-xl font-bold text-white mb-1">{lesson.title}</h3>
                  <p className="text-slate-400 text-sm">~{lesson.minutes} min · quiz included</p>
                </div>

                <div className="flex-shrink-0 pt-2 sm:pt-0">
                  <Button
                    onClick={() => navigate(`/academy/learn/${track}/${lesson.id}`)}
                    variant="secondary"
                    size="sm"
                    className="group-hover:bg-white group-hover:text-slate-900"
                  >
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
            <Button onClick={() => navigate(`/academy/learn/${track}/${firstLessonId(track)}`)} variant="primary" size="md">
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
