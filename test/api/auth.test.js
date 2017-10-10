import request from 'supertest'
import { basicServer } from '../../src/app'
import config from '../../src/knexfile'


describe('Auth Routes', async () => {
    const app = basicServer()
    const knex = require('knex')(config)

    afterAll(async (done) => {
        await knex.raw('DELETE FROM SESSION s USING "user" u WHERE s.user = u.id AND u.nickname = ?', ['registered-user-1'])
        await knex('user').where('nickname', 'registered-user-1').del()

        knex.destroy()
        app.close()
        done()
    })

    test('/register - It should register a user', async () => {
        const body = {
            username: 'registered-user-1',
            password: 'pa$$'
        }

        const res = await request(app).post('/api/auth/register').send(body)
        expect(res.statusCode).toBe(200)

        expect(Object.keys(res.body).length).toBe(3)
        expect(Object.keys(res.body.auth).length).toBe(2)

        expect(res.body).toHaveProperty('username')
        expect(res.body).toHaveProperty('datecreated')
        expect(res.body).toHaveProperty('auth')
        expect(res.body.auth).toHaveProperty('token')
        expect(res.body.auth).toHaveProperty('expires')
    })

    test('/register - It should reject an existing user', async () => {
        const body = {
            username: 'registered-user-1',
            password: 'pa$$'
        }

        const res = await request(app).post('/api/auth/register').send(body)
        expect(res.statusCode).toBe(403)

    })

    test('/register - It should reject with missing parameters', async () => {
        const body = {
            username: 'registered-user-1'
        }

        const res = await request(app).post('/api/auth/register').send(body)
        expect(res.statusCode).toBe(400)
        
    })

    test('/login - It should allow login', async () => {
        const body = {
            username: 'registered-user-1',
            password: 'pa$$'
        }

        const res = await request(app).post('/api/auth/login').send(body)
        expect(res.statusCode).toBe(200)

        expect(Object.keys(res.body).length).toBe(3)
        expect(Object.keys(res.body.auth).length).toBe(2)

        expect(res.body).toHaveProperty('username')
        expect(res.body).toHaveProperty('datecreated')
        expect(res.body).toHaveProperty('auth')
        expect(res.body.auth).toHaveProperty('token')
        expect(res.body.auth).toHaveProperty('expires')
    })

    test('/login - It should forbid with wrong password', async () => {
        const body = {
            username: 'registered-user-1',
            password: 'pa$$111'
        }

        const res = await request(app).post('/api/auth/login').send(body)
        expect(res.statusCode).toBe(401)
    })

    test('/refresh - It should issue a new token and invalidate the old one', async () => {
        const body = {
            username: 'registered-user-1',
            password: 'pa$$'
        }

        //Login and get token1
        const login = await request(app).post('/api/auth/login').send(body)
        expect(login.statusCode).toBe(200)
        const token = login.body.auth.token

        //Get new token2, invalidate token1
        const refresh = await request(app).post('/api/auth/refresh').set('Authorization', `Basic ${token}`)
        expect(refresh.statusCode).toBe(200)
        const _token = refresh.body.auth.token

        //Should reject
        const oldTokenMe = await request(app).get('/api/auth/me').set('Authorization', `Basic ${token}`)
        expect(oldTokenMe.statusCode).toBe(401)
        
        //Should resolve
        const newTokenMe = await request(app).get('/api/auth/me').set('Authorization', `Basic ${_token}`)
        expect(newTokenMe.statusCode).toBe(200)
        
        expect(Object.keys(newTokenMe.body).length).toBe(2)

        expect(newTokenMe.body).toHaveProperty('username')
        expect(newTokenMe.body).toHaveProperty('datecreated')
    })

    test('/me - Should return user profile', async () => {
        const body = {
            username: 'registered-user-1',
            password: 'pa$$'
        }

        const login = await request(app).post('/api/auth/login').send(body)
        expect(login.statusCode).toBe(200)
        const token = login.body.auth.token

        const me = await request(app).get('/api/auth/me').set('Authorization', `Basic ${token}`)
        expect(me.statusCode).toBe(200)
    })

    test('/logout - Should destroy current session', async () => {
        const body = {
            username: 'registered-user-1',
            password: 'pa$$'
        }

        const login = await request(app).post('/api/auth/login').send(body)
        expect(login.statusCode).toBe(200)
        const token = login.body.auth.token

        const logout = await request(app).post('/api/auth/logout').set('Authorization', `Basic ${token}`)
        expect(logout.statusCode).toBe(200)

        const me = await request(app).get('/api/auth/me').set('Authorization', `Basic ${token}`)
        expect(me.statusCode).toBe(401)
    })


})