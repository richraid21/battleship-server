
import { initializeApplication } from '../src/app.js'

describe('App Entry', () => {

    let standardOutput
    let outputMock
    
    const enableOutputMock = () => {
        standardOutput = process.stdout.write
        process.stdout.write = jest.fn()
        outputMock = process.stdout.write
    }

    const disableOutputMock = () => {
        process.stdout.write = standardOutput
    }

    describe('Initialization', () => {

        it('Initialize App should return the running instance', async () => {
            const envBackup = process.env

            process.env.NODE_ENV = 'dev'
            
            enableOutputMock()
            const app = await initializeApplication()
            disableOutputMock()

            expect(outputMock.mock.calls[0][0].indexOf('Application')).toBeGreaterThan(0)
            expect(outputMock.mock.calls[1][0].indexOf('Database Schema')).toBeGreaterThan(0)
            expect(outputMock.mock.calls[2][0].indexOf('Enables CORS')).toBeGreaterThan(0)
            
            process.env = envBackup
        })

        it('Initialize App should not enable dev mode in production', async () => {
            const envBackup = process.env

            process.env.NODE_ENV = 'production'
            
            enableOutputMock()
            const app = await initializeApplication()
            disableOutputMock()

            expect(outputMock.mock.calls[0][0].indexOf('Application')).toBeGreaterThan(0)
            expect(outputMock.mock.calls[1][0].indexOf('Database Schema')).toBeGreaterThan(0)
            expect(outputMock.mock.calls.length).toBe(2)
            
            process.env = envBackup
        })

    })
})