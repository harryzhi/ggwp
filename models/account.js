///<reference path='../types/DefinitelyTyped/node/node.d.ts'/>
///<reference path='../types/DefinitelyTyped/express/express.d.ts'/>
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');
var Account = new Schema({
    username: String,
    password: String,
    email: String,
    userType: String,
    picture: String,
    bio: String,
    projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
    collabs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Page' }],
    favourites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
    blacklist: Array
});
Account.plugin(passportLocalMongoose);
module.exports = mongoose.model('Account', Account);
