const multer = require('multer');
const mongoose = require('mongoose');
const Grid = require('gridfs-stream');
const UserDayRecord = require('../models/UserDayRecord');
const DayPhoto = require('../models/DayPhoto');

const conn = mongoose.connection;
let gfs;

conn.once('open', () => {
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('uploads');
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

exports.uploadPhoto = [ //유저한테서 받은 userid, date, upload_time, "<file>"을 db에 저장하는 부분
  upload.single('photo'),
  async (req, res) => {
    const { user_id, date, upload_time_slot } = req.body;

    try {
      const userDayRecord = await UserDayRecord.findOneAndUpdate(
        { user_id, date },
        { $setOnInsert: { user_id, date } },
        { new: true, upsert: true }
      );

      const writestream = gfs.createWriteStream({
        filename: req.file.originalname,
        content_type: req.file.mimetype
      });

      writestream.write(req.file.buffer); //gridfs에 파일 저장
      writestream.end();

      writestream.on('close', async (file) => {
        const dayPhoto = new DayPhoto({
          day_recode_id: userDayRecord._id,
          photo_id: file._id,
          upload_time_slot
        });

        await dayPhoto.save();

        res.json({ message: 'Photo uploaded successfully', photo_data_id: dayPhoto._id });
      });

    } catch (error) {
      res.status(500).json({ error: 'Failed to upload photo' });
    }
  }
];//photo image

exports.getPhotos = async (req, res) => { //특정 날짜의 사진 전체 불러오기: 클라이언트 화면에 표시될 수 있도록 하는 아이
  const { user_id, date } = req.query;

  try {
    const userDayRecord = await UserDayRecord.findOne({ user_id, date });

    if (!userDayRecord) {
      return res.json({ photos: [] });
    }

    const dayPhotos = await DayPhoto.find({ day_recode_id: userDayRecord._id });

    const photos = dayPhotos.map(photo => ({
      photo_data_id: photo._id,
      upload_time_slot: photo.upload_time_slot,
      photo_url: `/api/photos/${photo.photo_id}`
    }));

    res.json({ photos });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch photos' });
  }
};

exports.getPhoto = async (req, res) => {
  const { photo_data_id } = req.params;

  try {
    const dayPhoto = await DayPhoto.findById(photo_data_id);

    if (!dayPhoto) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    gfs.files.findOne({ _id: dayPhoto.photo_id }, (err, file) => {
      if (err || !file) {
        return res.status(404).json({ error: 'Photo not found' });
      }

      const readstream = gfs.createReadStream(file.filename);
      readstream.pipe(res);
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch photo' });
  }
};