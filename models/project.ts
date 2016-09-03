///<reference path='../types/DefinitelyTyped/node/node.d.ts'/>
///<reference path='../types/DefinitelyTyped/express/express.d.ts'/>
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Project = new Schema({
    title: String,
    username: String,
    description: String,
    category: String,
    cover: String,
    rating: Number,
    ratedBy: Array,
    date: Date,
    pages: [ {type: mongoose.Schema.Types.ObjectId, ref: 'Page'} ],
    blacklist: Array
});

module.exports = mongoose.model('Project', Project);
