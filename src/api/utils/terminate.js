const msg = (message) => {
    return { message }
}

export const malformedError = (res, message) => {
    res.send(400, msg(message))
}

export const unauthorizedError = (res, message) => {
    res.send(401, msg(message))
}

export const forbiddenError = (res, message) => {
    res.send(403, msg(message))
}

export const genericError = (res, message) => {
    res.send(403, msg(message || 'Your request could not be completed'))
}

export const genericServerError = (res, message) => {
    res.send(500, msg(message || 'Your request could not be completed'))
}