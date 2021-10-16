const {
    validateSignUpInput,
    validateUpdateInput,
    validateSignInInput,
    validateResetInput
} = require("../lib/inputValidator");
const {
    hashPassword,
} = require("../lib/hashPassword");
const {users, pictures, likes, views, matches, blocks, reports, tags, userSelectedTags} = require("../services/schema/types");
const { v4: uuidv4 } = require('uuid');
const { sendMail } = require('../lib/emails/mailer')
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
var fs = require('fs');

async function signUp(req, res,next) {

    /// Checking client data 
    if (!req.body.username || !req.body.email || !req.body.firstname || !req.body.lastname || !req.body.password || !req.body.passwordConfirmation) {
        return res.status(400).send('Bad keys');
    }
    const userData = {
        ...req.body
    }

    /// NEED TO CHECK EMAIL REGEX !!!!!!!!!!!!!
    const validationErrorsString = validateSignUpInput(userData);
    if (validationErrorsString) {
        return res.status(400).send(validationErrorsString);
    }

    /// Adding user record to database
    userData.id = uuidv4();
    try {
        await users.createOne({
            data: {
                id: userData.id,
                username: userData.username,
                firstname: userData.firstname,
                lastname: userData.lastname,
                email: userData.email,
                password: await hashPassword(req.body.password),
                verified: false
            },
        })
    } catch (e) {
        return next(e);
    }

    /// Creating user photos repo and database column
    try {
        var userPicturesDir = `./public/${userData.id}`;
        if (!fs.existsSync(userPicturesDir)) {
            fs.mkdirSync(userPicturesDir, { recursive: true });
        }
        await pictures.createOne({
            data: {
                owner_id: userData.id
            }
        })
    } catch (e) {
        next(e);
    }

    // Sending confirmation email...
    const emailVerificationToken = jwt.sign(userData.username, process.env.APP_SECRET);
    try {
        await sendMail(userData.email, 'Please, click here to confirm your email', `${process.env.APP_HOSTNAME}/api/users/confirmMail/${emailVerificationToken}`);
    }
    catch (e) {
        return res.status(200).send('User created but failed to send verification email !');
    }
    
    return res.status(200).send(userData);
}

async function confirmMail(req, res, next) {
    const token = req.params.token;
    try {
        const username = await jwt.verify(token, process.env.APP_SECRET)
        // console.log("TOKEN VERIFIED for user : ", username);
        const rows = await users.findMany({
            where: {
                username,
            }
        })
        // console.log("ROWS ARE ====> ", rows[0]);
        const userData = rows[0]
        if (userData && userData.verified) {
            return res.status(400).send('User already verified');
        } else {
            await users.update({
                where: {
                    id: userData.id
                },
                data: {
                    verified: true
                }
            })
            return res.status(200).send('User verified !');
        }

    } catch (e) {
        next(e)
    }
}

async function login(req, res, next) {
    if (!req.body.username || !req.body.password)
        return res.status(400).send('Username or password not provided !');
    
    const AuthData = {
        username: req.body.username,
        password: req.body.password
    };

    /// NEED TO CHECK EMAIL REGEX !!!!!!!!!!!!!
    const validationErrorsString = validateSignInInput(AuthData);
    if (validationErrorsString) {
        return res.status(400).send(validationErrorsString);
    }

    try {
        const rows = await users.findMany({
            where: {
                username: req.body.username
            }
        });

        if ( !rows.length )
            return res.status(400).send("Uncorrect username or password");

        const matches = await bcrypt.compare(AuthData.password, rows[0].password);
        if ( !matches || AuthData.username !== rows[0].username )
            return res.status(400).send("Uncorrect username or password");

        if ( !rows[0].verified )
            return res.status(400).send("Your account is not verified, please check your email");
            
        const userToken = jwt.sign(AuthData.username, process.env.APP_SECRET);
        // console.log(userToken);
        return res.cookie('accessToken', userToken, {
            maxAge: 30000000,
            httpOnly: true,
        }).status(200).send("user logged in and cookie set");
            
    } catch (e) {
        next(e);
    }
}


