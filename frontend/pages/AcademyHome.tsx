import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Boxes,
  ChevronRight,
  Flame,
  Layers3,
  Terminal,
  Trophy,
} from 'lucide-react';

import type { AcademyV2CommunityTrack, AcademyV2Path } from '@/types';
import { fetchAcademyV2Catalog } from '@/lib/academy/v2Api';
import { useAcademyProgressState } from '@/lib/academy/useAcademyProgress';
import { countCompletedAcademyV2CourseUnits } from '@/lib/academy/v2Progress';
import { useStore } from '@/store/useStore';

function pluralize(value: number, singular: string, plural: string) {
  return value === 1 ? singular : plural;
}

export function AcademyHome() {
  const navigate = useNavigate();
  const { currentUser, walletAddress, authToken } = useStore();
  const [paths, setPaths] = useState<AcademyV2Path[]>([]);
  const [communityTracks, setCommunityTracks] = useState<AcademyV2CommunityTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const identity = useMemo(
    () => ({
      userId: currentUser?.id ?? null,
      walletAddress: walletAddress ?? null,
    }),
    [currentUser?.id, walletAddress]
  );

  const { state } = useAcademyProgressState({
    identity,
    currentUserId: currentUser?.id ?? null,
    authToken,
    walletAddress,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      setLoading(true);
      setError('');
      try {
        const base = (import.meta as any).env.VITE_API_BASE_URL || '';
        const data = await fetchAcademyV2Catalog(
          base,
          authToken || localStorage.getItem('auth_token'),
          walletAddress
        );

        if (!cancelled) {
          setPaths((data.curated_paths || []).slice().sort((a, b) => a.order - b.order));
          setCommunityTracks(
            (data.community_tracks || []).slice().sort((a, b) => a.sort_order - b.sort_order)
          );
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Không thể tải lộ trình học viện.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadCatalog();
    return () => {
      cancelled = true;
    };
  }, [authToken, walletAddress]);

  const totalCuratedUnits = paths.reduce((sum, path) => sum + path.total_unit_count, 0);
  const totalCompletedUnits = paths.reduce(
    (sum, path) =>
      sum +
      path.courses.reduce(
        (courseSum, course) => courseSum + countCompletedAcademyV2CourseUnits(state.completedLessons, course.id),
        0
      ),
    0
  );

  // Mocked Streak Data for the calendar
  const today = new Date();
  const mockStreakDays = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (13 - i));
    const isPlayed = i > 5 && i % 3 !== 0; // Some random completed days
    return {
      date: d,
      completed: isPlayed,
      isToday: i === 13
    };
  });

  return (
    <div className="space-y-16 pb-20 mt-10">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-brutal-blue border-4 border-brutal-black rounded-none p-6 sm:p-10 shadow-neo-xl brutal-card flex justify-between items-center flex-col lg:flex-row gap-8">
        <h1 className="font-display text-5xl font-black text-white sm:text-6xl lg:text-7xl leading-none tracking-tighter uppercase" style={{ textShadow: '4px 4px 0 #111827' }}>
          HỌC VIỆN DSUC
        </h1>

        {/* Streak Board */}
        <div className="w-full lg:w-auto overflow-hidden bg-white border-4 border-brutal-black shadow-neo-lg p-6">
          {currentUser ? (
              <div className="space-y-6">
                 <div className="flex justify-between items-center bg-brutal-yellow p-4 border-4 border-brutal-black shadow-neo-sm">
                   <div className="font-black uppercase tracking-widest text-brutal-black">Chuỗi ngày học liên tiếp</div>
                   <div className="flex items-center gap-2">
                     <span className="font-display text-3xl font-black text-brutal-black">{currentUser?.streak ?? 5}</span>
                     <Flame className="w-8 h-8 text-brutal-pink fill-brutal-pink" strokeWidth={2} />
                   </div>
                 </div>
                 
                 <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x">
                    {mockStreakDays.map((day, idx) => (
                       <div key={idx} className="flex flex-col items-center gap-2 snap-center shrink-0">
                          <span className="text-[10px] font-bold text-gray-500 uppercase">{day.date.toLocaleDateString('vi-VN', { weekday: 'short' })}</span>
                          <div className={`w-12 h-12 flex items-center justify-center border-4 border-brutal-black rounded-full shadow-neo-sm ${day.completed ? 'bg-brutal-pink' : 'bg-brutal-bg opacity-50 grayscale'} ${day.isToday ? 'scale-110 border-brutal-blue shadow-neo-lg bg-brutal-yellow' : ''}`}>
                             {day.completed || day.isToday ? (
                                <Flame className="w-6 h-6 text-brutal-black fill-brutal-black" />
                             ) : (
                                <div className="w-6 h-6 rotate-45 border-4 border-brutal-black bg-white" />
                             )}
                          </div>
                          <span className={`text-[10px] font-black ${day.isToday ? 'text-brutal-blue' : 'text-brutal-black'}`}>{day.date.getDate()}</span>
                       </div>
                    ))}
                 </div>
              </div>
          ) : (
             <div className="text-center py-4">
                 <div className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Học viện</div>
                 <h2 className="font-display text-xl font-black text-brutal-black uppercase tracking-tight mb-4">Theo dõi chuỗi ngày học của bạn</h2>
                 <p className="bg-brutal-pink border-4 border-brutal-black px-4 py-3 font-black uppercase shadow-neo text-sm text-brutal-black">
                   Đăng nhập để lưu streak và đồng bộ tiến độ học tập.
                 </p>
             </div>
          )}
        </div>
      </section>

      {/* Curated Paths Section */}
      <section className="space-y-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between px-2">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-2 bg-brutal-black" />
              <span className="text-brutal-black font-black text-sm uppercase tracking-widest bg-brutal-yellow px-2 py-1 border-2 border-brutal-black shadow-neo-sm">Lộ trình học tập</span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl font-black text-brutal-black uppercase tracking-tighter decoration-brutal-pink decoration-4 underline underline-offset-8 mt-4">
              Các mảng kiến thức
            </h2>
          </div>
          <p className="text-base font-bold text-gray-700 sm:max-w-md sm:text-right border-l-4 border-brutal-black pl-4">
            Các lộ trình được thiết kế bài bản theo từng giai đoạn phát triển của Builder.
          </p>
        </div>

        {loading ? (
          <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-72 animate-pulse bg-gray-200 border-4 border-brutal-black shadow-neo" />
            ))}
          </div>
        ) : error ? (
          <div className="bg-brutal-red border-4 border-brutal-black text-white p-6 text-center font-black uppercase text-xl shadow-neo">
            {error}
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-2 xl:grid-cols-3">
            {paths.map((path) => {
              const completedUnits = path.courses.reduce(
                (sum, course) => sum + countCompletedAcademyV2CourseUnits(state.completedLessons, course.id),
                0
              );
              const progressPercent = path.total_unit_count > 0
                ? Math.round((completedUnits / path.total_unit_count) * 100)
                : 0;

              return (
                <button
                  key={path.id}
                  type="button"
                  onClick={() => navigate(`/academy/path/${path.id}`)}
                  className="group flex flex-col bg-white p-6 border-4 border-brutal-black relative overflow-hidden shadow-neo transform transition-all duration-300 hover:scale-[1.02] hover:-rotate-1 hover:shadow-neo-xl focus-visible:outline-none focus:ring-4 focus:ring-brutal-blue"
                >
                  <div className="absolute top-0 left-0 w-full h-2 bg-gray-200 border-b-4 border-brutal-black">
                    <div 
                      className="h-full bg-brutal-pink transition-all duration-1000 ease-out border-r-4 border-brutal-black" 
                      style={{ width: `${progressPercent}%` }} 
                    />
                  </div>
                  
                  <div className="flex justify-between items-start mb-4 mt-2">
                    <div className="inline-flex items-center justify-center bg-brutal-blue border-4 border-brutal-black px-3 py-1.5 text-xs font-black uppercase tracking-widest text-white shadow-neo-sm transform transition-transform group-hover:rotate-3">
                      {path.tag || path.difficulty}
                    </div>
                    <div className="text-right">
                       <div className="text-[10px] font-black uppercase tracking-widest text-brutal-black border-b-2 border-brutal-black mb-1">Tiến độ</div>
                       <div className="text-2xl font-display font-black text-brutal-black group-hover:text-brutal-pink transition-colors">{progressPercent}%</div>
                    </div>
                  </div>

                  <h3 className="font-display text-4xl leading-none font-black text-brutal-black mb-6 uppercase tracking-tighter group-hover:underline decoration-brutal-blue decoration-4 underline-offset-4 text-left">
                    {path.title}
                  </h3>

                  <div className="grid grid-cols-2 gap-3 mb-6 w-full">
                    <StatPill value={String(path.course_count)} label={pluralize(path.course_count, 'Khóa', 'Khóa')} color="bg-brutal-yellow" />
                    <StatPill value={String(path.practice_unit_count)} label={pluralize(path.practice_unit_count, 'Thực hành', 'Thực hành')} color="bg-brutal-green" />
                    <StatPill value={String(path.learn_unit_count)} label="Lý thuyết" color="bg-white" />
                    <StatPill value={String(completedUnits)} label="Hoàn thành" color="bg-brutal-pink" />
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t-4 border-brutal-black text-sm font-black w-full text-brutal-black">
                     <span className="uppercase tracking-widest bg-gray-200 px-3 py-1.5 border-2 border-brutal-black shadow-neo-sm">{path.difficulty}</span>
                     <span className="inline-flex items-center gap-2 text-brutal-blue uppercase tracking-widest group-hover:gap-4 transition-all">
                       VÀO HỌC NGAY
                       <ArrowRight className="h-6 w-6 border-2 border-brutal-black rounded-full p-1 group-hover:bg-brutal-yellow group-hover:text-brutal-black transition-colors" strokeWidth={3} />
                     </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Community Tracks Section */}
      <section className="space-y-10 pt-16 mt-8 border-t-4 border-brutal-black">
         <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between px-2">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-2 bg-brutal-black" />
              <span className="text-brutal-black font-black text-sm uppercase tracking-widest bg-brutal-pink px-2 py-1 border-2 border-brutal-black shadow-neo-sm">Luyện thêm kiến thức</span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl font-black text-brutal-black uppercase tracking-tighter decoration-brutal-blue decoration-4 underline underline-offset-8 mt-4">
              Nội dung mở rộng
            </h2>
          </div>
          <p className="text-base font-bold text-gray-700 sm:max-w-md sm:text-right border-l-4 border-brutal-black pl-4">
            Các khóa luyện thêm được đội ngũ Admin thiết kế riêng cho các thành viên.
          </p>
        </div>

        {communityTracks.length === 0 ? (
          <div className="grid gap-8 lg:grid-cols-2 xl:grid-cols-3">
             {/* Mock targets for testing cards */}
             {Array.from({ length: 3 }).map((_, idx) => (
                <button
                  key={`mock-track-${idx}`}
                  type="button"
                  onClick={() => alert('Khóa học chưa sãn sàng!')}
                  className="group flex flex-col bg-brutal-yellow border-4 border-brutal-black p-6 text-left shadow-neo transform transition-all duration-300 hover:scale-[1.02] hover:-rotate-1 hover:shadow-neo-xl focus-visible:outline-none focus:ring-4 focus:ring-brutal-blue"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="inline-flex items-center justify-center bg-white border-4 border-brutal-black px-4 py-2 text-xs font-black uppercase tracking-widest text-brutal-black shadow-neo-sm transform group-hover:-rotate-3 transition-transform">
                      Khóa luyện tập
                    </div>
                    <div className="h-12 w-12 bg-white border-4 border-brutal-black shadow-neo-sm flex items-center justify-center group-hover:bg-brutal-black group-hover:text-white transition-colors">
                      <Boxes className="h-6 w-6 transition-colors" strokeWidth={2} />
                    </div>
                  </div>
                  
                  <h3 className="font-display text-3xl leading-none font-black text-brutal-black mb-4 uppercase tracking-tighter group-hover:underline decoration-brutal-blue decoration-4 underline-offset-4 line-clamp-2">
                    Luyện thêm Module {idx + 1}
                  </h3>
                  
                  <div className="flex flex-wrap items-center justify-between border-t-4 border-brutal-black pt-4 mt-auto">
                     <div className="flex gap-4 items-center">
                        <span className="text-xs font-black text-brutal-black uppercase tracking-widest bg-white border-2 border-brutal-black px-2 py-1 shadow-neo-sm">
                          {5 * (idx + 1)} bài học
                        </span>
                        <span className="text-xs font-black text-brutal-black uppercase tracking-widest bg-white border-2 border-brutal-black px-2 py-1 shadow-neo-sm">
                          ~{3 * (idx + 1)} giờ
                        </span>
                     </div>
                     
                    <span className="inline-flex items-center justify-center bg-brutal-black w-10 h-10 group-hover:bg-brutal-pink transition-colors ml-4 border-4 border-brutal-black shadow-neo-sm">
                      <ArrowRight className="h-5 w-5 text-white transition-colors" strokeWidth={3} />
                    </span>
                  </div>
                </button>
             ))}
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-2">
            {communityTracks.map((track) => (
              <button
                key={track.id}
                type="button"
                onClick={() => navigate(`/academy/community/${track.id}`)}
                className="group flex flex-col bg-brutal-yellow border-4 border-brutal-black p-8 text-left shadow-neo hover:translate-x-1 hover:-translate-y-1 hover:shadow-neo-lg transition-all"
              >
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div className="inline-flex items-center justify-center bg-white border-4 border-brutal-black px-4 py-2 text-xs font-black uppercase tracking-widest text-brutal-black shadow-neo-sm">
                    Khóa nội bộ
                  </div>
                  <div className="h-16 w-16 bg-white border-4 border-brutal-black shadow-neo-sm flex items-center justify-center group-hover:bg-brutal-black group-hover:text-white transition-colors">
                    <Boxes className="h-8 w-8 transition-colors" strokeWidth={2} />
                  </div>
                </div>
                
                <h3 className="font-display text-3xl leading-tight font-black text-brutal-black mb-4 uppercase tracking-tight group-hover:text-brutal-blue transition-colors">
                  {track.title}
                </h3>
                
                <p className="line-clamp-2 text-base font-medium text-gray-800 leading-relaxed mb-8 flex-1 bg-white/50 p-3 border-2 border-brutal-black">
                  {track.subtitle || track.description || 'Khóa học được đóng góp bởi thành viên câu lạc bộ.'}
                </p>

                <div className="flex flex-wrap items-center justify-between border-t-4 border-brutal-black pt-6">
                   <div className="flex gap-4 items-center">
                      <span className="text-xs font-black text-brutal-black uppercase tracking-widest bg-white border-2 border-brutal-black px-2 py-1 shadow-neo-sm">
                        {track.lesson_count} bài học
                      </span>
                      <span className="text-brutal-black font-black">•</span>
                      <span className="text-xs font-black text-brutal-black uppercase tracking-widest bg-white border-2 border-brutal-black px-2 py-1 shadow-neo-sm">
                        ~{Math.max(1, Math.round(track.total_minutes / 60))} giờ
                      </span>
                   </div>
                   
                  <span className="inline-flex items-center justify-center bg-brutal-black w-10 h-10 group-hover:bg-brutal-pink transition-colors ml-4 border-4 border-brutal-black shadow-neo-sm">
                    <ArrowRight className="h-5 w-5 text-white transition-colors" strokeWidth={3} />
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  detail,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  color?: string;
}) {
  return (
    <div className={`${color || 'bg-white'} border-4 border-brutal-black shadow-neo-sm p-5 hover:-translate-y-1 hover:shadow-neo transition-all`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center w-12 h-12 bg-white border-4 border-brutal-black shadow-neo-sm">
          {icon}
        </div>
        <div className="text-[10px] font-black uppercase tracking-widest text-brutal-black bg-white px-2 py-1 border-2 border-brutal-black shadow-neo-sm">{label}</div>
      </div>
      <div className="font-display text-4xl font-black text-brutal-black mb-1" style={{ textShadow: '2px 2px 0 #fff' }}>{value}</div>
      <div className="text-sm font-bold text-brutal-black uppercase tracking-wide">{detail}</div>
    </div>
  );
}

function StatPill({ value, label, color }: { value: string; label: string; color?: string }) {
  return (
    <div className={`${color || 'bg-white'} border-4 border-brutal-black px-4 py-3 shadow-neo-sm`}>
      <div className="font-display text-2xl font-black text-brutal-black leading-none">{value}</div>
      <div className="mt-2 text-[10px] font-black uppercase tracking-widest text-brutal-black px-1 border-t-2 border-brutal-black pt-1">{label}</div>
    </div>
  );
}
