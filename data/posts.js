const mongoCollections = require("../config/mongoCollections");
const posts = mongoCollections.posts;
const users = mongoCollections.users;
const uuid = require("node-uuid");

let exportedMethods = {
    async getAllPosts(){
        const postCollection = await posts();
        const postlists = await postCollection.find({}).toArray();
        postlists.sort(function(a, b) {
            return a.createdAt>b.createdAt ? -1 : a.createdAt<b.createdAt? 1 : 0;
            
        });
        return  postlists
    },
    
    async getPostById(id) {
        if (!id){
            throw "Please provide an id to search for a Post";
        }
        console.log(id)
        const postCollection = await posts();
        const post = await postCollection.findOne({ _id: id });
        console.log()
        if (!post) throw "Post not found";
        return post;
    },

    async getPostByName(name) {
        if (!name){
            throw "Please provide a name to search for the Post";
        }
        console.log(name)
        const postCollection = await posts();
        const post = await postCollection.find({'author.name': name}).toArray();
        console.log(post)
        if (!post) throw "Post not found";
        return post;
    },

    async createPost(title, content, author, img, video){
        const postCollection = await posts();
        const userCollection = await users();
        // console.log(title);
        // console.log(content);
        // console.log(author);
        // console.log(img);
        // console.log(video);
        if (title==undefined||content==undefined||author==undefined){
            throw `Title, Content and Author fields are mandatory while creating a post.`
        }
        if (typeof(title)!='string'||typeof(title)!='string'){
            throw `Title, Content fields type should be a string`
        }
        if (typeof(author)!='object'){
            throw `Author field Should be an object having AuthorID and AuthorName .`
        }
        if (!video.includes('embed')){
            video="";
        }
        //Inserting the New Post  in Post DB
        let newPost={
            _id:uuid.v4(),
            title: title,
            content: content,
            img:img,
            video:video,
            isLiked:false,
            createdAt: new Date(),
            author:{
                _id:author.id,
                name:author.name
            }
        };
        const insertInfo = await postCollection.insertOne(newPost);
        const newId = insertInfo.insertedId;
        if (insertInfo.insertedCount === 0){
            throw "Could not add this post";
        }
        if (newId === null) throw "No Post available with that id" + newId ;

        // Updating Animal DB with the post the animal has created
        const updateduserInfo = await userCollection.updateOne({_id: author.id}, {$push: {
            posts: {
                _id:newId,
                title:title,
                content: content,
                img:img,
                video:video,
                isLiked:false,
                createdAt: new Date(),
                author:{
                    _id:author.id,
                    name:author.name
            }
            }
        }});

        if (updateduserInfo.modifiedCount === 0){
            throw "Could not update this Post";
        }
        else{
           console.log("The Post is added to animal account info")
        }
        console.log(this.getPostById(newId))
        return await this.getPostById(newId);
    },

 
   
    
   
}
module.exports=exportedMethods;
