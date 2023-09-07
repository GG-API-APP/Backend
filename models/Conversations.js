import mongoose from "mongoose";
const { Model, Schema } = mongoose;

const ConversationsSchema = new Schema({
  personOne: Number,
  personTwo: Number,
  personOneDetails: Array,
  personTwoDetails: Array,
  conversation: [
    {
      message: String,
      messageValidated: String,
      messageValidatedNew: String,
      author: Number,
      date: { type: Date, default: Date.now },
    },
  ],
  date: { type: Date, default: Date.now },
});

export default mongoose.model("Conversation", ConversationsSchema);
