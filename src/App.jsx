import { useState, useEffect } from 'react'

const LOW_GAMES_THRESHOLD = 65

function App() {
  const [activeTab, setActiveTab] = useState('all-nba')
  const [selectedAward, setSelectedAward] = useState('mvp')
  const [allNbaData, setAllNbaData] = useState({})
  const [awardsData, setAwardsData] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)
      try {
        const [allNbaRes, awardsRes] = await Promise.all([
          fetch('/api/all-nba'),
          fetch('/api/awards')
        ])

        if (!allNbaRes.ok || !awardsRes.ok) {
          throw new Error('Failed to fetch data')
        }

        const allNba = await allNbaRes.json()
        const awards = await awardsRes.json()

        setAllNbaData(allNba)
        setAwardsData(awards)
      } catch (err) {
        setError(err.message)
        console.error('Error fetching data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const years = Object.keys(allNbaData).map(Number).sort((a, b) => b - a)

  const tabs = [
    { id: 'all-nba', label: 'All-NBA Teams' },
    { id: 'awards', label: 'Awards' },
  ]

  const awardCategories = [
    { id: 'mvp', label: 'MVP' },
    { id: 'dpoy', label: 'DPOY' },
    { id: 'roy', label: 'ROY' },
    { id: 'sixthMan', label: '6MOY' },
    { id: 'mip', label: 'MIP' },
    { id: 'finalsMvp', label: 'Finals MVP' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-xl text-gray-400">Loading NBA data from Basketball Reference...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-400 mb-4">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-orange-600 hover:bg-orange-700 px-6 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-600 to-orange-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-center">NBA History Dashboard</h1>
          <p className="text-center text-orange-200 mt-2">50 Years of Excellence (1975-2025)</p>
          <p className="text-center text-orange-300 text-sm mt-1">Data from Basketball-Reference.com</p>
        </div>
      </header>

      {/* Legend */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center gap-4 text-sm">
          <span className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-red-500"></span>
            <span className="text-gray-400">Played &lt;65 games</span>
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-orange-400 border-b-2 border-orange-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'all-nba' && (
          <div className="space-y-6">
            {years.length === 0 ? (
              <p className="text-gray-400 text-center">No All-NBA data available</p>
            ) : (
              years.map((year) => (
                <SeasonRow key={year} year={year} data={allNbaData[year]} />
              ))
            )}
          </div>
        )}

        {activeTab === 'awards' && (
          <div>
            {/* Award Category Selector */}
            <div className="mb-8 flex flex-wrap gap-2 sticky top-16 bg-gray-900 py-4 z-10">
              {awardCategories.map((award) => (
                <button
                  key={award.id}
                  onClick={() => setSelectedAward(award.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedAward === award.id
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {award.label}
                </button>
              ))}
            </div>

            {/* Award Display */}
            {awardsData[selectedAward] ? (
              <AwardTable award={awardsData[selectedAward]} />
            ) : (
              <p className="text-gray-400 text-center">No award data available</p>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-500">
          <p>NBA History Dashboard - Data from Basketball-Reference.com</p>
          <p className="text-sm mt-1">Data is cached and refreshed daily</p>
        </div>
      </footer>
    </div>
  )
}

function PlayerBadge({ player }) {
  const gp = player.gamesPlayed || 0
  const isLowGames = gp > 0 && gp < LOW_GAMES_THRESHOLD

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded ${isLowGames ? 'bg-red-900/50 ring-1 ring-red-500' : ''}`}>
      <span className={`font-medium ${isLowGames ? 'text-red-300' : 'text-white'}`}>{player.name}</span>
      {gp > 0 && (
        <span className={`text-sm font-bold ${isLowGames ? 'text-red-400' : 'text-orange-400'}`}>({gp})</span>
      )}
    </span>
  )
}

function SeasonRow({ year, data }) {
  if (!data) return null

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      {/* Season Header */}
      <div className="bg-gray-700 px-4 py-2 font-bold text-orange-400">
        {data.season}
      </div>

      <div className="p-4 space-y-3">
        {/* First Team */}
        {data.firstTeam && data.firstTeam.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-yellow-500 w-28 shrink-0">1st Team</span>
            <div className="flex flex-wrap gap-2">
              {data.firstTeam.map((player, idx) => (
                <PlayerBadge key={idx} player={player} />
              ))}
            </div>
          </div>
        )}

        {/* Second Team */}
        {data.secondTeam && data.secondTeam.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-gray-400 w-28 shrink-0">2nd Team</span>
            <div className="flex flex-wrap gap-2">
              {data.secondTeam.map((player, idx) => (
                <PlayerBadge key={idx} player={player} />
              ))}
            </div>
          </div>
        )}

        {/* Third Team */}
        {data.thirdTeam && data.thirdTeam.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-amber-700 w-28 shrink-0">3rd Team</span>
            <div className="flex flex-wrap gap-2">
              {data.thirdTeam.map((player, idx) => (
                <PlayerBadge key={idx} player={player} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function AwardTable({ award }) {
  if (!award || !award.winners) return null

  const winners = [...award.winners].reverse()

  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden shadow-lg">
      <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-6 py-4">
        <h2 className="text-xl font-bold text-white">{award.name}</h2>
        <p className="text-orange-200 text-sm">{award.abbreviation}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-700">
            <tr className="text-gray-300 text-sm">
              <th className="text-left px-6 py-3">Season</th>
              <th className="text-left px-6 py-3">Player</th>
              <th className="text-left px-6 py-3">Team</th>
              <th className="text-right px-6 py-3">Games Played</th>
            </tr>
          </thead>
          <tbody>
            {winners.map((winner, index) => {
              const gp = winner.gamesPlayed || 0
              const isLowGames = gp > 0 && gp < LOW_GAMES_THRESHOLD
              return (
                <tr
                  key={index}
                  className={`border-t border-gray-700 ${
                    isLowGames
                      ? 'bg-red-900/30'
                      : index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-800/50'
                  }`}
                >
                  <td className="px-6 py-4 text-gray-400">{winner.season}</td>
                  <td className={`px-6 py-4 font-medium ${isLowGames ? 'text-red-300' : 'text-white'}`}>
                    {winner.player}
                  </td>
                  <td className="px-6 py-4 text-gray-400">{winner.team}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`inline-flex items-center justify-center font-bold px-3 py-1 rounded-full text-sm min-w-[3rem] ${
                      isLowGames
                        ? 'bg-red-900 text-red-300 ring-1 ring-red-500'
                        : 'bg-gray-700 text-orange-400'
                    }`}>
                      {gp || '-'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default App
