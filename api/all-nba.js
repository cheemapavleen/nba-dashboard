import * as cheerio from 'cheerio';

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  try {
    const response = await fetch('https://www.basketball-reference.com/awards/all_league.html', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    let html = await response.text();

    // Basketball Reference hides tables in HTML comments - extract them
    const commentPattern = /<!--\s*([\s\S]*?)\s*-->/g;
    let match;
    while ((match = commentPattern.exec(html)) !== null) {
      if (match[1].includes('id="awards_all_league"') || match[1].includes('all_league')) {
        html = html.replace(match[0], match[1]);
      }
    }

    const $ = cheerio.load(html);
    const allNbaData = {};

    // Try multiple selector patterns
    const selectors = [
      '#awards_all_league tbody tr',
      'table#awards_all_league tbody tr',
      '#all_awards_all_league tbody tr',
      'table.stats_table tbody tr'
    ];

    let rows = $([]);
    for (const selector of selectors) {
      rows = $(selector);
      if (rows.length > 0) break;
    }

    rows.each((i, row) => {
      const $row = $(row);
      if ($row.hasClass('thead') || $row.hasClass('over_header')) return;

      const seasonCell = $row.find('th[data-stat="season"], td[data-stat="season"]');
      const season = seasonCell.text().trim();

      if (!season || !season.includes('-')) return;

      const lg = $row.find('td[data-stat="lg_id"]').text().trim();
      if (lg && lg !== 'NBA') return;

      const teamNum = $row.find('td[data-stat="number"]').text().trim();

      // Get all player names from the row
      const playerCell = $row.find('td[data-stat="player"]');
      const playerText = playerCell.text().trim();
      const playerLinks = playerCell.find('a');

      const year = parseInt(season.split('-')[0]) + 1;

      if (!allNbaData[year]) {
        allNbaData[year] = {
          season: season,
          firstTeam: [],
          secondTeam: [],
          thirdTeam: []
        };
      }

      // Parse players - they might be comma-separated or in links
      let players = [];
      if (playerLinks.length > 0) {
        playerLinks.each((j, link) => {
          players.push($(link).text().trim());
        });
      } else if (playerText) {
        players = playerText.split(',').map(p => p.trim()).filter(p => p);
      }

      // Get games played if available
      const gamesCell = $row.find('td[data-stat="g"]');
      const gamesPlayed = parseInt(gamesCell.text().trim()) || 0;

      players.forEach(playerName => {
        if (!playerName) return;

        const playerData = {
          name: playerName,
          gamesPlayed: gamesPlayed
        };

        if (teamNum === '1st' || teamNum === '1') {
          allNbaData[year].firstTeam.push(playerData);
        } else if (teamNum === '2nd' || teamNum === '2') {
          allNbaData[year].secondTeam.push(playerData);
        } else if (teamNum === '3rd' || teamNum === '3') {
          allNbaData[year].thirdTeam.push(playerData);
        }
      });
    });

    // Filter to last 50 years
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 50;

    const filteredData = {};
    Object.keys(allNbaData)
      .map(Number)
      .filter(year => year >= startYear && year <= currentYear)
      .sort((a, b) => b - a)
      .forEach(year => {
        if (allNbaData[year] && allNbaData[year].firstTeam.length > 0) {
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
    return new Response(JSON.stringify({ error: error.message, stack: error.stack }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
