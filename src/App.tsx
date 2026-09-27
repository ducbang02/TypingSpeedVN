import { useCallback, useEffect, useRef, useState } from 'react'

type FingerId =
  | 'left-pinky'
  | 'left-ring'
  | 'left-middle'
  | 'left-index'
  | 'left-thumb'
  | 'right-thumb'
  | 'right-index'
  | 'right-middle'
  | 'right-ring'
  | 'right-pinky'

type DrillStatus = 'ready' | 'correct' | 'incorrect' | 'complete'

type ModelContext = {
  registerTool: (
    tool: {
      name: string
      title: string
      description: string
      inputSchema: object
      annotations: { readOnlyHint: boolean; untrustedContentHint: boolean }
      execute: () => object
    },
    options?: { signal?: AbortSignal },
  ) => void | Promise<void>
}

declare global {
  interface Document {
    modelContext?: ModelContext
  }
}

const DRILL_TEXT = 'asdf jkl; asdf jkl;'

const drills = ['New Keys', 'Key Drill', 'Word Drill', 'Sentence Drill', 'Paragraph Drill', 'Speed Test']

const lessons = [
  { number: '01', title: 'Home Row', note: 'Đang học' },
  { number: '02', title: 'Keys E & I', note: 'Tiếp theo' },
  { number: '03', title: 'Keys R & U', note: 'Sắp tới' },
]

const fingerLabels: Record<FingerId, string> = {
  'left-pinky': 'Ngón út trái',
  'left-ring': 'Ngón áp út trái',
  'left-middle': 'Ngón giữa trái',
  'left-index': 'Ngón trỏ trái',
  'left-thumb': 'Ngón cái trái',
  'right-thumb': 'Ngón cái phải',
  'right-index': 'Ngón trỏ phải',
  'right-middle': 'Ngón giữa phải',
  'right-ring': 'Ngón áp út phải',
  'right-pinky': 'Ngón út phải',
}

