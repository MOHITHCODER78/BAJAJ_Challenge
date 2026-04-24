const express = require('express');
const cors = require('cors');
const { processHierarchies } = require('./utils/treeProcessor');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Identity Fields
const USER_INFO = {
    user_id: "mohitnaidu_24042026",
    email_id: "mohit.naidu@college.edu",
    college_roll_number: "21CS1001"
};

/**
 * POST /bfhl
 * Processes hierarchical relationships from node strings.
 */
app.post('/bfhl', (req, res) => {
    try {
        const { data } = req.body;

        if (!data || !Array.isArray(data)) {
            return res.status(400).json({
                is_success: false,
                message: "Invalid input. 'data' must be an array of strings."
            });
        }

        const result = processHierarchies(data);

        const response = {
            ...USER_INFO,
            ...result
        };

        res.status(200).json(response);
    } catch (error) {
        console.error("Error processing request:", error);
        res.status(500).json({
            is_success: false,
            message: "Internal server error"
        });
    }
});

/**
 * GET /bfhl (Optional but good practice)
 */
app.get('/bfhl', (req, res) => {
    res.status(200).json({
        operation_code: 1
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
