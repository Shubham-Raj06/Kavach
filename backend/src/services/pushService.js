const axios = require('axios');
const User = require('../models/User');
const logger = require('../utils/logger');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const sendPushMessages = async (messages) => {
    if (!messages || messages.length === 0) return;
    try {
        const chunks = [];
        for (let i = 0; i < messages.length; i += 100) {
            chunks.push(messages.slice(i, i + 100));
        }
        for (const chunk of chunks) {
            await axios.post(EXPO_PUSH_URL, chunk, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    ...(process.env.EXPO_ACCESS_TOKEN ? { 'Authorization': `Bearer ${process.env.EXPO_ACCESS_TOKEN}` } : {}),
                },
            });
        }
        logger.info(`📱 Sent ${messages.length} push notifications`);
    } catch (err) {
        logger.error(`❌ Push error: ${err.message}`);
    }
};

// Send push to all users in a ward
const sendWardPush = async (ward, title, body) => {
    const users = await User.find({ ward, pushToken: { $ne: null } }).select('pushToken');
    const messages = users
        .filter(u => u.pushToken?.startsWith('ExponentPushToken'))
        .map(u => ({ to: u.pushToken, title, body, sound: 'default', priority: 'high' }));
    await sendPushMessages(messages);
};

// Broadcast push to all users
const sendBroadcastPush = async (title, body, data = {}) => {
    const users = await User.find({ pushToken: { $ne: null } }).select('pushToken');
    const messages = users
        .filter(u => u.pushToken?.startsWith('ExponentPushToken'))
        .map(u => ({ to: u.pushToken, title, body, sound: 'default', data }));
    await sendPushMessages(messages);
};

// Send push to specific tokens
const sendToTokens = async (tokens, title, body, data = {}) => {
    const messages = tokens
        .filter(t => t?.startsWith('ExponentPushToken'))
        .map(t => ({ to: t, title, body, sound: 'default', data }));
    await sendPushMessages(messages);
};

module.exports = { sendWardPush, sendBroadcastPush, sendToTokens };
