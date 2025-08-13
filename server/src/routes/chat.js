const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const chat = require("../controllers/chatController");

router.use(auth);

router.get("/", chat.listChats);
router.get("/:chatId", chat.getChat);
router.get("/:chatId/messages", chat.getMessages);
router.post("/direct", chat.createDirect);
router.post("/with-user", chat.createWithUser);
router.post("/support", chat.createSupport);
router.post("/create-or-get", chat.createOrGet);
router.post("/:chatId/messages", chat.sendMessage);
router.post("/:chatId/read", chat.markRead);

module.exports = router;
