const {databaseModel} = require("../databaseSchema");

const usersColumns = [
    'id',
    'email',
    'password',
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
];

const picturesColumns = [
    'picture_id',
    'picture_name',
    'owner_id'
]

const likesColumns = [
    "like_id",
    "liked_userId",
    "liking_userID",
    "date_like",
    "matched",
    "notify"
]

const viewsColumns = [
    "view_id",
    "viewed_user_id",
    "viewing_user_id",
    "date_view",
    "count_view",
    "notify"
]

const tagsColumns = [
    "tag_id",
    "tag_value"
]

const reportsColumns = [
    "report_id",
    "reporter_id",
    "reported_id"
]

const blocksColumns = [
    "block_id",
    "blocker_id",
    "blocked_id"
]

const macthesColumns = [
    "match_id",
    "user_1",
    "user_2",
    "date_match",
    "notify"	
]

const userSelectedTagsColumns = [
    "user_id",
    "tag_id"
]

const messagesColumns = [
    "message_id",
    "message_content",
    "checked",
    "sender_id",
    "reciever_id",
    "message_date"
]

const notificationsColumns = [
    "notif_id",
    "notif_from",
    "notif_for",
    "notif_type",
    "notif_date",
    "seen"
];

const usersTableName = 'users';

class User extends databaseModel {
    constructor() {
        super(usersColumns, usersTableName);
    }
}

class Pictures extends databaseModel {
    constructor() {
        super(picturesColumns, 'pictures');
    }
}

class Likes extends databaseModel {
    constructor() {
        super(likesColumns, 'likes');
    }
}

class Tags extends databaseModel {
    constructor() {
        super(tagsColumns, 'tags');
    }
}

class Reports extends databaseModel {
    constructor() {
        super(reportsColumns, 'reports');
    }
}

class Blocks extends databaseModel {
    constructor() {
        super(blocksColumns, 'blocks');
    }
}

class Matches extends databaseModel {
    constructor() {
        super(macthesColumns, 'matches');
    }
}

class Views extends databaseModel {
    constructor() {
        super(viewsColumns, 'views');
    }
}

class UserSelectedTags extends databaseModel {
    constructor() {
        super(userSelectedTagsColumns, 'user_selected_tags');
    }
}

class Messages extends databaseModel {
    constructor() {
        super(messagesColumns, 'messages');
    }
}

class Notifications extends databaseModel {
    constructor() {
        super(notificationsColumns, 'notifications');
    }
}

const notifications = new Notifications();
const messages = new Messages();
const userSelectedTags = new UserSelectedTags();
const views = new Views();
const matches = new Matches();
const blocks = new Blocks();
const reports = new Reports();
const tags = new Tags();
const likes = new Likes();
const users = new User();
const pictures = new Pictures();

module.exports = {
    notifications,
    messages,
    userSelectedTags,
    views,
    matches,
    blocks,
    reports,
    tags,
    likes,
    users,
    pictures,
    usersColumns,
    usersTableName
}