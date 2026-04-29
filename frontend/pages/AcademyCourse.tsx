import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Code2,
  Flame,
  Layers3,
  Lock,
  Sparkles,
  User,
} from 'lucide-react';

import type { AcademyV2CourseDetail, AcademyV2Module, AcademyV2UnitSummary } from '@/types';
import { fetchAcademyV2Course } from '@/lib/academy/v2Api';
import { useAcademyProgressState } from '@/lib/academy/useAcademyProgress';
import {
  countCompletedAcademyV2CourseUnits,
  isAcademyV2UnitCompleted,
} from '@/lib/academy/v2Progress';
import { useStore } from '@/store/useStore';

type FlatUnit = AcademyV2UnitSummary & {
  moduleId: string;
  moduleTitle: string;
};

function flattenCourseUnits(course: AcademyV2CourseDetail): FlatUnit[] {
  return course.modules.flatMap((module) =>
    [...module.learn_units, ...module.practice_units]
      .sort((left, right) => Number(left.order || 0) - Number(right.order || 0))
      .map((unit) => ({
        ...unit,
        moduleId: module.id,
        moduleTitle: module.title,
      }))
  );
}

function unitStateText(unit: AcademyV2UnitSummary) {
  return unit.section === 'practice'
    ? 'Thực hành tương tác, kiểm tra thử thách và củng cố kiến thức.'
    : 'Bài giảng lý thuyết và giải thích chi tiết cho phần này.';
}

function countCompletedModuleUnits(
  module: AcademyV2Module,
  completedLessons: Record<string, boolean>,
  courseId: string
) {
  return [...module.learn_units, ...module.practice_units].filter((unit) =>
    isAcademyV2UnitCompleted(completedLessons, courseId, unit.id)
  ).length;
}

function difficultyLabel(value: AcademyV2CourseDetail['difficulty']) {
  if (value === 'advanced') {
    return 'Nâng cao';
  }

  if (value === 'intermediate') {
    return 'Trung cấp';
  }

  return 'Cơ bản';
}

function moduleAnchor(moduleId: string) {
  return `module-${moduleId}`;
}

