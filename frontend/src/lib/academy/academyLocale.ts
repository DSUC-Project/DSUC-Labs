import type {
  AcademyTrackCatalog,
  AcademyTrackCatalogLesson,
  AcademyV2CommunityTrack,
  AcademyV2CourseDetail,
  AcademyV2CourseSummary,
  AcademyV2Module,
  AcademyV2Path,
  AcademyV2UnitDetail,
  AcademyV2UnitSummary,
} from "@/types";
import { academyViTranslations } from "@/lib/academy/academyTranslations.generated";

const academyManualVi = {
  paths: {
    "solana-core": {
      title: "Nền tảng Solana",
      tag: "Foundation",
      description:
        "Lộ trình đầy đủ để đi từ con số 0 đến builder Solana. Bạn sẽ nắm các khái niệm cốt lõi, hiểu cách mạng vận hành và build on-chain program đầu tiên.",
    },
    "rust-programs": {
      title: "Rust & Program",
      tag: "Builder",
      description:
        "Làm chủ Rust cho blockchain và Anchor Framework. Viết, test và deploy Solana program theo chuẩn production.",
    },
    frontend: {
      title: "Frontend",
      tag: "UI / UX",
      description:
        "Build giao diện dApp Solana theo chuẩn production. Tích hợp wallet, đọc dữ liệu on-chain và xử lý transaction UX mượt mà.",
    },
    defi: {
      title: "DeFi",
      tag: "DeFi",
      description:
        "Đi sâu vào DeFi trên Solana. Hiểu AMM, lending, token mechanics và cách build các primitive cốt lõi.",
    },
    infrastructure: {
      title: "Infrastructure",
      tag: "Infra",
      description:
        "Tìm hiểu cách vận hành hạ tầng Solana như validator, RPC, indexer và developer tooling cho production.",
    },
    "ai-solana": {
      title: "AI x Solana",
      tag: "AI Agents",
      description:
        "Khám phá giao điểm giữa AI và Solana. Build agent có thể đọc dữ liệu on-chain và thực hiện action theo workflow thực tế.",
    },
    security: {
      title: "Security & Audit",
      tag: "Security",
      description:
        "Học cách review Solana program, nhận diện exploit pattern phổ biến và xây tư duy audit bài bản.",
    },
  },
  courses: {
    "solana-fundamentals": {
      title: "Nền tảng Solana",
      description:
        "Khóa học nhập môn toàn diện về Solana. Bạn sẽ thiết lập môi trường, tạo wallet, gửi transaction, làm việc với SPL token và hiểu mô hình account / program.",
    },
    "building-your-first-solana-program": {
      title: "Build program Solana đầu tiên",
      description:
        "Đưa kiến thức Anchor vào thực hành. Viết, compile và deploy Solana program thật bằng Academy Build Server mà không cần cài toolchain local.",
    },
    "rust-for-solana": {
      title: "Rust cho Solana",
      description:
        "Nắm vững Rust theo đúng nhu cầu viết Solana program: ownership, borrowing, serialization, error handling, PDA và state management.",
    },
    "anchor-framework": {
      title: "Làm chủ Anchor Framework",
      description:
        "Học Anchor Framework từ account constraint đến PDA, CPI, testing và deploy để có thể build program production-ready.",
    },
    "solana-frontend": {
      title: "Frontend Solana",
      description:
        "Build frontend dApp Solana với React và Solana Wallet Adapter. Tập trung vào wallet integration, đọc dữ liệu on-chain và transaction UX.",
    },
    "defi-on-solana": {
      title: "DeFi trên Solana",
      description:
        "Đi sâu vào DeFi trên Solana: AMM, lending, staking, vault, liquidation và cách các primitive này vận hành trong thực tế.",
    },
  },
  communityTracks: {
    "wallet-integration": {
      title: "Tích hợp wallet",
      subtitle: "Kết nối, ký message và giữ flow có nhận diện wallet thật gọn.",
      description:
        "Track thực hành về wallet UX, session, message signing và auth pattern an toàn hơn cho frontend Solana.",
    },
    "onchain-reading": {
      title: "Đọc dữ liệu on-chain",
      subtitle: "RPC methods, account layout và các pattern indexing cơ bản.",
      description:
        "Học cách truy vấn state trên Solana, parse account data và build các tính năng product thiên về dữ liệu đọc.",
    },
    "protocol-security": {
      title: "Rà soát bảo mật protocol",
      subtitle: "Threat model, exploit pattern và góc nhìn security cho team Solana.",
      description:
        "Track về security đang được hoàn thiện để phục vụ review protocol, threat model và các pattern exploit phổ biến.",
    },
  },
} as const;

