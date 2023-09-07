import mongoose from "mongoose";
const { Model, Schema } = mongoose;

const BigDbArraySchema = new Schema({ dbArray: Array });

export default mongoose.model("BigDbArray", BigDbArraySchema);
