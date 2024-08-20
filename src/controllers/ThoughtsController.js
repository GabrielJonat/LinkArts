const Thought = require('../models/thoughts')
const User = require('../models/user')
const Adoption = require('../models/adoption')
const Talk = require('../models/talk')
const Message = require('../models/message')
const Profile = require('../models/profile')
const session = require('express-session')
const axios = require('axios')
const { use } = require('../routes/thoughtsRoutes')
const { Op } = require('sequelize');

module.exports = class ThoughtController{

    static async showThoughts(req,res){

        var search = ''
        var order = 'new'
        const thoughts = await Thought.findAll();
        const users = await User.findAll();
        var dict = {}
        users.forEach(user => {
            
            dict[user.id] = user.name
        })
        thoughts.forEach(thought => {
            
            thought.userName = dict[thought.UserId]
        })
            let filteredThoughts = []
        if(req.query.search){
            search = req.query.search
            thoughts.filter(thought => {

            if(thought.title.toLowerCase().includes(search.toLowerCase()))
                filteredThoughts.push(thought)
        })
        }
        else{

            filteredThoughts = thoughts
        }
        if(req.query.order){

            order = req.query.order
        }
        if(order == 'old'){

            filteredThoughts.sort((a, b) => {
                return new Date(b.createdAt) - new Date(a.createdAt);
              });
              
        }
        let qtyResults = filteredThoughts.length
        const response = await axios.get('http://random.dog/woof.json')
        const image = response.data.url
        console.log(image)
        res.render('thoughts/home', {session: req.session, filteredThoughts:filteredThoughts, search:search, qtyResults,image:image})
    }

    static async dashboard(req,res){
       
        const user = await User.findOne({where: {id:req.session.userId}})
        console.log(user)
        
        res.render('thoughts/dashboard', {session: req.session, user})

    }

    static async createThought(req,res){
        res.render('thoughts/create', {session: req.session})
       
    }

    static async editThought(req,res){

        const id = req.params.id
        const thought = await Thought.findOne({where: {id:id}, raw: true})
        res.render('thoughts/edit', {session: req.session, thought:thought})
       
    }

    static async editUser(req,res){

        const id = req.session.userId
        const user = await User.findOne({where: {id:id}, raw: true})
        const profile = await Profile.findOne({where: {userId:id}, raw: true})
        res.render('thoughts/userEdit', {session: req.session, profile, user})
    }

    static async editUserPost(req,res){

        const id = req.params.id
        const profile = {
            
            state: req.body.state,
            city: req.body.city,
            description: req.body.description,
            userId: id,
        }
        if(req.file){
            const image = `/uploads/${req.file.filename}`;
            profile.image = image    
        }
            const user = {

            name: req.body.name,
            email: req.body.email,
        }

        await User.update(user,{where: {id:id}})
        await Profile.update(profile,{where: {userId:id}})
        
        req.flash('message', 'Perfil editado com sucesso!')
        req.session.save(() => {

            res.redirect('/thoughts/profile')
        })
       
    }

    static async editThoughtPost(req,res){

        console.log(req.body)
        const id = req.params.id
        const imageUrl = `/uploads/${req.file.filename}`;
        const thought = {

            title: req.body.title,
            weight: req.body.weight,
            age: req.body.age,
            color: req.body.color,
            image: imageUrl,
            available: true,
            UserId: req.session.userId
        }


        await Thought.update(thought,{where: {id:id}})
       
        req.flash('message', 'Pet editado com sucesso!')
        req.session.save(() => {

            res.redirect('/thoughts/dashboard')
        })
       
    }

    static async createThoughtPost(req,res){
        
        console.log(req.body)
        const imageUrl = `/uploads/${req.file.filename}`;
        const thought = {

            title: req.body.title,
            weight: req.body.weight,
            age: req.body.age,
            color: req.body.color,
            image: imageUrl,
            available: true,
            UserId: req.session.userId
        }

        try{
        await Thought.create(thought)

        
        req.flash('message', 'Pet cadastrado com sucesso!')
        req.session.save(() => {

            res.redirect('/thoughts/dashboard')
        })
    }
        catch(error){
            console.log(error)
        }
    }

    static async deleteThought(req,res){
        
        const id = req.params.id
        const userId = req.session.userId
        try{

        await Thought.destroy({where: {id:id,UserId:userId}})     
        req.flash('message', 'Pet excluido com sucesso!')
        req.session.save(() => {

            res.redirect('/thoughts/dashboard')
        })
    }
        catch(error){
            req.flash('message', 'Ocorreu um erro inesperado')
            req.session.save(() => {

            res.redirect('/thoughts/dashboard')
        })
        }
    }

    static async adopt(req, res){

        console.log(req.session.userId)
        if(!req.session.userId){

            req.flash('message', 'Autentique-se para adotar um Pet')
            req.session.save(() => {

                res.redirect('/')
            })  
        }
        else{
            const id = req.params.id
            const userId = req.session.userId
            const adoptions = await Adoption.findAll({where:{ThoughtId:id}})
            if(adoptions.length > 0){
                console.log(adoptions, 'tá errado!')
                req.flash('message', 'Este Pet já tem uma adoção em andamento.')
                req.session.save(() => {

                    res.redirect('/')
                })
            }
            else{
            const thought = await Thought.findOne({where: {id:id}, raw: true})
            if(thought.UserId === userId){

            req.flash('message', 'Não é possível adotar seu próprio Pet!')
            req.session.save(() => {

                res.redirect('/thoughts/dashboard')
            })    
            }
            else{
                const adoption = {
                    status: false,
                    UserId: userId,
                    ThoughtId: thought.id
                }
                const createdAdoption = await Adoption.create(adoption)
                console.log(createdAdoption)
                req.flash('message', 'Adoção requisitada com sucesso, aguardando resposta do dono!')
                req.session.save(() => {

                    res.redirect('/thoughts/dashboard')
                })
            }
        }
        }
    }

    static async adoptions(req,res){

        const user = await User.findOne({where: {id:req.session.userId}})
        const adoptions = await Adoption.findAll({where: {UserId:req.session.userId},})
        let empty = false
        let util = []
        if(!adoptions)
            empty = true
        adoptions.forEach(async value => {
            const thought = await Thought.findOne({where:{id:value.ThoughtId}})
            if(thought){
            const user = await User.findOne({where:{id:thought.UserId}})
            thought.ownerEmail = user.email
            util.push(thought)
            }
        })
        console.log(util)
        res.render('thoughts/adoptions', {session: req.session, user:user, empty:empty, util:util})
    }

    static async getFriends(req,res){

        const user = await User.findOne({where: {id:req.session.userId}})
        const adoptions = await Adoption.findAll({where: {UserId:req.session.userId},})
        let userThoughts = []
        let empty = false
        const util = new Set()
        if(!adoptions)
            empty = true
        adoptions.forEach(async value => {
            const thought = await Thought.findOne({where:{id:value.ThoughtId}})
            if(thought){
            const user = await User.findOne({where:{id:thought.UserId}})
            thought.ownerEmail = user.email
            const talks = await Talk.findOne({where: {user1:req.session.userId,user2:user.id}})
            const talks2 = await Talk.findOne({where: {user1:user.id,user2:req.session.userId}})    
            if(!talks && !talks2){

                await Talk.create({user1:req.session.userId,user2:user.id})
            }
            else{
            }
            util.add(thought.ownerEmail)
            }
        })
        const thoughts = await Thought.findAll({where: {UserId:req.session.userId}})
        thoughts.forEach(async value => {

            userThoughts.push(value.id)
            const owner = await User.findOne({where: {id:value.adopter}})
            if(owner){

                util.add(owner.email)
            }
        })
        const adoptions2 = await Adoption.findAll()
        adoptions2.forEach(async value => {

            if(userThoughts.includes(value.ThoughtId)){

                const subject = await User.findOne({where: {id:value.UserId}})
                util.add(subject.email)
            }
        })
        res.render('thoughts/friends', {session: req.session, user:user, empty:empty, util:util})
    }

    static async finishAdoption(req,res){

        const id = req.params.id
        const thought = await Thought.findOne({where:{id:id}})
        const adoptions = await Adoption.findAll({where: {ThoughtId:id},})
        for (const adp of adoptions) {
            adp.status = 1;
            thought.adopter = adp.UserId; // Assuming UserId is the adopter's ID
            await adp.save(); // Save each adoption instance
          }
          
          // Save the updated thought
          thought.available = 0
          await thought.save();
          
        req.flash('message', 'Adoção realizada com sucesso!')
        req.session.save(() => {

            res.redirect('/')
        })
        
    }

    static async rejectAdoption(req,res){

        const id = req.params.id
        await Adoption.destroy({raw:true,where: {ThoughtId:id},})
        req.flash('message', 'Adoção rejeitada!')
        req.session.save(() => {

            res.redirect('/')
        })
        
    }

    static async chat(req,res){

            const email = req.params.email
            const friend = await User.findOne({where: {email:email}})
            const user = await User.findOne({where: {id:req.session.userId}})
            const talk = await Talk.findOne({where: {user1:user.id, user2: friend.id}})
            const profile = await Profile.findOne({where: {userId:user.id}})
            let pk
            if(!talk){
                const substitute = await Talk.findOne({where: {user1:friend.id, user2: user.id}})
                pk = `${substitute.user1} ${substitute.user2}`
            }
            else{
                console.log(talk.user1, talk.user2)
                pk = `${talk.user1} ${talk.user2}`
            }
            console.log(pk)
            res.render('chat/talk', {session: req.session,friend,user, pk,profile})        
    }

    static async viewProfile(req,res){

        const user = await User.findOne({where: {id:req.session.userId}})
        const profile = await Profile.findOne({where: {userId:req.session.userId}})
        const pets = await Thought.findAll({where:{UserId:req.session.userId}})
        let qtdAdopted = 0
        let qtdPets = pets.length
        pets.forEach(thought => {

            if(thought.adopter){

                qtdAdopted++;
            }
        })
        let selfView = true
        res.render('thoughts/profile', {session: req.session,user,profile,qtdAdopted,qtdPets,selfView})        
    }

    static async viewUserProfile(req,res){

        const name = req.params.name
        const user = await User.findOne({where: {name:name}})
        const profile = await Profile.findOne({where: {userId:user.id}})
        const pets = await Thought.findAll({where:{UserId:user.id}})
        let qtdAdopted = 0
        let qtdPets = pets.length
        pets.forEach(thought => {

            if(thought.adopter){

                qtdAdopted++;
            }
        })
        let selfView = false
        res.render('thoughts/profile', {session: req.session,user,profile,qtdAdopted,qtdPets,selfView})        
    }

    static async viewUserProfileById(req,res){

        const name = req.params.id
        const user = await User.findOne({where: {id:name}})
        const profile = await Profile.findOne({where: {userId:user.id}})
        const pets = await Thought.findAll({where:{UserId:user.id}})
        let qtdAdopted = 0
        let qtdPets = pets.length
        pets.forEach(thought => {

            if(thought.adopter){

                qtdAdopted++;
            }
        })
        let selfView = false
        res.render('thoughts/profile', {session: req.session,user,profile,qtdAdopted,qtdPets,selfView})        
    }
}