type UnitTranslation = {
  title?: string;
  content_md?: string;
  hints?: string[];
  solution?: string;
  tests?: Array<{ id?: string; description?: string }>;
};

type CommunityLessonTranslation = {
  title?: string;
  content_md?: string;
  callouts?: Array<{ title?: string; body?: string; text?: string }>;
};

function pickTranslated(
  original: string,
  translated?: string | null,
  manual?: string | null,
) {
  return String(manual || translated || original || "").trim();
}

function localizeUnitSummary(
  courseId: string,
  unit: AcademyV2UnitSummary,
  isVIE: boolean,
) {
  if (!isVIE) {
    return unit;
  }

  const translation = (academyViTranslations.units as Record<string, UnitTranslation>)[
    `${courseId}:${unit.id}`
  ];

  return {
    ...unit,
    title: pickTranslated(unit.title, translation?.title),
  };
}

function localizeModule(
  courseId: string,
  module: AcademyV2Module,
  isVIE: boolean,
) {
  if (!isVIE) {
    return module;
  }

  const translation = (
    academyViTranslations.modules as Record<
      string,
      { title?: string; description?: string }
    >
  )[`${courseId}:${module.id}`];

  return {
    ...module,
    title: pickTranslated(module.title, translation?.title),
    description: pickTranslated(module.description, translation?.description),
    learn_units: module.learn_units.map((unit) =>
      localizeUnitSummary(courseId, unit, isVIE),
    ),
    practice_units: module.practice_units.map((unit) =>
      localizeUnitSummary(courseId, unit, isVIE),
    ),
  };
}

export function localizeAcademyCourseSummary(
  course: AcademyV2CourseSummary,
  isVIE: boolean,
) {
  if (!isVIE) {
    return course;
  }

  const translation = (
    academyViTranslations.courses as Record<
      string,
      { title?: string; description?: string }
    >
  )[course.id];
  const manual = academyManualVi.courses[
    course.id as keyof typeof academyManualVi.courses
  ];

  return {
    ...course,
    title: pickTranslated(course.title, translation?.title, manual?.title),
    description: pickTranslated(
      course.description,
      translation?.description,
      manual?.description,
    ),
  };
}

export function localizeAcademyCourse(
  course: AcademyV2CourseDetail,
  isVIE: boolean,
) {
  if (!isVIE) {
    return course;
  }

  const localizedSummary = localizeAcademyCourseSummary(course, isVIE);

  return {
    ...course,
    ...localizedSummary,
    path_title: course.path_title
      ? pickTranslated(
          course.path_title,
          (academyViTranslations.paths as Record<string, { title?: string }>)[
            course.path_id || ""
          ]?.title,
          course.path_id
            ? academyManualVi.paths[
                course.path_id as keyof typeof academyManualVi.paths
              ]?.title
            : undefined,
        )
      : course.path_title,
    modules: course.modules.map((module) =>
      localizeModule(course.id, module, isVIE),
    ),
  };
}

export function localizeAcademyPath(path: AcademyV2Path, isVIE: boolean) {
  if (!isVIE) {
    return path;
  }

  const translation = (academyViTranslations.paths as Record<
    string,
    { title?: string; tag?: string; description?: string }
  >)[path.id];
  const manual = academyManualVi.paths[
    path.id as keyof typeof academyManualVi.paths
  ];

  return {
    ...path,
    title: pickTranslated(path.title, translation?.title, manual?.title),
    tag: pickTranslated(path.tag, translation?.tag, manual?.tag),
    description: pickTranslated(
      path.description,
      translation?.description,
      manual?.description,
    ),
    courses: path.courses.map((course) =>
      localizeAcademyCourseSummary(course, isVIE),
    ),
  };
}

