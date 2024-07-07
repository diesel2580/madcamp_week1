const mongoose = require('mongoose');

const dayPhotoSchema = new mongoose.Schema({
  day_recode_id: { type: mongoose.Schema.Types.ObjectId, ref: 'UserDayRecord', required: true },
  photo_id: { type: mongoose.Schema.Types.ObjectId, ref: 'GridFS', required: true },
  upload_time_slot: { type: Number, required: true },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DayPhoto', dayPhotoSchema);