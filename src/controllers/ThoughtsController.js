const User = require('../models/user')
const Talk = require('../models/talk')
const session = require('express-session')
const axios = require('axios')
const { use } = require('../routes/thoughtsRoutes')
const { Op, where } = require('sequelize');
const Proposta = require('../models/proposta')
const moment = require('moment');

module.exports = class ThoughtController{

    static async dashboard(req,res){
       
        if(req.session.userId){
        const user = await User.findOne({where: {id:req.session.userId}})
        let connections
        if(user.accountType == 'Empresa'){

            connections = await User.findAll({where: {accountType:'Artista'}})
        }
        else{

            connections = await User.findAll({where: {accountType:'Empresa'}})
        }
        const propostas = await Proposta.findAll({
            where: {
              [Op.or]: [
                { senderId: req.session.userId },
                { receiverId: req.session.userId }
              ],status: 'aceita'
            }
          });
        propostas.forEach(async prop => {

            if(req.session.userId == prop.senderId){
            prop.empresa = await User.findOne({where: {id: prop.receiverId}})
            }
            else{
                prop.empresa = await User.findOne({where: {id: prop.senderId}})
            }
        })
        res.render('thoughts/dashboard', {session: req.session, user,connections,propostas})}
        else{

            res.redirect('404')
        }

    }

    static async load404(req,res){
        res.render('thoughts/404', {session: req.session})
       
    }

    static async viewProfile(req,res){

        let selfView = true
        if(req.session.userId){
        const user = await User.findOne({where: {id:req.session.userId}})
        let type
        if(user.accountType === 'Empresa'){
            type = 1
        }
        else{
            type = 0
        }
        res.render('thoughts/profile', {session: req.session,user,selfView,type})}
        else{
            res.redirect('404')
        }  
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

    static async viewPropostaArtistaById(req,res){

        const id = req.params.id
        const empresa = await User.findOne({where: {id:id}})
        const user = await User.findOne({where: {id:req.session.userId}})
        const sender = user
        const receiver = empresa
        res.render('thoughts/proposta', {session: req.session,empresa,sender,receiver})        
    }

    static async viewPropostaEmpresaById(req,res){

        const id = req.params.id
        const empresa = await User.findOne({where: {id:req.session.userId}})
        const user = await User.findOne({where: {id:id}})
        const sender = empresa
        const receiver = user
        res.render('thoughts/proposta', {session: req.session,empresa,sender,receiver})        
    }

    static async viewUserProfileById(req,res){

        const id = req.params.id
        const user = await User.findOne({where: {id:id}})
        let type
        if(user.accountType === 'Empresa'){
            type = 1
        }
        else{
            type = 0
        }
        let selfView = false
        res.render('thoughts/profile', {session: req.session,user,type,selfView})        
    }

    static async propostaPost(req,res){

        const senderId = req.params.senderId
        const receiverId = req.params.receiverId
        const proposta = {
            data: req.body.data,
            hora: req.body.hora,
            valorHora: req.body.valor,
            mensagem: req.body.mensagem,
            senderId: senderId,
            receiverId:  receiverId,
            status: 'pendente'
        }
        console.log(proposta)
        await Proposta.create(proposta)
        req.flash('message', 'Proposta enviada com sucesso, aguardando resposta do usuário.')
                req.session.save(() => {

                    res.redirect('/thoughts/dashboard')    
    })
}

    static async viewPropostas(req,res){

        if(req.session.userId){
        const propostasEnviadas = await Proposta.findAll({
            where: {
              status: { [Op.ne]: 'aceita' }, // Status diferente de 'aceito'
              senderId: req.session.userId   // senderId igual ao req.session.userId
            }
          });

for (const proposta of propostasEnviadas) {
    proposta.receiver = await User.findOne({ where: { id: proposta.receiverId } });
    proposta.data = proposta.data ? moment(proposta.data).format('YYYY-MM-DD') : null;
}

const propostasRecebidas = await Proposta.findAll({ where: { receiverId: req.session.userId, [Op.or]: [
    { status: 'pendente' },
    { status: 'negada' },
    {status: 'expirada'}
  ] } });

for (const proposta of propostasRecebidas) {
    proposta.sender = await User.findOne({ where: { id: proposta.senderId } });
    proposta.data = proposta.data ? moment(proposta.data).format('YYYY-MM-DD') : null;
}
propostasEnviadas.sort((a, b) => {
    if (a.status === 'pendente' && b.createdAt) {
      return -1; // 'a' vem antes de 'b'
    }
    if (a.status !== 'pendente' && b.createdAt) {
      return 1;  // 'b' vem antes de 'a'
    }
    return 0;  // Mantém a ordem se ambos forem iguais
  });
  
  propostasRecebidas.sort((a, b) => {
    if (a.status === 'pendente' && b.createdAt) {
      return -1;
    }
    if (a.status !== 'pendente' && b.createdAt) {
      return 1;
    }
    return 0;
  });

  propostasEnviadas.forEach(prop => {

    if(prop.status == 'pendente'){
        prop.aval = true 
}
    else{
        prop.aval = false
    }
  })

  propostasRecebidas.forEach(prop => {

    if(prop.status == 'pendente'){
        prop.aval = true 
}
    else{
        prop.aval = false
    }
  })

  
res.render('thoughts/minhasPropostas', { session: req.session, propostasEnviadas, propostasRecebidas });
        }
        else{
            res.redirect('404')
        }

    }

    static async aceitarProposta(req,res){

        const propostaProcurada = await Proposta.findOne({ where: { id: req.params.id } });
        const proposta = {
            id: propostaProcurada.id,
            status: 'aceita',
            data: propostaProcurada.data,
            hora: propostaProcurada.hora,
            valorHora: propostaProcurada.valorHora,
            mensagem: propostaProcurada.mensagem,
            senderId: propostaProcurada.senderId,
            receiverId: propostaProcurada.receiverId
        }
        Proposta.update(proposta,{where: {id:req.params.id}})
        req.flash('message', 'Proposta aceita com sucesso!')
        req.session.save(() => {

            res.redirect('/thoughts/dashboard')
        })

    }

    static async negarProposta(req,res){

        const propostaProcurada = await Proposta.findOne({ where: { id: req.params.id } });
        const proposta = {
            id: propostaProcurada.id,
            status: 'negada',
            data: propostaProcurada.data,
            hora: propostaProcurada.hora,
            valorHora: propostaProcurada.valorHora,
            mensagem: propostaProcurada.mensagem,
            senderId: propostaProcurada.senderId,
            receiverId: propostaProcurada.receiverId
        }
        Proposta.update(proposta,{where: {id:req.params.id}})
        if(req.session.userId){
        const user = await User.findOne({where: {id: req.session.userId}})

            req.flash('message', 'Proposta negada com sucesso!')
            req.session.save(() => {

                res.redirect(`/thoughts/dashboard`)
            })
        
    }
    else{
        res.redirect('404')
    }
    }

}