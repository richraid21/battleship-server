import RankingService from '../../src/services/ranking'

describe('Ranking Service', () => {
    const rs = new RankingService()

    it('Should properly return the expected results', () => {
        const result = rs.matchup({ rank: 2400 }, { rank: 2000 }).winner(1).newRanks()
        
        expect(Object.keys(result).length).toBe(2)
        expect(result.player1.rank).toBe(2402)
        expect(result.player2.rank).toBe(1997)
    })

})