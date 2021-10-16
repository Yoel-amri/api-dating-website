const { users, notifications } = require("../services/schema/types");
const { v4: uuidv4 } = require('uuid');

async function sendNotification(req, res, next) {
    if ( !req.body.receiver || !req.body.notification_type )
        return res.status(400).send("Please provide keys.");
    const data = { ...req.body };

    const notificationTypes = [
        "like",
        "unlike",
        "match",
        "view",
        "message"
    ];

    console.log('data ===>', data);
    try {
        if ( notificationTypes.indexOf(data.notification_type) === -1 )
            return res.status(400).send(`You have the right to send only these types [ ${notificationTypes} ]`);

        var rows = await users.findMany({
            where: { id: data.receiver },
        });

        if ( !rows[0] )
            return res.status(400).send("This user doesn't exists.");

        rows = await users.findMany({
            where: { username: req.username },
            select: { id: true }
        });
        const sender = rows[0].id;

        await notifications.createOne({
            data: {
                notif_for: data.receiver,
                notif_from: sender,
                notif_type: data.notification_type,
                seen: false
            }
        });

        console.log('sender ==>', sender);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    sendNotification,
};