async function getUserData(req, res, next) {
    if (!req.params.id)
    res.status(400).send("Please provide a username!");
    
    const { id } = req.params;
    const queryKeys = Object.keys(req.body)
    const query = req.body;
    const AvailableFields = [
        'id',
        'username',
        'email',
        'firstname',
        'lastname',
        'sex',
        'sexuality',
        'longitude',
        'latitude',
        'bio',
        'birthday',
        'famerate',
        'connected',
        'verified',
        'picture',
        'like',
        'view',
        'match',
        'report',
        'block',
        'tag',
    ];

    /// Preventing sql injection
    for (key in queryKeys) {
        if (!AvailableFields.includes(queryKeys[key]))
            return res.status(400).send(`${queryKeys[key]} doesn't exist`);
    }

    const {picture: picture, tag: tag, view: view, like: like, report: report, block: block, match: match , ...UserDataQuery} = query;
    let userData;
    try {
        userData = await users.findMany({
            where : {
                id: id,
            },
            select: {
                ...UserDataQuery
            }
        });
        if (!userData[0])
            return res.status(400).send("User doesnt exist");
        if (userData[0])
            delete userData[0].password;        
        if (picture) {
            const [userPictures] = await pictures.findMany({
                where: {
                    owner_id: id
                },
                select: {
                    picture_1: true,
                    picture_2: true,
                    picture_3: true,
                    picture_4: true,
                    picture_5: true,
                }
            });
            userData[0].pictures = userPictures;
        }

        if (like) {
            const userLikes = await likes.findMany({
                where: {
                    liked_userId: id
                },
                select: {
                    liking_userID: true
                }
            });
            userData[0].likes = userLikes
        }

        if (view) {
            const userViews = await views.findMany({
                where: {
                    viewed_user_id: id
                },
                select: {
                    viewing_user_id: true
                }
            });
            userData[0].views = userViews
        }

        if (tag) {
            const userTags = await userSelectedTags.findMany({
                where: {
                    user_id: id
                },
                select: {
                    tag_id: true
                }
            });
            let tagsValues = [];
            if (userTags.length) {
                tagsValues = await tags.findMany({
                    where: {
                        OR: userTags.map((t) => {
                                return {
                                    tag_id: t.tag_id
                                }
                            })
                    },
                    select: {
                        tag_value: true
                    }
                });
            }

            userData[0].tags = tagsValues;
        }

        if (match) {
            const userMatchesIds = await matches.findMany({
                where: {
                    OR: [
                        {
                            user_1: id,
                        },
                        {
                            user_2: id
                        }
                    ]
                },
                select: {
                    user_1: true,
                    user_2: true
                }
            });
            userData[0].matches = userMatchesIds;
        }

        if (block) {
            const userBlocks = await blocks.findMany({
                where: {
                    blocked_id: id
                },
                select: {
                    blocker_id: true
                }
            });
            userData[0].blocks = userBlocks;
        }
        if (report) {
            const userReports = await reports.findMany({
                where: {
                    reported_id: id
                },
                select: {
                    reporter_id: true
                }
            });
            userData[0].reports = userReports;
        }

        return res.status(200).send(userData);
    } catch (e) {
        next(e);
    }
}


const authenticateUser = (req, res, next) => {
    const userToken = req.cookies['accessToken'];
    if (!userToken) return res.status(401).send("You're not logged in, please log in !");
    jwt.verify(userToken, process.env.APP_SECRET, (err, user) => {
        if (err) return res.status(403).send("Token expired or is not verified, please login !");
        req.username = user;
        next();
    })
}

async function logOut(req, res, next) {
    res.clearCookie('accessToken');
    res.send('cookie cleared and user logged out')
}

