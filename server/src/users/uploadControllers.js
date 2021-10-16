const { pictures, users } = require("../services/schema/types")

async function uploadProfileImg(req, res, next) {
    try {
        const [{id: userId}] = await users.findMany({
            where: {
                username: req.username,
            },
            select: {
                id: true
            }
        })
        const rows = await pictures.findMany({
            where: {
                owner_id: userId
            }
        })
        if (rows.length) {
            await pictures.update({
                data: {
                    picture_1: req.profileImgName,
                    owner_id: userId
                },
                where: {
                    owner_id: userId,
                }
            })
        }
        else {
            await pictures.createOne({
                data: {
                    owner_id: userId,
                    picture_1: req.profileImgName
                }
            })
        }
        res.status(200).send("Image uploaded succsefully !")
    } catch (e) {
        next(e);
    }
} 

async function uploadProfileImages(req, res, next) {
    try {
        console.log("Dkhol")
        const [{id: userId}] = await users.findMany({
            where: {
                username: req.username,
            },
            select: {
                id: true
            }
        })
        const files = req.files;
        await pictures.update({
            where: {
                owner_id: userId
            },
            data: {
                picture_2: files[0] ? files[0].filename : 0,
                picture_3: files[1] ? files[1].filename : 0,
                picture_4: files[2] ? files[2].filename : 0,
                picture_5: files[3] ? files[3].filename : 0
            }
        })

        return res.status(200).send("Photos uploaded succsefully !")
    } catch (e) {
        next(e)
    }
}

module.exports = {
    uploadProfileImg,
    uploadProfileImages
}