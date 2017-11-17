const t = require('../../../src/api/utils/terminate')

describe('API Request Termination Types', () => {
    
    let res = {
        send: jest.fn()
    }

    beforeEach(() => {
        res.send.mockClear()
    })

    it('Malformed Error -> 400', () => {
        const msg = 'Malformed'
        t.malformedError(res, msg)

        expect(res.send).toBeCalledWith(400, { message: msg})
    })

    it('Unauthorized Error -> 401', () => {
        const msg = 'Unautorized'
        t.unauthorizedError(res, msg)

        expect(res.send).toBeCalledWith(401, { message: msg})
    })

    it('Forbidden Error -> 403', () => {
        const msg = 'Forbidden'
        t.forbiddenError(res, msg)

        expect(res.send).toBeCalledWith(403, { message: msg})
    })

    it('Generic Client Error -> 403 w/ Custom message', () => {
        const msg = 'GenericC'
        t.genericError(res, msg)

        expect(res.send).toBeCalledWith(403, { message: msg})
    })

    it('Generic Client Error -> 403 w/ Default message', () => {
        t.genericError(res)

        expect(res.send).toBeCalledWith(403, { message: 'Your request could not be completed'})
    })

    it('Generic Server Error -> 500 w/ Custom Message', () => {
        const msg = 'GenericS'
        t.genericServerError(res, msg)

        expect(res.send).toBeCalledWith(500, { message: msg})
    })

    it('Generic Server Error -> 500 w/ Default Message', () => {
        t.genericServerError(res)

        expect(res.send).toBeCalledWith(500, { message: 'Your request could not be completed'})
    })
})