export function localizeAcademyUnit(
  courseId: string,
  unit: AcademyV2UnitDetail,
  isVIE: boolean,
) {
  if (!isVIE) {
    return unit;
  }

  const translation = (academyViTranslations.units as Record<string, UnitTranslation>)[
    `${courseId}:${unit.id}`
  ];

  return {
    ...unit,
    title: pickTranslated(unit.title, translation?.title),
    content_md: pickTranslated(unit.content_md, translation?.content_md),
    hints:
      translation?.hints && translation.hints.length > 0
        ? translation.hints.slice()
        : unit.hints,
    solution: translation?.solution || unit.solution,
    tests:
      translation?.tests && translation.tests.length > 0
        ? unit.tests.map((test, index) => ({
            ...test,
            description: pickTranslated(
              test.description,
              translation.tests?.[index]?.description,
            ),
          }))
        : unit.tests,
    course_title: pickTranslated(
      unit.course_title,
      (academyViTranslations.courses as Record<
        string,
        { title?: string }
      >)[courseId]?.title,
      academyManualVi.courses[courseId as keyof typeof academyManualVi.courses]
        ?.title,
    ),
    module_title: pickTranslated(
      unit.module_title,
      (academyViTranslations.modules as Record<string, { title?: string }>)[
        `${courseId}:${unit.module_id}`
      ]?.title,
    ),
  };
}

export function localizeAcademyUnitResponse<
  T extends {
    course: AcademyV2CourseDetail;
    unit: AcademyV2UnitDetail;
    previous_unit: AcademyV2UnitSummary | null;
    next_unit: AcademyV2UnitSummary | null;
  },
>(response: T, isVIE: boolean) {
  if (!isVIE) {
    return response;
  }

  const localizedCourse = localizeAcademyCourse(response.course, isVIE);

  return {
    ...response,
    course: localizedCourse,
    unit: localizeAcademyUnit(localizedCourse.id, response.unit, isVIE),
    previous_unit: response.previous_unit
      ? localizeUnitSummary(localizedCourse.id, response.previous_unit, isVIE)
      : null,
    next_unit: response.next_unit
      ? localizeUnitSummary(localizedCourse.id, response.next_unit, isVIE)
      : null,
  };
}

export function localizeCommunityTrackSummary(
  track: AcademyV2CommunityTrack,
  isVIE: boolean,
) {
  if (!isVIE) {
    return track;
  }

  const translation = (
    academyViTranslations.communityTracks as Record<
      string,
      { title?: string; subtitle?: string; description?: string }
    >
  )[track.id];
  const manual = academyManualVi.communityTracks[
    track.id as keyof typeof academyManualVi.communityTracks
  ];

  return {
    ...track,
    title: pickTranslated(track.title, translation?.title, manual?.title),
    subtitle: pickTranslated(
      track.subtitle,
      translation?.subtitle,
      manual?.subtitle,
    ),
    description: pickTranslated(
      track.description,
      translation?.description,
      manual?.description,
    ),
  };
}

function localizeCommunityLesson(
  trackId: string,
  lesson: AcademyTrackCatalogLesson,
  isVIE: boolean,
) {
  if (!isVIE) {
    return lesson;
  }

  const translation = (
    academyViTranslations.communityLessons as Record<
      string,
      CommunityLessonTranslation
    >
  )[`${trackId}:${lesson.id}`];

  return {
    ...lesson,
    title: pickTranslated(lesson.title, translation?.title),
    content_md: pickTranslated(lesson.content_md, translation?.content_md),
    callouts:
      translation?.callouts && translation.callouts.length > 0
        ? translation.callouts
            .map((item, index) => ({
              title: pickTranslated(
                lesson.callouts[index]?.title || "",
                item.title,
              ),
              body: pickTranslated(
                lesson.callouts[index]?.body || "",
                item.body || item.text,
              ),
            }))
            .filter((item) => item.title || item.body)
        : lesson.callouts,
  };
}

export function localizeCommunityCatalogTrack(
  track: AcademyTrackCatalog,
  isVIE: boolean,
) {
  if (!isVIE) {
    return track;
  }

  const translation = (
    academyViTranslations.communityTracks as Record<
      string,
      { title?: string; subtitle?: string; description?: string }
    >
  )[track.id];
  const manual = academyManualVi.communityTracks[
    track.id as keyof typeof academyManualVi.communityTracks
  ];

  return {
    ...track,
    title: pickTranslated(track.title, translation?.title, manual?.title),
    subtitle: pickTranslated(
      track.subtitle,
      translation?.subtitle,
      manual?.subtitle,
    ),
    description: pickTranslated(
      track.description,
      translation?.description,
      manual?.description,
    ),
    lessons: track.lessons.map((lesson) =>
      localizeCommunityLesson(track.id, lesson, isVIE),
    ),
  };
}
