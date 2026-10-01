const express= require('express');
const router = express.Router();
const Note = require('./Note');
const verifyAuthentication = require('./verifyAuthentication');
 
// Apply authMiddleware to all routes in this file
router.use(verifyAuthentication);
 
// GET /api/notes - Get notes belonging to the logged-in user
router.get('/', async (req, res) => {
  try {
    const notes = await Note.find({user: req.user._id});
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
 
// POST /api/notes - Create a new note
router.post('/', async (req, res) => {
  try {
    const note = await Note.create({
      ...req.body,
        user: req.user._id
      // The user ID needs to be added here
    });
    res.status(201).json(note);
  } catch (err) {
    res.status(400).json(err);
  }
});
 
// PUT /api/notes/:id - Update a note
router.put('/:id', async (req, res) => {
  try {
    // This needs an authorization check
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!note) {
      return res.status(404).json({ message: 'No note found with this id!' });
    }
    res.json(note);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
 
// DELETE /api/notes/:id - Delete a note
router.delete('/:id', async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });
    if (!note) {
      return res.status(404).json({ message: 'No note found with this id!' });
    }
    res.json({ message: 'Note deleted!' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/notes - Get a single note belonging to the logged-in user
router.get('/:id', async (req, res) => {
  try {
    const notes = await Note.findOne({_id : req.params.id, user : req.user._id});
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;