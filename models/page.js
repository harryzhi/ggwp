///<reference path='../types/DefinitelyTyped/node/node.d.ts'/>
///<reference path='../types/DefinitelyTyped/express/express.d.ts'/>
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Page = new Schema({
    title: String,
    username: String,
    project_author: String,
    project_name: String,
    image: String,
    rating: Number,
    ratedBy: Array,
    date: Number,
    next: { type: mongoose.Schema.Types.ObjectId, ref: 'Page' },
    prev: { type: mongoose.Schema.Types.ObjectId, ref: 'Page' }
});
module.exports = mongoose.model('Page', Page);
