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
export const syncAll = (payload: any) => req('/api/sync/all', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