async function like(req, res, next) {
    if (!req.body.user_id)
        return res.status(400).send("Please provide a user id to like.");
    const liked_userId = req.body.user_id;
    try {
        const likedUserExist = await users.findMany({
            where: {
                id: liked_userId
            },
            select: {
                id: true
            }
        })
        if (!likedUserExist[0])
            return res.status(400).send("User doesn't exist");
        let loggedUserId = await users.findMany({
            where: {
                username: req.username
            },
            select: {
                id: true
            }
        })

        loggedUserId = loggedUserId[0].id;

        /// User must have at least one picture to like other users :)
        const userPictures = await pictures.findMany({
            where: {
                owner_id: loggedUserId
            }
        })
        if (!userPictures.length)
            return res.status(400).send("You should have at least one picture to like other users !");

        /// Check if user is already liked
        const alreadyLiked = await likes.findMany({
            where: {
                liked_userId: liked_userId,
                liking_userID: loggedUserId
            }
        })
        if (alreadyLiked[0])
            return res.status(400).send("User already liked !");
        /// Actually liking the user
        const rows = await likes.createOne({
            data: {
                liked_userId: liked_userId,
                liking_userID: loggedUserId
            }
        });
        /// Check if user likes you back
        const likingBack = await likes.findMany({
            where: {
                liked_userId: loggedUserId,
                liking_userID: liked_userId 
            }
        })
        //// Creating a match
        if (likingBack.length) {
            await matches.createOne({
                data: {
                    user_1: loggedUserId,
                    user_2: liked_userId,
                }
            })
        }
        return res.status(201).send(req.body.user_id);
    } catch (e) {
        next(e);
    }
}

async function view(req, res, next) {
    if (!req.body.user_id)
        return res.status(400).send("Please provide a user id !");
    const viewed_user_id = req.body.user_id;
    try {
        const found = await users.findMany({
            where: {
                id: viewed_user_id,
            }
        });
        if (!found[0])
            return res.status(400).send("User doesn't exist !");
        let loggedUserId = await users.findMany({
            where: {
                username: req.username
            },
            select: {
                id: true
            }
        });
        loggedUserId = loggedUserId[0].id;
        const rows = await views.findMany({
            where: {
                viewed_user_id: viewed_user_id,
                viewing_user_id: loggedUserId,
            },
        });
        if (rows.length) {
            await views.update({
                data: {
                    count_view: rows[0].count_view + 1
                },
                where: {
                    viewed_user_id: viewed_user_id,
                    viewing_user_id: loggedUserId,
                }
            }) ;   
        }
        else {
            await views.createOne({
                data: {
                    viewed_user_id: viewed_user_id,
                    viewing_user_id: loggedUserId,
                }
            });
        }
        return res.status(201).send(viewed_user_id);
    } catch (e) {
        return next(e);
    }
}

