///<reference path='../types/DefinitelyTyped/node/node.d.ts'/>
///<reference path='../types/DefinitelyTyped/express/express.d.ts'/>

class Router {
	constructor() {}
	start() {
		var express = require('express');
		var router = express.Router();
		var passport = require('passport');
		var account = require('../models/account');
		var project = require('../models/project');
		var page = require('../models/page');
		var multiparty = require('multiparty');
		var format = require('util').format;
		var fs = require('fs');
		var S3FS = require('s3fs');
		var s3fsImpl = new S3FS('uploadsexynelson', {
			accessKeyId: 'AKIAJBM6BM5AGHUHK77A',
			secretAccessKey: '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'
		});

		/* GET home page. */
		router.get('/', function(req, res, next) {
			project.find({}, function(err, projs) {
				res.render('homepage', {
					title: 'Welcome, GGWP!',
					projs: projs,
					message: req.flash('error') });
			});
		});

		/* GET Register page. */
		router.get('/register', function(req, res) {
			res.render('register', { title: 'Join the Community!', user: req.user});
		});

		/* GET main page. */
		router.get('/main', function(req, res, next) {
			project.find({}, function(err, projs) {
				page.find({}, function(err, pages) {
					res.render('main', {
						title: "Main Hub",
						user: req.user,
						projs: projs,
						pages: pages
					});
				});
			});
		});

		/*GET Project Browsing*/
		router.get('/browse/comics', function(req, res) {
			project.find({}, function(err, projs) {
				page.find({}, function(err, pages) {
					res.render('browse_comics', {
						user: req.user,
						projs: projs,
						pages: pages
					});
				});
			});
		});

		/* BROWSE by rating*/
		router.get('/browse/comics/ratings', function(req, res) {
			project.find({}, function(err, projs) {
				page.find({}, function(err, pages) {


					function rateSort(array, callback) {
						array.sort(function(a, b) {
							var x = a['rating'];
							var y = b['rating'];
							return ((x > y) ? -1 : ((x < y) ? 1 : 0));
						})
						callback();
					}

					function renderShit(callback) {
						res.render('browse_comics', {user: req.user, projs: projs, pages: pages});
					}

					rateSort(projs, function() {
						renderShit(function() {
							console.log(projs);
						});
					});


				});
			});
		});

		/* BROWSE by alphabet */
		router.get('/browse/comics/alpha', function(req, res) {
			project.find({}, function(err, projs) {
				page.find({}, function(err, pages) {


					function alphaSort(array, tag, callback) {
						array.sort(function(a, b) {
							var x = a[tag].toLowerCase();
							var y = b[tag].toLowerCase();
							return ((x < y) ? -1 : ((x > y) ? 1 : 0));
						})
						callback();
					}

					function renderShit(callback) {
						res.render('browse_comics', {user: req.user, projs: projs, pages: pages});
					}

					alphaSort(projs, 'title' , function() {
						renderShit(function() {
							console.log(projs);
						});
					});


				});
			});
		});

		/*GET Contributor Browsing*/
		router.get('/browse/contributors', function(req, res) {
			account.find({}, function(err, accs) {
				res.render('browse_contributor', {user: req.user, accs: accs});
			});
		});

		/*GET Contributor Alphabetically*/
		router.get('/browse/contributors/alpha', function(req, res) {
			account.find({}, function(err, accs) {

				function alphaSort(array, tag, callback) {
					array.sort(function(a, b) {
						var x = a[tag].toLowerCase();
						var y = b[tag].toLowerCase();
						return ((x < y) ? -1 : ((x > y) ? 1 : 0));
					})
					callback();
				}

				function renderShit(callback) {
					res.render('browse_contributor', {user: req.user, accs: accs});
				}

				alphaSort(accs, 'username' , function() {
					renderShit(function() {
						console.log(accs);
					});
				});

			});
		});

		/* Random comic */
		router.get('/random', function(req, res) {
			project.find({}, function(err, projs) {
				page.find({}, function(err, pages) {
					var rand = projs[Math.floor(Math.random() * projs.length)];
					project.findOne({_id: rand._id}).populate('pages').exec(function(err, proj) {
						res.render('viewing_project', {
							user: req.user,
							project: rand,
							pages: rand.pages
						})
					})
				})
			})
		})


		/* GET view page. */
		router.get('/viewing/:_id', function(req, res, next) {
			var id = req.params._id;
			console.log(id);
			project.findOne({_id: id}).populate('pages').exec(function(err, proj) {
				account.findOne({'username': proj.username}).exec(function(err, acc) {
					var blacklist = acc.blacklist;
					res.render('viewing_project', {
						user: req.user,
						project: proj,
						pages: proj.pages,
						blacklist: blacklist
					});
				});
			});
		});

		router.get('/viewing/page/:_id', function(req, res, next) {
			var id = req.params._id;
			console.log(id);
			page.findOne({"_id": id}).populate('prev next').exec(function(err, page) {
				console.log(page);
					res.render('viewing_page', {
						user: req.user,
						page: page
					});
				});
			});

	   /* FAVOURITE function for PROJECT */
		router.get('/fav/comic/:_id', function(req, res, next) {
			var id = req.params._id;
			project.findOne({ "_id": id }, function(err, doc) {
				req.user.favourites.unshift(doc._id);
				req.user.save(function(err, doc) {
					if (err) {
						res.send("Fuck.");
					}
					console.log(doc);
					res.redirect('back');
				});
		   });
		});

	   /* RATE function for PROJECT */
		router.post('/rate/comic/:_id', function(req, res, next) {
			var id = req.params._id;
			console.log(req.body.rating);
			var number = req.body.rating;
			var query = { "_id": id };
			var update = { $inc: { rating: number}, $push: { ratedBy: req.user.username }  };
			project.findOneAndUpdate(query, update, function(err, doc) {
				if (err) {
					console.log('got an error');
				}
				console.log(doc);
				res.redirect('back');
			});
		});

		/* UNLIKE function for PROJECT */
		router.get('/unlike/comic/:_id', function(req, res, next) {
			var id = req.params._id;
			var query = { "_id": id };
			var update = { $inc: { rating: -1 }, $pull: { ratedBy: req.user.username }  };
			project.findOneAndUpdate(query, update, function(err, doc) {
				if (err) {
					console.log('got an error');
			   }
				console.log(doc);
				res.redirect('back');
			});
		});

		/* POST to blacklist */
		router.get('/blacklist/:username', function(req, res) {
			var username = req.params.username;
			var updateMe = req.user.username;
			var query = { 'username': updateMe };
			var update = { $push: {blacklist: username}};
			account.findOneAndUpdate(query, update, function (err, acc) {
				if(err) {
					console.log('got error bitches');
				} else {
					console.log(acc);
					res.redirect('/user/' + username);
					}
			});
		});

		/* REMOVE from blacklist */
		router.get('/blacklist/remove/:username', function(req, res) {
			var username = req.params.username;
			var updateMe = req.user.username;
			var query = { 'username': updateMe };
			var update = { $pull: { blacklist: username } };
			account.findOneAndUpdate(query, update, function(err, acc) {
				if (err) {
					console.log('got error bitches');
				} else {
					console.log(acc);
					res.redirect('/settings')
				}
			});
		});

		/* RATE function for PAGE */
		router.get('/rate/page/:_id', function(req, res, next) {
			var id = req.params._id;
			var query = { "_id": id };
			var update = { $inc: { rating: 1 }, $push: { ratedBy: req.user.username }  };
			page.findOneAndUpdate(query, update, function(err, doc) {
				if (err) {
					console.log('got an error');
				}
				console.log(doc);
				res.redirect('back');
			});
		});

		/* UNLIKE function for PROJECT */
		router.get('/unlike/page/:_id', function(req, res, next) {
			var id = req.params._id;
			var query = { "_id": id };
			var update = { $inc: { rating: -1 }, $pull: { ratedBy: req.user.username }  };
			page.findOneAndUpdate(query, update, function(err, doc) {
			 if (err) {
				console.log('got an error');
				}
				console.log(doc);
				res.redirect('back');
			});
		});


		/* GET profile settings page. */
		router.get('/profile_settings', function(req, res, next) {
			res.render('profileSettings', { title: "Profile Settings", user: req.user});
			});

		/* GET user Profile page */
		router.get('/user/:username', function(req, res, next) {
			// get username from the url
			var username = req.params.username;
			// look in the database for this username
			// if not found return 404
			account.findOne({ "username": username }).populate('projects collabs favourites').exec(function(err, doc) {

				console.log(doc);
				var B_username = doc.username;
				var B_userType = doc.userType;
				console.log(doc.projects);
				console.log(doc.favourites);
				res.render('view_o_profile', { title: "Profile", user: req.user, B_userType: B_userType, B_username: B_username, user_o:doc, projects: doc.projects, favourites: doc.favourites });
			});
		});

		/* GET user Favourite */
		router.get('/user/:username/favourites', function(req, res, next) {
			var username = req.params.username;
			account.findOne({ "username": username }).populate('favourites').exec(function(err, doc) {
			res.render('favourites', { title: "My Favourites", user: req.user, favourites: doc.favourites });

			});
		});

		/* DELETE user Favourite */
		router.get('/deletefav/:_id', function(req, res, next) {
			var id = req.params._id;
			var query = { "_id": req.user._id };
			var update = { $pull: { favourites: id }  };
			account.findOneAndUpdate(query, update, function(err, doc) {
				if (err) {
					console.log('got an error');
				}
				console.log(doc);
				res.redirect('back');
			});
		});

		/* DELETE user Favourite from favourite page */
		router.post('/deletefav', function(req, res, next) {
			var id = req.body.favourite;
			console.log(id);
			var query = { "_id": req.user._id };
			if (!Array.isArray(id)) {
				var update = { $pull: { favourites: id } };
				account.findOneAndUpdate(query, update, function(err, doc) {
					if (err) {
						console.log('got an error');
					}
					console.log(doc);
				});
				res.redirect('back');
			}
			else {
				for (var i = 0; i < id.length; i++) {
					var update = { $pull: { favourites: id[i] } };
					account.findOneAndUpdate(query, update, function(err, doc) {
						if (err) {
							console.log('got an error');
						}
						console.log(doc);
					});
				}
				res.redirect('back');
			}
		});

		/* GET user Collaborations */
		router.get('/user/:username/collabs', function(req, res, next) {
			var username = req.params.username;
			account.findOne({ "username": username }).populate('collabs').exec(function(err, doc) {
				console.log(doc.collabs);
			res.render('collabs', { title: "My Collaborations", user: req.user, collabs: doc.collabs });
			});
		});

		/* POST new profile settings */
		router.post('/profile_settings', function(req, res, next) {
			var form = new multiparty.Form();
			form.parse(req, function(err, fields, files) {
				// File from form upload
				var img = files.pic[0];
				var stream = fs.createReadStream(img.path);
				var filename = img.originalFilename;
				var bio = fields.bio;
				console.log(files);
				console.log(bio);

				s3fsImpl.writeFile(filename, stream).then(function() {
					fs.unlink(img.path, function(err) {
						if (err)
							res.send("error uploading data");
					})
				})
				var id = req.user._id;
				var query = { "_id": id };
				var updateBio = { $set: { "bio": bio } };
				var updatePic = { $set: { "picture": "http://uploadsexynelson.s3.amazonaws.com/" + filename } };

				// if (bio == "" && filename == null) {
				//     res.redirect('/main');
				// } else if (bio != "") {
				if (bio != ''){
					account.findOneAndUpdate(query, updateBio, function(err, doc) {
						if (err) {
							console.log("error");
						}
					});
				}
				if (filename != ''){
					account.findOneAndUpdate(query, updatePic, function(err, doc) {
						if (err) {
							console.log("error");
						}
					});
				}

				// account.findOneAndUpdate(query, updateBio, function(err, doc) {
				//     if (err) {
				//         console.log("error");
				//     } else if (filename != null) {
				//         account.findOneAndUpdate(query, updatePic, function(err, doc) {
				//             if (err) {
				//                 console.log("error");
				//             } //else res.redirect('/main');
				//         })
				//     }
				// })

			res.redirect('/user/'+ req.user.username);
		})
		});


		/* GET upload page. */
		router.get('/projects/create', function(req, res, next) {
			res.render('project_new', { title: "Start a comic!", user: req.user });
		});

		/* Post to Upload Collection. */
		router.post('/create_project', function(req, res, next) {
			var form = new multiparty.Form();
			form.parse(req, function(err, fields, files) {

					var img = files.file[0];
					var title = fields.title;
					var category = fields.category;
					var description = fields.description;
					var filename = img.originalFilename;
					var stream = fs.createReadStream(img.path);
					//upload to amazon s3
					s3fsImpl.writeFile(filename, stream).then(function(){
						fs.unlink(img.path, function(err){
							if (err)
								res.send("error uploading data");
						})
					})
							var Project = new project({
								"title": title,
								"username": req.user.username,
								"description": description,
								"category": category,
								"cover": "http://uploadsexynelson.s3.amazonaws.com/" + filename,
								"rating": 0
							});

							req.user.projects.unshift(Project._id);
							req.user.save(function(err) {
								if (err) {
									res.send("Fuck.");
								}
							})

							Project.save(function(err, req) {
								if (err) {
									res.send("There was a problem adding the information to the database.");
								}
								else {

									res.redirect('main');

								}
							})
			})

		});

		/* POST to Add Page to Project */
		router.post('/project/collaborate/:_id', function(req, res, next) {
			var form = new multiparty.Form();
			var id = req.params._id;
			project.findOne({"_id": id}, function(err, proj) {
			form.parse(req, function(err, fields, files) {
					var proj_auth = proj.username;
					var proj_name = proj.title;
					var img = files.file[0];
					var title = fields.title;
					var filename = img.originalFilename;
					var stream = fs.createReadStream(img.path);
					//upload to amazon s3
					s3fsImpl.writeFile(filename, stream).then(function(){
						fs.unlink(img.path, function(err){
							if (err)
								res.send("error uploading data");
						})
					})
							var Page = new page({
								"title": title,
								"username": req.user.username,
								"project_author": proj_auth,
								"project_name": proj_name,
								"image": "http://uploadsexynelson.s3.amazonaws.com/" + filename,
								"rating": 0,
								"next": null,
								"prev": null
							});

							if (proj.pages.length != 0) {
							Page.prev = proj.pages[proj.pages.length-1];
							var prev_p_id = proj.pages[proj.pages.length-1];
							var prev_page = { "_id": prev_p_id };
							var prev_update = { $set: {"next": Page._id }};
							page.findOneAndUpdate(prev_page, prev_update, function(err, doc) {
								doc.save(function(err) {
									if (err) {
										res.send("Shit.");
									}
								})
							});
						}

							req.user.collabs.unshift(Page._id);
							req.user.save(function(err) {
								if (err) {
									res.send("Fuck.");
								}
							})

								proj.pages.push(Page._id);
								proj.save(function(err) {
									if (err) {
										res.send("Fuck.");
									}
								})

								Page.save(function(err, req) {
									if (err) {
										res.send("There was a problem adding the information to the database.");
									}
									else {
										res.redirect('back');

								}
							})
					})
				});
			});


		/* POST to Add User Service */
		router.post('/register', function(req, res, next) {
			var form = new multiparty.Form();
			form.parse(req, function(err, fields, files) {
				// File from form upload
				console.log(files);
				console.log(fields.userpassword[0]);
				var img = files.pic[0];
				var stream = fs.createReadStream(img.path);
				var filename = img.originalFilename;
				var username = fields.username;
				var userpassword = fields.userpassword[0];
				var userEmail = fields.useremail;
				var userType = fields.usertype;
				var bio = fields.bio;
				var cPassword = fields.confirmpassword;

				s3fsImpl.writeFile(filename, stream).then(function(){
					fs.unlink(img.path, function(err){
						if (err)
							res.send("error uploading data");
					})
				})

				// New user
				var newUser = new User(username, userpassword, userEmail, userType, cPassword, req.files, bio);

				// Set our collection
				//var collection = db.get('accounts');

				// Make new account with passport
				account.register(new account({
					username: newUser.getName(),
					email: newUser.getEmail(),
					userType: newUser.getType(),
					picture: "http://uploadsexynelson.s3.amazonaws.com/" + filename,
					bio: newUser.getBio()
				}), userpassword, function(err, account) {
					if (err) {
						return res.render("register", { info: "Oops! This username already exists! Please try again." });
					}
					res.redirect('/');
				});

		});

			});

				/* GET settings page. */
				router.get('/settings', function(req, res, next) {
					res.render('settings', { title: "Settings", user: req.user});
					});
				/*GET User Settings new password */
				router.post('/settings', function(req, res, next) {
					var id = req.user._id;
					var newPass = req.body.password;
					console.log(id);
					console.log(newPass);
					account.findOne({ "_id": id }, function(err, doc){
						if (err) {
							res.send('error!');
						}
						console.log(doc);
						if (doc) {
							doc.setPassword(newPass, function() {
								doc.save();
								res.redirect('/');
						});
					}
				});
			});

		/* POST to login service */
		router.post('/', passport.authenticate('local', { failureRedirect: '/', failureFlash: true }), function(req, res, next) {
			req.session.save(function(err) {
				if (err) {
					req.flash("error", "wrong username/password");
				}
				res.redirect('main');
			});
		});

		/* POST to login service */
		router.post('/', passport.authenticate('local'), function(req, res, next) {
			req.session.save(function(err) {
				if (err) {
					return next(err);
				}
				res.redirect('main');
			});
		});

		/* GET Logout page */
		router.get('/logout', function(req, res, next) {
			req.logout();
			req.session.save(function(err) {
				if (err) {
					return next(err);
				}
				res.redirect('/');
			});
		});

		router.param('query', function(req, res, next, query) {
			req.query = query;
			next();
		});

		/* SEARCH */
		router.get('/results/:query', function(req, res, next) {
			var terms = req.query.split(' ');
			var regexString = "";
			for (var i = 0; i < terms.length ; i++) {
				regexString += terms[i];
				if(i < terms.length - 1) {
				regexString += '|';
				}
			}

			var reg = new RegExp(regexString, 'ig');

			var resultArray = [];

			function getProjects(name) {
				var promise = project.find({title:name}).exec();
				return promise;
			}

			function getContribs(name) {
				var promise = account.find().and([{username: name}, {userType: 'Contributor'}]).exec();
				return promise;
			}

			function getViews(name) {
				var promise = account.find().and([{username: name}, {userType: 'Viewer'}]).exec();
				return promise;
			}

			function checkThisAsyn(thing) {
				console.log(thing);
			}

			function setProj(name, callback) {
				var projPromise = getProjects(name);
				projPromise.then(function(projects) {
					resultArray.push(projects);
					checkThisAsyn(resultArray);
					callback();
				})
			}

			function setCont(name, callback) {
				var contPromise = getContribs(name);
				 contPromise.then(function(accounts) {
					 resultArray.push(accounts);
					 checkThisAsyn(resultArray);
					 callback();
				 })
			}

			function setView(name, callback) {
				var viewPromise = getViews(name);
					viewPromise.then(function(accounts) {
						resultArray.push(accounts);
						checkThisAsyn(resultArray);
						callback();
					})

			}

			function renderShit(callback) {
				console.log(resultArray[0]);
				console.log(resultArray[1]);
				console.log(resultArray[2]);
				res.render('search_results', {uploads: resultArray[0], contribs: resultArray[1], viewers: resultArray[2], user: req.user, search: req.query});
			}

			setProj(reg, function() {
				setCont(reg, function() {
					setView(reg, function() {
						renderShit(function() {
							console.log(resultArray);
						});
					});
				});
			});


		});

		/* SEARCH by rating */
		router.get('/results/rate/:query', function(req, res, next) {
			var terms = req.query.split(' ');
			var regexString = "";
			for (var i = 0; i < terms.length ; i++) {
				regexString += terms[i];
				if(i < terms.length - 1) {
				regexString += '|';
				}
			}

			var reg = new RegExp(regexString, 'ig');

			var resultArray = [];

			function getProjects(name) {
				var promise = project.find({title:name}).exec();
				return promise;
			}

			function getContribs(name) {
				var promise = account.find().and([{username: name}, {userType: 'Contributor'}]).exec();
				return promise;
			}

			function getViews(name) {
				var promise = account.find().and([{username: name}, {userType: 'Viewer'}]).exec();
				return promise;
			}

			function checkThisAsyn(thing) {
				console.log(thing);
			}

			function setProj(name, callback) {
				var projPromise = getProjects(name);
				projPromise.then(function(projects) {
					resultArray.push(projects);
					checkThisAsyn(resultArray);
					callback();
				})
			}

			function setCont(name, callback) {
				var contPromise = getContribs(name);
				 contPromise.then(function(accounts) {
					 resultArray.push(accounts);
					 checkThisAsyn(resultArray);
					 callback();
				 })
			}

			function setView(name, callback) {
				var viewPromise = getViews(name);
					viewPromise.then(function(accounts) {
						resultArray.push(accounts);
						checkThisAsyn(resultArray);
						callback();
					})

			}

			function renderShit(callback) {
				console.log(resultArray[0]);
				console.log(resultArray[1]);
				console.log(resultArray[2]);
				res.render('search_results', {uploads: resultArray[0], contribs: resultArray[1], viewers: resultArray[2], user: req.user, search: req.query});
			}

			function rateSort(array, callback) {
				array.sort(function(a, b) {
					var x = a['rating'];
					var y = b['rating'];
					return ((x > y) ? -1 : ((x < y) ? 1 : 0));
				})
				callback();
			}

			setProj(reg, function() {
				setCont(reg, function() {
					setView(reg, function() {
						rateSort(resultArray[0], function() {
							renderShit(function() {
								console.log(resultArray);
							});
						});
					});
				});
			});


		});

		/* SEARCH by alphabet*/
		router.get('/results/alpha/:query', function(req, res, next) {
			var terms = req.query.split(' ');
			var regexString = "";
			for (var i = 0; i < terms.length ; i++) {
				regexString += terms[i];
				if(i < terms.length - 1) {
				regexString += '|';
				}
			}

			var reg = new RegExp(regexString, 'ig');

			var resultArray = [];

			function getProjects(name) {
				var promise = project.find({title:name}).exec();
				return promise;
			}

			function getContribs(name) {
				var promise = account.find().and([{username: name}, {userType: 'Contributor'}]).exec();
				return promise;
			}

			function getViews(name) {
				var promise = account.find().and([{username: name}, {userType: 'Viewer'}]).exec();
				return promise;
			}

			function checkThisAsyn(thing) {
				console.log(thing);
			}

			function setProj(name, callback) {
				var projPromise = getProjects(name);
				projPromise.then(function(projects) {
					resultArray.push(projects);
					checkThisAsyn(resultArray);
					callback();
				})
			}

			function setCont(name, callback) {
				var contPromise = getContribs(name);
				 contPromise.then(function(accounts) {
					 resultArray.push(accounts);
					 checkThisAsyn(resultArray);
					 callback();
				 })
			}

			function setView(name, callback) {
				var viewPromise = getViews(name);
					viewPromise.then(function(accounts) {
						resultArray.push(accounts);
						checkThisAsyn(resultArray);
						callback();
					})

			}

			function alphaSort(array, tag, callback) {
				array.sort(function(a, b) {
					var x = a[tag].toLowerCase();
					var y = b[tag].toLowerCase();
					return ((x < y) ? -1 : ((x > y) ? 1 : 0));
				})
				callback();
			}

			function renderShit(callback) {
				console.log(resultArray[0]);
				console.log(resultArray[1]);
				console.log(resultArray[2]);
				res.render('search_results', {uploads: resultArray[0], contribs: resultArray[1], viewers: resultArray[2], user: req.user, search: req.query});
			}

			setProj(reg, function() {
				setCont(reg, function() {
					setView(reg, function() {
						alphaSort(resultArray[0], 'title', function() {
							alphaSort(resultArray[1], 'username', function() {
								alphaSort(resultArray[2], 'username', function() {
									renderShit(function() {
										console.log(resultArray);
									});
								});
							});
						});
					});
				});
			});


		});

		/* SEARCH reverse */
		router.get('/results/reversed/:query', function(req, res, next) {
			var terms = req.query.split(' ');
			var regexString = "";
			for (var i = 0; i < terms.length ; i++) {
				regexString += terms[i];
				if(i < terms.length - 1) {
				regexString += '|';
				}
			}

			var reg = new RegExp(regexString, 'ig');

			var resultArray = [];

			function getProjects(name) {
				var promise = project.find({title:name}).exec();
				return promise;
			}

			function getContribs(name) {
				var promise = account.find().and([{username: name}, {userType: 'Contributor'}]).exec();
				return promise;
			}

			function getViews(name) {
				var promise = account.find().and([{username: name}, {userType: 'Viewer'}]).exec();
				return promise;
			}

			function checkThisAsyn(thing) {
				console.log(thing);
			}

			function setProj(name, callback) {
				var projPromise = getProjects(name);
				projPromise.then(function(projects) {
					resultArray.push(projects);
					checkThisAsyn(resultArray);
					callback();
				})
			}

			function setCont(name, callback) {
				var contPromise = getContribs(name);
				 contPromise.then(function(accounts) {
					 resultArray.push(accounts);
					 checkThisAsyn(resultArray);
					 callback();
				 })
			}

			function setView(name, callback) {
				var viewPromise = getViews(name);
					viewPromise.then(function(accounts) {
						resultArray.push(accounts);
						checkThisAsyn(resultArray);
						callback();
					})

			}

			function renderShit(callback) {
				console.log(resultArray[0]);
				console.log(resultArray[1]);
				console.log(resultArray[2]);
				res.render('search_results', {uploads: resultArray[0], contribs: resultArray[1], viewers: resultArray[2], user: req.user, search: req.query});
			}

			function reverseSort(array, callback) {
				array.reverse();
				callback();
			}

			setProj(reg, function() {
				setCont(reg, function() {
					setView(reg, function() {
						reverseSort(resultArray[0], function() {
							reverseSort(resultArray[1], function() {
								reverseSort(resultArray[2], function() {
									renderShit(function() {
										console.log(resultArray);
									});
								});
							});
						});
					});
				});
			});


		});


		/*GET Category Results*/
					router.get('/categories/:query', function (req, res, next) {
						var category = req.query
						var terms = category.split(' ');
						var regexString = "";
						for (var i = 0; i < terms.length ; i++) {
							regexString += terms[i];
							if(i < terms.length - 1) {
								regexString += '|';
							}
						}

						var reg = new RegExp(regexString, 'ig');

						project.find({"category": reg}).exec(function(err, projects) {
						if (err) {
							next(err);
						} else if (!projects) {
							return res.render('search_results', {results: [], user: req.user, search: req.query});
						} else  {
							console.log(projects);
							return res.render('search_results', {results: projects, user: req.user, search: req.query});
						}
						});
					});

		/*GET Category Results*/
		  router.get('/categories/:query', function (req, res, next) {
			var category = req.query
			var terms = category.split(' ');
			var regexString = "";
			for (var i = 0; i < terms.length ; i++) {
			  regexString += terms[i];
			  if(i < terms.length - 1) {
				regexString += '|';
			  }
			}

			var reg = new RegExp(regexString, 'ig');

			project.find({"category": reg}).exec(function(err, projects) {
			if (err) {
			  next(err);
			} else if (!projects) {
			  return res.render('search_results', {results: [], user: req.user});
			} else  {
			  console.log(projects);
			  return res.render('search_results', {results: projects, user: req.user});
			}
			});
		  });

		/* DELETE from accounts collection */
		router.get('/delete/:_id', function(req, res, next) {
		var id = req.params._id;

		account.remove({"_id": id}, function(err, res) {
		})
		res.redirect('/');

		});

		module.exports = router;
	}
}
interface pageInterface {
	getTitle();
	getUserName();
	getProjAuth();
	getProjName();
	getImage();
	getDate();
	getRating();
	getNext();
	getPrev();
}

