import fs from 'fs';
import path from 'path';

const ACADEMY_V2_PROGRESS_PREFIX = 'academy-v2-';

type Difficulty = 'beginner' | 'intermediate' | 'advanced';
type LessonType = 'content' | 'challenge' | 'quiz';
type LessonSection = 'learn' | 'practice';

type Reference = {
  _ref?: string;
};

type RawLearningPath = {
  _id: string;
  title: string;
  tag?: string;
  order?: number;
  slug?: { current?: string };
  description?: string;
  difficulty?: Difficulty;
  courses?: Reference[];
};

type RawCourse = {
  _id: string;
  title: string;
  slug?: { current?: string };
  description?: string;
  difficulty?: Difficulty;
  duration?: number;
  instructor?: Reference;
  tags?: string[];
  xpReward?: number;
  xpPerLesson?: number;
  trackId?: number;
  trackLevel?: number;
  modules?: Reference[];
};

type RawModule = {
  _id: string;
  title: string;
  description?: string;
  lessons?: Reference[];
  order?: number;
};

type RawLessonTest = {
  _key?: string;
  id?: string;
  description?: string;
  input?: string;
  expectedOutput?: string;
  hidden?: boolean;
};

type RawLesson = {
  _id: string;
  title: string;
  slug?: { current?: string };
  type?: 'content' | 'challenge';
  content?: string;
  code?: string;
  tests?: RawLessonTest[];
  hints?: string[];
  solution?: string;
  xpReward?: number;
  order?: number;
  language?: 'typescript' | 'rust';
  buildType?: 'standard' | 'buildable';
  deployable?: boolean;
  videoUrl?: string;
  widgets?: string[];
};

type RawInstructor = {
  _id: string;
  name?: string;
  bio?: string;
  socialLinks?: {
    twitter?: string;
    github?: string;
  };
};

export type AcademyV2TestCase = {
  id: string;
  description: string;
  input: string;
  expectedOutput: string;
  hidden: boolean;
};

export type AcademyV2Instructor = {
  id: string;
  name: string;
  bio: string;
  socialLinks: {
    twitter?: string;
    github?: string;
  };
};

export type AcademyV2UnitSummary = {
  id: string;
  source_id: string;
  title: string;
  type: LessonType;
  section: LessonSection;
  order: number;
  xp_reward: number;
  language?: 'typescript' | 'rust';
  build_type?: 'standard' | 'buildable';
  deployable?: boolean;
};

export type AcademyV2UnitDetail = AcademyV2UnitSummary & {
  content_md: string;
  code: string;
  tests: AcademyV2TestCase[];
  hints: string[];
  solution: string;
  video_url: string;
  widgets: string[];
  course_id: string;
  course_title: string;
  module_id: string;
  module_title: string;
};

export type AcademyV2Module = {
  id: string;
  title: string;
  description: string;
  order: number;
  learn_units: AcademyV2UnitSummary[];
  practice_units: AcademyV2UnitSummary[];
};

export type AcademyV2CourseSummary = {
  id: string;
  source_id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  duration_hours: number;
  xp_reward: number;
  xp_per_unit: number;
  tags: string[];
  track_level: number;
  thumbnail: string;
  module_count: number;
  learn_unit_count: number;
  practice_unit_count: number;
  total_unit_count: number;
  has_challenge_lab: boolean;
  instructor: AcademyV2Instructor | null;
};

export type AcademyV2CourseDetail = AcademyV2CourseSummary & {
  path_id: string | null;
  path_title: string | null;
  modules: AcademyV2Module[];
};

export type AcademyV2Path = {
  id: string;
  source_id: string;
  title: string;
  tag: string;
  description: string;
  difficulty: Difficulty;
  order: number;
  course_count: number;
  learn_unit_count: number;
  practice_unit_count: number;
  total_unit_count: number;
  courses: AcademyV2CourseSummary[];
};

type BuiltCatalog = {
  paths: AcademyV2Path[];
  courseById: Map<string, AcademyV2CourseDetail>;
  unitByCourseAndId: Map<string, AcademyV2UnitDetail>;
};

let cachedCatalog: BuiltCatalog | null = null;

function seedDir() {
  return path.resolve(__dirname, '../..', 'content', 'academy-v2', 'seed');
}

function readSeedJson<T>(filename: string): T {
  const fullPath = path.join(seedDir(), filename);
  return JSON.parse(fs.readFileSync(fullPath, 'utf8')) as T;
}

function safeDifficulty(value: unknown): Difficulty {
  return value === 'advanced' || value === 'intermediate' ? value : 'beginner';
}

function unitSectionFromType(type: LessonType): LessonSection {
  return type === 'content' ? 'learn' : 'practice';
}

