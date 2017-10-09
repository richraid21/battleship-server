import winston from 'winston'

winston.addColors({
    silly: 'magenta',
    debug: 'blue',
    verbose: 'cyan',
    info: 'green',
    warn: 'yellow',
    error: 'red'
  })

winston.remove(winston.transports.Console)
winston.add(winston.transports.Console, {
    prettyPrint: true,
    colorize: true,
    silent: false,
    timestamp: false
})
// Winston.add(winston.transports.File, { filename: "../../../logs/app.log" })
