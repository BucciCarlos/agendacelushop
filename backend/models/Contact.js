import mongoose from 'mongoose';

const PhoneSchema = new mongoose.Schema({
  type: { type: String, enum: ['personal', 'family'], default: 'personal' },
  number: { type: String },
  relativeName: { type: String, default: '' },
}, { _id: false }); // Do not create _id for subdocuments

const SaleSchema = new mongoose.Schema({
  saleNumber: { type: String },
  date: { type: String }, // Storing as String for now to match current db.json structure
}, { _id: false }); // Do not create _id for subdocuments

const ContactSchema = new mongoose.Schema({
  // The original `id` field (uuidv4) from db.json will implicitly map to Mongoose's `_id` (ObjectId)
  // If the frontend needs the string uuid, we might add a virtual or a separate field later.
  // For now, we assume _id is sufficient.
  name: { type: String, required: true },
  lastname: { type: String, required: true },
  dni: { type: String, default: '' },
  phones: [PhoneSchema],
  sales: [SaleSchema],
  comments: { type: String, default: '' },
  date: { type: Date, default: Date.now }, // Convert to Date type
});

export default mongoose.models.Contact || mongoose.model('Contact', ContactSchema);
