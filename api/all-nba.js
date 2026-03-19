import * as cheerio from 'cheerio';

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  try {
    const response = await fetch('https://www.basketball-reference.com/awards/all_league.html', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    const allNbaData = {};

    // Parse the All-NBA table
    $('#all_awards_all_league #awards_all_league tbody tr').each((i, row) => {
      const $row = $(row);
      const season = $row.find('th[data-stat="season"]').text().trim();
      const lg = $row.find('td[data-stat="lg_id"]').text().trim();

      if (!season || lg !== 'NBA') return;

      const team = $row.find('td[data-stat="number"]').text().trim();
      const playerLinks = $row.find('td[data-stat="player"] a');

      const year = parseInt(season.split('-')[0]) + 1;

      if (!allNbaData[year]) {
        allNbaData[year] = {
          season: season,
          firstTeam: [],
          secondTeam: [],
          thirdTeam: []
        };
      }

      playerLinks.each((j, link) => {
        const playerName = $(link).text().trim();
        const playerId = $(link).attr('href')?.match(/\/players\/\w\/(\w+)\.html/)?.[1];

        const playerData = {
          name: playerName,
          playerId: playerId,
          position: '',
          team: '',
          gamesPlayed: 0
        };

        if (team === '1st') {
          allNbaData[year].firstTeam.push(playerData);
        } else if (team === '2nd') {
          allNbaData[year].secondTeam.push(playerData);
        } else if (team === '3rd') {
          allNbaData[year].thirdTeam.push(playerData);
        }
      });
    });

    // Filter to last 50 years and sort
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 50;

    const filteredData = {};
    Object.keys(allNbaData)
      .map(Number)
      .filter(year => year >= startYear && year <= currentYear)
      .sort((a, b) => b - a)
      .forEach(year => {
        if (allNbaData[year].firstTeam.length > 0) {
          filteredData[year] = allNbaData[year];
        }
      });

    return new Response(JSON.stringify(filteredData), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=86400, stale-while-revalidate'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
