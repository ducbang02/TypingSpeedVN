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
type DrillId = 2 | 3 | 4 | 5 | 6

type Drill = {
  id: DrillId
  name: string
  title: string
  hint: string
  content: string
  timeLimit?: number
}

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

const drills: Drill[] = [
  {
    id: 2,
    name: 'Key Drill',
    title: 'Keep your fingers on the home row',
    hint: 'Lặp lại từng phím để ghi nhớ vị trí',
    content: 'asdf jkl; asdf jkl;',
  },
  {
    id: 3,
    name: 'Word Drill',
    title: 'Build words with home-row keys',
    hint: 'Gõ từng từ, giữ tay ở hàng cơ sở',
    content: 'sad dad all fall ask flask salad lass; sad dad fall ask;',
  },
  {
    id: 4,
    name: 'Sentence Drill',
    title: 'Connect words into short sentences',
    hint: 'Giữ nhịp đều khi chuyển giữa các từ',
    content: 'a lad asks a dad; a sad lass falls; a dad asks a lad;',
  },
  {
    id: 5,
    name: 'Paragraph Drill',
    title: 'Type a full home-row paragraph',
    hint: 'Ưu tiên độ chính xác trước tốc độ',
    content: 'a lad asks a dad; a sad lass falls; a dad adds salad; a flask falls; a lass asks a lad; all dads add salad;',
  },
  {
    id: 6,
    name: 'Speed Test',
    title: 'Thirty-second home-row test',
    hint: 'Đồng hồ bắt đầu khi bạn gõ ký tự đầu tiên',
    content: 'asdf jkl; sad dad fall ask; flask salad lass all; a lad asks a dad; a sad lass falls; asdf jkl; dad adds salad; a flask falls;',
    timeLimit: 30,
  },
]

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
  const [activeDrillId, setActiveDrillId] = useState<DrillId>(2)
  const [completedDrills, setCompletedDrills] = useState<Set<number>>(() => new Set([1]))
  const [position, setPosition] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [status, setStatus] = useState<DrillStatus>('ready')
  const [pressedKey, setPressedKey] = useState<string | null>(null)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(30)
  const practiceRef = useRef<HTMLElement>(null)

  const activeDrill = drills.find((drill) => drill.id === activeDrillId) ?? drills[0]
  const isComplete = status === 'complete'
  const targetKey = isComplete ? '' : activeDrill.content[position] ?? ''
  const activeFinger = isComplete ? null : fingerMap[targetKey] ?? 'right-thumb'
  const elapsedSeconds = activeDrill.timeLimit
    ? Math.max(1, activeDrill.timeLimit - secondsLeft)
    : 0
  const wpm = activeDrill.timeLimit
    ? Math.round((position / 5) / (elapsedSeconds / 60))
    : 0
  const accuracy = position + mistakes === 0
    ? 100
    : Math.round((position / (position + mistakes)) * 100)

  const resetProgress = useCallback((drill: Drill) => {
    setPosition(0)
    setMistakes(0)
    setStatus('ready')
    setPressedKey(null)
    setStartedAt(null)
    setSecondsLeft(drill.timeLimit ?? 30)
    requestAnimationFrame(() => practiceRef.current?.focus())
  }, [])

  const restart = useCallback(() => {
    resetProgress(activeDrill)
  }, [activeDrill, resetProgress])

  const selectDrill = useCallback((drillId: DrillId) => {
    const drill = drills.find((item) => item.id === drillId)
    if (!drill) return
    setActiveDrillId(drillId)
    resetProgress(drill)
  }, [resetProgress])

  const completeDrill = useCallback(() => {
    setStatus('complete')
    setPressedKey(null)
    setCompletedDrills((current) => {
      const next = new Set(current)
      next.add(activeDrillId)
      return next
    })
  }, [activeDrillId])

  useEffect(() => {
    practiceRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!activeDrill.timeLimit || startedAt === null || isComplete) return

    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000)
      const remaining = Math.max(activeDrill.timeLimit! - elapsed, 0)
      setSecondsLeft(remaining)
      if (remaining === 0) completeDrill()
    }

    updateTimer()
    const interval = window.setInterval(updateTimer, 250)
    return () => window.clearInterval(interval)
  }, [activeDrill.timeLimit, completeDrill, isComplete, startedAt])

  useEffect(() => {
    const context = document.modelContext
    if (!context?.registerTool) return

    const lifecycle = new AbortController()
    void Promise.resolve(context.registerTool({
      name: 'restart_typing_drill',
      title: 'Restart typing drill',
      description: 'Reset the active typing drill, mistakes, timer, and progress.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: () => {
        restart()
        return { status: 'restarted', drillId: activeDrillId, position: 0, mistakes: 0 }
      },
    }, { signal: lifecycle.signal })).catch(() => undefined)

    return () => lifecycle.abort()
  }, [activeDrillId, restart])

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
    if (activeDrill.timeLimit && startedAt === null) setStartedAt(Date.now())

    if (key === targetKey) {
      const nextPosition = position + 1
      setPosition(nextPosition)
      if (nextPosition === activeDrill.content.length) completeDrill()
      else setStatus('correct')
    } else {
      setMistakes((current) => current + 1)
      setStatus('incorrect')
    }
  }

  const goToNextDrill = () => {
    const nextDrill = drills.find((drill) => drill.id === activeDrillId + 1)
    if (nextDrill) selectDrill(nextDrill.id)
  }

  const statusMessage = status === 'incorrect'
    ? `Chưa đúng — hãy nhấn ${keyLabel(targetKey)}`
    : status === 'complete'
      ? activeDrill.timeLimit && secondsLeft === 0 ? 'Hết giờ!' : 'Hoàn thành bài luyện!'
      : status === 'correct'
        ? 'Chính xác'
        : activeDrill.timeLimit && startedAt === null ? 'Gõ để bắt đầu' : 'Sẵn sàng luyện tập'

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
            <li className="done">
              <span>✓</span>
              <span>New Keys</span>
              <small>Done</small>
            </li>
            {drills.map((drill) => {
              const isActive = drill.id === activeDrillId
              const isDone = completedDrills.has(drill.id)
              return (
                <li className={isActive ? 'active' : isDone ? 'done' : ''} key={drill.id}>
                  <button
                    aria-current={isActive ? 'step' : undefined}
                    className="drill-button"
                    onClick={() => selectDrill(drill.id)}
                    type="button"
                  >
                    <span>{isDone ? '✓' : drill.id}</span>
                    <span>{drill.name}</span>
                    <small>{isActive ? 'Now' : isDone ? 'Done' : 'Ready'}</small>
                  </button>
                </li>
              )
            })}
          </ol>
        </aside>

        <main className="practice-panel">
          <div className="practice-heading">
            <div>
              <p className="eyebrow">{activeDrill.name} · {activeDrill.id} of 6</p>
              <h2>{activeDrill.title}</h2>
            </div>
            <div className="metric-group">
              {activeDrill.timeLimit && (
                <div className={`timer-pill ${startedAt !== null && !isComplete ? 'running' : ''}`} aria-label={`${secondsLeft} giây còn lại`}>
                  <span>Time</span>
                  <strong>{secondsLeft}s</strong>
                </div>
              )}
              <div className="progress-pill" aria-label={`${position} trên ${activeDrill.content.length} ký tự`}>
                <strong>{position}</strong> / {activeDrill.content.length}
              </div>
            </div>
          </div>

          <section
            aria-describedby="typing-instructions"
            aria-label={`${activeDrill.name}: ${activeDrill.title}`}
            className={`typing-card status-${status} ${activeDrill.content.length > 60 ? 'long-content' : ''}`}
            onClick={() => practiceRef.current?.focus()}
            onKeyDown={handleKeyDown}
            onKeyUp={() => setPressedKey(null)}
            ref={practiceRef}
            tabIndex={0}
          >
            <div className="typing-meta">
              <p className="hint" id="typing-instructions">{activeDrill.hint} · Backspace để quay lại</p>
              <span className={`feedback ${status}`} role="status" aria-live="polite">{statusMessage}</span>
            </div>

            {isComplete ? (
              <div className="completion">
                <div className="completion-copy">
                  <span className="completion-icon" aria-hidden="true">✓</span>
                  <strong>{activeDrill.timeLimit ? 'Speed test complete!' : 'Great work!'}</strong>
                  {activeDrill.timeLimit ? (
                    <span className="result-metrics">
                      <span><strong>{wpm}</strong> WPM</span>
                      <span><strong>{accuracy}%</strong> chính xác</span>
                      <span><strong>{mistakes}</strong> lỗi</span>
                    </span>
                  ) : (
                    <small>Bạn đã hoàn thành {activeDrill.name} với {mistakes} lỗi.</small>
                  )}
                </div>
                <div className="completion-actions">
                  <button className="secondary-button" type="button" onClick={restart}>Luyện lại</button>
                  {activeDrillId < 6 && <button type="button" onClick={goToNextDrill}>Bài tiếp theo</button>}
                </div>
              </div>
            ) : (
              <div className={`typing-line ${activeDrill.content.length > 60 ? 'compact' : ''}`} aria-label={`Nội dung cần gõ: ${activeDrill.content}`}>
                {activeDrill.content.split('').map((character, index) => (
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
            <span>{mistakes} lỗi · {accuracy}% chính xác</span>
            <button type="button" onClick={restart}>Bắt đầu lại</button>
          </div>
        </main>
      </div>
    </div>
  )
}
