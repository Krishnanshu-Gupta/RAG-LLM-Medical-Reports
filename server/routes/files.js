const router = require("express").Router();
const { File, validateFile } = require("../models/file");
const multer = require("multer");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const AWS = require('aws-sdk');
const { getFilesByUserId } = require('../controllers/fileRetrieval');

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const s3 = new AWS.S3();
const comprehendMedical = new AWS.ComprehendMedical();

// Set up Multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 15 * 1024 * 1024
    }
});

router.get('/:token', async (req, res) => {
    console.log("in get")
    const decoded = jwt.verify(req.params.token, process.env.JWTPRIVATEKEY);
    const userId = decoded._id;
    try {
        const files = await File.find({ userId: userId });
        res.json(files);
    } catch (error) {
        res.status(500).json({ message: "Error fetching files" });
    }
});

const processChunksParallel = async (text) => {
    const chunkSize = 20000;
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
    const maxRetries = 5;

    const processChunk = async (chunk, retryCount = 0) => {
        try {
            const comprehendParams = { Text: chunk };
            return await comprehendMedical.detectEntitiesV2(comprehendParams).promise();
        } catch (error) {
            if (error.code === 'TooManyRequestsException' && retryCount < maxRetries) {
                await delay(2 ** retryCount * 1000); // Exponential backoff
                return processChunk(chunk, retryCount + 1);
            } else {
                throw error;
            }
        }
    };

    const promises = [];
    for (let position = 0; position < text.length; position += chunkSize) {
        const chunk = text.substring(position, position + chunkSize);
        promises.push(processChunk(chunk));
    }

    const results = await Promise.all(promises);
    let allEntities = [];
    for (const result of results) {
        const filteredEntities = result.Entities.filter(entity => entity.Category !== 'PROTECTED_HEALTH_INFORMATION');
        allEntities = allEntities.concat(filteredEntities);
    }
    return allEntities;
};

// File upload route
router.post("/", upload.single("file"), async (req, res) => {
    try {
        // Validate file data
        console.log("in post")
        const data = {
            token: req.headers['authorization'],
            fileName: req.file.originalname,
            filePath: req.file.buffer,
            description: req.body.description
        }
        const { error } = validateData(data);
        if (error) return res.status(400).send({ message: error.details[0].message });

        const decoded = jwt.verify(data.token, process.env.JWTPRIVATEKEY);
        const userId = decoded._id;
        const params = {
            Bucket: 'medical-reports-1',
            Key: req.file.originalname,
            Body: req.file.buffer
        };

        s3.upload(params, async (err, data) => {
            if(err){
                console.error(err);
                return res.status(500).send({ message: "S3 Upload Error"})
            }
            const file = new File({
                userId: userId,
                fileName: req.file.originalname,
                filePath: data.Location,
                description: req.body.description
            });
            await file.save();
            //res.status(201).send({ message: "File uploaded successfully!" });

            const text = req.file.buffer.toString('utf-8');
            const medicalInfo = await processChunksParallel(text);
            file.entities = medicalInfo;
            console.log(medicalInfo)
            res.status(201).send({ message: "File uploaded successfully!", medicalInfo });
        })
    }
    catch (error) {
        console.error(error);
        res.status(500).send({ message: "Internal Server Error" });
    }
});

const validateData = (data) => {
    const dataSchema = Joi.object({
        token: Joi.string().required(),
        fileName: Joi.string().required(),
        filePath: Joi.binary().required(),
        description: Joi.string().allow('').optional()
    });
    return dataSchema.validate(data);
}

module.exports = router;