function unitIdFromLesson(lesson: RawLesson) {
  return String(lesson.slug?.current || lesson._id || '')
    .trim()
    .toLowerCase();
}

function courseIdFromCourse(course: RawCourse) {
  return String(course.slug?.current || course._id || '')
    .trim()
    .toLowerCase();
}

function pathIdFromLearningPath(item: RawLearningPath) {
  return String(item.slug?.current || item._id || '')
    .trim()
    .toLowerCase();
}

function normalizeInstructor(raw: RawInstructor | undefined): AcademyV2Instructor | null {
  if (!raw) {
    return null;
  }

  return {
    id: String(raw._id || '').trim(),
    name: String(raw.name || '').trim(),
    bio: String(raw.bio || '').trim(),
    socialLinks: {
      twitter: raw.socialLinks?.twitter,
      github: raw.socialLinks?.github,
    },
  };
}

function normalizeTestCase(item: RawLessonTest, index: number): AcademyV2TestCase {
  return {
    id: String(item.id || item._key || `test-${index + 1}`).trim(),
    description: String(item.description || '').trim(),
    input: String(item.input || '').trim(),
    expectedOutput: String(item.expectedOutput || '').trim(),
    hidden: item.hidden === true,
  };
}

function buildCatalog(): BuiltCatalog {
  const learningPaths = readSeedJson<RawLearningPath[]>('learningPath.json');
  const courses = readSeedJson<RawCourse[]>('course.json');
  const modules = readSeedJson<RawModule[]>('modules.json');
  const lessons = readSeedJson<RawLesson[]>('lessons.json');
  const instructors = readSeedJson<RawInstructor[]>('instructor.json');

  const courseMap = new Map(courses.map((item) => [item._id, item]));
  const moduleMap = new Map(modules.map((item) => [item._id, item]));
  const lessonMap = new Map(lessons.map((item) => [item._id, item]));
  const instructorMap = new Map(instructors.map((item) => [item._id, item]));

  const courseById = new Map<string, AcademyV2CourseDetail>();
  const unitByCourseAndId = new Map<string, AcademyV2UnitDetail>();

  const paths = learningPaths
    .map((pathItem) => {
      const pathId = pathIdFromLearningPath(pathItem);
      const builtCourses = (pathItem.courses || [])
        .map((ref) => (ref._ref ? courseMap.get(ref._ref) : null))
        .filter(Boolean)
        .map((courseItem) => {
          const course = courseItem as RawCourse;
          const courseId = courseIdFromCourse(course);
          const instructor = normalizeInstructor(
            course.instructor?._ref ? instructorMap.get(course.instructor._ref) : undefined
          );

          const builtModules = (course.modules || [])
            .map((ref) => (ref._ref ? moduleMap.get(ref._ref) : null))
            .filter(Boolean)
            .sort((left, right) => Number(left?.order || 0) - Number(right?.order || 0))
            .map((moduleItem) => {
              const module = moduleItem as RawModule;
              const moduleUnits = (module.lessons || [])
                .map((ref) => (ref._ref ? lessonMap.get(ref._ref) : null))
                .filter(Boolean)
                .sort((left, right) => Number(left?.order || 0) - Number(right?.order || 0))
                .map((lessonItem) => {
                  const lesson = lessonItem as RawLesson;
                  const type = (lesson.type || 'content') as LessonType;
                  const unitId = unitIdFromLesson(lesson);
                  const summary: AcademyV2UnitSummary = {
                    id: unitId,
                    source_id: lesson._id,
                    title: String(lesson.title || '').trim(),
                    type,
                    section: unitSectionFromType(type),
                    order: Number(lesson.order || 0),
                    xp_reward: Number(lesson.xpReward || course.xpPerLesson || 0),
                    language: lesson.language,
                    build_type: lesson.buildType,
                    deployable: lesson.deployable === true,
                  };

                  const detail: AcademyV2UnitDetail = {
                    ...summary,
                    content_md: String(lesson.content || '').trim(),
                    code: String(lesson.code || '').trim(),
                    tests: Array.isArray(lesson.tests)
                      ? lesson.tests.map((item, index) => normalizeTestCase(item, index))
                      : [],
                    hints: Array.isArray(lesson.hints)
                      ? lesson.hints.map((item) => String(item || '').trim()).filter(Boolean)
                      : [],
                    solution: String(lesson.solution || '').trim(),
                    video_url: String(lesson.videoUrl || '').trim(),
                    widgets: Array.isArray(lesson.widgets)
                      ? lesson.widgets.map((item) => String(item || '').trim()).filter(Boolean)
                      : [],
                    course_id: courseId,
                    course_title: String(course.title || '').trim(),
                    module_id: String(module._id || '').trim(),
                    module_title: String(module.title || '').trim(),
                  };

                  unitByCourseAndId.set(`${courseId}:${unitId}`, detail);
                  return summary;
                });

              return {
                id: String(module._id || '').trim(),
                title: String(module.title || '').trim(),
                description: String(module.description || '').trim(),
                order: Number(module.order || 0),
                learn_units: moduleUnits.filter((unit) => unit.section === 'learn'),
                practice_units: moduleUnits.filter((unit) => unit.section === 'practice'),
              } satisfies AcademyV2Module;
            });

          const moduleCount = builtModules.length;
          const learnUnitCount = builtModules.reduce(
            (sum, module) => sum + module.learn_units.length,
            0
          );
          const practiceUnitCount = builtModules.reduce(
            (sum, module) => sum + module.practice_units.length,
            0
          );
          const totalUnitCount = learnUnitCount + practiceUnitCount;

          const summary: AcademyV2CourseSummary = {
            id: courseId,
            source_id: course._id,
            title: String(course.title || '').trim(),
            description: String(course.description || '').trim(),
            difficulty: safeDifficulty(course.difficulty),
            duration_hours: Number(course.duration || 0),
            xp_reward: Number(course.xpReward || 0),
            xp_per_unit: Number(course.xpPerLesson || 0),
            tags: Array.isArray(course.tags)
              ? course.tags.map((item) => String(item || '').trim()).filter(Boolean)
              : [],
            track_level: Number(course.trackLevel || 0),
            thumbnail: '/logo.png',
            module_count: moduleCount,
            learn_unit_count: learnUnitCount,
            practice_unit_count: practiceUnitCount,
            total_unit_count: totalUnitCount,
            has_challenge_lab: practiceUnitCount > 0,
            instructor,
          };

          courseById.set(courseId, {
            ...summary,
            path_id: pathId,
            path_title: String(pathItem.title || '').trim(),
            modules: builtModules,
          });

          return summary;
        })
        .sort((left, right) => Number(left.track_level || 0) - Number(right.track_level || 0));

      return {
        id: pathId,
        source_id: pathItem._id,
        title: String(pathItem.title || '').trim(),
        tag: String(pathItem.tag || '').trim(),
        description: String(pathItem.description || '').trim(),
        difficulty: safeDifficulty(pathItem.difficulty),
        order: Number(pathItem.order || 0),
        course_count: builtCourses.length,
        learn_unit_count: builtCourses.reduce((sum, course) => sum + course.learn_unit_count, 0),
        practice_unit_count: builtCourses.reduce(
          (sum, course) => sum + course.practice_unit_count,
          0
        ),
        total_unit_count: builtCourses.reduce((sum, course) => sum + course.total_unit_count, 0),
        courses: builtCourses,
      } satisfies AcademyV2Path;
    })
    .sort((left, right) => Number(left.order || 0) - Number(right.order || 0));

  return {
    paths,
    courseById,
    unitByCourseAndId,
  };
}

