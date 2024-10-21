import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import "dotenv/config";
import * as path from "path";
import Conversation from "./models/Conversations.js";
import BigDbArray from "./models/BigDbArray.js";
import request from "request";
import replaceOnce from "replace-once";
import { find, replace } from "./findreplace.js";
import cors from "cors";
import jsdom from "jsdom";
import axios from "axios";
import { Server } from "socket.io";
import * as http from "http";
import timeout from "connect-timeout";

const __dirname = path.resolve(path.dirname(""));
const { JSDOM } = jsdom;

const app = express();
const PORT = 5000;

app.use(bodyParser.raw());

// MIDDLEWARES

app.use(cors());

app.use(timeout("100s"));

app.use(function (req, res, next) {
  req.rawBody = "";
  // req.setEncoding("utf8");

  req.on("data", function (chunk) {
    req.rawBody += chunk;
  });

  req.on("end", function () {
    next();
  });
});

//GET TOKEN

let token = "";

var options = {
  method: "GET",
  url: "https://botapi.gadu-gadu.pl/botmaster/getToken/70386605",
  headers: {
    Authorization: process.env.AUTH_TOKEN,
  },
};

/*
Status 22 - Niewidoczny z opisem
Status 24 - PoGGadam z opisem
test koment
*/

const getFreshToken = async () => {
  await request(options, function (error, response) {
    if (error) throw new Error(error);

    token = response.body.slice(57, 73);

    var statusOptions = {
      method: "POST",
      url: "https://botapi-31.gadu-gadu.pl/setStatus/70386605",
      headers: {
        Token: token,
        "Content-Type": "text/plain",
      },
      form: {
        status: "24",
        desc: "Chętnie pogadam o wszystkim :P",
      },
    };

    request(statusOptions, function (error, response) {});
  });
};

getFreshToken();

var interval = setInterval(getFreshToken, 3600000);

//WS SERVER

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://https://gg-api-app.github.io",
    methods: ["GET", "POST"],
  },
});

// io.on("connection", (socket) => {
//   console.log("a user connected");
//   socket.broadcast.emit("hi");
//   io.emit("chat message", "kurwa 123");
//   socket.on("disconnect", () => {
//     console.log("user disconnected");
//   });
// });

const getApiAndEmit = (socket) => {
  const response = new Date();
  // Emitting a new message. Will be consumed by the client
  socket.emit("FromAPI", response);
};

io.on("connection", (socket) => {
  console.log("New client connected", socket.id);
  socket.on("disconnect", () => {
    console.log("Client disconnected", socket.id);
  });
});

// CONVERSATIONS/GET
app.get("/conversations", async (req, res) => {
  const countQuery = await Conversation.count();
  const pageOptions = {
    page: parseInt(req.query.page, 10) || 0,
    limit: parseInt(req.query.limit, 10) || 10,
    sort_by: req.query.sort_by || "-date",
    increasing: req.query.increasing === "true" ? "" : "-",
  };
  try {
    const conversations = await Conversation.find()
      .sort(`${pageOptions.increasing}${pageOptions.sort_by}`)
      .skip(pageOptions.page * pageOptions.limit)
      .limit(pageOptions.limit);
    let cuttedConversations = [...conversations];
    for (let i = 0; i < cuttedConversations.length; i++) {
      cuttedConversations[i].conversation = [];
    }
    res.send({ conversations: cuttedConversations, count: countQuery });
  } catch (err) {
    console.log(err);
    res.json({ message: err });
  }
});

// REPLACEMENT

