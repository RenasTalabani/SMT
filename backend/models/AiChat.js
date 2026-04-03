const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 4000
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const aiChatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  messages: {
    type: [messageSchema],
    default: []
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Keep only last 30 messages to control token usage
aiChatSchema.methods.addMessage = function (role, content) {
  this.messages.push({ role, content });
  if (this.messages.length > 30) {
    this.messages = this.messages.slice(this.messages.length - 30);
  }
  this.updatedAt = new Date();
};

// Returns last N messages formatted for OpenAI
aiChatSchema.methods.getHistory = function (limit = 20) {
  return this.messages.slice(-limit).map(m => ({ role: m.role, content: m.content }));
};

module.exports = mongoose.model('AiChat', aiChatSchema);
