const express = require('express')
const router = express.Router()
const ThoughtsController = require('../controllers/ThoughtsController')
const checkAuth = require('../helpers/auth').checkAuth
const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

router.get('/dashboard', ThoughtsController.dashboard)
router.get('/profile',ThoughtsController.viewProfile)
router.get('/profile/:id',ThoughtsController.viewUserProfileById)
router.get('/propostaArtista/:id',ThoughtsController.viewPropostaArtistaById)
router.post('/proposta/:senderId/:receiverId',ThoughtsController.propostaPost)
router.get('/propostas',ThoughtsController.viewPropostas)
router.get('/', ThoughtsController.showThoughts)


module.exports = router 