const photosArray = [
  "https://www.gg.pl/dysk/IykwAneqtGMQIikwAnejGYg/20220521_113234.jpg",
  "https://www.gg.pl/dysk/BtQoCl4CNNMQB9QoCl4LmTg/20220710_133327.jpg",
  "https://www.gg.pl/dysk/-Ex56_QS1KoQ-Ux56_QbeUE/20220710_164334.jpg",
  "https://www.gg.pl/dysk/EBnAhmYyZxwQERnAhmY7yvc/20220727_165311.jpg",
  "https://www.gg.pl/dysk/7_nGXEBwBl4Q7vnGXEB5q7U/20220727_1422141.jpg",
  "https://www.gg.pl/dysk/56Q2y9ByJv8Q5qQ2y9B7ixQ/20220813_182356.jpg",
  "https://www.gg.pl/dysk/Dl5V9A8y5OIQD15V9A87SQk/20220816_132154.jpg",
  "https://www.gg.pl/dysk/-x7BH3R5fgkQ-h7BH3Rw0-I/20220816_132230.jpg",
  "https://www.gg.pl/dysk/8IRpxQdI-zAQ8YRpxQdBVts/20220817_125837.jpg",
  "https://www.gg.pl/dysk/03alAHxLH1QQ0nalAHxCsr8/20220817_162121.jpg",
  "https://www.gg.pl/dysk/oVW4O6vVGooQoFW4O6vct2E/20220817_162653.jpg",
  "https://www.gg.pl/dysk/_WHbfdgXj2MQ_GHbfdgeIog/20220819_115635.jpg",
  "https://www.gg.pl/dysk/vcEQIS0EVUQQvMEQIS0N-K8/20220822_154323.jpg",
  "https://www.gg.pl/dysk/fVM5_lUmrmIQfFM5_lUvA4k/20220903_152143.jpg",
  "https://www.gg.pl/dysk/zDwHGeFRBwcQzTwHGeFYquw/20221013_172310.jpg",
  "https://www.gg.pl/dysk/e1m7qwMyRIIQelm7qwM76Wk/20221016_185643.jpg",
  "https://www.gg.pl/dysk/8PSH-G_y_dkQ8fSH-G_7UDI/20221123_204454.jpg",
  "https://www.gg.pl/dysk/mAW4UhVXe-MQmQW4UhVe1gg/20221126_152347.jpg",
  "https://www.gg.pl/dysk/wqZyhuBoGQcQw6ZyhuBhtOw/20221217_212632.jpg",
  "https://www.gg.pl/dysk/d5SYs9sYUvAQdpSYs9sR_xs/20221224_173410.jpg",
];

const validateMessage = (message) => {
  let lastThreeLetters = message.substr(message.length - 3);
  let lastFourLetters = message.substr(message.length - 4);
  if (
    lastThreeLetters === "jpg" ||
    lastThreeLetters === "JPG" ||
    lastThreeLetters === "mp4" ||
    lastThreeLetters === "MP4" ||
    lastThreeLetters === "png" ||
    lastThreeLetters === "PNG" ||
    lastFourLetters === "jpeg" ||
    lastFourLetters === "JPEG" ||
    lastFourLetters === "g=en" ||
    message ===
      "Nasz system podejrzewa, że nieznajomy chce Ci przesłać niecenzuralne zdjęcie. Jeżeli godzisz się na otrzymywanie takich treści, to dodaj go do listy swoich kontaktów i poproś o ponowne przesłanie tego pliku."
  ) {
    return photosArray[Math.floor(Math.random() * photosArray.length)];
  }
  return replaceOnce(message.toLowerCase(), find, replace);
};

// CONVERSATIONS/POST

const wordReplacement = {
  prefixesPairs: [],
  suffixesPairs: [
    { male: "łem", female: "łam" },
    { male: "łeś", female: "łaś" },
    { male: "ł", female: "ła" },
    { male: "ł", female: "ła" },
  ],
};

// kobitka, kobita, cycuszek, cycusie, minetka, ssać, lód, lodzik

// if (czescMowy[0].innerHTML.includes("rzeczownik")) {
//   console.log("rzeczownik");
// }

// console.log(await checkDictionary("kutasa"));

// console.log(checkDictionary("starszemu"), "Hier");

let bigArray = [];
let dbArray = [];

BigDbArray.countDocuments(async (err, count) => {
  if (count > 0) {
    dbArray = await BigDbArray.find({});
    bigArray = dbArray[0].dbArray;
  } else {
    console.log("nima, tworzę ;*");
    try {
      const savedDbArray = new BigDbArray({ dbArray: Array });
      savedDbArray.save({ dbArray: Array });
    } catch (err) {
      console.log(err);
    }
  }
});