class Page implements pageInterface{
	title: string;
	userName: string;
	project_author: string;
	project_name: string;
	image: string;
	date: number;
	rating: number;
	ratedBy: string[];
	next: Page;
	prev: Page;
	constructor(title: string, userName: string, projAuth: string, projName: string, image: string){
		this.title = title;
		this.userName = userName;
		this.project_author = projAuth;
		this.project_name = projName;
		this.image = image;
		this.date = Date.now();
	}
	getTitle() {
		return this.title;
	}
	getUserName() {
		return this.userName;
	}
	getProjAuth() {
		return this.project_author;
	}
	getProjName() {
		return this.project_name;
	}
	getImage() {
		return this.image;
	}
	getDate() {
		return this.date;
	}
	getRating() {
		return this.rating;
	}
	getNext() {
		return this.next;
	}
	getPrev() {
		return this.prev;
	}
}

interface projectInterface {
	getCover();
	getTitle();
	getCategory();
	getUsername();
	getDescription();
	getDate();
	getRating();
}

class Project implements projectInterface{
	cover: string;
	userName: string;
	description: string;
	title: string;
	category: string;
	date: number;
	rating: number;
	ratedBy: string[];
	pages: Page[];
	constructor(name: string, cover: string, description: string, title: string, category: string){
		this.userName = name;
		this.cover = "http://uploadsexynelson.s3.amazonaws.com/" + cover;
		this.description = description;
		this.title = title;
		this.category = category;
		this.date = Date.now();
	}
	getCover() {
		return this.cover;
	}
	getUsername(){
		return this.userName;
	}
	getTitle() {
		return this.title;
	}
	getCategory() {
		return this.category;
	}
	getDescription() {
		return this.description;
	}
	getDate() {
		return this.date;
	}
	getRating() {
		return this.rating;
	}
}

interface UserInterface {
	getName();
	getPassword();
	getEmail();
	getType();
	getConfirm();
	getPic();
	getBio();
	addProject(project: Project);
}

class User implements UserInterface {
	userName: string;
	userPassword: string;
	userEmail: string;
	userType: string;
	userConfirm: string;
	picture: string;
	bio: string;
	projects: Project[];
	collabs: Page[];
	constructor(name: string, password: string, email: string, type: string, confirm: string, pic: string, bio: string) {
		this.userName = name;
		this.userPassword = password;
		this.userEmail = email;
		this.userType = type;
		this.userConfirm = confirm;
		this.picture = pic;
		this.bio = bio;
	}
	 addProject(project: Project) {
		 this.projects.push(project);
	 }
	getName() {
		return this.userName;
	}
	getPassword() {
		return this.userPassword;
	}
	getEmail() {
		return this.userEmail;
	}
	getType() {
		return this.userType;
	}
	getConfirm() {
		return this.userConfirm;
	}
	getPic(){
		return this.picture;
	}
	getBio(){
		return this.bio;
	}
}

var router = new Router();
router.start();
