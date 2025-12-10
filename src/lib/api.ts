export async function fetchLichessGames(username: string, count: number = 100): Promise<string[]> {
  try {
    const response = await fetch(`https://lichess.org/api/games/user/${username}?max=${count}&pgnInJson=false`, {
      headers: {
        'Accept': 'application/x-chess-pgn'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Lichess API Error: ${response.statusText}`);
    }

    const text = await response.text();
    // Lichess returns all PGNs concatenated. We might need to split them if pgn-parser doesn't handle multiple well,
    // but pgn-parser usually handles multiple games.
    // However, to be safe and consistent with our store logic which might expect an array of PGN strings or one big string,
    // let's return the raw text. The store's import logic (using pgn-parser) handles multiple games.
    // Wait, our current importPGN only takes the *first* game. We need to update that.
    // For now, let's return the raw text.
    return [text];
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function fetchChessComGames(username: string, count: number = 100): Promise<string[]> {
  try {
    // 1. Get archives (list of months)
    const archivesRes = await fetch(`https://api.chess.com/pub/player/${username}/games/archives`);
    if (!archivesRes.ok) throw new Error('Chess.com User Not Found');
    
    const data = await archivesRes.json();
    const archives = data.archives as string[]; // URLs
    
    // 2. Fetch games from recent months until we have enough
    let games: string[] = [];
    // Reverse to get latest first
    for (let i = archives.length - 1; i >= 0; i--) {
      if (games.length >= count) break;
      
      const url = archives[i];
      const res = await fetch(url);
      const monthData = await res.json();
      const monthGames = monthData.games; // Array of game objects
      
      // Chess.com returns JSON with a 'pgn' field
      for (const game of monthGames.reverse()) {
        if (games.length >= count) break;
        if (game.pgn) {
          games.push(game.pgn);
        }
      }
    }
    
    return games;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
