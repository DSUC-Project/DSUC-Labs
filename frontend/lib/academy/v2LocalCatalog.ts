import type {
  AcademyV2CourseDetail,
  AcademyV2CourseSummary,
  AcademyV2Instructor,
  AcademyV2Module,
  AcademyV2Path,
  AcademyV2TestCase,
  AcademyV2UnitDetail,
  AcademyV2UnitSummary,
} from '@/types';

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

type BuiltCatalog = {
  paths: AcademyV2Path[];
  courseById: Map<string, AcademyV2CourseDetail>;
  unitByCourseAndId: Map<string, AcademyV2UnitDetail>;
};

let cachedCatalog: BuiltCatalog | null = null;
let loadingCatalog: Promise<BuiltCatalog> | null = null;

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

async function loadSeedData() {
  const [
    learningPathsModule,
    coursesModule,
    modulesModule,
    lessonsModule,
    instructorsModule,
  ] = await Promise.all([
    import('@/content/academy-v2/seed/learningPath.json'),
    import('@/content/academy-v2/seed/course.json'),
    import('@/content/academy-v2/seed/modules.json'),
    import('@/content/academy-v2/seed/lessons.json'),
    import('@/content/academy-v2/seed/instructor.json'),
  ]);

  return {
    learningPaths: learningPathsModule.default as RawLearningPath[],
    courses: coursesModule.default as RawCourse[],
    modules: modulesModule.default as RawModule[],
    lessons: lessonsModule.default as RawLesson[],
    instructors: instructorsModule.default as RawInstructor[],
  };
}

function buildCatalog(seed: Awaited<ReturnType<typeof loadSeedData>>): BuiltCatalog {
  const { learningPaths, courses, modules, lessons, instructors } = seed;
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

async function getBuiltCatalog() {
  if (cachedCatalog) {
    return cachedCatalog;
  }

  if (!loadingCatalog) {
    loadingCatalog = loadSeedData().then((seed) => {
      const built = buildCatalog(seed);
      cachedCatalog = built;
      return built;
    });
  }

  return loadingCatalog;
}

export async function getAcademyV2PathsLocal() {
  return (await getBuiltCatalog()).paths;
}

export async function getAcademyV2CourseLocal(courseId: string) {
  return (
    (await getBuiltCatalog()).courseById.get(String(courseId || '').trim().toLowerCase()) || null
  );
}

export async function getAcademyV2UnitLocal(courseId: string, unitId: string) {
  return (
    (await getBuiltCatalog()).unitByCourseAndId.get(
      `${String(courseId || '').trim().toLowerCase()}:${String(unitId || '')
        .trim()
        .toLowerCase()}`
    ) || null
  );
}