function getBuiltCatalog() {
  if (!cachedCatalog) {
    cachedCatalog = buildCatalog();
  }

  return cachedCatalog;
}

export function getAcademyV2Paths() {
  return getBuiltCatalog().paths;
}

export function getAcademyV2Course(courseId: string) {
  return getBuiltCatalog().courseById.get(String(courseId || '').trim().toLowerCase()) || null;
}

export function getAcademyV2Unit(courseId: string, unitId: string) {
  return (
    getBuiltCatalog().unitByCourseAndId.get(
      `${String(courseId || '').trim().toLowerCase()}:${String(unitId || '')
        .trim()
        .toLowerCase()}`
    ) || null
  );
}

export function buildAcademyV2ProgressTrack(courseId: string) {
  return `${ACADEMY_V2_PROGRESS_PREFIX}${String(courseId || '').trim().toLowerCase()}`;
}

export function academyV2CourseIdFromProgressTrack(track: string) {
  const normalized = String(track || '').trim().toLowerCase();

  if (normalized.startsWith(ACADEMY_V2_PROGRESS_PREFIX)) {
    return normalized.slice(ACADEMY_V2_PROGRESS_PREFIX.length);
  }

  // Backward compatibility for any early progress rows saved before namespacing.
  if (getAcademyV2Course(normalized)) {
    return normalized;
  }

  return '';
}

export function isAcademyV2ProgressTarget(track: string, unitId: string) {
  const courseId = academyV2CourseIdFromProgressTrack(track);
  return !!courseId && !!getAcademyV2Unit(courseId, unitId);
}
