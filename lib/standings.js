// Shared standings calculator (standard rules: Win=3, Draw=1,
// sorted by Pts -> GD -> GF). Input: matches mapped via toMatch.
export function computeTable(matches) {
  const table = {};
  const add = (name) => {
    if (!table[name]) table[name] = { team: name, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 };
  };
  for (const m of matches) {
    add(m.homeTeam); add(m.awayTeam);
    const h = table[m.homeTeam], a = table[m.awayTeam];
    h.played++; a.played++;
    h.gf += m.homeScore; h.ga += m.awayScore;
    a.gf += m.awayScore; a.ga += m.homeScore;
    if (m.homeScore > m.awayScore) { h.won++; h.points += 3; a.lost++; }
    else if (m.homeScore < m.awayScore) { a.won++; a.points += 3; h.lost++; }
    else { h.drawn++; a.drawn++; h.points++; a.points++; }
  }
  return Object.values(table)
    .map((r) => ({ ...r, gd: r.gf - r.ga }))
    .sort((x, y) => y.points - x.points || y.gd - x.gd || y.gf - x.gf);
}