async function update(req, res, next) {
    const userData = { ...req.body };
    var clearData = {};
    const bodyColumns = [
        'email',
        'password',
        'passwordConfirmation',
        'username',
        'firstname',
        'lastname',
        'sex',
        'sexuality',
        'longitude',
        'latitude',
        'bio',
        'birthday'
    ];

    const requiredFields = [
        'username',
        'email',
        'password',
        'passwordConfirmation',
        'firstname',
        'lastname'
    ];
    
    // check if the data is empty
    if ( Object.keys(userData).length === 0 ) {
        return res.status(400).send("This user doesn't exists !");
    }
    // Catch data to be update
    for ( field in userData ) {
        if ( requiredFields.includes(field) && !userData[field] )
            return res.status(400).send(`${field} can not be empty !`);
        if ( bodyColumns.includes(field) ) {
            clearData[field] = userData[field];
        }
    }

    // Updating database
    try {
        // Validate fields
        const validationErrorsString = validateUpdateInput(clearData)
        if ( validationErrorsString )
            return res.status(400).send(validationErrorsString);

        const rows = await users.findMany({
            where: {
                username: req.username
            }
        });

        if ( !rows.length )
            return res.status(400).send("This user doesn't exists !");

        if ( 'passwordConfirmation' in clearData ) {
            const hashedPass = await hashPassword(clearData.password);
            clearData.password = hashedPass;
            delete clearData.passwordConfirmation;
        }

        await users.update({
            data: clearData,
            where: {
                username: req.username
            }
        });
    
        if ( 'email' in clearData && clearData.email !== rows[0].email ) {
            clearData = { ...clearData, verified: 0};

            const emailVerificationToken = jwt.sign(clearData.username, process.env.APP_SECRET);
            try {
                await sendMail(userData.email, 'Please, click here to confirm your email', `${process.env.APP_HOSTNAME}/api/users/confirmMail/${emailVerificationToken}`);
            }
            catch (e) {
                return res.status(200).send('User created but failed to send verification email !');
            }
        }
        
        
        if ( 'username' in clearData ) {

            const accessToken = jwt.sign(clearData.username, process.env.APP_SECRET);
            res.clearCookie('accessToken');
            res.cookie('accessToken', accessToken, {
                maxAge: 30000000,
				httpOnly: true,
            });
        }

        if ('verified' in clearData)
            delete clearData.verified;
        return res.status(201).send(clearData);

    } catch (error) {
        return next(error);
    }
}

async function unlike(req, res, next) {
    if (!req.body.user_id)
        return res.status(400).send("Please provide a user id to unlike.");
    const liked_userId = req.body.user_id;
    try {
        let loggedUserId = await users.findMany({
            where: {
                username: req.username
            },
            select: {
                id: true
            }
        })
        loggedUserId = loggedUserId[0].id;

        // Check likes
        const likeRows = await likes.findMany({
            where: {
                liked_userId: liked_userId,
                liking_userID: loggedUserId
            }
        });

        if ( !likeRows.length )
            return res.status(400).send("You have to like this user to unlike it.");

        // Delete like if already exists
        if ( likeRows[0].liked_userId === liked_userId) {
            await likes.delete({
                where: {
                    liking_userID: loggedUserId,
                    liked_userId: liked_userId
                }
            });
        }
        // Check matches
        const matchRows = await matches.findMany({
            where: {
                OR: [
                    {
                        user_1: liked_userId,
                        user_2: loggedUserId
                    },
                    {
                        user_1: liked_userId,
                        user_2: loggedUserId
                    }
                ]
            }
        });

        // Delete match if already matches
        if ( matchRows.length ) {
            await matches.delete({
                where: {
                    OR: [
                        {
                            user_1: liked_userId,
                            user_2: loggedUserId
                        },
                        {
                            user_1: liked_userId,
                            user_2: loggedUserId
                        }
                    ]
                }
            });
        }

        return res.status(201).send(req.body.user_id);
    } catch (e) {
        next(e);
    }
}

async function resetPassword(req, res, next) {
    if ( !req.body.username || !req.body.password || !req.body.passwordConfirmation )
        return res.status(400).send("Please provide the keys.");
    const data = {...req.body};

    try {
         // Validate fields
        const validationErrorsString = validateResetInput(data)
        if ( validationErrorsString )
            return res.status(400).send(validationErrorsString);

        // Search for the user in the database end check if exists
        const rows = await users.findMany({
            where: { username: data.username }
        });

        if ( !rows[0] )
            return res.status(400).send("This user doesn't exists.");
        
        // Hash password
        const hashedPass = await hashPassword(data.password);
        data.password = hashedPass;

        console.log('data ====>', data);

        await users.update({
            data: {
                password: data.password
            },
            where: { username: data.username }
        });
        
    } catch (error) {
        next(error);
    }
    return res.status(200).send({ username: data.username });
}

module.exports = {
    view,
    like,
    logOut,
    authenticateUser,
    signUp,
    confirmMail,
    login,
    getUserData,
    update,
    unlike,
    resetPassword,
};