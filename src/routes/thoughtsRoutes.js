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

router.get('/add', ThoughtsController.createThought)
router.post('/add', upload.single('image'),ThoughtsController.createThoughtPost,)
router.get('/dashboard', ThoughtsController.dashboard)
router.post('/delete/:id', ThoughtsController.deleteThought)
router.get('/edit/:id', ThoughtsController.editThought)
router.post('/edit/:id',  upload.single('image'), ThoughtsController.editThoughtPost)
router.get('/editUser', ThoughtsController.editUser)
router.post('/editUser/:id',  upload.single('image'), ThoughtsController.editUserPost)
router.get('/adopt/:id', ThoughtsController.adopt)
router.get('/adoptions', ThoughtsController.adoptions)
router.get('/finishAdoption/:id', ThoughtsController.finishAdoption)
router.get('/rejectAdoption/:id', ThoughtsController.rejectAdoption)
router.get('/chat/:email',ThoughtsController.chat)
router.get('/friends',ThoughtsController.getFriends)
router.get('/profile',ThoughtsController.viewProfile)
router.get('/profile/:id',ThoughtsController.viewUserProfileById)
router.get('/', ThoughtsController.showThoughts)


module.exports = router 