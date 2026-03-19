import { useState } from 'react'
import allNbaTeams from './data/allNbaTeams.json'
import awards from './data/awards.json'

function App() {
  const [activeTab, setActiveTab] = useState('all-nba')
  const [selectedYear, setSelectedYear] = useState(2025)
  const [selectedAward, setSelectedAward] = useState('mvp')

  const years = Object.keys(allNbaTeams).map(Number).sort((a, b) => b - a)

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
    { id: 'allStarMvp', label: 'All-Star MVP' },
  ]

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-600 to-orange-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-center">NBA History Dashboard</h1>
          <p className="text-center text-orange-200 mt-2">50 Years of Excellence (1975-2025)</p>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-gray-800 border-b border-gray-700">
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
          <div>
            {/* Year Selector */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-400 mb-2">Select Season</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {allNbaTeams[year].season}
                  </option>
                ))}
              </select>
            </div>

            {/* All-NBA Teams Display */}
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {/* First Team */}
              <TeamCard
                title="First Team"
                players={allNbaTeams[selectedYear]?.firstTeam || []}
                accentColor="from-yellow-500 to-yellow-600"
              />

              {/* Second Team */}
              <TeamCard
                title="Second Team"
                players={allNbaTeams[selectedYear]?.secondTeam || []}
                accentColor="from-gray-400 to-gray-500"
              />

              {/* Third Team (if exists) */}
              {allNbaTeams[selectedYear]?.thirdTeam && (
                <TeamCard
                  title="Third Team"
                  players={allNbaTeams[selectedYear].thirdTeam}
                  accentColor="from-amber-700 to-amber-800"
                />
              )}
            </div>
          </div>
        )}

        {activeTab === 'awards' && (
          <div>
            {/* Award Category Selector */}
            <div className="mb-8 flex flex-wrap gap-2">
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
            <AwardTable award={awards[selectedAward]} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-500">
          <p>NBA History Dashboard - Data from 1974-75 to 2024-25 seasons</p>
        </div>
      </footer>
    </div>
  )
}

function TeamCard({ title, players, accentColor }) {
  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden shadow-lg">
      <div className={`bg-gradient-to-r ${accentColor} px-6 py-4`}>
        <h2 className="text-xl font-bold text-white">{title}</h2>
      </div>
      <div className="p-4">
        <table className="w-full">
          <thead>
            <tr className="text-gray-400 text-sm">
              <th className="text-left pb-3">Player</th>
              <th className="text-center pb-3">Pos</th>
              <th className="text-right pb-3">GP</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player, index) => (
              <tr key={index} className="border-t border-gray-700">
                <td className="py-3">
                  <div className="font-medium text-white">{player.name}</div>
                  <div className="text-sm text-gray-500">{player.team}</div>
                </td>
                <td className="text-center text-gray-400">{player.position}</td>
                <td className="text-right">
                  <span className="inline-flex items-center justify-center bg-gray-700 text-orange-400 font-bold px-3 py-1 rounded-full text-sm">
                    {player.gamesPlayed}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AwardTable({ award }) {
  if (!award) return null

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
            {winners.map((winner, index) => (
              <tr
                key={index}
                className={`border-t border-gray-700 ${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'}`}
              >
                <td className="px-6 py-4 text-gray-400">{winner.season}</td>
                <td className="px-6 py-4 font-medium text-white">{winner.player}</td>
                <td className="px-6 py-4 text-gray-400">{winner.team}</td>
                <td className="px-6 py-4 text-right">
                  <span className="inline-flex items-center justify-center bg-gray-700 text-orange-400 font-bold px-3 py-1 rounded-full text-sm min-w-[3rem]">
                    {winner.gamesPlayed}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default App
