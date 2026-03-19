import * as cheerio from 'cheerio';

export const config = {
  runtime: 'edge',
};

const AWARD_URLS = {
  mvp: 'https://www.basketball-reference.com/awards/mvp.html',
  dpoy: 'https://www.basketball-reference.com/awards/dpoy.html',
  roy: 'https://www.basketball-reference.com/awards/roy.html',
  sixthMan: 'https://www.basketball-reference.com/awards/smoy.html',
  mip: 'https://www.basketball-reference.com/awards/mip.html',
  finalsMvp: 'https://www.basketball-reference.com/awards/finals_mvp.html',
};

const AWARD_NAMES = {
  mvp: { name: 'Most Valuable Player', abbreviation: 'MVP' },
  dpoy: { name: 'Defensive Player of the Year', abbreviation: 'DPOY', firstYear: 1983 },
  roy: { name: 'Rookie of the Year', abbreviation: 'ROY' },
  sixthMan: { name: 'Sixth Man of the Year', abbreviation: '6MOY', firstYear: 1983 },
  mip: { name: 'Most Improved Player', abbreviation: 'MIP', firstYear: 1986 },
  finalsMvp: { name: 'Finals Most Valuable Player', abbreviation: 'Finals MVP' },
};

async function fetchAward(awardKey) {
  const url = AWARD_URLS[awardKey];
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  const html = await response.text();
  const $ = cheerio.load(html);

  const winners = [];
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 50;

  // Different table IDs for different awards
  const tableSelectors = [
    `#${awardKey}_NBA tbody tr`,
    `#mvp_NBA tbody tr`,
    `#dpoy_NBA tbody tr`,
    `#roy_NBA tbody tr`,
    `#smoy_NBA tbody tr`,
    `#mip_NBA tbody tr`,
    `#finals_mvp_NBA tbody tr`,
    'table tbody tr'
  ];

  let foundRows = false;
  for (const selector of tableSelectors) {
    const rows = $(selector);
    if (rows.length > 0) {
      rows.each((i, row) => {
        const $row = $(row);
        if ($row.hasClass('thead')) return;

        const season = $row.find('th[data-stat="season"], td[data-stat="season"]').text().trim();
        if (!season || !season.includes('-')) return;

        const year = parseInt(season.split('-')[0]) + 1;
        if (year < startYear || year > currentYear) return;

        const playerCell = $row.find('td[data-stat="player"]');
        const player = playerCell.find('a').text().trim() || playerCell.text().trim();
        if (!player) return;

        const teamCell = $row.find('td[data-stat="team_id"]');
        const team = teamCell.find('a').text().trim() || teamCell.text().trim();

        const gamesPlayed = parseInt($row.find('td[data-stat="g"]').text().trim()) || 0;

        winners.push({
          year,
          season,
          player,
          team,
          gamesPlayed
        });
      });
      foundRows = true;
      break;
    }
  }

  return {
    ...AWARD_NAMES[awardKey],
    winners: winners.sort((a, b) => a.year - b.year)
  };
}

export default async function handler(request) {
  try {
    const url = new URL(request.url);
    const awardType = url.searchParams.get('type');

    if (awardType && AWARD_URLS[awardType]) {
      const award = await fetchAward(awardType);
      return new Response(JSON.stringify(award), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 's-maxage=86400, stale-while-revalidate'
        }
      });
    }

    // Fetch all awards
    const awards = {};
    for (const key of Object.keys(AWARD_URLS)) {
      try {
        awards[key] = await fetchAward(key);
      } catch (e) {
        awards[key] = { ...AWARD_NAMES[key], winners: [], error: e.message };
      }
    }

    return new Response(JSON.stringify(awards), {
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
