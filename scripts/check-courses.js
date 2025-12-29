const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// Simple Schema definition to avoid importing the whole TS model
const CourseSchema = new mongoose.Schema({
    title: String,
    isPublished: Boolean
});

const Course = mongoose.model('Course', CourseSchema);

async function checkCourses() {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        const courses = await Course.find({});
        console.log(`Found ${courses.length} courses:`);
        courses.forEach(c => {
            console.log(`- ${c.title}: published=${c.isPublished}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkCourses();
