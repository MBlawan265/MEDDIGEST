import mongoose from 'mongoose';

const InstitutionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
}, { timestamps: true });

export default mongoose.models.Institution || mongoose.model('Institution', InstitutionSchema);
