import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'

type FingerId = 'left-pinky' | 'left-ring' | 'left-middle' | 'left-index' | 'left-thumb' | 'right-thumb' | 'right-index' | 'right-middle' | 'right-ring' | 'right-pinky'
type DrillStatus = 'ready' | 'correct' | 'incorrect' | 'complete'
type DrillId = 1 | 2 | 3 | 4 | 5
type LessonId = 1 | 2
type Screen = 'lesson' | 'basics' | 'drill' | 'settings' | 'about'
type Drill = { id: DrillId; name: string; title: string; hint: string; content: string; duration: string }
type NewKey = { key: string; finger: FingerId; label: string }
type LessonData = {
  id: LessonId
  title: string
  description: string
  keySummary: string
  newKeyCharacters: string
  newKeys: NewKey[]
  newKeysIntro: string
  keyDrillGroups: string[]
  wordLines: string[]
  sentenceLines: string[]
  paragraphLines: string[]
  drills: Drill[]
}

const DRILL_TIME_LIMIT = 5 * 60
const KEY_DRILL_PAGE_SIZE = 6
const PARAGRAPH_PAGE_SIZE = 2
const VIETNAMESE_CHARACTERS = /[ăâđêôơưàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]/i
const BASICS_SLIDE_TITLES = ['Touch Typing là gì?', 'Vị trí các ngón tay', 'Cách nhấn phím', 'Mẹo luyện tập', 'Sẵn sàng bắt đầu']
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
  { key: 'A', finger: 'left-pinky', label: 'Út trái' },
  { key: 'S', finger: 'left-ring', label: 'Áp út trái' },
  { key: 'D', finger: 'left-middle', label: 'Giữa trái' },
  { key: 'F', finger: 'left-index', label: 'Trỏ trái' },
  { key: 'J', finger: 'right-index', label: 'Trỏ phải' },
  { key: 'K', finger: 'right-middle', label: 'Giữa phải' },
  { key: 'L', finger: 'right-ring', label: 'Áp út phải' },
  { key: ';', finger: 'right-pinky', label: 'Út phải' },
]

const LESSON_2_NEW_KEYS: NewKey[] = [
  { key: 'E', finger: 'left-middle', label: 'Giữa trái' },
  { key: 'I', finger: 'right-middle', label: 'Giữa phải' },
]

