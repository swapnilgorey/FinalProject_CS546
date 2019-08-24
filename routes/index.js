const data = require("../data");
const postData = data.posts;
const userData = data.users;

const loginSuccess = async (req, res, next) => {
    const { email, password } = req.body;
    const user = await userData.authenticate(email, password)
    console.log("reached login success again after authenticating")
    try {
        if (Object.keys(user).length > 0) {
            var hour = 3600000
            req.session.name = 'AuthCookie'
            req.session.user = user
            req.session.cookie.expires = new Date(Date.now() + hour)
            req.session.cookie.maxAge = hour

        }
        else {
            res.error = 'Invalid username or password';
        }

    } catch (e) {
        next(e);
    }
    next();
};

const constructorMethod = app => {

    app.get('/', async (req, res) => {
        if (req.session.name == 'AuthCookie') {
            isUserLoggedIn = true
            var postsList = await postData.getAllPosts();
            posts = postsList.length > 0 ? true : false;
            const favoritePosts = await userData.getUserFavoritePostsById(req.session.user.id);
            for (let i = 0; i < postsList.length; i++) {
                for (let j = 0; j < favoritePosts.length; j++) {
                    if (postsList[i]._id === favoritePosts[j]._id) {
                        postsList[i].isLiked = true;
                    }
                }
            }
            res.render('home',
                {
                    posts: postsList,
                    isUserLoggedIn: isUserLoggedIn,
                    user: req.session.user,
                    message: "Be the first one to create a blog."
                });

        }
        else {
            isUserLoggedIn = false
            var postsList = await postData.getAllPosts();
            posts = postsList.length > 0 ? true : false;
            postsList.forEach(element => {
                element.isLiked = false;
            });
            res.render('home', {
                posts: postsList,
                message: "Be the first one to create a blog.",
                error: req.query.error ? req.query.error : null

            });
        }
    });

    app.get('/addBlog', (req, res) => {
        if (req.session.name == 'AuthCookie') {
            isUserLoggedIn = true
            const user = req.session.user;
            const title = 'Welcome ' + user.name;
            res.render('addBlog', { title: title, user: user, isUserLoggedIn: isUserLoggedIn });
        } else {
            res.status(403);
            url = req.url;
            res.render('error', { title: '403', url: url });
        }
    });
    app.get('/userdetails/:id', async (req, res) => {
        if (req.session.name == 'AuthCookie') {
            isUserLoggedIn = true
            const followingList = await userData.getUserFollowingUserListById(req.session.user.id);
            console.log(followingList);
            if (req.params.id) {
                const selectedUser = await userData.getUserById(req.params.id);
                const loggedInUser = await userData.getUserById(req.session.user.id);
                followingList.forEach(followingUser => {
                    if (followingUser.id === selectedUser.id) {
                        selectedUser['alreadyFollowing'] = true;
                    }
                    // } else {
                    //     selectedUser['alreadyFollowing'] = false;  //follow unfollow bug fixed
                    // }
                });
                const isLoggedInUser = selectedUser.id === loggedInUser.id ? true : false;
                res.render('userdetails', { isUserLoggedIn: isUserLoggedIn, selectedUser: selectedUser, user: loggedInUser, isLoggedInUser: isLoggedInUser });
            }
        } else {
            res.redirect('/')
        }
    });

    app.post('/userdetails', loginSuccess, async (req, res) => {
        if (req.session.name == 'AuthCookie') {
            const loggedInUser = await userData.getUserById(req.session.user.id);
            isUserLoggedIn = true
            res.render('userdetails', { isUserLoggedIn: isUserLoggedIn, selectedUser: loggedInUser, user: loggedInUser, isLoggedInUser: true });
        }
        else {
            res.redirect('/?error=' + encodeURIComponent(res.error));
        }
    });

    app.post('/registered', async (req, res) => {
        try {
            const { email, username, password, firstName, lastName } = req.body;
            const adduser = await userData.registerUser(email, username, password, firstName, lastName)

            if (adduser !== null) {
                res.render('partials/signup', {
                    signedUpUser: adduser
                })
            } else {

            }
        }
        catch (e) {
            res.error = e
            res.redirect('/?error=' + encodeURIComponent(res.error));
        }
    });

    app.get('/like/:id', async (req, res) => {
        try {
            if (req.session.user === undefined) {
                throw `Please Sign In to Like the Post`
            }
            const postId = req.params.id
            addLike = await userData.likePost(req.session.user.id, postId, true);
            if (addLike) {
                res.redirect('/');
            }
        }
        catch (e) {
            res.error = e;
            console.log('error in like', e);
            res.redirect('/?error=' + encodeURIComponent(res.error));
        }
    });

    app.get('/unlike/:id', async (req, res) => {
        try {
            if (req.session.user === undefined) {
                throw `Please Sign In to Like the Post`
            }
            const postId = req.params.id
            const addLike = await userData.likePost(req.session.user.id, postId, false);
            if (addLike) {
                res.redirect('/');
            }
        }
        catch (e) {
            res.error = e;
            res.redirect('/?error=' + encodeURIComponent(res.error));
        }
    });
    app.get('/followUser/:id', async (req, res) => {
        try {
            if (req.session.user === undefined) {
                throw `Please Sign In to follow the user`
            }
            const userId = req.params.id
            addFollower = await userData.followUser(req.session.user.id, userId, true);
            if (addFollower) {
                res.redirect('/');
            }
        }
        catch (e) {
            res.error = e;
            console.log('error in like', e);
            res.redirect('/?error=' + encodeURIComponent(res.error));
        }
    });
    app.get('/unfollowUser/:id', async (req, res) => {
        try {
            if (req.session.user === undefined) {
                throw `Please Sign In to unfollow the user`
            }
            const userId = req.params.id
            removeFollower = await userData.followUser(req.session.user.id, userId, false);
            if (removeFollower) {
                res.redirect('/');
            }
        }
        catch (e) {
            res.error = e;
            console.log('error in like', e);
            res.redirect('/?error=' + encodeURIComponent(res.error));
        }
    });

    app.get('/myFav', async (req, res) => {
        if (req.session.name == 'AuthCookie') {
            const user = await userData.getUserById(req.session.user.id);
            const favoritePosts = await userData.getUserFavoritePostsById(req.session.user.id);
            if (favoritePosts.length > 0) {

                favoritePosts.sort(function (a, b) {
                    return a.createdAt > b.createdAt ? -1 : a.createdAt < b.createdAt ? 1 : 0;

                });

                res.render('home', {
                    posts: favoritePosts,
                    isUserLoggedIn: isUserLoggedIn,
                    user: req.session.user
                });
            }
            else {
                let posts = false
                res.render('home', {
                    posts: posts,
                    isUserLoggedIn: isUserLoggedIn,
                    user: req.session.user,
                    message: "Sorry, you have not favourited any blogs."
                });
            }
        }
    });

    app.get('/search', async (req, res) => {
        const string = req.query.key
        var searchedPosts = [];
        const postsList = await postData.getAllPosts()
        postsList.forEach(obj => {
            var pattern = new RegExp(string, 'ig')
            if (obj['title'].match(pattern) || obj['content'].match(pattern)) {
                searchedPosts.push(obj)
            }
        });
        if (searchedPosts !== null) {
            res.render('home', {
                posts: searchedPosts,
                isUserLoggedIn: isUserLoggedIn,
                user: req.session.user,
                message: "No results found for this search"
            });
        }

    });


    app.get('/logout', (req, res) => {
        req.session.destroy(function (err) {
            if (err) {
                res.negotiate(err);
            } else {
                res.redirect('/')
            }
        });
    });
    app.post("/addBlog", async (req, res) => {
        const postInfo = req.body;

        postInfo.author = { id: req.session.user.id, name: req.session.user.name }
        try {
            const newPost = await postData.createPost(
                postInfo.title,
                postInfo.content,
                postInfo.author,
                postInfo.image,
                postInfo.video
            );

            res.redirect("/myPosts");
        } catch (e) {
            res.error = e;
            res.redirect('/?error=' + encodeURIComponent(res.error));
        }
    });
    app.get('/myPosts', async (req, res) => {
        if (req.session.name == 'AuthCookie') {
            const user = await userData.getUserById(req.session.user.id);
            if (user.posts.length > 0) {
                const favoritePosts = await userData.getUserFavoritePostsById(req.session.user.id);
                for (let i = 0; i < user.posts.length; i++) {
                    for (let j = 0; j < favoritePosts.length; j++) {
                        if (user.posts[i]._id === favoritePosts[j]._id) {
                            user.posts[i].isLiked = true;
                        }
                    }
                }
                user.posts.sort(function (a, b) {
                    return a.createdAt > b.createdAt ? -1 : a.createdAt < b.createdAt ? 1 : 0;
                });
                res.render('home', {
                    posts: user.posts,
                    isUserLoggedIn: isUserLoggedIn,
                    user: req.session.user
                });
            }   else {
                let posts = false
                res.render('home', {
                    posts: posts,
                    isUserLoggedIn: isUserLoggedIn,
                    user: req.session.user,
                    message: "Sorry, you have not created any blogs yet."
                });
            }
        } else {
            res.redirect('/');
        }
    });
    app.use('*', (req, res) => {
        res.redirect('/');
    });
}
module.exports = constructorMethod;