app.post("/sendMessage/:number", async (req, res) => {
  res.send("");
  console.log(req.rawBody, req.params.number);
  res.send(`Send message: ${req.rawBody} to number: ${req.params.number}`);
  let messageOptions = {
    method: "POST",
    url: "https://botapi-31.gadu-gadu.pl/sendMessage/70386605",
    headers: {
      "User-Agent": "https://botapi-31.gadu-gadu.pl/sendMessage/70386605",
      "Content-Type": "application/x-www-form-urlencoded",
      Token: token,
    },
    form: {
      msg: req.rawBody,
      to: req.params.number,
    },
  };
  request(messageOptions);
  //PATCH DB
  const exactConversation = await Conversation.findOne({
    $or: [
      { personOne: [req.params.number] },
      { personTwo: [req.params.number] },
    ],
  }).exec();
  exactConversation.conversation.push({
    message: req.rawBody,
    messageValidated: "Brak walidacji",
    messageValidatedNew: "Brak walidacji",
    author:
      exactConversation.personOne === Number(req.params.number)
        ? exactConversation.personTwo
        : exactConversation.personOne,
  });
  exactConversation.date = Date.now();
  exactConversation.save(exactConversation);
  io.emit("FromAPI", "New message!");
});

app.post("/botgg77472c00.html", async (req, res) => {
  io.emit("FromAPI", "New message!");

  const personDetails = await axios.get(
    `http://ggludzie.vcx.pl/gg${req.query.from}.htm`
  );
  const domNumberDetails = new JSDOM(personDetails.data);
  const numberDetails = domNumberDetails.window.document
    .querySelectorAll("p")[1]
    .textContent.replaceAll(" ", "")
    .split("\n");

  // const validateMessageNew = async (message) => {
  //   const validatedMessageArray = [];
  //   const messageArray = message
  //     .replaceAll(/[,.'"-?!]/g, "")
  //     .toLowerCase()
  //     .split(" ");
  //   for (let i = 0; i < messageArray.length; i++) {
  //     validatedMessageArray.push(await checkDictionary(messageArray[i]));
  //   }
  //   return validatedMessageArray.join(" ");
  // };

  //CHECK IF DB HAS BIGARRAY test

  //CHECK IF NUMBER IS IN PAIR ARRAY
  const thisMessageFrom = Number(req.query.from);
  console.log(
    `GOT FROM: ${thisMessageFrom} MSG: ${req.rawBody}, ${req.query.from}`
  );
  const searchBigArrayResult = bigArray.map((smollArray) =>
    smollArray.findIndex((smollArrayItem) => smollArrayItem === thisMessageFrom)
  );
  //FIND ITS SMOLL ARRAY AND PAIR
  let bigArrayIndex = searchBigArrayResult.findIndex(
    (smollArrayResult) => smollArrayResult !== -1
  );
  if (
    bigArrayIndex >= 0 &&
    bigArray[bigArrayIndex] &&
    bigArray[bigArrayIndex].length > 1
  ) {
    const thisMessageFromPair = bigArray[bigArrayIndex].filter(
      (number) => number !== thisMessageFrom
    )[0];
    let messageOptions = {
      method: "POST",
      url: "https://botapi-31.gadu-gadu.pl/sendMessage/70386605",
      headers: {
        "User-Agent": "https://botapi-31.gadu-gadu.pl/sendMessage/70386605",
        "Content-Type": "application/x-www-form-urlencoded",
        Token: token,
      },
      form: {
        msg: validateMessage(req.rawBody),
        to: thisMessageFromPair,
      },
    };
    request(messageOptions);
    console.log(
      `SEND TO: ${thisMessageFromPair} MSG: ${replaceOnce(
        req.rawBody.toLowerCase(),
        find,
        replace
      )}`
    );

    //PATCH DATABASE
    const exactConversation = await Conversation.findOne({
      personOne: [thisMessageFrom, thisMessageFromPair],
    }).exec();
    exactConversation.conversation.push({
      message: req.rawBody,
      messageValidated: validateMessage(req.rawBody),
      // messageValidatedNew: await validateMessageNew(req.rawBody),
      author: thisMessageFrom,
    });
    exactConversation.date = Date.now();
    exactConversation.save(exactConversation);
    // console.log("Its pair is ", thisMessageFromPair);
  }
  //IF THIS NUMBER HAS NO PAIR

  if (
    bigArrayIndex === -1 ||
    (bigArray[bigArrayIndex] && bigArray[bigArrayIndex].length === 1)
  ) {
    // console.log(`Number ${thisMessageFrom} has no pair yet :(`);
    //PUSH TO EXISTING PAIR ARRY
    if (
      bigArray.length !== 0 &&
      bigArrayIndex === -1 &&
      Number(bigArray[bigArrayIndex]) !== thisMessageFrom &&
      bigArray[bigArray.length - 1].length === 1
    ) {
      let messageOptions = {
        method: "POST",
        url: "https://botapi-31.gadu-gadu.pl/sendMessage/70386605",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Token: token,
        },
        form: {
          msg: validateMessage(req.rawBody),
          to: bigArray[bigArray.length - 1][0],
        },
      };
      request(messageOptions);
      console.log(
        `SEND TO: ${bigArray[bigArray.length - 1][0]} MSG: ${replaceOnce(
          req.rawBody.toLowerCase(),
          find,
          replace
        )}`
      );
      console.log(`Its pair is ${bigArray[bigArray.length - 1][0]}`);
      bigArray[bigArray.length - 1].push(thisMessageFrom);
      const dbArray = await BigDbArray.findOne();
      dbArray.dbArray = bigArray;
      await dbArray.save();

      //PATCH DATABASE
      const exactConversation =
        (await Conversation.findOne({
          personOne: bigArray[bigArray.length - 1][0],
        }).exec()) || 1;
      exactConversation.personTwo = thisMessageFrom || 1;
      exactConversation.personTwoDetails = numberDetails;
      await exactConversation.conversation.push({
        message: req.rawBody,
        messageValidated: validateMessage(req.rawBody),
        // messageValidatedNew: await validateMessageNew(req.rawBody),
        author: thisMessageFrom,
      });
      exactConversation.date = Date.now();
      exactConversation.save(exactConversation);

      return;
    }
    //CREATE NEW CONVERSATION SMOLL ARRAY
    if (
      bigArray.length === 0 ||
      (bigArrayIndex === -1 && bigArray[bigArray.length - 1].length !== 1)
    ) {
      bigArray.push([thisMessageFrom]);
      const dbArray = await BigDbArray.findOne();
      dbArray.dbArray = bigArray;
      await dbArray.save();

      //POST NEW CONVERSATION TO DB

      const conversation = await new Conversation({
        personOne: thisMessageFrom || 1,
        personOneDetails: numberDetails,
        personTwo: 0,
        personTwoDetails: [],
        conversation: [
          {
            message: req.rawBody,
            messageValidated: validateMessage(req.rawBody),
            // messageValidatedNew: await validateMessageNew(req.rawBody),
            author: thisMessageFrom,
          },
        ],
      });
      try {
        const savedConversation = await conversation.save();
      } catch (err) {
        console.log(err);
      }
    }
    res.send("");
    // const lastBigArrayEl = bigArray[bigArray.length - 1];
  }
});

// GET TO FRONT-END

app.get("/conversations", async (req, res) => {
  try {
    // const conversation = await Conversation.find();
    // console.log(conversation);
    // let cuttedConversation = conversation.map((conversation) => {
    //   delete conversation.conversation;
    // });
    res.json([]);
  } catch (err) {
    console.log(err);
    res.json({ message: err });
  }
});

// GET EXACT TO FRONT-END

app.get("/conversations/:conversationId", async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);
    res.json(conversation);
  } catch (err) {
    console.log(err);
    res.json({ message: err });
  }
});

// GET/VERIFICATION

app.get("/botgg77472c00.html", (req, res) => {
  res.sendFile(path.join(__dirname + "/verification/botgg77472c00.html"));
});

//DB CONNECT



try {
  mongoose.connect(
    process.env.MONGODB_URI,
    { useNewUrlParser: true, useUnifiedTopology: true },
    () => console.log("Mongoose is connected")
  );
} catch (e) {
  console.log("Could not connect to Mongoose");
}

server.listen(process.env.PORT || PORT, () =>
  console.log(`Server running on port: http://localhost:${PORT}`)
);

