const router = require("express").Router();
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require('uuid');
const {createBloodReport, getAllBloodReports, getBloodReportById,
    getBloodReportsByUserId, getReportItemByUserId, updateBloodReport} = require('../controllers/bloodReportController');


router.get("/report/:token", async (req, res) => {
    const {token} = req.params;
    try {
        const decoded = jwt.verify(token, process.env.JWTPRIVATEKEY);
		const userId = decoded._id;
        const report = await getBloodReportsByUserId(userId);
        console.log(report)
        res.json(report);
    } catch (error) {
        console.error('Error getting blood reports for user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get("/report/:token/:item", async(req, res) => {
    const {token, item} = req.params;
    try {
        const decoded = jwt.verify(token, process.env.JWTPRIVATEKEY);
		const userId = decoded._id;
        const report = await getBloodReportById(userId, item);
        res.json(report);
    } catch (error) {
        console.error('Error getting blood reports for user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});



const generateHealthIndex = (i) => {
    if (i < 2) {
        return -0.5 + (i * 0.25); // Unhealthy range
    } else if (i < 7) {
        return (i - 2) * 0.2; // Moving to healthy range
    } else {
        return 1.2 - ((i - 7) * 0.4); // Moving back to unhealthy range
    }
};

const generateReportDetails = (healthIndex, referenceRanges) => {
    return {
        hemoglobin: {
            result: 13 + (healthIndex * 4),
            unit: "g/dL",
            referenceRange: referenceRanges.hemoglobin
        },
        whiteBloodCells: {
            result: 11 - (healthIndex * 4),
            unit: "thousand cells/mcL",
            referenceRange: referenceRanges.whiteBloodCells
        },
        platelets: {
            result: 150 + (healthIndex * 200),
            unit: "thousand/mcL",
            referenceRange: referenceRanges.platelets
        },
        redBloodCells: {
            result: 4 + (healthIndex * 2),
            unit: "million cells/mcL",
            referenceRange: referenceRanges.redBloodCells
        },
        hematocrit: {
            result: 38 + (healthIndex * 8),
            unit: "%",
            referenceRange: referenceRanges.hematocrit
        },
        meanCorpuscularVolume: {
            result: 80 + (healthIndex * 10),
            unit: "fL",
            referenceRange: referenceRanges.meanCorpuscularVolume
        },
        meanCorpuscularHemoglobin: {
            result: 27 + (healthIndex * 4),
            unit: "pg",
            referenceRange: referenceRanges.meanCorpuscularHemoglobin
        },
        meanCorpuscularHemoglobinConcentration: {
            result: 32 + (healthIndex * 2),
            unit: "g/dL",
            referenceRange: referenceRanges.meanCorpuscularHemoglobinConcentration
        },
        redCellDistributionWidth: {
            result: 11.5 + (healthIndex * 2.5),
            unit: "%",
            referenceRange: referenceRanges.redCellDistributionWidth
        }
    };
};

router.post('/generate', async (req, res) => {
    const {token} = req.body;
    try {
        const decoded = jwt.verify(token, process.env.JWTPRIVATEKEY);
		const userId = decoded._id;

        const referenceRanges = {
            hemoglobin: { min: 13.8, max: 17.2 },
            whiteBloodCells: { min: 4.5, max: 11.0 },
            platelets: { min: 150, max: 450 },
            redBloodCells: { min: 4.7, max: 6.1 },
            hematocrit: { min: 40, max: 52 },
            meanCorpuscularVolume: { min: 80, max: 100 },
            meanCorpuscularHemoglobin: { min: 27, max: 31 },
            meanCorpuscularHemoglobinConcentration: { min: 32, max: 36 },
            redCellDistributionWidth: { min: 11.5, max: 14.5 }
        };

        for (let i = 0; i < 10; i++) {
            const healthIndex = generateHealthIndex(i);
            const date = new Date();
            date.setFullYear(date.getFullYear() - (10 - i));

            await createBloodReport(userId, generateReportDetails(healthIndex, referenceRanges), date);
        }

        res.status(200).json({ message: 'Synthetic blood reports created successfully' });
    } catch (error) {
        console.error('Error creating blood reports:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});



module.exports = router;
