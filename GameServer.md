# Game Server

The Game server runs on a socket server located on the same port as the API server.    
The url is `/game/:gameid`   

## Client Instructions

All client messages to the game server should follow the same object structure. Remember to stringify the object before sending over the pipe. Only UTF-8 is supported.

### Client Structure
```javascript
ClientMessage: {
    token: String { Authroization token used to identify yourself },
    type: String { The message action you wish to take },
    payload: Object | Array { Included information }
}
```

#### type: `AUTH:ATTEMPT`
A payload is not needed for this message. Essentially just used to confirm you are allowed into the specific game

#### type: `GAME:PIECES:ATTEMPT`
The payload should consist of an array of game pieces and the locations they are placed. Coordinates are 0 based and positive.

```javascript
ClientMessage: {
    token: String,
    type: 'GAME:PIECES:ATTEMPT',
    payload: [
        { name: 'BATTLESHIP', points: [ {x: 2, y: 3}, {x: 2, y:4} ] },
        { name: 'SUBMARINE', points: [{x: 9, y: 1}, ...]}
    ]
}
```

#### type: `GAME:GUESS:ATTEMPT`
The payload should be a location object with an `x` and `y` coordinate

```javascript
ClientMessage: {
    token: String,
    type: 'GAME:PIECES:ATTEMPT',
    payload: {
        x: 3,
        y: 5
    }
}
```

### Server Structure
The messages sent out by the server sent a type, message (client viewable) and payload: 

```javascript
ServerMessage: {
    type: String,
    message: String,
    payload: Object
}
```

#### type: `MESSAGE:REJECT` - Individual
Sent when a message to the game server does not include a `type` property

#### type `AUTH:REJECT` - Individual
Sent when there is a problem with authentication. See returned `message` for details

#### type `GAME:PLAYER:TURN` - Broadcast
Sent when it is the specified players turn
```javascript
message: String,
payload: Object {
    player: Player
}
```

#### type `GAME:PIECES:ACCEPT` - Individual
Sent when the placement of pieces has been accepted

#### type `GAME:PIECES:REJECT` - Individual
Sent when placement is rejected
```javascript
message: String { Reason for rejection }
```

#### type `GAME:STATE` - Broadcast
Sent when there is a state change
```javascript
message: String,
payload: Object {
    state: String
}
```

#### type `GAME:OVER` - Broadcast
Sent when the game is over (All Ships sunk)
```javascript
message: String,
payload: Object {
    winner: Player,
    loser: Player
}
```

#### type `GAME:GUESS:ACCEPT` - Individual
Sent when a guess is accepted
```javascript
message: String, 
payload: Object {
    result: String { HIT | MISS | SUNK}
    name: String { Ship name } // Only included in "SANK"
    board: Board
}
```

#### type `GAME:GUESS:REJECT` - Individual
Sent when a guess is rejected
```javascript
message: String { Rejection reason }
```

#### type `GAME:GUESS:OPPONENT` - Individual
Sent when the opponent makes a guess
```javascript
message: String, 
payload: Object {
    result: String { HIT | MISS | SUNK}
    name: String { Ship name } // Only included in "SANK"
    board: Board
}
```

#### type `GAME:PLAYER:JOIN` - Broadcast
Sent when a player joins the room (They are already assigned to the game, but now they are actually entering the game server)
```javascript
message: String,
payload: Player
```



