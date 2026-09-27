import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'

type FingerId = 'left-pinky' | 'left-ring' | 'left-middle' | 'left-index' | 'left-thumb' | 'right-thumb' | 'right-index' | 'right-middle' | 'right-ring' | 'right-pinky'
type DrillStatus = 'ready' | 'correct' | 'incorrect' | 'complete'
type DrillId = 1 | 2 | 3 | 4 | 5 | 6
type Screen = 'lesson' | 'drill' | 'settings' | 'about'
type Drill = { id: DrillId; name: string; title: string; hint: string; content: string; duration: string }

const DRILL_TIME_LIMIT = 5 * 60

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

const drills: Drill[] = [
  { id: 1, name: 'New Keys', title: 'Meet the home-row keys', hint: 'Đặt các ngón tay lên A S D F và J K L ;', content: '', duration: '2–3 min.' },
  { id: 2, name: 'Key Drill', title: 'Keep your fingers on the home row', hint: 'Lặp lại từng phím để ghi nhớ vị trí', content: 'asdf jkl; asdf jkl;', duration: '3–5 min.' },
  { id: 3, name: 'Word Drill', title: 'Build words with home-row keys', hint: 'Gõ từng từ, giữ tay ở hàng cơ sở', content: 'sad dad all fall ask flask salad lass; sad dad fall ask;', duration: '3–5 min.' },
  { id: 4, name: 'Sentence Drill', title: 'Connect words into short sentences', hint: 'Giữ nhịp đều khi chuyển giữa các từ', content: 'a lad asks a dad; a sad lass falls; a dad asks a lad;', duration: '3–5 min.' },
  { id: 5, name: 'Paragraph Drill', title: 'Type a full home-row paragraph', hint: 'Ưu tiên độ chính xác trước tốc độ', content: 'a lad asks a dad; a sad lass falls; a dad adds salad; a flask falls; a lass asks a lad; all dads add salad;', duration: '4–6 min.' },
  { id: 6, name: 'Speed Test', title: 'Five-minute home-row test', hint: 'Đồng hồ bắt đầu khi bạn gõ ký tự đầu tiên', content: 'asdf jkl; sad dad fall ask; flask salad lass all; a lad asks a dad; a sad lass falls; asdf jkl; dad adds salad; a flask falls;', duration: '5 min.' },
]

