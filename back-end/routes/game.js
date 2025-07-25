const express = require('express');
const Game = require('../models/Game');
const User = require('../models/User');
const router = express.Router();

router.post('/save/:roomId', async (req, res) => {
  const { roomId } = req.params;
  const { host_id, guest_id, hostScore, guestScore } = req.body;

  try {
    const game = await Game.create({
      roomId,
      host_id,
      guest_id,
      final_score: { hostScore, guestScore }
    });
    await User.findByIdAndUpdate(host_id, { $push: { games: game._id } });
    if (guest_id) await User.findByIdAndUpdate(guest_id, { $push: { games: game._id } });
    res.status(200).json({ message: 'Game saved', gameId: game._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Game save failed' });
  }
});

router.get('/game/:roomId', async (req, res) => {
  const { roomId } = req.params;
  try {
    const game = await Game.findOne({ roomId });
    if (!game) return res.status(404).json({ message: 'Game not found' });
    res.status(200).json({ game });
  } catch (error) {
    console.error('Error fetching game state:', error.message);
    res.status(500).json({ error: 'Failed to fetch game state.' });
  }
});

module.exports = router;