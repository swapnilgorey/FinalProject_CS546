const mongoCollections = require("../config/mongoCollections");
const users = mongoCollections.users;
const posts = require("./posts");
const uuid = require("node-uuid");
const bcrypt = require('bcrypt');

let exportedMethods = {
    async getAllusers() {
        const userCollection = await users();
        const userList = await userCollection.find({}).toArray();
        return userList;
    },

    async registerUser(email,username,password,firstname,lastname) {
        const userCollection = await users();
        const userName = await userCollection.findOne({username:username})
        const eMail = await userCollection.findOne({email:email})
        if (userName!==null){
            throw `Username already exists. Please try a differnet username`
        }
        if (eMail!==null){
            throw `Email already exists. Please try a differnet email`
        }
        var BCRYPT_SALT_ROUNDS = 12
        let hashedPassword = await bcrypt.hash(password,BCRYPT_SALT_ROUNDS);
        let newUser={
            _id:uuid.v4(),
            email:email,
            username: username,
            hashedPassword: hashedPassword,
            firstName: firstname,
            lastName: lastname,
            posts:[],
            followers:[],
            following:[],
            favoritePosts:[]
        };
        const insertInfo = await userCollection.insertOne(newUser);
        if (insertInfo.insertedCount === 0){
             throw "Could not add this user";
        }
        const myUser = await userCollection.findOne({ username: username });
        if (myUser === null) throw "No User found with that username";
        return myUser;
    },

    async authenticate (logincred,password){
        let users = await this.getAllusers()
        let myuser ={}
        for (i=0;i<users.length;i++){
            if ((users[i].username==logincred && await bcrypt.compare(password,users[i].hashedPassword)) || (users[i].email==logincred && await bcrypt.compare(password,users[i].hashedPassword))){
                myuser={
                    id: users[i]['_id'],
                    email:users[i]['email'],
                    username:users[i]['username'],
                    firstName:users[i]['firstName'],
                    lastName:users[i]['lastName'],
                    name: users[i]['firstName'] +" "+ users[i]['lastName'],
                    favoritePosts: users[i]['favoritePosts'],
                    following:users[i]['following'],
                    message:"Logged In Successfully"
                }
            }
        }
        return myuser;
    },
    async getUserById(id) {
        const userCollection = await users();
        const myuser = await userCollection.findOne({_id: id});
        let mappedUser = {}
        if (myuser === null){
            throw "user not found with the given id: " + id;
        } else {
            mappedUser={
                id: myuser['_id'],
                email:myuser['email'],
                username:myuser['username'],
                firstName:myuser['firstName'],
                lastName:myuser['lastName'],
                name: myuser['firstName'] +" "+ myuser['lastName'],
                favoritePosts: myuser['favoritePosts'],
                posts: myuser['posts'],
                following:myuser['following'],
                message:"Logged In Successfully"
            }
        }
        console.log('success ', mappedUser)
        return mappedUser;
    },

    async getUserFavoritePostsById(userId) {
        const userCollection = await users();
        const myuser = await userCollection.findOne({_id: userId});
        if (myuser === null){
            throw "user not found with the given id: " + userId;
        }
        return myuser.favoritePosts;
    },
    async getUserFollowingUserListById(userId) {
        const userCollection = await users();
        const myuser = await userCollection.findOne({_id: userId});
        if (myuser === null){
            throw "user not found with the given id: " + userId;
        }
        return myuser.following;
    },
    async likePost(userid, postid, isLiked){
        const favoritePost = await posts.getPostById(postid)
        const userCollection = await users();
        favoritePost.isLiked = isLiked;
        let updatedUserInfo ;
        if(favoritePost.isLiked) {
            updatedUserInfo = await userCollection.updateOne({_id:userid}, {$push: {favoritePosts:favoritePost}})
         
        } else {
            updatedUserInfo = await userCollection.updateOne({_id:userid}, {$pull: {favoritePosts: {_id: favoritePost._id}}})
        }
        
            if (updatedUserInfo.modifiedCount === 0){
                throw "Something went wrong, Could not like the post";
        }
        else{
            console.log("The like is added to user account info")
        }
        return favoritePost

    },
    async followUser(userid, followingUsedId, isFollowed){

        const followingUser = await this.getUserById(followingUsedId)
        const userCollection = await users();
        let updatedUserInfo ;
        if(isFollowed) {
            updatedUserInfo = await userCollection.updateOne({_id:userid}, {$push: {following:followingUser}})
         
        } else {
            updatedUserInfo = await userCollection.updateOne({_id:userid}, {$pull: {following: {id: followingUser.id}}})
        }
        
            if (updatedUserInfo.modifiedCount === 0){
                throw "Something went wrong, Could not like the post";
        }
        else{
            console.log("The like is added to user account info")
        }
        return favoritePost

    },
}
module.exports = exportedMethods;