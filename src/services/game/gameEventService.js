const EventEmitter = require('events')


class GameEventService extends EventEmitter {
    constructor(socketChannel = {}){
        super()
        this.on('GUESS:HIT', this.notifyHit)
        this.on('GUESS:MISS', this.notifyMiss)
        
        this.on('GAME:OVER', this.notifyEnd)
    }

    notifyHit() {
        console.log('Hit!', arguments[0])
    }

    notifyMiss() {
        console.log('Miss! :(')
    }

    notifyEnd() {
        console.log('Winner!', arguments[0])
    }
}



module.exports = GameEventService