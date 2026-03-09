export let API = process.env.NEXT_PUBLIC_API_URL || 'https://football-analytics-production-5b3d.up.railway.app';
if (API.startsWith('http://') && !API.includes('localhost') && !API.includes('127.0.0.1')) {
    API = API.replace('http://', 'https://');
}

const req = async (path: string, opts: RequestInit = {}) => {
    const res = await fetch(`${API}${path}`, opts);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

export const getLeagues = () => req('/api/leagues');
export const getLeague = (id: string | number) => req(`/api/leagues/${id}`);
export const getMatches = (params: Record<string, any> = {}) => req(`/api/matches?${new URLSearchParams(params as any)}`);
export const getMatch = (id: string | number) => req(`/api/matches/${id}`);
export const updateMatch = (id: string | number, data: any) => req(`/api/matches/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
export const deleteMatch = (id: string | number) => req(`/api/matches/${id}`, { method: 'DELETE' });
export const getTeams = (params: Record<string, any> = {}) => req(`/api/teams?${new URLSearchParams(params as any)}`);
export const getTeam = (id: string | number) => req(`/api/teams/${id}`);
export const getH2H = (teamId: string | number, oppId: string | number) => req(`/api/teams/${teamId}/head-to-head/${oppId}`);
export const getStandings = (params: Record<string, any> = {}) => req(`/api/standings?${new URLSearchParams(params as any)}`);
export const getSeasons = (params: Record<string, any> = {}) => req(`/api/standings/seasons?${new URLSearchParams(params as any)}`);
export const getSquadStats = (params: Record<string, any> = {}) => req(`/api/squad-stats?${new URLSearchParams(params as any)}`);
export const getPlayers = (params: Record<string, any> = {}) => req(`/api/players?${new URLSearchParams(params as any)}`);
export const getTopScorers = (params: Record<string, any> = {}) => req(`/api/players/top-scorers?${new URLSearchParams(params as any)}`);
export const getHealth = () => req('/api/health');
export const getVenueStats = (params: Record<string, any> = {}) => req(`/api/venue-stats?${new URLSearchParams(params as any)}`);
export const syncAll = (payload: any) => req('/api/sync/all', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

// ── ML Prediction Engine ────────────────────────────────────────────────────
export const getPredictionStatus = () => req('/api/predictions/status');
export const trainPredictionModel = (payload: Record<string, any> = {}) =>
    req('/api/predictions/train', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
export const predictMatchById = (payload: { home_team_id: number; away_team_id: number; league_id: number; season_id: number }) =>
    req('/api/predictions/predict', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
export const getPredictionFixtures = (params: Record<string, any> = {}) =>
    req(`/api/predictions/fixtures?${new URLSearchParams(params as any)}`);
export const getUpcomingPredictions = (params: Record<string, any> = {}) =>
    req(`/api/predictions/upcoming?${new URLSearchParams(params as any)}`);
// Legacy rule-based prediction by team name
export const predictMatch = (payload: { home_team: string; away_team: string; league?: string }) =>
    req('/api/predictions/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
// Recent completed matches from DB (replaces hardcoded predictionsData)
export const getPredictionResults = (params: Record<string, any> = {}) =>
    req(`/api/predictions/results?${new URLSearchParams(params as any)}`);
// Weekly accuracy trend from real match data (replaces hardcoded weeklyTrends)
export const getPredictionAccuracy = (params: Record<string, any> = {}) =>
    req(`/api/predictions/accuracy?${new URLSearchParams(params as any)}`);

// ── DC Markets Engine ────────────────────────────────────────────────────────
export const getDCStatus = () => req('/api/markets/dc/status');
export const trainDCModel = () => req('/api/markets/dc/train', { method: 'POST' });
export const getDCPredict = (homeId: number, awayId: number) =>
    req(`/api/markets/dc/predict?home_team_id=${homeId}&away_team_id=${awayId}`);
export const getMarkets = (homeId: number, awayId: number) =>
    req(`/api/markets?home_team_id=${homeId}&away_team_id=${awayId}`);
export const getDCLeaderboard = () => req('/api/markets/dc/leaderboard');
export const getValueBets = (payload: any) =>
    req('/api/markets/value', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

// ── Performance Metrics ──────────────────────────────────────────────────────
export const getPerformance = () => req('/api/performance');
export const getPerformanceDrift = () => req('/api/performance/drift');
export const getCalibration = () => req('/api/performance/calibration');
export const getPerLeague = () => req('/api/performance/per-league');
export const getConfusionMatrix = () => req('/api/performance/confusion');

