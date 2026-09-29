import { memo, useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { PRACTICE_TEXTS } from './practiceTexts'

type FingerId = 'left-pinky' | 'left-ring' | 'left-middle' | 'left-index' | 'left-thumb' | 'right-thumb' | 'right-index' | 'right-middle' | 'right-ring' | 'right-pinky'
type DrillStatus = 'ready' | 'correct' | 'incorrect' | 'complete'
type DrillId = 1 | 2 | 3 | 4 | 5 | 6
type LessonId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
type AppLanguage = 'en' | 'vi'
type PracticeLanguage = 'en' | 'vi'
type LocalizedText = Record<AppLanguage, string>
type Screen = 'lesson' | 'basics' | 'drill' | 'daily' | 'test' | 'settings' | 'about'
type Drill = { id: DrillId; name: LocalizedText; title: LocalizedText; hint: LocalizedText; content: string; duration: string }
type NewKey = { key: string; finger: FingerId; label: LocalizedText }
type LessonData = {
  id: LessonId
  title: LocalizedText
  description: LocalizedText
  keySummary: string
  newKeyCharacters: string
  newKeys: NewKey[]
  newKeysIntro: LocalizedText
  keyDrillGroups: string[]
  wordLines: string[]
  sentenceLines: string[]
  paragraphLines: string[]
  textLines: string[]
  drills: Drill[]
}

type SavedProgress = {
  version: 1
  screen: Screen
  activeLessonId: LessonId
  activeDrillId: DrillId
  basicsComplete: boolean
  basicsPage: number
  completedDrills: string[]
  position: number
  mistakes: number
  typedText: string
  status: DrillStatus
  keystrokes: number
  secondsLeft: number
  started: boolean
  isPaused: boolean
  showGuides: boolean
}

const DRILL_TIME_LIMIT = 5 * 60
const PROGRESS_STORAGE_KEY = 'typing-speed-vn-progress-v1'
const KEY_DRILL_PAGE_SIZE = 6
const PARAGRAPH_PAGE_SIZE = 2
const VIETNAMESE_CHARACTERS = /[ăâđêôơưàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]/i
const BASICS_SLIDE_TITLES: Record<AppLanguage, string[]> = {
  en: ['What Is Touch Typing?', 'Finger Positions', 'Pressing Keys', 'Learning Tips', 'Ready to Start'],
  vi: ['Gõ 10 ngón là gì?', 'Vị trí các ngón tay', 'Cách nhấn phím', 'Mẹo luyện tập', 'Sẵn sàng bắt đầu'],
}

const UI_COPY = {
  en: {
    courseLabel: 'English · Beginner', courseEyebrow: 'English typing course', courseTitle: 'Fast Touch Typing Course', complete: 'complete', typingTerm: 'Touch typing',
    lessonList: 'Lesson list', comingSoon: 'Coming soon', lesson: 'Lesson', touchTypingBasics: 'Touch Typing Basics', touchTypingSummary: 'Ten-finger typing technique',
    hint: 'Tip:', lessonHint: 'complete the exercises in order so your fingers learn each position before you increase speed.',
    cancel: 'Cancel', next: 'Next', again: 'Again', startNewKeys: 'Start New Keys', startKeyDrill: 'Start Key Drill',
    keyboardWarning: 'Switch your keyboard to EN for the best experience.', newKeysAria: 'New keys and their matching fingers',
    timeUp: 'Time is up', completed: 'Completed', timedOut: 'The drill ended automatically.', resultsReady: 'Your results are ready in the panel.',
    keyInstructionTop: 'Type the key sequences and follow the highlighted key.', keyInstructionBottom: 'Use the on-screen keyboard and hands for hints when needed.',
    sampleParagraph: 'Sample paragraph', sampleText: 'Sample text',
    preferences: 'Preferences', settings: 'Settings', settingsLead: 'Simple controls for your typing practice experience.',
    keyboardLayout: 'Keyboard layout', keyboardHands: 'Keyboard & hands', keyboardHandsHelp: 'Show visual guidance during typing drills',
    interfaceLanguage: 'Interface language', courseContent: 'Practice content', englishCourse: 'English course', backToCourse: 'Back to course',
    aboutProject: 'About this project', aboutLead: 'A step-by-step typing app focused on accuracy, finger response, and speed.', versionCourse: 'Version 0.1.0 · English course', openCourse: 'Open course',
    menu: 'Program menu', studying: 'Studying', about: 'About', timer: 'Time', pause: 'Pause', resume: 'Resume', result: 'Result',
    timeUsed: 'Time Used', grossSpeed: 'Gross Speed', accuracy: 'Accuracy', netSpeed: 'Net Speed', drillControls: 'Drill controls',
    navCourse: 'Course', navDaily: 'Daily practice', navTest: '1-minute test', backToSite: 'Student Guide', contactReport: 'Contact & report',
    dailyTitle: 'Daily Practice', dailyLead: 'Build a steady habit with a new passage each day.', testTitle: '1-Minute Speed Test', testLead: 'Measure your current typing speed in a focused 60-second test.',
    practiceLanguage: 'Text language', englishLanguage: 'English', vietnameseLanguage: 'Vietnamese', duration: 'Duration', minutes: 'minutes', start: 'Start', restart: 'Restart', finish: 'Finish', words: 'words', errors: 'errors',
    dailyRecommendation: 'Complete all 12 lessons first for the best practice experience.', dailyReady: 'Today’s practice is ready.', typeHere: 'Start typing here…', referenceText: 'Reference text', practiceResult: 'Practice result',
    basics: {
      intro: 'is a technique for typing faster and more accurately with all ten fingers without looking at the keyboard.', afterCourse: 'After completing the course, you will be able to:',
      benefits: ['Type faster with all 10 fingers.', 'Reduce errors and keep a steady rhythm.', 'Focus on the content on screen.', 'Build more comfortable working habits.'], hero: 'fingers\none rhythm',
      positionIntro: 'Your fingers begin on the home row. From there, they reach other keys and return to their starting positions.',
      positionSteps: ['Place your left hand on A S D F.', 'Place your right hand on J K L ;.', 'Rest both thumbs lightly on Space.', 'Keep your wrists straight and your hands relaxed.'],
      positionTip: 'The small bumps on F and J help you find the home row without looking down.', pressHeading: 'Move the nearest finger',
      pressSteps: ['Keep your fingers on the home row.', 'Move the finger nearest to the target key.', 'Press quickly and lightly while keeping your hand relaxed.', 'Return the finger to its home-row key.'],
      spaceHeading: 'The Space Bar', spaceText: 'Use one consistent thumb for Space. Keeping the same thumb helps maintain a steady rhythm.', demo: 'Example: use your right index finger to type U',
      tips: [
        ['Keep Your Eyes on the Monitor', 'You will learn key positions faster when you do not look down at the keyboard.'],
        ['Keep Your Wrists Straight', 'Avoid pressing your wrists into the desk so your fingers can move freely.'],
        ['Focus on Accuracy', 'Type correctly first; speed will grow naturally as your reflexes improve.'],
        ['Keep a Steady Rhythm', 'Use light, even keystrokes instead of short bursts of speed.'],
      ],
      readyIntro: 'Before you begin, check these points:',
      checklist: [
        ['Relaxed posture:', 'sit upright, keep elbows near your body, and relax your shoulders and hands.'],
        ['Take breaks:', 'stop when your hands or shoulders begin to feel tense.'],
        ['Use Pause when needed:', 'you do not need to finish a drill while distracted.'],
        ['Do not look down:', 'use the on-screen keyboard and hands when you need guidance.'],
      ],
      ready: 'You are ready!', readyText: 'The next exercise introduces your first eight keys: A S D F · J K L ;',
    },
  },
  vi: {
    courseLabel: 'Tiếng Anh · Cơ bản', courseEyebrow: 'Khóa học gõ tiếng Anh', courseTitle: 'Khóa học gõ 10 ngón', complete: 'đã hoàn thành', typingTerm: 'Gõ 10 ngón',
    lessonList: 'Danh sách bài học', comingSoon: 'Sắp ra mắt', lesson: 'Bài', touchTypingBasics: 'Kỹ thuật gõ 10 ngón', touchTypingSummary: 'Nền tảng gõ bằng mười ngón',
    hint: 'Gợi ý:', lessonHint: 'hoàn thành theo thứ tự để ngón tay quen vị trí trước khi tăng tốc.',
    cancel: 'Hủy', next: 'Tiếp theo', again: 'Làm lại', startNewKeys: 'Bắt đầu Phím mới', startKeyDrill: 'Bắt đầu Luyện phím',
    keyboardWarning: 'Hãy chuyển bàn phím sang EN để có trải nghiệm tốt hơn.', newKeysAria: 'Các phím mới và ngón tay tương ứng',
    timeUp: 'Hết giờ', completed: 'Hoàn thành', timedOut: 'Bài luyện đã tự động kết thúc.', resultsReady: 'Kết quả đã sẵn sàng ở bảng bên phải.',
    keyInstructionTop: 'Gõ các chuỗi phím theo phím đang được làm nổi bật.', keyInstructionBottom: 'Nhìn bàn phím và bàn tay trên màn hình để xem gợi ý khi cần.',
    sampleParagraph: 'Đoạn văn mẫu', sampleText: 'Văn bản mẫu',
    preferences: 'Tùy chọn', settings: 'Cài đặt', settingsLead: 'Các thiết lập ngắn gọn cho trải nghiệm luyện gõ.',
    keyboardLayout: 'Bố cục bàn phím', keyboardHands: 'Bàn phím và bàn tay', keyboardHandsHelp: 'Hiện hướng dẫn trực quan trong bài luyện',
    interfaceLanguage: 'Ngôn ngữ giao diện', courseContent: 'Nội dung luyện tập', englishCourse: 'Khóa học tiếng Anh', backToCourse: 'Quay lại khóa học',
    aboutProject: 'Về dự án', aboutLead: 'Ứng dụng luyện gõ theo từng bước, tập trung vào độ chính xác, phản xạ ngón tay và tốc độ.', versionCourse: 'Phiên bản 0.1.0 · Khóa học tiếng Anh', openCourse: 'Mở khóa học',
    menu: 'Menu chương trình', studying: 'Học tập', about: 'Giới thiệu', timer: 'Thời gian', pause: 'Tạm dừng', resume: 'Tiếp tục', result: 'Kết quả',
    timeUsed: 'Thời gian dùng', grossSpeed: 'Tốc độ thô', accuracy: 'Độ chính xác', netSpeed: 'Tốc độ thực', drillControls: 'Điều khiển bài luyện',
    navCourse: 'Khóa học', navDaily: 'Luyện mỗi ngày', navTest: 'Test 1 phút', backToSite: 'Cẩm nang sinh viên', contactReport: 'Liên hệ & báo lỗi',
    dailyTitle: 'Luyện tập mỗi ngày', dailyLead: 'Tạo thói quen đều đặn với một đoạn văn mới mỗi ngày.', testTitle: 'Test tốc độ 1 phút', testLead: 'Đo tốc độ gõ hiện tại trong một bài kiểm tra tập trung 60 giây.',
    practiceLanguage: 'Ngôn ngữ bài gõ', englishLanguage: 'Tiếng Anh', vietnameseLanguage: 'Tiếng Việt', duration: 'Thời lượng', minutes: 'phút', start: 'Bắt đầu', restart: 'Làm lại', finish: 'Kết thúc', words: 'từ', errors: 'lỗi',
    dailyRecommendation: 'Hãy hoàn thành đủ 12 bài học trước để có trải nghiệm luyện tập tốt nhất.', dailyReady: 'Bài luyện hôm nay đã sẵn sàng.', typeHere: 'Bắt đầu gõ tại đây…', referenceText: 'Văn bản mẫu', practiceResult: 'Kết quả luyện tập',
    basics: {
      intro: 'là kỹ thuật gõ nhanh và chính xác bằng cả mười ngón tay mà không cần nhìn xuống bàn phím.', afterCourse: 'Sau khóa học, bạn sẽ có thể:',
      benefits: ['Gõ nhanh hơn bằng cả 10 ngón.', 'Giảm lỗi và giữ nhịp gõ ổn định.', 'Tập trung vào nội dung trên màn hình.', 'Hình thành tư thế làm việc thoải mái hơn.'], hero: 'ngón tay\nmột nhịp gõ',
      positionIntro: 'Các ngón tay bắt đầu ở hàng cơ sở. Từ đây, bạn có thể với tới những phím còn lại rồi quay về vị trí ban đầu.',
      positionSteps: ['Tay trái đặt trên A S D F.', 'Tay phải đặt trên J K L ;.', 'Hai ngón cái nghỉ nhẹ trên phím Space.', 'Giữ cổ tay thẳng, bàn tay thả lỏng.'],
      positionTip: 'Gờ nhỏ trên F và J giúp bạn tìm lại hàng cơ sở mà không cần nhìn bàn phím.', pressHeading: 'Di chuyển ngón gần nhất',
      pressSteps: ['Giữ các ngón ở hàng cơ sở.', 'Di chuyển ngón gần phím cần gõ nhất.', 'Nhấn nhanh, nhẹ và giữ bàn tay thư giãn.', 'Đưa ngón tay trở lại phím cơ sở.'],
      spaceHeading: 'Phím Space', spaceText: 'Dùng một ngón cái cố định để nhấn Space. Không đổi ngón cái giữa lúc luyện để nhịp gõ nhất quán.', demo: 'Ví dụ: dùng ngón trỏ phải để gõ U',
      tips: [
        ['Nhìn vào màn hình', 'Bạn sẽ ghi nhớ vị trí phím nhanh hơn khi không nhìn xuống bàn phím.'],
        ['Giữ cổ tay thẳng', 'Không tì mạnh cổ tay xuống bàn để các ngón di chuyển nhẹ nhàng.'],
        ['Ưu tiên độ chính xác', 'Gõ đúng trước, tốc độ sẽ tăng tự nhiên khi phản xạ đã ổn định.'],
        ['Giữ nhịp đều', 'Nhấn phím nhẹ và đều thay vì cố gõ thật nhanh trong thời gian ngắn.'],
      ],
      readyIntro: 'Trước khi bắt đầu, hãy kiểm tra nhanh:',
      checklist: [
        ['Tư thế thư giãn:', 'ngồi thẳng, khuỷu tay gần cơ thể, vai và bàn tay thả lỏng.'],
        ['Nghỉ giữa các bài:', 'dừng lại khi tay hoặc vai bắt đầu căng.'],
        ['Dùng Tạm dừng khi cần:', 'không cần cố hoàn thành bài khi mất tập trung.'],
        ['Không nhìn bàn phím:', 'dùng bàn phím và bàn tay trên màn hình để nhận gợi ý.'],
      ],
      ready: 'Sẵn sàng rồi!', readyText: 'Bài tiếp theo sẽ giới thiệu tám phím đầu tiên: A S D F · J K L ;',
    },
  },
} as const
const LESSON_1_KEY_GROUPS = ['aa ', 'dd ', 'ss ', 'ff ', 'jj ', 'kk ', 'll ', ';; ']
const LESSON_1_WORD_LINES = ['sad dad all fall', 'ask flask salad lass;', 'sad dad fall ask;', 'all dads add salad;', 'a lass asks a lad;', 'flasks fall; dads ask;', 'salad falls; all lads;']
const LESSON_1_SENTENCE_LINES = ['a lad asks a dad;', 'a sad lass falls;', 'a dad asks a lad;', 'all dads add salad;', 'a flask falls;', 'a lass asks a lad;', 'dad adds salad; lads fall;']
const LESSON_1_PARAGRAPH_LINES = [
  'a lad asks a dad; a sad lass falls;',
  'a dad adds salad; a flask falls;',
  'a lass asks a lad; all dads add salad;',
  'all dads add salad; lads ask;',
  'a flask falls; a lad asks;',
  'salad falls; all lads ask;',
  'a lass adds salad; dad asks;',
  'all flasks fall; lads ask;',
  'dad adds; a lass asks;',
  'a sad lad asks; a lass adds salad;',
  'all dads fall; a flask falls;',
  'a lad adds salad; dads ask;',
  'all lads ask; a sad lass falls;',
]

const LESSON_2_KEY_GROUPS = ['ee ', 'ii ', 'de ', 'ki ', 'ed ', 'ik ', 'ei ', 'ie ']
const LESSON_2_WORD_LINES = ['did lie like idea', 'side file life idle', 'desk slide field;', 'skill likes silk;', 'ideal file; dad likes;', 'a kid likes salad;', 'seaside feels ideal;']
const LESSON_2_SENTENCE_LINES = ['a lad likes a file;', 'a dad sees a desk;', 'a lass likes salad;', 'a kid fills a flask;', 'a file is ideal;', 'all lads like silk;', 'a sad lass feels ill;']
const LESSON_2_PARAGRAPH_LINES = [
  'a lad likes a file; a dad sees a desk;',
  'a lass likes salad; a kid fills a flask;',
  'a file is ideal; all lads like silk;',
  'a sad lass feels ill; a dad asks a kid;',
  'all kids like slides; a lad likes ideas;',
  'a desk is ideal; files feel alike;',
  'a kid adds salad; a lass fills a flask;',
  'silk feels ideal; a file is safe;',
  'all lads like fields; dads like desks;',
  'a kid likes a file; a lass likes silk;',
  'a dad sees a field; a lad slides;',
  'all kids like ideas; files feel ideal;',
  'a lass fills a flask; dads like salad;',
]

const LESSON_3_KEY_GROUPS = ['rr ', 'uu ', 'fr ', 'ju ', 'rf ', 'uj ', 'ru ', 'ur ']
const LESSON_3_WORD_LINES = ['run fur rub jar', 'rural jury runs;', 'four jars are full;', 'just run; fur is rough;', 'a jury finds a fair rule;', 'four small jars run dry;', 'the rural road is rough;']
const LESSON_3_SENTENCE_LINES = ['a fair rule is just;', 'four jars are full;', 'run up the rural road;', 'the jury finds a flaw;', 'a rough fur rug falls;', 'use your right finger;', 'a fair trial is yours;']
const LESSON_3_PARAGRAPH_LINES = [
  'a fair rule is just; four jars are full;',
  'run up the rural road; the jury finds a flaw;',
  'a rough fur rug falls; use your right finger;',
  'four small jars are full; a rural road is rough;',
  'the jury runs a fair trial; a rule is just;',
  'use your right finger; return to the home row;',
  'a fair result is yours; run the full drill;',
  'the rural road turns; four jars are safe;',
  'just use a light touch; your form is strong;',
  'a rough start is fine; your rhythm will grow;',
  'four full rows are ready; run the next line;',
  'your fingers return; the home row stays firm;',
]
const LESSON_3_TEXT_LINES = [
  'a calm rhythm makes every practice session feel easier.',
  'use the right finger, then return to the home row.',
  'keep your wrists relaxed and let each press stay light.',
  'read the line first, then type it with steady focus.',
  'small improvements grow into fluent, accurate typing.',
  'finish this text drill and review your result with care.',
]

type ModelContext = {
  registerTool: (tool: {
    name: string
    title: string
    description: string
    inputSchema: object
    annotations: { readOnlyHint: boolean; untrustedContentHint: boolean }
    execute: () => object
  }, options?: { signal?: AbortSignal }) => void | Promise<void>
}

declare global {
  interface Document { modelContext?: ModelContext }
}

const LESSON_1_NEW_KEYS: NewKey[] = [
  { key: 'A', finger: 'left-pinky', label: { en: 'Left pinky', vi: 'Út trái' } },
  { key: 'S', finger: 'left-ring', label: { en: 'Left ring', vi: 'Áp út trái' } },
  { key: 'D', finger: 'left-middle', label: { en: 'Left middle', vi: 'Giữa trái' } },
  { key: 'F', finger: 'left-index', label: { en: 'Left index', vi: 'Trỏ trái' } },
  { key: 'J', finger: 'right-index', label: { en: 'Right index', vi: 'Trỏ phải' } },
  { key: 'K', finger: 'right-middle', label: { en: 'Right middle', vi: 'Giữa phải' } },
  { key: 'L', finger: 'right-ring', label: { en: 'Right ring', vi: 'Áp út phải' } },
  { key: ';', finger: 'right-pinky', label: { en: 'Right pinky', vi: 'Út phải' } },
]

const LESSON_2_NEW_KEYS: NewKey[] = [
  { key: 'E', finger: 'left-middle', label: { en: 'Left middle', vi: 'Giữa trái' } },
  { key: 'I', finger: 'right-middle', label: { en: 'Right middle', vi: 'Giữa phải' } },
]

const LESSON_3_NEW_KEYS: NewKey[] = [
  { key: 'R', finger: 'left-index', label: { en: 'Left index', vi: 'Trỏ trái' } },
  { key: 'U', finger: 'right-index', label: { en: 'Right index', vi: 'Trỏ phải' } },
]

const FINGER_SHORT_LABELS: Record<FingerId, LocalizedText> = {
  'left-pinky': { en: 'Left pinky', vi: 'Út trái' }, 'left-ring': { en: 'Left ring', vi: 'Áp út trái' }, 'left-middle': { en: 'Left middle', vi: 'Giữa trái' }, 'left-index': { en: 'Left index', vi: 'Trỏ trái' }, 'left-thumb': { en: 'Left thumb', vi: 'Cái trái' },
  'right-thumb': { en: 'Right thumb', vi: 'Cái phải' }, 'right-index': { en: 'Right index', vi: 'Trỏ phải' }, 'right-middle': { en: 'Right middle', vi: 'Giữa phải' }, 'right-ring': { en: 'Right ring', vi: 'Áp út phải' }, 'right-pinky': { en: 'Right pinky', vi: 'Út phải' },
}

function createLesson({ id, keys, fingers, wordLines, sentenceLines, paragraphLines }: {
  id: LessonId
  keys: string[]
  fingers: FingerId[]
  wordLines: string[]
  sentenceLines: string[]
  paragraphLines: string[]
}): LessonData {
  const keySummary = keys.join(' · ')
  const lowerKeys = keys.map((key) => key.toLowerCase())
  const keyDrillGroups = [
    `${lowerKeys[0]}${lowerKeys[0]} `, `${lowerKeys[1]}${lowerKeys[1]} `,
    `${lowerKeys[0]}${lowerKeys[1]} `, `${lowerKeys[1]}${lowerKeys[0]} `,
    `f${lowerKeys[0]} `, `j${lowerKeys[1]} `, `${lowerKeys[0]}j `, `${lowerKeys[1]}f `,
  ]
  const drills: Drill[] = [
    { id: 1, name: { en: 'New Keys', vi: 'Phím mới' }, title: { en: `Meet the ${keySummary} keys`, vi: `Làm quen với phím ${keySummary}` }, hint: { en: `Learn the fingers for ${keySummary}`, vi: `Ghi nhớ ngón tay cho ${keySummary}` }, content: '', duration: '2–3 min.' },
    { id: 2, name: { en: 'Key Drill', vi: 'Luyện phím' }, title: { en: `Build a steady ${keySummary} reach`, vi: `Luyện nhịp vươn tới ${keySummary}` }, hint: { en: 'Return to the home row after every reach', vi: 'Trở về hàng cơ sở sau mỗi lần vươn ngón' }, content: keyDrillGroups.join(''), duration: '3–5 min.' },
    { id: 3, name: { en: 'Word Drill', vi: 'Luyện từ' }, title: { en: `Build words with ${keySummary}`, vi: `Ghép từ với ${keySummary}` }, hint: { en: 'Finish one line to reveal the next', vi: 'Gõ hết một dòng để hiện dòng tiếp theo' }, content: wordLines.join(''), duration: '3–5 min.' },
    { id: 4, name: { en: 'Sentence Drill', vi: 'Luyện câu' }, title: { en: `Use ${keySummary} in short sentences`, vi: `Dùng ${keySummary} trong câu ngắn` }, hint: { en: 'Finish each line and press Enter', vi: 'Gõ hết mỗi dòng rồi nhấn Enter' }, content: sentenceLines.map((line) => `${line}\n`).join(''), duration: '3–5 min.' },
    { id: 5, name: { en: 'Paragraph Drill', vi: 'Luyện đoạn văn' }, title: { en: `Practice ${keySummary} in paragraphs`, vi: `Luyện ${keySummary} trong đoạn văn` }, hint: { en: 'Keep a calm, accurate rhythm', vi: 'Giữ nhịp gõ bình tĩnh và chính xác' }, content: paragraphLines.map((line) => `${line}\n`).join(''), duration: '4–6 min.' },
  ]
  drills.push({ id: 6, name: { en: 'Text Drill', vi: 'Luyện văn bản' }, title: { en: `Practice a focused text with ${keySummary}`, vi: `Luyện văn bản tập trung với ${keySummary}` }, hint: { en: 'Type without keyboard or hand guides', vi: 'Gõ không có hướng dẫn bàn phím và bàn tay' }, content: paragraphLines.map((line) => `${line}\n`).join(''), duration: '5–7 min.' })
  return {
    id,
    title: { en: `Lesson ${id}: ${keySummary}`, vi: `Bài ${id}: ${keySummary}` },
    description: { en: `Add ${keySummary} to the keys you already know and keep returning to the home row.`, vi: `Thêm ${keySummary} vào nhóm phím đã học và luôn đưa ngón tay trở về hàng cơ sở.` },
    keySummary,
    newKeyCharacters: lowerKeys.join(''),
    newKeys: keys.map((key, index) => ({ key, finger: fingers[index], label: FINGER_SHORT_LABELS[fingers[index]] })),
    newKeysIntro: { en: `Keep your hands relaxed. Reach for ${keySummary} with the highlighted fingers, then return to the home row.`, vi: `Giữ tay thư giãn. Vươn tới ${keySummary} bằng các ngón được tô màu, rồi trở về hàng cơ sở.` },
    keyDrillGroups,
    wordLines,
    sentenceLines,
    paragraphLines,
    textLines: paragraphLines,
    drills,
  }
}

const LESSONS: Record<LessonId, LessonData> = {
  1: {
    id: 1,
    title: { en: 'The Home Row: A S D F · J K L ;', vi: 'Hàng phím cơ sở: A S D F · J K L ;' },
    description: { en: 'Learn the home-row positions, then progress from single keys to complete paragraphs.', vi: 'Học vị trí hàng phím cơ sở, sau đó tiến dần từ phím đơn đến đoạn văn hoàn chỉnh.' },
    keySummary: 'A S D F · J K L ;',
    newKeyCharacters: 'asdfjkl;',
    newKeys: LESSON_1_NEW_KEYS,
    newKeysIntro: { en: 'Place your fingers on A S D F and J K L ;. The small bumps on F and J help you find the home row without looking down.', vi: 'Đặt các ngón tay lên A S D F và J K L ;. Hai phím F và J có gờ nhỏ để tìm lại vị trí mà không cần nhìn xuống.' },
    keyDrillGroups: LESSON_1_KEY_GROUPS,
    wordLines: LESSON_1_WORD_LINES,
    sentenceLines: LESSON_1_SENTENCE_LINES,
    paragraphLines: LESSON_1_PARAGRAPH_LINES,
    textLines: LESSON_1_PARAGRAPH_LINES,
    drills: [
      { id: 1, name: { en: 'New Keys', vi: 'Phím mới' }, title: { en: 'Meet the home-row keys', vi: 'Làm quen với hàng phím cơ sở' }, hint: { en: 'Place your fingers on A S D F and J K L ;', vi: 'Đặt các ngón tay lên A S D F và J K L ;' }, content: '', duration: '2–3 min.' },
      { id: 2, name: { en: 'Key Drill', vi: 'Luyện phím' }, title: { en: 'Keep your fingers on the home row', vi: 'Giữ các ngón tay trên hàng cơ sở' }, hint: { en: 'Repeat each key to remember its position', vi: 'Lặp lại từng phím để ghi nhớ vị trí' }, content: LESSON_1_KEY_GROUPS.join(''), duration: '3–5 min.' },
      { id: 3, name: { en: 'Word Drill', vi: 'Luyện từ' }, title: { en: 'Build words with home-row keys', vi: 'Ghép từ bằng các phím hàng cơ sở' }, hint: { en: 'Finish one line to reveal the next', vi: 'Gõ hết một dòng để hiện dòng từ tiếp theo' }, content: LESSON_1_WORD_LINES.join(''), duration: '3–5 min.' },
      { id: 4, name: { en: 'Sentence Drill', vi: 'Luyện câu' }, title: { en: 'Connect words into short sentences', vi: 'Ghép từ thành các câu ngắn' }, hint: { en: 'Finish each line and press Enter', vi: 'Gõ hết mỗi dòng rồi nhấn Enter để sang dòng tiếp theo' }, content: LESSON_1_SENTENCE_LINES.map((line) => `${line}\n`).join(''), duration: '3–5 min.' },
      { id: 5, name: { en: 'Paragraph Drill', vi: 'Luyện đoạn văn' }, title: { en: 'Type a full home-row paragraph', vi: 'Gõ một đoạn văn bằng hàng phím cơ sở' }, hint: { en: 'Finish each line and press Enter', vi: 'Gõ hết mỗi dòng rồi nhấn Enter để xuống dòng' }, content: LESSON_1_PARAGRAPH_LINES.map((line) => `${line}\n`).join(''), duration: '4–6 min.' },
    ],
  },
  2: {
    id: 2,
    title: { en: 'Top Row Reach: E · I', vi: 'Vươn lên hàng trên: E · I' },
    description: { en: 'Reach E and I with your middle fingers, then return to D and K on the home row.', vi: 'Dùng hai ngón giữa vươn lên phím E và I, sau đó trở về D và K ở hàng cơ sở.' },
    keySummary: 'E · I',
    newKeyCharacters: 'ei',
    newKeys: LESSON_2_NEW_KEYS,
    newKeysIntro: { en: 'Keep your hands on the home row. Reach from D to E with your left middle finger and from K to I with your right middle finger, then return.', vi: 'Giữ tay ở hàng cơ sở. Dùng ngón giữa trái vươn từ D lên E và ngón giữa phải vươn từ K lên I, rồi trở về vị trí ban đầu.' },
    keyDrillGroups: LESSON_2_KEY_GROUPS,
    wordLines: LESSON_2_WORD_LINES,
    sentenceLines: LESSON_2_SENTENCE_LINES,
    paragraphLines: LESSON_2_PARAGRAPH_LINES,
    textLines: LESSON_2_PARAGRAPH_LINES,
    drills: [
      { id: 1, name: { en: 'New Keys', vi: 'Phím mới' }, title: { en: 'Meet the E and I keys', vi: 'Làm quen với phím E và I' }, hint: { en: 'Reach from D and K to E and I', vi: 'Vươn hai ngón giữa từ D và K lên E và I' }, content: '', duration: '2–3 min.' },
      { id: 2, name: { en: 'Key Drill', vi: 'Luyện phím' }, title: { en: 'Reach E and I from the home row', vi: 'Vươn tới E và I từ hàng cơ sở' }, hint: { en: 'Practice the D–E and K–I movements', vi: 'Luyện chuyển động D–E và K–I' }, content: LESSON_2_KEY_GROUPS.join(''), duration: '3–5 min.' },
      { id: 3, name: { en: 'Word Drill', vi: 'Luyện từ' }, title: { en: 'Build words with E and I', vi: 'Ghép từ với E và I' }, hint: { en: 'Finish one line to reveal the next', vi: 'Gõ hết một dòng để hiện dòng từ tiếp theo' }, content: LESSON_2_WORD_LINES.join(''), duration: '3–5 min.' },
      { id: 4, name: { en: 'Sentence Drill', vi: 'Luyện câu' }, title: { en: 'Use E and I in short sentences', vi: 'Dùng E và I trong các câu ngắn' }, hint: { en: 'Finish each line and press Enter', vi: 'Gõ hết mỗi dòng rồi nhấn Enter để sang dòng tiếp theo' }, content: LESSON_2_SENTENCE_LINES.map((line) => `${line}\n`).join(''), duration: '3–5 min.' },
      { id: 5, name: { en: 'Paragraph Drill', vi: 'Luyện đoạn văn' }, title: { en: 'Practice E and I in paragraphs', vi: 'Luyện E và I trong đoạn văn' }, hint: { en: 'Finish each line and press Enter', vi: 'Gõ hết mỗi dòng rồi nhấn Enter để xuống dòng' }, content: LESSON_2_PARAGRAPH_LINES.map((line) => `${line}\n`).join(''), duration: '4–6 min.' },
    ],
  },
  3: {
    id: 3,
    title: { en: 'Upper Row Reach: R · U', vi: 'Vươn lên hàng trên: R · U' },
    description: { en: 'Extend both index fingers to R and U, then combine them with learned keys for continuous typing.', vi: 'Mở rộng lực vươn của hai ngón trỏ lên R và U, rồi kết hợp với các phím đã học để gõ văn bản liền mạch.' },
    keySummary: 'R · U',
    newKeyCharacters: 'ru',
    newKeys: LESSON_3_NEW_KEYS,
    newKeysIntro: { en: 'Keep the other fingers on the home row. Reach R with your left index finger and U with your right index finger, then return.', vi: 'Giữ các ngón còn lại ở hàng cơ sở. Đưa ngón trỏ trái lên R và ngón trỏ phải lên U, sau đó đưa tay trở về vị trí ban đầu.' },
    keyDrillGroups: LESSON_3_KEY_GROUPS,
    wordLines: LESSON_3_WORD_LINES,
    sentenceLines: LESSON_3_SENTENCE_LINES,
    paragraphLines: LESSON_3_PARAGRAPH_LINES,
    textLines: LESSON_3_TEXT_LINES,
    drills: [
      { id: 1, name: { en: 'New Keys', vi: 'Phím mới' }, title: { en: 'Meet the R and U keys', vi: 'Làm quen với phím R và U' }, hint: { en: 'Reach from F and J to R and U', vi: 'Vươn hai ngón trỏ từ F và J lên R và U' }, content: '', duration: '2–3 min.' },
      { id: 2, name: { en: 'Key Drill', vi: 'Luyện phím' }, title: { en: 'Reach R and U from the home row', vi: 'Vươn tới R và U từ hàng cơ sở' }, hint: { en: 'Practice the F–R and J–U movements', vi: 'Luyện chuyển động F–R và J–U' }, content: LESSON_3_KEY_GROUPS.join(''), duration: '3–5 min.' },
      { id: 3, name: { en: 'Word Drill', vi: 'Luyện từ' }, title: { en: 'Build words with R and U', vi: 'Ghép từ với R và U' }, hint: { en: 'Finish one line to reveal the next', vi: 'Gõ hết một dòng để hiện dòng từ tiếp theo' }, content: LESSON_3_WORD_LINES.join(''), duration: '3–5 min.' },
      { id: 4, name: { en: 'Sentence Drill', vi: 'Luyện câu' }, title: { en: 'Use R and U in short sentences', vi: 'Dùng R và U trong các câu ngắn' }, hint: { en: 'Finish each line and press Enter', vi: 'Gõ hết mỗi dòng rồi nhấn Enter để sang dòng tiếp theo' }, content: LESSON_3_SENTENCE_LINES.map((line) => `${line}\n`).join(''), duration: '3–5 min.' },
      { id: 5, name: { en: 'Paragraph Drill', vi: 'Luyện đoạn văn' }, title: { en: 'Practice R and U in paragraphs', vi: 'Luyện R và U trong đoạn văn' }, hint: { en: 'Finish each line and press Enter', vi: 'Gõ hết mỗi dòng rồi nhấn Enter để xuống dòng' }, content: LESSON_3_PARAGRAPH_LINES.map((line) => `${line}\n`).join(''), duration: '4–6 min.' },
      { id: 6, name: { en: 'Text Drill', vi: 'Luyện văn bản' }, title: { en: 'Type a focused practice text', vi: 'Gõ một bài luyện văn bản tập trung' }, hint: { en: 'Type each line without keyboard or hand guides', vi: 'Gõ từng dòng văn bản; bàn phím và bàn tay được ẩn để tập trung' }, content: LESSON_3_TEXT_LINES.map((line) => `${line}\n`).join(''), duration: '4–6 min.' },
    ],
  },
  4: createLesson({
    id: 4, keys: ['T', 'Y'], fingers: ['left-index', 'right-index'],
    wordLines: ['try yet true', 'style study duty', 'trust your result', 'stay ready today', 'type steadily', 'your style is tidy'],
    sentenceLines: ['try a steady rhythm;', 'your result is ready;', 'stay relaxed as you type;', 'type lightly and steadily;', 'trust your trained fingers;', 'today is a study day;'],
    paragraphLines: ['try a steady rhythm; stay relaxed as you type;', 'your result is ready; trust your trained fingers;', 'type lightly and steadily; today is a study day;', 'study your style; adjust it slowly;', 'steady practice lets your fingers stay ready;', 'your accuracy rises as your rhythm stays calm;'],
  }),
  5: createLesson({
    id: 5, keys: ['W', 'O'], fingers: ['left-ring', 'right-ring'],
    wordLines: ['row low word', 'world slow work', 'write your words', 'follow a smooth flow', 'work toward accuracy', 'slow down to grow'],
    sentenceLines: ['write every word slowly;', 'follow a smooth flow;', 'work toward accuracy;', 'your hands know the row;', 'slow practice works well;', 'write without looking down;'],
    paragraphLines: ['write every word slowly; follow a smooth flow;', 'work toward accuracy; your hands know the row;', 'slow practice works well; write without looking down;', 'your words will flow as your hands relax;', 'a lower speed allows stronger accuracy;', 'work on each row and let your rhythm grow;'],
  }),
  6: createLesson({
    id: 6, keys: ['Q', 'P'], fingers: ['left-pinky', 'right-pinky'],
    wordLines: ['quick quiet page', 'paper place equal', 'press with purpose', 'keep a quiet pace', 'quality over speed', 'place each key well'],
    sentenceLines: ['keep a quiet pace;', 'press each key lightly;', 'quality grows with practice;', 'place your pinkies carefully;', 'quick typing stays precise;', 'pause before you speed up;'],
    paragraphLines: ['keep a quiet pace; press each key lightly;', 'quality grows with practice; place your pinkies carefully;', 'quick typing stays precise; pause before you speed up;', 'a calm pace helps you press the right key;', 'practice quality first and speed will follow;', 'keep your shoulders relaxed through every line;'],
  }),
  7: createLesson({
    id: 7, keys: ['G', 'H'], fingers: ['left-index', 'right-index'],
    wordLines: ['high light good', 'great habit growth', 'guide both hands', 'hold a light touch', 'gather good habits', 'height and length'],
    sentenceLines: ['good habits grow daily;', 'hold a light touch;', 'guide both hands gently;', 'great rhythm feels smooth;', 'reach inward for each key;', 'high accuracy is the goal;'],
    paragraphLines: ['good habits grow daily; hold a light touch;', 'guide both hands gently; great rhythm feels smooth;', 'reach inward for each key; high accuracy is the goal;', 'your index fingers handle the center keys;', 'light and steady presses help your hands relax;', 'gather a strong rhythm through careful practice;'],
  }),
  8: createLesson({
    id: 8, keys: ['V', 'M'], fingers: ['left-index', 'right-index'],
    wordLines: ['move calm view', 'moment value time', 'move from the home row', 'make every move light', 'value a calm rhythm', 'review each moment'],
    sentenceLines: ['move each finger lightly;', 'make every moment count;', 'value a calm rhythm;', 'review your hand movement;', 'move down from the home row;', 'time and accuracy improve;'],
    paragraphLines: ['move each finger lightly; make every moment count;', 'value a calm rhythm; review your hand movement;', 'move down from the home row; time and accuracy improve;', 'every small movement should feel calm and direct;', 'return to the home row after every lower reach;', 'review your form and maintain a smooth rhythm;'],
  }),
  9: createLesson({
    id: 9, keys: ['C', ','], fingers: ['left-middle', 'right-middle'],
    wordLines: ['calm, clear, correct', 'care, music, choice', 'check each reach', 'correct, calm, concise', 'music creates rhythm', 'accuracy comes first'],
    sentenceLines: ['choose a calm pace;', 'check each character;', 'accuracy comes first;', 'music creates a rhythm;', 'reach down with middle fingers;', 'type clearly, calmly, correctly;'],
    paragraphLines: ['choose a calm pace; check each character;', 'accuracy comes first; music creates a rhythm;', 'reach down with middle fingers; type clearly, calmly;', 'correct small errors before increasing your speed;', 'a careful typist keeps every movement concise;', 'practice calmly, breathe easily, and stay accurate;'],
  }),
  10: createLesson({
    id: 10, keys: ['X', '.'], fingers: ['left-ring', 'right-ring'],
    wordLines: ['next. extra. relax.', 'exact. text. exercise.', 'extend your reach.', 'relax after each line.', 'expect steady progress.', 'text can flow.'],
    sentenceLines: ['relax after each line.', 'expect steady progress.', 'extend your ring fingers.', 'the next exercise feels easier.', 'type the exact text.', 'finish with a full stop.'],
    paragraphLines: ['relax after each line. expect steady progress.', 'extend your ring fingers. the next exercise feels easier.', 'type the exact text. finish with a full stop.', 'extra practice can make complex movement feel natural.', 'the next line asks for accuracy before speed.', 'relax your hands. keep your eyes on the text.'],
  }),
  11: createLesson({
    id: 11, keys: ['Z', '/'], fingers: ['left-pinky', 'right-pinky'],
    wordLines: ['zone / zoom', 'zero / size', 'use each pinky', 'reach the edge keys', 'zero rush / stay calm', 'finish the lower row'],
    sentenceLines: ['reach the edge keys;', 'use each pinky gently;', 'zero rush means more control;', 'finish the lower row;', 'keep a relaxed posture;', 'accuracy is always the priority;'],
    paragraphLines: ['reach the edge keys; use each pinky gently;', 'zero rush means more control; finish the lower row;', 'keep a relaxed posture; accuracy is always the priority;', 'the outside keys need small and careful movement;', 'return each pinky to its home position after a reach;', 'finish this lesson with a calm and even rhythm;'],
  }),
  12: createLesson({
    id: 12, keys: ['B', 'N'], fingers: ['left-index', 'right-index'],
    wordLines: ['begin new balance', 'build strong habits', 'bring both hands', 'learn a natural rhythm', 'balance speed and accuracy', 'begin with confidence'],
    sentenceLines: ['begin with a balanced rhythm;', 'bring both hands back home;', 'build accuracy before speed;', 'learn a natural typing flow;', 'balance every movement;', 'now use the whole keyboard;'],
    paragraphLines: ['begin with a balanced rhythm; bring both hands back home;', 'build accuracy before speed; learn a natural typing flow;', 'balance every movement; now use the whole keyboard;', 'steady daily practice builds confidence and control;', 'keep your eyes on the screen and trust your fingers;', 'you now know every letter key on the main keyboard;', 'finish each line with patience and review your result;'],
  }),
}

const fingerLabels: Record<FingerId, LocalizedText> = {
  'left-pinky': { en: 'Left pinky', vi: 'Ngón út trái' }, 'left-ring': { en: 'Left ring finger', vi: 'Ngón áp út trái' }, 'left-middle': { en: 'Left middle finger', vi: 'Ngón giữa trái' }, 'left-index': { en: 'Left index finger', vi: 'Ngón trỏ trái' }, 'left-thumb': { en: 'Left thumb', vi: 'Ngón cái trái' },
  'right-thumb': { en: 'Right thumb', vi: 'Ngón cái phải' }, 'right-index': { en: 'Right index finger', vi: 'Ngón trỏ phải' }, 'right-middle': { en: 'Right middle finger', vi: 'Ngón giữa phải' }, 'right-ring': { en: 'Right ring finger', vi: 'Ngón áp út phải' }, 'right-pinky': { en: 'Right pinky', vi: 'Ngón út phải' },
}

const fingerMap: Record<string, FingerId> = {
  '`': 'left-pinky', '1': 'left-pinky', q: 'left-pinky', a: 'left-pinky', z: 'left-pinky',
  '2': 'left-ring', w: 'left-ring', s: 'left-ring', x: 'left-ring',
  '3': 'left-middle', e: 'left-middle', d: 'left-middle', c: 'left-middle',
  '4': 'left-index', '5': 'left-index', r: 'left-index', t: 'left-index', f: 'left-index', g: 'left-index', v: 'left-index', b: 'left-index',
  '6': 'right-index', '7': 'right-index', y: 'right-index', u: 'right-index', h: 'right-index', j: 'right-index', n: 'right-index', m: 'right-index',
  '8': 'right-middle', i: 'right-middle', k: 'right-middle', ',': 'right-middle',
  '9': 'right-ring', o: 'right-ring', l: 'right-ring', '.': 'right-ring',
  '0': 'right-pinky', '-': 'right-pinky', '=': 'right-pinky', p: 'right-pinky', '[': 'right-pinky', ']': 'right-pinky', '\\': 'right-pinky', ';': 'right-pinky', "'": 'right-pinky', '/': 'right-pinky', enter: 'right-pinky',
  ' ': 'right-thumb',
}

const keyboardRows = [
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
  ['Tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
  ['Caps', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", 'Enter'],
  ['Shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'Shift'],
  ['Space'],
]

function keyLabel(value: string) {
  if (value === ' ') return 'Space'
  return value.length === 1 ? value.toUpperCase() : value
}

function normalizeKey(key: string) {
  if (key === 'Spacebar') return ' '
  return key.length === 1 ? key.toLowerCase() : key
}

function progressKey(lessonId: LessonId, drillId: DrillId) {
  return `${lessonId}-${drillId}`
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function formatDuration(duration: string, language: AppLanguage) {
  return language === 'vi' ? duration.replace('min.', 'phút') : duration
}

function loadSavedProgress(): SavedProgress | null {
  try {
    const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY)
    if (!raw) return null
    const value = JSON.parse(raw) as Partial<SavedProgress>
    const lessonId = value.activeLessonId
    const drillId = value.activeDrillId
    const validLessonIds = Array.from({ length: 12 }, (_, index) => index + 1)
    const validDrillCount = lessonId && LESSONS[lessonId as LessonId]?.drills.length
    if (value.version !== 1 || !lessonId || !validLessonIds.includes(lessonId) || !drillId || !validDrillCount || drillId < 1 || drillId > validDrillCount) return null
    const screens: Screen[] = ['lesson', 'basics', 'drill', 'daily', 'test', 'settings', 'about']
    const statuses: DrillStatus[] = ['ready', 'correct', 'incorrect', 'complete']
    return {
      version: 1,
      screen: screens.includes(value.screen as Screen) ? value.screen as Screen : 'lesson',
      activeLessonId: lessonId,
      activeDrillId: drillId,
      basicsComplete: value.basicsComplete === true,
      basicsPage: Math.min(4, Math.max(0, Number(value.basicsPage) || 0)),
      completedDrills: Array.isArray(value.completedDrills) ? value.completedDrills.filter((item): item is string => typeof item === 'string') : [],
      position: Math.max(0, Number(value.position) || 0),
      mistakes: Math.max(0, Number(value.mistakes) || 0),
      typedText: typeof value.typedText === 'string' ? value.typedText : '',
      status: statuses.includes(value.status as DrillStatus) ? value.status as DrillStatus : 'ready',
      keystrokes: Math.max(0, Number(value.keystrokes) || 0),
      secondsLeft: Math.min(DRILL_TIME_LIMIT, Math.max(0, Number(value.secondsLeft) || 0)),
      started: value.started === true,
      isPaused: value.isPaused === true,
      showGuides: value.showGuides !== false,
    }
  } catch {
    return null
  }
}

function Keyboard({ targetKey, pressedKey, status, colorCoded = false, newKeyCharacters = '', language }: { targetKey: string; pressedKey: string | null; status: DrillStatus; colorCoded?: boolean; newKeyCharacters?: string; language: AppLanguage }) {
  return (
    <div className="keyboard-scroll">
      <div className={`keyboard ${colorCoded ? 'color-coded' : ''}`} aria-label={language === 'en' ? 'On-screen keyboard' : 'Bàn phím ảo'}>
        {keyboardRows.map((row, rowIndex) => (
          <div className={`key-row row-${rowIndex}`} key={`${rowIndex}-${row.join('')}`}>
            {row.map((value, keyIndex) => {
              const actualKey = value === 'Space' ? ' ' : value.toLowerCase()
              const finger = fingerMap[actualKey]
              const isTarget = actualKey === targetKey
              const isPressed = actualKey === pressedKey
              const isNewKey = colorCoded && newKeyCharacters.includes(actualKey)
              const wideClass = value === 'Space' ? 'space' : value.length > 1 ? `wide wide-${value.toLowerCase()}` : ''
              return (
                <span className={`key ${wideClass} ${finger ? `finger-${finger}` : ''} ${isNewKey ? 'new-key' : ''} ${isTarget ? 'target' : ''} ${isPressed ? `pressed ${status}` : ''}`} data-finger={finger} key={`${value}-${keyIndex}`}>
                  {keyLabel(value)}
                </span>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

function Hands({ activeFinger, colorCoded = false, highlightedFingers = [], language }: { activeFinger: FingerId | null; colorCoded?: boolean; highlightedFingers?: FingerId[]; language: AppLanguage }) {
  const renderHand = (side: 'left' | 'right') => {
    const fingers: FingerId[] = side === 'left'
      ? ['left-pinky', 'left-ring', 'left-middle', 'left-index', 'left-thumb']
      : ['right-thumb', 'right-index', 'right-middle', 'right-ring', 'right-pinky']
    return (
      <div className={`hand hand-${side}`} aria-label={language === 'en' ? `${side === 'left' ? 'Left' : 'Right'} hand` : `Bàn tay ${side === 'left' ? 'trái' : 'phải'}`}>
        <div className="finger-set">
          {fingers.map((finger, index) => (
            <span aria-label={fingerLabels[finger][language]} className={`finger finger-${finger} finger-${index + 1} ${highlightedFingers.includes(finger) ? 'introduced' : ''} ${activeFinger === finger ? 'active' : ''}`} key={finger} role="img" />
          ))}
        </div>
        <div className="palm" />
      </div>
    )
  }
  return <div className={`hands ${colorCoded ? 'color-coded' : ''}`}>{renderHand('left')}{renderHand('right')}</div>
}

function KeySequence({ groups, position, status, language }: { groups: string[]; position: number; status: DrillStatus; language: AppLanguage }) {
  let traversed = 0
  let currentGroupIndex = groups.length - 1

  for (let index = 0; index < groups.length; index += 1) {
    traversed += groups[index].length
    if (position < traversed) {
      currentGroupIndex = index
      break
    }
  }

  const pageStart = Math.floor(currentGroupIndex / KEY_DRILL_PAGE_SIZE) * KEY_DRILL_PAGE_SIZE
  const visibleGroups = groups.slice(pageStart, pageStart + KEY_DRILL_PAGE_SIZE)
  let offset = groups.slice(0, pageStart).join('').length

  return (
    <div className={`key-sequence status-${status}`} aria-label={`${language === 'en' ? 'Key sequence to type' : 'Chuỗi phím cần gõ'}: ${groups.join('')}`}>
      {visibleGroups.map((group, visibleIndex) => {
        const groupIndex = pageStart + visibleIndex
        const groupStart = offset
        offset += group.length
        return (
          <span className="sequence-group" key={`${group}-${groupIndex}`}>
            {group.split('').map((character, characterIndex) => {
              const index = groupStart + characterIndex
              const stateClass = index < position ? 'typed' : index === position ? 'current-char' : ''
              return <span className={`sequence-key ${character === ' ' ? 'space-key' : ''} ${stateClass}`} key={`${character}-${index}`}>{character === ' ' ? 'Space' : character.toUpperCase()}</span>
            })}
          </span>
        )
      })}
    </div>
  )
}

function SentenceSequence({ lines, position, status, language }: { lines: string[]; position: number; status: DrillStatus; language: AppLanguage }) {
  let line = lines[lines.length - 1]
  let lineStart = 0

  for (const candidate of lines) {
    const lineEnd = lineStart + candidate.length
    if (position <= lineEnd) {
      line = candidate
      break
    }
    lineStart = lineEnd + 1
  }

  const lineEnd = lineStart + line.length

  return (
    <div className={`sentence-sequence status-${status}`} aria-label={language === 'en' ? `Line to type: ${line}. Then press Enter.` : `Dòng cần gõ: ${line}. Sau đó nhấn Enter.`}>
      <div className="typing-line sentence-line">
        {line.split('').map((character, characterIndex) => {
          const index = lineStart + characterIndex
          return <span className={`${character === ' ' ? 'space-char' : ''} ${index < position ? 'typed' : index === position ? 'current-char' : ''}`} key={`${character}-${index}`}>{character === ' ' ? '\u00a0' : character}</span>
        })}
        <span className={`line-enter-symbol ${position === lineEnd ? 'current' : ''}`} aria-label={language === 'en' ? 'Press Enter for the next line' : 'Nhấn Enter để sang dòng tiếp theo'}>↵</span>
      </div>
    </div>
  )
}

function WordSequence({ lines, position, status, language }: { lines: string[]; position: number; status: DrillStatus; language: AppLanguage }) {
  let line = lines[lines.length - 1]
  let lineStart = 0

  for (const candidate of lines) {
    const lineEnd = lineStart + candidate.length
    if (position < lineEnd) {
      line = candidate
      break
    }
    lineStart = lineEnd
  }

  return (
    <div className={`word-sequence status-${status}`} aria-label={`${language === 'en' ? 'Word line to type' : 'Dòng từ cần gõ'}: ${line}`}>
      <div className="typing-line word-line">
        {line.split('').map((character, characterIndex) => {
          const index = lineStart + characterIndex
          return <span className={`${character === ' ' ? 'space-char' : ''} ${index < position ? 'typed' : index === position ? 'current-char' : ''}`} key={`${character}-${index}`}>{character === ' ' ? '\u00a0' : character}</span>
        })}
      </div>
    </div>
  )
}

function ParagraphPractice({ lines, position, typedText, language, className = '', label }: { lines: string[]; position: number; typedText: string; language: AppLanguage; className?: string; label: string }) {
  let line = lines[lines.length - 1]
  let lineStart = 0
  let currentLineIndex = lines.length - 1

  for (let index = 0; index < lines.length; index += 1) {
    const candidate = lines[index]
    const lineEnd = lineStart + candidate.length
    if (position <= lineEnd) {
      line = candidate
      currentLineIndex = index
      break
    }
    lineStart = lineEnd + 1
  }

  const lineEnd = lineStart + line.length
  const typedLine = typedText.slice(lineStart, lineEnd)
  const pageStart = Math.floor(currentLineIndex / PARAGRAPH_PAGE_SIZE) * PARAGRAPH_PAGE_SIZE
  const visibleLines = lines.slice(pageStart, pageStart + PARAGRAPH_PAGE_SIZE)
  let referenceStart = lines.slice(0, pageStart).reduce((total, referenceLine) => total + referenceLine.length + 1, 0)

  return (
    <div className={`paragraph-practice ${className}`.trim()}>
      <div className="paragraph-reference" aria-label={language === 'en' ? `${label} with ${lines.length} lines` : `${label} gồm ${lines.length} dòng`}>
        {visibleLines.map((referenceLine, visibleIndex) => {
          const lineIndex = pageStart + visibleIndex
          const currentStart = referenceStart
          const currentEnd = currentStart + referenceLine.length
          referenceStart = currentEnd + 1
          return (
            <div className={`paragraph-reference-line ${currentStart === lineStart ? 'active' : ''}`} key={referenceLine}>
              {referenceLine.split('').map((character, characterIndex) => {
                const index = currentStart + characterIndex
                return <span className={index === position ? 'reference-current' : ''} key={`${character}-${index}`}>{character === ' ' ? '\u00a0' : character}</span>
              })}
              <span className={`line-enter-symbol ${position === currentEnd ? 'current' : ''}`} aria-label={language === 'en' ? `End of line ${lineIndex + 1}` : `Kết thúc dòng ${lineIndex + 1}`}>↵</span>
            </div>
          )
        })}
      </div>
      <div className="paragraph-divider" aria-hidden="true" />
      <div className="paragraph-input" aria-label={language === 'en' ? `Typed content on this line: ${typedLine || 'Not started'}` : `Nội dung đã gõ trên dòng: ${typedLine || 'Chưa bắt đầu'}`} aria-live="polite">
        {typedLine.split('').map((character, index) => <span className={character === line[index] ? 'typed-correct' : 'typed-incorrect'} key={`${character}-${index}`}>{character === ' ' ? '\u00a0' : character}</span>)}
        <span className="paragraph-caret" aria-hidden="true">&nbsp;</span>
      </div>
    </div>
  )
}

function createPracticeText(language: PracticeLanguage, passageCount: number, startIndex: number) {
  const passages = PRACTICE_TEXTS[language]
  return Array.from({ length: passageCount }, (_, offset) => passages[(startIndex + offset) % passages.length]).join('\n\n')
}

function pickRandomPassageIndex(language: PracticeLanguage, mode: 'daily' | 'test') {
  const passages = PRACTICE_TEXTS[language]
  const storageKey = `typing-speed-vn-last-passage-${mode}-${language}`
  try {
    const previousIndex = Number(window.localStorage.getItem(storageKey))
    const hasPreviousIndex = Number.isInteger(previousIndex) && previousIndex >= 0 && previousIndex < passages.length
    const nextIndex = hasPreviousIndex && passages.length > 1
      ? (previousIndex + 1 + Math.floor(Math.random() * (passages.length - 1))) % passages.length
      : Math.floor(Math.random() * passages.length)
    window.localStorage.setItem(storageKey, String(nextIndex))
    return nextIndex
  } catch {
    return Math.floor(Math.random() * passages.length)
  }
}

function analyzePracticeText(targetText: string, typedText: string) {
  const states: ('matched' | 'missed')[] = []
  const segments: { className: 'matched' | 'missed'; text: string }[] = []
  let targetIndex = 0
  let errors = 0
  let matchedCharacters = 0
  let previousWasWhitespace = false

  for (const character of typedText) {
    const isWhitespace = /\s/.test(character)
    if (isWhitespace) {
      if (previousWasWhitespace) {
        errors += 1
        continue
      }
      previousWasWhitespace = true
      let skippedCharacters = 0
      while (targetIndex < targetText.length && !/\s/.test(targetText[targetIndex])) {
        states[targetIndex] = 'missed'
        targetIndex += 1
        skippedCharacters += 1
        errors += 1
      }
      if (targetIndex < targetText.length) {
        while (targetIndex < targetText.length && /\s/.test(targetText[targetIndex])) {
          states[targetIndex] = 'matched'
          targetIndex += 1
        }
        matchedCharacters += 1
      } else if (skippedCharacters === 0) errors += 1
      continue
    }

    previousWasWhitespace = false
    if (targetIndex >= targetText.length || /\s/.test(targetText[targetIndex])) {
      errors += 1
      continue
    }
    const className = character === targetText[targetIndex] ? 'matched' : 'missed'
    states[targetIndex] = className
    if (className === 'matched') matchedCharacters += 1
    else errors += 1
    targetIndex += 1
  }

  for (let index = 0; index < targetIndex; index += 1) {
    const className = states[index] ?? 'missed'
    const previous = segments[segments.length - 1]
    if (previous?.className === className) previous.text += targetText[index]
    else segments.push({ className, text: targetText[index] })
  }

  return { segments, targetIndex, errors, matchedCharacters }
}

const PracticeInput = memo(function PracticeInput({ inputRef, language, label, running, onValueChange }: {
  inputRef: { current: HTMLTextAreaElement | null }
  language: PracticeLanguage
  label: string
  running: boolean
  onValueChange: (value: string) => void
}) {
  return (
    <label className="practice-input-label">
      <span>{label}</span>
      <textarea
        ref={inputRef}
        aria-label={label}
        autoCapitalize="off"
        autoCorrect="off"
        disabled={!running}
        lang={language}
        onCompositionEnd={(event) => onValueChange(event.currentTarget.value)}
        onInput={(event) => onValueChange(event.currentTarget.value)}
        spellCheck={false}
      />
    </label>
  )
})

function FreeTypingPractice({ mode, interfaceLanguage, completedLessonCount }: { mode: 'daily' | 'test'; interfaceLanguage: AppLanguage; completedLessonCount: number }) {
  const ui = UI_COPY[interfaceLanguage]
  const [practiceLanguage, setPracticeLanguage] = useState<PracticeLanguage>('vi')
  const [dailyMinutes, setDailyMinutes] = useState<5 | 10>(5)
  const [typed, setTyped] = useState('')
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(mode === 'test' ? 60 : 300)
  const [endAt, setEndAt] = useState<number | null>(null)
  const [passageIndex, setPassageIndex] = useState(() => pickRandomPassageIndex('vi', mode))
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const nextTextPendingRef = useRef(false)
  const totalSeconds = mode === 'test' ? 60 : dailyMinutes * 60
  const targetText = createPracticeText(practiceLanguage, mode === 'daily' ? 12 : 3, passageIndex)

  const finishPractice = useCallback(() => {
    setRunning(false)
    setFinished(true)
    setEndAt(null)
    nextTextPendingRef.current = true
    if (mode === 'daily') window.localStorage.setItem('typing-speed-vn-last-daily', new Date().toISOString().slice(0, 10))
  }, [mode])

  useEffect(() => {
    if (!running || endAt === null) return
    const update = () => {
      const remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000))
      setSecondsLeft(remaining)
      if (remaining === 0) finishPractice()
    }
    update()
    const interval = window.setInterval(update, 250)
    return () => window.clearInterval(interval)
  }, [endAt, finishPractice, running])

  const reset = useCallback(() => {
    if (inputRef.current) inputRef.current.value = ''
    setTyped('')
    setRunning(false)
    setFinished(false)
    setEndAt(null)
    setSecondsLeft(totalSeconds)
  }, [totalSeconds])

  useEffect(() => reset(), [mode, practiceLanguage, dailyMinutes, reset])

  const start = () => {
    if (nextTextPendingRef.current) {
      nextTextPendingRef.current = false
      setPassageIndex(pickRandomPassageIndex(practiceLanguage, mode))
    }
    reset()
    setRunning(true)
    setEndAt(Date.now() + totalSeconds * 1000)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const handleChange = useCallback((value: string) => {
    if (!running) return
    const normalizedValue = value.normalize('NFC')
    setTyped(normalizedValue)
    if (analyzePracticeText(targetText, normalizedValue).targetIndex >= targetText.length) finishPractice()
  }, [finishPractice, running, targetText])

  const elapsedSeconds = totalSeconds - secondsLeft
  const scoringSeconds = Math.max(1, elapsedSeconds)
  const { segments: referenceSegments, targetIndex, errors, matchedCharacters } = analyzePracticeText(targetText, typed)
  const grossWpm = Math.round((typed.length / 5) / (scoringSeconds / 60))
  const evaluatedCharacters = matchedCharacters + errors
  const accuracy = evaluatedCharacters === 0 ? 100 : Math.round((matchedCharacters / evaluatedCharacters) * 100)
  const netWpm = Math.max(0, Math.round(grossWpm - errors / (scoringSeconds / 60)))
  const wordCount = typed.trim() ? typed.trim().split(/\s+/).length : 0

  return (
    <section className="free-practice" aria-labelledby={`${mode}-title`}>
      <div className="practice-heading">
        <div><p className="eyebrow">Typing Speed VN</p><h1 id={`${mode}-title`}>{mode === 'daily' ? ui.dailyTitle : ui.testTitle}</h1><p>{mode === 'daily' ? ui.dailyLead : ui.testLead}</p></div>
        <div className={`practice-clock ${running ? 'running' : ''}`}><span>{ui.timer}</span><time dateTime={`PT${secondsLeft}S`}>{formatTime(secondsLeft)}</time></div>
      </div>

      {mode === 'daily' && completedLessonCount < 12 && <div className="practice-notice" role="note"><span aria-hidden="true">i</span>{ui.dailyRecommendation}</div>}
      {mode === 'daily' && completedLessonCount >= 12 && <div className="practice-notice ready" role="status"><span aria-hidden="true">✓</span>{ui.dailyReady}</div>}

      <div className="practice-toolbar">
        <label><span>{ui.practiceLanguage}</span><select disabled={running} onChange={(event) => { const nextLanguage = event.target.value as PracticeLanguage; nextTextPendingRef.current = false; setPassageIndex(pickRandomPassageIndex(nextLanguage, mode)); setPracticeLanguage(nextLanguage) }} value={practiceLanguage}><option value="vi">{ui.vietnameseLanguage}</option><option value="en">{ui.englishLanguage}</option></select></label>
        {mode === 'daily' && <label><span>{ui.duration}</span><select disabled={running} onChange={(event) => setDailyMinutes(Number(event.target.value) as 5 | 10)} value={dailyMinutes}><option value={5}>5 {ui.minutes}</option><option value={10}>10 {ui.minutes}</option></select></label>}
        <button className="primary-button" type="button" onClick={start}>{typed || finished ? ui.restart : ui.start}</button>
        {running && <button className="secondary-button" type="button" onClick={finishPractice}>{ui.finish}</button>}
      </div>

      <div className="practice-reference" aria-label={ui.referenceText}>
        {referenceSegments.map((segment, index) => <span className={segment.className} key={`${segment.className}-${index}`}>{segment.text}</span>)}
        {targetIndex < targetText.length && <span className="current">{targetText[targetIndex]}</span>}
        {targetText.slice(targetIndex + 1)}
      </div>
      <PracticeInput inputRef={inputRef} label={ui.typeHere} language={practiceLanguage} onValueChange={handleChange} running={running} />

      <section className={`practice-results ${finished ? 'is-finished' : ''}`} aria-label={ui.practiceResult} aria-live="polite">
        <div><span>{ui.timeUsed}</span><strong>{formatTime(elapsedSeconds)}</strong></div>
        <div><span>{ui.grossSpeed}</span><strong>{grossWpm} WPM</strong></div>
        <div><span>{ui.accuracy}</span><strong>{accuracy}%</strong></div>
        <div><span>{ui.netSpeed}</span><strong>{netWpm} WPM</strong></div>
        <div><span>{ui.words}</span><strong>{wordCount}</strong></div>
        <div><span>{ui.errors}</span><strong>{errors}</strong></div>
      </section>
    </section>
  )
}

export default function App() {
  const [savedProgress] = useState<SavedProgress | null>(loadSavedProgress)
  const [screen, setScreen] = useState<Screen>(savedProgress?.screen ?? 'lesson')
  const [language, setLanguage] = useState<AppLanguage>(() => window.localStorage.getItem('typing-speed-vn-language') === 'en' ? 'en' : 'vi')
  const [activeLessonId, setActiveLessonId] = useState<LessonId>(savedProgress?.activeLessonId ?? 1)
  const [activeDrillId, setActiveDrillId] = useState<DrillId>(savedProgress?.activeDrillId ?? 1)
  const [basicsComplete, setBasicsComplete] = useState(savedProgress?.basicsComplete ?? false)
  const [basicsPage, setBasicsPage] = useState(savedProgress?.basicsPage ?? 0)
  const [completedDrills, setCompletedDrills] = useState<Set<string>>(() => new Set(savedProgress?.completedDrills ?? []))
  const [position, setPosition] = useState(savedProgress?.position ?? 0)
  const [mistakes, setMistakes] = useState(savedProgress?.mistakes ?? 0)
  const [typedText, setTypedText] = useState(savedProgress?.typedText ?? '')
  const [status, setStatus] = useState<DrillStatus>(savedProgress?.status ?? 'ready')
  const [pressedKey, setPressedKey] = useState<string | null>(null)
  const [startedAt, setStartedAt] = useState<number | null>(() => savedProgress?.started ? Date.now() - (DRILL_TIME_LIMIT - savedProgress.secondsLeft) * 1000 : null)
  const [finishedAt, setFinishedAt] = useState<number | null>(() => savedProgress?.started && savedProgress.status === 'complete' ? Date.now() : null)
  const [keystrokes, setKeystrokes] = useState(savedProgress?.keystrokes ?? 0)
  const [secondsLeft, setSecondsLeft] = useState(savedProgress?.secondsLeft ?? DRILL_TIME_LIMIT)
  const [isPaused, setIsPaused] = useState(savedProgress?.isPaused ?? false)
  const [pausedAt, setPausedAt] = useState<number | null>(() => savedProgress?.isPaused ? Date.now() : null)
  const [showGuides, setShowGuides] = useState(savedProgress?.showGuides ?? true)
  const [showEnglishKeyboardWarning, setShowEnglishKeyboardWarning] = useState(false)
  const practiceRef = useRef<HTMLElement>(null)
  const againButtonRef = useRef<HTMLButtonElement>(null)
  const nextButtonRef = useRef<HTMLButtonElement>(null)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)

  const ui = UI_COPY[language]
  const activeLesson = LESSONS[activeLessonId]
  const drills = activeLesson.drills
  const activeDrill = drills.find((drill) => drill.id === activeDrillId) ?? drills[0]
  const activeDrillName = activeDrill.name[language]
  const activeDrillTitle = activeDrill.title[language]
  const isTypingDrill = activeDrill.id !== 1
  const isComplete = status === 'complete'
  const expectedKey = isTypingDrill && !isComplete ? activeDrill.content[position] ?? '' : ''
  const targetKey = expectedKey === '\n' ? 'enter' : expectedKey
  const activeFinger = isTypingDrill && !isComplete ? fingerMap[targetKey] ?? 'right-thumb' : null
  const timeUsed = startedAt === null || finishedAt === null ? 0 : Math.max(1, Math.round((finishedAt - startedAt) / 1000))
  const minutesUsed = Math.max(timeUsed / 60, 1 / 60)
  const grossSpeed = Math.round((keystrokes / 5) / minutesUsed)
  const accuracy = keystrokes === 0 ? 100 : Math.max(0, Math.round(((keystrokes - mistakes) / keystrokes) * 100))
  const netSpeed = Math.max(0, Math.round(grossSpeed - mistakes / minutesUsed))
  const completedInLesson = drills.filter((drill) => completedDrills.has(progressKey(activeLessonId, drill.id))).length
  const lessonCompletionTotal = drills.length + (activeLessonId === 1 ? 1 : 0)
  const completedLessonCount = (Object.values(LESSONS) as LessonData[]).filter((lesson) => lesson.drills.every((drill) => completedDrills.has(progressKey(lesson.id, drill.id))) && (lesson.id !== 1 || basicsComplete)).length

  useEffect(() => {
    window.localStorage.setItem('typing-speed-vn-language', language)
    document.documentElement.lang = language
  }, [language])

  useEffect(() => {
    const snapshot: SavedProgress = {
      version: 1,
      screen,
      activeLessonId,
      activeDrillId,
      basicsComplete,
      basicsPage,
      completedDrills: [...completedDrills],
      position,
      mistakes,
      typedText,
      status,
      keystrokes,
      secondsLeft,
      started: startedAt !== null,
      isPaused,
      showGuides,
    }
    try {
      window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(snapshot))
    } catch {
      // The app still works when storage is unavailable.
    }
  }, [activeDrillId, activeLessonId, basicsComplete, basicsPage, completedDrills, isPaused, keystrokes, mistakes, position, screen, secondsLeft, showGuides, startedAt, status, typedText])

  const resetProgress = useCallback(() => {
    setPosition(0); setMistakes(0); setTypedText(''); setKeystrokes(0); setStatus('ready'); setPressedKey(null); setStartedAt(null); setFinishedAt(null); setSecondsLeft(DRILL_TIME_LIMIT); setIsPaused(false); setPausedAt(null)
  }, [])

  const restart = useCallback(() => {
    resetProgress()
    requestAnimationFrame(() => practiceRef.current?.focus())
  }, [resetProgress])

  const selectDrill = useCallback((drillId: DrillId) => {
    const drill = drills.find((item) => item.id === drillId)
    if (!drill) return
    setActiveDrillId(drillId); setScreen('drill'); resetProgress()
    if (drillId !== 1) requestAnimationFrame(() => practiceRef.current?.focus())
  }, [drills, resetProgress])

  const completeDrill = useCallback(() => {
    setStatus('complete'); setPressedKey(null); setFinishedAt((current) => current ?? Date.now()); setIsPaused(false); setPausedAt(null); setCompletedDrills((current) => new Set(current).add(progressKey(activeLessonId, activeDrillId)))
  }, [activeDrillId, activeLessonId])

  const startKeyDrill = () => {
    setCompletedDrills((current) => new Set(current).add(progressKey(activeLessonId, 1)))
    selectDrill(2)
  }

  const openBasics = () => {
    setBasicsPage(0)
    setScreen('basics')
  }

  const nextBasicsPage = () => {
    if (basicsPage < BASICS_SLIDE_TITLES[language].length - 1) {
      setBasicsPage((current) => current + 1)
      return
    }
    setBasicsComplete(true)
    selectDrill(1)
  }

  const cancelBasics = () => {
    setBasicsPage(0)
    setScreen('lesson')
  }

  useEffect(() => {
    if (screen === 'drill' && isTypingDrill) practiceRef.current?.focus()
  }, [isTypingDrill, screen])

  useEffect(() => {
    if (screen !== 'drill' || !isComplete) return
    const frame = requestAnimationFrame(() => nextButtonRef.current?.focus())
    return () => cancelAnimationFrame(frame)
  }, [activeDrillId, activeLessonId, isComplete, screen])

  useEffect(() => {
    if (screen !== 'drill' || !isTypingDrill || startedAt === null || isComplete || isPaused) return
    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000)
      const remaining = Math.max(DRILL_TIME_LIMIT - elapsed, 0)
      setSecondsLeft(remaining)
      if (remaining === 0) completeDrill()
    }
    updateTimer()
    const interval = window.setInterval(updateTimer, 250)
    return () => window.clearInterval(interval)
  }, [completeDrill, isComplete, isPaused, isTypingDrill, screen, startedAt])

  useEffect(() => {
    const context = document.modelContext
    if (!context?.registerTool) return
    const lifecycle = new AbortController()
    void Promise.resolve(context.registerTool({
      name: 'restart_typing_drill', title: 'Restart typing drill', description: 'Reset the active typing drill, mistakes, timer, and progress.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: () => { restart(); return { status: 'restarted', lessonId: activeLessonId, drillId: activeDrillId, position: 0, mistakes: 0 } },
    }, { signal: lifecycle.signal })).catch(() => undefined)
    return () => lifecycle.abort()
  }, [activeDrillId, activeLessonId, restart])

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.ctrlKey || event.altKey || event.metaKey) return
    if (isComplete) {
      if (event.key === 'Enter') {
        event.preventDefault()
        goToNextDrill()
      } else if (event.key === 'Escape') {
        event.preventDefault()
        cancelDrill()
      }
      return
    }
    if (isPaused) return
    if (event.nativeEvent.isComposing || event.key === 'Process' || VIETNAMESE_CHARACTERS.test(event.key)) {
      event.preventDefault()
      setShowEnglishKeyboardWarning(true)
      setPressedKey(null)
      return
    }
    if (showEnglishKeyboardWarning) setShowEnglishKeyboardWarning(false)
    const key = normalizeKey(event.key)
    if (key === 'Backspace') {
      event.preventDefault(); setPosition((current) => Math.max(0, current - 1)); setTypedText((current) => current.slice(0, -1)); setStatus('ready'); setPressedKey(null); return
    }
    if (key.length !== 1 && key !== 'Enter') return
    event.preventDefault(); setPressedKey(key === 'Enter' ? 'enter' : key)
    if (startedAt === null) setStartedAt(Date.now())
    setKeystrokes((current) => current + 1)
    if (activeDrillId === 5 || activeDrillId === 6) {
      if (expectedKey === '\n') {
        if (key === 'Enter') {
          const nextPosition = position + 1
          setTypedText((current) => `${current}\n`)
          setPosition(nextPosition)
          setStatus('correct')
          if (nextPosition === activeDrill.content.length) completeDrill()
        } else {
          setMistakes((current) => current + 1)
          setStatus('incorrect')
        }
        return
      }
      if (key.length === 1) {
        if (key === ' ' && expectedKey !== ' ') {
          const nextSpace = activeDrill.content.indexOf(' ', position)
          const nextLineBreak = activeDrill.content.indexOf('\n', position)
          const delimiters = [nextSpace, nextLineBreak].filter((index) => index >= 0)
          const delimiterPosition = delimiters.length > 0 ? Math.min(...delimiters) : activeDrill.content.length
          const nextPosition = activeDrill.content[delimiterPosition] === ' ' ? delimiterPosition + 1 : delimiterPosition
          const skippedCharacters = Math.max(1, delimiterPosition - position)
          setTypedText((current) => current + ' '.repeat(nextPosition - position))
          setPosition(nextPosition)
          setMistakes((current) => current + skippedCharacters)
          setStatus('incorrect')
          if (nextPosition === activeDrill.content.length) completeDrill()
          return
        }
        const nextPosition = position + 1
        setTypedText((current) => current + key)
        setPosition(nextPosition)
        if (key === expectedKey) setStatus('correct')
        else {
          setMistakes((current) => current + 1)
          setStatus('incorrect')
        }
        return
      }
    }
    if (key === expectedKey || (key === 'Enter' && expectedKey === '\n')) {
      const nextPosition = position + 1
      setPosition(nextPosition)
      if (nextPosition === activeDrill.content.length) completeDrill()
      else setStatus('correct')
    } else {
      setMistakes((current) => current + 1); setStatus('incorrect')
    }
  }

  const goToNextDrill = () => {
    if (!isTypingDrill) setCompletedDrills((current) => new Set(current).add(progressKey(activeLessonId, activeDrillId)))
    const nextDrill = drills.find((drill) => drill.id === activeDrillId + 1)
    if (nextDrill) selectDrill(nextDrill.id)
    else setScreen('lesson')
  }

  const togglePause = () => {
    if (startedAt === null || isComplete) return
    if (isPaused) {
      const resumedAt = Date.now()
      if (pausedAt !== null) setStartedAt((current) => current === null ? null : current + resumedAt - pausedAt)
      setPausedAt(null)
      setIsPaused(false)
      requestAnimationFrame(() => practiceRef.current?.focus())
      return
    }
    setPausedAt(Date.now())
    setIsPaused(true)
    setPressedKey(null)
  }

  const cancelDrill = () => {
    resetProgress()
    setScreen('lesson')
  }

  const handleResultNavigation = (event: KeyboardEvent<HTMLElement>) => {
    if (!isComplete) return
    if (event.key === 'Enter') {
      event.preventDefault()
      if (document.activeElement === againButtonRef.current) restart()
      else if (document.activeElement === cancelButtonRef.current) cancelDrill()
      else goToNextDrill()
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      cancelDrill()
      return
    }
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
    event.preventDefault()
    const buttons = [againButtonRef.current, nextButtonRef.current, cancelButtonRef.current].filter((button): button is HTMLButtonElement => button !== null)
    const currentIndex = buttons.indexOf(document.activeElement as HTMLButtonElement)
    const direction = event.key === 'ArrowDown' ? 1 : -1
    const nextIndex = (currentIndex + direction + buttons.length) % buttons.length
    buttons[nextIndex].focus()
  }

  const openLesson = () => setScreen('lesson')

  const selectLesson = (lessonId: LessonId) => {
    setActiveLessonId(lessonId)
    setActiveDrillId(1)
    resetProgress()
    setScreen('lesson')
  }

  return (
    <div className="app-shell">
      <div className={`program-window ${screen === 'drill' ? 'focus-mode' : ''}`}>
        <main className="course-pane">
          <header className={`course-header ${screen === 'drill' || screen === 'basics' ? 'focus-header' : ''}`}>
            <button className="brand" type="button" onClick={openLesson} aria-label={`Typing Speed VN — ${ui.openCourse}`}>
              <span className="brand-mark" aria-hidden="true">TS</span><span>Typing Speed <strong>VN</strong></span>
            </button>
            {screen !== 'drill' && screen !== 'basics' ? (
              <nav className="top-nav" aria-label={ui.menu}>
                <button className={screen === 'lesson' ? 'active' : ''} type="button" onClick={openLesson}>{ui.navCourse}</button>
                <button className={screen === 'daily' ? 'active' : ''} type="button" onClick={() => setScreen('daily')}>{ui.navDaily}</button>
                <button className={screen === 'test' ? 'active' : ''} type="button" onClick={() => setScreen('test')}>{ui.navTest}</button>
                <button className={screen === 'settings' ? 'active icon-nav' : 'icon-nav'} type="button" onClick={() => setScreen('settings')} aria-label={ui.settings} title={ui.settings}>⚙</button>
                <button className={screen === 'about' ? 'active icon-nav' : 'icon-nav'} type="button" onClick={() => setScreen('about')} aria-label={ui.about} title={ui.about}>i</button>
                <a href="https://camnangsinhvien.site" rel="noreferrer">{ui.backToSite} ↗</a>
                <a href="https://camnangsinhvien.site/lien-he/" rel="noreferrer" target="_blank">{ui.contactReport} ↗</a>
              </nav>
            ) : <span className="course-label">{ui.courseLabel}</span>}
          </header>

          {screen === 'lesson' && (
            <section className="lesson-overview" aria-labelledby="course-title">
              <div className="section-title-row">
                <div><p className="eyebrow">{ui.courseEyebrow}</p><h1 id="course-title">{ui.courseTitle}</h1></div>
                <span className="course-progress">{completedInLesson + (activeLessonId === 1 && basicsComplete ? 1 : 0)}/{lessonCompletionTotal} {ui.complete}</span>
              </div>
              <nav className="lesson-tabs" aria-label={ui.lessonList}>
                {Array.from({ length: 12 }, (_, index) => index + 1).map((lessonNumber) => (
                  <button aria-current={lessonNumber === activeLessonId ? 'page' : undefined} key={lessonNumber} onClick={() => selectLesson(lessonNumber as LessonId)} title={`${ui.lesson} ${lessonNumber}`} type="button">{lessonNumber}</button>
                ))}
              </nav>
              <div className="lesson-summary">
                <p className="lesson-number">{ui.lesson} {activeLessonId}</p>
                <h2>{activeLesson.title[language]}</h2>
                <p>{activeLesson.description[language]}</p>
              </div>
              <ol className="exercise-list">
                {activeLessonId === 1 && (
                  <li className={!basicsComplete ? 'recommended' : ''}>
                    <button type="button" onClick={openBasics}>
                      <span className={`exercise-status ${basicsComplete ? 'done' : ''}`} aria-hidden="true">{basicsComplete ? '✓' : ''}</span>
                      <strong>1. {ui.touchTypingBasics}</strong>
                      <span>{ui.touchTypingSummary}</span>
                      <small>{language === 'vi' ? '3 phút' : '3 min.'}</small>
                    </button>
                  </li>
                )}
                {drills.map((drill, index) => {
                  const isDone = completedDrills.has(progressKey(activeLessonId, drill.id))
                  const firstReady = drills.find((item) => !completedDrills.has(progressKey(activeLessonId, item.id)))?.id
                  const canRecommend = activeLessonId !== 1 || basicsComplete
                  return (
                    <li className={canRecommend && drill.id === firstReady ? 'recommended' : ''} key={drill.id}>
                      <button type="button" onClick={() => selectDrill(drill.id)}>
                        <span className={`exercise-status ${isDone ? 'done' : ''}`} aria-hidden="true">{isDone ? '✓' : ''}</span>
                        <strong>{index + (activeLessonId === 1 ? 2 : 1)}. {drill.name[language]}</strong>
                        <span>{drill.id === 1 ? activeLesson.keySummary : drill.title[language]}</span>
                        <small>{formatDuration(drill.duration, language)}</small>
                      </button>
                    </li>
                  )
                })}
              </ol>
              <div className="lesson-note"><span aria-hidden="true">i</span><p><strong>{ui.hint}</strong> {ui.lessonHint}</p></div>
            </section>
          )}

          {screen === 'basics' && (
            <section className="basics-screen" aria-labelledby="basics-title">
              <article className="basics-card">
                <header className="basics-header">
                  <p>{ui.lesson} 1 · {ui.touchTypingBasics}</p>
                  <h1 id="basics-title">{BASICS_SLIDE_TITLES[language][basicsPage]}</h1>
                </header>

                <div className="basics-body" aria-live="polite">
                  {basicsPage === 0 && (
                    <div className="basics-columns">
                      <div className="basics-copy">
                        <p><strong>{ui.typingTerm}</strong> {ui.basics.intro}</p>
                        <p>{ui.basics.afterCourse}</p>
                        <ul>{ui.basics.benefits.map((benefit) => <li key={benefit}>{benefit}</li>)}</ul>
                      </div>
                      <div className="basics-hero" aria-hidden="true"><strong>10</strong><span>{ui.basics.hero.split('\n').map((line, index) => <span key={line}>{index > 0 && <br />}{line}</span>)}</span></div>
                    </div>
                  )}

                  {basicsPage === 1 && (
                    <div className="basics-position-page">
                      <div className="basics-copy">
                        <p>{ui.basics.positionIntro}</p>
                        <ol>{ui.basics.positionSteps.map((step) => <li key={step}>{step}</li>)}</ol>
                        <p className="basics-tip"><strong>{ui.hint}</strong> {ui.basics.positionTip}</p>
                      </div>
                      <div className="basics-guide-visual"><Keyboard colorCoded language={language} newKeyCharacters={LESSONS[1].newKeyCharacters} pressedKey={null} status="ready" targetKey="" /><Hands activeFinger={null} colorCoded highlightedFingers={LESSONS[1].newKeys.map((item) => item.finger)} language={language} /></div>
                    </div>
                  )}

                  {basicsPage === 2 && (
                    <div className="basics-position-page">
                      <div className="basics-copy">
                        <h2>{ui.basics.pressHeading}</h2>
                        <ol>{ui.basics.pressSteps.map((step) => <li key={step}>{step}</li>)}</ol>
                        <h2>{ui.basics.spaceHeading}</h2>
                        <p>{ui.basics.spaceText}</p>
                      </div>
                      <div className="basics-key-demo"><span>{ui.basics.demo}</span><Keyboard language={language} pressedKey={null} status="ready" targetKey="u" /><Hands activeFinger="right-index" language={language} /></div>
                    </div>
                  )}

                  {basicsPage === 3 && (
                    <div className="basics-tips">
                      {ui.basics.tips.map(([title, description]) => <div key={title}><strong>{title}</strong><p>{description}</p></div>)}
                    </div>
                  )}

                  {basicsPage === 4 && (
                    <div className="basics-ready">
                      <p>{ui.basics.readyIntro}</p>
                      <ul>{ui.basics.checklist.map(([title, description]) => <li key={title}><strong>{title}</strong> {description}</li>)}</ul>
                      <div className="ready-callout"><strong>{ui.basics.ready}</strong><span>{ui.basics.readyText}</span></div>
                    </div>
                  )}
                </div>

                <footer className="basics-actions">
                  <button className="cancel-button" type="button" onClick={cancelBasics}>{ui.cancel}</button>
                  <strong>{basicsPage + 1} / {BASICS_SLIDE_TITLES[language].length}</strong>
                  <button className="primary-button" type="button" onClick={nextBasicsPage}>{basicsPage === BASICS_SLIDE_TITLES[language].length - 1 ? ui.startNewKeys : ui.next}</button>
                </footer>
              </article>
            </section>
          )}

          {screen === 'drill' && (
            <section className="drill-screen" aria-labelledby="drill-title">
              <div className="typing-title-row">
                <h1 id="drill-title">{ui.lesson} {activeLessonId}: {activeDrillName}</h1>
                {showEnglishKeyboardWarning && (
                  <div className="keyboard-language-warning" role="alert">
                    <span aria-hidden="true">!</span>
                    <span>{ui.keyboardWarning}</span>
                  </div>
                )}
              </div>

              {activeDrill.id === 1 ? (
                <div className="new-keys-layout">
                  <div className="intro-copy"><p>{activeLesson.newKeysIntro[language]}</p></div>
                  <div className={`home-row-grid ${activeLesson.newKeys.length <= 2 ? 'few-keys' : ''}`} aria-label={ui.newKeysAria}>
                    {activeLesson.newKeys.map((item) => <div className={`home-key finger-${item.finger}`} key={item.key}><strong>{item.key}</strong><span>{item.label[language]}</span></div>)}
                  </div>
                  {showGuides && <div className="intro-guide"><Keyboard colorCoded language={language} newKeyCharacters={activeLesson.newKeyCharacters} pressedKey={null} status="ready" targetKey="" /><Hands activeFinger={null} colorCoded highlightedFingers={activeLesson.newKeys.map((item) => item.finger)} language={language} /></div>}
                  <div className="intro-actions"><button className="primary-button" type="button" onClick={startKeyDrill}>{ui.startKeyDrill} →</button></div>
                </div>
              ) : (
                <div className="typing-workspace">
                  <section aria-label={`${activeDrillName}: ${activeDrillTitle}`} className={`typing-card status-${status} ${activeDrill.content.length > 60 ? 'long-content' : ''}`} onClick={() => practiceRef.current?.focus()} onCompositionStart={() => setShowEnglishKeyboardWarning(true)} onKeyDown={handleKeyDown} onKeyUp={() => setPressedKey(null)} ref={practiceRef} tabIndex={0}>
                    {isComplete ? (
                      <div className="completion" role="status" aria-live="polite">
                        <div className="completion-copy"><span className="completion-icon" aria-hidden="true">✓</span><strong>{secondsLeft === 0 ? ui.timeUp : `${ui.completed} ${activeDrillName}`}</strong><small>{secondsLeft === 0 ? ui.timedOut : ui.resultsReady}</small></div>
                      </div>
                    ) : activeDrillId === 2 ? (
                      <div className="key-drill-content">
                        <p className={`key-drill-instruction ${startedAt !== null ? 'is-hidden' : ''}`} aria-hidden={startedAt !== null}><span aria-hidden="true">▶</span>{ui.keyInstructionTop}</p>
                        <KeySequence groups={activeLesson.keyDrillGroups} language={language} position={position} status={status} />
                        <p className={`key-drill-instruction ${startedAt !== null ? 'is-hidden' : ''}`} aria-hidden={startedAt !== null}><span aria-hidden="true">▶</span>{ui.keyInstructionBottom}</p>
                      </div>
                    ) : activeDrillId === 3 ? (
                      <WordSequence language={language} lines={activeLesson.wordLines} position={position} status={status} />
                    ) : activeDrillId === 4 ? (
                      <SentenceSequence language={language} lines={activeLesson.sentenceLines} position={position} status={status} />
                    ) : activeDrillId === 5 ? (
                      <ParagraphPractice label={ui.sampleParagraph} language={language} lines={activeLesson.paragraphLines} position={position} typedText={typedText} />
                    ) : activeDrillId === 6 ? (
                      <ParagraphPractice className="text-drill-practice" label={ui.sampleText} language={language} lines={activeLesson.textLines} position={position} typedText={typedText} />
                    ) : (
                      <div className={`typing-line ${activeDrill.content.length > 60 ? 'compact' : ''}`} aria-label={`${language === 'en' ? 'Content to type' : 'Nội dung cần gõ'}: ${activeDrill.content}`}>
                        {activeDrill.content.split('').map((character, index) => <span className={`${character === ' ' ? 'space-char' : ''} ${index < position ? 'typed' : index === position ? 'current-char' : ''}`} key={`${character}-${index}`}>{character === ' ' ? '\u00a0' : character}</span>)}
                      </div>
                    )}
                  </section>
                  {showGuides && activeDrillId !== 6 && (
                    <section className="guide-card" aria-label={ui.keyboardHands}>
                      <Keyboard language={language} pressedKey={pressedKey} status={status} targetKey={targetKey} />
                      <Hands activeFinger={activeFinger} language={language} />
                    </section>
                  )}
                </div>
              )}
            </section>
          )}

          {screen === 'settings' && (
            <section className="simple-page" aria-labelledby="settings-title">
              <p className="eyebrow">{ui.preferences}</p><h1 id="settings-title">{ui.settings}</h1><p className="page-lead">{ui.settingsLead}</p>
              <div className="settings-card">
                <label className="language-row"><strong>{ui.interfaceLanguage}</strong><select aria-label={ui.interfaceLanguage} onChange={(event) => setLanguage(event.target.value as AppLanguage)} value={language}><option value="en">English</option><option value="vi">Tiếng Việt</option></select></label>
                <div><strong>{ui.keyboardLayout}</strong><span>US QWERTY</span></div>
                <label className="toggle-row"><span><strong>{ui.keyboardHands}</strong><small>{ui.keyboardHandsHelp}</small></span><input checked={showGuides} onChange={(event) => setShowGuides(event.target.checked)} type="checkbox" /></label>
                <div><strong>{ui.courseContent}</strong><span>{ui.englishCourse}</span></div>
              </div>
              <button className="primary-button" type="button" onClick={openLesson}>{ui.backToCourse}</button>
            </section>
          )}

          {screen === 'daily' && <FreeTypingPractice completedLessonCount={completedLessonCount} interfaceLanguage={language} mode="daily" />}

          {screen === 'test' && <FreeTypingPractice completedLessonCount={completedLessonCount} interfaceLanguage={language} mode="test" />}

          {screen === 'about' && (
            <section className="simple-page" aria-labelledby="about-title">
              <p className="eyebrow">{ui.aboutProject}</p><h1 id="about-title">Typing Speed VN</h1><p className="page-lead">{ui.aboutLead}</p>
              <div className="about-card"><span className="about-mark" aria-hidden="true">TS</span><div><strong>Typing Speed VN</strong><small>{ui.versionCourse}</small></div></div>
              <button className="primary-button" type="button" onClick={openLesson}>{ui.openCourse}</button>
            </section>
          )}
        </main>

        {screen === 'drill' && <aside className="program-nav drill-mode" aria-label={ui.menu}>
          <div className="rail-heading"><span className="rail-logo" aria-hidden="true">T</span><span><strong>Typing Speed</strong><small>VN</small></span></div>
          <>
              {isTypingDrill && (
                <section className={`drill-timer ${startedAt !== null && !isComplete ? 'running' : ''}`} aria-label={ui.timer}>
                  <div><strong>{ui.timer}</strong><button disabled={startedAt === null || isComplete} type="button" onClick={togglePause}>{isPaused ? ui.resume : ui.pause}</button></div>
                  <time dateTime={`PT${secondsLeft}S`}>{formatTime(secondsLeft)}</time>
                </section>
              )}
              {isTypingDrill && isComplete && (
                <section className="drill-results" aria-label={ui.result}>
                  <h2>{ui.result}</h2>
                  <dl>
                    <div><dt>{ui.timeUsed}</dt><dd>{formatTime(timeUsed)}</dd></div>
                    <div><dt>{ui.grossSpeed}</dt><dd>{grossSpeed} WPM</dd></div>
                    <div><dt>{ui.accuracy}</dt><dd>{accuracy}%</dd></div>
                    <div><dt>{ui.netSpeed}</dt><dd>{netSpeed} WPM</dd></div>
                  </dl>
                </section>
              )}
              <nav className="drill-nav" aria-label={ui.drillControls} onKeyDown={handleResultNavigation}>
                {isComplete && <button className="again-button" ref={againButtonRef} type="button" onClick={restart}>{ui.again}</button>}
                <button aria-keyshortcuts={isComplete ? 'Enter' : undefined} className="next-button" disabled={isTypingDrill && !isComplete} ref={nextButtonRef} type="button" onClick={goToNextDrill}>{ui.next}{isComplete && <kbd>Enter</kbd>}</button>
                <button aria-keyshortcuts={isComplete ? 'Escape' : undefined} className="cancel-button" ref={cancelButtonRef} type="button" onClick={cancelDrill}>{ui.cancel}{isComplete && <kbd>Esc</kbd>}</button>
              </nav>
          </>
        </aside>}
      </div>
    </div>
  )
}
