const { messages, users } = require("../services/schema/types");
const { v4: uuidv4 } = require('uuid');



async function sendMessage(req, res, next) {
    if (!req.body.message || !req.body.reciever_id)
        return res.status(400).send("Please provide a message and a reciever");
    try {
        const recieverExists = await users.findMany({
            where: {
                id: req.body.reciever_id
            }
        })
        /// Checking if user exists
        if (!recieverExists[0])
            return res.status(400).send("User doesn't exist");
        // Getting logged user ID
        let loggedUserId = await users.findMany({
            where: {
                username: req.username
            },
            select: {
                id: true
            }
        })
        loggedUserId = loggedUserId[0].id
        const message_id = uuidv4()
        await messages.createOne({
            data: {
                message_id: message_id,
                message_content: req.body.message,
                reciever_id: req.body.reciever_id,
                sender_id: loggedUserId
            }
        })
        return res.status(201).send({
            message_id,
            message: req.body.message,
            reciever_id: req.body.reciever_id
        })
    } catch (e) {
        next(e);
    }
}

async function getMessage(req, res, next) {
    if (!req.params.message_id)
        return res.status(400).send("Please provide a message id !");
    const message_id = req.params.message_id;
    try {
        const rows = await messages.findMany({
            where: {
                message_id,
            },
            select: {
                message_content: true
            }
        })
        if (!rows[0])
            return res.status(400).send("This message doesn't exist !");
        return res.status(200).send({
            message_content: rows[0].message_content
        })
    } catch (e) {
        next(e);
    }
}

module.exports = {
    sendMessage,
    getMessage
}