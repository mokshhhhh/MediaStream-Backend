import { Router } from "express";
import { createTweet, getTweets, editTweets, deleteTweets } from "../controllers/tweet.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT); //applying JWT to all tokens here 

router.route("/").post(createTweet);
router.route("/user/:userId").get(getTweets);
router.route("/:tweetId").patch(editTweets).delete(deleteTweets);

export default router     