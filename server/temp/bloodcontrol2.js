const BloodReport = require('../models/bloodReport');

// Create a new blood report
const createBloodReport = async (userId, data, date) => {
    try {
        const bloodReport = new BloodReport({
            userId,
            reportDate: date,
            ...data
        });
        await bloodReport.save();
    } catch (error) {
        console.error("Error creating blood report:", error);
        throw error;
    }
};

// Get all blood reports
const getAllBloodReports = async (req, res) => {
    try {
        const bloodReports = await BloodReport.find();
        res.status(200).json(bloodReports);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a specific blood report by ID
const getBloodReportById = async (req, res) => {
    try {
        const bloodReport = await BloodReport.findById(req.params.id);
        if (!bloodReport) return res.status(404).json({ message: 'Blood report not found' });
        res.status(200).json(bloodReport);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all blood reports by userId
const getBloodReportsByUserId = async (userId) => {
    try {
        const bloodReports = await BloodReport.find({ userId: userId });
        return bloodReports
    } catch (error) {
        console.error("Error fetching reports by userId:", error);
		throw error;
    }
};

// Get specific report item for a userId
const getReportItemByUserId = async (req, res) => {
    const { userId, itemName } = req.params;
    try {
        const bloodReports = await BloodReport.find({ userId });
        const itemValues = bloodReports.map(report => ({
            date: report.date,
            value: report.reportDetails[itemName]
        }));
        if (!itemValues.length) return res.status(404).json({ message: 'Report item not found' });
        res.status(200).json(itemValues);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a blood report by ID
const updateBloodReport = async (req, res) => {
    try {
        const bloodReport = await BloodReport.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!bloodReport) return res.status(404).json({ message: 'Blood report not found' });
        res.status(200).json(bloodReport);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete a blood report by ID
const deleteBloodReport = async (req, res) => {
    try {
        const bloodReport = await BloodReport.findByIdAndDelete(req.params.id);
        if (!bloodReport) return res.status(404).json({ message: 'Blood report not found' });
        res.status(200).json({ message: 'Blood report deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createBloodReport,
    getAllBloodReports,
    getBloodReportById,
    getBloodReportsByUserId,
    getReportItemByUserId,
    updateBloodReport,
    deleteBloodReport
};