export function AcademyCourse() {
  const { courseId = '' } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { currentUser, walletAddress, authToken } = useStore();
  const [course, setCourse] = useState<AcademyV2CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadNonce, setReloadNonce] = useState(0);

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

    async function loadCourse() {
      setLoading(true);
      setError('');
      try {
        const base = (import.meta as any).env.VITE_API_BASE_URL || '';
        const result = await fetchAcademyV2Course(
          base,
          courseId,
          authToken || localStorage.getItem('auth_token'),
          walletAddress
        );

        if (!cancelled) {
          setCourse(result);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Không thể tải khóa học.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadCourse();
    return () => {
      cancelled = true;
    };
  }, [authToken, courseId, reloadNonce, walletAddress]);

  if (loading) {
    return (
      <div className="space-y-6 pb-20 mt-10">
        <div className="h-72 animate-pulse border-4 border-brutal-black bg-white shadow-neo" />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-64 animate-pulse border-4 border-brutal-black bg-white shadow-neo"
              />
            ))}
          </div>
          <div className="h-80 animate-pulse border-4 border-brutal-black bg-white shadow-neo" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="mt-10 border-4 border-brutal-black bg-brutal-pink p-8 text-center shadow-neo">
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center border-4 border-brutal-black bg-white text-brutal-black shadow-neo-sm">
           <Code2 className="w-6 h-6" />
        </div>
        <h1 className="font-display text-2xl font-black uppercase tracking-tight text-brutal-black">
          Không thể mở khóa học này
        </h1>
        <p className="mx-auto mt-4 max-w-xl border-4 border-brutal-black bg-white px-4 py-3 text-sm font-bold text-brutal-black shadow-neo-sm">
          {error || 'Khóa học không thể tải được từ danh mục ngay lúc này. Vui lòng thử lại sau.'}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <button
            type="button"
            onClick={() => setReloadNonce((value) => value + 1)}
            className="inline-flex items-center gap-2 border-4 border-brutal-black bg-brutal-blue px-6 py-3 text-sm font-black uppercase tracking-widest text-white shadow-neo-sm transition-all hover:-translate-y-1 hover:bg-brutal-black hover:shadow-neo"
          >
            Tải lại
          </button>
          <Link
            to="/academy"
            className="inline-flex items-center gap-2 border-4 border-brutal-black bg-white px-6 py-3 text-sm font-black uppercase tracking-widest text-brutal-black shadow-neo-sm transition-all hover:-translate-y-1 hover:bg-brutal-yellow hover:shadow-neo"
          >
            Quay lại học viện
          </Link>
        </div>
      </div>
    );
  }

  const flatUnits = flattenCourseUnits(course);
  const completedCount = countCompletedAcademyV2CourseUnits(
    progress.state.completedLessons,
    course.id
  );
  const progressPercent =
    course.total_unit_count > 0 ? Math.round((completedCount / course.total_unit_count) * 100) : 0;
  const firstIncomplete =
    flatUnits.find(
      (unit) => !isAcademyV2UnitCompleted(progress.state.completedLessons, course.id, unit.id)
    ) || null;
  const completedModules = course.modules.filter((module) => {
    const moduleUnitCount = module.learn_units.length + module.practice_units.length;
    if (moduleUnitCount === 0) {
      return false;
    }

    return countCompletedModuleUnits(module, progress.state.completedLessons, course.id) >= moduleUnitCount;
  }).length;

  return (
    <div className="space-y-12 pb-20 mt-10">
      <section className="bg-brutal-blue border-4 border-brutal-black p-6 sm:p-10 relative overflow-hidden brutal-card rounded-none shadow-neo-xl flex flex-col xl:flex-row xl:items-start xl:justify-between gap-8">
        <div className="absolute right-0 top-0 w-64 h-64 bg-brutal-yellow rounded-full border-8 border-brutal-black translate-x-1/2 -translate-y-1/2 pointer-events-none" />

        <div className="relative z-10 space-y-6 flex-1 max-w-4xl">
          <Link
            to={course.path_id ? `/academy/path/${course.path_id}` : '/academy'}
            className="inline-flex min-h-12 items-center justify-center gap-3 bg-white border-4 border-brutal-black px-5 py-2 text-sm font-black uppercase tracking-widest text-brutal-black shadow-neo hover:-translate-y-1 hover:shadow-neo-lg transition-all w-fit pointer-events-auto"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={3} aria-hidden="true" />
            Về {course.path_title ? 'Lộ trình' : 'Học viện'}
          </Link>

          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center justify-center bg-brutal-black px-4 py-2 text-xs font-black uppercase tracking-widest text-white shadow-neo-sm">
              {course.path_title || 'Khóa học'}
            </span>
            <span className="inline-flex items-center justify-center bg-brutal-yellow px-4 py-2 text-xs font-black uppercase tracking-widest text-brutal-black border-4 border-brutal-black shadow-neo-sm transform -rotate-2">
              {difficultyLabel(course.difficulty)}
            </span>
            <span className="inline-flex items-center justify-center bg-brutal-green px-4 py-2 text-xs font-black uppercase tracking-widest text-brutal-black border-4 border-brutal-black shadow-neo-sm">
              Chặng {String(Math.max(1, course.track_level || 1)).padStart(2, '0')}
            </span>
          </div>

          <div>
            <div className="inline-block border-4 border-brutal-black bg-white px-5 py-4 shadow-neo-sm">
              <h1 className="font-display text-5xl font-black text-brutal-black sm:text-6xl uppercase tracking-tighter">
                {course.title}
              </h1>
            </div>
            <p className="mt-4 max-w-3xl text-sm font-bold text-gray-800 bg-white/90 border-4 border-brutal-black p-4 shadow-neo-sm">
               {course.description}
            </p>
          </div>

          {course.tags.length > 0 && (
             <div className="flex flex-wrap gap-2">
               {course.tags.map((tag) => (
                 <span
                   key={tag}
                   className="inline-flex items-center bg-white border-2 border-brutal-black px-2 py-1 text-[10px] font-black uppercase tracking-widest text-brutal-black shadow-neo-sm"
                 >
                   {tag}
                 </span>
               ))}
             </div>
          )}

          <div className="grid gap-4 sm:grid-cols-3 max-w-2xl pt-2">
            <CourseMetric
              icon={<Flame className="h-5 w-5 text-white" strokeWidth={3} aria-hidden="true" />}
              label="Thời lượng"
              value={`${course.duration_hours}h`}
              color="bg-brutal-black text-white"
            />
            <CourseMetric
              icon={<Layers3 className="h-5 w-5 text-brutal-black" strokeWidth={3} aria-hidden="true" />}
              label="Chương"
              value={String(course.module_count)}
              color="bg-white"
            />
            <CourseMetric
              icon={<Sparkles className="h-5 w-5 text-brutal-black" strokeWidth={3} aria-hidden="true" />}
              label="Thực hành"
              value={String(course.practice_unit_count)}
              color="bg-brutal-pink"
            />
          </div>
        </div>

        <div className="relative z-10 w-full xl:w-[400px] shrink-0 pointer-events-auto">
          <div className="bg-white p-6 shadow-neo-lg relative overflow-hidden border-4 border-brutal-black brutal-card transform hover:translate-y-1 transition-transform duration-300">
             <div className="absolute top-0 right-0 w-24 h-24 bg-brutal-blue rounded-full border-8 border-brutal-black translate-x-10 -translate-y-10 pointer-events-none" />
            
            <div className="relative z-10 border-b-4 border-brutal-black pb-4 mb-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-brutal-pink mb-1">
                Tiếp tục học
              </div>
              <h2 className="font-display text-2xl font-black text-brutal-black uppercase tracking-tight line-clamp-2">
                {firstIncomplete ? firstIncomplete.title : 'ĐÃ HOÀN TẤT!'}
              </h2>
            </div>

            <div className="relative z-10 space-y-4">
               {firstIncomplete ? (
                 <p className="text-sm font-bold bg-brutal-yellow/20 border-2 border-brutal-black p-3">
                   {firstIncomplete.moduleTitle}
                 </p>
               ) : (
                 <p className="text-sm font-bold bg-brutal-green/20 border-2 border-brutal-black p-3">
                   Tuyệt vời, bạn đã hoàn thành khóa học này!
                 </p>
               )}

               <div>
                 <div className="flex justify-between items-center text-[10px] font-black text-brutal-black uppercase tracking-widest mb-2">
                   <span>Tiến độ</span>
                   <span className="text-brutal-blue">{Math.round(progressPercent)}%</span>
                 </div>
                 <div className="border-2 border-brutal-black bg-gray-100 relative h-3 w-full">
                   <div
                     className="absolute top-0 left-0 h-full bg-brutal-blue border-r-2 border-brutal-black transition-all duration-1000 ease-out"
                     style={{ width: `${progressPercent}%` }}
                   />
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-3">
                 <div className="bg-white border-2 border-brutal-black px-3 py-2 text-center">
                   <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Đã xong</div>
                   <div className="font-display text-2xl font-black text-brutal-black">{completedModules}/{course.module_count}</div>
                 </div>
                 <div className="bg-white border-2 border-brutal-black px-3 py-2 text-center">
                   <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Thực hành</div>
                   <div className="font-display text-2xl font-black text-brutal-black">{course.practice_unit_count}</div>
                 </div>
               </div>

               <button
                 type="button"
                 onClick={() =>
                   firstIncomplete
                     ? navigate(`/academy/unit/${course.id}/${firstIncomplete.id}`)
                     : navigate(course.path_id ? `/academy/path/${course.path_id}` : '/academy')
                 }
                 className="mt-2 inline-flex min-h-12 w-full items-center justify-center gap-3 bg-brutal-black px-5 text-xs font-black uppercase tracking-widest text-white hover:bg-brutal-yellow hover:text-brutal-black border-4 border-transparent hover:border-brutal-black hover:shadow-neo-sm transition-all"
               >
                 {firstIncomplete ? 'TIẾP TỤC HỌC' : 'QUAY LẠI LỘ TRÌNH'}
                 <ArrowRight className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
               </button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-12 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="space-y-10">
          <div className="flex items-center gap-3 px-2">
             <div className="w-10 h-2 bg-brutal-black" />
             <span className="text-brutal-black font-black text-sm uppercase tracking-widest bg-brutal-yellow px-2 py-1 border-2 border-brutal-black shadow-neo-sm">Lộ trình bài giảng</span>
          </div>
          
          <div className="px-2">
             <h2 className="font-display text-4xl sm:text-5xl font-black text-brutal-black uppercase tracking-tighter decoration-brutal-pink decoration-4 underline underline-offset-8 mt-4">
                Học thuyết & thực hành
             </h2>
             <p className="mt-6 max-w-2xl text-lg font-bold text-gray-700 bg-white border-l-8 border-brutal-black pl-4 py-2">
                Nội dung mỗi chương được thiết kế để kết hợp hài hòa giữa việc nạp lý thuyết mới và áp dụng ngay vào bài tập thực tế.
             </p>
          </div>

          <div className="space-y-10 mt-10">
             {course.modules.map((module, index) => {
               const moduleCompleted = countCompletedModuleUnits(
                 module,
                 progress.state.completedLessons,
                 course.id
               );
               const moduleTotal = module.learn_units.length + module.practice_units.length;
               const modulePercent = moduleTotal > 0 ? Math.round((moduleCompleted / moduleTotal) * 100) : 0;

               return (
                 <section
                   key={module.id}
                   id={moduleAnchor(module.id)}
                   className="bg-white border-4 border-brutal-black shadow-neo"
                 >
                   <div className="flex flex-col gap-6 p-6 lg:p-8 border-b-4 border-brutal-black lg:flex-row lg:items-start lg:justify-between relative overflow-hidden bg-white">
                     <div className="absolute top-0 left-0 w-full h-2 bg-gray-200 border-b-2 border-brutal-black">
                        <div className="h-full bg-brutal-pink border-r-2 border-brutal-black transition-all ease-out duration-1000" style={{ width: `${modulePercent}%` }} />
                     </div>
                     <div className="flex-1 space-y-4 py-2">
                       <div className="flex flex-wrap items-center gap-3">
                         <span className="inline-flex items-center justify-center bg-brutal-blue border-4 border-brutal-black text-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest shadow-neo-sm transform -rotate-1">
                           Chương {String(index + 1).padStart(2, '0')}
                         </span>
                         <span className="inline-flex items-center justify-center bg-gray-100 border-4 border-brutal-black px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-brutal-black shadow-neo-sm">
                           {moduleCompleted}/{moduleTotal} hoàn thành
                         </span>
                       </div>
                       <div>
                         <h3 className="font-display text-3xl font-black uppercase tracking-tight text-brutal-black w-full break-words">
                           {module.title}
                         </h3>
                         {module.description && (
                           <p className="mt-3 text-sm font-bold text-gray-700 bg-gray-50 p-3 border-2 border-brutal-black w-full border-dashed">
                             {module.description}
                           </p>
                         )}
                       </div>
                     </div>

                     <div className="grid gap-3 grid-cols-3 lg:w-[280px] shrink-0 xl:w-[320px]">
                       <CompactMetric label="Lý thuyết" value={String(module.learn_units.length)} color="bg-white" />
                       <CompactMetric label="Thực hành" value={String(module.practice_units.length)} color="bg-brutal-yellow" />
                       <CompactMetric label="Hoàn thành" value={`${modulePercent}%`} color="bg-brutal-green" />
                     </div>
                   </div>

                   <div className="p-4 lg:p-6 bg-gray-100 border-b-4 border-brutal-black">
                     <div className="grid gap-6 xl:grid-cols-2">
                       <UnitLane
                         title="Lý thuyết"
                         subtitle="Đọc và xem nội dung."
                         units={module.learn_units}
                         courseId={course.id}
                         flatUnits={flatUnits}
                         completedLessons={progress.state.completedLessons}
                       />
                       <UnitLane
                         title="Thực hành"
                         subtitle="Áp dụng kiến thức."
                         units={module.practice_units}
                         courseId={course.id}
                         flatUnits={flatUnits}
                         completedLessons={progress.state.completedLessons}
                       />
                     </div>
                   </div>
                 </section>
               );
             })}
          </div>
        </section>

        <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          {course.instructor && (
            <div className="bg-white p-6 border-4 border-brutal-black shadow-neo relative overflow-hidden brutal-card">
              <div className="absolute top-0 right-0 w-24 h-24 bg-brutal-yellow rounded-full blur-none border-8 border-brutal-black translate-x-10 -translate-y-10" />
              <div className="relative z-10">
                 <div className="text-[10px] font-black uppercase tracking-widest text-brutal-black bg-white border-2 border-brutal-black shadow-neo-sm px-2 py-1 inline-block mb-6">
                   Giảng viên
                 </div>
                 <div className="flex flex-col gap-4">
                   <div className="flex h-20 w-20 items-center justify-center bg-brutal-blue border-4 border-brutal-black shadow-neo-sm text-white">
                     <User className="h-10 w-10" strokeWidth={3} aria-hidden="true" />
                   </div>
                   <div>
                     <div className="font-display text-2xl font-black text-brutal-black mb-2 uppercase">
                       {course.instructor.name}
                     </div>
                     <p className="text-sm font-bold text-gray-800 leading-relaxed bg-gray-100 p-3 border-2 border-brutal-black">{course.instructor.bio}</p>
                   </div>
                 </div>
              </div>
            </div>
          )}

          <div className="bg-white p-6 border-4 border-brutal-black shadow-neo brutal-card lg:max-h-[calc(100vh-200px)] overflow-y-auto brutal-scrollbar">
            <div className="text-[11px] font-black uppercase tracking-widest text-brutal-pink mb-6 border-b-4 border-brutal-black pb-2">
              Mục lục khóa học
            </div>
            <div className="space-y-4">
              {course.modules.map((module, index) => {
                const completed = countCompletedModuleUnits(
                  module,
                  progress.state.completedLessons,
                  course.id
                );
                const total = module.learn_units.length + module.practice_units.length;
                const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

                return (
                  <a
                    key={module.id}
                    href={`#${moduleAnchor(module.id)}`}
                    className="group block bg-white border-4 border-brutal-black p-4 transition-all hover:translate-x-1 hover:-translate-y-1 hover:shadow-neo-sm"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-brutal-blue group-hover:text-brutal-pink transition-colors">
                          Chương {String(index + 1).padStart(2, '0')}
                        </div>
                        <div className="mt-1 font-display text-sm font-black text-brutal-black line-clamp-2 uppercase">
                          {module.title}
                        </div>
                      </div>
                      <div className="text-right border-l-4 border-brutal-black pl-3 shrink-0">
                        <div className="text-sm font-black text-brutal-black bg-brutal-yellow px-1 py-0.5 border-2 border-brutal-black shadow-neo-sm">
                          {percent}%
                        </div>
                        <div className="text-[11px] font-black text-gray-600 mt-1 uppercase">
                          {completed}/{total}
                        </div>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function UnitLane({
  title,
  subtitle,
  units,
  courseId,
  flatUnits,
  completedLessons,
}: {
  title: string;
  subtitle: string;
  units: AcademyV2UnitSummary[];
  courseId: string;
  flatUnits: FlatUnit[];
  completedLessons: Record<string, boolean>;
}) {
  const navigate = useNavigate();

  if (units.length === 0) {
    return (
      <div className="border-4 border-dashed border-brutal-black p-8 bg-white flex flex-col items-center justify-center text-center shadow-neo">
        <div className="w-16 h-16 bg-gray-200 border-4 border-brutal-black grid place-items-center mb-6 shadow-neo-sm">
           <BookOpen className="w-8 h-8 text-brutal-black" strokeWidth={2} />
        </div>
        <div className="text-[11px] font-black uppercase tracking-widest bg-brutal-black text-white px-2 py-1 shadow-neo-sm mb-3">
          Phần {title}
        </div>
        <p className="text-sm text-gray-800 font-bold max-w-[200px]">Chưa có bài học nào được thêm vào đây.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white border-4 border-brutal-black shadow-neo">
      <div className="flex items-center justify-between gap-4 border-b-4 border-brutal-black p-5 bg-brutal-blue">
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-white mb-1 border-b-2 border-white pb-0.5 inline-block">
            Phần {title}
          </div>
          <h4 className="font-display text-xl font-black text-white uppercase tracking-tight" style={{ textShadow: '2px 2px 0 #111827' }}>
            {subtitle}
          </h4>
        </div>
        <div className="bg-brutal-yellow border-4 border-brutal-black px-3 py-1 text-[10px] font-black uppercase tracking-widest text-brutal-black shrink-0 shadow-neo-sm">
          {units.length} Bài
        </div>
      </div>

      <div className="flex-1 p-3 space-y-3 bg-white">
        {units.map((unit) => {
          const flatIndex = flatUnits.findIndex((item) => item.id === unit.id);
          const previous = flatIndex > 0 ? flatUnits[flatIndex - 1] : null;
          const locked =
            previous && !isAcademyV2UnitCompleted(completedLessons, courseId, previous.id);
          const done = isAcademyV2UnitCompleted(completedLessons, courseId, unit.id);

          return (
             <button
                key={unit.id}
                type="button"
                disabled={locked}
                onClick={() => !locked && navigate(`/academy/unit/${courseId}/${unit.id}`)}
                className={`group w-full p-4 text-left transition-all border-4 border-brutal-black relative overflow-hidden flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 ${
                  locked
                    ? 'cursor-not-allowed bg-gray-100 opacity-80'
                    : done
                      ? 'bg-brutal-green hover:translate-x-0.5 hover:-translate-y-0.5 hover:shadow-neo focus-visible:outline-none focus:ring-2 focus:ring-brutal-blue'
                      : 'bg-white hover:translate-x-0.5 hover:-translate-y-0.5 hover:shadow-neo hover:bg-brutal-yellow focus-visible:outline-none focus:ring-2 focus:ring-brutal-blue'
                }`}
              >
                {done && (
                   <div className="absolute top-0 right-0 w-12 h-12 bg-white rounded-full translate-x-6 -translate-y-6 opacity-20 pointer-events-none" />
                )}

                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex flex-wrap items-center gap-2 mb-2 text-[10px] font-black uppercase tracking-widest">
                     {unit.section === 'learn' ? (
                        <span className={`px-2 py-0.5 border-2 border-brutal-black shadow-neo-sm ${done ? 'bg-white text-brutal-black' : 'bg-brutal-pink text-brutal-black'}`}>{unit.type}</span>
                     ) : (
                        <span className={`px-2 py-0.5 border-2 border-brutal-black shadow-neo-sm ${done ? 'bg-white text-brutal-black' : 'bg-brutal-blue text-white'}`}>{unit.type}</span>
                     )}
                     
                     {unit.xp_reward && (
                       <span className="bg-white border-2 border-brutal-black px-2 py-0.5 shadow-neo-sm">
                         {unit.xp_reward} XP
                       </span>
                     )}

                     {unit.language && (
                       <span className="px-2 py-0.5 bg-brutal-black text-white border-2 border-transparent shadow-neo-sm">
                         {unit.language}
                       </span>
                     )}
                  </div>
                  
                  <div className={`font-display text-lg font-black uppercase leading-none truncate ${locked ? 'text-gray-500' : 'text-brutal-black'}`}>
                    {unit.title}
                  </div>
                </div>

                <div className="hidden sm:flex shrink-0 items-center justify-center w-10 h-10 bg-white border-4 border-brutal-black shadow-neo-sm group-hover:bg-brutal-black group-hover:text-white transition-colors">
                  {locked ? (
                    <Lock className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
                  ) : done ? (
                    <CheckCircle2 className="h-5 w-5 text-brutal-green group-hover:text-white" strokeWidth={4} aria-hidden="true" />
                  ) : unit.section === 'practice' ? (
                    <Code2 className="h-5 w-5 transition-colors" strokeWidth={3} aria-hidden="true" />
                  ) : (
                    <BookOpen className="h-5 w-5 transition-colors" strokeWidth={3} aria-hidden="true" />
                  )}
                </div>
              </button>
          );
        })}
      </div>
    </div>
  );
}

function CourseMetric({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className={`${color || 'bg-white'} border-4 border-brutal-black p-4 shadow-neo-sm hover:-translate-y-1 hover:shadow-neo transition-all`}>
      <div className="flex items-center gap-3 mb-3">
         <div className="w-10 h-10 border-4 border-brutal-black bg-white flex items-center justify-center shadow-neo-sm">
            {icon}
         </div>
         <div className="text-[10px] font-black uppercase tracking-widest bg-white text-brutal-black px-2 py-1 border-2 border-brutal-black shadow-neo-sm">
           {label}
         </div>
      </div>
      <div className="font-display text-4xl font-black">{value}</div>
    </div>
  );
}

function CompactMetric({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className={`${color || 'bg-white'} border-4 border-brutal-black p-2 flex flex-col items-center justify-center text-center shadow-neo-sm hover:-translate-y-1 transition-transform`}>
      <div className="text-[10px] font-black uppercase tracking-widest text-brutal-black w-full border-b-2 border-brutal-black pb-1 mb-1 truncate">{label}</div>
      <div className="font-display text-2xl font-black text-brutal-black leading-none">{value}</div>
    </div>
  );
}
