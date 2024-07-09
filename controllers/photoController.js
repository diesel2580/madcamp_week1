const multer = require('multer');
const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const UserDayRecord = require('../models/UserDayRecord');
const DayPhoto = require('../models/DayPhoto');

const conn = mongoose.connection;
let gfs;

conn.once('open', () => {
  gfs = new GridFSBucket(conn.db, {
    bucketName: 'uploads'
  });
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

exports.uploadPhoto = [
  upload.single('photo'),
  async (req, res) => {
    const { user_id, date, upload_time_slot } = req.body;

    try {
      const userDayRecord = await UserDayRecord.findOneAndUpdate(
        { user_id, date },
        { $setOnInsert: { user_id, date } },
        { new: true, upsert: true }
      );

      const writestream = gfs.openUploadStream(req.file.originalname, {
        contentType: req.file.mimetype
      });

      writestream.on('error', (err) => {
        const errorMessage = err ? err.message : 'Unknown error';
        console.error('An error occurred while writing to GridFS:', errorMessage);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to upload photo to GridFS', details: errorMessage });
        }
      });

      writestream.on('finish', async (file) => {
        try {
          const dayPhoto = new DayPhoto({
            day_recode_id: userDayRecord._id,
            photo_id: file._id,
            upload_time_slot
          });

          await dayPhoto.save();

          if (!res.headersSent) {
            const photoUrl = `${req.protocol}://${req.get('host')}/api/photos/${file._id}`;
            res.json({ message: 'Photo uploaded successfully', photo_data_id: dayPhoto._id, photo_url: photoUrl });
          }
        } catch (error) {
          console.error('An error occurred while saving DayPhoto:', error);
          if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to save photo record', details: error.message });
          }
        }
      });

      writestream.end(req.file.buffer);

    } catch (error) {
      console.error('An error occurred:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to upload photo', details: error.message });
      }
    }
  }
];

exports.getPhotos = async (req, res) => {
  const { user_id, date } = req.query;

  try {
    const userDayRecord = await UserDayRecord.findOne({ user_id, date });

    if (!userDayRecord) {
      return res.json({ photos: [] });
    }

    const dayPhotos = await DayPhoto.find({ day_recode_id: userDayRecord._id });

    // 각 시간대에 대해 사진을 찾고, 없으면 null로 표시
    const totalTimeSlots = 12; // 예를 들어 2시간 간격으로 24시간을 나눈 경우
    const photos = Array(totalTimeSlots).fill(null);

    dayPhotos.forEach(photo => {
      photos[photo.upload_time_slot - 1] = {
        photo_data_id: photo._id,
        upload_time_slot: photo.upload_time_slot,
        photo_url: `${req.protocol}://${req.get('host')}/api/photos/${photo.photo_id}`
      };
    });

    res.json({ photos });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch photos', details: error.message });
  }
};

exports.getPhoto = async (req, res) => {
  const { photo_data_id } = req.params;

  try {
    const files = await gfs.find({ _id: new mongoose.Types.ObjectId(photo_data_id) }).toArray();
    
    if (files.length === 0) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    const downloadStream = gfs.openDownloadStream(new mongoose.Types.ObjectId(photo_data_id));

    downloadStream.on('error', (err) => {
      console.error('An error occurred while reading from GridFS:', err);
      return res.status(404).json({ error: 'Photo not found' });
    });

    res.set('Content-Type', 'image/jpeg');
    downloadStream.pipe(res);

  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch photo', details: error.message });
  }
};