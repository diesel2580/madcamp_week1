require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

// Routes 경로
const authRoutes = require('./routes/authRoutes');
const photoRoutes = require('./routes/photoRoutes');
const userRoutes = require('./routes/userRoutes'); // 수정사항: 새로운 라우트 추가

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

//MongoDB 연결
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

//Routes 설정
app.use('/api/auth', authRoutes);
app.use('/api', photoRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});