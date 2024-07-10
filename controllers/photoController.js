const multer = require('multer');
const axios = require('axios');
const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const UserDayRecord = require('../models/UserDayRecord');
const DayPhoto = require('../models/DayPhoto');
const Jimp = require('jimp'); // 수정: Jimp 모듈 추가
const fs = require('fs'); // 추가: fs 모듈 import
const path = require('path');

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

//photo export
exports.mergePhotos = async (req, res) => {
  const { user_id, date } = req.query;

  try {
    // 특정 날짜의 모든 사진을 가져옴
    const response = await axios.get(`${process.env.API_BASE_URL}/api/photos`, {
      params: { user_id, date }
    });

    const photos = response.data.photos.filter(photo => photo !== null);

    if (photos.length === 0) {
      return res.status(404).json({ error: 'No photos found' });
    }

    // Jimp를 사용하여 이미지를 읽음
    const images = await Promise.all(
      photos.map(async (photo) => await Jimp.read(photo.photo_url))
    );

    // 총 높이를 계산
    const totalHeight = images.reduce((sum, img) => sum + img.bitmap.height, 0);

    // 새로운 이미지를 생성
    const mergedImage = new Jimp(images[0].bitmap.width, totalHeight);

    // 이미지를 세로로 합침
    let yOffset = 0;
    for (const image of images) {
      mergedImage.composite(image, 0, yOffset);
      yOffset += image.bitmap.height;
    }

    // 임시 파일로 저장
    const outputPath = path.join(__dirname, '..', 'output', `${user_id}_${date}.jpg`);
    await mergedImage.quality(80).writeAsync(outputPath);

    // 클라이언트로 파일을 전송
    res.download(outputPath, (err) => {
      if (err) {
        console.error(err);
      }
      fs.unlinkSync(outputPath); // 전송 후 파일 삭제
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to merge photos' });
  }
};

//photo delete
exports.deletePhoto = async (req, res) => {
  const { photo_id } = req.params;
  console.log(`Received request to delete photo with id: ${photo_id}`);//사진 전달 확인

  try {
    const photo = await DayPhoto.findOne({ photo_id });

    if (!photo) {
      console.log('Photo not found'); // 사진 x
      console.log(`Photo with id: ${photo_id} not found in DayPhoto collection`);//
      return res.status(404).json({ error: 'Photo not found' });
    }

    // Delete the photo from GridFS
    const gfs = new GridFSBucket(mongoose.connection.db, {
      bucketName: 'uploads'
    });

    gfs.delete(new mongoose.Types.ObjectId(photo_id), async (err) => {
      if (err) {
        console.error(`Failed to delete photo with id: ${photo_id} from GridFS`, err);//gridfs delete 확인
        return res.status(500).json({ error: 'Failed to delete photo from GridFS', details: err.message });
      }

      // Delete the photo record from the database
      await DayPhoto.deleteOne({ photo_id });

      res.json({ message: 'Photo deleted successfully' });
      console.log(`Photo with id: ${photo_id} successfully deleted from GridFS`);//삭제 성공
    });
  } catch (error) {
    console.error(`Error while deleting photo with id: ${photo_id}`, error);//삭제 오류
    res.status(500).json({ error: 'Failed to delete photo', details: error.message });
  }
};
