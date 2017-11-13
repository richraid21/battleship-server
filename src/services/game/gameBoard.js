
//import _ from 'lodash'
const _ = require('lodash')
const winston = require('winston')

const PIECES = {
    'CARRIER': { description: 'Aircraft Carrier', length: 5 },
    'BATTLESHIP': { description: 'Battleship', length: 4 },
    'CRUISER': { description: 'Cruiser', length: 3 },
    'SUBMARINE': { description: 'Submarine', length: 3 },
    'DESTROYER': { description: 'Destroyer', length: 2 }
}

const node = (name = '', x, y) => {
    const n = {
        x: x, 
        y: y,
        name: name,
        guessed: false,
        hit: false,
        sank: false
    }

    return _.assign({}, n)
}

class GameBoard {

    constructor(config = {}){
        
        this.height = 10
        this.width = 10

        this.board = {
            piecesPlaced: 0,
            nodes: new Array(this.width)
        }

        for (let i=0; i< this.width;i++){
            this.board.nodes[i] = new Array(this.height).fill({ guessed: false })
        }
    }

    toJson() {
        let data = {
            height: this.height,
            width: this.width,
            board: this.board
        }

        return data
    }

    allPiecesPlaced() {
        return this.piecesPlaced === Object.keys(PIECES).length
    }

    placeShips(ships) {
        // Array of { name: String, points: Array[Object{ x: number, y: number}...]}
        let currentShip = 0

        try {
            ships.forEach((ship, i) => {
                currentShip = i
                this.placePiece(ship.name, ship.points)
            })

            return this.view()
        } catch (e){
            throw new Error(`Invalid Placement of ${ships[currentShip].name}! ${e.message}`)
        }
    }

    placePiece(name, points) {
        
        // Must be a valid piece in the list of accepted keys
        if (!PIECES.hasOwnProperty(name))
            throw new Error('Invalid Piece Name')

        // The number of x,y points must be the same as the length of the ship piece
        const ship = PIECES[name]
        if (!points.length === ship.length)
            throw new Error('Invalid number of points for specified ship')

        //Ensure the piece is vertical or horizontal
        const xvalues = _(points).map('x').value()
        const yvalues = _(points).map('y').value()

        const isVertical = xvalues.every(x => x === points[0].x)
        const isHorizontal = yvalues.every(y => y === points[0].y)

        if (!((isHorizontal && !isVertical) || (!isHorizontal && isVertical))){
            throw new Error('Must be horizontal or vertical')
        }

        // Check to make sure a piece doesnt already exist at one of the x,y pair locations
        points.forEach((p) => {
            if (this.board.nodes[p.x][p.y].name)
                throw new Error('Piece already exists at that location')
        });

        // Ensure placement is sequential
        let isSequential
        if (isHorizontal)
            isSequential = xvalues.every((x, i) => i === xvalues.length - 1 || (x < xvalues[i - 1] || x < xvalues[i + 1]))
        if (isVertical)
            isSequential = yvalues.every((y, i) => i === yvalues.length - 1 || (y < yvalues[i - 1] || y < yvalues[i + 1]))

        if (!isSequential){
            throw new Error('Piece must be laid out sequentially')
        }

        // Generate the nodes for the piece
        points.forEach((p) => {
            this.board.nodes[p.x][p.y] = node(name, p.x, p.y)
        })

        // Return the board object
        this.piecesPlaced++
        return this.view()
        
    }

    guessLocation(location) {
        const n = this.board.nodes[location.x][location.y]
        
        if (!n){
            n = {
                guessed: true
            }
            return
        }

        if (n.guessed){
            throw new Error('You already guessed that!')
        }

        console.log('Hit')
        n.hit = true
        n.guessed = true

        const hitCount = this.getHitNodesByShipName(n.name).length
        if (hitCount === PIECES[n.name].length){
            console.log('SUNK!')
            this.markShipSank(n.name)
        } else {
            console.log('Keep trying....')
        }
    }

    markShipSank(name) {
        const nodes = this.getHitNodesByShipName(name)
        nodes.forEach(n => n.sank = true)
    }

    getHitNodesByShipName(name) {
        const shipNodes = this.getNodesByShipName(name)
        return _.filter(shipNodes, { hit: true})
    }

    getNodesByShipName(name) {
        let results = []
        
        this.board.nodes.forEach(row => {
            const matches = _.filter(row, {name: name})
            if (matches.length > 0){
                results.push(matches)
            }
        })

        return [].concat(...results)
    }
    
    view() {
        return _.assign({}, this.board)
    }

    restrictedView() {
        return this.view()   
    }

    pickNodes(allNodes, checkFunction){
        let nodes = []

        for (let x = 0; x<allNodes.length; x++){
            for (let y = 0; y<allNodes.length; y++){
                const n = allNodes[x][y]
                if (checkFunction(n))
                    nodes.push(n)
            }
        }

        return nodes
    }



    activeNodes() {
        return this.pickNodes(this.board.nodes, (n) => {
            if (n)
                return true
        })
    }

    transformNodesToRestricted(nodes) {
        for (let y = 0; y<nodes[0].length; y++){
            for (let x = 0; x<nodes.length; x++){
                const node = nodes[x][y]

            }
        }

        return nodes
    }

    asciiPrint(options = {}) {
        const restricted = options.restricted || false
        
        let nodes = this.board.nodes

        if (restricted){
            nodes = this.transformNodesToRestricted(nodes)
        }

        return this.ascii(nodes)
    }    

    ascii(allNodes) {
        let ascii = ''

        for (let y = 0; y<allNodes[0].length; y++){
            for (let x = 0; x<allNodes.length; x++){
                const n = allNodes[x][y]
                if (n.name){
                    let char
                        char = ' O '
                        if (n.hit)
                            char = ' X '
                        if (n.sank)
                            char = ' S '
                        
                        ascii += char
                } else {
                    ascii += ' . '
                }

                ascii
            }

            ascii += '\n'
        }

        return ascii
    }

}

module.exports = GameBoard

/*
const g = new GameBoard()

g.placeShips([
    {name: 'DESTROYER', points: [{ x: 1, y: 2}, { x: 1, y:3}]},
    {name: 'SUBMARINE', points: [{ x: 2, y: 9}, { x: 3, y:9}, { x: 4, y:9}]}
])

g.guessLocation({ x: 4, y: 9})
g.guessLocation({ x: 2, y: 9})

console.log(g.asciiPrint())
*/