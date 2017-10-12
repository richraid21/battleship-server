const GameBoard = require('./gameBoard')

class GameInstance {
    constructor(gameService, config = {}){
        if (!gameService)
            throw new Error('Must provide Game Service')
        
        this._gameid = 0
        this._datecreated = null
        this.activePlayer = 0
        
        this._player1 = {
            board: new GameBoard(config)
        }
        this._player2 = {
            board: new GameBoard(config)
        }
    }

    player1() {
        this.activePlayer = 1
        
        return this
    }

    player2() {
        this.activePlayer = 2
        
        return this
    }

    _requireActivePlayer() {
        if (this.activePlayer !== 1 && this.activePlayer !== 2)
            throw new Error('Must chain player selection to command')
    }

    _targetPlayer() {
        return this.activePlayer == 1 ? 2 : 1
    }

    _board() {
        return this[`_player${this.activePlayer}`].board
    }

    _targetBoard() {
        return this[`_player${this._targetPlayer()}`].board
    }

    guess(location) {
        this._requireActivePlayer()
        
        this._targetBoard().guessLocation(location)
        
        return this
    }

    placePiece(name, location) {
        this._requireActivePlayer()
        
        this._board().placePieceOnBoard(name, location)

        return this
    }
}