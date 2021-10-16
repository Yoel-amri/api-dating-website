const { users, blocks, reports } = require("../services/schema/types");

async function block(req, res, next) {
    if ( !req.body.blockedId )
        return res.status(400).send("Please enter the id.");
    const blockedId = req.body.blockedId;
    console.log('blockedId ==>', blockedId);

    try {
        var rows = await users.findMany({
			where: { id: blockedId },
			select: { id: true }
        });
		
		// check if blockedId exists
        if ( !rows.length )
            return res.status(400).send("This user doesn't exists.");
        
		rows = await users.findMany({
            where: { username: req.username },
			select: { id: true }
        });
        const blockerId = rows[0].id;
        
        rows = await blocks.findMany({
            where: {
                blocker_id: blockerId,
                blocked_id: blockedId
            },
            select: { block_id: true }
        });
        
        if ( rows.length )
            return res.status(400).send("This user is already blocked.");
        
        await blocks.createOne({
            data: {
                blocker_id: blockerId,
                blocked_id: blockedId
            }
        });
        console.log('rows ==> ', rows);
        console.log('blockerID ===>', blockerId);   
    } catch (error) {
        next(error);
    }

    return res.status(200).send(blockedId);
}

async function report(req, res, next) {
	if ( !req.body.reportedId )
		return res.status(400).status("Please enter the id.");
	const reportedId = req.body.reportedId;

	try {
		var rows = await users.findMany({
			where: { id: reportedId },
			select: { id: true }
		});

		if ( !rows.length )
			return res.status(400).send("This user doesn't exists.");

		rows = await users.findMany({
			where: { username: req.username },
			select: { id: true }
		});
		const reporterId = rows[0].id;

		rows = await reports.findMany({
			where: {
				reporter_id: reporterId,
				reported_id: reportedId
			},
			select: { report_id: true }
		});

		if ( rows.length )
			return res.status(400).send("This user is already reported.");
		await reports.createOne({
			data: {
				reporter_id: reporterId,
				reported_id: reportedId
			}
		});
		return res.status(400).send(reportedId);

	} catch (error) {
		next(error);
	}
}

module.exports = {
    block,
	report
};
