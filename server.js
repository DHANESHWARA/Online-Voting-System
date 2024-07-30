const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

mongoose.connect('mongodb://localhost:27017/votingSystem', { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: String,
});
const User = mongoose.model('User', userSchema);

const candidateSchema = new mongoose.Schema({
  name: String,
  votes: { type: Number, default: 0 },
});
const Candidate = mongoose.model('Candidate', candidateSchema);

app.post('/register', async (req, res) => {
  const { username, password, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hashedPassword, role });
  await user.save();
  res.status(201).send('User registered');
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user || !await bcrypt.compare(password, user.password)) {
    return res.status(400).send('Invalid credentials');
  }
  const token = jwt.sign({ userId: user._id, role: user.role }, 'secretKey');
  res.send({ token });
});

app.post('/vote', async (req, res) => {
  const { token, candidateId } = req.body;
  const payload = jwt.verify(token, 'secretKey');
  const user = await User.findById(payload.userId);
  if (!user || user.role !== 'voter') {
    return res.status(403).send('Access denied');
  }
  const candidate = await Candidate.findById(candidateId);
  candidate.votes += 1;
  await candidate.save();
  res.send('Vote casted');
});

app.get('/results', async (req, res) => {
  const candidates = await Candidate.find();
  res.send(candidates);
});

app.listen(3000, () => console.log('Server started on port 3000'));
