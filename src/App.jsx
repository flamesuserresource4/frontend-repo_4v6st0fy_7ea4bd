import { useEffect, useState } from 'react'

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function ModuleCard({ module, onOpen }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 hover:border-blue-500/40 transition-colors">
      <h3 className="text-white font-semibold text-lg">{module.title}</h3>
      <p className="text-slate-300/80 text-sm line-clamp-2 mt-1">{module.content}</p>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-blue-300/70 uppercase tracking-wider">{module.game_type}</span>
        <button onClick={() => onOpen(module)} className="px-3 py-1.5 text-sm rounded-md bg-blue-600 hover:bg-blue-500 text-white">Open</button>
      </div>
    </div>
  )
}

function GameViewer({ module, game, onClose, onSubmitScore }) {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [score, setScore] = useState(0)

  if (!game) return null

  const cards = game.cards || []
  const questions = game.questions || []

  const next = () => {
    setIndex((i) => Math.min(i + 1, (module.game_type === 'cards' ? cards.length - 1 : questions.length - 1)))
    setSelected(null)
  }

  const submit = async () => {
    await onSubmitScore(score)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-6 z-50">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">{module.title}</h2>
          <button onClick={onClose} className="text-slate-300 hover:text-white">Close</button>
        </div>

        {module.game_type === 'cards' ? (
          <div>
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <p className="text-blue-200/90">{cards[index]?.prompt}</p>
              <p className="mt-4 text-slate-300/90">{cards[index]?.answer}</p>
            </div>
            <div className="flex items-center justify-between mt-4">
              <span className="text-slate-400 text-sm">Card {index + 1} / {cards.length}</span>
              <div className="flex gap-2">
                <button onClick={() => setScore(score + 1)} className="px-3 py-1.5 text-sm rounded-md bg-emerald-600 hover:bg-emerald-500 text-white">I knew this</button>
                <button onClick={next} className="px-3 py-1.5 text-sm rounded-md bg-blue-600 hover:bg-blue-500 text-white">Next</button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <p className="text-blue-200/90 font-medium">{questions[index]?.question}</p>
              <div className="mt-4 space-y-2">
                {questions[index]?.options?.map((opt, i) => (
                  <button key={i} onClick={() => setSelected(i)} className={`w-full text-left px-3 py-2 rounded-md border ${selected === i ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 hover:border-slate-600'} text-slate-200`}>{opt}</button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between mt-4">
              <span className="text-slate-400 text-sm">Question {index + 1} / {questions.length}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (selected === questions[index]?.correct_index) setScore(score + 1)
                    next()
                  }}
                  className="px-3 py-1.5 text-sm rounded-md bg-blue-600 hover:bg-blue-500 text-white"
                >Submit</button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <span className="text-slate-300">Score: {score}</span>
          <button onClick={submit} className="px-3 py-1.5 text-sm rounded-md bg-purple-600 hover:bg-purple-500 text-white">Submit Score</button>
        </div>
      </div>
    </div>
  )
}

function App() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [gameType, setGameType] = useState('cards')
  const [loading, setLoading] = useState(false)
  const [modules, setModules] = useState([])
  const [active, setActive] = useState(null)
  const [activeGame, setActiveGame] = useState(null)
  const [playerName, setPlayerName] = useState('Player')
  const [leaderboard, setLeaderboard] = useState([])

  const fetchModules = async () => {
    const res = await fetch(`${BACKEND}/modules`)
    const data = await res.json()
    setModules(data)
  }

  useEffect(() => {
    fetchModules()
  }, [])

  const create = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`${BACKEND}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, game_type: gameType })
      })
      const data = await res.json()
      setTitle('')
      setContent('')
      await fetchModules()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const openModule = async (m) => {
    setActive(m)
    const res = await fetch(`${BACKEND}/games/${m.id}`)
    const game = await res.json()
    setActiveGame(game)

    const lb = await fetch(`${BACKEND}/leaderboard/${m.id}`)
    setLeaderboard(await lb.json())
  }

  const submitScore = async (score) => {
    if (!active) return
    await fetch(`${BACKEND}/scores/${active.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_name: playerName, score })
    })
    const lb = await fetch(`${BACKEND}/leaderboard/${active.id}`)
    setLeaderboard(await lb.json())
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05),transparent_50%)]"></div>

      <div className="relative min-h-screen p-6 max-w-6xl mx-auto">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Study Game Builder</h1>
            <p className="text-blue-200/80">Paste notes, generate a playable game, and climb the leaderboard.</p>
          </div>
          <div className="flex items-center gap-2">
            <input value={playerName} onChange={(e) => setPlayerName(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-slate-200" placeholder="Your name" />
          </div>
        </header>

        <section className="grid md:grid-cols-2 gap-6">
          <form onSubmit={create} className="bg-slate-800/50 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-6 shadow-xl">
            <div className="mb-4">
              <label className="block text-slate-200 text-sm mb-1">Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-slate-200" />
            </div>
            <div className="mb-4">
              <label className="block text-slate-200 text-sm mb-1">Game type</label>
              <select value={gameType} onChange={(e) => setGameType(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-slate-200">
                <option value="cards">Flash Cards</option>
                <option value="quiz">Quiz</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-slate-200 text-sm mb-1">Notes / Topic</label>
              <textarea value={content} onChange={(e) => setContent(e.target.value)} required rows="8" className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-slate-200" placeholder="Paste notes or a topic..." />
            </div>
            <button disabled={loading} className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50">{loading ? 'Generating...' : 'Generate Game'}</button>
          </form>

          <div className="space-y-4">
            <div className="bg-slate-800/50 border border-blue-500/20 rounded-2xl p-6">
              <h2 className="text-white font-semibold mb-3">Recent Modules</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {modules.length === 0 && (
                  <p className="text-slate-400">No modules yet. Create one to get started.</p>
                )}
                {modules.map((m) => (
                  <ModuleCard key={m.id} module={m} onOpen={openModule} />
                ))}
              </div>
            </div>

            <div className="bg-slate-800/50 border border-blue-500/20 rounded-2xl p-6">
              <h2 className="text-white font-semibold mb-3">Leaderboard{active ? ` · ${active.title}` : ''}</h2>
              {leaderboard.length === 0 ? (
                <p className="text-slate-400">No scores yet.</p>
              ) : (
                <ul className="divide-y divide-slate-700">
                  {leaderboard.map((s, i) => (
                    <li key={s.id} className="py-2 flex items-center justify-between">
                      <span className="text-slate-300">{i + 1}. {s.player_name}</span>
                      <span className="text-blue-300">{s.score}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        {active && (
          <GameViewer
            module={active}
            game={activeGame}
            onClose={() => { setActive(null); setActiveGame(null) }}
            onSubmitScore={submitScore}
          />
        )}
      </div>
    </div>
  )
}

export default App