const LESSONS: Record<LessonId, LessonData> = {
  1: {
    id: 1,
    title: 'The Home Row: A S D F · J K L ;',
    description: 'Học vị trí hàng phím cơ sở, sau đó tiến dần từ phím đơn đến đoạn văn hoàn chỉnh.',
    keySummary: 'A S D F · J K L ;',
    newKeyCharacters: 'asdfjkl;',
    newKeys: LESSON_1_NEW_KEYS,
    newKeysIntro: 'Đặt các ngón tay lên A S D F và J K L ;. Hai phím F và J có gờ nhỏ để tìm lại vị trí mà không cần nhìn xuống.',
    keyDrillGroups: LESSON_1_KEY_GROUPS,
    wordLines: LESSON_1_WORD_LINES,
    sentenceLines: LESSON_1_SENTENCE_LINES,
    paragraphLines: LESSON_1_PARAGRAPH_LINES,
    drills: [
      { id: 1, name: 'New Keys', title: 'Meet the home-row keys', hint: 'Đặt các ngón tay lên A S D F và J K L ;', content: '', duration: '2–3 min.' },
      { id: 2, name: 'Key Drill', title: 'Keep your fingers on the home row', hint: 'Lặp lại từng phím để ghi nhớ vị trí', content: LESSON_1_KEY_GROUPS.join(''), duration: '3–5 min.' },
      { id: 3, name: 'Word Drill', title: 'Build words with home-row keys', hint: 'Gõ hết một dòng để hiện dòng từ tiếp theo', content: LESSON_1_WORD_LINES.join(''), duration: '3–5 min.' },
      { id: 4, name: 'Sentence Drill', title: 'Connect words into short sentences', hint: 'Gõ hết mỗi dòng rồi nhấn Enter để sang dòng tiếp theo', content: LESSON_1_SENTENCE_LINES.map((line) => `${line}\n`).join(''), duration: '3–5 min.' },
      { id: 5, name: 'Paragraph Drill', title: 'Type a full home-row paragraph', hint: 'Gõ hết mỗi dòng rồi nhấn Enter để xuống dòng', content: LESSON_1_PARAGRAPH_LINES.map((line) => `${line}\n`).join(''), duration: '4–6 min.' },
    ],
  },
  2: {
    id: 2,
    title: 'Top Row Reach: E · I',
    description: 'Dùng hai ngón giữa vươn lên phím E và I, sau đó trở về D và K ở hàng cơ sở.',
    keySummary: 'E · I',
    newKeyCharacters: 'ei',
    newKeys: LESSON_2_NEW_KEYS,
    newKeysIntro: 'Giữ tay ở hàng cơ sở. Dùng ngón giữa trái vươn từ D lên E và ngón giữa phải vươn từ K lên I, rồi trở về vị trí ban đầu.',
    keyDrillGroups: LESSON_2_KEY_GROUPS,
    wordLines: LESSON_2_WORD_LINES,
    sentenceLines: LESSON_2_SENTENCE_LINES,
    paragraphLines: LESSON_2_PARAGRAPH_LINES,
    drills: [
      { id: 1, name: 'New Keys', title: 'Meet the E and I keys', hint: 'Vươn hai ngón giữa từ D và K lên E và I', content: '', duration: '2–3 min.' },
      { id: 2, name: 'Key Drill', title: 'Reach E and I from the home row', hint: 'Luyện chuyển động D–E và K–I', content: LESSON_2_KEY_GROUPS.join(''), duration: '3–5 min.' },
      { id: 3, name: 'Word Drill', title: 'Build words with E and I', hint: 'Gõ hết một dòng để hiện dòng từ tiếp theo', content: LESSON_2_WORD_LINES.join(''), duration: '3–5 min.' },
      { id: 4, name: 'Sentence Drill', title: 'Use E and I in short sentences', hint: 'Gõ hết mỗi dòng rồi nhấn Enter để sang dòng tiếp theo', content: LESSON_2_SENTENCE_LINES.map((line) => `${line}\n`).join(''), duration: '3–5 min.' },
      { id: 5, name: 'Paragraph Drill', title: 'Practice E and I in paragraphs', hint: 'Gõ hết mỗi dòng rồi nhấn Enter để xuống dòng', content: LESSON_2_PARAGRAPH_LINES.map((line) => `${line}\n`).join(''), duration: '4–6 min.' },
    ],
  },
}

