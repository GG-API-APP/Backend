import express from "express";

const router = express.Router();
import Conversation from "../models/Conversations.js";
import utf8 from "utf8";

// CONVERSATIONS/GET
router.get("/", async (req, res) => {
  try {
    const conversations = await Conversation.find();
    res.json(conversations);
  } catch (err) {
    console.log(err);
    res.json({ message: err });
  }
});

// CONVERSATIONS/POST
router.post("/", async (req, res) => {
  console.log(req.query.from, req.query.to, utf8.encode(req.body));
  const post = new Conversation({
    from: req.query.from,
    to: req.query.to,
    message: utf8.encode(req.body),
  });
  try {
    const savedConversation = await post.save();
    res.json("To jest wiadomosc" + savedConversation.message);
  } catch (err) {
    console.log(err);
    res.json({ message: err });
  }
});

// CONVERSATIONS/GET (SPECIFIC CONVERSATION)
router.get("/:postId", async (req, res) => {
  console.log(req.body);
  try {
    const conversation = await Conversation.findById(req.params.postId);
    res.json(conversation);
  } catch (err) {
    console.log(err);
    res.json({ message: err });
  }
});

// CONVERSATIONS/DELETE (SPECIFIC CONVERSATION)
router.delete("/:postId", async (req, res) => {
  try {
    const removedConversation = await Conversation.deleteOne({
      _id: req.params.postId,
    });
    res.json(removedConversation);
  } catch (err) {
    console.log(err);
    res.json({ message: err });
  }
});

//CONVERSATIONS/PATCH (SPECIFIC CONVERSATION)
router.patch("/:postId", async (req, res) => {
  try {
    const updatedConversation = await Conversation.updateOne(
      { _id: req.params.postId },
      {
        $set: { task: req.body.task },
      }
    );
    res.json(updatedConversation);
  } catch (err) {
    console.log(err);
    res.json({ message: err });
  }
});

export default router;
