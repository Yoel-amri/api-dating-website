const { nameValidator, tagValidator } = require("../lib/inputValidator");
const { users, tags } = require("../services/schema/types");

function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2-lat1);  // deg2rad below
    var dLon = deg2rad(lon2-lon1); 
    var a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
      ; 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI/180)
};
  

function validateRange(range, min, max) {
    if (!Array.isArray(range))
        return false;
    if (range.length !== 2)
        return false;
    if (!isFinite(range[0]) || !isFinite(range[1]))
        return false;
    if (range[0] < min || range[1] > max || range[0] > range[1])
        return false;
    return true;    
}

function validateTags(tags) {
    for (tag of tags) {
        if (!tagValidator(tag))
            return false;
    }
    return true;
}

function decideSexuality(sexuality, sex) {
    console.log("parameters", sexuality, sex)
    if (sexuality === "heterosexual" && sex === "male") {
        return `users.sex = 'female' AND users.sexuality != 'homosexual'`;
    }
    else if (sexuality === "heterosexual" && sex === "female") {
        return ` users.sexuality != 'homosexual' AND users.sex = 'male'`;
    }
    else if (sexuality === "homosexual" && sex === "male") {
        return ` users.sexuality != 'heterosexual' AND users.sex = 'male'`;
    }
    else if (sexuality === "homosexual" && sex === "female") {
        return ` users.sexuality != 'heterosexual' AND users.sex = 'female'`;
    }
    else if (sexuality === "bisexual" && sex === "female") {
        return ` ((users.sexuality != 'homosexual' AND users.sex = 'male') OR (users.sexuality != 'heterosexual' AND users.sex = 'female'))`;
    }
    else if (sexuality === "bisexual" && sex === "male") {
        return ` ((users.sexuality != 'homosexual' AND users.sex = 'female') OR (users.sexuality != 'heterosexual' AND users.sex = 'male'))`;
    }
}

const sortByTags = (user1, user2) => {
    const countOne = user1.selected_tags !== null ? user1.selected_tags.split(',').length : 0;
    const countTwo = user2.selected_tags !== null ? user2.selected_tags.split(',').length : 0;
    if (countOne > countTwo)
        return -1;
    else if (countOne < countTwo)
        return 1;
    else
        return 0;
}

async function getProposals(req, res, next) {
    let request = {...req.query};
    const sortByParams = ['age', 'famerate', 'distance', 'tags'];

    if (request.age && !validateRange(request.age, 18, 100))
        return res.status(400).send("Please send a valid age [startAge, endAge] !");
    else if (!request.age)
        request.age = [0, 100]
    if (request.popularity && !validateRange(request.popularity, 0, 100))
        return res.status(400).send("Please send a valid popularity range!");
    else if (!request.popularity)
        request.popularity = [0, 100];

    if (request.distance && !validateRange(request.distance, 0, 200))
        return res.status(400).send("Please send a valid distance");
    else if (!request.distance)
        request.distance = [0, 200];
        
    if (request.tags) {
        if (!Array.isArray(request.tags) || request.tags.length > 20 || !validateTags(request.tags))
            return res.status(400).send("Please send valid tags");
    }
    else if (!request.tags)
        request.tags = [];

    if (!request.page_size || !request.page_number || !isFinite(request.page_number) || !isFinite(request.page_size)) {
        request.page_size = 25;
        request.page_number = 0;
    }
    if (request.page_size > 25)
        res.status(400).send('Cannot query more than 25 items');
    if (request.sortBy && sortByParams.indexOf(request.sortBy) === -1)
        res.status(400).send(`Can only sort by ${sortByParams}`);
    if (!request.sortBy)
        request.sortBy = "'distance'";
    
    /// Getting user sexuality, sex, position and checking it !!!
    const [{sexuality: userSexualitty, sex: userSex, latitude: userLatitude, longitude: userLongitude}] = await users.findMany({
        where: {
            username: req.username
        },
        select: {
            sexuality: true,
            sex: true,
            longitude: true,
            latitude: true,
        }
    })

    if (!userSexualitty || !userSex || !userLongitude || !userLatitude)
        return res.status(400).send("Please update your profile sex and interesst and position");
    
    var rows = await users.findMany({
        where: {
            AND: [
                {
                    gt: {
                        ["timestampdiff(YEAR, users.birthday, CURRENT_DATE())"]: request.age[0]
                    },
                },
                {
                    ls: {
                        ["timestampdiff(YEAR, users.birthday, CURRENT_DATE())"]: request.age[1]
                    }
                },
                {
                    verified: '1',
                },
                {
                    ls: {
                        famerate: request.popularity[1]
                    }
                },
                {
                    gt: {
                        famerate: request.popularity[0]
                    }
                },
                {
                    ls: {
                        [`ST_Distance_Sphere(point(users.longitude, users.latitude),point(${userLongitude},${userLatitude}))`]: request.distance[1]
                    }
                },
                {
                    pureSql: decideSexuality(userSexualitty, userSex)
                },
                {
                    pureSql: request.tags.length ? `T.tag_value in (${request.tags.map((tag) => `'${tag}'`)}) and users.id = US.user_id AND US.tag_id = T.tag_id` : '1 = 1',
                }
            ],
        },
        select: {
            id: true,
            famerate: true,
            ["(SELECT group_concat(concat(TT.tag_value) separator ',') FROM tags TT, user_selected_tags UT WHERE TT.tag_id = UT.tag_id AND UT.user_id = users.id) AS selected_tags"] : true,
            [`timestampdiff(YEAR, users.birthday, CURRENT_DATE()) as 'age'`]: true,
            [`ST_Distance_Sphere(point(users.longitude, users.latitude),point(${userLongitude},${userLatitude})) as 'distance'`]: true
        },
        limit: request.page_size,
        offset: request.page_size * request.page_number,
        from: `users ${request.tags.length ? ', user_selected_tags US, tags T' : ''}`,
        orderBy: request.sortBy !== 'tags' ? request.sortBy : "'distance'"
    })
    rows = rows.map((row) => {
        return ({
            ...row,
            link: `api/users/getUserData/${row.id}`
        })
    })
    if (request.sortBy === 'tags') {
        rows.sort(sortByTags);
    }
    res.status(200).send(rows)
}


module.exports = {
    getProposals
}