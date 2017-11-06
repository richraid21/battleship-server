
//import _ from 'lodash'
const _ = require('lodash')

const PIECES = {
    'CARRIER': { description: 'Aircraft Carrier', length: 5 },
    'BATTLESHIP': { description: 'Battleship', length: 4 },
    'CRUISER': { description: 'Cruiser', length: 3 },
    'SUBMARINE': { description: 'Submarine', length: 3 },
    'DESTROYER': { description: 'Destroyer', length: 2 }
}

const _generateEmptyNode = () => {
    const node = {
        hasPiece: false,
        isGuessed: false,
        isHit: false,
        pieceName: '',
        pieceDescription: ''
    }

    return _.assign({}, node)
}

const _generateEmptyNodes = (container, options) => {

    const height = options.height
    const width = options.width

    for (let h=0; h < height; h++) {
        for (let w=0; w < width; w++) {
            container[`${w}${h}`] = _generateEmptyNode()
        }
    }
}

const generateGameBoardInstanceFromData = (data) => {
    const gb = new GameBoard(data)
    return gb
}

class GameBoard {

    constructor(config = {}){
        
        this.height = config.height || 10
        this.width = config.width || 10
        this.maxOccupiedNodes = 0

        this._board = {
            hitNodes: {},
            totalHitNodes: 0,
            maxOccupiedNodes: this.maxOccupiedNodes,
            nodes: {}
        }

        if (config._board){
            this._board = config._board
        } else {
            _generateEmptyNodes(this._board.nodes, { height: this.height, width: this.width } )
        }
    }

    getRestrictedBoardView() {
        let view = {
            hitNodes: this._board.hitNodes,
            maxOccupiedNodes: this._board.maxOccupiedNodes,
            nodes: {}
        }
        
        Object.keys(this._board.nodes).map((key) => {
            const node = this._board.nodes[key]
            
            view.nodes[key] = { isGuessed: node.isGuessed }
            
            // Only display the hitStatus if they have made a guess
            if (node.isGuessed)
                view.nodes[key].isHit = true

        })
        
        
        return view
    }

    getPrivilegedBoardView() {
        return this._board
    }

    getBoardRep(viewLevel = 0){
        let board = {}

        switch(viewLevel){
            case 0:
                board = this._getRestrictedBoardView()
                break;
            case 1:
                board = this._getPrivilegedBoardView()
                break;
        }


        return _.assign({}, board)
    }

    printAscii() {
        const char = {
            ship: ' O ',
            hit: ' X ',
            top: ' - ',
            side: '|'
        }

        let x = 0
        let y = 0

        let top = new Array(this.width)
        _.fill(top, char.top)
        
        console.log('Battleship Board')
        console.log(top.join(''))
        for(y;y<this.height;y++){
            let row = char.side
            for(x;x<this.width;x++){
                const node = this._board.nodes[`${x}${y}`]
                if (node.hasPiece){
                    if (node.isHit) {
                        row += char.hit
                    } else {
                        row += char.ship
                    }
                } else { 
                    row += '   '
                }
                    
            }
            x = 0
            row += char.side
            console.log(row)
        }

        console.log(top.join(''))
    }

    placePieceOnBoard(name, location) {
        const {length, description} = PIECES[name]

            const direction = location.d
            const x = location.x
            let y = location.y

            for (let l = length; l > 0; l--) {
                let offset = { x: 0, y: 0}
                
                switch(direction){
                    case 'S':
                        offset.y = l; break;
                    case 'N':
                        offset.y = -l; break;   
                    case 'E':
                        offset.x = l; break;
                    case 'W':
                        offset.x = -l; break;
                }
                
                const nodex = x + offset.x
                const nodey = y + offset.y

                let n = this._board.nodes[`${nodex}${nodey}`]
                
                if (!n || n.hasPiece) {
                    throw new Error('Invalid Move!')
                    return
                }

                n.hasPiece = true
                n.pieceName = name
                n.pieceDescription = description
            }

            this._board.hitNodes[name] = 0
            this._board.maxOccupiedNodes += length
            return this.getPrivilegedBoardView()
    }

    guessLocation(location) {
        const {x, y} = location
        const node = this._board.nodes[`${x}${y}`]

        if (!node) {
            throw new Error('Not a valid guess!')
        }
        if (node.isGuessed) {
            throw new Error('Already guessed!')
        }

        node.isGuessed = true
        if (node.hasPiece) {
            node.isHit = true
            this._board.hitNodes[node.pieceName]++
            this._board.totalHitNodes++
            return location
        }

        return false
    }

    getInstanceData() {
        return JSON.stringify(this)
    }
}

module.exports = GameBoard