const homeRowKeys: Array<{ key: string; finger: FingerId; label: string }> = [
  { key: 'A', finger: 'left-pinky', label: 'Út trái' },
  { key: 'S', finger: 'left-ring', label: 'Áp út trái' },
  { key: 'D', finger: 'left-middle', label: 'Giữa trái' },
  { key: 'F', finger: 'left-index', label: 'Trỏ trái' },
  { key: 'J', finger: 'right-index', label: 'Trỏ phải' },
  { key: 'K', finger: 'right-middle', label: 'Giữa phải' },
  { key: 'L', finger: 'right-ring', label: 'Áp út phải' },
  { key: ';', finger: 'right-pinky', label: 'Út phải' },
]

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

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
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
                <span className={`key ${wideClass} ${finger ? `finger-${finger}` : ''} ${isTarget ? 'target' : ''} ${isPressed ? `pressed ${status}` : ''}`} data-finger={finger} key={`${value}-${keyIndex}`}>
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
            <span aria-label={fingerLabels[finger]} className={`finger finger-${finger} finger-${index + 1} ${activeFinger === finger ? 'active' : ''}`} key={finger} role="img" />
          ))}
        </div>
        <div className="palm" />
      </div>
    )
  }
  return <div className="hands">{renderHand('left')}{renderHand('right')}</div>
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('lesson')
  const [activeDrillId, setActiveDrillId] = useState<DrillId>(1)
  const [completedDrills, setCompletedDrills] = useState<Set<number>>(() => new Set())
  const [position, setPosition] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [status, setStatus] = useState<DrillStatus>('ready')
  const [pressedKey, setPressedKey] = useState<string | null>(null)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [finishedAt, setFinishedAt] = useState<number | null>(null)
  const [keystrokes, setKeystrokes] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(DRILL_TIME_LIMIT)
  const [isPaused, setIsPaused] = useState(false)
  const [pausedAt, setPausedAt] = useState<number | null>(null)
  const [showGuides, setShowGuides] = useState(true)
  const practiceRef = useRef<HTMLElement>(null)

  const activeDrill = drills.find((drill) => drill.id === activeDrillId) ?? drills[0]
  const isTypingDrill = activeDrill.id !== 1
  const isComplete = status === 'complete'
  const targetKey = isTypingDrill && !isComplete ? activeDrill.content[position] ?? '' : ''
  const activeFinger = isTypingDrill && !isComplete ? fingerMap[targetKey] ?? 'right-thumb' : null
  const timeUsed = startedAt === null || finishedAt === null ? 0 : Math.max(1, Math.round((finishedAt - startedAt) / 1000))
  const minutesUsed = Math.max(timeUsed / 60, 1 / 60)
  const grossSpeed = Math.round((keystrokes / 5) / minutesUsed)
  const accuracy = keystrokes === 0 ? 100 : Math.max(0, Math.round(((keystrokes - mistakes) / keystrokes) * 100))
  const netSpeed = Math.max(0, Math.round(grossSpeed - mistakes / minutesUsed))

  const resetProgress = useCallback(() => {
    setPosition(0); setMistakes(0); setKeystrokes(0); setStatus('ready'); setPressedKey(null); setStartedAt(null); setFinishedAt(null); setSecondsLeft(DRILL_TIME_LIMIT); setIsPaused(false); setPausedAt(null)
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
  }, [resetProgress])

  const completeDrill = useCallback(() => {
    setStatus('complete'); setPressedKey(null); setFinishedAt((current) => current ?? Date.now()); setIsPaused(false); setPausedAt(null); setCompletedDrills((current) => new Set(current).add(activeDrillId))
  }, [activeDrillId])

  const startKeyDrill = () => {
    setCompletedDrills((current) => new Set(current).add(1))
    selectDrill(2)
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
      execute: () => { restart(); return { status: 'restarted', drillId: activeDrillId, position: 0, mistakes: 0 } },
    }, { signal: lifecycle.signal })).catch(() => undefined)
    return () => lifecycle.abort()
  }, [activeDrillId, restart])

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.ctrlKey || event.altKey || event.metaKey || isComplete || isPaused) return
    const key = normalizeKey(event.key)
    if (key === 'Backspace') {
      event.preventDefault(); setPosition((current) => Math.max(0, current - 1)); setStatus('ready'); setPressedKey(null); return
    }
    if (key.length !== 1) return
    event.preventDefault(); setPressedKey(key)
    if (startedAt === null) setStartedAt(Date.now())
    setKeystrokes((current) => current + 1)
    if (key === targetKey) {
      const nextPosition = position + 1
      setPosition(nextPosition)
      if (nextPosition === activeDrill.content.length) completeDrill()
      else setStatus('correct')
    } else {
      setMistakes((current) => current + 1); setStatus('incorrect')
    }
  }

  const goToNextDrill = () => {
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
                <span className="course-progress">{completedDrills.size}/6 complete</span>
              </div>
              <nav className="lesson-tabs" aria-label="Danh sách lesson">
                {Array.from({ length: 12 }, (_, index) => index + 1).map((lessonNumber) => (
                  <button aria-current={lessonNumber === 1 ? 'page' : undefined} disabled={lessonNumber !== 1} key={lessonNumber} title={lessonNumber === 1 ? 'Lesson 1' : 'Sắp ra mắt'} type="button">{lessonNumber}</button>
                ))}
              </nav>
              <div className="lesson-summary">
                <p className="lesson-number">Lesson 1</p>
                <h2>The Home Row: A S D F · J K L ;</h2>
                <p>Học vị trí hàng phím cơ sở, sau đó tiến dần từ phím đơn đến đoạn văn và bài kiểm tra tốc độ.</p>
              </div>
              <ol className="exercise-list">
                {drills.map((drill) => {
                  const isDone = completedDrills.has(drill.id)
                  const firstReady = drills.find((item) => !completedDrills.has(item.id))?.id ?? 6
                  return (
                    <li className={drill.id === firstReady ? 'recommended' : ''} key={drill.id}>
                      <button type="button" onClick={() => selectDrill(drill.id)}>
                        <span className={`exercise-status ${isDone ? 'done' : ''}`} aria-hidden="true">{isDone ? '✓' : ''}</span>
                        <strong>{drill.id}. {drill.name}</strong>
                        <span>{drill.id === 1 ? 'A S D F · J K L ;' : drill.title}</span>
                        <small>{drill.duration}</small>
                      </button>
                    </li>
                  )
                })}
              </ol>
              <div className="lesson-note"><span aria-hidden="true">i</span><p><strong>Gợi ý:</strong> hoàn thành theo thứ tự để ngón tay quen vị trí trước khi tăng tốc.</p></div>
            </section>
          )}

          {screen === 'drill' && (
            <section className="drill-screen" aria-labelledby="drill-title">
              <div className="typing-title-row">
                <h1 id="drill-title">Lesson 1: {activeDrill.name}</h1>
              </div>

              {activeDrill.id === 1 ? (
                <div className="new-keys-layout">
                  <div className="intro-copy"><p>Đặt các ngón tay lên <strong>A S D F</strong> và <strong>J K L ;</strong>. Hai phím <strong>F</strong> và <strong>J</strong> có gờ nhỏ để tìm lại vị trí mà không cần nhìn xuống.</p></div>
                  <div className="home-row-grid" aria-label="Các phím mới và ngón tay tương ứng">
                    {homeRowKeys.map((item) => <div className={`home-key finger-${item.finger}`} key={item.key}><strong>{item.key}</strong><span>{item.label}</span></div>)}
                  </div>
                  {showGuides && <div className="intro-guide"><Keyboard pressedKey={null} status="ready" targetKey="" /><Hands activeFinger={null} /></div>}
                  <div className="intro-actions"><button className="primary-button" type="button" onClick={startKeyDrill}>Bắt đầu Key Drill →</button></div>
                </div>
              ) : (
                <div className="typing-workspace">
                  <section aria-label={`${activeDrill.name}: ${activeDrill.title}`} className={`typing-card status-${status} ${activeDrill.content.length > 60 ? 'long-content' : ''}`} onClick={() => practiceRef.current?.focus()} onKeyDown={handleKeyDown} onKeyUp={() => setPressedKey(null)} ref={practiceRef} tabIndex={0}>
                    {isComplete ? (
                      <div className="completion" role="status" aria-live="polite">
                        <div className="completion-copy"><span className="completion-icon" aria-hidden="true">✓</span><strong>{secondsLeft === 0 ? 'Hết giờ' : `Hoàn thành ${activeDrill.name}`}</strong><small>{secondsLeft === 0 ? 'Bài luyện đã tự động kết thúc.' : 'Kết quả đã sẵn sàng ở bảng bên phải.'}</small></div>
                      </div>
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
              <button className="primary-button" type="button" onClick={openLesson}>Mở Lesson 1</button>
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
                <button className="next-button" disabled={!isComplete} type="button" onClick={goToNextDrill}>Next</button>
                <button className="cancel-button" type="button" onClick={cancelDrill}>Cancel</button>
              </nav>
            </>
          ) : (
            <nav>
              <button className={screen === 'settings' ? 'active' : ''} type="button" onClick={() => setScreen('settings')}><span aria-hidden="true">⚙</span>Settings</button>
              <button className={screen === 'about' ? 'active' : ''} type="button" onClick={() => setScreen('about')}><span aria-hidden="true">i</span>About</button>
            </nav>
          )}
        </aside>
      </div>
    </div>
  )
}
