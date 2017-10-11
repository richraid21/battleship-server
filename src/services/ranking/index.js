import _ from 'lodash'

/**
 * Basic Elo-Ranking algothim with a 400 base and a static K-factor
 * usage: const result = rs.matchup({ rank: 2400 }, { rank: 2000 }).winner(1).newRanks()
 * result: { player1: { rank: 2403 }, player2: { rank: 1994 } }
 */

function RankService(config = {}) {
    this.K_FACTOR = config.k || 32
    this._p1 = {}
    this._p2 = {}
}

_.assign(RankService.prototype, {
    _adjRanks(){
        this._p1.adjRank = Math.pow(10, this._p1.rank/400)
        this._p2.adjRank = Math.pow(10, this._p2.rank/400)
    },
    
    _expectedScores(){
        this._p1.expected = this._p1.adjRank / (this._p1.adjRank + this._p2.adjRank)
        this._p2.expected = this._p2.adjRank / (this._p2.adjRank + this._p1.adjRank)
    },

    matchup(player1, player2){
        this._p1.rank = player1.rank
        this._p2.rank = player2.rank

        this._adjRanks()
        this._expectedScores()

        return this
    },
    
    winner(index){
        this._p1.score = +(index === 1)
        this._p2.score = +(index === 2)

        return this
    },
    newRanks(){
        const player1 = {
            rank: Math.floor(this._p1.rank + this.K_FACTOR * (this._p1.score - this._p1.expected))
        }

        const player2 = {
            rank: Math.floor(this._p2.rank + this.K_FACTOR * (this._p2.score - this._p2.expected))
        }

        this._p1 = this._p2 = {}
        return { player1, player2 }
    }

})

module.exports = RankService