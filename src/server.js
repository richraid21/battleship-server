import winston from 'winston'
import { initializeApplication } from './app'

initializeApplication().then((server) => {
    server.listen(8080, function() {
        winston.info(`Running @ ${server.url}`)
    })
})