const fingerMap: Record<string, FingerId> = {
  '`': 'left-pinky', '1': 'left-pinky', q: 'left-pinky', a: 'left-pinky', z: 'left-pinky',
  '2': 'left-ring', w: 'left-ring', s: 'left-ring', x: 'left-ring',
  '3': 'left-middle', e: 'left-middle', d: 'left-middle', c: 'left-middle',
  '4': 'left-index', '5': 'left-index', r: 'left-index', t: 'left-index', f: 'left-index', g: 'left-index', v: 'left-index', b: 'left-index',
  '6': 'right-index', '7': 'right-index', y: 'right-index', u: 'right-index', h: 'right-index', j: 'right-index', n: 'right-index', m: 'right-index',
  '8': 'right-middle', i: 'right-middle', k: 'right-middle', ',': 'right-middle',
  '9': 'right-ring', o: 'right-ring', l: 'right-ring', '.': 'right-ring',
  '0': 'right-pinky', '-': 'right-pinky', '=': 'right-pinky', p: 'right-pinky', '[': 'right-pinky', ']': 'right-pinky', '\\': 'right-pinky', ';': 'right-pinky', "'": 'right-pinky', '/': 'right-pinky',
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

function Keyboard({ targetKey, pressedKey, status }: { targetKey: string; pressedKey: string | null; status: DrillStatus }) {
  return (
    <div className="keyboard-scroll">
      <div className="keyboard" aria-label="Bàn phím ảo">
        {keyboardRows.map((row, rowIndex) => (
          <div className={`key-row row-${rowIndex}`} key={`${rowIndex}-${row.join('')}`}>
            {row.map((value, keyIndex) => {
              const actualKey = value === 'Space' ? ' ' : value.toLowerCase()
              const finger = fingerMap[actualKey]
              const isTarget = actualKey === targetKey
              const isPressed = actualKey === pressedKey
              const wideClass = value === 'Space' ? 'space' : value.length > 1 ? `wide wide-${value.toLowerCase()}` : ''
              return (
                <span
                  className={`key ${wideClass} ${finger ? `finger-${finger}` : ''} ${isTarget ? 'target' : ''} ${isPressed ? `pressed ${status}` : ''}`}
                  data-finger={finger}
                  key={`${value}-${keyIndex}`}
                >
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

function Hands({ activeFinger }: { activeFinger: FingerId | null }) {
  const renderHand = (side: 'left' | 'right') => {
    const fingers: FingerId[] = side === 'left'
      ? ['left-pinky', 'left-ring', 'left-middle', 'left-index', 'left-thumb']
      : ['right-thumb', 'right-index', 'right-middle', 'right-ring', 'right-pinky']

    return (
      <div className={`hand hand-${side}`} aria-label={`Bàn tay ${side === 'left' ? 'trái' : 'phải'}`}>
        <div className="finger-set">
          {fingers.map((finger, index) => (
            <span
              aria-label={fingerLabels[finger]}
              className={`finger finger-${finger} finger-${index + 1} ${activeFinger === finger ? 'active' : ''}`}
              key={finger}
              role="img"
            />
          ))}
        </div>
        <div className="palm"><span>{side === 'left' ? 'L' : 'R'}</span></div>
      </div>
    )
  }

  return <div className="hands">{renderHand('left')}{renderHand('right')}</div>
}

export default function App() {
  const [position, setPosition] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [status, setStatus] = useState<DrillStatus>('ready')
  const [pressedKey, setPressedKey] = useState<string | null>(null)
  const practiceRef = useRef<HTMLElement>(null)

  const isComplete = position === DRILL_TEXT.length
  const targetKey = isComplete ? '' : DRILL_TEXT[position]
  const activeFinger = isComplete ? null : fingerMap[targetKey] ?? 'right-thumb'

  const restart = useCallback(() => {
    setPosition(0)
    setMistakes(0)
    setStatus('ready')
    setPressedKey(null)
    requestAnimationFrame(() => practiceRef.current?.focus())
  }, [])

  useEffect(() => {
    practiceRef.current?.focus()
  }, [])

  useEffect(() => {
    const context = document.modelContext
    if (!context?.registerTool) return

    const lifecycle = new AbortController()
    void Promise.resolve(context.registerTool({
      name: 'restart_typing_drill',
      title: 'Restart typing drill',
      description: 'Reset the current typing drill, mistakes, and progress to the beginning.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: () => {
        restart()
        return { status: 'restarted', position: 0, mistakes: 0 }
      },
    }, { signal: lifecycle.signal })).catch(() => undefined)

    return () => lifecycle.abort()
  }, [restart])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.ctrlKey || event.altKey || event.metaKey || isComplete) return

    const key = normalizeKey(event.key)
    if (key === 'Backspace') {
      event.preventDefault()
      setPosition((current) => Math.max(0, current - 1))
      setStatus('ready')
      setPressedKey(null)
      return
    }

    if (key.length !== 1) return

    event.preventDefault()
    setPressedKey(key)
    if (key === targetKey) {
      const nextPosition = position + 1
      setPosition(nextPosition)
      setStatus(nextPosition === DRILL_TEXT.length ? 'complete' : 'correct')
    } else {
      setMistakes((current) => current + 1)
      setStatus('incorrect')
    }
  }

  const statusMessage = status === 'incorrect'
    ? `Chưa đúng — hãy nhấn ${keyLabel(targetKey)}`
    : status === 'complete'
      ? 'Hoàn thành bài luyện!'
      : status === 'correct'
        ? 'Chính xác'
        : 'Sẵn sàng luyện tập'

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Typing Speed VN — trang chính">
          <span className="brand-mark" aria-hidden="true">TS</span>
          <span>Typing Speed <strong>VN</strong></span>
        </a>
        <span className="course-label">English · Beginner</span>
      </header>

      <div className="workspace" id="top">
        <aside className="lesson-panel" aria-label="Nội dung khóa học">
          <p className="eyebrow">Fast Touch Typing</p>
          <h1>English course</h1>
          <p className="lesson-copy">Học từng nhóm phím, luyện thành từ rồi tăng tốc dần.</p>

          <nav className="lesson-list" aria-label="Danh sách lesson mẫu">
            {lessons.map((lesson, index) => (
              <div className={`lesson-item ${index === 0 ? 'selected' : ''}`} aria-current={index === 0 ? 'step' : undefined} key={lesson.number}>
                <span>{lesson.number}</span>
                <strong>{lesson.title}</strong>
                <small>{lesson.note}</small>
              </div>
            ))}
          </nav>

          <div className="lesson-title">
            <span>Lesson 01</span>
            <strong>Home Row Foundations</strong>
          </div>
          <ol className="drill-list">
            {drills.map((drill, index) => (
              <li className={index === 1 ? 'active' : index === 0 ? 'done' : ''} key={drill}>
                <span>{index === 0 ? '✓' : index + 1}</span>
                <span>{drill}</span>
                <small>{index === 0 ? 'Done' : index === 1 ? 'Now' : 'Later'}</small>
              </li>
            ))}
          </ol>
        </aside>

        <main className="practice-panel">
          <div className="practice-heading">
            <div>
              <p className="eyebrow">Key Drill · 2 of 6</p>
              <h2>Keep your fingers on the home row</h2>
            </div>
            <div className="progress-pill" aria-label={`${position} trên ${DRILL_TEXT.length} ký tự`}>
              <strong>{position}</strong> / {DRILL_TEXT.length}
            </div>
          </div>

          <section
            aria-describedby="typing-instructions"
            aria-label="Bài luyện gõ mẫu"
            className={`typing-card status-${status}`}
            onClick={() => practiceRef.current?.focus()}
            onKeyDown={handleKeyDown}
            onKeyUp={() => setPressedKey(null)}
            ref={practiceRef}
            tabIndex={0}
          >
            <div className="typing-meta">
              <p className="hint" id="typing-instructions">Gõ theo nội dung bên dưới · Backspace để quay lại</p>
              <span className={`feedback ${status}`} role="status" aria-live="polite">{statusMessage}</span>
            </div>

            {isComplete ? (
              <div className="completion">
                <div>
                  <span className="completion-icon" aria-hidden="true">✓</span>
                  <strong>Great work!</strong>
                  <small>Bạn đã hoàn thành Key Drill với {mistakes} lỗi.</small>
                </div>
                <button type="button" onClick={restart}>Luyện lại</button>
              </div>
            ) : (
              <div className="typing-line" aria-label={`Nội dung cần gõ: ${DRILL_TEXT}`}>
                {DRILL_TEXT.split('').map((character, index) => (
                  <span className={index < position ? 'typed' : index === position ? 'current-char' : ''} key={`${character}-${index}`}>
                    {character}
                  </span>
                ))}
              </div>
            )}
          </section>

          <section className="guide-card" aria-label="Hướng dẫn bàn phím và ngón tay">
            <div className="instruction-rail">
              <div className="next-key">
                <span>Phím tiếp theo</span>
                <strong className={activeFinger ? `finger-${activeFinger}` : ''}>{isComplete ? '✓' : keyLabel(targetKey)}</strong>
                <small>{isComplete ? 'Bài đã xong' : fingerLabels[activeFinger!]}</small>
              </div>
              <Hands activeFinger={activeFinger} />
            </div>
            <Keyboard pressedKey={pressedKey} status={status} targetKey={targetKey} />
          </section>

          <div className="practice-footer">
            <span>{mistakes} lỗi</span>
            <button type="button" onClick={restart}>Bắt đầu lại</button>
          </div>
        </main>
      </div>
    </div>
  )
}