const fingerLabels: Record<FingerId, string> = {
  'left-pinky': 'Ngón út trái', 'left-ring': 'Ngón áp út trái', 'left-middle': 'Ngón giữa trái', 'left-index': 'Ngón trỏ trái', 'left-thumb': 'Ngón cái trái',
  'right-thumb': 'Ngón cái phải', 'right-index': 'Ngón trỏ phải', 'right-middle': 'Ngón giữa phải', 'right-ring': 'Ngón áp út phải', 'right-pinky': 'Ngón út phải',
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

function Keyboard({ targetKey, pressedKey, status, colorCoded = false, newKeyCharacters = '' }: { targetKey: string; pressedKey: string | null; status: DrillStatus; colorCoded?: boolean; newKeyCharacters?: string }) {
  return (
    <div className="keyboard-scroll">
      <div className={`keyboard ${colorCoded ? 'color-coded' : ''}`} aria-label="Bàn phím ảo">
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

function Hands({ activeFinger, colorCoded = false, highlightedFingers = [] }: { activeFinger: FingerId | null; colorCoded?: boolean; highlightedFingers?: FingerId[] }) {
  const renderHand = (side: 'left' | 'right') => {
    const fingers: FingerId[] = side === 'left'
      ? ['left-pinky', 'left-ring', 'left-middle', 'left-index', 'left-thumb']
      : ['right-thumb', 'right-index', 'right-middle', 'right-ring', 'right-pinky']
    return (
      <div className={`hand hand-${side}`} aria-label={`Bàn tay ${side === 'left' ? 'trái' : 'phải'}`}>
        <div className="finger-set">
          {fingers.map((finger, index) => (
            <span aria-label={fingerLabels[finger]} className={`finger finger-${finger} finger-${index + 1} ${highlightedFingers.includes(finger) ? 'introduced' : ''} ${activeFinger === finger ? 'active' : ''}`} key={finger} role="img" />
          ))}
        </div>
        <div className="palm" />
      </div>
    )
  }
  return <div className={`hands ${colorCoded ? 'color-coded' : ''}`}>{renderHand('left')}{renderHand('right')}</div>
}

function KeySequence({ groups, position, status }: { groups: string[]; position: number; status: DrillStatus }) {
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
    <div className={`key-sequence status-${status}`} aria-label={`Chuỗi phím cần gõ: ${groups.join('')}`}>
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

function SentenceSequence({ lines, position, status }: { lines: string[]; position: number; status: DrillStatus }) {
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
    <div className={`sentence-sequence status-${status}`} aria-label={`Dòng cần gõ: ${line}. Sau đó nhấn Enter.`}>
      <div className="typing-line sentence-line">
        {line.split('').map((character, characterIndex) => {
          const index = lineStart + characterIndex
          return <span className={`${character === ' ' ? 'space-char' : ''} ${index < position ? 'typed' : index === position ? 'current-char' : ''}`} key={`${character}-${index}`}>{character === ' ' ? '\u00a0' : character}</span>
        })}
        <span className={`line-enter-symbol ${position === lineEnd ? 'current' : ''}`} aria-label="Nhấn Enter để sang dòng tiếp theo">↵</span>
      </div>
    </div>
  )
}

function WordSequence({ lines, position, status }: { lines: string[]; position: number; status: DrillStatus }) {
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
    <div className={`word-sequence status-${status}`} aria-label={`Dòng từ cần gõ: ${line}`}>
      <div className="typing-line word-line">
        {line.split('').map((character, characterIndex) => {
          const index = lineStart + characterIndex
          return <span className={`${character === ' ' ? 'space-char' : ''} ${index < position ? 'typed' : index === position ? 'current-char' : ''}`} key={`${character}-${index}`}>{character === ' ' ? '\u00a0' : character}</span>
        })}
      </div>
    </div>
  )
}

function ParagraphPractice({ lines, position, typedText }: { lines: string[]; position: number; typedText: string }) {
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
    <div className="paragraph-practice">
      <div className="paragraph-reference" aria-label={`Đoạn văn mẫu gồm ${lines.length} dòng`}>
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
              <span className={`line-enter-symbol ${position === currentEnd ? 'current' : ''}`} aria-label={`Kết thúc dòng ${lineIndex + 1}`}>↵</span>
            </div>
          )
        })}
      </div>
      <div className="paragraph-divider" aria-hidden="true" />
      <div className="paragraph-input" aria-label={`Nội dung đã gõ trên dòng: ${typedLine || 'Chưa bắt đầu'}`} aria-live="polite">
        {typedLine.split('').map((character, index) => <span className={character === line[index] ? 'typed-correct' : 'typed-incorrect'} key={`${character}-${index}`}>{character === ' ' ? '\u00a0' : character}</span>)}
        <span className="paragraph-caret" aria-hidden="true">&nbsp;</span>
      </div>
    </div>
  )
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('lesson')
  const [activeLessonId, setActiveLessonId] = useState<LessonId>(1)
  const [activeDrillId, setActiveDrillId] = useState<DrillId>(1)
  const [basicsComplete, setBasicsComplete] = useState(false)
  const [basicsPage, setBasicsPage] = useState(0)
  const [completedDrills, setCompletedDrills] = useState<Set<string>>(() => new Set())
  const [position, setPosition] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [typedText, setTypedText] = useState('')
  const [status, setStatus] = useState<DrillStatus>('ready')
  const [pressedKey, setPressedKey] = useState<string | null>(null)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [finishedAt, setFinishedAt] = useState<number | null>(null)
  const [keystrokes, setKeystrokes] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(DRILL_TIME_LIMIT)
  const [isPaused, setIsPaused] = useState(false)
  const [pausedAt, setPausedAt] = useState<number | null>(null)
  const [showGuides, setShowGuides] = useState(true)
  const [showEnglishKeyboardWarning, setShowEnglishKeyboardWarning] = useState(false)
  const practiceRef = useRef<HTMLElement>(null)

  const activeLesson = LESSONS[activeLessonId]
  const drills = activeLesson.drills
  const activeDrill = drills.find((drill) => drill.id === activeDrillId) ?? drills[0]
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
    if (basicsPage < BASICS_SLIDE_TITLES.length - 1) {
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
    if (activeDrillId === 5) {
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

  const openLesson = () => setScreen('lesson')

  const selectLesson = (lessonId: LessonId) => {
    setActiveLessonId(lessonId)
    setActiveDrillId(1)
    resetProgress()
    setScreen('lesson')
  }

  return (
    <div className="app-shell">
      <div className="program-window">
        <main className="course-pane">
          <header className="course-header">
            <button className="brand" type="button" onClick={openLesson} aria-label="Typing Speed VN — mở lesson">
              <span className="brand-mark" aria-hidden="true">TS</span><span>Typing Speed <strong>VN</strong></span>
            </button>
            <span className="course-label">English · Beginner</span>
          </header>

          {screen === 'lesson' && (
            <section className="lesson-overview" aria-labelledby="course-title">
              <div className="section-title-row">
                <div><p className="eyebrow">English typing course</p><h1 id="course-title">Fast Touch Typing Course</h1></div>
                <span className="course-progress">{completedInLesson + (activeLessonId === 1 && basicsComplete ? 1 : 0)}/{lessonCompletionTotal} complete</span>
              </div>
              <nav className="lesson-tabs" aria-label="Danh sách lesson">
                {Array.from({ length: 12 }, (_, index) => index + 1).map((lessonNumber) => (
                  <button aria-current={lessonNumber === activeLessonId ? 'page' : undefined} disabled={lessonNumber > 2} key={lessonNumber} onClick={() => lessonNumber <= 2 && selectLesson(lessonNumber as LessonId)} title={lessonNumber <= 2 ? `Lesson ${lessonNumber}` : 'Sắp ra mắt'} type="button">{lessonNumber}</button>
                ))}
              </nav>
              <div className="lesson-summary">
                <p className="lesson-number">Lesson {activeLessonId}</p>
                <h2>{activeLesson.title}</h2>
                <p>{activeLesson.description}</p>
              </div>
              <ol className="exercise-list">
                {activeLessonId === 1 && (
                  <li className={!basicsComplete ? 'recommended' : ''}>
                    <button type="button" onClick={openBasics}>
                      <span className={`exercise-status ${basicsComplete ? 'done' : ''}`} aria-hidden="true">{basicsComplete ? '✓' : ''}</span>
                      <strong>1. Touch Typing Basics</strong>
                      <span>Kỹ thuật gõ 10 ngón</span>
                      <small>3 min.</small>
                    </button>
                  </li>
                )}
                {drills.map((drill, index) => {
                  const isDone = completedDrills.has(progressKey(activeLessonId, drill.id))
                  const firstReady = drills.find((item) => !completedDrills.has(progressKey(activeLessonId, item.id)))?.id
                  const canRecommend = activeLessonId === 2 || basicsComplete
                  return (
                    <li className={canRecommend && drill.id === firstReady ? 'recommended' : ''} key={drill.id}>
                      <button type="button" onClick={() => selectDrill(drill.id)}>
                        <span className={`exercise-status ${isDone ? 'done' : ''}`} aria-hidden="true">{isDone ? '✓' : ''}</span>
                        <strong>{index + (activeLessonId === 1 ? 2 : 1)}. {drill.name}</strong>
                        <span>{drill.id === 1 ? activeLesson.keySummary : drill.title}</span>
                        <small>{drill.duration}</small>
                      </button>
                    </li>
                  )
                })}
              </ol>
              <div className="lesson-note"><span aria-hidden="true">i</span><p><strong>Gợi ý:</strong> hoàn thành theo thứ tự để ngón tay quen vị trí trước khi tăng tốc.</p></div>
            </section>
          )}

          {screen === 'basics' && (
            <section className="basics-screen" aria-labelledby="basics-title">
              <article className="basics-card">
                <header className="basics-header">
                  <p>Lesson 1 · Touch Typing Basics</p>
                  <h1 id="basics-title">{BASICS_SLIDE_TITLES[basicsPage]}</h1>
                </header>

                <div className="basics-body" aria-live="polite">
                  {basicsPage === 0 && (
                    <div className="basics-columns">
                      <div className="basics-copy">
                        <p><strong>Touch typing</strong> là kỹ thuật gõ nhanh và chính xác bằng cả mười ngón tay mà không cần nhìn xuống bàn phím.</p>
                        <p>Sau khóa học, bạn sẽ có thể:</p>
                        <ul>
                          <li>Gõ nhanh hơn bằng cả 10 ngón.</li>
                          <li>Giảm lỗi và giữ nhịp gõ ổn định.</li>
                          <li>Tập trung vào nội dung trên màn hình.</li>
                          <li>Hình thành tư thế làm việc thoải mái hơn.</li>
                        </ul>
                      </div>
                      <div className="basics-hero" aria-hidden="true"><strong>10</strong><span>ngón tay<br />một nhịp gõ</span></div>
                    </div>
                  )}

                  {basicsPage === 1 && (
                    <div className="basics-position-page">
                      <div className="basics-copy">
                        <p>Các ngón tay bắt đầu ở <strong>hàng cơ sở</strong>. Từ đây, bạn có thể với tới những phím còn lại rồi quay về vị trí ban đầu.</p>
                        <ol>
                          <li>Tay trái đặt trên <strong>A S D F</strong>.</li>
                          <li>Tay phải đặt trên <strong>J K L ;</strong>.</li>
                          <li>Hai ngón cái nghỉ nhẹ trên phím Space.</li>
                          <li>Giữ cổ tay thẳng, bàn tay thả lỏng.</li>
                        </ol>
                        <p className="basics-tip"><strong>Mẹo:</strong> gờ nhỏ trên F và J giúp bạn tìm lại hàng cơ sở mà không cần nhìn bàn phím.</p>
                      </div>
                      <div className="basics-guide-visual"><Keyboard colorCoded newKeyCharacters={LESSONS[1].newKeyCharacters} pressedKey={null} status="ready" targetKey="" /><Hands activeFinger={null} colorCoded highlightedFingers={LESSONS[1].newKeys.map((item) => item.finger)} /></div>
                    </div>
                  )}

                  {basicsPage === 2 && (
                    <div className="basics-position-page">
                      <div className="basics-copy">
                        <h2>Di chuyển ngón gần nhất</h2>
                        <ol>
                          <li>Giữ các ngón ở hàng cơ sở.</li>
                          <li>Di chuyển ngón gần phím cần gõ nhất.</li>
                          <li>Nhấn nhanh, nhẹ và giữ bàn tay thư giãn.</li>
                          <li>Đưa ngón tay trở lại phím cơ sở.</li>
                        </ol>
                        <h2>Phím Space</h2>
                        <p>Dùng một ngón cái cố định để nhấn Space. Không đổi ngón cái giữa lúc luyện để nhịp gõ nhất quán.</p>
                      </div>
                      <div className="basics-key-demo"><span>Ví dụ: dùng ngón trỏ phải để gõ U</span><Keyboard pressedKey={null} status="ready" targetKey="u" /><Hands activeFinger="right-index" /></div>
                    </div>
                  )}

                  {basicsPage === 3 && (
                    <div className="basics-tips">
                      <div><strong>Nhìn vào màn hình</strong><p>Bạn sẽ ghi nhớ vị trí phím nhanh hơn khi không nhìn xuống bàn phím.</p></div>
                      <div><strong>Giữ cổ tay thẳng</strong><p>Không tì mạnh cổ tay xuống bàn để các ngón di chuyển nhẹ nhàng.</p></div>
                      <div><strong>Ưu tiên độ chính xác</strong><p>Gõ đúng trước, tốc độ sẽ tăng tự nhiên khi phản xạ đã ổn định.</p></div>
                      <div><strong>Giữ nhịp đều</strong><p>Nhấn phím nhẹ và đều thay vì cố gõ thật nhanh trong thời gian ngắn.</p></div>
                    </div>
                  )}

                  {basicsPage === 4 && (
                    <div className="basics-ready">
                      <p>Trước khi bắt đầu, hãy kiểm tra nhanh:</p>
                      <ul>
                        <li><strong>Tư thế thư giãn:</strong> ngồi thẳng, khuỷu tay gần cơ thể, vai và bàn tay thả lỏng.</li>
                        <li><strong>Nghỉ giữa các bài:</strong> dừng lại khi tay hoặc vai bắt đầu căng.</li>
                        <li><strong>Dùng Pause khi cần:</strong> không cần cố hoàn thành bài khi mất tập trung.</li>
                        <li><strong>Không nhìn bàn phím:</strong> dùng bàn phím và bàn tay trên màn hình để nhận gợi ý.</li>
                      </ul>
                      <div className="ready-callout"><strong>Sẵn sàng rồi!</strong><span>Bài tiếp theo sẽ giới thiệu tám phím đầu tiên: A S D F · J K L ;</span></div>
                    </div>
                  )}
                </div>

                <footer className="basics-actions">
                  <button className="cancel-button" type="button" onClick={cancelBasics}>Cancel</button>
                  <strong>{basicsPage + 1} / {BASICS_SLIDE_TITLES.length}</strong>
                  <button className="primary-button" type="button" onClick={nextBasicsPage}>{basicsPage === BASICS_SLIDE_TITLES.length - 1 ? 'Bắt đầu New Keys' : 'Next'}</button>
                </footer>
              </article>
            </section>
          )}

          {screen === 'drill' && (
            <section className="drill-screen" aria-labelledby="drill-title">
              <div className="typing-title-row">
                <h1 id="drill-title">Lesson {activeLessonId}: {activeDrill.name}</h1>
                {showEnglishKeyboardWarning && (
                  <div className="keyboard-language-warning" role="alert">
                    <span aria-hidden="true">!</span>
                    <span>Hãy chuyển bàn phím sang <strong>EN</strong> để có trải nghiệm tốt hơn.</span>
                  </div>
                )}
              </div>

              {activeDrill.id === 1 ? (
                <div className="new-keys-layout">
                  <div className="intro-copy"><p>{activeLesson.newKeysIntro}</p></div>
                  <div className={`home-row-grid ${activeLesson.newKeys.length <= 2 ? 'few-keys' : ''}`} aria-label="Các phím mới và ngón tay tương ứng">
                    {activeLesson.newKeys.map((item) => <div className={`home-key finger-${item.finger}`} key={item.key}><strong>{item.key}</strong><span>{item.label}</span></div>)}
                  </div>
                  {showGuides && <div className="intro-guide"><Keyboard colorCoded newKeyCharacters={activeLesson.newKeyCharacters} pressedKey={null} status="ready" targetKey="" /><Hands activeFinger={null} colorCoded highlightedFingers={activeLesson.newKeys.map((item) => item.finger)} /></div>}
                  <div className="intro-actions"><button className="primary-button" type="button" onClick={startKeyDrill}>Bắt đầu Key Drill →</button></div>
                </div>
              ) : (
                <div className="typing-workspace">
                  <section aria-label={`${activeDrill.name}: ${activeDrill.title}`} className={`typing-card status-${status} ${activeDrill.content.length > 60 ? 'long-content' : ''}`} onClick={() => practiceRef.current?.focus()} onCompositionStart={() => setShowEnglishKeyboardWarning(true)} onKeyDown={handleKeyDown} onKeyUp={() => setPressedKey(null)} ref={practiceRef} tabIndex={0}>
                    {isComplete ? (
                      <div className="completion" role="status" aria-live="polite">
                        <div className="completion-copy"><span className="completion-icon" aria-hidden="true">✓</span><strong>{secondsLeft === 0 ? 'Hết giờ' : `Hoàn thành ${activeDrill.name}`}</strong><small>{secondsLeft === 0 ? 'Bài luyện đã tự động kết thúc.' : 'Kết quả đã sẵn sàng ở bảng bên phải.'}</small></div>
                      </div>
                    ) : activeDrillId === 2 ? (
                      <div className="key-drill-content">
                        <p className={`key-drill-instruction ${startedAt !== null ? 'is-hidden' : ''}`} aria-hidden={startedAt !== null}><span aria-hidden="true">▶</span>Gõ các chuỗi phím theo phím đang được làm nổi bật.</p>
                        <KeySequence groups={activeLesson.keyDrillGroups} position={position} status={status} />
                        <p className={`key-drill-instruction ${startedAt !== null ? 'is-hidden' : ''}`} aria-hidden={startedAt !== null}><span aria-hidden="true">▶</span>Nhìn bàn phím và bàn tay trên màn hình để xem gợi ý khi cần.</p>
                      </div>
                    ) : activeDrillId === 3 ? (
                      <WordSequence lines={activeLesson.wordLines} position={position} status={status} />
                    ) : activeDrillId === 4 ? (
                      <SentenceSequence lines={activeLesson.sentenceLines} position={position} status={status} />
                    ) : activeDrillId === 5 ? (
                      <ParagraphPractice lines={activeLesson.paragraphLines} position={position} typedText={typedText} />
                    ) : (
                      <div className={`typing-line ${activeDrill.content.length > 60 ? 'compact' : ''}`} aria-label={`Nội dung cần gõ: ${activeDrill.content}`}>
                        {activeDrill.content.split('').map((character, index) => <span className={`${character === ' ' ? 'space-char' : ''} ${index < position ? 'typed' : index === position ? 'current-char' : ''}`} key={`${character}-${index}`}>{character === ' ' ? '\u00a0' : character}</span>)}
                      </div>
                    )}
                  </section>
                  {showGuides && (
                    <section className="guide-card" aria-label="Bàn phím và vị trí bàn tay">
                      <Keyboard pressedKey={pressedKey} status={status} targetKey={targetKey} />
                      <Hands activeFinger={activeFinger} />
                    </section>
                  )}
                </div>
              )}
            </section>
          )}

          {screen === 'settings' && (
            <section className="simple-page" aria-labelledby="settings-title">
              <p className="eyebrow">Preferences</p><h1 id="settings-title">Settings</h1><p className="page-lead">Các thiết lập ngắn gọn cho trải nghiệm luyện gõ.</p>
              <div className="settings-card">
                <div><strong>Keyboard layout</strong><span>US QWERTY</span></div>
                <label className="toggle-row"><span><strong>Keyboard & hands</strong><small>Hiện hướng dẫn trực quan trong bài luyện</small></span><input checked={showGuides} onChange={(event) => setShowGuides(event.target.checked)} type="checkbox" /></label>
                <div><strong>Course language</strong><span>English</span></div>
              </div>
              <button className="primary-button" type="button" onClick={openLesson}>Quay lại lesson</button>
            </section>
          )}

          {screen === 'about' && (
            <section className="simple-page" aria-labelledby="about-title">
              <p className="eyebrow">About this project</p><h1 id="about-title">Typing Speed VN</h1><p className="page-lead">Ứng dụng luyện gõ bàn phím theo từng bước, tập trung vào độ chính xác, phản xạ ngón tay và tốc độ.</p>
              <div className="about-card"><span className="about-mark" aria-hidden="true">TS</span><div><strong>Typing Speed VN</strong><small>Version 0.1.0 · English course</small></div></div>
              <button className="primary-button" type="button" onClick={openLesson}>Mở khóa học</button>
            </section>
          )}
        </main>

        <aside className={`program-nav ${screen === 'drill' ? 'drill-mode' : ''}`} aria-label="Menu chương trình">
          <div className="rail-heading"><span className="rail-logo" aria-hidden="true">T</span><span><strong>Typing Speed</strong><small>VN</small></span></div>
          {screen === 'drill' ? (
            <>
              {isTypingDrill && (
                <section className={`drill-timer ${startedAt !== null && !isComplete ? 'running' : ''}`} aria-label="Đồng hồ bài luyện">
                  <div><strong>Time</strong><button disabled={startedAt === null || isComplete} type="button" onClick={togglePause}>{isPaused ? 'Resume' : 'Pause'}</button></div>
                  <time dateTime={`PT${secondsLeft}S`}>{formatTime(secondsLeft)}</time>
                </section>
              )}
              {isTypingDrill && isComplete && (
                <section className="drill-results" aria-label="Kết quả bài luyện">
                  <h2>Result</h2>
                  <dl>
                    <div><dt>Time Used</dt><dd>{formatTime(timeUsed)}</dd></div>
                    <div><dt>Gross Speed</dt><dd>{grossSpeed} WPM</dd></div>
                    <div><dt>Accuracy</dt><dd>{accuracy}%</dd></div>
                    <div><dt>Net Speed</dt><dd>{netSpeed} WPM</dd></div>
                  </dl>
                </section>
              )}
              <nav className="drill-nav" aria-label="Điều khiển bài luyện">
                <button aria-keyshortcuts={isComplete ? 'Enter' : undefined} className="next-button" disabled={isTypingDrill && !isComplete} type="button" onClick={goToNextDrill}>Next{isComplete && <kbd>Enter</kbd>}</button>
                <button aria-keyshortcuts={isComplete ? 'Escape' : undefined} className="cancel-button" type="button" onClick={cancelDrill}>Cancel{isComplete && <kbd>Esc</kbd>}</button>
              </nav>
            </>
          ) : (
            <nav>
              <button className={screen === 'lesson' || screen === 'basics' ? 'active' : ''} type="button" onClick={openLesson}><span aria-hidden="true">←</span>Studying</button>
              <button className={screen === 'settings' ? 'active' : ''} type="button" onClick={() => setScreen('settings')}><span aria-hidden="true">⚙</span>Settings</button>
              <button className={screen === 'about' ? 'active' : ''} type="button" onClick={() => setScreen('about')}><span aria-hidden="true">i</span>About</button>
            </nav>
          )}
        </aside>
      </div>
    </div>
  )
}
