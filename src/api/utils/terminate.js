const msg = (message) => {
    return { message }
}

export const malformedError = (res, message) => {
    res.send(400, msg(message))
}

export const forbiddenError = (res, message) => {
    res.send(403, msg(message))
}

export const genericError = (res, message) => {
    res.send(403, msg(message))
}