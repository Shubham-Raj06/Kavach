const axios = require('axios');
const logger = require('../utils/logger');

// ML Service URL from environment variables
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

class MLService {
    /**
     * Fetch risk prediction for a specific ward from the ML service
     * @param {string} wardId - The ID of the ward (e.g., 'W-101')
     * @returns {Promise<Object>} - The prediction data
     */
    async getRiskPrediction(wardId) {
        try {
            // Construct the URL similar to how the ML service expects it
            // Assumes ML service has an endpoint like /predict or /risk/{wardId}
            // Adjust path based on actual ML service implementation
            const response = await axios.get(`${ML_SERVICE_URL}/predict/ward/${wardId}`);

            return response.data;
        } catch (error) {
            logger.error(`Error fetching prediction for ward ${wardId}:`, error.message);

            // Return null or throw depending on how you want to handle it
            // Returning null allows the controller to decide (e.g., serve cached data)
            return null;
        }
    }

    /**
     * Fetch predictions for multiple wards
     * @param {Array<string>} wardIds - List of ward IDs
     * @returns {Promise<Object>} - Map of wardId to prediction
     */
    async getBatchPredictions(wardIds) {
        try {
            const response = await axios.post(`${ML_SERVICE_URL}/predict/batch`, { wardIds });
            return response.data;
        } catch (error) {
            logger.error('Error fetching batch predictions:', error.message);
            return {};
        }
    }
}

module.exports = new MLService();
