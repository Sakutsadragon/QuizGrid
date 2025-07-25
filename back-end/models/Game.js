const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  host_id: { type: mongoose.Schema.Types.ObjectId, ref: 'QuizUser', required: true },
  guest_id: { type: mongoose.Schema.Types.ObjectId, ref: 'QuizUser' }, // guest_id can be optional if playing solo
  final_score: {
    hostScore: { type: Number, required: true },
    guestScore: { type: Number, required: true },
  },
}, { timestamps: true });

module.exports = mongoose.model('Game', GameSchema);
