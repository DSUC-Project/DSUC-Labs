import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, ChevronRight, Flame, Lock, Sparkles, Trophy } from 'lucide-react';

import type { AcademyV2Path } from '@/types';
import { fetchAcademyV2Catalog } from '@/lib/academy/v2Api';
import { useAcademyProgressState } from '@/lib/academy/useAcademyProgress';
import { countCompletedAcademyV2CourseUnits } from '@/lib/academy/v2Progress';
import { useStore } from '@/store/useStore';

function pluralize(value: number, singular: string, plural: string) {
  return value === 1 ? singular : plural;
}

function isCourseCompleted(pathState: ReturnType<typeof useAcademyProgressState>['state'], course: AcademyV2Path['courses'][number]) {
  const completed = countCompletedAcademyV2CourseUnits(pathState.completedLessons, course.id);
  return course.total_unit_count > 0 && completed >= course.total_unit_count;
}

export function AcademyPath() {
  const { pathId = '' } = useParams<{ pathId: string }>();
  const navigate = useNavigate();
  const { currentUser, walletAddress, authToken } = useStore();
  const [path, setPath] = useState<AcademyV2Path | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const identity = useMemo(
    () => ({
      userId: currentUser?.id ?? null,
      walletAddress: walletAddress ?? null,
    }),
    [currentUser?.id, walletAddress]
  );

  const progress = useAcademyProgressState({
    identity,
    currentUserId: currentUser?.id ?? null,
    authToken,
    walletAddress,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadPath() {
      setLoading(true);
      setError('');
      try {
        const base = (import.meta as any).env.VITE_API_BASE_URL || '';
        const data = await fetchAcademyV2Catalog(
          base,
          authToken || localStorage.getItem('auth_token'),
          walletAddress
        );
        const found = (data.curated_paths || []).find((item) => item.id === pathId) || null;

        if (!cancelled) {
          if (!found) {
            setError('Không tìm thấy lộ trình học.');
            setPath(null);
          } else {
            setPath(found);
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Không thể tải lộ trình học.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadPath();
    return () => {
      cancelled = true;
    };
  }, [authToken, pathId, walletAddress]);

  if (loading) {
    return (
      <div className="space-y-6 mt-10">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-48 animate-pulse border-4 border-brutal-black bg-white shadow-neo" />
        ))}
      </div>
    );
  }

  if (!path) {
    return (
      <div className="mt-10 border-4 border-brutal-black bg-brutal-pink p-6 text-center text-sm font-black uppercase tracking-widest text-brutal-black shadow-neo">
        {error || 'Không tìm thấy lộ trình.'}
      </div>
    );
  }

  const completedCourses = path.courses.filter((course) => isCourseCompleted(progress.state, course)).length;

  return (
    <div className="space-y-12 pb-20 mt-10">
      <section className="bg-brutal-blue border-4 border-brutal-black rounded-none p-6 sm:p-10 relative overflow-hidden shadow-neo-xl flex flex-col lg:flex-row gap-8 lg:items-center justify-between">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brutal-pink rounded-full border-8 border-brutal-black translate-x-1/2 -translate-y-1/2 pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-6 max-w-3xl">
          <Link
            to="/academy"
            className="inline-flex min-h-12 items-center justify-center gap-3 bg-white border-4 border-brutal-black px-5 py-2 text-sm font-black uppercase tracking-widest text-brutal-black shadow-neo hover:-translate-y-1 hover:shadow-neo-lg transition-all w-fit"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={3} aria-hidden="true" />
            Về Học Viện
          </Link>
          
          <div>
            <div className="inline-flex items-center justify-center bg-brutal-yellow border-4 border-brutal-black px-4 py-1.5 text-xs font-black uppercase tracking-widest text-brutal-black shadow-neo-sm transform -rotate-2">
              {path.tag || path.difficulty}
            </div>
            <h1 className="mt-4 font-display text-5xl font-black text-white sm:text-6xl uppercase tracking-tighter" style={{ textShadow: '4px 4px 0 #111827' }}>
              {path.title}
            </h1>
          </div>
        </div>

        <div className="relative z-10 grid gap-4 w-full lg:w-auto grid-cols-3 shrink-0">
          <PathMetric value={String(path.course_count)} label={pluralize(path.course_count, 'Khóa', 'Khóa')} icon={<BookOpen className="h-6 w-6 text-brutal-black" strokeWidth={3} aria-hidden="true" />} color="bg-brutal-yellow" />
          <PathMetric value={String(path.practice_unit_count)} label={pluralize(path.practice_unit_count, 'Thực hành', 'Thực hành')} icon={<Sparkles className="h-6 w-6 text-brutal-black" strokeWidth={3} aria-hidden="true" />} color="bg-brutal-pink" />
          <PathMetric value={String(completedCourses)} label="Hoàn thành" icon={<Trophy className="h-6 w-6 text-brutal-black" strokeWidth={3} aria-hidden="true" />} color="bg-brutal-green" />
        </div>
      </section>

      <section className="space-y-8 mt-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-2">
          <div>
            <div className="flex items-center gap-3 mb-2">
               <div className="w-10 h-2 bg-brutal-black" />
               <span className="text-brutal-black font-black text-sm uppercase tracking-widest bg-brutal-yellow px-2 py-1 border-2 border-brutal-black shadow-neo-sm">Hành trình học tập</span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl font-black text-brutal-black uppercase tracking-tighter decoration-brutal-pink decoration-4 underline underline-offset-8 mt-4">
              Các khóa học
            </h2>
          </div>
          <div className="bg-brutal-black border-2 border-brutal-black px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white shadow-neo-sm hidden sm:block">
            Mở khóa lần lượt
          </div>
        </div>

        {path.courses.length === 0 ? (
          <div className="bg-gray-100 border-4 border-brutal-black p-12 text-center shadow-neo brutal-card mt-8">
             <div className="mx-auto w-24 h-24 bg-white border-4 border-brutal-black shadow-neo-sm flex items-center justify-center mb-6">
                <BookOpen className="h-12 w-12 text-brutal-black" strokeWidth={2} />
             </div>
             <p className="text-brutal-black font-black uppercase text-xl">Lộ trình này đang được xây dựng. Các khóa học sẽ sớm được cập nhật.</p>
          </div>
        ) : (
          <div className="space-y-8 mt-8">
            {path.courses.map((course, index) => {
              const completed = countCompletedAcademyV2CourseUnits(progress.state.completedLessons, course.id);
              const isCompleted = course.total_unit_count > 0 && completed >= course.total_unit_count;
              const previous = index > 0 ? path.courses[index - 1] : null;
              const previousDone = previous ? isCourseCompleted(progress.state, previous) : true;
              const locked = !previousDone;
              const completionPercent = course.total_unit_count > 0
                ? Math.round((completed / course.total_unit_count) * 100)
                : 0;

              return (
                <button
                  key={course.id}
                  type="button"
                  disabled={locked}
                  onClick={() => !locked && navigate(`/academy/course/${course.id}`)}
                  className={`group flex w-full flex-col p-6 text-left transition-all border-4 border-brutal-black shadow-neo relative overflow-hidden ${
                    locked
                      ? 'cursor-not-allowed bg-gray-200 opacity-90 brightness-95'
                      : 'bg-white transform hover:scale-[1.01] hover:-rotate-1 hover:shadow-neo-lg focus-visible:outline-none focus:ring-4 focus:ring-brutal-blue'
                  }`}
                >
                  <div className="absolute top-0 left-0 w-full h-2 bg-gray-200 border-b-4 border-brutal-black">
                    <div 
                      className={`h-full transition-all duration-1000 ease-out border-r-4 border-brutal-black ${isCompleted ? 'bg-brutal-green' : 'bg-brutal-blue'}`}
                      style={{ width: `${completionPercent}%` }} 
                    />
                  </div>

                  <div className="flex flex-col xl:flex-row xl:items-start lg:justify-between w-full mt-2 gap-6">
                    <div className="flex-1 w-full xl:max-w-[65%]">
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span className="inline-flex items-center justify-center bg-brutal-blue border-4 border-brutal-black px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white shadow-neo-sm transform group-hover:rotate-2 transition-transform">
                          Chặng {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="inline-flex items-center justify-center bg-gray-100 border-4 border-brutal-black px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-brutal-black shadow-neo-sm">
                          {course.difficulty}
                        </span>
                        {locked ? (
                          <span className="inline-flex items-center gap-1.5 bg-brutal-black border-4 border-brutal-black px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white shadow-neo-sm">
                            <Lock className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
                            Đã khóa
                          </span>
                        ) : isCompleted ? (
                          <span className="inline-flex items-center gap-1.5 bg-brutal-green border-4 border-brutal-black px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-brutal-black shadow-neo-sm">
                            <Flame className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
                            Hoàn thành
                          </span>
                        ) : null}
                      </div>

                      <div className="w-full">
                        <h3 className={`font-display text-4xl leading-none font-black uppercase tracking-tighter mb-4 transition-colors break-words ${locked ? 'text-gray-500' : 'text-brutal-black group-hover:underline decoration-brutal-blue decoration-4 underline-offset-4'}`}>
                          {course.title}
                        </h3>
                        <p className="text-base font-bold text-gray-700 leading-relaxed bg-white/50 border-2 border-brutal-black p-4 w-full xl:min-h-[80px]">
                          {course.description}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 w-full xl:w-[35%] shrink-0">
                      <CourseMetric value={String(course.module_count)} label="Chương bài" icon={<BookOpen className="h-5 w-5 text-brutal-black" strokeWidth={3} />} />
                      <CourseMetric value={String(course.practice_unit_count)} label="Thực hành" icon={<Sparkles className="h-5 w-5 text-brutal-black" strokeWidth={3} />} />
                      <CourseMetric value={`${completionPercent}%`} label="Tiến độ" icon={<Trophy className="h-5 w-5 text-brutal-black" strokeWidth={3} />} />
                      <CourseMetric value={`${course.duration_hours} giờ`} label="Thời lượng" icon={<Flame className="h-5 w-5 text-brutal-black" strokeWidth={3} />} />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 mt-6 border-t-4 border-brutal-black text-sm font-black w-full text-brutal-black">
                    <div className="bg-white border-2 border-brutal-black px-4 py-2 shadow-neo-sm">
                      <span className={isCompleted ? "text-brutal-green" : "text-brutal-blue"}>{completed}</span>
                      <span className="mx-2">/</span>
                      {course.total_unit_count} {pluralize(course.total_unit_count, 'bài học', 'bài học')}
                    </div>
                    <span className={`inline-flex items-center gap-3 transition-all uppercase tracking-widest ${locked ? 'text-gray-500' : 'text-brutal-blue group-hover:gap-5'}`}>
                      {locked ? 'HÃY HOÀN THÀNH KHÓA HỌC TRƯỚC' : 'MỞ KHÓA HỌC'}
                      <ChevronRight className={`h-6 w-6 border-2 border-brutal-black rounded-full p-0.5 ${locked ? '' : 'group-hover:bg-brutal-yellow group-hover:text-brutal-black transition-colors'}`} strokeWidth={3} aria-hidden="true" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function PathMetric({
  value,
  label,
  icon,
  color,
}: {
  value: string;
  label: string;
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <div className={`${color || 'bg-white'} border-4 border-brutal-black shadow-neo-sm p-4 hover:-translate-y-1 hover:shadow-neo transition-all`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center justify-center w-12 h-12 bg-white border-4 border-brutal-black shadow-neo-sm shrink-0">
          {icon}
        </div>
        <div className="text-[10px] font-black uppercase tracking-widest text-brutal-black bg-white px-2 py-1 border-2 border-brutal-black shadow-neo-sm line-clamp-1 break-all">{label}</div>
      </div>
      <div className="font-display text-3xl font-black text-brutal-black mt-2" style={{ textShadow: '2px 2px 0 #fff' }}>{value}</div>
    </div>
  );
}

function CourseMetric({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white border-4 border-brutal-black p-3 shadow-neo-sm flex flex-col items-start gap-2 h-full">
      <div className="flex items-center gap-2 w-full border-b-2 border-brutal-black pb-2">
        <div className="bg-brutal-yellow border-2 border-brutal-black p-0.5 shadow-neo-sm shrink-0">
          {icon}
        </div>
        <div className="text-[10px] font-black uppercase tracking-widest text-brutal-black truncate">{label}</div>
      </div>
      <div className="font-display text-2xl font-black text-brutal-black leading-none uppercase tracking-tighter mt-1">{value}</div>
    </div>
  );
}
